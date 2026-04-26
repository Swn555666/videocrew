# SKILL.md - TTS Agent Skill

> 基于 audiocoqui (tcsenpai/audiocoqui) 开源项目架构

## 1. 概述

TTS Agent Skill 负责将文本转换为自然语音，采用 XTTS-v2 模型，支持语音克隆。

基于 audiocoqui 的架构设计，支持：
- 语音克隆
- 多语言支持
- 文本分块处理
- 进度跟踪与崩溃恢复
- 静音插入
- 音频拼接

## 2. 技术架构

```
tts-agent/
├── src/
│   ├── skill.js              # Skill 主入口
│   ├── engine.js              # TTS 引擎封装
│   ├── text_processor.js     # 文本处理
│   ├── audio_processor.js     # 音频处理
│   └── progress_tracker.js     # 进度跟踪
├── tests/
│   └── test.js               # 测试文件
├── examples/
│   └── demo.md               # 使用示例
└── SKILL.md
```

## 3. 核心功能

### 3.1 TTS 引擎

```javascript
class TTSEngine {
  // 初始化引擎
  async initialize()
  
  // 文字转语音
  async tts(text, outputPath, options)
  
  // 语音克隆
  async ttsWithVoiceClone(text, speakerWav, outputPath, language)
}
```

### 3.2 文本处理

```javascript
class TextProcessor {
  // 清理文本
  cleanText(text)
  
  // 分块处理
  splitIntoChunks(text, options)
  
  // 检测章节分隔
  detectSectionBreak(text)
}
```

### 3.3 音频处理

```javascript
class AudioProcessor {
  // 添加静音
  addSilence(audio, duration)
  
  // 拼接音频
  concatenateAudio(files, outputPath)
  
  // 插入章节静音
  addSilenceBetweenSections(audio, duration)
}
```

## 4. TTS 配置

### 4.1 支持的引擎

| 引擎 | 说明 | 语音克隆 | 语言数 |
|------|------|---------|--------|
| XTTS-v2 | Coqui 开源模型 | ✅ | 17 |
| Kokoro | 轻量级 | ❌ | 1 |
| Piper | 本地低延迟 | ❌ | 2 |
| Cloudflare | 云端 API | ❌ | 2 |
| OpenAI | 官方 API | ❌ | 1 |

### 4.2 支持的语言

- en (英语)
- zh (中文)
- es (西班牙语)
- fr (法语)
- de (德语)
- it (意大利语)
- pt (葡萄牙语)
- pl (波兰语)
- tr (土耳其语)
- ru (俄语)
- nl (荷兰语)
- cs (捷克语)
- ar (阿拉伯语)
- hu (匈牙利语)
- ko (韩语)
- ja (日语)
- hi (印地语)

## 5. 使用示例

### 5.1 基础用法

```javascript
import { TTSSkill } from './src/skill.js';

const skill = new TTSSkill({
  engine: 'xtts',
  speakerWav: './voices/reference.wav',
  language: 'zh'
});

const result = await skill.textToSpeech('你好，这是测试', {
  outputPath: './output/speech.mp3'
});
```

### 5.2 长文本处理

```javascript
const result = await skill.textToSpeech(longText, {
  outputPath: './output/audiobook.mp3',
  chunkSize: 200,
  addSilence: true,
  silenceDuration: 2000
});
```

### 5.3 语音克隆

```javascript
const result = await skill.cloneVoice('要克隆的文本', {
  speakerWav: './reference_voice.wav',
  outputPath: './output/cloned.mp3',
  language: 'zh'
});
```

## 6. 参考开源项目

**audiocoqui** (tcsenpai/audiocoqui)
- XTTS v2 语音克隆
- PDF 转有声书
- 文本分块处理
- 进度跟踪与崩溃恢复
- Rich TUI 界面

## 7. 待接入

- [ ] XTTS-v2 模型 (Coqui)
- [ ] CUDA/GPU 加速
- [ ] 本地 Whisper (OpenVINO)
- [ ] 音频格式转换
