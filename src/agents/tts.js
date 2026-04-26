import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

/**
 * TTS Agent - 配音 Agent
 * 基于开源项目架构: XTTS-v2, Kokoro, Piper
 * 
 * 支持的 TTS 引擎:
 * 1. XTTS-v2 (Coqui) - 语音克隆，支持17种语言
 * 2. Kokoro - 轻量级，高质量
 * 3. Piper - 本地运行，低延迟
 * 4. Cloudflare Workers AI - 云端 API
 * 5. OpenAI TTS - 官方 API
 */

const TTS_ENGINES = {
  xtts: {
    name: 'XTTS-v2',
    description: 'Coqui 语音克隆，支持17种语言',
    voice_clone: true,
    languages: ['en', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar', 'hu', 'ko', 'ja', 'hi']
  },
  kokoro: {
    name: 'Kokoro',
    description: '轻量级，本地运行',
    voice_clone: false,
    languages: ['en']
  },
  piper: {
    name: 'Piper',
    description: '本地 TTS，低延迟',
    voice_clone: false,
    languages: ['en', 'zh']
  },
  cloudflare: {
    name: 'Cloudflare Workers AI',
    description: '云端 TTS，无需本地部署',
    voice_clone: false,
    languages: ['en', 'zh']
  },
  openai: {
    name: 'OpenAI TTS',
    description: '官方 TTS API',
    voice_clone: false,
    languages: ['en', 'zh']
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
  'en-US-male-2': { engine: 'openai', voice: 'fable', lang: 'en-US', name: 'Narrative Male' },
  
  // 方言/风格
  'narration': { engine: 'openai', voice: 'nova', lang: 'en-US', name: '专业解说' },
  'documentary': { engine: 'openai', voice: 'onyx', lang: 'en-US', name: '纪录片风格' },
  'short': { engine: 'openai', voice: 'alloy', lang: 'en-US', name: '短视频风格' }
};

/**
 * 估算音频时长
 */
function estimateDuration(text, speed = 1.0) {
  // 中文平均约 400字/分钟
  // 英文平均约 150词/分钟
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  
  let words;
  if (isChinese) {
    words = text.replace(/\s/g, '').length;
    return Math.ceil((words / 400) * 60 / speed);
  } else {
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
  
  // 处理特殊字符
  text = text.replace(/([。！？])\s*/g, '$1\n');
  
  // 处理数字
  text = text.replace(/(\d+)/g, '<say-as interpret-as="cardinal">$1</say-as>');
  
  return text;
}

/**
 * 模拟 TTS 引擎
 */
async function mockTTS(text, options = {}) {
  logger.agent('TTS', `   🎤 模拟 TTS 生成...`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 生成模拟音频数据
  const audioData = Buffer.from(`MOCK_AUDIO_${options.voice || 'default'}_${Date.now()}`);
  
  return {
    audio: audioData,
    duration: estimateDuration(text, options.speed || 1.0),
    format: 'mp3',
    engine: options.engine || 'mock'
  };
}

/**
 * XTTS-v2 TTS 调用
 * 需安装: pip install TTS
 */
async function xttsTTS(text, options = {}) {
  logger.agent('TTS', `   🎤 使用 XTTS-v2...`);
  
  try {
    // TODO: 接入 XTTS-v2
    // from TTS.api import TTS
    // tts = TTS("tts_models/multilingual/multi-dataset/xtts")
    // tts.tts(text=text, speaker_wav=speaker_wav, language=lang)
    
    return await mockTTS(text, { ...options, engine: 'xtts' });
  } catch (error) {
    logger.warn(`   ⚠️ XTTS-v2 不可用: ${error.message}`);
    return await mockTTS(text, { ...options, engine: 'xtts-fallback' });
  }
}

/**
 * Kokoro TTS 调用
 */
async function kokoroTTS(text, options = {}) {
  logger.agent('TTS', `   🎤 使用 Kokoro...`);
  
  try {
    // TODO: 接入 Kokoro TTS
    // from kokoro import pipeline
    // pipeline.generate(text, voice)
    
    return await mockTTS(text, { ...options, engine: 'kokoro' });
  } catch (error) {
    logger.warn(`   ⚠️ Kokoro 不可用: ${error.message}`);
    return await mockTTS(text, { ...options, engine: 'kokoro-fallback' });
  }
}

/**
 * Piper TTS 调用
 */
async function piperTTS(text, options = {}) {
  logger.agent('TTS', `   🎤 使用 Piper...`);
  
  try {
    // TODO: 接入 Piper
    // piper-tts --model en_US-lessac-medium.onnx --text "Hello"
    
    return await mockTTS(text, { ...options, engine: 'piper' });
  } catch (error) {
    logger.warn(`   ⚠️ Piper 不可用: ${error.message}`);
    return await mockTTS(text, { ...options, engine: 'piper-fallback' });
  }
}

/**
 * Cloudflare Workers AI TTS
 */
async function cloudflareTTS(text, options = {}) {
  logger.agent('TTS', `   🎤 使用 Cloudflare Workers AI...`);
  
  const voice = options.voice || 'a1';
  
  try {
    // TODO: 接入 Cloudflare Workers AI
    // const response = await cfAI.run('@cf-speechify/tts-16k', {
    //   text: text,
    //   voice: voice
    // });
    
    return await mockTTS(text, { ...options, engine: 'cloudflare', voice });
  } catch (error) {
    logger.warn(`   ⚠️ Cloudflare 不可用: ${error.message}`);
    return await mockTTS(text, { ...options, engine: 'cloudflare-fallback' });
  }
}

/**
 * OpenAI TTS API
 */
async function openAITTS(text, options = {}) {
  logger.agent('TTS', `   🎤 使用 OpenAI TTS...`);
  
  const voice = options.voice || 'alloy';
  const model = options.model || 'tts-1';
  
  // 检查 API Key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
    logger.warn('   ⚠️ OpenAI API Key 未配置，使用模拟数据');
    return await mockTTS(text, { ...options, engine: 'openai', voice });
  }

  try {
    // TODO: 接入 OpenAI TTS API
    // const response = await openai.audio.speech.create({
    //   model: 'tts-1',
    //   voice: voice,
    //   input: text
    // });
    
    return await mockTTS(text, { ...options, engine: 'openai', voice });
  } catch (error) {
    logger.warn(`   ⚠️ OpenAI TTS 失败: ${error.message}`);
    return await mockTTS(text, { ...options, engine: 'openai-fallback' });
  }
}

/**
 * 分段处理长文本
 */
async function processLongText(text, options = {}, ttsFunction) {
  // 按句子分割
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim());
  const maxLength = 500; // 每段最大字符数
  
  const segments = [];
  let currentSegment = '';
  
  for (const sentence of sentences) {
    if ((currentSegment + sentence).length > maxLength) {
      if (currentSegment) {
        segments.push(currentSegment.trim());
      }
      currentSegment = sentence;
    } else {
      currentSegment += sentence + (sentence.endsWith('.') ? '' : '');
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
  
  // 合并音频
  return {
    audio: Buffer.concat(audioBuffers),
    duration: audioBuffers.length * 5, // 估算
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
    this.defaultEngine = 'mock'; // 默认使用模拟
  }

  /**
   * 获取可用的 TTS 引擎
   */
  getAvailableEngines() {
    return Object.entries(TTS_ENGINES).map(([key, value]) => ({
      id: key,
      ...value,
      available: false // 实际检查需要运行时
    }));
  }

  /**
   * 获取可用的语音
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
    
    // 如果是结构化脚本
    if (script.scenes) {
      return script.scenes
        .map(scene => scene.narration || '')
        .filter(Boolean)
        .join('\n\n');
    }
    
    // 如果是原始文本
    if (typeof script === 'string') return script;
    
    // 尝试从 various 字段提取
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
    logger.info(`   引擎: ${options.engine || this.defaultEngine}`);
    logger.info(`   语音: ${options.voice || '默认'}`);

    try {
      // 1. 提取解说词
      const narrationText = this.extractNarration(script);
      
      if (!narrationText) {
        throw new Error('未找到解说词');
      }
      
      logger.agent(this.name, `📝 提取解说词 ${narrationText.length} 字符`);

      // 2. 预处理文本
      const processedText = preprocessText(narrationText);
      
      // 3. 确定使用的引擎
      const engine = options.engine || this.defaultEngine;
      
      // 4. 调用 TTS
      let result;
      const ttsOptions = {
        ...options,
        engine,
        speed: options.speed || 1.0
      };

      // 根据引擎选择处理方式
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
          result = await mockTTS(processedText, ttsOptions);
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
        voice: options.voice || 'default',
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

      return { 
        success: true, 
        audioPath, 
        duration: result.duration,
        metadata,
        taskId 
      };
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
