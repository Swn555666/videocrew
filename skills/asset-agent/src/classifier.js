/**
 * Asset Classifier
 * 
 * Handles asset classification and tagging
 */

import { logger } from '../../../src/core/logger.js';

/**
 * AssetClassifier Class
 */
export class AssetClassifier {
  constructor() {
    this.name = 'AssetClassifier';
    
    // Common categories
    this.categories = [
      'nature', 'technology', 'business', 'people',
      'feelings', 'education', 'food', 'health',
      'industry', 'computer', 'music', 'transport'
    ];
  }

  /**
   * Classify an asset
   */
  classify(asset) {
    logger.agent(this.name, `Classifying asset ${asset.id}`);
    
    const tags = this.extractTags(asset);
    const category = this.predictCategory(tags);
    const quality = this.assessQuality(asset);
    const usage = this.suggestUsage(asset);
    
    return {
      ...asset,
      tags,
      category,
      quality,
      usage,
      classified: true,
      classifiedAt: new Date().toISOString()
    };
  }

  /**
   * Extract tags from asset
   */
  extractTags(asset) {
    const tags = new Set();
    
    // From tags field
    if (asset.tags) {
      const tagList = typeof asset.tags === 'string' 
        ? asset.tags.split(',') 
        : asset.tags;
      tagList.forEach(tag => tags.add(tag.trim().toLowerCase()));
    }
    
    // From description
    if (asset.description) {
      this.extractKeywords(asset.description).forEach(k => tags.add(k));
    }
    
    // From URL
    if (asset.url) {
      this.extractKeywords(asset.url).forEach(k => tags.add(k));
    }
    
    // Asset type
    tags.add(asset.assetType || 'unknown');
    
    return Array.from(tags).slice(0, 10);
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    if (!text) return [];
    
    // Simple keyword extraction
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = ['https', 'http', 'www', 'com', 'org', 'net', 'html'];
    
    return words
      .filter(w => !stopWords.includes(w))
      .slice(0, 5);
  }

  /**
   * Predict category
   */
  predictCategory(tags) {
    if (!tags || tags.length === 0) return 'other';
    
    const tagStr = tags.join(' ').toLowerCase();
    
    for (const category of this.categories) {
      if (tagStr.includes(category)) {
        return category;
      }
    }
    
    return 'other';
  }

  /**
   * Assess quality
   */
  assessQuality(asset) {
    // Check resolution
    const width = asset.width || 0;
    const height = asset.height || 0;
    
    let score = 5;
    let quality = 'medium';
    
    if (width >= 1920 && height >= 1080) {
      score = 9;
      quality = 'high';
    } else if (width >= 1280 && height >= 720) {
      score = 7;
      quality = 'medium-high';
    } else if (width >= 640 && height >= 480) {
      score = 5;
      quality = 'medium';
    } else {
      score = 3;
      quality = 'low';
    }
    
    return {
      score,
      quality,
      resolution: `${width}x${height}`
    };
  }

  /**
   * Suggest usage
   */
  suggestUsage(asset) {
    const suggestions = [];
    const type = asset.assetType;
    
    if (type === 'video') {
      suggestions.push('Video editing');
      suggestions.push('Background footage');
      suggestions.push('B-roll');
    } else {
      suggestions.push('Thumbnail');
      suggestions.push('Cover image');
      suggestions.push('Social media');
    }
    
    // Add category-based suggestions
    const category = this.predictCategory(this.extractTags(asset));
    switch (category) {
      case 'nature':
        suggestions.push('Documentary');
        suggestions.push('Education');
        break;
      case 'technology':
        suggestions.push('Tech review');
        suggestions.push('Tutorial');
        break;
      case 'business':
        suggestions.push('Presentation');
        suggestions.push('Pitch deck');
        break;
    }
    
    return suggestions;
  }
}

export default AssetClassifier;





