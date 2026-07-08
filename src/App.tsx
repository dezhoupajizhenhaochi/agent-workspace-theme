import {
  Actions,
  ArtifactCard,
  Avatar,
  Bubble,
  BubbleList,
  Button,
  ChatInput,
  ChatInputAction,
  Citation,
  Dropdown,
  DropdownItem,
  Empty,
  Input,
  Markdown,
  Modal,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Switch,
  TabPane,
  Tabs,
  Tag,
  Thinking,
  ThoughtChain,
  ThoughtChainItem,
} from '@ve-design/react';
import {
  IconAdd,
  IconBell,
  IconCheck,
  IconClose,
  IconCode,
  IconCopy,
  IconDatabase,
  IconDislike,
  IconDocument,
  IconDownload,
  IconFile,
  IconFilter,
  IconFolder,
  IconGlobe,
  IconGrid,
  IconHome,
  IconKey,
  IconLike,
  IconList,
  IconLogOut,
  IconMessage,
  IconMessageCirclePlus,
  IconMicrophone,
  IconMoreHorizontal,
  IconPreview,
  IconRefresh,
  IconRobot,
  IconSearch,
  IconSettings,
  IconHelp,
  IconShare,
  IconSkill,
  IconSun,
  IconThumbDownFilled,
  IconThumbUpFilled,
  IconTypeCodeStateDefault,
  IconTypeImageStateDefault,
  IconTypeVideoStateDefault,
  IconTypeWordStateDefault,
  IconUpload,
  IconUser,
} from '@ve-design/react/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import gallery09 from './assets/gallery/gallery-09.jpg';
import gallery10 from './assets/gallery/gallery-10.jpg';
import gallery11 from './assets/gallery/gallery-11.jpg';
import gallery12 from './assets/gallery/gallery-12.jpg';
import animateLogo from './assets/capability-logos/animate.png';
import browserMcpLogo from './assets/capability-logos/browser-mcp.png';
import dataAgentLogo from './assets/capability-logos/data-agent.png';
import designAuditLogo from './assets/capability-logos/design-audit.png';
import docWriterLogo from './assets/capability-logos/doc-writer.png';
import playwrightRunnerLogo from './assets/capability-logos/playwright-runner.png';
import presentationLogo from './assets/capability-logos/presentation.png';
import researchLogo from './assets/capability-logos/research.png';
import reviewAgentLogo from './assets/capability-logos/review-agent.png';
import workspaceFilesLogo from './assets/capability-logos/workspace-files.png';
import vedesignLogo from './assets/vedesign-logo.svg';
import { agentApiStatus, getAgentApiStatus, sendAgentMessage } from './agentApi';
import type { AgentApiStatus } from './agentApi';

type IconComponent = React.ComponentType<{ size?: number | string; className?: string }>;
type Page = 'welcome' | 'chat' | 'skills' | 'mcp' | 'files' | 'settings';
type NavPage = Page | 'search';
type CapabilityType = 'skill' | 'mcp' | 'template';
type ChatStatus = 'idle' | 'generating' | 'complete' | 'cancelled';
type ArtifactView = 'code' | 'preview';

type AgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'complete' | 'generating' | 'cancelled';
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AgentMessage[];
  archived?: boolean;
};

type CapabilityItem = {
  id: string;
  name: string;
  description: string;
  type: CapabilityType;
  installed: boolean;
  enabled: boolean;
  tags: string[];
  icon: IconComponent;
  logo?: string;
};

type FileItem = {
  id: string;
  name: string;
  kind: 'image' | 'document' | 'code' | 'video';
  updatedAt: string;
  size: string;
  status: 'ready' | 'uploading' | 'error';
  icon: IconComponent;
  mimeType?: string;
};

type McpServer = {
  id: string;
  name: string;
  description: string;
  category: 'all' | 'web' | 'file' | 'data' | 'workspace';
  enabled: boolean;
  trusted: boolean;
  updatedAt: string;
  icon: IconComponent;
};

type ConnectorItem = {
  id: string;
  name: string;
  description: string;
  icon: IconComponent;
};

type AgentSettings = {
  model: string;
  temperature: string;
  apiBaseUrl: string;
  apiChatUrl: string;
  apiStreamUrl: string;
  apiKey: string;
  preferStreaming: boolean;
  memory: boolean;
  approval: boolean;
  notifications: boolean;
  theme: 'light' | 'dark';
  themeConfig: ThemeConfig;
};

type ThemeConfig = {
  primaryHex: string;
  lightness: number;
  chroma: number;
  hue: number;
};

type OklchColor = {
  L: number;
  C: number;
  H: number;
};

type ShimmerStop = {
  offset: string;
  color: string;
};

type ShimmerController = {
  play: () => void;
  stop: () => void;
  destroy: () => void;
  setGradient?: (stops: ShimmerStop[]) => void;
};

declare global {
  interface Window {
    initShimmerBorder?: (
      host: Element | string,
      options?: {
        radius?: number;
        strokeWidth?: number;
        colorRatio?: number;
        duration?: number;
        loops?: number;
        gradient?: ShimmerStop[];
        trigger?: 'mount' | 'manual';
      },
    ) => ShimmerController | null;
    __veMotionShimmerPromise?: Promise<void>;
  }
}

const veMotionShimmerCssUrl = 'https://cdn-tos-cn.bytedance.net/obj/archi/vedesign/motion/shimmer-border.css';
const veMotionShimmerJsUrl = 'https://cdn-tos-cn.bytedance.net/obj/archi/vedesign/motion/shimmer-border.js';

const paletteSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const primaryLightnessTemplate = [0.979, 0.953, 0.9, 0.826, 0.738, 0.65, 0.58, 0.484, 0.377, 0.269, 0.174];
const primaryChromaRatio = [0.17, 0.27, 0.37, 0.47, 0.85, 0.95, 1, 0.95, 0.85, 0.7, 0.55];
const grayLightnessTemplate = [0.975, 0.96, 0.912, 0.85, 0.777, 0.692, 0.598, 0.495, 0.384, 0.265, 0.174];
const defaultThemeConfig: ThemeConfig = {
  primaryHex: '#518a5b',
  lightness: 0.58,
  chroma: 0.0927,
  hue: 148.7,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const gammaToLinear = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
const linearToGamma = (value: number) => (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055);

function linearRgbToOklab(r: number, g: number, b: number) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  return {
    L: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.782771766 * mRoot - 0.808675766 * sRoot,
  };
}

function hexToOklch(hex: string): OklchColor | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(normalized)) return null;
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const r = gammaToLinear(parseInt(full.slice(0, 2), 16) / 255);
  const g = gammaToLinear(parseInt(full.slice(2, 4), 16) / 255);
  const b = gammaToLinear(parseInt(full.slice(4, 6), 16) / 255);
  const lab = linearRgbToOklab(r, g, b);
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let H = Math.atan2(lab.b, lab.a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L: lab.L, C, H };
}

function oklchToLinearRgb(color: OklchColor) {
  const hRad = color.H * Math.PI / 180;
  const a = color.C * Math.cos(hRad);
  const b = color.C * Math.sin(hRad);
  const lRoot = color.L + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = color.L - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = color.L - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function oklchToHex(color: OklchColor) {
  const rgb = oklchToLinearRgb(color);
  const toHex = (value: number) =>
    Math.round(clamp(linearToGamma(clamp(value, 0, 1)), 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function formatOklch(color: OklchColor) {
  return `oklch(${color.L.toFixed(3)} ${color.C.toFixed(4)} ${color.H.toFixed(1)})`;
}

function ensureVeMotionShimmer() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.initShimmerBorder) return Promise.resolve();
  if (window.__veMotionShimmerPromise) return window.__veMotionShimmerPromise;

  window.__veMotionShimmerPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector('link[data-ve-motion-shimmer]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = veMotionShimmerCssUrl;
      link.setAttribute('data-ve-motion-shimmer', '');
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-ve-motion-shimmer]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('ve-motion shimmer failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = veMotionShimmerJsUrl;
    script.async = true;
    script.setAttribute('data-ve-motion-shimmer', '');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('ve-motion shimmer failed to load'));
    document.head.appendChild(script);
  });

  return window.__veMotionShimmerPromise;
}

function getCssToken(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function getComposerShimmerGradient(): ShimmerStop[] {
  return [
    { offset: '0%', color: getCssToken('--color-yellow-300', '#d7d94f') },
    { offset: '34%', color: getCssToken('--color-moss-400', '#a9c85a') },
    { offset: '68%', color: getCssToken('--color-green-400', '#6dbb68') },
    { offset: '100%', color: getCssToken('--color-yellow-300', '#d7d94f') },
  ];
}

function themeConfigToOklch(config: ThemeConfig): OklchColor {
  return { L: config.lightness, C: config.chroma, H: config.hue };
}

function buildPrimaryPalette(config: ThemeConfig) {
  return paletteSteps.map((step, index) => ({
    step,
    color: {
      L: clamp(primaryLightnessTemplate[index] + (config.lightness - 0.58), 0.06, 0.985),
      C: clamp(config.chroma * primaryChromaRatio[index], 0, 0.32),
      H: config.hue,
    },
  }));
}

function buildGrayPalette(config: ThemeConfig) {
  return paletteSteps.map((step, index) => {
    const u = index / (paletteSteps.length - 1);
    return {
      step,
      color: {
        L: grayLightnessTemplate[index],
        C: clamp(0.002 + Math.sin(Math.PI * u) * Math.min(config.chroma * 0.05, 0.008), 0, 0.018),
        H: config.hue,
      },
    };
  });
}

function applyThemeConfig(config: ThemeConfig) {
  const root = document.documentElement;
  const primary = buildPrimaryPalette(config);
  const gray = buildGrayPalette(config);
  primary.forEach(({ step, color }, index) => {
    root.style.setProperty(`--color-primary-${step}`, formatOklch(color));
    const darkColor = primary[primary.length - 1 - index].color;
    root.style.setProperty(`--color-primary-dark-${step}`, formatOklch({ ...darkColor, C: darkColor.C * 0.85 }));
  });
  gray.forEach(({ step, color }, index) => {
    root.style.setProperty(`--color-gray-${step}`, formatOklch(color));
    const darkColor = gray[gray.length - 1 - index].color;
    root.style.setProperty(`--color-gray-dark-${step}`, formatOklch({ ...darkColor, C: darkColor.C * 0.85 }));
  });
}

const navItems: Array<{ page: NavPage; label: string; icon: IconComponent }> = [
  { page: 'welcome', label: '新对话', icon: IconHome },
  { page: 'search', label: '搜索', icon: IconSearch },
  { page: 'skills', label: '发现', icon: IconSkill },
  { page: 'files', label: '文件库', icon: IconFolder },
];

const promptChips = [
  'AI 办公',
  '生成 PPT',
  '创建网页',
  '生成视频',
  '灵感图片',
  '行业研究',
  '分析上传文件',
  '创建数据看板',
];

type SearchGroup = {
  title: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    icon: IconComponent;
    onOpen: () => void;
  }>;
};

