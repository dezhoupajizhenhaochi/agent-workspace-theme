# Agent API Integration

这份协议用于把当前 Agent 工作台接入真实后端。建议先实现「最小可用」接口，再逐步补齐 session、文件库、Skill、MCP 管理能力。

## 环境变量

```bash
VITE_AGENT_API_BASE_URL=https://your-agent-service.example.com/api
VITE_AGENT_API_URL=https://your-agent-service.example.com/api/agent/chat
VITE_AGENT_STREAM_URL=https://your-agent-service.example.com/api/agent/chat/stream
VITE_AGENT_API_KEY=
```

- `VITE_AGENT_API_URL`：当前前端已支持的非流式聊天接口。
- `VITE_AGENT_STREAM_URL`：推荐后续接入的 SSE 流式接口。
- `VITE_AGENT_API_KEY`：可选。前端会用 `Authorization: Bearer <key>` 传给后端。

## 认证

所有接口建议支持：

```http
Authorization: Bearer <token>
X-Workspace-Id: default
```

后端应按用户隔离 session、文件、Skill/MCP 状态。

## 最小可用接口

### 1. 非流式对话

`POST /api/agent/chat`

请求：

```json
{
  "input": "帮我分析这个文件",
  "conversationId": "conv_123",
  "model": "Doubao Pro 1.5",
  "temperature": 0.7,
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "历史用户消息"
    }
  ],
  "context": {
    "enabledSkills": ["research", "doc-writer"],
    "enabledMcpServers": ["filesystem", "lark"],
    "files": [
      {
        "id": "file_1",
        "name": "需求文档.md",
        "kind": "document",
        "size": "42 KB"
      }
    ]
  }
}
```

响应：

```json
{
  "conversationId": "conv_123",
  "message": {
    "id": "msg_2",
    "role": "assistant",
    "content": "这是助手最终回复，支持 Markdown。",
    "createdAt": "2026-07-08T12:00:00+08:00"
  },
  "content": "这是助手最终回复，支持 Markdown。",
  "citations": [
    {
      "key": "doc_1",
      "title": "引用来源标题",
      "url": "https://example.com/source"
    }
  ],
  "artifact": {
    "id": "artifact_1",
    "title": "analysis.md",
    "content": "# 分析结果",
    "mimeType": "text/markdown"
  },
  "usage": {
    "inputTokens": 1200,
    "outputTokens": 860,
    "totalTokens": 2060
  }
}
```

兼容字段：当前前端会读取 `content`、`answer`、`output`、`text` 或 `message.content`。

### 2. 流式对话，推荐正式使用

`POST /api/agent/chat/stream`

请求体同非流式接口，响应使用 `text/event-stream`。

事件格式：

```text
event: session
data: {"conversationId":"conv_123","messageId":"msg_2"}

event: thought
data: {"title":"分析任务","content":"正在读取上下文","status":"running"}

event: delta
data: {"content":"这是"}

event: delta
data: {"content":"助手回复的一部分"}

event: citation
data: {"key":"doc_1","title":"来源标题","url":"https://example.com/source"}

event: artifact
data: {"id":"artifact_1","title":"analysis.md","content":"# 分析结果","mimeType":"text/markdown"}

event: done
data: {"finishReason":"stop","usage":{"inputTokens":1200,"outputTokens":860,"totalTokens":2060}}

event: error
data: {"code":"MODEL_ERROR","message":"模型调用失败"}
```

前端接入建议：

- `session`：绑定后端生成的会话与消息 ID。
- `thought`：驱动 Thinking / ThoughtChain。
- `delta`：实时追加助手消息。
- `citation`：追加引用来源。
- `artifact`：展示右侧产物面板。
- `done`：结束生成态。
- `error`：展示错误并允许重试。

## Session 接口

### 获取会话列表

`GET /api/conversations?limit=50&cursor=`

```json
{
  "items": [
    {
      "id": "conv_123",
      "title": "市场活动复盘",
      "updatedAt": "2026-07-08T12:00:00+08:00",
      "messageCount": 8
    }
  ],
  "nextCursor": null
}
```

### 创建会话

`POST /api/conversations`

```json
{
  "title": "新对话",
  "model": "Doubao Pro 1.5"
}
```

### 获取会话详情

`GET /api/conversations/{conversationId}`

