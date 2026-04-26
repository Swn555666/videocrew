# Caption Skill 使用示例

## 基本用法

### 1. 导入和初始化

```javascript
import { CaptionSkill } from './src/skill.js';

const skill = new CaptionSkill({
  whisperModel: 'base',  // tiny, base, small, medium, large
  language: 'auto'        // auto, en, zh, etc.
});
```

### 2. 音频转字幕

```javascript
const result = await skill.transcribe('audio.mp3', {
  format: 'srt',           // srt, vtt, ass
  outputPath: 'subtitle.srt'
});
```

### 3. 从视频提取并转写

```javascript
const result = await skill.extractAndTranscribe('video.mp4', {
  format: 'vtt'
});
```

### 4. 批量处理

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

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| whisperModel | string | base | Whisper 模型 |
| language | string | auto | 语言代码 |
| device | string | cpu | cpu 或 cuda |

## Whisper 模型

| 模型 | 大小 | 速度 | 质量 |
|------|------|------|------|
| tiny | 39MB | 最快 | 最低 |
| base | 74MB | 快 | 中等 |
| small | 243MB | 中等 | 较高 |
| medium | 769MB | 慢 | 高 |
| large | 1.5GB | 最慢 | 最高 |

## 字幕格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| SubRip | .srt | 最通用 |
| WebVTT | .vtt | Web 标准 |
| ASS/SSA | .ass | 高级样式 |

## 参考开源项目

**subtitle-composing** (Bl叹了一口气)
- 多进程并行转写
- VAD 语音活动检测
- SRT 文件生成

## 待接入

- [ ] OpenAI Whisper API
- [ ] 本地 Whisper 模型
- [ ] VAD (语音活动检测)
- [ ] pyannote (说话人识别)