const galleryCards = [
  {
    id: 'ops',
    title: '搭建运营周报助手',
    prompt: '帮我搭建一个能汇总数据、生成周报并提示风险的运营助手。',
    image: gallery09,
  },
  {
    id: 'knowledge',
    title: '创建知识库问答流',
    prompt: '帮我创建一个知识库问答 Agent，支持引用来源并回答常见问题。',
    image: gallery10,
  },
  {
    id: 'review',
    title: '审查上线检查清单',
    prompt: '请帮我审查上线检查清单，找出缺少负责人和高风险项。',
    image: gallery11,
  },
  {
    id: 'builder',
    title: '生成任务自动化方案',
    prompt: '帮我设计一个从需求收集到交付提醒的自动化任务流。',
    image: gallery12,
  },
];

const initialMessages: AgentMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: '帮我规划一个通用 Agent 工作台，需要欢迎页、对话、Skill 管理和设置。',
    status: 'complete',
    createdAt: '10:24',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      '我会把它拆成四个稳定区域：入口欢迎页负责启动任务，对话页承载推理与产物，Skill 管理页维护能力启停，设置页处理模型、权限和通知策略。',
    status: 'complete',
    createdAt: '10:25',
  },
];

const initialConversations: Conversation[] = [
  {
    id: 'conversation-default',
    title: '通用 Agent 工作台设计',
    updatedAt: '2026-07-08 10:25',
    messages: initialMessages,
  },
  {
    id: 'conversation-review',
    title: '整理市场活动复盘',
    updatedAt: '2026-07-08 09:40',
    messages: [
      {
        id: 'review-user',
        role: 'user',
        content: '帮我整理市场活动复盘，输出结论、风险和下一步。',
        status: 'complete',
        createdAt: '09:38',
      },
      {
        id: 'review-assistant',
        role: 'assistant',
        content: '已整理为三部分：活动结果、关键风险和后续行动。你可以继续上传数据表，我会补充指标分析。',
        status: 'complete',
        createdAt: '09:40',
      },
    ],
  },
  {
    id: 'conversation-meeting',
    title: '生成周会结论摘要',
    updatedAt: '2026-07-07 18:20',
    messages: [
      {
        id: 'meeting-user',
        role: 'user',
        content: '把这周项目会内容整理成摘要。',
        status: 'complete',
        createdAt: '18:18',
      },
      {
        id: 'meeting-assistant',
        role: 'assistant',
        content: '已生成摘要：本周重点是需求收敛、视觉还原和 API 接入，下周需要确认上线链路与验收标准。',
        status: 'complete',
        createdAt: '18:20',
      },
    ],
  },
];

const initialCapabilities: CapabilityItem[] = [
  {
    id: 'research',
    name: '研究总结 Skill',
    description: '检索资料、归纳证据并输出结构化结论',
    type: 'skill',
    installed: true,
    enabled: true,
    tags: ['研究', '引用'],
    icon: IconGlobe,
    logo: researchLogo,
  },
  {
    id: 'doc-writer',
    name: '文档生成 Skill',
    description: '根据提纲生成 PRD、周报、会议纪要',
    type: 'skill',
    installed: true,
    enabled: true,
    tags: ['写作', '模板'],
    icon: IconDocument,
    logo: docWriterLogo,
  },
  {
    id: 'browser-mcp',
    name: 'Browser MCP',
    description: '读取网页、抓取截图并进行流程验证',
    type: 'mcp',
    installed: true,
    enabled: false,
    tags: ['浏览器', '验证'],
    icon: IconPreview,
    logo: browserMcpLogo,
  },
  {
    id: 'file-mcp',
    name: 'Workspace Files',
    description: '读取工作区文件，生成代码和变更摘要',
    type: 'mcp',
    installed: true,
    enabled: true,
    tags: ['文件', '代码'],
    icon: IconFolder,
    logo: workspaceFilesLogo,
  },
  {
    id: 'data-agent',
    name: '数据洞察模板',
    description: '从表格和指标中提取异常、趋势和行动项',
    type: 'template',
    installed: false,
    enabled: false,
    tags: ['数据', '分析'],
    icon: IconDatabase,
    logo: dataAgentLogo,
  },
  {
    id: 'review-agent',
    name: '上线评审模板',
    description: '检查发布风险、负责人、回滚策略和通知计划',
    type: 'template',
    installed: false,
    enabled: false,
    tags: ['评审', '发布'],
    icon: IconCheck,
    logo: reviewAgentLogo,
  },
  {
    id: 'animate',
    name: 'Animate',
    description: '为静态页面补充可控动效和转场节奏',
    type: 'skill',
    installed: false,
    enabled: false,
    tags: ['动效', '页面'],
    icon: IconPreview,
    logo: animateLogo,
  },
  {
    id: 'design-audit',
    name: 'Design Audit',
    description: '检查视觉还原度、布局问题和组件规范偏差',
    type: 'skill',
    installed: true,
    enabled: true,
    tags: ['审查', '设计'],
    icon: IconCheck,
    logo: designAuditLogo,
  },
  {
    id: 'playwright',
    name: 'Playwright Runner',
    description: '自动打开页面、截图并验证关键交互',
    type: 'mcp',
    installed: true,
    enabled: true,
    tags: ['测试', '浏览器'],
    icon: IconRefresh,
    logo: playwrightRunnerLogo,
  },
  {
    id: 'presentation',
    name: '品牌演示模板',
    description: '把研究结论整理成统一视觉的汇报材料',
    type: 'template',
    installed: false,
    enabled: false,
    tags: ['PPT', '汇报'],
    icon: IconDocument,
    logo: presentationLogo,
  },
];

const initialFiles: FileItem[] = [
  {
    id: 'brief',
    name: 'agent-workspace-brief.md',
    kind: 'document',
    updatedAt: '2026-07-08 10:12',
    size: '42 KB',
    status: 'ready',
    icon: IconTypeWordStateDefault,
  },
  {
    id: 'flow',
    name: 'skill-routing-flow.png',
    kind: 'image',
    updatedAt: '2026-07-08 09:45',
    size: '860 KB',
    status: 'ready',
    icon: IconTypeImageStateDefault,
  },
  {
    id: 'code',
    name: 'agent-shell.tsx',
    kind: 'code',
    updatedAt: '2026-07-07 18:30',
    size: '18 KB',
    status: 'ready',
    icon: IconTypeCodeStateDefault,
  },
  {
    id: 'shot-welcome',
    name: '01-欢迎页-image.png',
    kind: 'image',
    updatedAt: '2026-07-08 11:08',
    size: '1.4 MB',
    status: 'ready',
    icon: IconTypeImageStateDefault,
  },
  {
    id: 'shot-result',
    name: '13-会话页-结果-image.png',
    kind: 'image',
    updatedAt: '2026-07-08 11:10',
    size: '1.2 MB',
    status: 'ready',
    icon: IconTypeImageStateDefault,
  },
  {
    id: 'movie',
    name: 'welcome-interaction.mp4',
    kind: 'video',
    updatedAt: '2026-07-08 11:12',
    size: '8.6 MB',
    status: 'ready',
    icon: IconTypeVideoStateDefault,
  },
];

const initialMcpServers: McpServer[] = [
  {
    id: 'browser',
    name: 'Browser MCP',
    description: '打开网页、读取页面结构、截图并执行端到端验证。',
    category: 'web',
    enabled: false,
    trusted: true,
    updatedAt: '刚刚同步',
    icon: IconPreview,
  },
  {
    id: 'filesystem',
    name: 'Workspace Files',
    description: '读取和写入当前工作区文件，用于代码、文档和设计资产管理。',
    category: 'file',
    enabled: true,
    trusted: true,
    updatedAt: '今天 10:30',
    icon: IconFolder,
  },
  {
    id: 'lark',
    name: 'Lark Docs',
    description: '读取飞书文档、知识库和附件，补充产品需求上下文。',
    category: 'workspace',
    enabled: true,
    trusted: true,
    updatedAt: '今天 11:18',
    icon: IconDocument,
  },
  {
    id: 'data',
    name: 'Data Insight',
    description: '连接指标表、分析数据异常并生成趋势摘要。',
    category: 'data',
    enabled: false,
    trusted: false,
    updatedAt: '昨天',
    icon: IconDatabase,
  },
];

const connectorRecommendations: ConnectorItem[] = [
  { id: 'google-drive', name: 'Google Drive', description: '导入云盘文档和图片作为上下文。', icon: IconFolder },
  { id: 'notion', name: 'Notion', description: '同步知识库页面、数据库和项目说明。', icon: IconDocument },
  { id: 'baidu', name: '百度网盘', description: '连接团队素材库与历史交付文件。', icon: IconGlobe },
];

type AccountPopoverAction = 'settings' | 'balance' | 'help' | 'logout';

