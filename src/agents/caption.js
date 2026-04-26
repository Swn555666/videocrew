import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Caption Agent - 字幕 Agent
 * 基于开源项目: 
 * - timoil/whisper-subtitles (OpenVINO + Whisper)
 * - whisper-subtitles (字幕格式生成)
 * 
 * 支持功能:
 * 1. OpenAI Whisper API - 云端转写
 * 2. 本地 Whisper (OpenVINO 加速)
 * 3. SRT/VTT 格式生成
 * 4. 多种字幕样式
 */

const WHISPER_MODELS = {
  'whisper-1': { name: 'Whisper v1', type: 'api', languages: 99 },
  'whisper-large-v3': { name: 'Whisper Large v3', type: 'api', languages: 99 },
  'tiny': { name: 'Whisper Tiny', type: 'local', size: '39MB', lang: 'en' },
  'base': { name: 'Whisper Base', type: 'local', size: '74MB', lang: 'en' },
  'small': { name: 'Whisper Small', type: 'local', size: '243MB', lang: 'en' },
  'medium': { name: 'Whisper Medium', type: 'local', size: '769MB', lang: 'en' },
  'large-v3-int8': { name: 'Whisper Large v3 (INT8)', type: 'local', size: '1.0GB', lang: 99 }
};

const SUBTITLE_FORMATS = {
  srt: { name: 'SubRip', extension: '.srt', mimeType: 'application/x-subrip' },
  vtt: { name: 'WebVTT', extension: '.vtt', mimeType: 'text/vtt' }
};

/**
 * 格式化时间戳为 SRT 格式 (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
  if (seconds === null || seconds === undefined) return '00:00:00,000';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * 格式化时间戳为 VTT 格式 (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds) {
  return formatSRTTime(seconds).replace(',', '.');
}

/**
 * 从 Whisper 结果生成 SRT 内容
 * 参考: timoil/whisper-subtitles/generate_srt_from_result()
 */
