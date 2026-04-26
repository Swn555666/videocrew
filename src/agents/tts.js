import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

/**
 * TTS Agent - 配音 Agent
 * 基于开源项目: 
 * - tcsenpai/audiocoqui (XTTS v2 有声书)
 * - anubhav-n-mishra/xtts-api (XTTS-v2 API)
 * 
 * 支持的引擎:
 * 1. XTTS-v2 (Coqui) - 语音克隆，17语言
 * 2. Kokoro - 轻量本地TTS
 * 3. Piper - 本地低延迟
 * 4. Cloudflare Workers AI - 云端
 * 5. OpenAI TTS - 官方API
 */

const TTS_ENGINES = {
  xtts: {
    name: 'XTTS-v2',
    description: 'Coqui 语音克隆，支持17种语言',
    voiceClone: true,
    languages: ['en', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar', 'hu', 'ko', 'ja', 'hi'],
    model: 'tts_models/multilingual/multi-dataset/xtts'
  },
  kokoro: {
    name: 'Kokoro',
    description: '轻量级，本地运行',
    voiceClone: false,
    languages: ['en'],
    requires: 'kokoro pipeline'
  },
  piper: {
    name: 'Piper',
    description: '本地 TTS，低延迟',
    voiceClone: false,
    languages: ['en', 'zh'],
    requires: 'piper-tts'
  },
  cloudflare: {
    name: 'Cloudflare Workers AI',
    description: '云端 TTS，无需本地部署',
    voiceClone: false,
    languages: ['en', 'zh']
  },
  openai: {
    name: 'OpenAI TTS',
    description: '官方 TTS API',
    voiceClone: false,
    languages: ['en'],
    voices: ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer']
  }
};

const VOICE_PRESETS = {
  // 中文语音
  'zh-CN-female-1': { engine: 'cloudflare', voice: 'a1', lang: 'zh-CN', name: '清晰女声' },
  'zh-CN-female-2': { engine: 'cloudflare', voice: 'a2', lang: 'zh-CN', name: '解说女声' },
  'zh-CN-male-1': { engine: 'cloudflare', voice: 'a3', lang: 'zh-CN', name: '清晰男声' },
  'zh-CN-male-2': { engine: 'cloudflare', voice: 'a4', lang: 'zh-CN', name: '解说男声' },
  // 英文语音
  'en-US-female-1': { engine: 'openai', voice: 'alloy', lang: 'en-US', name: 'Smooth Female' },
  'en-US-female-2': { engine: 'openai', voice: 'shimmer', lang: 'en-US', name: 'Bright Female' },
  'en-US-male-1': { engine: 'openai', voice: 'echo', lang: 'en-US', name: 'Deep Male' },
  'en-US-male-2': { engine: 'openai', voice: 'onyx', lang: 'en-US', name: 'Narrative Male' },
  // 风格
  'narration': { engine: 'openai', voice: 'nova', lang: 'en-US', name: '专业解说' },
  'documentary': { engine: 'openai', voice: 'onyx', lang: 'en-US', name: '纪录片风格' },
  'short': { engine: 'openai', voice: 'alloy', lang: 'en-US', name: '短视频风格' }
};

/**
 * XTTS-v2 TTS
 * 参考: tcsenpai/audiocoqui, anubhav-n-mishra/xtts-api
 */
async function xttsTTS(text, options = {}) {
  const { speakerWav, language = 'zh', speed = 1.0 } = options;
  
  logger.agent('TTS', `   🎤 使用 XTTS-v2 (语音克隆)...`);
  
  // TODO: 接入 XTTS-v2
  // 参考: https://github.com/coqui-ai/TTS
  //
  // from TTS.api import TTS
  // tts = TTS("tts_models/multilingual/multi-dataset/xtts")
  // tts.tts(
  //   text=text,
  //   speaker_wav=speakerWav,  # 克隆用的参考音频
  //   language=language,
  //   file_path=outputPath
  // )
  
  // 检查是否有参考音频
  if (!speakerWav) {
    logger.warn('   ⚠️ XTTS 需要 speaker_wav 进行语音克隆');
  }
  
  return mockTTS(text, { ...options, engine: 'xtts' });
}

/**
 * Kokoro TTS
 * 轻量级本地 TTS
 */
async function kokoroTTS(text, options = {}) {
  const { voice = 'default', speed = 1.0 } = options;
  
  logger.agent('TTS', `   🎤 使用 Kokoro TTS...`);
  
  // TODO: 接入 Kokoro
  // from kokoro import pipeline
  // p = pipeline(voice)
  // audio = p.generate(text)
  
  return mockTTS(text, { ...options, engine: 'kokoro' });
}

/**
 * Piper TTS
 * 本地低延迟 TTS
 */
async function piperTTS(text, options = {}) {
  const { voice = 'en_US-lessac-medium', speed = 1.0 } = options;
  
  logger.agent('TTS', `   🎤 使用 Piper TTS...`);
  
  // TODO: 接入 Piper
  // ffmpeg -i <(piper-tts --model en_US-lessac-medium.onnx --text "Hello") -i audio.mp3 output.wav
  
  return mockTTS(text, { ...options, engine: 'piper' });
}

/**
 * Cloudflare Workers AI TTS
 */
async function cloudflareTTS(text, options = {}) {
  const { voice = 'a1', speed = 1.0 } = options;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!apiToken || !accountId) {
    logger.warn('   ⚠️ Cloudflare API 未配置');
    return mockTTS(text, { ...options, engine: 'cloudflare-fallback' });
  }
  
  logger.agent('TTS', `   🎤 使用 Cloudflare Workers AI...`);
  
  // TODO: 接入 Cloudflare Workers AI
  // const response = await cfAI.run('@cf-speechify/tts-16k', {
  //   text: text,
  //   voice: voice
  // });
  
  return mockTTS(text, { ...options, engine: 'cloudflare', voice });
}

