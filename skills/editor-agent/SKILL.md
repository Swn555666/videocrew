# SKILL.md - Editor Agent Skill

> 基于 python_cli_video_editor 和 ffmpeg-automated-editor 开源项目架构

## 1. 概述

Editor Agent Skill 负责视频剪辑和合成，支持多种编辑操作。

基于开源项目设计，支持：
- 视频剪切
- 拼接合并
- 格式转换
- 添加字幕
- 添加水印
- 提取音频
- 截取快照

## 2. 技术架构

```
editor-agent/
├── src/
│   ├── skill.js              # Skill 主入口
│   ├── ffmpeg/
│   │   ├── commander.js     # FFmpeg 命令构建器
│   │   └── executor.js     # FFmpeg 命令执行器
│   ├── operations/
│   │   ├── cut.js          # 剪切操作
│   │   ├── concat.js       # 拼接操作
│   │   ├── convert.js      # 格式转换
│   │   ├── subtitle.js     # 字幕操作
│   │   ├── watermark.js    # 水印操作
│   │   └── audio.js       # 音频操作
│   ├── validators.js        # 参数验证
│   └── metadata.js         # 视频信息
├── tests/
│   └── test.js               # 测试文件
├── examples/
│   └── demo.md               # 使用示例
└── SKILL.md
```

## 3. 核心功能

### 3.1 FFmpeg 操作

```javascript
class EditorSkill {
  // 剪切视频
  async cut(input, output, options)
  
  // 拼接视频
  async concat(inputs, output, options)
  
  // 格式转换
  async convert(input, output, format)
  
  // 添加字幕
  async addSubtitle(input, subtitle, output)
}
```

### 3.2 支持的操作

| 操作 | 说明 | FFmpeg 滤镜 |
|------|------|-------------|
| cut | 剪切视频 | -ss, -t |
| concat | 拼接视频 | ffmpeg concat |
| convert | 格式转换 | -c:v, -c:a |
| subtitle | 添加字幕 | subtitles |
| watermark | 添加水印 | overlay |
| audio | 提取音频 | -vn, -acodec |
| gif | 制作GIF | gifski |
| snapshot | 截取快照 | fps, select |

## 4. FFmpeg 命令示例

### 4.1 剪切视频
```
ffmpeg -i input.mp4 -ss 00:00:10 -t 00:00:30 -c copy output.mp4
```

### 4.2 拼接视频
```
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
```

### 4.3 添加字幕
```
ffmpeg -i input.mp4 -vf subtitles=subtitle.srt output.mp4
```

### 4.4 添加水印
```
ffmpeg -i input.mp4 -i watermark.png -filter_complex overlay=10:10 output.mp4
```

## 5. 使用示例

### 5.1 基础剪切

```javascript
import { EditorSkill } from './src/skill.js';

const skill = new EditorSkill({
  ffmpegPath: 'ffmpeg' // or absolute path
});

const result = await skill.cut('input.mp4', 'output.mp4', {
  start: '00:00:10',
  duration: 30
});
```

### 5.2 拼接视频

```javascript
const result = await skill.concat([
  'part1.mp4',
  'part2.mp4',
  'part3.mp4'
], 'merged.mp4');
```

### 5.3 添加字幕

```javascript
const result = await skill.addSubtitle('video.mp4', 'subs.srt', 'output.mp4');
```

## 6. 参考开源项目

**python_cli_video_editor** (jeadys)
- CLI 视频编辑器
- FFmpeg 封装
- 多种操作支持

**ffmpeg-automated-editor** (clavesi)
- 自动化视频编辑
- 片段处理

## 7. 待接入

- [ ] FFmpeg
- [ ] ffprobe (视频信息)
- [ ] GIFski (高质量GIF)
