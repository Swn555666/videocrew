import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Caption Agent - 字幕 Agent
 * 基于开源项目: Whisper, autosub
 * 
 * 功能:
 * 1. 语音转字幕 - 音频 → SRT/VTT
 * 2. 字幕格式转换 - SRT ↔ VTT
 * 3. 字幕样式 - 位置、颜色、大小
 */

const SUBTITLE_FORMATS = {
  srt: {
    name: 'SubRip',
    extension: '.srt',
    mimeType: 'application/x-subrip'
  },
  vtt: {
    name: 'WebVTT',
    extension: '.vtt',
    mimeType: 'text/vtt'
  }
};

const CAPTION_STYLES = {
  default: {
    font: 'Arial',
    fontSize: 24,
    color: 'white',
    background: 'black@0.5',
    position: 'bottom-center'
  },
  modern: {
    font: 'Helvetica Neue',
    fontSize: 28,
    color: 'white',
    background: 'black@0.6',
    position: 'bottom-center',
    shadow: '2px 2px 4px rgba(0,0,0,0.8)'
  },
  karaoke: {
    font: 'Arial Black',
    fontSize: 32,
    color: 'yellow',
    background: 'black@0.7',
    position: 'center'
  },
  social: {
    font: 'Arial',
    fontSize: 36,
    color: 'white',
    background: 'black@0.8',
    position: 'bottom-left'
  }
};

/**
 * SRT 时间码转秒
 */