/**
 * OpenAI TTS API
 */
async function openAITTS(text, options = {}) {
  const { voice = 'alloy', model = 'tts-1', speed = 1.0 } = options;
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your-api-key-here') {
    logger.warn('   ⚠️ OpenAI API 未配置');
    return mockTTS(text, { ...options, engine: 'openai-fallback' });
  }
  
  logger.agent('TTS', `   🎤 使用 OpenAI TTS (${model})...`);
  
  // TODO: 接入 OpenAI TTS API
  // const response = await openai.audio.speech.create({
  //   model: 'tts-1',
  //   voice: voice,
  //   input: text,
  //   speed: speed
  // });
  // const buffer = await response.arrayBuffer();
  
  return mockTTS(text, { ...options, engine: 'openai', voice });
}

/**
 * 模拟 TTS（用于测试）
 */
function mockTTS(text, options = {}) {
  const duration = estimateDuration(text, options.speed || 1.0);
  
  // 生成模拟音频数据
  const audioData = Buffer.from(`MOCK_AUDIO_${options.engine || 'mock'}_${Date.now()}`);
  
  return {
    audio: audioData,
    duration,
    format: 'mp3',
    engine: options.engine || 'mock',
    charCount: text.length
  };
}

/**
 * 估算音频时长
 */
function estimateDuration(text, speed = 1.0) {
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  
  let words;
  if (isChinese) {
    // 中文约 400字/分钟
    words = text.replace(/\s/g, '').length;
    return Math.ceil((words / 400) * 60 / speed);
  } else {
    // 英文约 150词/分钟
    words = text.split(/\s+/).length;
    return Math.ceil((words / 150) * 60 / speed);
  }
}

/**
 * 文本预处理
 */
function preprocessText(text) {
  // 清理多余空白
  text = text.replace(/\s+/g, ' ').trim();
  
  // 处理标点符号
  text = text.replace(/([。！？.!?])/g, '$1 ');
  
  return text;
}

/**
 * 分段处理长文本
 * 参考: tcsenpai/audiocoqui 的长文本处理
 */
async function processLongText(text, options, ttsFunction) {
  const maxLength = 500; // 每段最大字符数
  
  // 按句子分割
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim());
  
  const segments = [];
  let currentSegment = '';
  
  for (const sentence of sentences) {
    if ((currentSegment + sentence).length > maxLength) {
      if (currentSegment) {
        segments.push(currentSegment.trim());
      }
      currentSegment = sentence;
    } else {
      currentSegment += sentence;
    }
  }
  
  if (currentSegment) {
    segments.push(currentSegment.trim());
  }
  
  logger.info(`   📝 文本分段: ${segments.length} 段`);
  
  // 逐段处理
  const audioBuffers = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i]) {
      logger.info(`   🎤 处理第 ${i + 1}/${segments.length} 段...`);
      const result = await ttsFunction(segments[i], options);
      audioBuffers.push(result.audio);
    }
  }
  
  // 合并音频（简化处理，实际应该用 FFmpeg 合并）
  return {
    audio: Buffer.concat(audioBuffers),
    duration: audioBuffers.length * 3, // 估算
    segments: segments.length,
    format: 'mp3',
    engine: options.engine
  };
}

/**
 * TTS Agent 主类
 */
class TTSAgent {
  constructor() {
    this.name = 'TTS Agent';
    this.queue = 'tts';
    this.defaultEngine = 'mock';
  }

