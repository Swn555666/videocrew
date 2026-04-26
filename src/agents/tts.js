import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * TTS Agent - 配音 Agent
 * 负责将文本转换为语音
 */
class TTSAgent {
  constructor() {
    this.name = 'TTS Agent';
    this.queue = 'tts';
  }

  /**
   * 生成配音
   */
  async generate(projectId, script, options = {}) {
    const taskId = taskManager.createTask(this.name, 'generate-tts', {
      projectId,
      options
    });

    logger.agent(this.name, `Starting TTS generation`);

    try {
      // 提取所有解说词
      const narrationText = this.extractNarration(script);
      
      logger.agent(this.name, `Extracted narration text`, { 
        length: narrationText.length,
        charCount: narrationText.length 
      });

      // 调用 TTS API (这里使用模拟，后续接入真实 API)
      const audioData = await this.textToSpeech(narrationText, options);

      // 保存音频
      const projectPath = storage.getProjectPath(projectId);
      const audioPath = storage.saveAudio(projectPath, audioData, 'narration.mp3');

      // 发送配音就绪消息
      messageQueue.send('tts-ready', {
        taskId,
        projectId,
        audioPath,
        duration: this.estimateDuration(narrationText)
      });

      taskManager.completeTask(taskId, { audioPath });

      logger.agent(this.name, `TTS generation completed`, { 
        taskId,
        audioPath 
      });

      return { success: true, audioPath, taskId };
    } catch (error) {
      logger.error(`TTS generation failed`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
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
   * 文字转语音
   * 后续可以接入: Cloudflare Workers AI, ElevenLabs, Azure TTS 等
   */
  async textToSpeech(text, options = {}) {
    // TODO: 接入真实 TTS API
    // 目前返回模拟数据
    
    const voice = options.voice || 'a1';
    const speed = options.speed || 1.0;

    logger.agent(this.name, `Calling TTS API (simulated)`, { voice, speed });

    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 返回模拟音频数据（实际应用中这里会是 Buffer）
    return Buffer.from('mock-audio-data');
  }

  /**
   * 估算音频时长（秒）
   */
  estimateDuration(text) {
    // 按平均语速 150字/分钟 估算
    const wordsPerMinute = 150;
    const charCount = text.replace(/\s/g, '').length;
    return Math.ceil((charCount / wordsPerMinute) * 60);
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
