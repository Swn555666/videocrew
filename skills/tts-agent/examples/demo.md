# TTS Skill 使用示例

## 基本用法

### 1. 导入和初始化

```javascript
import { TTSSkill } from './src/skill.js';

const skill = new TTSSkill({
  engine: 'xtts',
  speakerWav: null,
  language: 'zh'
});
```

### 2. 文字转语音

```javascript
const result = await skill.textToSpeech('你好，这是测试', {
  outputPath: './output/speech.mp3',
  addSilence: true,
  silenceDuration: 2000
});

if (result.success) {
  console.log(result.outputPath);
}
```

### 3. 语音克隆

```javascript
const result = await skill.cloneVoice('要克隆的文本', {
  speakerWav: './reference_voice.wav',
  outputPath: './output/cloned.mp3',
  language: 'zh'
});
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| engine | string | xtts | TTS 引擎 |
| speakerWav | string | null | 语音克隆参考音频 |
| language | string | zh | 语言代码 |
| chunkSize | number | 200 | 文本分块大小 |
| silenceDuration | number | 2000 | 静音时长(ms) |

## 支持的引擎

| 引擎 | 语音克隆 | 语言数 |
|------|---------|--------|
| XTTS-v2 | ✅ | 17 |
| Kokoro | ❌ | 1 |
| Piper | ❌ | 2 |
| Cloudflare | ❌ | 2 |
| OpenAI | ❌ | 1 |

## 支持的语言

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

## 文本处理

```javascript
// 清理文本
const cleaned = skill.textProcessor.cleanText(rawText);

// 分块
const chunks = skill.textProcessor.splitIntoChunks(cleaned, {
  chunkSize: 200,
  maxSize: 250
});

// 检测章节分隔
const hasBreak = skill.textProcessor.detectSectionBreak(text);
```

## 音频处理

```javascript
// 添加静音
await skill.audioProcessor.addSilence(audioPath, 2000);

// 拼接音频
await skill.audioProcessor.concatenateAudio(files, outputPath);

// 格式转换
await skill.audioProcessor.convertFormat(input, output, {
  format: 'mp3',
  bitrate: '128k'
});
```

## 进度跟踪

```javascript
// 创建跟踪器
const tracker = new ProgressTracker();

// 保存进度
tracker.saveProgress({
  currentPage: 5,
  totalPages: 10,
  chunksProcessed: 50,
  lastChunkFile: 'page_0005_chunk_003.wav'
});

// 加载进度
const state = tracker.loadProgress();

// 估算剩余时间
const remaining = tracker.estimateRemainingTime();
```

## 参考开源项目

**audiocoqui** (tcsenpai/audiocoqui)
- XTTS v2 语音克隆
- PDF 转有声书
- 文本分块处理
- 进度跟踪与崩溃恢复
