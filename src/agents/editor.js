import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * Editor Agent - 剪辑 Agent
 * 负责视频剪辑和合成
 */
class EditorAgent {
  constructor() {
    this.name = 'Editor Agent';
    this.queue = 'editor';
  }

  /**
   * 剪辑视频
   */
  async edit(projectId, options = {}) {
    const taskId = taskManager.createTask(this.name, 'edit-video', {
      projectId,
      options
    });

    logger.agent(this.name, `Starting video editing`, { taskId });

    try {
      const projectPath = storage.getProjectPath(projectId);
      
      // 读取项目数据
      const manifest = storage.readJSON(projectPath, 'manifest.json');
      const script = storage.readJSON(projectPath, 'script.json');
      
      // 检查素材
      const audioPath = this.findAudioFile(projectPath);
      
      if (!audioPath) {
        throw new Error('No audio file found');
      }

      // 生成视频
      const outputPath = await this.createVideo(projectPath, {
        audioPath,
        script,
        ...options
      });

      // 发送视频就绪消息
      messageQueue.send('video-ready', {
        taskId,
        projectId,
        videoPath: outputPath
      });

      taskManager.completeTask(taskId, { videoPath: outputPath });

      logger.agent(this.name, `Video editing completed`, { taskId, outputPath });

      return { success: true, videoPath: outputPath, taskId };
    } catch (error) {
      logger.error(`Video editing failed`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 查找音频文件
   */
  findAudioFile(projectPath) {
    const audioDir = `${projectPath}/audio`;
    const fs = require('fs');
    
    if (fs.existsSync(audioDir)) {
      const files = fs.readdirSync(audioDir);
      const audioFile = files.find(f => f.endsWith('.mp3') || f.endsWith('.wav'));
      if (audioFile) {
        return `${audioDir}/${audioFile}`;
      }
    }
    return null;
  }

  /**
   * 创建视频
   * TODO: 接入 FFmpeg 实际合成
   */
  async createVideo(projectPath, options) {
    const { audioPath, script } = options;
    const outputPath = `${projectPath}/exports/final.mp4`;

    logger.agent(this.name, `Creating video with FFmpeg`);

    // 确保 exports 目录存在
    const fs = require('fs');
    const exportsDir = `${projectPath}/exports`;
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // TODO: 实际的 FFmpeg 合成逻辑
    // 目前创建占位文件
    const placeholderContent = `Video placeholder for project ${projectPath}`;
    fs.writeFileSync(outputPath, placeholderContent);

    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    return outputPath;
  }

  /**
   * 快速剪辑模式 - 基于音频时长
   */
  async quickEdit(projectId, audioPath, duration) {
    logger.agent(this.name, `Quick edit mode`, { duration });

    // 生成与音频等长的视频
    // 可以使用静态图片 + 音频 或 素材库随机素材

    const outputPath = `${projectPath}/exports/quick_edit.mp4`;
    return outputPath;
  }

  /**
   * 处理 TTS 就绪事件
   */
  async handleTTSReady(message) {
    const { projectId, audioPath } = message.payload;
    
    // 同时需要等待素材
    return this.edit(projectId, { audioPath });
  }

  /**
   * 处理素材就绪事件
   */
  async handleAssetsReady(message) {
    const { projectId, assets } = message.payload;
    
    // 如果音频已就绪，开始剪辑
    const projectPath = storage.getProjectPath(projectId);
    const audioPath = this.findAudioFile(projectPath);
    
    if (audioPath) {
      return this.edit(projectId, { assets });
    }
    
    return { success: false, reason: 'Waiting for audio' };
  }
}

export const editorAgent = new EditorAgent();
export default editorAgent;
