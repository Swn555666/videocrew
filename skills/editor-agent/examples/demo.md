# Editor Skill 使用示例

## 基本用法

### 1. 导入和初始化

```javascript
import { EditorSkill } from './src/skill.js';

const skill = new EditorSkill({
  ffmpegPath: 'ffmpeg' // or absolute path
});
```

### 2. 剪切视频

```javascript
const result = await skill.cut('input.mp4', 'output.mp4', {
  start: '00:00:10',  // 开始时间
  duration: 30         // 持续秒数
});
```

### 3. 拼接视频

```javascript
const result = await skill.concat([
  'part1.mp4',
  'part2.mp4',
  'part3.mp4'
], 'merged.mp4');
```

### 4. 格式转换

```javascript
const result = await skill.convert('input.avi', 'output.mp4', {
  videoCodec: 'libx264',
  audioCodec: 'aac',
  videoBitrate: '5M',
  preset: 'medium'
});
```

### 5. 添加字幕

```javascript
const result = await skill.addSubtitle('video.mp4', 'subs.srt', 'output.mp4', {
  language: 'zh'
});
```

### 6. 添加水印

```javascript
const result = await skill.addWatermark('video.mp4', 'logo.png', 'output.mp4', {
  position: 'overlay=10:10'  // 左上角
});
```

### 7. 提取音频

```javascript
const result = await skill.extractAudio('video.mp4', 'audio.mp3', {
  format: 'mp3',
  bitrate: '192k'
});
```

### 8. 创建 GIF

```javascript
const result = await skill.createGif('video.mp4', 'output.gif', {
  fps: 10,
  scale: 480
});
```

## 获取视频信息

```javascript
const meta = await skill.getMetadata('video.mp4');

console.log(meta.format.duration);   // 时长 (秒)
console.log(meta.video.width);      // 宽度
console.log(meta.video.height);    // 高度
console.log(meta.video.fps);       // 帧率
console.log(meta.audio.codec_name); // 音频编码
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| ffmpegPath | string | ffmpeg | FFmpeg 路径 |
| ffprobePath | string | ffprobe | FFprobe 路径 |
| timeout | number | 300000 | 超时 (毫秒) |

## FFmpeg 命令构建

```javascript
// 直接使用 FFmpegCommander
const { cmd, args } = skill.commander.buildCutCommand(input, output, {
  start: '00:00:10',
  duration: 30
});

console.log(`${cmd} ${args.join(' ')}`);
// Output: ffmpeg -i input.mp4 -ss 00:00:10 -t 30 -c copy -y output.mp4
```

## 参考开源项目

**python_cli_video_editor** (jeadys)
- CLI 视频编辑器
- FFmpeg 封装
- 多种操作支持

## 待接入

- [ ] FFmpeg
- [ ] ffprobe (视频信息)
- [ ] GIFski (高质量GIF)
