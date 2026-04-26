# 🎬 VideoCrew - AI 多 Agent 视频创作系统

> 短视频 / 纪录片 / 视频解说 全自动创作流水线

## 1. 概念与愿景

VideoCrew 是一个模块化的多 Agent 协作系统，模拟专业视频制作团队的工作流程：
- **导演 Agent** - 统筹协调，分配任务
- **编剧 Agent** - 生成脚本和文案
- **配音 Agent** - TTS 语音合成
- **素材 Agent** - 管理视频/图片素材
- **剪辑 Agent** - FFmpeg 自动化剪辑
- **字幕 Agent** - Whisper 语音转字幕

每个 Agent 独立运行，通过共享消息队列协作，最终输出完整视频。

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    🎬 VideoCrew Core                     │
│                   (Orchestration Layer)                  │
└─────────────────────────┬───────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Script  │         │   TTS   │         │  Asset  │
│ Agent   │         │  Agent  │         │  Agent  │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     └───────────────────┼───────────────────┘
                         ▼
              ┌─────────────────┐
              │    Editor       │
              │    Agent        │
              │   (FFmpeg)     │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Caption       │
              │   Agent         │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Output        │
              │   (MP4/SRT)    │
              └─────────────────┘
```

## 3. 技术栈

- **Runtime**: Node.js 24+
- **Agent Framework**: Custom event-driven + OpenAI SDK
- **Video Processing**: FFmpeg (CLI)
- **TTS**: Cloudflare Workers AI /外部API
- **Caption**: OpenAI Whisper API
- **Package Manager**: npm

## 4. Agent 详细设计

### 4.1 Director Agent (导演)
- 接收创作需求（主题/类型/时长）
- 分解任务，分配给其他 Agent
- 监控进度，处理错误
- 最终质量检查

### 4.2 Script Agent (编剧)
- 输入: 主题 + 视频类型
- 输出: 结构化脚本 (hook/intro/content/outro)
- 使用 OpenAI GPT-4 生成

### 4.3 TTS Agent (配音)
- 输入: 脚本文本
- 输出: 音频文件 (MP3/WAV)
- 支持: Cloudflare Workers AI TTS / 外部 API

### 4.4 Asset Agent (素材)
- 输入: 脚本中的场景描述
- 输出: 素材路径列表
- 来源: Pexels/Pixabay API 或本地素材库

### 4.5 Editor Agent (剪辑)
- 输入: 音频 + 素材列表 + 脚本
- 输出: 粗剪视频
- 使用 FFmpeg 自动化拼接

### 4.6 Caption Agent (字幕)
- 输入: 音频文件
- 输出: SRT/VTT 字幕文件
- 使用 Whisper API

## 5. 工作流程

```
1. 用户输入: "帮我做一个关于AI发展的纪录片，3分钟"
                      ▼
2. Director 分解任务:
   - Script Agent: 生成解说词
   - TTS Agent: 准备配音
   - Asset Agent: 收集素材
                      ▼
3. 并行执行各 Agent
                      ▼
4. Editor Agent 剪辑合成
                      ▼
5. Caption Agent 生成字幕
                      ▼
6. Director 质量检查 → 输出成品
```

## 6. 目录结构

```
videocrew/
├── src/
│   ├── agents/
│   │   ├── director.js      # 导演 Agent
│   │   ├── script.js        # 编剧 Agent
│   │   ├── tts.js           # 配音 Agent
│   │   ├── asset.js         # 素材 Agent
│   │   ├── editor.js        # 剪辑 Agent
│   │   └── caption.js       # 字幕 Agent
│   ├── core/
│   │   ├── messageQueue.js  # 消息队列
│   │   ├── taskManager.js   # 任务管理
│   │   └── logger.js        # 日志
│   ├── utils/
│   │   ├── ffmpeg.js        # FFmpeg 封装
│   │   ├── openai.js       # OpenAI 封装
│   │   └── storage.js      # 素材存储
│   ├── config/
│   │   └── settings.js      # 配置文件
│   └── index.js             # 入口
├── workspace/              # 工作目录
│   ├── projects/           # 项目文件夹
│   └── assets/             # 临时素材
├── package.json
└── README.md
```

## 7. API 集成

### 7.1 OpenAI API
- 脚本生成
- Whisper 字幕识别

### 7.2 Cloudflare Workers AI
- TTS (Speechify-TTS)

### 7.3 Pexels API (可选)
- 视频素材

## 8. 输出格式

```
project-name/
├── script.json           # 剧本
├── audio.mp3             # 配音
├── video.mp4             # 成片
├── subtitles.srt         # 字幕
└── manifest.json         # 项目清单
```

## 9. 待实现 (Roadmap)

- [x] 项目架构设计
- [ ] 基础 Agent 框架
- [ ] Director Agent
- [ ] Script Agent
- [ ] TTS Agent (Cloudflare)
- [ ] Asset Agent (Pexels)
- [ ] Editor Agent (FFmpeg)
- [ ] Caption Agent (Whisper)
- [ ] Web UI 界面
- [ ] 进度监控面板

## 10. 安装要求

- Node.js >= 20.0.0
- FFmpeg (系统命令)
- OpenAI API Key
- Cloudflare API Token (TTS)
