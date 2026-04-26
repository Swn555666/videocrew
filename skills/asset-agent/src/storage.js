/**
 * Asset Storage
 * 
 * Local storage management for assets
 */

import { logger } from '../../../src/core/logger.js';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import path from 'path';

/**
 * AssetStorage Class
 */
export class AssetStorage {
  constructor(options = {}) {
    this.name = 'AssetStorage';
    this.libraryPath = options.libraryPath || './workspace/assets';
    
    // Ensure library directory exists
    if (!existsSync(this.libraryPath)) {
      mkdirSync(this.libraryPath, { recursive: true });
    }
  }

  /**
   * Search local library
   */
  async searchLocal(query, type = 'all') {
    logger.agent(this.name, `Searching local library for "${query}"`);
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Scan library directory
    await this.scanDirectory(this.libraryPath, (filePath, stats) => {
      const filename = path.basename(filePath).toLowerCase();
      
      // Check if matches query
      if (!filename.includes(queryLower)) return;
      
      // Check type
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      
      if (type !== 'all') {
        if (type === 'video' && !isVideo) return;
        if (type === 'image' && !isImage) return;
      }
      
      results.push({
        id: filePath,
        path: filePath,
        filename: path.basename(filePath),
        size: stats.size,
        assetType: isVideo ? 'video' : 'image',
        modifiedAt: stats.mtime,
        source: 'local'
      });
    });
    
    logger.info(`   Found ${results.length} local assets`);
    
    return results;
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dir, callback) {
    if (!existsSync(dir)) return;
    
    try {
      const items = readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          await this.scanDirectory(fullPath, callback);
        } else if (item.isFile()) {
          try {
            const stats = statSync(fullPath);
            callback(fullPath, stats);
          } catch (e) {
            // Skip files we can't stat
          }
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
  }

  /**
   * Get library statistics
   */
  async getStats() {
    logger.agent(this.name, `Getting library stats`);
    
    const stats = {
      totalAssets: 0,
      videos: 0,
      images: 0,
      totalSize: 0,
      byCategory: {}
    };
    
    await this.scanDirectory(this.libraryPath, (filePath, fileStats) => {
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      
      if (isVideo) {
        stats.videos++;
        stats.totalAssets++;
      } else if (isImage) {
        stats.images++;
        stats.totalAssets++;
      }
      
      stats.totalSize += fileStats.size;
    });
    
    // Format size
    if (stats.totalSize > 1024 * 1024 * 1024) {
      stats.totalSizeFormatted = `${(stats.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (stats.totalSize > 1024 * 1024) {
      stats.totalSizeFormatted = `${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      stats.totalSizeFormatted = `${(stats.totalSize / 1024).toFixed(2)} KB`;
    }
    
    logger.info(`   Total: ${stats.totalAssets} assets (${stats.totalSizeFormatted})`);
    
    return stats;
  }

  /**
   * Delete asset
   */
  async deleteAsset(filePath) {
    logger.agent(this.name, `Deleting asset ${filePath}`);
    
    if (!existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    
    try {
      unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up old assets
   */
  async cleanup(maxAgeDays = 30) {
    logger.agent(this.name, `Cleaning up assets older than ${maxAgeDays} days`);
    
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let deleted = 0;
    
    await this.scanDirectory(this.libraryPath, (filePath, stats) => {
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge) {
        try {
          unlinkSync(filePath);
          deleted++;
        } catch (e) {
          // Skip files we can't delete
        }
      }
    });
    
    logger.info(`   Deleted ${deleted} old assets`);
    
    return { deleted };
  }
}

export default AssetStorage;





