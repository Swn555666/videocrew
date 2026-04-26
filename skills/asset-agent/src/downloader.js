/**
 * Asset Downloader
 * 
 * Handles downloading assets from various sources:
 * - Pexels API (video, image)
 * - Pixabay API (video, image)
 * - Direct URLs (free sources)
 * - Archive.org (public domain videos)
 */

import { logger } from '../../../videocrew/src/core/logger.js';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

/**
 * AssetDownloader Class
 */
export class AssetDownloader {
  constructor(options = {}) {
    this.name = 'AssetDownloader';
    this.pexelsApiKey = options.pexelsApiKey || process.env.PEXELS_API_KEY;
    this.pixabayApiKey = options.pixabayApiKey || process.env.PIXABAY_API_KEY;
  }

  /**
   * Download an asset from URL
   */
  async downloadFromUrl(url, outputPath, options = {}) {
    const { timeout = 60000, retries = 3 } = options;
    
    logger.agent(this.name, `Downloading from: ${url.substring(0, 80)}...`);
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = writeFileSync(outputPath, Buffer.alloc(0));
      
      let resolved = false;
      const doRequest = () => {
        const req = protocol.get(url, { timeout }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            // Follow redirect
            const redirectUrl = res.headers.location;
            logger.info(`Following redirect to: ${redirectUrl.substring(0, 60)}...`);
            resolved = false;
            res.destroy();
            url = redirectUrl;
            doRequest();
            return;
          }
          
          if (res.statusCode !== 200) {
            if (!resolved) { resolved = true; reject(new Error(`HTTP ${res.statusCode}`)); }
            return;
          }
          
          const total = parseInt(res.headers['content-length'] || '0');
          let downloaded = 0;
          
          const writeStream = require('fs').createWriteStream(outputPath);
          
          res.on('data', (chunk) => {
            downloaded += chunk.length;
            writeStream.write(chunk);
          });
          
          res.on('end', () => {
            writeStream.end();
            if (!resolved) {
              resolved = true;
              const stats = statSync(outputPath);
              logger.info(`Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              resolve({ success: true, path: outputPath, size: stats.size });
            }
          });
          
          res.on('error', (err) => {
            writeStream.end();
            if (!resolved) { resolved = true; reject(err); }
          });
        });
        
        req.on('error', (err) => {
          if (!resolved) { resolved = true; reject(err); }
        });
        
        req.on('timeout', () => {
          req.destroy();
          if (!resolved) { resolved = true; reject(new Error('Download timeout')); }
        });
      };
      
      doRequest();
    });
  }

  /**
   * Download an asset
   */
  async download(asset, outputDir = './downloads') {
    logger.agent(this.name, `Downloading asset ${asset.id || asset.url}`);
    
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Determine file URL and extension
    const { url, extension } = this.getDownloadInfo(asset);
    
    // Generate filename
    const filename = `${asset.assetType || 'asset'}_${asset.id || Date.now()}.${extension}`;
    const outputPath = path.join(outputDir, filename);
    
    if (!url) {
      logger.error(`AssetDownloader: No download URL found`);
      return { success: false, error: 'No download URL found' };
    }
    
    try {
      const result = await this.downloadFromUrl(url, outputPath);
      
      logger.info(`AssetDownloader: Saved to ${outputPath}`);
      
      return {
        success: true,
        path: outputPath,
        filename,
        size: result.size,
        asset
      };
    } catch (error) {
      logger.error(`AssetDownloader: Download failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get download info from asset
   */
  getDownloadInfo(asset) {
    let url = null;
    let fileUrl = null;
    let extension = 'mp4'; // Default
    
    if (asset.assetType === 'video') {
      // Video asset
      if (asset.videoFiles && asset.videoFiles.length > 0) {
        // Pexels format
        const best = asset.videoFiles.reduce((prev, curr) => 
          (curr.width || 0) > (prev.width || 0) ? curr : prev
        );
        url = best.link;
      } else if (asset.videos && asset.videos.medium) {
        // Pixabay format
        url = asset.videos.medium.url;
      } else if (asset.url) {
        url = asset.url;
      }
      extension = 'mp4';
    } else {
      // Image asset
      if (asset.src) {
        // Pexels format
        url = asset.src.large || asset.src.original || asset.src.medium;
      } else if (asset.largeUrl || asset.webformatURL) {
        // Pixabay format
        url = asset.largeUrl || asset.webformatURL;
      } else if (asset.url) {
        url = asset.url;
      }
      extension = 'jpg';
    }
    
    return { url, fileUrl, extension };
  }

  /**
   * Mock download for testing
   */
  async mockDownload(outputPath) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockData = Buffer.from(`MOCK_ASSET_${Date.now()}`);
    writeFileSync(outputPath, mockData);
  }

  /**
   * Download with progress callback
   */
  async downloadWithProgress(asset, outputDir, onProgress) {
    const result = await this.download(asset, outputDir);
    
    if (onProgress && result.success) {
      onProgress({ loaded: 100, total: 100, percentage: 100 });
    }
    
    return result;
  }

  /**
   * Validate downloaded file
   */
  async validate(filePath, expectedSize) {
    if (!existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }
    
    const stats = statSync(filePath);
    if (expectedSize && Math.abs(stats.size - expectedSize) > 1024) {
      return { valid: false, error: 'Size mismatch', actual: stats.size, expected: expectedSize };
    }
    
    return { valid: true, size: stats.size };
  }

  /**
   * Search Pexels for videos
   */
  async searchPexelsVideos(query, options = {}) {
    const { perPage = 10, orientation = 'landscape' } = options;
    
    if (!this.pexelsApiKey) {
      logger.warn(`Pexels API key not configured`);
      return { videos: [], error: 'API key required' };
    }
    
    logger.agent(this.name, `Searching Pexels: ${query}`);
    
    return new Promise((resolve, reject) => {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`;
      
      const req = https.get(url, {
        headers: { 'Authorization': this.pexelsApiKey },
        rejectUnauthorized: false
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.videos) {
              logger.info(`Found ${json.videos.length} Pexels videos`);
              resolve({ videos: json.videos, total: json.total_results });
            } else {
              reject(new Error(json.code || 'Pexels API error'));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
    });
  }

  /**
   * Search Pixabay for videos
   */
  async searchPixabayVideos(query, options = {}) {
    const { perPage = 10, videoType = 'film' } = options;
    
    if (!this.pixabayApiKey) {
      logger.warn(`Pixabay API key not configured`);
      return { videos: [], error: 'API key required' };
    }
    
    logger.agent(this.name, `Searching Pixabay: ${query}`);
    
    return new Promise((resolve, reject) => {
      const url = `https://pixabay.com/api/videos/?key=${this.pixabayApiKey}&q=${encodeURIComponent(query)}&per_page=${perPage}&video_type=${videoType}`;
      
      const req = https.get(url, { rejectUnauthorized: false }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.hits) {
              logger.info(`Found ${json.hits.length} Pixabay videos`);
              resolve({ videos: json.hits, total: json.totalHits });
            } else {
              reject(new Error('Pixabay API error'));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
    });
  }

  /**
   * Search Archive.org for public domain videos
   */
  async searchArchiveVideos(query, options = {}) {
    const { perPage = 10 } = options;
    
    logger.agent(this.name, `Searching Archive.org: ${query}`);
    
    return new Promise((resolve, reject) => {
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:movies&fl[]=identifier,title,description,downloads&output=json&rows=${perPage}`;
      
      const req = https.get(url, { rejectUnauthorized: false }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const items = json.response?.docs || [];
            const videos = items.map(item => ({
              id: item.identifier,
              title: item.title,
              description: item.description,
              downloads: item.downloads,
              url: `https://archive.org/download/${item.identifier}/${item.identifier}.mp4`
            }));
            logger.info(`Found ${videos.length} Archive.org videos`);
            resolve({ videos, total: items.length });
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
    });
  }

  /**
   * Get free wildlife/nature video URLs
   * Returns curated list of public domain animal videos
   */
  async getFreeWildlifeVideos() {
    logger.agent(this.name, `Getting free wildlife videos`);
    
    // Curated list of public domain wildlife videos from Archive.org
    const wildlifeVideos = [
      { id: 'animals_100', title: 'Animals - Short Collection', url: 'https://archive.org/download/animals/animals_512kb.mp4', duration: 60 },
      { id: 'wildlife', title: 'Wildlife Documentary', url: 'https://archive.org/download/Wildlife.Video.Disc.2013.WSPSP/sample_512kb.mp4', duration: 120 },
    ];
    
    return { videos: wildlifeVideos };
  }
}

export default AssetDownloader;





