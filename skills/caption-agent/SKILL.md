# SKILL.md - Caption Agent Skill

> 基于 subtitle-composing (Bl叹了一口气) 开源项目架构

## 1. 概述

Caption Agent Skill 负责语音转字幕，支持多种格式输出。

基于开源项目设计，支持：
- Whisper 语音识别
- 多进程并行转写
- VAD 语音活动检测
- SRT/VTT 字幕生成

## 2. 技术架构

```
caption-agent/
├── src/
│   ├── skill.js              # Skill 主入口
│   ├── transcriber.js         # 语音转写
│   ├── vad.js               # 语音活动检测
│   ├── formatter.js         # 字幕格式化
│   ├── audio_processor.js   # 音频处理
│   └── utils.js            # 工具函数
├── tests/
│   └── test.js               # 测试文件
├── examples/
│   └── demo.md               # 使用示例
└── SKILL.md
```

## 3. 核心功能

### 3.1 语音转写

```javascript
class CaptionSkill {
  // 转写音频为字幕
  async transcribe(audioPath, options)
  
  // 从视频提取音频并转写
  async extractAndTranscribe(videoPath, options)
}
```

### 3.2 支持的格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| SubRip | .srt | 最通用 |
| WebVTT | .vtt | Web 标准 |
| ASS/SSA | .ass | 高级样式 |

## 4. 使用示例

### 4.1 基础转写

```javascript
import { CaptionSkill } from './src/skill.js';

const skill = new CaptionSkill({
  whisperModel: 'base',
  language: 'auto'
});

const result = await skill.transcribe('audio.mp3', {
  format: 'srt',
  outputPath: 'subtitle.srt'
});
```

### 4.2 批量处理

```javascript
const result = await skill.batchTranscribe([
  'audio1.mp3',
  'audio2.mp3',
  'audio3.mp3'
], {
  parallel: 4,
  format: 'srt'
});
```

## 5. 参考开源项目

**subtitle-composing** (Bl叹了一口气)
- 多进程并行转写
- VAD 语音活动检测
- SRT 文件生成
- Whisper 接口封装

## 6. 待接入

- [ ] OpenAI Whisper API
- [ ] 本地 Whisper 模型
- [ ] VAD (语音活动检测)
- [ ] pyannote (说话人识别)
