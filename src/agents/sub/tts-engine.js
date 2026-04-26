/**
 * Sub-Agent: TTS Engine Selector
 * 负责选择和管理 TTS 引擎
 * 
 * 支持的引擎:
 * - XTTS-v2 (语音克隆)
 * - Kokoro (轻量)
 * - Piper (本地低延迟)
 * - Cloudflare Workers AI (云端)
 * - OpenAI TTS (官方)
 */
import { logger } from '../../core/logger.js';

const TTS_ENGINES = {
  xtts: { name: 'XTTS-v2', clone: true, langs: 17 },
  kokoro: { name: 'Kokoro', clone: false, langs: 1 },
  piper: { name: 'Piper', clone: false, langs: 2 },
  cloudflare: { name: 'Cloudflare', clone: false, langs: 2 },
  openai: { name: 'OpenAI TTS', clone: false, langs: 1 }
};

export class TTSEngineSelector {
  constructor() {
    this.name = 'TTS Engine Selector';
    this.currentEngine = null;
  }

  /**
   * 选择最佳引擎
   */
  selectEngine(options = {}) {
    const { voiceClone = false, language = 'zh', quality = 'high' } = options;
    
    logger.agent(this.name, `🎯 选择引擎: clone=${voiceClone}, lang=${language}`);
    
    // 如果需要语音克隆，只能用 XTTS
    if (voiceClone) {
      this.currentEngine = 'xtts';
      return 'xtts';
    }
    
    // 根据语言选择
    if (language === 'zh') {
      this.currentEngine = 'cloudflare'; // Cloudflare 中文支持好
    } else {
      this.currentEngine = 'openai'; // OpenAI 英文质量高
    }
    
    // 根据质量选择
    if (quality === 'high' && !voiceClone) {
      this.currentEngine = 'xtts'; // XTTS 质量最好
    }
    
    logger.agent(this.name, `✅ 选择: ${TTS_ENGINES[this.currentEngine]?.name}`);
    
    return this.currentEngine;
  }

  /**
   * 获取引擎配置
   */
  getEngineConfig(engineId) {
    return TTS_ENGINES[engineId] || TTS_ENGINES.openai;
  }

  /**
   * 列出可用引擎
   */
  listEngines() {
    return Object.entries(TTS_ENGINES).map(([id, config]) => ({
      id,
      ...config
    }));
  }
}

export default new TTSEngineSelector();
