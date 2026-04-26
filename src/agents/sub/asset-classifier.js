/**
 * Sub-Agent: Asset Classifier
 * 负责分类和管理素材
 * 
 * 功能:
 * - 素材类型分类
 * - 场景匹配
 * - 标签生成
 */
import { logger } from '../../core/logger.js';

export class AssetClassifier {
  constructor() {
    this.name = 'Asset Classifier';
  }

  /**
   * 分类素材
   */
  classify(asset) {
    logger.agent(this.name, `🏷️ 分类: ${asset.description}`);
    
    const type = this.detectType(asset);
    const tags = this.generateTags(asset);
    const sceneMatch = this.matchScene(asset);
    
    return {
      ...asset,
      type,
      tags,
      sceneMatch,
      quality: this.assessQuality(asset),
      usage: this.suggestUsage(asset)
    };
  }

  /**
   * 检测素材类型
   */
  detectType(asset) {
    const desc = (asset.description || '').toLowerCase();
    
    if (desc.includes('video') || desc.includes('footage') || desc.includes('画面')) {
      return 'video';
    }
    if (desc.includes('music') || desc.includes('audio') || desc.includes('配乐')) {
      return 'audio';
    }
    
    return 'image';
  }

  /**
   * 生成标签
   */
  generateTags(asset) {
    const desc = asset.description || '';
    
    // TODO: 接入 LLM 或使用关键词提取
    const tags = [];
    
    // 简单关键词提取
    const keywords = ['自然', '城市', '人物', '科技', '商业', '教育'];
    for (const kw of keywords) {
      if (desc.includes(kw)) {
        tags.push(kw);
      }
    }
    
    return tags.length > 0 ? tags : ['通用'];
  }

  /**
   * 匹配场景
   */
  matchScene(asset) {
    // TODO: 根据素材内容匹配最合适的场景
    
    return {
      bestScene: null,
      confidence: 0
    };
  }

  /**
   * 评估质量
   */
  assessQuality(asset) {
    // TODO: 根据分辨率、大小等评估
    
    return {
      score: 8,
      resolution: '1920x1080',
      notes: '高清'
    };
  }

  /**
   * 建议用途
   */
  suggestUsage(asset) {
    const type = asset.type;
    
    const suggestions = {
      video: ['剪辑素材', '背景画面', '过渡片段'],
      image: ['封面图', '插图', '字幕背景'],
      audio: ['背景音乐', '配音', '音效']
    };
    
    return suggestions[type] || ['通用'];
  }
}

export default new AssetClassifier();
