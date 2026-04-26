# VideoCrew

> 🎬 AI 多 Agent 视频创作系统 - 短视频 / 纪录片 / 视频解说 全自动流水线

## 功能特点

- 🤖 **多 Agent 协作**: 导演、编剧、配音、素材、剪辑、字幕六大 Agent 协同工作
- 📝 **智能脚本生成**: 基于 GPT-4 自动生成专业视频脚本
- 🎙️ **高质量 TTS**: 支持多种语音，中英文双语优化
- 🎞️ **FFmpeg 自动化剪辑**: 全自动视频合成
- 📝 **Whisper 字幕生成**: 准确率 99%+ 的语音转字幕
- 🔧 **模块化设计**: 每个 Agent 独立运行，易于扩展

## 系统要求

- Node.js >= 20.0.0
- FFmpeg (系统命令)
- OpenAI API Key
- Cloudflare API Token (TTS, 可选)

## 快速开始

### 1. 安装

```bash
cd videocrew
npm install
```

### 2. 配置

```bash
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

### 3. 运行

```bash
# 创建默认主题视频 (纪录片，3分钟)
npm start

# 创建自定义主题
npm start create "人工智能的未来"

# 短视频模式 (60秒)
npm start create "美食教程" --short

# 查看项目列表
npm start list

# 查看任务状态
npm start tasks
```

## 命令行选项

| 命令 | 说明 |
|------|------|
| `create [topic]` | 创建新视频项目 |
| `--short` | 短视频模式 (60秒) |
| `--narration` | 解说视频模式 (5分钟) |
| `--duration=<秒>` | 自定义时长 |
| `list` | 列出所有项目 |
| `status <id>` | 查看项目状态 |
| `tasks` | 查看任务队列 |

## 工作流程

```
用户输入主题
    ↓
🎬 Director 分配任务
    ↓
┌─────────────────────────────────────┐
│  📝 Script Agent    生成脚本        │
│  🎙️ TTS Agent       准备配音        │
│  📦 Asset Agent     收集素材        │
└─────────────────────────────────────┘
    ↓
🎞️ Editor Agent 剪辑合成
    ↓
📝 Caption Agent 生成字幕
    ↓
✅ 输出成品
```

## 项目结构

```
videocrew/
├── src/
│   ├── agents/           # Agent 实现
│   │   ├── director.js   # 导演 Agent
│   │   ├── script.js     # 编剧 Agent
│   │   ├── tts.js        # 配音 Agent
│   │   ├── asset.js      # 素材 Agent
│   │   ├── editor.js     # 剪辑 Agent
│   │   └── caption.js    # 字幕 Agent
│   ├── core/             # 核心模块
│   │   ├── logger.js     # 日志
│   │   ├── messageQueue.js # 消息队列
│   │   └── taskManager.js  # 任务管理
│   ├── utils/            # 工具
│   │   ├── openai.js     # OpenAI 接口
│   │   ├── ffmpeg.js     # FFmpeg 封装
│   │   └── storage.js    # 存储管理
│   ├── config/           # 配置
│   └── index.js          # 入口
├── workspace/            # 工作目录
└── package.json
```

## Agent 详解

### Director Agent
统筹协调所有 Agent，分解任务，监控进度。

### Script Agent
调用 GPT-4 生成结构化视频脚本，包含场景描述、解说词、素材需求。

### TTS Agent
文字转语音，支持多种语音引擎（Cloudflare Workers AI / ElevenLabs / Azure TTS）。

### Asset Agent
管理素材，支持 Pexels / Pixabay API 搜索下载素材。

### Editor Agent
FFmpeg 自动化剪辑，音视频合成。

### Caption Agent
Whisper 语音转字幕，支持 SRT/VTT 格式。

## 扩展开发

### 添加新的 TTS 引擎

编辑 `src/agents/tts.js` 的 `textToSpeech` 方法：

```javascript
async textToSpeech(text, options) {
  // 接入你的 TTS 引擎
  const audio = await myTTS.convert(text, {
    voice: options.voice,
    speed: options.speed
  });
  return audio;
}
```

### 添加新的 Agent

1. 在 `src/agents/` 创建新 Agent 文件
2. 实现 Agent 类
3. 在 `director.js` 中注册并调用

## License

MIT
