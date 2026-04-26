/**
 * VideoCrew 配置文件
 */

// 项目配置
export const project = {
  name: 'VideoCrew',
  version: '1.0.0',
  workspace: './workspace'
};

// API 配置
export const api = {
  openai: {
    // 从环境变量 OPENAI_API_KEY 读取
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.8
  },
  cloudflare: {
    // 从环境变量 CLOUDFLARE_API_TOKEN 读取
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN
  }
};

// FFmpeg 配置
export const ffmpeg = {
  // FFmpeg 路径，设为空表示使用系统 PATH 中的 ffmpeg
  path: process.env.FFMPEG_PATH || 'ffmpeg',
  // 输出格式
  output: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '2M',
    audioBitrate: '128k',
    preset: 'medium',
    crf: 23
  }
};

// TTS 配置
export const tts = {
  // 默认语速
  speed: 1.0,
  // 默认音量
  volume: 1.0,
  // 支持的语音
  voices: [
    { id: 'a1', name: '清晰女声', lang: 'zh-CN' },
    { id: 'a2', name: '清晰男声', lang: 'zh-CN' },
    { id: 'a3', name: '解说女声', lang: 'zh-CN' },
    { id: 'a4', name: '解说男声', lang: 'zh-CN' }
  ]
};

// 视频模板
export const templates = {
  // 短视频模板
  short: {
    duration: 60, // 60秒以内
    ratio: '9:16', // 竖屏
    resolution: '1080:1920'
  },
  // 纪录片模板
  documentary: {
    duration: 180, // 3分钟
    ratio: '16:9', // 横屏
    resolution: '1920:1080'
  },
  // 解说视频模板
  narration: {
    duration: 300, // 5分钟
    ratio: '16:9',
    resolution: '1920:1080'
  }
};

// 字幕配置
export const subtitle = {
  // 字体
  font: 'Arial',
  // 字体大小
  fontSize: 24,
  // 颜色
  color: 'white',
  // 背景
  background: 'black@0.5',
  // 位置
  position: 'bottom-center'
};

// Agent 配置
export const agents = {
  director: {
    name: 'Director',
    timeout: 300000 // 5分钟超时
  },
  script: {
    name: 'Script Agent',
    timeout: 60000 // 1分钟
  },
  tts: {
    name: 'TTS Agent',
    timeout: 120000 // 2分钟
  },
  asset: {
    name: 'Asset Agent',
    timeout: 60000
  },
  editor: {
    name: 'Editor Agent',
    timeout: 300000 // 5分钟
  },
  caption: {
    name: 'Caption Agent',
    timeout: 180000 // 3分钟
  }
};

export default {
  project,
  api,
  ffmpeg,
  tts,
  templates,
  subtitle,
  agents
};
