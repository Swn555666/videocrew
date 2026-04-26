import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, cpSync, rmSync } from 'fs';
import path from 'path';
import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * Editor Agent - 剪辑 Agent
 * 负责视频剪辑和合成
 * 
 * 工作流程：
 * 1. edit() - 将音频+素材合成粗剪视频
 * 2. finalize() - 将粗剪视频+字幕合成最终成片
 */
class EditorAgent {
  constructor() {
    this.name = 'Editor Agent';
    this.queue = 'editor';
  }

  /**
   * 剪辑视频 - 将音频和素材合成
   */
  async edit(projectId, options = {}) {
    const taskId = taskManager.createTask(this.name, 'edit-video', { projectId });

    logger.agent(this.name, `🎞️ 开始视频剪辑`);
    logger.info(`   等待素材和配音准备完成...`);

    try {
      const projectPath = storage.getProjectPath(projectId);
      
      // 检查音频文件
      const audioPath = this.findAudioFile(projectPath);
      if (!audioPath) {
        throw new Error('未找到音频文件');
      }
      logger.info(`   ✅ 找到音频: ${audioPath}`);

      // 检查素材清单
      const assetsManifest = this.findAssetsManifest(projectPath);
      if (!assetsManifest) {
        logger.warn(`   ⚠️ 未找到素材清单，将使用占位素材`);
      } else {
        logger.info(`   ✅ 找到素材清单`);
      }

      // 生成视频
      const rawVideoPath = await this.createRawVideo(projectPath, {
        audioPath,
        assetsManifest,
        ...options
      });

      // 更新 manifest
      this.saveOutputPath(projectId, 'video', rawVideoPath);

      // 发送视频就绪消息
      messageQueue.send('video-ready', {
        taskId,
        projectId,
        videoPath: rawVideoPath
      });

      taskManager.completeTask(taskId, { videoPath: rawVideoPath });

      logger.agent(this.name, `✅ 粗剪视频生成完成`, { videoPath: rawVideoPath });

      return { success: true, videoPath: rawVideoPath, taskId };
    } catch (error) {
      logger.error(`❌ 视频剪辑失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 最终合成 - 将粗剪视频和字幕合并
   */
  async finalize(projectId) {
    const taskId = taskManager.createTask(this.name, 'finalize-video', { projectId });

    logger.agent(this.name, `🎬 开始最终合成（视频+字幕）`);

    try {
      const projectPath = storage.getProjectPath(projectId);
      
      // 查找粗剪视频
      const rawVideoPath = this.findRawVideo(projectPath);
      if (!rawVideoPath) {
        throw new Error('未找到粗剪视频');
      }
      logger.info(`   📹 粗剪视频: ${rawVideoPath}`);

      // 查找字幕
      const subtitlePath = this.findSubtitleFile(projectPath);
      if (!subtitlePath) {
        logger.warn(`   ⚠️ 未找到字幕文件，跳过字幕合成`);
        // 直接复制视频作为最终输出
        const finalPath = this.copyToExports(projectPath, rawVideoPath, 'final.mp4');
        return { success: true, videoPath: finalPath };
      }
      logger.info(`   📝 字幕: ${subtitlePath}`);

      // 合成最终视频
      const finalPath = await this.muxVideoWithSubtitles(projectPath, rawVideoPath, subtitlePath);

      // 更新 manifest
      this.saveOutputPath(projectId, 'finalVideo', finalPath);

      taskManager.completeTask(taskId, { finalPath });

      logger.agent(this.name, `✅ 最终视频合成完成`, { finalPath });

      return { success: true, videoPath: finalPath, taskId };
    } catch (error) {
      logger.error(`❌ 最终合成失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 查找音频文件
   */
  findAudioFile(projectPath) {
    const audioDir = path.join(projectPath, 'audio');
    
    if (!existsSync(audioDir)) return null;
    
    const files = readdirSync(audioDir).filter(f => 
      f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')
    );
    
    if (files.length > 0) {
      return path.join(audioDir, files[0]);
    }
    return null;
  }

  /**
   * 查找素材清单
   */
  findAssetsManifest(projectPath) {
    const manifestPath = path.join(projectPath, 'assets-manifest.json');
    if (existsSync(manifestPath)) {
      return JSON.parse(readFileSync(manifestPath, 'utf-8'));
    }
    return null;
  }

  /**
   * 查找字幕文件
   */
  findSubtitleFile(projectPath) {
    const subtitlesDir = path.join(projectPath, 'subtitles');
    
    if (!existsSync(subtitlesDir)) return null;
    
    const files = readdirSync(subtitlesDir).filter(f => 
      f.endsWith('.srt') || f.endsWith('.vtt')
    );
    
    if (files.length > 0) {
      return path.join(subtitlesDir, files[0]);
    }
    return null;
  }

  /**
   * 查找粗剪视频
   */
  findRawVideo(projectPath) {
    const exportsDir = path.join(projectPath, 'exports');
    
    if (!existsSync(exportsDir)) return null;
    
    const files = readdirSync(exportsDir).filter(f => 
      f.endsWith('.mp4') || f.endsWith('.avi') || f.endsWith('.mov')
    );
    
    if (files.length > 0) {
      return path.join(exportsDir, files[0]);
    }
    return null;
  }

  /**
   * 生成粗剪视频
   */
  async createRawVideo(projectPath, options) {
    const { audioPath, assetsManifest } = options;
    const outputPath = path.join(projectPath, 'exports', 'raw_video.mp4');

    logger.agent(this.name, `🔧 使用 FFmpeg 合成视频`);

    // 确保 exports 目录存在
    const exportsDir = path.join(projectPath, 'exports');
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true });
    }

    // TODO: 实际调用 FFmpeg
    // 目前创建占位文件
    const placeholder = `RAW_VIDEO_PLACEHOLDER
Project: ${projectPath}
Audio: ${audioPath}
Assets: ${assetsManifest ? JSON.stringify(assetsManifest.length) : 'none'}
Generated: ${new Date().toISOString()}
`;
    writeFileSync(outputPath, placeholder);

    // 模拟处理
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info(`   📹 粗剪视频已生成: ${outputPath}`);

    return outputPath;
  }

