import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Asset Agent - 素材 Agent
 * 基于开源项目: Pexels API, Pixabay API
 * 
 * 素材来源:
 * 1. Pexels - 免费视频/图片
 * 2. Pixabay - 免费素材库
 * 3. 本地素材库
 * 4. AI 生成 (后续扩展)
 */

const ASSET_SOURCES = {
  pexels: {
    name: 'Pexels',
    description: '免费高质量视频和图片',
    api: 'https://api.pexels.com/v1',
    requiresKey: true
  },
  pixabay: {
    name: 'Pixabay',
    description: '免费素材库',
    api: 'https://pixabay.com/api',
    requiresKey: true
  },
  local: {
    name: '本地素材库',
    description: '本地存储的素材',
    api: null,
    requiresKey: false
  }
};

/**
 * 素材类型
 */
const ASSET_TYPES = {
  video: {
    extensions: ['.mp4', '.mov', '.avi', '.webm'],
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  },
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
  }
};

/**
 * 推断素材类型
 */
function inferAssetType(description) {
  const desc = description.toLowerCase();
  
  if (desc.includes('video') || desc.includes('footage') || 
      desc.includes('画面') || desc.includes('片段')) {
    return 'video';
  }
  if (desc.includes('music') || desc.includes('audio') || 
      desc.includes('背景音乐') || desc.includes('配乐')) {
    return 'audio';
  }
  
  // 默认返回图片
  return 'image';
}

/**
 * 获取 Pexels 素材
 */
async function fetchFromPexels(query, type = 'image', perPage = 5) {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    logger.warn('   ⚠️ Pexels API Key 未配置');
    return null;
  }
  
  try {
    const endpoint = type === 'video' ? 'videos/search' : 'search';
    const url = `https://api.pexels.com/${endpoint}?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    
    logger.info(`   🔍 Pexels 搜索: ${query}`);
    
    // TODO: 实际调用 Pexels API
    // const response = await fetch(url, {
    //   headers: { Authorization: apiKey }
    // });
    // const data = await response.json();
    
    // 模拟返回
    return {
      source: 'pexels',
      type,
      query,
      results: []
    };
  } catch (error) {
    logger.error(`   ❌ Pexels API 错误: ${error.message}`);
    return null;
  }
}

/**
 * 获取 Pixabay 素材
 */
async function fetchFromPixabay(query, type = 'image', perPage = 5) {
  const apiKey = process.env.PIXABAY_API_KEY;
  
  if (!apiKey) {
    logger.warn('   ⚠️ Pixabay API Key 未配置');
    return null;
  }
  
  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${perPage}&${type === 'video' ? 'video_type=film' : 'image_type=photo'}`;
    
    logger.info(`   🔍 Pixabay 搜索: ${query}`);
    
    // TODO: 实际调用 Pixabay API
    
    return {
      source: 'pixabay',
      type,
      query,
      results: []
    };
  } catch (error) {
    logger.error(`   ❌ Pixabay API 错误: ${error.message}`);
    return null;
  }
}

/**
 * 扫描本地素材库
 */
function scanLocalLibrary(libraryPath, type, query) {
  if (!existsSync(libraryPath)) {
    return [];
  }
  
  const extensions = ASSET_TYPES[type]?.extensions || ASSET_TYPES.image.extensions;
  const queryLower = query.toLowerCase();
  
  const results = [];
  
  function scanDirectory(dir) {
    try {
      const items = readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (extensions.includes(ext)) {
            // 简单匹配：文件名包含查询关键词
            if (queryLower === '' || item.name.toLowerCase().includes(queryLower)) {
              results.push({
                path: fullPath,
                name: item.name,
                type,
                source: 'local'
              });
            }
          }
        }
      }
    } catch (error) {
      // 忽略权限错误
    }
  }
  
  scanDirectory(libraryPath);
  return results.slice(0, 10); // 最多返回10个
}

/**
 * 模拟素材搜索（测试用）
 */
async function mockSearch(query, type, count = 5) {
  logger.info(`   🔍 模拟素材搜索: ${query} (${type})`);
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const assets = [];
  for (let i = 0; i < count; i++) {
    assets.push({
      id: `mock_${Date.now()}_${i}`,
      description: query,
      type,
      source: 'mock',
      url: null,
      thumbnail: null,
      duration: type === 'video' ? Math.floor(Math.random() * 30) + 10 : null,
      resolution: type !== 'audio' ? `${1920 + Math.floor(Math.random() * 2) * 1920}x${1080}` : null
    });
  }
  
  return assets;
}

/**
 * 下载素材
 */
async function downloadAsset(asset, destPath) {
  if (!asset.url) {
    // 本地素材直接复制
    if (asset.path && existsSync(asset.path)) {
      const fs = await import('fs');
      fs.copyFileSync(asset.path, destPath);
      return destPath;
    }
    return null;
  }
  
  try {
    logger.info(`   ⬇️ 下载: ${asset.url}`);
    
    // TODO: 实际下载
    // const response = await fetch(asset.url);
    // const buffer = await response.arrayBuffer();
    // fs.writeFileSync(destPath, Buffer.from(buffer));
    
    return destPath;
  } catch (error) {
    logger.error(`   ❌ 下载失败: ${error.message}`);
    return null;
  }
}

/**
 * Asset Agent 主类
 */
class AssetAgent {
  constructor() {
    this.name = 'Asset Agent';
    this.queue = 'asset';
    this.localLibraryPath = './workspace/assets'; // 本地素材库路径
  }

