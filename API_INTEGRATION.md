# Agent API Integration

前端已经支持从本地 mock 切换到正式 Agent API。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入你的服务地址：

```bash
VITE_AGENT_API_URL=https://your-agent-service.example.com/api/agent/chat
VITE_AGENT_API_KEY=
```

`VITE_AGENT_API_KEY` 可选。配置后前端会用 `Authorization: Bearer <key>` 调用接口。

## 请求协议

前端发送 `POST VITE_AGENT_API_URL`：

```json
{
  "input": "用户当前输入",
  "model": "Doubao Pro 1.5",
  "temperature": 0.7,
  "messages": [
    {
      "id": "m1",
      "role": "user",
      "content": "历史用户消息"
    },
    {
      "id": "m2",
      "role": "assistant",
      "content": "历史助手消息"
    }
  ]
}
```

## 响应协议

推荐返回 JSON：

```json
{
  "conversationId": "optional-conversation-id",
  "content": "助手最终回复，支持 Markdown",
  "citations": [
    {
      "key": "doc-1",
      "title": "引用来源标题",
      "url": "https://example.com/source"
    }
  ],
  "artifact": {
    "title": "optional-artifact.md",
    "content": "可选产物内容",
    "mimeType": "text/markdown"
  }
}
```

兼容字段：如果后端返回 `answer`、`output`、`text` 或 `message.content`，前端也会作为回复内容读取。

## 运行

```bash
pnpm dev --host 0.0.0.0 --port 5179
```

未配置 `VITE_AGENT_API_URL` 时，页面会继续使用本地 mock。配置后，发送消息会优先调用正式 API；如果接口失败，会在对话中展示失败原因并回退到本地兜底结果。
