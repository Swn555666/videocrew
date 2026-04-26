/**
 * Sub-Agent: Asset Search Agent
 * 负责搜索素材
 * 
 * 支持来源:
 * - Pexels (视频/图片)
 * - Pixabay (视频/图片/音乐)
 * - 本地素材库
 * - AI 生成 (后续)
 */
import { logger } from '../../core/logger.js';

const ASSET_TYPES = {
  video: { extensions: ['.mp4', '.mov', '.avi'] },
  image: { extensions: ['.jpg', '.png', '.webp'] },
  audio: { extensions: ['.mp3', '.wav', '.ogg'] }
};

export class AssetSearchAgent {
  constructor() {
    this.name = 'Asset Search Agent';
  }

  /**
   * 搜索素材
   */
  async search(query, type = 'image', count = 5) {
    logger.agent(this.name, `🔍 搜索: ${query} (${type})`);
    
    // 确定搜索来源
    const sources = this.determineSources(query, type);
    
    const results = [];
    
    for (const source of sources) {
      const sourceResults = await this.searchSource(source, query, type, count);
      results.push(...sourceResults);
    }
    
    // 去重
    const unique = this.deduplicate(results);
    
    logger.agent(this.name, `✅ 找到 ${unique.length} 个素材`);
    
    return unique.slice(0, count);
  }

  /**
   * 确定搜索来源
   */
  determineSources(query, type) {
    // TODO: 根据素材类型和查询词选择来源
    // - Pexels 适合高质量视频
    // - Pixabay 适合多种类型
    // - 本地适合已有素材
    
    const sources = ['local']; // 默认先搜本地
    
    // 如果本地没有足够结果，添加在线源
    if (!query.includes('已有') && !query.includes('本地')) {
      sources.push('pexels');
      sources.push('pixabay');
    }
    
    return sources;
  }

  /**
   * 从特定来源搜索
   */
  async searchSource(source, query, type, count) {
    switch (source) {
      case 'pexels':
        return this.searchPexels(query, type, count);
      case 'pixabay':
        return this.searchPixabay(query, type, count);
      case 'local':
        return this.searchLocal(query, type, count);
      default:
        return [];
    }
  }

  /**
   * 搜索 Pexels
   */
  async searchPexels(query, type, count) {
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey) {
      logger.warn('⚠️ Pexels API Key 未配置');
      return [];
    }
    
    logger.agent(this.name, `📷 Pexels: ${query}`);
    
    // TODO: 接入 Pexels API
    // GET https://api.pexels.com/v1/search?query=${query}&per_page=${count}
    
    return [];
  }

  /**
   * 搜索 Pixabay
   */
  async searchPixabay(query, type, count) {
    const apiKey = process.env.PIXABAY_API_KEY;
    
    if (!apiKey) {
      logger.warn('⚠️ Pixabay API Key 未配置');
      return [];
    }
    
    logger.agent(this.name, `🖼️ Pixabay: ${query}`);
    
    // TODO: 接入 Pixabay API
    
    return [];
  }

  /**
   * 搜索本地素材库
   */
  async searchLocal(query, type, count) {
    logger.agent(this.name, `📁 本地素材库: ${query}`);
    
    // TODO: 扫描本地素材目录
    // const libraryPath = './workspace/assets';
    // 扫描匹配的文件
    
    return [];
  }

  /**
   * 去重
   */
  deduplicate(results) {
    const seen = new Set();
    return results.filter(r => {
      const key = r.url || r.path;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export default new AssetSearchAgent();