```json
{
  "id": "conv_123",
  "title": "市场活动复盘",
  "createdAt": "2026-07-08T11:30:00+08:00",
  "updatedAt": "2026-07-08T12:00:00+08:00",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "帮我复盘",
      "status": "complete",
      "createdAt": "2026-07-08T11:30:00+08:00"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "复盘如下...",
      "status": "complete",
      "createdAt": "2026-07-08T11:30:10+08:00",
      "citations": [],
      "artifacts": []
    }
  ]
}
```

### 更新会话标题

`PATCH /api/conversations/{conversationId}`

```json
{
  "title": "新的标题"
}
```

### 删除会话

`DELETE /api/conversations/{conversationId}`

返回 `204 No Content`。

## 文件库接口

### 上传文件

`POST /api/files`

`multipart/form-data`

字段：

- `file`：文件内容
- `conversationId`：可选，绑定到某个会话

响应：

```json
{
  "id": "file_1",
  "name": "需求文档.md",
  "kind": "document",
  "mimeType": "text/markdown",
  "size": "42 KB",
  "status": "ready",
  "url": "https://example.com/files/file_1",
  "createdAt": "2026-07-08T12:00:00+08:00"
}
```

### 获取文件列表

`GET /api/files?query=&kind=&limit=50&cursor=`

```json
{
  "items": [
    {
      "id": "file_1",
      "name": "需求文档.md",
      "kind": "document",
      "mimeType": "text/markdown",
      "size": "42 KB",
      "status": "ready",
      "createdAt": "2026-07-08T12:00:00+08:00"
    }
  ],
  "nextCursor": null
}
```

### 删除文件

`DELETE /api/files/{fileId}`

返回 `204 No Content`。

## Skill 接口

### 获取 Skill/模板/MCP 发现列表

`GET /api/capabilities?type=skill|template|mcp&installed=true|false`

```json
{
  "items": [
    {
      "id": "research",
      "name": "研究总结 Skill",
      "description": "检索资料、归纳证据并输出结构化结论",
      "type": "skill",
      "installed": true,
      "enabled": true,
      "tags": ["研究", "引用"]
    }
  ]
}
```

### 安装 Skill

`POST /api/capabilities/{capabilityId}/install`

```json
{
  "enabled": true
}
```

### 启用/停用 Skill

`PATCH /api/capabilities/{capabilityId}`

```json
{
  "enabled": true
}
```

## MCP 管理接口

### 获取 MCP Server 列表

`GET /api/mcp-servers`

```json
{
  "items": [
    {
      "id": "filesystem",
      "name": "Workspace Files",
      "description": "读取和写入当前工作区文件",
      "category": "file",
      "enabled": true,
      "trusted": true,
      "updatedAt": "2026-07-08T12:00:00+08:00"
    }
  ]
}
```

### 更新 MCP 状态

`PATCH /api/mcp-servers/{serverId}`

```json
{
  "enabled": true,
  "trusted": true
}
```

## 设置接口

### 获取设置

`GET /api/settings`

```json
{
  "model": "Doubao Pro 1.5",
  "temperature": "0.7",
  "memory": true,
  "approval": true,
  "notifications": true,
  "theme": "light",
  "themeConfig": {
    "primaryHex": "#518a5b",
    "lightness": 0.58,
    "chroma": 0.0927,
    "hue": 148.7
  }
}
```

### 保存设置

`PUT /api/settings`

请求体同上。

## 错误格式

所有非 2xx 响应建议统一：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数不合法",
    "details": {
      "field": "temperature"
    },
    "requestId": "req_123"
  }
}
```

常用错误码：

- `UNAUTHORIZED`：未登录或 token 失效
- `FORBIDDEN`：没有 workspace 权限
- `NOT_FOUND`：资源不存在
- `VALIDATION_ERROR`：参数错误
- `MODEL_ERROR`：模型调用失败
- `TOOL_ERROR`：Skill/MCP 工具调用失败
- `RATE_LIMITED`：限流

## 实现优先级

1. 必须先实现：`POST /api/agent/chat` 或 `POST /api/agent/chat/stream`。
2. 真实 session：`GET/POST/GET detail /api/conversations`。
3. 文件库：`POST/GET /api/files`。
4. Skill/MCP：列表、安装、启停、授权。
5. 设置同步：`GET/PUT /api/settings`。

当前前端已有 localStorage 状态层。服务端接口接好后，可以把 localStorage 调用替换成这些 API，页面交互不用重写。