  /**
   * 获取支持的素材源
   */
  getSources() {
    return Object.entries(ASSET_SOURCES).map(([id, config]) => ({
      id,
      ...config,
      configured: id === 'local' || 
                  (id === 'pexels' && !!process.env.PEXELS_API_KEY) ||
                  (id === 'pixabay' && !!process.env.PIXABAY_API_KEY)
    }));
  }

  /**
   * 收集素材
   */
  async collect(projectId, assetsNeeded, script) {
    const taskId = taskManager.createTask(this.name, 'collect-assets', {
      projectId,
      assetCount: assetsNeeded?.length || 0
    });

    logger.agent(this.name, `📦 开始素材收集`);
    logger.info(`   需要素材: ${assetsNeeded?.length || 0} 项`);

    try {
      const collectedAssets = [];
      
      // 如果没有指定素材需求，从脚本中提取
      if (!assetsNeeded || assetsNeeded.length === 0) {
        assetsNeeded = this.extractAssetNeeds(script);
      }
      
      // 按场景分组收集
      const assetsByScene = {};
      
      for (const assetReq of assetsNeeded) {
        const { sceneId, asset, priority } = assetReq;
        
        logger.agent(this.name, `   🔍 场景${sceneId}: ${asset}`);
        
        // 推断素材类型
        const assetType = inferAssetType(asset);
        
        // 搜索素材
        let searchResults = await this.searchAssets(asset, assetType);
        
        if (searchResults.length > 0) {
          const selectedAsset = searchResults[0]; // 选择第一个
          selectedAsset.sceneId = sceneId;
          selectedAsset.priority = priority;
          selectedAsset.query = asset;
          
          // 下载素材
          const projectPath = storage.getProjectPath(projectId);
          const assetDir = path.join(projectPath, 'raw', `scene_${sceneId}`);
          
          if (!existsSync(assetDir)) {
            mkdirSync(assetDir, { recursive: true });
          }
          
          const ext = ASSET_TYPES[assetType]?.extensions?.[0] || '.mp4';
          const destPath = path.join(assetDir, `${assetType}_${Date.now()}${ext}`);
          
          const downloadedPath = await downloadAsset(selectedAsset, destPath);
          
          if (downloadedPath) {
            selectedAsset.localPath = downloadedPath;
            selectedAsset.downloaded = true;
          }
          
          if (!assetsByScene[sceneId]) {
            assetsByScene[sceneId] = [];
          }
          assetsByScene[sceneId].push(selectedAsset);
          collectedAssets.push(selectedAsset);
          
          logger.info(`   ✅ 素材就绪: ${asset} (${assetType})`);
        } else {
          logger.warn(`   ⚠️ 未找到素材: ${asset}`);
          collectedAssets.push({
            sceneId,
            asset,
            query: asset,
            type: assetType,
            priority,
            source: 'none',
            found: false
          });
        }
      }

      // 保存素材清单
      const projectPath = storage.getProjectPath(projectId);
      const manifest = {
        projectId,
        collected: collectedAssets.length,
        total: assetsNeeded.length,
        assets: collectedAssets,
        byScene: assetsByScene,
        createdAt: new Date().toISOString()
      };
      
      const manifestPath = path.join(projectPath, 'assets-manifest.json');
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      logger.agent(this.name, `✅ 素材收集完成`, { 
        collected: collectedAssets.length,
        total: assetsNeeded.length
      });

      // 发送完成消息
      messageQueue.send('assets-ready', {
        taskId,
        projectId,
        assets: collectedAssets,
        assetsPath: manifestPath
      });

      taskManager.completeTask(taskId, { assets: collectedAssets, assetsPath: manifestPath });

      return { success: true, assets: collectedAssets, assetsPath: manifestPath, taskId };
    } catch (error) {
      logger.error(`❌ 素材收集失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 搜索素材
   */
  async searchAssets(query, type = 'image') {
    const results = [];
    
    // 1. 先检查本地素材库
    const localResults = scanLocalLibrary(this.localLibraryPath, type, query);
    if (localResults.length > 0) {
      results.push(...localResults);
      logger.info(`   📁 本地素材库: 找到 ${localResults.length} 个`);
    }
    
    // 2. 如果本地不够，搜索 Pexels
    if (results.length < 3) {
      const pexelsResults = await fetchFromPexels(query, type, 5);
      if (pexelsResults?.results) {
        results.push(...pexelsResults.results);
      }
    }
    
    // 3. 搜索 Pixabay
    if (results.length < 3) {
      const pixabayResults = await fetchFromPixabay(query, type, 5);
      if (pixabayResults?.results) {
        results.push(...pixabayResults.results);
      }
    }
    
    // 4. 如果都没有，使用模拟数据
    if (results.length === 0) {
      return await mockSearch(query, type, 3);
    }
    
    return results.slice(0, 5);
  }

  /**
   * 从脚本中提取素材需求
   */
  extractAssetNeeds(script) {
    const assetsNeeded = [];
    
    if (!script?.scenes) return assetsNeeded;
    
    script.scenes.forEach(scene => {
      if (scene.assets_needed) {
        scene.assets_needed.forEach(asset => {
          assetsNeeded.push({
            sceneId: scene.id,
            asset,
            priority: 'medium'
          });
        });
      }
    });
    
    return assetsNeeded;
  }

  /**
   * 处理素材请求
   */
  async handleAssetRequest(message) {
    const { projectId, assetsNeeded, script } = message.payload;
    return this.collect(projectId, assetsNeeded, script);
  }
}

export const assetAgent = new AssetAgent();
export default assetAgent;