function srtTimeToSeconds(timeStr) {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  
  const [, h, m, s, ms] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

/**
 * 秒转 SRT 时间码
 */
function secondsToSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * 生成 SRT 字幕
 */
function generateSRT(segments) {
  let srt = '';
  
  segments.forEach((seg, i) => {
    srt += `${i + 1}\n`;
    srt += `${secondsToSRTTime(seg.start)} --> ${secondsToSRTTime(seg.end)}\n`;
    srt += `${seg.text}\n\n`;
  });
  
  return srt;
}

/**
 * 生成 VTT 字幕
 */
function generateVTT(segments, style = CAPTION_STYLES.default) {
  let vtt = 'WEBVTT\n\n';
  
  // 添加样式信息
  if (style.position === 'center') {
    vtt += `STYLE\n::cue {\n  font-family: ${style.font};\n  font-size: ${style.fontSize}px;\n  color: ${style.color};\n  background-color: ${style.background};\n  text-align: center;\n}\n\n`;
  }
  
  segments.forEach((seg, i) => {
    vtt += `${i + 1}\n`;
    vtt += `${secondsToSRTTime(seg.start).replace(',', '.')} --> ${secondsToSRTTime(seg.end).replace(',', '.')}\n`;
    vtt += `${seg.text}\n\n`;
  });
  
  return vtt;
}

/**
 * 模拟 Whisper 转写
 */
async function mockTranscribe(audioPath) {
  logger.agent('Caption', `   🎤 模拟 Whisper 转写...`);
  
  // 模拟处理
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回模拟字幕
  return [
    { start: 0, end: 3.5, text: '欢迎观看本期节目。' },
    { start: 3.5, end: 7.0, text: '今天我们来探讨人工智能的发展。' },
    { start: 7.0, end: 11.0, text: '以及它如何改变我们的日常生活。' },
    { start: 11.0, end: 15.0, text: '让我们一起进入 AI 的世界。' }
  ];
}

/**
 * 使用 OpenAI Whisper API
 */
async function whisperTranscribe(audioPath) {
  logger.agent('Caption', `   🎤 使用 Whisper API...`);
  
  // TODO: 接入 OpenAI Whisper
  // const response = await openai.audio.transcriptions.create({
  //   file: fs.createReadStream(audioPath),
  //   model: 'whisper-1',
  //   response_format: 'srt'
  // });
  
  return mockTranscribe(audioPath);
}

/**
 * 使用本地 Whisper
 */
async function localWhisperTranscribe(audioPath) {
  logger.agent('Caption', `   🎤 使用本地 Whisper...`);
  
  // TODO: 接入本地 Whisper
  // import whisper
  // model = whisper.load_model("base")
  // result = model.transcribe(audioPath)
  
  return mockTranscribe(audioPath);
}

/**
 * Caption Agent 主类
 */
class CaptionAgent {
  constructor() {
    this.name = 'Caption Agent';
    this.queue = 'caption';
  }

  /**
   * 获取支持的字幕格式
   */
  getFormats() {
    return Object.entries(SUBTITLE_FORMATS).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 获取可用的样式
   */
  getStyles() {
    return Object.entries(CAPTION_STYLES).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 查找音频文件
   */
  findAudioFile(projectPath) {
    const audioDir = path.join(projectPath, 'audio');
    
    if (!existsSync(audioDir)) return null;
    
    const files = readdirSync(audioDir).filter(f => 
      f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')
    );
    
    if (files.length > 0) {
      return path.join(audioDir, files[0]);
    }
    return null;
  }

  /**
   * 生成字幕
   */
  async generate(projectId, audioPath, options = {}) {
    const taskId = taskManager.createTask(this.name, 'generate-caption', {
      projectId,
      audioPath
    });

    logger.agent(this.name, `📝 开始生成字幕`);

    try {
      const projectPath = storage.getProjectPath(projectId);
      
      // 如果没有提供音频路径，尝试查找
      if (!audioPath) {
        audioPath = this.findAudioFile(projectPath);
      }
      
      if (!audioPath || !existsSync(audioPath)) {
        throw new Error('未找到音频文件');
      }
      
      logger.info(`   🎤 音频: ${audioPath}`);

      // 1. 转写音频
      let segments;
      const engine = options.engine || 'mock';
      
      switch (engine) {
        case 'openai':
          segments = await whisperTranscribe(audioPath);
          break;
        case 'local':
          segments = await localWhisperTranscribe(audioPath);
          break;
        default:
          segments = await mockTranscribe(audioPath);
      }

      logger.info(`   📝 转写完成: ${segments.length} 条字幕`);

      // 2. 生成字幕文件
      const format = options.format || 'srt';
      const style = CAPTION_STYLES[options.style] || CAPTION_STYLES.default;
      
      const subtitlesDir = path.join(projectPath, 'subtitles');
      if (!existsSync(subtitlesDir)) {
        const fs = await import('fs');
        fs.mkdirSync(subtitlesDir, { recursive: true });
      }
      
      let subtitleContent;
      let subtitlePath;
      
      if (format === 'vtt') {
        subtitleContent = generateVTT(segments, style);
        subtitlePath = path.join(subtitlesDir, 'caption.vtt');
      } else {
        subtitleContent = generateSRT(segments);
        subtitlePath = path.join(subtitlesDir, 'caption.srt');
      }

      writeFileSync(subtitlePath, subtitleContent);
      
      logger.info(`   💾 字幕已保存: ${subtitlePath}`);

      // 3. 保存元数据
      const metadata = {
        projectId,
        audioPath,
        format,
        style: options.style || 'default',
        segments: segments.length,
        duration: segments[segments.length - 1]?.end || 0,
        createdAt: new Date().toISOString()
      };
      
      storage.writeJSON(projectPath, 'caption-metadata.json', metadata);

      // 4. 发送完成消息
      messageQueue.send('caption-ready', {
        taskId,
        projectId,
        subtitlePath,
        format
      });

      taskManager.completeTask(taskId, { subtitlePath });

      logger.agent(this.name, `✅ 字幕生成完成`, { subtitlePath });

      return { success: true, subtitlePath, format, segments, taskId };
    } catch (error) {
      logger.error(`❌ 字幕生成失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 转换字幕格式
   */
  async convert(subtitlePath, targetFormat) {
    logger.agent('Caption', `🔄 转换字幕格式: ${path.basename(subtitlePath)} → ${targetFormat}`);
    
    try {
      const fs = await import('fs');
      const content = fs.readFileSync(subtitlePath, 'utf-8');
      
      // 简单转换（实际应该解析再生成）
      if (targetFormat === 'vtt') {
        return 'WEBVTT\n\n' + content.replace(/,/g, '.');
      } else {
        return content.replace(/\./g, ',');
      }
    } catch (error) {
      logger.error(`   ❌ 转换失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 处理视频就绪事件
   */
  async handleVideoReady(message) {
    const { projectId } = message.payload;
    
    // 查找对应的音频文件
    const audioPath = this.findAudioFile(projectId);
    
    if (audioPath) {
      return this.generate(projectId, audioPath);
    }
    
    logger.warn('没有找到音频文件');
    return { success: false, reason: 'No audio file' };
  }
}

export const captionAgent = new CaptionAgent();
export default captionAgent;