  /**
   * 合成视频和字幕
   */
  async muxVideoWithSubtitles(projectPath, videoPath, subtitlePath) {
    const outputPath = path.join(projectPath, 'exports', 'final.mp4');

    logger.agent(this.name, `🎬 合成视频和字幕`);

    // TODO: 实际调用 FFmpeg
    // ffmpeg -i video.mp4 -vf subtitles=subtitle.srt output.mp4
    
    // 目前创建占位文件
    const subtitleContent = readFileSync(subtitlePath, 'utf-8');
    const placeholder = `FINAL_VIDEO_PLACEHOLDER
Video: ${videoPath}
Subtitles: ${subtitleContent.slice(0, 100)}...
Output: ${outputPath}
Generated: ${new Date().toISOString()}
`;
    writeFileSync(outputPath, placeholder);

    logger.info(`   ✅ 最终视频已生成: ${outputPath}`);

    return outputPath;
  }

  /**
   * 复制到 exports 目录
   */
  copyToExports(projectPath, sourcePath, filename) {
    const exportsDir = path.join(projectPath, 'exports');
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true });
    }
    
    const destPath = path.join(exportsDir, filename);
    cpSync(sourcePath, destPath);
    
    return destPath;
  }

  /**
   * 保存输出路径到 manifest
   */
  saveOutputPath(projectId, type, filePath) {
    const projectPath = storage.getProjectPath(projectId);
    const manifestPath = path.join(projectPath, 'manifest.json');
    
    let manifest = {};
    if (existsSync(manifestPath)) {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    }
    
    if (!manifest.outputs) manifest.outputs = {};
    manifest.outputs[type] = filePath;
    manifest.status = 'in_progress';
    
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

export const editorAgent = new EditorAgent();
export default editorAgent;