function generateSRTFromSegments(segments) {
  const lines = [];
  
  segments.forEach((segment, i) => {
    const startTime = formatSRTTime(segment.start);
    const endTime = formatSRTTime(segment.end);
    const text = segment.text?.trim() || '';
    
    if (text) {
      lines.push(`${i + 1}`);
      lines.push(`${startTime} --> ${endTime}`);
      lines.push(text);
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

/**
 * 从 Whisper 结果生成 VTT 内容
 */
function generateVTTFromSegments(segments, options = {}) {
  const lines = ['WEBVTT', ''];
  
  // 添加样式
  if (options.style === 'modern') {
    lines.push('STYLE');
    lines.push('::cue {');
    lines.push('  font-family: Arial, sans-serif;');
    lines.push('  font-size: 28px;');
    lines.push('  color: white;');
    lines.push('  background-color: rgba(0, 0, 0, 0.7);');
    lines.push('  text-align: center;');
    lines.push('}');
    lines.push('');
  }
  
  segments.forEach((segment, i) => {
    const startTime = formatVTTTime(segment.start);
    const endTime = formatVTTTime(segment.end);
    const text = segment.text?.trim() || '';
    
    if (text) {
      lines.push(`${i + 1}`);
      lines.push(`${startTime} --> ${endTime}`);
      lines.push(text);
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

/**
 * 使用 OpenAI Whisper API 转写
 * 参考: timoil/whisper-subtitles (基于 OpenAI API)
 */
async function transcribeWithOpenAI(audioPath, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your-api-key-here') {
    throw new Error('OpenAI API Key 未配置');
  }
  
  const model = options.model || 'whisper-1';
  const language = options.language || 'auto';
  
  logger.agent('Caption', `   🎤 使用 OpenAI Whisper (${model})...`);
  
  // TODO: 接入 OpenAI Whisper API
  // const formData = new FormData();
  // formData.append('file', fs.createReadStream(audioPath));
  // formData.append('model', model);
  // if (language !== 'auto') formData.append('language', language);
  // formData.append('response_format', 'verbose_json');
  // 
  // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${apiKey}` },
  //   body: formData
  // });
  // const result = await response.json();
  
  // 模拟返回
  return mockTranscription(audioPath);
}

/**
 * 使用本地 Whisper (OpenVINO 加速)
 * 参考: timoil/whisper-subtitles (OpenVINO GenAI)
 */
async function transcribeWithLocal(audioPath, options = {}) {
  const model = options.localModel || 'base';
  
  logger.agent('Caption', `   🎤 使用本地 Whisper (${model} + OpenVINO)...`);
  
  // TODO: 接入本地 Whisper + OpenVINO
  // 参考: https://github.com/timoil/whisper-subtitles
  //
  // from openvino_genai import WhisperPipeline
  // import librosa
  //
  // pipeline = WhisperPipeline(model_path, device="GPU")
  // audio, sr = librosa.load(audioPath, sr=16000)
  // result = pipeline.generate(audio.tolist(), config)
  // segments = result.chunks
  
  // 模拟返回
  return mockTranscription(audioPath);
}

/**
 * 模拟转写结果（用于测试）
 */
function mockTranscription(audioPath) {
  logger.info(`   🔄 模拟转写...`);
  
  return [
    { start: 0.0, end: 3.5, text: '欢迎观看本期节目。' },
    { start: 3.5, end: 7.0, text: '今天我们来探讨人工智能的发展。' },
    { start: 7.0, end: 11.0, text: '以及它如何改变我们的日常生活。' },
    { start: 11.0, end: 15.0, text: '让我们一起进入 AI 的世界。' },
    { start: 15.0, end: 18.5, text: '人工智能正在以前所未有的速度发展。' },
    { start: 18.5, end: 22.0, text: '从医疗诊断到自动驾驶，' },
    { start: 22.0, end: 26.0, text: 'AI 的应用已经深入各行各业。' },
    { start: 26.0, end: 30.0, text: '未来，它将继续改变我们的生活方式。' }
  ];
}

/**
 * 音频预处理（16kHz, 单声道）
 */
async function preprocessAudio(audioPath) {
  logger.agent('Caption', `   🔧 预处理音频 (16kHz, 单声道)...`);
  
  // TODO: 使用 ffmpeg 或 librosa 预处理
  // ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
  
  return audioPath;
}

/**
 * 估算音频时长
 */
async function getAudioDuration(audioPath) {
  // TODO: 使用 ffprobe 或 librosa 获取时长
  // const duration = await getDuration(audioPath);
  
  // 模拟
  return 30;
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
   * 获取支持的模型
   */
  getAvailableModels() {
    return Object.entries(WHISPER_MODELS).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 获取支持的格式
   */
  getFormats() {
    return Object.entries(SUBTITLE_FORMATS).map(([id, config]) => ({
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

      // 1. 预处理音频
      const processedAudio = await preprocessAudio(audioPath);

      // 2. 获取音频时长
      const duration = await getAudioDuration(processedAudio);
      logger.info(`   ⏱️ 音频时长: ${duration}秒`);

      // 3. 确定使用的引擎
      const engine = options.engine || 'mock';
      let segments;

      switch (engine) {
        case 'openai':
          segments = await transcribeWithOpenAI(processedAudio, options);
          break;
        case 'local':
          segments = await transcribeWithLocal(processedAudio, options);
          break;
        default:
          segments = mockTranscription(processedAudio);
      }

      logger.info(`   📝 转写完成: ${segments.length} 个片段`);

      // 4. 生成字幕文件
      const format = options.format || 'srt';
      const subtitleContent = format === 'vtt' 
        ? generateVTTFromSegments(segments, options)
        : generateSRTFromSegments(segments);

      const subtitlesDir = path.join(projectPath, 'subtitles');
      if (!existsSync(subtitlesDir)) {
        const fs = await import('fs');
        fs.mkdirSync(subtitlesDir, { recursive: true });
      }
      
      const subtitlePath = path.join(subtitlesDir, `caption.${format}`);
      writeFileSync(subtitlePath, subtitleContent);
      
      logger.info(`   💾 字幕已保存: ${subtitlePath}`);

      // 5. 保存元数据
      const metadata = {
        projectId,
        audioPath,
        engine,
        model: options.model || options.localModel || 'mock',
        format,
        segments: segments.length,
        duration,
        charCount: subtitleContent.length,
        createdAt: new Date().toISOString()
      };
      
      storage.writeJSON(projectPath, 'caption-metadata.json', metadata);

      // 6. 发送完成消息
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
   * 处理视频就绪事件
   */
  async handleVideoReady(message) {
    const { projectId } = message.payload;
    
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