  /**
   * 获取可用的引擎
   */
  getAvailableEngines() {
    return Object.entries(TTS_ENGINES).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 获取可用的语音预设
   */
  getAvailableVoices() {
    return Object.entries(VOICE_PRESETS).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 从脚本中提取解说词
   */
  extractNarration(script) {
    if (!script) return '';
    
    // 结构化脚本
    if (script.scenes) {
      return script.scenes
        .map(scene => scene.narration || '')
        .filter(Boolean)
        .join('\n\n');
    }
    
    // 原始文本
    if (typeof script === 'string') return script;
    
    return script.narration || script.text || script.content || '';
  }

  /**
   * 生成配音
   */
  async generate(projectId, script, options = {}) {
    const taskId = taskManager.createTask(this.name, 'generate-tts', {
      projectId,
      options
    });

    logger.agent(this.name, `🎙️ 开始 TTS 生成`);

    try {
      // 1. 提取解说词
      const narrationText = this.extractNarration(script);
      
      if (!narrationText) {
        throw new Error('未找到解说词');
      }
      
      logger.info(`   📝 解说词: ${narrationText.length} 字符`);

      // 2. 预处理文本
      const processedText = preprocessText(narrationText);

      // 3. 确定引擎
      const engine = options.engine || this.defaultEngine;
      const voicePreset = VOICE_PRESETS[options.voice] || VOICE_PRESETS['zh-CN-female-1'];
      
      logger.info(`   引擎: ${TTS_ENGINES[engine]?.name || engine}`);
      logger.info(`   语音: ${voicePreset.name}`);

      // 4. 调用 TTS
      const ttsOptions = {
        ...options,
        engine,
        voice: voicePreset.voice,
        speed: options.speed || 1.0,
        language: voicePreset.lang
      };

      let result;

      if (processedText.length > 500) {
        // 长文本分段处理
        logger.info(`   📝 检测到长文本，开始分段处理...`);
        
        switch (engine) {
          case 'xtts':
            result = await processLongText(processedText, ttsOptions, xttsTTS);
            break;
          case 'kokoro':
            result = await processLongText(processedText, ttsOptions, kokoroTTS);
            break;
          case 'piper':
            result = await processLongText(processedText, ttsOptions, piperTTS);
            break;
          case 'cloudflare':
            result = await processLongText(processedText, ttsOptions, cloudflareTTS);
            break;
          case 'openai':
            result = await processLongText(processedText, ttsOptions, openAITTS);
            break;
          default:
            result = await processLongText(processedText, ttsOptions, mockTTS);
        }
      } else {
        // 短文本直接处理
        switch (engine) {
          case 'xtts':
            result = await xttsTTS(processedText, ttsOptions);
            break;
          case 'kokoro':
            result = await kokoroTTS(processedText, ttsOptions);
            break;
          case 'piper':
            result = await piperTTS(processedText, ttsOptions);
            break;
          case 'cloudflare':
            result = await cloudflareTTS(processedText, ttsOptions);
            break;
          case 'openai':
            result = await openAITTS(processedText, ttsOptions);
            break;
          default:
            result = await mockTTS(processedText, ttsOptions);
        }
      }

      // 5. 保存音频
      const projectPath = storage.getProjectPath(projectId);
      const audioDir = path.join(projectPath, 'audio');
      
      if (!existsSync(audioDir)) {
        mkdirSync(audioDir, { recursive: true });
      }
      
      const audioPath = path.join(audioDir, 'narration.mp3');
      writeFileSync(audioPath, result.audio);
      
      logger.info(`   💾 音频已保存: ${audioPath}`);
      logger.info(`   ⏱️ 时长: ${result.duration} 秒`);

      // 6. 保存元数据
      const metadata = {
        projectId,
        engine: result.engine,
        voice: ttsOptions.voice,
        voicePreset: options.voice || 'default',
        duration: result.duration,
        format: result.format,
        segments: result.segments || 1,
        charCount: narrationText.length,
        createdAt: new Date().toISOString()
      };
      
      storage.writeJSON(projectPath, 'tts-metadata.json', metadata);

      // 7. 发送完成消息
      messageQueue.send('tts-ready', {
        taskId,
        projectId,
        audioPath,
        duration: result.duration,
        metadata
      });

      taskManager.completeTask(taskId, { audioPath, metadata });

      logger.agent(this.name, `✅ TTS 生成完成`, { 
        audioPath,
        duration: result.duration,
        engine: result.engine
      });

      return { success: true, audioPath, duration: result.duration, metadata, taskId };
    } catch (error) {
      logger.error(`❌ TTS 生成失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理脚本就绪事件
   */
  async handleScriptReady(message) {
    const { script, projectId } = message.payload;
    return this.generate(projectId, script);
  }
}

export const ttsAgent = new TTSAgent();
export default ttsAgent;