function AccountPopoverCard({
  userName,
  email,
  workspaceName,
  onSelect,
}: {
  userName: string;
  email: string;
  workspaceName: string;
  onSelect: (action: AccountPopoverAction) => void;
}) {
  const actions: Array<{ key: AccountPopoverAction; label: string; icon: IconComponent; danger?: boolean }> = [
    { key: 'settings', label: '设置', icon: IconSettings },
    { key: 'balance', label: '剩余额度', icon: IconDatabase },
    { key: 'help', label: '帮助与反馈', icon: IconHelp },
    { key: 'logout', label: '退出登录', icon: IconLogOut },
  ];

  return (
    <div className="account-popover-card" role="menu" aria-label="账户菜单">
      <div className="account-popover-profile">
        <Avatar className="account-popover-avatar" size={34}>
          <IconUser size={18} />
        </Avatar>
        <div className="account-popover-profile-text">
          <strong>{userName}</strong>
          <span>{email}</span>
        </div>
      </div>
      <div className="account-popover-actions">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              className={action.danger ? 'account-popover-item danger' : 'account-popover-item'}
              type="button"
              role="menuitem"
              onClick={() => onSelect(action.key)}
            >
              <Icon size={18} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
      <button className="account-popover-workspace" type="button" onClick={() => onSelect('settings')}>
        <Avatar className="account-popover-avatar" size={28}>
          <IconUser size={15} />
        </Avatar>
        <span>{workspaceName}</span>
      </button>
    </div>
  );
}

function AppSidebar({
  page,
  collapsed,
  conversations,
  activeConversationId,
  onPageChange,
  onConversationOpen,
  onConversationArchive,
  onConversationDelete,
  onCollapsedChange,
}: {
  page: Page;
  collapsed: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  onPageChange: (page: NavPage) => void;
  onConversationOpen: (id: string) => void;
  onConversationArchive: (id: string) => void;
  onConversationDelete: (id: string) => void;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const visibleConversations = conversations.filter((item) => !item.archived);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const selectAccountAction = (action: AccountPopoverAction) => {
    setAccountMenuOpen(false);
    if (action === 'settings') {
      onPageChange('settings');
    }
  };

  return (
    <Sidebar
      className="agent-sidebar"
      brand="Agent"
      collapsed={collapsed}
      expandTooltip="展开导航"
      logo={<img className="brand-icon" src={vedesignLogo} alt="" />}
      withFooter
      onToggle={(event) => onCollapsedChange(event.detail.collapsed)}
      footer={
        <div className="account-menu-anchor" ref={accountRef}>
          {accountMenuOpen ? (
            <AccountPopoverCard
              userName="用户名称"
              email="123456@bytedance.com"
              workspaceName="Jessica"
              onSelect={selectAccountAction}
            />
          ) : null}
          <button
            className="user-entry"
            type="button"
            aria-label="打开账户菜单"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            <Avatar className="user-entry-avatar" size={28}>
              <IconUser size={16} />
            </Avatar>
            <span className="user-entry-label">Jessica</span>
          </button>
        </div>
      }
    >
      <SidebarGroup withLabel={false}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarItem
              key={item.page}
              active={page === item.page}
              prefix={<Icon size={20} />}
              tooltip={item.label}
              onClick={() => onPageChange(item.page)}
            >
              {item.label}
            </SidebarItem>
          );
        })}
      </SidebarGroup>
      <SidebarGroup label="项目">
        <SidebarItem prefix={<IconRobot size={20} />}>通用 Agent 控制台</SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="历史会话">
        {visibleConversations.map((item, index) => (
          <SidebarItem
            key={item.id}
            active={item.id === activeConversationId}
            selected={item.id === activeConversationId}
            type="history"
            unread={index === 0 && item.id !== activeConversationId}
            onClick={() => onConversationOpen(item.id)}
          >
            <span className="history-row">
              <span className="history-title">{item.title}</span>
              <Dropdown
                className="history-more-dropdown"
                trigger="click"
                position="right-start"
                triggerNode={
                  <button
                    className="history-more-button"
                    type="button"
                    aria-label={`${item.title} 更多操作`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <IconMoreHorizontal size={16} />
                  </button>
                }
              >
                <DropdownItem value="archive" onSelect={() => onConversationArchive(item.id)}>
                  <span className="account-menu-item"><IconFolder size={16} />归档</span>
                </DropdownItem>
                <DropdownItem value="delete" onSelect={() => onConversationDelete(item.id)}>
                  <span className="account-menu-item danger"><IconClose size={16} />删除</span>
                </DropdownItem>
              </Dropdown>
            </span>
          </SidebarItem>
        ))}
      </SidebarGroup>
    </Sidebar>
  );
}

function AppHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h2>{title}</h2>
        <span>通用 Agent 工作区</span>
      </div>
      <div className="header-actions">{action}</div>
    </header>
  );
}

function Composer({
  value,
  loading,
  compact,
  onChange,
  onSubmit,
  onCancel,
  onAddFile,
}: {
  value: string;
  loading?: boolean;
  compact?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  onAddFile?: () => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = shellRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let alive = true;
    let controller: ShimmerController | null = null;

    ensureVeMotionShimmer()
      .then(() => {
        if (!alive || !host || !window.initShimmerBorder) return;
        controller = window.initShimmerBorder(host, {
          radius: 22,
          strokeWidth: 1.5,
          colorRatio: 0.42,
          duration: loading ? 2.1 : 2.7,
          loops: Infinity,
          gradient: getComposerShimmerGradient(),
          trigger: 'mount',
        });
      })
      .catch(() => {
        host.classList.add('shimmer-unavailable');
      });

    return () => {
      alive = false;
      controller?.destroy();
    };
  }, [loading]);

  return (
    <div ref={shellRef} className={compact ? 'composer-shell ved-shimmer-host compact' : 'composer-shell ved-shimmer-host'}>
      <ChatInput
        className={compact ? 'agent-composer compact' : 'agent-composer'}
        value={value}
        loading={loading}
        placeholder="有问题，尽管问"
        leftAction={
          <>
            <ChatInputAction iconOnly icon={<IconAdd size={18} />} aria-label="添加文件" onClick={onAddFile} />
            <ChatInputAction type="dropdown">Doubao Pro</ChatInputAction>
            <ChatInputAction type="secondary">深度思考</ChatInputAction>
          </>
        }
        rightAction={
          <ChatInputAction iconOnly icon={<IconMicrophone size={18} />} aria-label="语音输入" />
        }
        onChange={(event) => onChange(event.detail.value)}
        onSubmit={(event) => onSubmit(event.detail.value)}
        onCancel={onCancel}
      />
    </div>
  );
}

