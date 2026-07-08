export type AgentApiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type AgentApiRequest = {
  input: string;
  conversationId?: string;
  model: string;
  temperature: number;
  messages: AgentApiMessage[];
  context?: {
    enabledSkills?: string[];
    enabledMcpServers?: string[];
    files?: Array<{ id: string; name: string; kind: string; size: string }>;
  };
};

export type AgentApiResponse = {
  conversationId?: string;
  content: string;
  citations?: Array<{ key: string; title: string; url: string }>;
  artifact?: {
    title: string;
    content: string;
    mimeType?: string;
  };
};

export type AgentApiStatus = {
  mode: 'api' | 'mock';
  endpoint: string;
  configured: boolean;
};

export type AgentApiConfig = {
  endpoint?: string;
  baseUrl?: string;
  apiKey?: string;
};

const envBaseUrl = import.meta.env.VITE_AGENT_API_BASE_URL?.trim() || '';
const envEndpoint = import.meta.env.VITE_AGENT_API_URL?.trim() || '';
const envApiKey = import.meta.env.VITE_AGENT_API_KEY?.trim() || '';

function joinApiUrl(baseUrl: string, path: string) {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const nextPath = path.replace(/^\/+/, '');
  return base ? `${base}/${nextPath}` : '';
}

function resolveEndpoint(config?: AgentApiConfig) {
  return config?.endpoint?.trim() || envEndpoint || joinApiUrl(config?.baseUrl || envBaseUrl, 'agent/chat');
}

export function getAgentApiStatus(config?: AgentApiConfig): AgentApiStatus {
  const endpoint = resolveEndpoint(config);
  return {
    mode: endpoint ? 'api' : 'mock',
    endpoint,
    configured: Boolean(endpoint),
  };
}

export const agentApiStatus: AgentApiStatus = getAgentApiStatus();

function normalizeContent(payload: unknown): AgentApiResponse {
  if (!payload || typeof payload !== 'object') {
    return { content: String(payload ?? '') };
  }

  const data = payload as Record<string, unknown>;
  const choices = Array.isArray(data.choices) ? (data.choices as Array<Record<string, unknown>>) : [];
  const firstChoice = choices[0];
  const choiceMessage =
    firstChoice && typeof firstChoice.message === 'object' && firstChoice.message
      ? (firstChoice.message as Record<string, unknown>)
      : undefined;
  const choiceDelta =
    firstChoice && typeof firstChoice.delta === 'object' && firstChoice.delta
      ? (firstChoice.delta as Record<string, unknown>)
      : undefined;
  const content =
    data.content ??
    data.answer ??
    data.output ??
    data.text ??
    choiceMessage?.content ??
    choiceDelta?.content ??
    (typeof data.message === 'object' && data.message ? (data.message as Record<string, unknown>).content : undefined);

  return {
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : undefined,
    content: typeof content === 'string' ? content : JSON.stringify(payload, null, 2),
    citations: Array.isArray(data.citations) ? (data.citations as AgentApiResponse['citations']) : undefined,
    artifact: typeof data.artifact === 'object' && data.artifact ? (data.artifact as AgentApiResponse['artifact']) : undefined,
  };
}

export async function sendAgentMessage(
  request: AgentApiRequest,
  signal?: AbortSignal,
  config?: AgentApiConfig,
): Promise<AgentApiResponse> {
  const endpoint = resolveEndpoint(config);
  const apiKey = config?.apiKey?.trim() || envApiKey;

  if (!endpoint) {
    throw new Error('Agent API URL is not configured');
  }

  const isChatCompletions = /\/chat\/completions\/?$/i.test(new URL(endpoint, window.location.origin).pathname);
  const body = isChatCompletions
    ? {
        model: request.model,
        messages: request.messages.map((message) => ({ role: message.role, content: message.content })),
        temperature: request.temperature,
      }
    : request;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Agent API ${response.status}: ${detail || response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return normalizeContent(await response.json());
  }

  return { content: await response.text() };
}
