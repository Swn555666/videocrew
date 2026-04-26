/**
 * Asset Agent Skill
 * 
 * Based on PyPexels (salvoventura/pypexels) architecture
 * 
 * Features:
 * - Multi-source search (Pexels, Pixabay, Local)
 * - Video and image search
 * - Download management
 * - Classification and tagging
 */

import { logger } from '../../../src/core/logger.js';
import { PexelsProvider } from './providers/pexels.js';
import { PixabayProvider } from './providers/pixabay.js';
import { AssetDownloader } from './downloader.js';
import { AssetClassifier } from './classifier.js';
import { AssetStorage } from './storage.js';

/**
 * AssetSkill Main Class
 */
export class AssetSkill {
  constructor(options = {}) {
    this.name = 'AssetSkill';
    
    // API Keys
    this.pexelsApiKey = options.pexelsApiKey || process.env.PEXELS_API_KEY;
    this.pixabayApiKey = options.pixabayApiKey || process.env.PIXABAY_API_KEY;
    
    // Local storage path
    this.localLibrary = options.localLibrary || './workspace/assets';
    
    // Initialize providers
    this.providers = {};
    if (this.pexelsApiKey) {
      this.providers.pexels = new PexelsProvider({ apiKey: this.pexelsApiKey });
    }
    if (this.pixabayApiKey) {
      this.providers.pixabay = new PixabayProvider({ apiKey: this.pixabayApiKey });
    }
    
    // Initialize components
    this.downloader = new AssetDownloader();
    this.classifier = new AssetClassifier();
    this.storage = new AssetStorage({ libraryPath: this.localLibrary });
  }

  /**
   * Search for assets (videos and images)
   */
  async search(query, options = {}) {
    const { type = 'all', limit = 10 } = options;
    
    logger.info(`AssetSkill: Searching for "${query}"`, { type, limit });
    
    const results = {
      query,
      type,
      results: []
    };
    
    // Search videos
    if (type === 'all' || type === 'video') {
      try {
        const videos = await this.searchVideos(query, { ...options, perPage: limit });
        results.results.push(...videos.map(v => ({ ...v, assetType: 'video' })));
      } catch (e) {
        logger.warn(`Video search failed: ${e.message}`);
      }
    }
    
    // Search images
    if (type === 'all' || type === 'image') {
      try {
        const images = await this.searchImages(query, { ...options, perPage: limit });
        results.results.push(...images.map(i => ({ ...i, assetType: 'image' })));
      } catch (e) {
        logger.warn(`Image search failed: ${e.message}`);
      }
    }
    
    logger.info(`AssetSkill: Found ${results.results.length} results`);
    
    return results;
  }

  /**
   * Search for videos
   */
  async searchVideos(query, options = {}) {
    logger.info(`AssetSkill: Searching videos for "${query}"`);
    
    const results = [];
    
    // Search Pexels
    if (this.providers.pexels) {
      try {
        const pexelsResults = await this.providers.pexels.videosSearch(query, options);
        results.push(...pexelsResults);
        logger.info(`   Pexels: ${pexelsResults.length} videos`);
      } catch (e) {
        logger.warn(`   Pexels search failed: ${e.message}`);
      }
    }
    
    // Search Pixabay
    if (this.providers.pixabay) {
      try {
        const pixabayResults = await this.providers.pixabay.videosSearch(query, options);
        results.push(...pixabayResults);
        logger.info(`   Pixabay: ${pixabayResults.length} videos`);
      } catch (e) {
        logger.warn(`   Pixabay search failed: ${e.message}`);
      }
    }
    
    // Search local
    try {
      const localResults = await this.storage.searchLocal(query, 'video');
      results.push(...localResults);
      logger.info(`   Local: ${localResults.length} videos`);
    } catch (e) {
      // Ignore local search errors
    }
    
    return results;
  }

  /**
   * Search for images
   */
  async searchImages(query, options = {}) {
    logger.info(`AssetSkill: Searching images for "${query}"`);
    
    const results = [];
    
    // Search Pexels
    if (this.providers.pexels) {
      try {
        const pexelsResults = await this.providers.pexels.search(query, options);
        results.push(...pexelsResults);
        logger.info(`   Pexels: ${pexelsResults.length} images`);
      } catch (e) {
        logger.warn(`   Pexels search failed: ${e.message}`);
      }
    }
    
    // Search Pixabay
    if (this.providers.pixabay) {
      try {
        const pixabayResults = await this.providers.pixabay.search(query, options);
        results.push(...pixabayResults);
        logger.info(`   Pixabay: ${pixabayResults.length} images`);
      } catch (e) {
        logger.warn(`   Pixabay search failed: ${e.message}`);
      }
    }
    
    // Search local
    try {
      const localResults = await this.storage.searchLocal(query, 'image');
      results.push(...localResults);
      logger.info(`   Local: ${localResults.length} images`);
    } catch (e) {
      // Ignore local search errors
    }
    
    return results;
  }

  /**
   * Download an asset
   */
  async download(asset, options = {}) {
    const { outputDir = './workspace/downloads' } = options;
    
    logger.info(`AssetSkill: Downloading ${asset.assetType || 'asset'}`);
    logger.info(`   ID: ${asset.id || asset.url}`);
    
    try {
      const result = await this.downloader.download(asset, outputDir);
      logger.info(`AssetSkill: Downloaded to ${result.path}`);
      return result;
    } catch (error) {
      logger.error(`AssetSkill: Download failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Download multiple assets
   */
  async downloadBatch(assets, options = {}) {
    const { outputDir = './workspace/downloads', parallel = 3 } = options;
    
    logger.info(`AssetSkill: Downloading batch of ${assets.length} assets`);
    
    const results = [];
    let completed = 0;
    
    // Process in parallel batches
    for (let i = 0; i < assets.length; i += parallel) {
      const batch = assets.slice(i, i + parallel);
      const batchResults = await Promise.all(
        batch.map(asset => this.download(asset, { outputDir }))
      );
      results.push(...batchResults);
      
      completed += batch.length;
      logger.info(`   Progress: ${completed}/${assets.length}`);
    }
    
    const successful = results.filter(r => r.success).length;
    logger.info(`AssetSkill: Batch complete - ${successful}/${assets.length} successful`);
    
    return {
      total: assets.length,
      successful,
      failed: assets.length - successful,
      results
    };
  }

  /**
   * Classify an asset
   */
  classify(asset) {
    return this.classifier.classify(asset);
  }

  /**
   * Get local library stats
   */
  async getLibraryStats() {
    return this.storage.getStats();
  }

  /**
   * Get available providers
   */
  getProviders() {
    return {
      pexels: !!this.pexelsApiKey,
      pixabay: !!this.pixabayApiKey,
      local: true
    };
  }
}

export default AssetSkill;





