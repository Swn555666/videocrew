import path from 'path';
import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * Asset Agent - 素材 Agent
 * 负责收集和管理视频/图片素材
 */
class AssetAgent {
  constructor() {
    this.name = 'Asset Agent';
    this.queue = 'asset';
  }

  /**
   * 收集素材
   */
  async collect(projectId, assetsNeeded, script) {
    const taskId = taskManager.createTask(this.name, 'collect-assets', {
      projectId,
      assetCount: assetsNeeded.length
    });

    logger.agent(this.name, `Starting asset collection`, { 
      taskId, 
      count: assetsNeeded.length 
    });

    try {
      const collectedAssets = [];

      // 按场景分组收集素材
      for (const assetReq of assetsNeeded) {
        const asset = await this.findAsset(assetReq);
        if (asset) {
          collectedAssets.push(asset);
        }
      }

      // 保存素材清单
      const projectPath = storage.getProjectPath(projectId);
      const manifestPath = path.join(projectPath, 'assets-manifest.json');
      
      // 写入素材清单
      const fs = await import('fs');
      fs.writeFileSync(manifestPath, JSON.stringify(collectedAssets, null, 2));

      // 发送素材就绪消息
      messageQueue.send('assets-ready', {
        taskId,
        projectId,
        assets: collectedAssets
      });

      taskManager.completeTask(taskId, { assets: collectedAssets });

      logger.agent(this.name, `Asset collection completed`, { 
        taskId,
        collected: collectedAssets.length,
        total: assetsNeeded.length
      });

      return { success: true, assets: collectedAssets, assetsPath: manifestPath, taskId };
    } catch (error) {
      logger.error(`Asset collection failed`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 查找素材
   * TODO: 接入 Pexels API / Pixabay API / 本地素材库
   */
  async findAsset(assetReq) {
    const { sceneId, asset, priority } = assetReq;

    logger.agent(this.name, `Finding asset for scene ${sceneId}`, { 
      description: asset,
      priority 
    });

    // 模拟素材搜索
    await new Promise(resolve => setTimeout(resolve, 200));

    // 返回模拟素材路径（实际应用中会调用素材 API）
    return {
      sceneId,
      description: asset,
      priority,
      path: null, // 无本地路径，需要下载
      source: 'pexels',
      url: null,
      type: this.inferAssetType(asset)
    };
  }

  /**
   * 根据描述推断素材类型
   */
  inferAssetType(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('video') || desc.includes('footage') || desc.includes('画面')) {
      return 'video';
    }
    if (desc.includes('image') || desc.includes('photo') || desc.includes('图片')) {
      return 'image';
    }
    if (desc.includes('music') || desc.includes('audio') || desc.includes('背景音乐')) {
      return 'audio';
    }
    
    return 'image'; // 默认为图片
  }

  /**
   * 下载素材
   */
  async downloadAsset(url, projectId) {
    logger.agent(this.name, `Downloading asset`, { url, projectId });
    
    // TODO: 实现素材下载
    // 后续接入 Pexels API
    
    return null;
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