function WelcomePage({
  composer,
  onComposerChange,
  onSubmit,
  onAddFile,
}: {
  composer: string;
  onComposerChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onAddFile: () => void;
}) {
  return (
    <section className="main-panel welcome-panel">
      <div className="spotlight-grid" />
      <div className="welcome-content">
        <div className="welcome-core">
          <h1>今天想让 Agent 帮你推进什么?</h1>
          <Composer
            value={composer}
            onChange={onComposerChange}
            onSubmit={onSubmit}
            onAddFile={onAddFile}
          />
          <div className="prompt-chip-row">
            {promptChips.map((chip) => (
              <button key={chip} type="button" onClick={() => onComposerChange(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>
        <section className="gallery-section">
          <div className="gallery-title">推荐任务模板</div>
          <div className="gallery-grid">
            {galleryCards.map((card) => (
              <button key={card.id} className="gallery-card" type="button" onClick={() => onComposerChange(card.prompt)}>
                <img src={card.image} alt="" />
                <span>{card.title}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function SearchOverlay({
  visible,
  query,
  groups = [],
  onQueryChange,
  onClose,
  onNewChat,
}: {
  visible: boolean;
  query: string;
  groups: SearchGroup[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onNewChat: () => void;
}) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((group) => group.items.length);

  if (!visible) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="搜索">
      <button className="search-backdrop" type="button" aria-label="关闭搜索" onClick={onClose} />
      <div className="search-dialog">
        <div className="search-input-row">
          <IconSearch size={18} />
          <input
            value={query}
            placeholder="搜索对话、文件、Skill、MCP"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            autoFocus
          />
          <button className="search-close" type="button" aria-label="关闭搜索" onClick={onClose}>
            <IconClose size={16} />
          </button>
        </div>
        <button className="search-new-chat" type="button" onClick={onNewChat}>
          <IconMessageCirclePlus size={18} />
          新对话
        </button>
        <div className="search-result-list">
          {visibleGroups.length ? (
            visibleGroups.map((group) => (
              <section key={group.title}>
                <div className="search-section-title">{group.title}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} className="search-result-row" type="button" onClick={item.onOpen}>
                      <span className="file-icon">
                        <Icon size={16} />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </span>
                    </button>
                  );
                })}
              </section>
            ))
          ) : (
            <Empty className="feature-empty" title="没有匹配结果" description="换一个关键词试试。" />
          )}
        </div>
      </div>
    </div>
  );
}

function ReasoningBlock({ status, expanded, onToggle }: { status: ChatStatus; expanded: boolean; onToggle: () => void }) {
  if (status === 'generating') {
    return (
      <Thinking title="正在整理公开推理摘要" loading expanded={expanded} maxHeight="220px" onClick={onToggle}>
        <span className="thinking-copy">
          已识别用户需要一个通用 Agent 工作台。我正在确认主导航、欢迎页输入、对话输出、Skill 启停和设置保存之间的状态关系，并准备生成可复用的界面结构。
        </span>
      </Thinking>
    );
  }

  return (
    <ThoughtChain title="思维链 Chain of Thought · 18s" expanded={expanded}>
      <ThoughtChainItem itemKey="scope" title="确认产品范围" status="success">
        保留欢迎页、对话页、Skill 管理、文件库和设置页五个入口，避免把首屏做成营销页。
      </ThoughtChainItem>
      <ThoughtChainItem itemKey="state" title="规划可见状态" status="success">
        提交消息、停止生成、搜索过滤、能力安装、开关启停、设置保存都会改变页面上的可见结果。
      </ThoughtChainItem>
      <ThoughtChainItem itemKey="artifact" title="生成交付产物" status="success">
        已准备一个工作台说明文档和可预览代码片段，点击产物卡可打开右侧产物面板。
      </ThoughtChainItem>
    </ThoughtChain>
  );
}

function ConnectorCard({
  connected,
  onConnect,
}: {
  connected: string[];
  onConnect: (id: string) => void;
}) {
  return (
    <article className="connector-card">
      <div>
        <strong>推荐连接器</strong>
        <p>检测到当前任务可能需要外部资料，可先连接常用资产源。</p>
      </div>
      <div className="connector-list">
        {connectorRecommendations.map((item) => {
          const Icon = item.icon;
          const isConnected = connected.includes(item.id);
          return (
            <div key={item.id} className="connector-row">
              <span className="file-icon">
                <Icon size={16} />
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </span>
              <Button type={isConnected ? 'text' : 'secondary'} onClick={() => onConnect(item.id)}>
                {isConnected ? '已连接' : '连接'}
              </Button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function CapabilityLogo({ item, size = 22 }: { item: CapabilityItem; size?: number }) {
  const Icon = item.icon;
  return item.logo ? (
    <img className="capability-logo-img" src={item.logo} alt="" />
  ) : (
    <Icon size={size} />
  );
}

function ChatPage({
  messages,
  status,
  composer,
  artifactOpen,
  artifactView,
  copied,
  expandedThinking,
  onComposerChange,
  onSubmit,
  onCancel,
  onCopy,
  onToggleThinking,
  onArtifactOpen,
  onArtifactClose,
  onArtifactViewChange,
  connectedConnectors,
  onConnectConnector,
  feedback,
  onFeedback,
  onRetry,
}: {
  messages: AgentMessage[];
  status: ChatStatus;
  composer: string;
  artifactOpen: boolean;
  artifactView: ArtifactView;
  copied: boolean;
  expandedThinking: boolean;
  onComposerChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  onCopy: () => void;
  onToggleThinking: () => void;
  onArtifactOpen: () => void;
  onArtifactClose: () => void;
  onArtifactViewChange: (view: ArtifactView) => void;
  connectedConnectors: string[];
  onConnectConnector: (id: string) => void;
  feedback: 'like' | 'dislike' | null;
  onFeedback: (value: 'like' | 'dislike') => void;
  onRetry: () => void;
}) {
  const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant');

  return (
    <section className={artifactOpen ? 'main-panel chat-panel with-artifact' : 'main-panel chat-panel'}>
      <div className="chat-column">
        <header className="chat-header">
          <strong>通用 Agent 工作台设计</strong>
          <div>
            <Button type="text" className="icon-button">
              <IconShare size={16} />
            </Button>
            <Button type="text" className="icon-button">
              <IconMoreHorizontal size={16} />
            </Button>
          </div>
        </header>
        <div className="chat-scroll">
          <BubbleList className="bubble-list">
            {messages.map((message) => (
              <Bubble
                key={message.id}
                className={message.role === 'user' ? 'user-bubble' : 'assistant-bubble'}
                placement={message.role === 'user' ? 'end' : 'start'}
                variant={message.role === 'user' ? 'filled' : 'text'}
                shape={message.role === 'user' ? 'round' : 'corner'}
                footer={message.role === 'user' ? <span className="message-time">{message.createdAt}</span> : undefined}
              >
                {message.role === 'assistant' ? <Markdown content={message.content} /> : message.content}
              </Bubble>
            ))}
          </BubbleList>

          {messages.length > 0 ? (
            <div className="assistant-stack">
              <ReasoningBlock status={status} expanded={expandedThinking} onToggle={onToggleThinking} />
              {status !== 'generating' && latestAssistant ? (
                <>
                  <Citation
                    className="source-list"
                    items={[
                      { key: 'layout', title: 'Agent 页面布局规范', url: '#layout' },
                      { key: 'recipe', title: 'Skill 管理与设置页配方', url: '#recipe' },
                    ]}
                  />
                  <ConnectorCard connected={connectedConnectors} onConnect={onConnectConnector} />
                  <ArtifactCard
                    className="workspace-artifact"
                    title="agent-workspace-spec.md"
                    actions={
                      <Button type="text" className="icon-button" onClick={onArtifactOpen}>
                        <IconPreview size={16} />
                      </Button>
                    }
                    onClick={onArtifactOpen}
                    onCardClick={onArtifactOpen}
                  >
                    <span>Markdown · 18 KB · 已生成</span>
                  </ArtifactCard>
                  <Actions
                    className="workspace-actions"
                    items={[
                      {
                        key: 'copy',
                        icon: copied ? <IconCheck className="action-icon active" /> : <IconCopy className="action-icon" />,
                        onClick: onCopy,
                      },
                      {
                        key: 'retry',
                        icon: <IconRefresh className="action-icon" />,
                        onClick: onRetry,
                      },
                      { key: 'divider', divider: true },
                      {
                        key: 'like',
                        icon:
                          feedback === 'like' ? (
                            <IconThumbUpFilled className="action-icon active" />
                          ) : (
                            <IconLike className="action-icon" />
                          ),
                        onClick: () => onFeedback('like'),
                      },
                      {
                        key: 'dislike',
                        icon:
                          feedback === 'dislike' ? (
                            <IconThumbDownFilled className="action-icon active" />
                          ) : (
                            <IconDislike className="action-icon" />
                          ),
                        onClick: () => onFeedback('dislike'),
                      },
                      {
                        key: 'more',
                        type: 'more',
                        icon: <IconMoreHorizontal className="action-icon" />,
                        menu: (
                          <div className="workspace-action-menu">
                            <DropdownItem value="favorite" onSelect={() => onFeedback('like')}>
                              收藏回复
                            </DropdownItem>
                            <DropdownItem value="export" onSelect={onCopy}>
                              导出 Markdown
                            </DropdownItem>
                            <DropdownItem value="feedback" onSelect={() => onFeedback('dislike')}>
                              反馈问题
                            </DropdownItem>
                          </div>
                        ),
                      },
                    ]}
                    extra={
                      <span className="workspace-actions-state">
                        {copied ? '已复制' : feedback === 'like' ? '已赞同' : feedback === 'dislike' ? '已反馈' : ''}
                      </span>
                    }
                  />
                </>
              ) : null}
            </div>
          ) : (
            <Empty className="chat-empty" title="暂无对话" description="从欢迎页或下方输入框发起一个任务。" />
          )}
        </div>
        <div className="composer-zone">
          <Composer
            compact={artifactOpen}
            value={composer}
            loading={status === 'generating'}
            onChange={onComposerChange}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      </div>
      {artifactOpen ? (
        <aside className="artifact-panel">
          <header className="artifact-header">
            <strong>agent-workspace-spec.md</strong>
            <div className="segmented">
              <button className={artifactView === 'code' ? 'active' : ''} type="button" onClick={() => onArtifactViewChange('code')}>
                代码
              </button>
              <button className={artifactView === 'preview' ? 'active' : ''} type="button" onClick={() => onArtifactViewChange('preview')}>
                预览
              </button>
            </div>
            <div>
              <Button type="text" className="icon-button">
                <IconDownload size={16} />
              </Button>
              <Button type="text" className="icon-button" onClick={onArtifactClose}>
                <IconClose size={16} />
              </Button>
            </div>
          </header>
          {artifactView === 'code' ? (
            <pre className="code-panel">{`type AgentWorkspace = {
  pages: ['welcome', 'chat', 'skills', 'files', 'settings'];
  states: ['empty', 'generating', 'complete', 'filtered', 'dirty'];
  interactions: {
    submitPrompt(): void;
    toggleSkill(id: string): void;
    saveSettings(): void;
  };
};`}</pre>
          ) : (
            <div className="preview-doc">
              <h3>通用 Agent 工作台说明</h3>
              <p>欢迎页聚焦任务启动，对话页展示公开推理摘要、引用和产物，Skill 管理页维护能力启停，设置页处理模型、权限与通知。</p>
              <ul>
                <li>输入提交后进入生成态，并可停止。</li>
                <li>能力列表支持搜索、过滤、安装和启停。</li>
                <li>设置修改后进入 dirty 状态，保存后回到 clean。</li>
              </ul>
            </div>
          )}
        </aside>
      ) : null}
    </section>
  );
}

function SkillPage({
  capabilities,
  query,
  tab,
  selected,
  onQueryChange,
  onTabChange,
  onToggle,
  onInstall,
  onSelect,
  onCloseDetail,
  onTry,
  onOpenMcp,
}: {
  capabilities: CapabilityItem[];
  query: string;
  tab: string;
  selected: CapabilityItem | null;
  onQueryChange: (value: string) => void;
  onTabChange: (value: string) => void;
  onToggle: (id: string, checked: boolean) => void;
  onInstall: (id: string) => void;
  onSelect: (item: CapabilityItem) => void;
  onCloseDetail: () => void;
  onTry: (item: CapabilityItem) => void;
  onOpenMcp: () => void;
}) {
  const visibleItems = capabilities.filter((item) => {
    const matchesQuery = `${item.name} ${item.description} ${item.tags.join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesTab =
      tab === 'all' ||
      (tab === 'installed' && item.installed) ||
      item.type === tab;
    return matchesQuery && matchesTab;
  });

  return (
    <section className="main-panel feature-panel">
      <div className="feature-container">
        <AppHeader
          title="发现"
          action={
            <>
              <Input
                className="feature-search"
                value={query}
                placeholder="搜索 Skill、模板、MCP"
                prefix={<IconSearch size={15} />}
                clearable
                onInput={(event) => onQueryChange(event.currentTarget.value)}
              />
              <Button type="secondary">
                <IconFilter size={15} />
                筛选
              </Button>
              <Button type="secondary" onClick={onOpenMcp}>
                <IconDatabase size={15} />
                管理 MCP
              </Button>
              <Button type="primary" onClick={() => onTabChange('template')}>
                <IconAdd size={15} />
                安装
              </Button>
            </>
          }
        />
        <Tabs type="capsule" activeTab={tab} onChange={(event) => onTabChange(event.detail.activeTab)}>
          <TabPane itemKey="all" title="全部" />
          <TabPane itemKey="skill" title="Skill" />
          <TabPane itemKey="mcp" title="MCP" />
          <TabPane itemKey="installed" title="已安装" />
        </Tabs>
        <div className="list-header">名称</div>
        {visibleItems.length ? (
          <div className="capability-grid">
            {visibleItems.map((item) => {
              return (
                <article
                  key={item.id}
                  className="capability-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelect(item);
                  }}
                >
                  <span className="capability-icon">
                    <CapabilityLogo item={item} />
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                  </div>
                  {item.installed ? (
                    <div className="capability-actions">
                      <Button
                        type="text"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(item);
                        }}
                      >
                        详情
                      </Button>
                      <Switch
                        checked={item.enabled}
                        aria-label={`${item.name} 启停`}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onToggle(item.id, event.detail.checked)}
                      />
                    </div>
                  ) : (
                    <Button
                      type="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        onInstall(item.id);
                      }}
                    >
                      <IconAdd size={15} />
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <Empty className="feature-empty" title="没有匹配结果" description="换一个关键词或切换筛选条件。" />
        )}
      </div>

      <Modal
        className="capability-modal"
        visible={Boolean(selected)}
        width="1080px"
        title={selected?.name}
        okText={selected?.installed ? '在对话中试用' : '安装并试用'}
        cancelText="关闭"
        onVisibleChange={(event) => {
          if (!event.detail.visible) onCloseDetail();
        }}
        onOk={() => selected && onTry(selected)}
      >
        {selected ? (
          <div className="modal-detail-body">
            <div className="modal-hero">
              <span className="capability-icon large">
                <CapabilityLogo item={selected} size={28} />
              </span>
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.description}</p>
                <div className="tag-row">
                  {selected.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
              <Switch checked={selected.enabled} onChange={(event) => onToggle(selected.id, event.detail.checked)} />
            </div>
            <Markdown
              content={[
                '### 使用方式',
                '',
                `在对话中输入 \`/${selected.type} ${selected.id}\` 可以快速调用该能力。`,
                '',
                '```ts',
                `await agent.use("${selected.id}", {`,
                '  context: currentWorkspace,',
                '  requireApproval: true,',
                '});',
                '```',
                '',
                '- 支持在对话页引用执行结果。',
                '- 涉及外部数据访问时会先请求授权。',
                '- 可在管理页随时启用或停用。',
              ].join('\n')}
            />
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

function McpPage({
  servers,
  query,
  tab,
  onQueryChange,
  onTabChange,
  onToggle,
  onTrust,
}: {
  servers: McpServer[];
  query: string;
  tab: string;
  onQueryChange: (value: string) => void;
  onTabChange: (value: string) => void;
  onToggle: (id: string, checked: boolean) => void;
  onTrust: (id: string, checked: boolean) => void;
}) {
  const visibleServers = servers.filter((server) => {
    const matchesQuery = `${server.name} ${server.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesTab = tab === 'all' || server.category === tab;
    return matchesQuery && matchesTab;
  });

  return (
    <section className="main-panel feature-panel">
      <div className="feature-container management-container">
        <AppHeader
          title="管理"
          action={
            <>
              <Input
                className="feature-search"
                value={query}
                placeholder="搜索 MCP"
                prefix={<IconSearch size={15} />}
                clearable
                onInput={(event) => onQueryChange(event.currentTarget.value)}
              />
              <Button type="secondary">
                <IconRefresh size={15} />
                同步
              </Button>
            </>
          }
        />
        <Tabs type="capsule" activeTab={tab} onChange={(event) => onTabChange(event.detail.activeTab)}>
          <TabPane itemKey="all" title="全部" />
          <TabPane itemKey="web" title="网页" />
          <TabPane itemKey="file" title="文件" />
          <TabPane itemKey="data" title="数据" />
          <TabPane itemKey="workspace" title="工作区" />
        </Tabs>
        <div className="management-list">
          {visibleServers.map((server) => {
            const Icon = server.icon;
            return (
              <article key={server.id} className="management-row">
                <span className="capability-icon">
                  <Icon size={20} />
                </span>
                <div className="management-main">
                  <strong>{server.name}</strong>
                  <p>{server.description}</p>
                  <div className="tag-row">
                    <Tag>{server.updatedAt}</Tag>
                    <Tag status={server.trusted ? 'success' : 'warning'}>{server.trusted ? '可信' : '待授权'}</Tag>
                  </div>
                </div>
                <div className="management-actions">
                  <label>
                    可信
                    <Switch checked={server.trusted} onChange={(event) => onTrust(server.id, event.detail.checked)} />
                  </label>
                  <label>
                    启用
                    <Switch checked={server.enabled} onChange={(event) => onToggle(server.id, event.detail.checked)} />
                  </label>
                  <Button type="text" className="icon-button">
                    <IconMoreHorizontal size={16} />
                  </Button>
                </div>
              </article>
            );
          })}
          {!visibleServers.length ? (
            <Empty className="feature-empty" title="没有匹配结果" description="换一个关键词或切换分类。" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FilesPage({
  files,
  query,
  view,
  onQueryChange,
  onUpload,
  onViewChange,
}: {
  files: FileItem[];
  query: string;
  view: 'list' | 'grid';
  onQueryChange: (value: string) => void;
  onUpload: () => void;
  onViewChange: (value: 'list' | 'grid') => void;
}) {
  const visibleFiles = files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="main-panel feature-panel">
      <div className="feature-container">
        <AppHeader
          title="文件库"
          action={
            <>
              <Input
                className="feature-search"
                value={query}
                placeholder="搜索文件"
                prefix={<IconSearch size={15} />}
                onInput={(event) => onQueryChange(event.currentTarget.value)}
              />
              <Button type="primary" onClick={onUpload}>
                <IconUpload size={15} />
                上传
              </Button>
            </>
          }
        />
        <div className="filter-row">
          <div className="pill-tabs">
            <button className="active" type="button">全部</button>
            <button type="button">图片</button>
            <button type="button">文档</button>
          </div>
          <div className="view-toggle">
            <Button className={view === 'grid' ? 'selected icon-button' : 'icon-button'} type="text" onClick={() => onViewChange('grid')}>
              <IconGrid size={16} />
            </Button>
            <Button className={view === 'list' ? 'selected icon-button' : 'icon-button'} type="text" onClick={() => onViewChange('list')}>
              <IconList size={16} />
            </Button>
          </div>
        </div>
        <div className={view === 'grid' ? 'file-grid' : 'file-table'}>
          {visibleFiles.map((file) => {
            const Icon = file.icon;
            return (
              <div key={file.id} className="file-row">
                <span className="file-icon file-type-icon" data-kind={file.kind}>
                  <Icon size={28} />
                </span>
                <strong>{file.name}</strong>
                <span>{file.updatedAt}</span>
                <Tag>{file.status === 'ready' ? '已就绪' : file.status === 'uploading' ? '上传中' : '失败'}</Tag>
                <span>{file.size}</span>
                <Button type="text" className="icon-button">
                  <IconMoreHorizontal size={16} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SettingsPage({
  settings,
  saved,
  error,
  apiStatus,
  onPatch,
  onSave,
  onReset,
}: {
  settings: AgentSettings;
  saved: boolean;
  error: string;
  apiStatus: AgentApiStatus;
  onPatch: (patch: Partial<AgentSettings>) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const [activeSettingsSection, setActiveSettingsSection] = useState('general');
  const primaryPalette = buildPrimaryPalette(settings.themeConfig);
  const settingSections = [
    { key: 'general', label: '常规' },
    { key: 'notifications', label: '通知' },
    { key: 'personalization', label: '个性化' },
    { key: 'app', label: '应用' },
    { key: 'schedule', label: '安排' },
    { key: 'billing', label: '账单' },
    { key: 'family', label: '家长控制' },
    { key: 'account', label: '账户' },
  ];
  const activeSectionLabel =
    settingSections.find((section) => section.key === activeSettingsSection)?.label || '常规';
  const updateThemeConfig = (patch: Partial<ThemeConfig>) => {
    const next = { ...settings.themeConfig, ...patch };
    const shouldSyncHex =
      !patch.primaryHex && ('lightness' in patch || 'chroma' in patch || 'hue' in patch);
    onPatch({ themeConfig: shouldSyncHex ? { ...next, primaryHex: oklchToHex(themeConfigToOklch(next)) } : next });
  };
  const updatePrimaryHex = (value: string) => {
    const next = hexToOklch(value);
    updateThemeConfig(
      next
        ? {
            primaryHex: value,
            lightness: Number(next.L.toFixed(3)),
            chroma: Number(next.C.toFixed(4)),
            hue: Number(next.H.toFixed(1)),
          }
        : { primaryHex: value },
    );
  };

  return (
    <section className="main-panel feature-panel">
      <div className="settings-layout">
        <header className="settings-topbar">
          <div>
            <h2>设置</h2>
          </div>
          <div className="settings-topbar-actions">
            {error ? <Tag status="error">{error}</Tag> : saved ? <Tag status="success">已保存</Tag> : <Tag>有未保存修改</Tag>}
            <Button type="secondary" onClick={onReset}>重置</Button>
            <Button type="primary" onClick={onSave}>保存设置</Button>
          </div>
        </header>
        <div className="settings-workspace">
          <nav className="settings-nav" aria-label="设置分类">
            {settingSections.map((section) => (
              <button
                key={section.key}
                className={activeSettingsSection === section.key ? 'active' : ''}
                type="button"
                onClick={() => setActiveSettingsSection(section.key)}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="settings-content">
            {activeSettingsSection === 'general' ? (
              <>
                <section className="settings-block">
                  <h3>基础设置</h3>
                  <div className="settings-card">
                    <div className="settings-card-row">
                      <span>
                        <strong>主题</strong>
                        <small>选择当前 Agent 工作区的亮暗模式</small>
                      </span>
                      <div className="settings-theme-toggle">
                        <button className={settings.theme === 'light' ? 'active' : ''} type="button" onClick={() => onPatch({ theme: 'light' })}>
                          <IconSun size={15} />
                        </button>
                        <button className={settings.theme === 'dark' ? 'active' : ''} type="button" onClick={() => onPatch({ theme: 'dark' })}>
                          <IconBell size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="settings-card-row">
                      <span>
                        <strong>语言</strong>
                        <small>选择界面按钮、标签和应用内文本语言</small>
                      </span>
                      <Button type="text">简体中文</Button>
                    </div>
                    <label className="settings-card-row">
                      <span>
                        <strong>默认模型</strong>
                        <small>用于新建对话和模板任务</small>
                      </span>
                      <Input value={settings.model} onInput={(event) => onPatch({ model: event.currentTarget.value })} />
                    </label>
                    <label className="settings-card-row">
                      <span>
                        <strong>生成温度</strong>
                        <small>范围 0 到 2，越高越发散</small>
                      </span>
                      <Input
                        value={settings.temperature}
                        status={error ? 'error' : undefined}
                        onInput={(event) => onPatch({ temperature: event.currentTarget.value })}
                      />
                    </label>
                  </div>
                </section>
                <section className="settings-block">
                  <h3>常规</h3>
                  <div className="settings-card">
                    <div className="settings-card-row">
                      <span>
                        <strong>工作区记忆</strong>
                        <small>跨会话复用偏好、术语和上下文</small>
                      </span>
                      <Switch checked={settings.memory} onChange={(event) => onPatch({ memory: event.detail.checked })} />
                    </div>
                    <div className="settings-card-row">
                      <span>
                        <strong>高风险操作确认</strong>
                        <small>安装能力、调用外部服务或写入文件前请求确认</small>
                      </span>
                      <Switch checked={settings.approval} onChange={(event) => onPatch({ approval: event.detail.checked })} />
                    </div>
                    <div className="settings-card-row">
                      <span>
                        <strong>优先流式输出</strong>
                        <small>开启后优先使用 Stream API；未配置时仍走普通 Chat API</small>
                      </span>
                      <Switch checked={settings.preferStreaming} onChange={(event) => onPatch({ preferStreaming: event.detail.checked })} />
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            {activeSettingsSection === 'notifications' ? (
              <section className="settings-block">
                <h3>通知</h3>
                <div className="settings-card">
                  <div className="settings-card-row">
                    <span>
                      <strong>通知提醒</strong>
                      <small>任务完成、失败或需要人工确认时提醒</small>
                    </span>
                    <Switch checked={settings.notifications} onChange={(event) => onPatch({ notifications: event.detail.checked })} />
                  </div>
                  <div className="settings-card-row">
                    <span>
                      <strong>运行时防止系统休眠</strong>
                      <small>运行对话和自动化任务时保持唤醒状态</small>
                    </span>
                    <Switch checked={settings.notifications} onChange={(event) => onPatch({ notifications: event.detail.checked })} />
                  </div>
                </div>
              </section>
            ) : null}

            {activeSettingsSection === 'app' ? (
              <section className="settings-block">
                <h3>应用</h3>
                <div className="settings-card">
                  <div className="settings-card-row">
                    <span>
                      <strong>Agent API</strong>
                      <small>{apiStatus.configured ? apiStatus.endpoint : '未配置接口地址，当前使用本地 mock 兜底'}</small>
                    </span>
                    <Tag status={apiStatus.configured ? 'success' : 'warning'}>
                      {apiStatus.configured ? '正式接口' : 'Mock 模式'}
                    </Tag>
                  </div>
                  <label className="settings-card-row wide-control">
                    <span>
                      <strong>API Base URL</strong>
                      <small>服务根路径，用于后续补齐会话、文件库和能力管理接口</small>
                    </span>
                    <Input
                      placeholder="https://your-agent-service.example.com/api"
                      value={settings.apiBaseUrl}
                      onInput={(event) => onPatch({ apiBaseUrl: event.currentTarget.value })}
                    />
                  </label>
                  <label className="settings-card-row wide-control">
                    <span>
                      <strong>Chat API URL</strong>
                      <small>发送消息时调用的正式对话接口，支持 http(s) 或 /api 相对路径</small>
                    </span>
                    <Input
                      placeholder="https://your-agent-service.example.com/api/agent/chat"
                      status={error.includes('Chat API') ? 'error' : undefined}
                      value={settings.apiChatUrl}
                      onInput={(event) => onPatch({ apiChatUrl: event.currentTarget.value })}
                    />
                  </label>
                  <label className="settings-card-row wide-control">
                    <span>
                      <strong>Stream API URL</strong>
                      <small>预留给 SSE/流式输出，对齐 /api/agent/chat/stream</small>
                    </span>
                    <Input
                      placeholder="https://your-agent-service.example.com/api/agent/chat/stream"
                      status={error.includes('Stream API') ? 'error' : undefined}
                      value={settings.apiStreamUrl}
                      onInput={(event) => onPatch({ apiStreamUrl: event.currentTarget.value })}
                    />
                  </label>
                  <label className="settings-card-row wide-control">
                    <span>
                      <strong>API Key</strong>
                      <small>可选，调用时会作为 Bearer Token 写入 Authorization</small>
                    </span>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={settings.apiKey}
                      onInput={(event) => onPatch({ apiKey: event.currentTarget.value })}
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {activeSettingsSection === 'personalization' ? (
              <section className="settings-block">
                <h3>个性化</h3>
                <div className="settings-card theme-config-card">
                  <div className="settings-card-row">
                    <span>
                      <strong>主题配置</strong>
                      <small>参考 Vedesign Themes 的 OKLCH 主色生成能力，调整后实时应用到当前 Agent。</small>
                    </span>
                    <Tag>{formatOklch(themeConfigToOklch(settings.themeConfig))}</Tag>
                  </div>
                  <div className="theme-config-panel">
              <div className="theme-anchor-row">
                <label className="theme-color-chip" style={{ background: formatOklch(themeConfigToOklch(settings.themeConfig)) }}>
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(settings.themeConfig.primaryHex) ? settings.themeConfig.primaryHex : defaultThemeConfig.primaryHex}
                    onChange={(event) => updatePrimaryHex(event.currentTarget.value)}
                    aria-label="选择主色"
                  />
                </label>
                <label className="theme-hex-input">
                  <span>主色锚点 primary-600</span>
                  <input
                    value={settings.themeConfig.primaryHex}
                    onChange={(event) => updatePrimaryHex(event.currentTarget.value)}
                    placeholder="#518a5b"
                  />
                </label>
                <Tag>{formatOklch(themeConfigToOklch(settings.themeConfig))}</Tag>
              </div>
              <div className="theme-slider-grid">
                <label className="theme-slider-row">
                  <span>L 明度</span>
                  <input
                    type="range"
                    min="0.25"
                    max="0.78"
                    step="0.001"
                    value={settings.themeConfig.lightness}
                    onChange={(event) => updateThemeConfig({ lightness: Number(event.currentTarget.value) })}
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={settings.themeConfig.lightness}
                    onChange={(event) => updateThemeConfig({ lightness: Number(event.currentTarget.value) })}
                  />
                </label>
                <label className="theme-slider-row">
                  <span>C 色度</span>
                  <input
                    type="range"
                    min="0"
                    max="0.24"
                    step="0.001"
                    value={settings.themeConfig.chroma}
                    onChange={(event) => updateThemeConfig({ chroma: Number(event.currentTarget.value) })}
                  />
                  <input
                    type="number"
                    min="0"
                    max="0.4"
                    step="0.001"
                    value={settings.themeConfig.chroma}
                    onChange={(event) => updateThemeConfig({ chroma: Number(event.currentTarget.value) })}
                  />
                </label>
                <label className="theme-slider-row">
                  <span>H 色相</span>
                  <input
                    className="theme-hue-slider"
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={settings.themeConfig.hue}
                    onChange={(event) => updateThemeConfig({ hue: Number(event.currentTarget.value) })}
                  />
                  <input
                    type="number"
                    min="0"
                    max="360"
                    step="1"
                    value={settings.themeConfig.hue}
                    onChange={(event) => updateThemeConfig({ hue: Number(event.currentTarget.value) })}
                  />
                </label>
              </div>
              <div className="theme-palette-preview" aria-label="Primary 色板预览">
                {primaryPalette.map(({ step, color }) => (
                  <div key={step} className="theme-swatch" style={{ background: formatOklch(color) }}>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
              <div className="theme-quick-row">
                {[
                  { label: 'Agent 绿', value: defaultThemeConfig },
                  { label: '方舟蓝', value: { primaryHex: '#1664ff', lightness: 0.562, chroma: 0.2412, hue: 262.2 } },
                  { label: '暖橙', value: { primaryHex: '#d4671a', lightness: 0.5, chroma: 0.17, hue: 40 } },
                  { label: '创意紫', value: { primaryHex: '#5b2cff', lightness: 0.546, chroma: 0.2381, hue: 278.7 } },
                ].map((preset) => (
                  <button key={preset.label} type="button" onClick={() => updateThemeConfig(preset.value)}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
                </div>
              </section>
            ) : null}

            {!['general', 'notifications', 'personalization', 'app'].includes(activeSettingsSection) ? (
              <section className="settings-block">
                <h3>{activeSectionLabel}</h3>
                <div className="settings-card settings-placeholder-card">
                  <Empty title={`${activeSectionLabel}设置`} description="此分类已预留，可在接入真实业务后继续补充配置项。" />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const defaultSettings: AgentSettings = {
  model: 'Doubao Pro 1.5',
  temperature: '0.7',
  apiBaseUrl: import.meta.env.VITE_AGENT_API_BASE_URL?.trim() || '',
  apiChatUrl: agentApiStatus.endpoint,
  apiStreamUrl: import.meta.env.VITE_AGENT_STREAM_URL?.trim() || '',
  apiKey: import.meta.env.VITE_AGENT_API_KEY?.trim() || '',
  preferStreaming: false,
  memory: true,
  approval: true,
  notifications: true,
  theme: 'light' as const,
  themeConfig: defaultThemeConfig,
};

const storageKeys = {
  conversations: 'agent.workspace.conversations',
  capabilities: 'agent.workspace.capabilities',
  mcpServers: 'agent.workspace.mcpServers',
  files: 'agent.workspace.files',
  settings: 'agent.workspace.settings',
  connectors: 'agent.workspace.connectors',
  activeConversationId: 'agent.workspace.activeConversationId',
} as const;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function hydrateSettings(settings: Partial<AgentSettings>): AgentSettings {
  const merged = {
    ...defaultSettings,
    ...settings,
  };

  return {
    ...merged,
    apiBaseUrl: settings.apiBaseUrl?.trim() ? settings.apiBaseUrl : defaultSettings.apiBaseUrl,
    apiChatUrl: settings.apiChatUrl?.trim() ? settings.apiChatUrl : defaultSettings.apiChatUrl,
    apiStreamUrl: settings.apiStreamUrl?.trim() ? settings.apiStreamUrl : defaultSettings.apiStreamUrl,
    apiKey: settings.apiKey?.trim() ? settings.apiKey : defaultSettings.apiKey,
    themeConfig: {
      ...defaultThemeConfig,
      ...(settings.themeConfig || {}),
    },
  };
}

function isApiUrl(value: string) {
  const trimmed = value.trim();
  return !trimmed || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/api/');
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function summarizeTitle(input: string) {
  const text = input.trim().replace(/\s+/g, ' ');
  return text.length > 18 ? `${text.slice(0, 18)}...` : text || '新对话';
}

function formatNow() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fileKindFromFile(file: File): FileItem['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (/\.(ts|tsx|js|jsx|css|json|md|html)$/i.test(file.name)) return 'code';
  return 'document';
}

function iconFromFileKind(kind: FileItem['kind']) {
  if (kind === 'image') return IconTypeImageStateDefault;
  if (kind === 'video') return IconTypeVideoStateDefault;
  if (kind === 'code') return IconTypeCodeStateDefault;
  return IconTypeWordStateDefault;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function hydrateCapabilities(items: CapabilityItem[]) {
  return items.map((item) => {
    const source = initialCapabilities.find((candidate) => candidate.id === item.id);
    return {
      ...item,
      icon: source?.icon || IconSkill,
      logo: source?.logo || item.logo,
    };
  });
}

function hydrateMcpServers(items: McpServer[]) {
  return items.map((item) => ({
    ...item,
    icon: initialMcpServers.find((candidate) => candidate.id === item.id)?.icon || IconDatabase,
  }));
}

function hydrateFiles(items: FileItem[]) {
  return items.map((item) => ({
    ...item,
    icon: iconFromFileKind(item.kind),
  }));
}

export function App() {
  const [page, setPage] = useState<Page>(() =>
    readStorage<string | null>(storageKeys.activeConversationId, null) ? 'chat' : 'welcome',
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [composer, setComposer] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    readStorage(storageKeys.conversations, initialConversations),
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() =>
    readStorage<string | null>(storageKeys.activeConversationId, null),
  );
  const [messages, setMessages] = useState<AgentMessage[]>(() =>
    readStorage(storageKeys.conversations, initialConversations).find(
      (item) => item.id === readStorage<string | null>(storageKeys.activeConversationId, null),
    )?.messages || [],
  );
  const [status, setStatus] = useState<ChatStatus>('complete');
  const [expandedThinking, setExpandedThinking] = useState(true);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactView, setArtifactView] = useState<ArtifactView>('preview');
  const [copied, setCopied] = useState(false);
  const [responseFeedback, setResponseFeedback] = useState<'like' | 'dislike' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>(() =>
    hydrateCapabilities(readStorage(storageKeys.capabilities, initialCapabilities)),
  );
  const [skillQuery, setSkillQuery] = useState('');
  const [skillTab, setSkillTab] = useState('all');
  const [selectedCapability, setSelectedCapability] = useState<CapabilityItem | null>(null);
  const [mcpServers, setMcpServers] = useState<McpServer[]>(() =>
    hydrateMcpServers(readStorage(storageKeys.mcpServers, initialMcpServers)),
  );
  const [mcpQuery, setMcpQuery] = useState('');
  const [mcpTab, setMcpTab] = useState('all');
  const [connectedConnectors, setConnectedConnectors] = useState<string[]>(() =>
    readStorage(storageKeys.connectors, [] as string[]),
  );
  const [files, setFiles] = useState<FileItem[]>(() => hydrateFiles(readStorage(storageKeys.files, initialFiles)));
  const [fileQuery, setFileQuery] = useState('');
  const [fileView, setFileView] = useState<'list' | 'grid'>('list');
  const [settings, setSettings] = useState<AgentSettings>(() =>
    hydrateSettings(readStorage(storageKeys.settings, defaultSettings)),
  );
  const [settingsSaved, setSettingsSaved] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = 'agent';
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    applyThemeConfig(settings.themeConfig);
  }, [settings.theme, settings.themeConfig]);

  useEffect(() => {
    writeStorage(storageKeys.conversations, conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeConversationId) {
      writeStorage(storageKeys.activeConversationId, activeConversationId);
    } else {
      window.localStorage.removeItem(storageKeys.activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    writeStorage(storageKeys.capabilities, capabilities);
  }, [capabilities]);

  useEffect(() => {
    writeStorage(storageKeys.mcpServers, mcpServers);
  }, [mcpServers]);

  useEffect(() => {
    writeStorage(storageKeys.files, files);
  }, [files]);

  useEffect(() => {
    writeStorage(storageKeys.settings, settings);
  }, [settings]);

  useEffect(() => {
    writeStorage(storageKeys.connectors, connectedConnectors);
  }, [connectedConnectors]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleNavChange = (nextPage: NavPage) => {
    if (nextPage === 'search') {
      setSearchOpen(true);
      return;
    }
    setSearchOpen(false);
    if (nextPage === 'welcome') {
      setActiveConversationId(null);
      setMessages([]);
      setComposer('');
      setStatus('idle');
    }
    setPage(nextPage);
  };

  const openConversation = (id: string) => {
    const conversation = conversations.find((item) => item.id === id && !item.archived);
    if (!conversation) return;
    setActiveConversationId(id);
    setMessages(conversation.messages);
    setCopied(false);
    setResponseFeedback(null);
    setStatus('complete');
    setSearchOpen(false);
    setPage('chat');
  };

  const clearActiveConversation = (id: string) => {
    if (activeConversationId !== id) return;
    setActiveConversationId(null);
    setMessages([]);
    setStatus('idle');
    setArtifactOpen(false);
    setPage('welcome');
  };

  const archiveConversation = (id: string) => {
    setConversations((current) => current.map((item) => (item.id === id ? { ...item, archived: true } : item)));
    clearActiveConversation(id);
  };

  const deleteConversation = (id: string) => {
    setConversations((current) => current.filter((item) => item.id !== id));
    clearActiveConversation(id);
  };

  const upsertConversation = (conversationId: string, title: string, nextMessages: AgentMessage[]) => {
    setConversations((current) => {
      const nextConversation: Conversation = {
        id: conversationId,
        title,
        updatedAt: formatNow(),
        messages: nextMessages,
      };
      const exists = current.some((item) => item.id === conversationId);
      const merged = exists
        ? current.map((item) => (item.id === conversationId ? { ...item, ...nextConversation, title: item.title || title } : item))
        : [nextConversation, ...current];
      return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  };

  const syncActiveConversation = (nextMessages: AgentMessage[], fallbackTitle?: string) => {
    const id = activeConversationId || createId('conversation');
    if (!activeConversationId) setActiveConversationId(id);
    const existing = conversations.find((item) => item.id === id);
    upsertConversation(id, existing?.title || fallbackTitle || summarizeTitle(nextMessages[0]?.content || ''), nextMessages);
    return id;
  };

  const finishAssistantMessage = (assistantId: string, content: string, conversationId = activeConversationId) => {
    setMessages((current) => {
      const nextMessages = current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              status: 'complete',
              content,
            }
          : message,
      );
      if (conversationId) {
        upsertConversation(conversationId, summarizeTitle(nextMessages[0]?.content || ''), nextMessages);
      } else {
        syncActiveConversation(nextMessages);
      }
      return nextMessages;
    });
    setStatus('complete');
  };

  const runMockGeneration = (prompt: string, assistantId?: string, conversationId?: string, usedApi = false) => {
    if (!prompt.trim()) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const targetAssistantId = assistantId || `assistant-${Date.now()}`;

    timerRef.current = window.setTimeout(() => {
      finishAssistantMessage(
        targetAssistantId,
        usedApi
          ? '正式 Agent API 暂时不可用，已使用本地兜底方案完成：建议检查接口地址、鉴权、CORS 和返回协议，然后重新发送。'
          : '已完成方案草稿：建议先确认目标用户和权限边界，再把 Agent 拆成任务启动、执行反馈、能力管理和系统设置四个稳定模块。右侧产物面板里可以继续维护详细说明。',
        conversationId,
      );
      timerRef.current = null;
    }, 1400);
  };

  const runAgentGeneration = async (prompt: string) => {
    if (!prompt.trim()) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    const currentApiStatus = getAgentApiStatus({
      endpoint: settings.apiChatUrl,
      baseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
    });

    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const conversationId = activeConversationId || createId('conversation');
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt.trim(),
      status: 'complete',
      createdAt: now,
    };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: AgentMessage = {
      id: assistantId,
      role: 'assistant',
      content: currentApiStatus.configured ? '正在调用正式 Agent API...' : '正在整理你的请求，准备生成可执行方案...',
      status: 'generating',
      createdAt: now,
    };

    setPage('chat');
    setSearchOpen(false);
    setArtifactOpen(false);
    setCopied(false);
    setResponseFeedback(null);
    setStatus('generating');
    setExpandedThinking(true);
    setActiveConversationId(conversationId);
    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    upsertConversation(conversationId, summarizeTitle(prompt), nextMessages);
    setComposer('');

    if (!currentApiStatus.configured) {
      runMockGeneration(prompt, assistantId, conversationId);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendAgentMessage(
        {
          input: prompt.trim(),
          conversationId,
          model: settings.model,
          temperature: Number(settings.temperature) || 0.7,
          messages: [...messages, userMessage].map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
          })),
          context: {
            enabledSkills: capabilities.filter((item) => item.installed && item.enabled).map((item) => item.id),
            enabledMcpServers: mcpServers.filter((item) => item.enabled && item.trusted).map((item) => item.id),
            files: files
              .filter((file) => file.status === 'ready')
              .map((file) => ({ id: file.id, name: file.name, kind: file.kind, size: file.size })),
          },
        },
        controller.signal,
        {
          endpoint: settings.apiChatUrl,
          baseUrl: settings.apiBaseUrl,
          apiKey: settings.apiKey,
        },
      );
      finishAssistantMessage(assistantId, response.content || 'Agent API 已返回，但内容为空。', conversationId);
    } catch (error) {
      if (controller.signal.aborted) return;
      const detail = error instanceof Error ? error.message : String(error);
      finishAssistantMessage(
        assistantId,
        `正式 Agent API 调用失败：${detail}\n\n请检查 Chat API URL、API Key、模型名、CORS 或返回协议后重试。`,
        conversationId,
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const retryLastResponse = () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    runAgentGeneration(lastUserMessage?.content || composer || '请重新生成上一条回复。');
  };

  const cancelGeneration = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    timerRef.current = null;
    setStatus('cancelled');
    setMessages((current) => {
      const nextMessages = current.map((message) =>
        message.status === 'generating'
          ? { ...message, status: 'cancelled', content: '生成已停止。你可以继续补充要求后重新发送。' }
          : message,
      );
      if (activeConversationId) upsertConversation(activeConversationId, summarizeTitle(nextMessages[0]?.content || ''), nextMessages);
      return nextMessages;
    });
  };

  const openFilePicker = () => {
    setPage('files');
    fileInputRef.current?.click();
  };

  const addSelectedFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const nextFiles: FileItem[] = Array.from(fileList).map((file) => {
      const kind = fileKindFromFile(file);
      return {
        id: createId('file'),
        name: file.name,
        kind,
        updatedAt: formatNow(),
        size: formatBytes(file.size),
        status: 'ready',
        icon: iconFromFileKind(kind),
        mimeType: file.type || undefined,
      };
    });
    setFiles((current) => [...nextFiles, ...current]);
    setPage('files');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const patchCapability = (id: string, patch: Partial<CapabilityItem>) => {
    setCapabilities((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setSelectedCapability((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchMcpServer = (id: string, patch: Partial<McpServer>) => {
    setMcpServers((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const connectConnector = (id: string) => {
    setConnectedConnectors((current) => (current.includes(id) ? current : [...current, id]));
  };

  const patchSettings = (patch: Partial<AgentSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    setSettingsSaved(false);
    setSettingsError('');
  };

  const saveSettings = () => {
    const temperature = Number(settings.temperature);
    if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
      setSettingsError('生成温度需要在 0 到 2 之间');
      setSettingsSaved(false);
      return;
    }
    if (!isApiUrl(settings.apiBaseUrl)) {
      setSettingsError('API Base URL 需要以 http(s) 或 /api 开头');
      setSettingsSaved(false);
      return;
    }
    if (!isApiUrl(settings.apiChatUrl)) {
      setSettingsError('Chat API URL 需要以 http(s) 或 /api 开头');
      setSettingsSaved(false);
      return;
    }
    if (!isApiUrl(settings.apiStreamUrl)) {
      setSettingsError('Stream API URL 需要以 http(s) 或 /api 开头');
      setSettingsSaved(false);
      return;
    }
    setSettingsError('');
    setSettingsSaved(true);
  };

  const dynamicSearchGroups = useMemo<SearchGroup[]>(
    () => [
      {
        title: '会话',
        items: conversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title,
          meta: `会话 · ${conversation.messages.length} 条消息 · ${conversation.updatedAt}`,
          icon: IconMessage,
          onOpen: () => openConversation(conversation.id),
        })),
      },
      {
        title: '文件',
        items: files.map((file) => ({
          id: file.id,
          title: file.name,
          meta: `${file.kind} · ${file.size} · ${file.status === 'ready' ? '已就绪' : file.status}`,
          icon: file.icon,
          onOpen: () => {
            setFileQuery(file.name);
            setPage('files');
            setSearchOpen(false);
          },
        })),
      },
      {
        title: 'Skill 与模板',
        items: capabilities.map((item) => ({
          id: item.id,
          title: item.name,
          meta: `${item.type} · ${item.installed ? '已安装' : '待安装'} · ${item.enabled ? '已启用' : '未启用'}`,
          icon: item.icon,
          onOpen: () => {
            setSkillQuery(item.name);
            setSelectedCapability(item);
            setPage('skills');
            setSearchOpen(false);
          },
        })),
      },
      {
        title: 'MCP',
        items: mcpServers.map((item) => ({
          id: item.id,
          title: item.name,
          meta: `${item.category} · ${item.enabled ? '已启用' : '未启用'} · ${item.trusted ? '可信' : '待授权'}`,
          icon: item.icon,
          onOpen: () => {
            setMcpQuery(item.name);
            setPage('mcp');
            setSearchOpen(false);
          },
        })),
      },
    ],
    [capabilities, conversations, files, mcpServers],
  );

  const content = useMemo(() => {
    if (page === 'welcome') {
      return (
        <WelcomePage
          composer={composer}
          onComposerChange={setComposer}
          onSubmit={runAgentGeneration}
          onAddFile={openFilePicker}
        />
      );
    }
    if (page === 'chat') {
      return (
        <ChatPage
          messages={messages}
          status={status}
          composer={composer}
          artifactOpen={artifactOpen}
          artifactView={artifactView}
          copied={copied}
          expandedThinking={expandedThinking}
          onComposerChange={setComposer}
          onSubmit={runAgentGeneration}
          onCancel={cancelGeneration}
          onCopy={() => setCopied(true)}
          onToggleThinking={() => setExpandedThinking((value) => !value)}
          onArtifactOpen={() => setArtifactOpen(true)}
          onArtifactClose={() => setArtifactOpen(false)}
          onArtifactViewChange={setArtifactView}
          connectedConnectors={connectedConnectors}
          onConnectConnector={connectConnector}
          feedback={responseFeedback}
          onFeedback={setResponseFeedback}
          onRetry={retryLastResponse}
        />
      );
    }
    if (page === 'skills') {
      return (
        <SkillPage
          capabilities={capabilities}
          query={skillQuery}
          tab={skillTab}
          selected={selectedCapability}
          onQueryChange={setSkillQuery}
          onTabChange={setSkillTab}
          onToggle={(id, checked) => patchCapability(id, { enabled: checked, installed: true })}
          onInstall={(id) => patchCapability(id, { installed: true, enabled: true })}
          onSelect={setSelectedCapability}
          onCloseDetail={() => setSelectedCapability(null)}
          onTry={(item) => {
            patchCapability(item.id, { installed: true, enabled: true });
            setSelectedCapability(null);
            runAgentGeneration(`使用 ${item.name} 帮我完成一个示例任务。`);
          }}
          onOpenMcp={() => setPage('mcp')}
        />
      );
    }
    if (page === 'mcp') {
      return (
        <McpPage
          servers={mcpServers}
          query={mcpQuery}
          tab={mcpTab}
          onQueryChange={setMcpQuery}
          onTabChange={setMcpTab}
          onToggle={(id, checked) => patchMcpServer(id, { enabled: checked })}
          onTrust={(id, checked) => patchMcpServer(id, { trusted: checked })}
        />
      );
    }
    if (page === 'files') {
      return (
        <FilesPage
          files={files}
          query={fileQuery}
          view={fileView}
          onQueryChange={setFileQuery}
          onUpload={openFilePicker}
          onViewChange={setFileView}
        />
      );
    }
    return (
      <SettingsPage
        settings={settings}
        saved={settingsSaved}
        error={settingsError}
        apiStatus={getAgentApiStatus({
          endpoint: settings.apiChatUrl,
          baseUrl: settings.apiBaseUrl,
          apiKey: settings.apiKey,
        })}
        onPatch={patchSettings}
        onSave={saveSettings}
        onReset={() => {
          setSettings(hydrateSettings(defaultSettings));
          setSettingsSaved(true);
          setSettingsError('');
        }}
      />
    );
  }, [
    page,
    composer,
    messages,
    status,
    artifactOpen,
    artifactView,
    copied,
    responseFeedback,
    expandedThinking,
    connectedConnectors,
    capabilities,
    skillQuery,
    skillTab,
    selectedCapability,
    mcpServers,
    mcpQuery,
    mcpTab,
    files,
    fileQuery,
    fileView,
    settings,
    settingsSaved,
    settingsError,
  ]);

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <AppSidebar
        page={page}
        collapsed={sidebarCollapsed}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onPageChange={handleNavChange}
        onConversationOpen={openConversation}
        onConversationArchive={archiveConversation}
        onConversationDelete={deleteConversation}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="app-main">{content}</main>
      <input
        ref={fileInputRef}
        className="file-input-hidden"
        type="file"
        multiple
        onChange={(event) => addSelectedFiles(event.currentTarget.files)}
      />
      <SearchOverlay
        visible={searchOpen}
        query={searchQuery}
        groups={dynamicSearchGroups}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchOpen(false)}
        onNewChat={() => {
          setActiveConversationId(null);
          setMessages([]);
          setComposer('');
          setPage('welcome');
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
