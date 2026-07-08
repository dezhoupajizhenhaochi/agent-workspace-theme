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
  apiKey?: string;
};

const envEndpoint = import.meta.env.VITE_AGENT_API_URL?.trim() || '';
const envApiKey = import.meta.env.VITE_AGENT_API_KEY?.trim() || '';

export function getAgentApiStatus(config?: AgentApiConfig): AgentApiStatus {
  const endpoint = config?.endpoint?.trim() || envEndpoint;
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
  const content =
    data.content ??
    data.answer ??
    data.output ??
    data.text ??
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
  const endpoint = config?.endpoint?.trim() || envEndpoint;
  const apiKey = config?.apiKey?.trim() || envApiKey;

  if (!endpoint) {
    throw new Error('Agent API URL is not configured');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(request),
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
