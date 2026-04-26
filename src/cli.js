import { directorAgent } from './agents/director.js';
import { logger } from './core/logger.js';
import { taskManager } from './core/taskManager.js';
import { messageQueue } from './core/messageQueue.js';
import { storage } from './utils/storage.js';

/**
 * VideoCrew CLI
 * 命令行入口
 */
class VideoCrewCLI {
  constructor() {
    this.director = directorAgent;
  }

  /**
   * 创建视频
   */
  async create(topic, options = {}) {
    const { type = 'documentary', duration = 180 } = options;

    logger.info(`🎬 VideoCrew starting`, { topic, type, duration: `${duration}s` });

    try {
      // 启动消息监听
      this.director.startListening();

      // 开始制作
      const result = await this.director.produce(topic, type, duration);

      // 输出结果
      if (result.status === 'completed') {
        console.log('\n✅ Video production completed!\n');
        console.log('📁 Output files:');
        console.log(`   Script: ${result.outputs.script}`);
        console.log(`   Audio: ${result.outputs.audio}`);
        console.log(`   Video: ${result.outputs.video}`);
        console.log(`   Subtitles: ${result.outputs.subtitles}`);
      } else {
        console.log('\n❌ Production failed:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('CLI error', { error: error.message });
      throw error;
    }
  }

  /**
   * 查看项目状态
   */
  status(projectId) {
    return this.director.getStatus(projectId);
  }

  /**
   * 列出所有项目
   */
  listProjects() {
    const fs = require('fs');
    const projectsDir = storage.projectsDir;
    
    if (!fs.existsSync(projectsDir)) {
      return [];
    }

    const projects = fs.readdirSync(projectsDir)
      .filter(name => {
        const manifestPath = `${projectsDir}/${name}/manifest.json`;
        return fs.existsSync(manifestPath);
      })
      .map(name => {
        const manifest = JSON.parse(
          fs.readFileSync(`${projectsDir}/${name}/manifest.json`, 'utf-8')
        );
        return {
          id: name,
          ...manifest
        };
      });

    return projects;
  }

  /**
   * 查看任务队列状态
   */
  taskStatus() {
    return messageQueue.status();
  }
}

export const cli = new VideoCrewCLI();
export default cli;
