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
  IconDocument,
  IconDownload,
  IconFile,
  IconFilter,
  IconFolder,
  IconGlobe,
  IconGrid,
  IconHome,
  IconKey,
  IconList,
  IconMessage,
  IconMessageCirclePlus,
  IconMicrophone,
  IconMoreHorizontal,
  IconPreview,
  IconRefresh,
  IconRobot,
  IconSearch,
  IconSettings,
  IconShare,
  IconSkill,
  IconSun,
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
import vedesignLogo from './assets/vedesign-logo.svg';
import { agentApiStatus, sendAgentMessage } from './agentApi';

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

type CapabilityItem = {
  id: string;
  name: string;
  description: string;
  type: CapabilityType;
  installed: boolean;
  enabled: boolean;
  tags: string[];
  icon: IconComponent;
};

type FileItem = {
  id: string;
  name: string;
  kind: 'image' | 'document' | 'code' | 'video';
  updatedAt: string;
  size: string;
  status: 'ready' | 'uploading' | 'error';
  icon: IconComponent;
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
  { page: 'mcp', label: 'MCP 管理', icon: IconDatabase },
  { page: 'files', label: '文件库', icon: IconFolder },
  { page: 'settings', label: '设置', icon: IconSettings },
];

const historyItems = [
  '整理市场活动复盘',
  '生成周会结论摘要',
  '评审知识库权限配置',
  '设计客服自动化流程',
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

const searchGroups = [
  {
    title: '今天',
    items: [
      { title: '帮我用类似 YouMind 的效果来生成一个图', meta: '会话 · 2 条消息', icon: IconMessage },
      { title: '创建一个安全 Agent 产品说明页', meta: '项目 · 通用 Agent', icon: IconRobot },
      { title: 'agent-workspace-brief.md', meta: '文件 · 42 KB', icon: IconDocument },
    ],
  },
  {
    title: '更早',
    items: [
      { title: '检查知识库权限风险', meta: 'Skill · 研究总结', icon: IconSkill },
      { title: 'Browser MCP 流程验证', meta: 'MCP · 已停用', icon: IconPreview },
      { title: '生成行业研究报告', meta: '模板 · 待安装', icon: IconGlobe },
    ],
  },
];

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

function AppSidebar({
  page,
  collapsed,
  onPageChange,
  onCollapsedChange,
}: {
  page: Page;
  collapsed: boolean;
  onPageChange: (page: NavPage) => void;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  return (
    <Sidebar
      className="agent-sidebar"
      brand="Agent Workspace"
      collapsed={collapsed}
      expandTooltip="展开导航"
      logo={<img className="brand-icon" src={vedesignLogo} alt="" />}
      withFooter
      onToggle={(event) => onCollapsedChange(event.detail.collapsed)}
      footer={
        <button className="user-entry" type="button" onClick={() => onPageChange('settings')}>
          <Avatar size={28}>
            <IconUser size={16} />
          </Avatar>
          <span>产品协作空间</span>
        </button>
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
        {historyItems.map((item, index) => (
          <SidebarItem key={item} type="history" unread={index === 0} onClick={() => onPageChange('chat')}>
            {item}
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
  return (
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
  onQueryChange,
  onClose,
  onNewChat,
  onOpenChat,
}: {
  visible: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onNewChat: () => void;
  onOpenChat: () => void;
}) {
  const groups = searchGroups
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
          {groups.length ? (
            groups.map((group) => (
              <section key={group.title}>
                <div className="search-section-title">{group.title}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.title} className="search-result-row" type="button" onClick={onOpenChat}>
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
                footer={<span className="message-time">{message.createdAt}</span>}
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
                    items={[
                      { key: 'copy', icon: copied ? <IconCheck /> : <IconCopy />, text: copied ? '已复制' : '复制', onClick: onCopy },
                      { key: 'retry', icon: <IconRefresh />, text: '重新生成' },
                      { key: 'more', type: 'more', icon: <IconMoreHorizontal /> },
                    ]}
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
              const Icon = item.icon;
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
                    <Icon size={22} />
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
                <selected.icon size={28} />
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
  apiStatus: typeof agentApiStatus;
  onPatch: (patch: Partial<AgentSettings>) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const primaryPalette = buildPrimaryPalette(settings.themeConfig);
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
      <div className="feature-container settings-container">
        <AppHeader
          title="设置"
          action={
            <>
              <Button type="secondary" onClick={onReset}>重置</Button>
              <Button type="primary" onClick={onSave}>保存设置</Button>
            </>
          }
        />
        <div className="settings-status">
          {error ? <Tag status="error">{error}</Tag> : saved ? <Tag status="success">已保存</Tag> : <Tag>有未保存修改</Tag>}
        </div>
        <div className="settings-list">
          <div className="setting-row">
            <span>
              <strong>Agent API</strong>
              <small>{apiStatus.configured ? apiStatus.endpoint : '未配置 VITE_AGENT_API_URL，当前使用本地 mock 兜底'}</small>
            </span>
            <Tag status={apiStatus.configured ? 'success' : 'warning'}>
              {apiStatus.configured ? '正式接口' : 'Mock 模式'}
            </Tag>
          </div>
          <label className="setting-row">
            <span>
              <strong>默认模型</strong>
              <small>用于新建对话和模板任务</small>
            </span>
            <Input value={settings.model} onInput={(event) => onPatch({ model: event.currentTarget.value })} />
          </label>
          <label className="setting-row">
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
          <div className="setting-row">
            <span>
              <strong>工作区记忆</strong>
              <small>跨会话复用偏好、术语和上下文</small>
            </span>
            <Switch checked={settings.memory} onChange={(event) => onPatch({ memory: event.detail.checked })} />
          </div>
          <div className="setting-row">
            <span>
              <strong>高风险操作确认</strong>
              <small>安装能力、调用外部服务或写入文件前请求确认</small>
            </span>
            <Switch checked={settings.approval} onChange={(event) => onPatch({ approval: event.detail.checked })} />
          </div>
          <div className="setting-row">
            <span>
              <strong>通知提醒</strong>
              <small>任务完成、失败或需要人工确认时提醒</small>
            </span>
            <Switch checked={settings.notifications} onChange={(event) => onPatch({ notifications: event.detail.checked })} />
          </div>
          <div className="setting-row">
            <span>
              <strong>外观</strong>
              <small>切换亮色或暗色语义模式</small>
            </span>
            <div className="segmented">
              <button className={settings.theme === 'light' ? 'active' : ''} type="button" onClick={() => onPatch({ theme: 'light' })}>
                <IconSun size={14} />
                亮色
              </button>
              <button className={settings.theme === 'dark' ? 'active' : ''} type="button" onClick={() => onPatch({ theme: 'dark' })}>
                <IconBell size={14} />
                暗色
              </button>
            </div>
          </div>
          <div className="setting-row theme-config-row">
            <div>
              <strong>主题配置</strong>
              <small>参考 Vedesign Themes 的 OKLCH 主色生成能力，调整后实时应用到当前 Agent。</small>
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
        </div>
      </div>
    </section>
  );
}

const defaultSettings: AgentSettings = {
  model: 'Doubao Pro 1.5',
  temperature: '0.7',
  memory: true,
  approval: true,
  notifications: true,
  theme: 'light' as const,
  themeConfig: defaultThemeConfig,
};

export function App() {
  const [page, setPage] = useState<Page>('welcome');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [composer, setComposer] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>('complete');
  const [expandedThinking, setExpandedThinking] = useState(true);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactView, setArtifactView] = useState<ArtifactView>('preview');
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [skillQuery, setSkillQuery] = useState('');
  const [skillTab, setSkillTab] = useState('all');
  const [selectedCapability, setSelectedCapability] = useState<CapabilityItem | null>(null);
  const [mcpServers, setMcpServers] = useState(initialMcpServers);
  const [mcpQuery, setMcpQuery] = useState('');
  const [mcpTab, setMcpTab] = useState('all');
  const [connectedConnectors, setConnectedConnectors] = useState<string[]>([]);
  const [files, setFiles] = useState(initialFiles);
  const [fileQuery, setFileQuery] = useState('');
  const [fileView, setFileView] = useState<'list' | 'grid'>('list');
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsSaved, setSettingsSaved] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = 'agent';
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    applyThemeConfig(settings.themeConfig);
  }, [settings.theme, settings.themeConfig]);

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
    setPage(nextPage);
  };

  const finishAssistantMessage = (assistantId: string, content: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              status: 'complete',
              content,
            }
          : message,
      ),
    );
    setStatus('complete');
  };

  const runMockGeneration = (prompt: string, assistantId?: string) => {
    if (!prompt.trim()) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const targetAssistantId = assistantId || `assistant-${Date.now()}`;

    timerRef.current = window.setTimeout(() => {
      finishAssistantMessage(
        targetAssistantId,
        agentApiStatus.configured
          ? '正式 Agent API 暂时不可用，已使用本地兜底方案完成：建议检查接口地址、鉴权、CORS 和返回协议，然后重新发送。'
          : '已完成方案草稿：建议先确认目标用户和权限边界，再把 Agent 拆成任务启动、执行反馈、能力管理和系统设置四个稳定模块。右侧产物面板里可以继续维护详细说明。',
      );
      timerRef.current = null;
    }, 1400);
  };

  const runAgentGeneration = async (prompt: string) => {
    if (!prompt.trim()) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();

    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
      content: agentApiStatus.configured ? '正在调用正式 Agent API...' : '正在整理你的请求，准备生成可执行方案...',
      status: 'generating',
      createdAt: now,
    };

    setPage('chat');
    setSearchOpen(false);
    setArtifactOpen(false);
    setStatus('generating');
    setExpandedThinking(true);
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setComposer('');

    if (!agentApiStatus.configured) {
      runMockGeneration(prompt, assistantId);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendAgentMessage(
        {
          input: prompt.trim(),
          model: settings.model,
          temperature: Number(settings.temperature) || 0.7,
          messages: [...messages, userMessage].map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
          })),
        },
        controller.signal,
      );
      finishAssistantMessage(assistantId, response.content || 'Agent API 已返回，但内容为空。');
    } catch (error) {
      if (controller.signal.aborted) return;
      const detail = error instanceof Error ? error.message : String(error);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: `正式 Agent API 调用失败：${detail}\n\n我会先切到本地兜底结果，方便你继续验证界面流程。`,
              }
            : message,
        ),
      );
      runMockGeneration(prompt, assistantId);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    timerRef.current = null;
    setStatus('cancelled');
    setMessages((current) =>
      current.map((message) =>
        message.status === 'generating'
          ? { ...message, status: 'cancelled', content: '生成已停止。你可以继续补充要求后重新发送。' }
          : message,
      ),
    );
  };

  const addMockFile = () => {
    setFiles((current) => [
      {
        id: `upload-${Date.now()}`,
        name: `workspace-upload-${current.length + 1}.md`,
        kind: 'document',
        updatedAt: '刚刚',
        size: '12 KB',
        status: 'uploading',
        icon: IconTypeWordStateDefault,
      },
      ...current,
    ]);
    setPage('files');
    window.setTimeout(() => {
      setFiles((current) => current.map((file, index) => (index === 0 ? { ...file, status: 'ready' } : file)));
    }, 900);
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

  const patchSettings = (patch: Partial<typeof defaultSettings>) => {
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
    setSettingsError('');
    setSettingsSaved(true);
  };

  const content = useMemo(() => {
    if (page === 'welcome') {
      return (
        <WelcomePage
          composer={composer}
          onComposerChange={setComposer}
          onSubmit={runAgentGeneration}
          onAddFile={addMockFile}
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
          onUpload={addMockFile}
          onViewChange={setFileView}
        />
      );
    }
    return (
      <SettingsPage
        settings={settings}
        saved={settingsSaved}
        error={settingsError}
        apiStatus={agentApiStatus}
        onPatch={patchSettings}
        onSave={saveSettings}
        onReset={() => {
          setSettings(defaultSettings);
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
        onPageChange={handleNavChange}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="app-main">{content}</main>
      <SearchOverlay
        visible={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchOpen(false)}
        onNewChat={() => {
          setComposer('');
          setPage('welcome');
          setSearchOpen(false);
        }}
        onOpenChat={() => {
          setPage('chat');
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
