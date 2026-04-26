import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Editor Agent - 剪辑 Agent
 * 基于开源项目: FFmpeg
 * 
 * 功能:
 * 1. 视频合成 - 音频+素材 → 视频
 * 2. 字幕烧录 - 视频+字幕 → 最终成片
 * 3. 格式转换 - 支持多种格式
 */

const VIDEO_TEMPLATES = {
  short: {
    name: '短视频',
    ratio: '9:16',
    resolution: '1080:1920',
    duration: { max: 60, typical: 15 }
  },
  documentary: {
    name: '纪录片',
    ratio: '16:9',
    resolution: '1920:1080',
    duration: { max: 600, typical: 180 }
  },
  narration: {
    name: '解说视频',
    ratio: '16:9',
    resolution: '1920:1080',
    duration: { max: 300, typical: 180 }
  },
  youtube: {
    name: 'YouTube',
    ratio: '16:9',
    resolution: '1920:1080',
    duration: { max: 600, typical: 480 }
  }
};

/**
 * 检查 FFmpeg 是否可用
 */
async function checkFFmpeg() {
  try {
    // TODO: 实际检查 FFmpeg
    // const result = spawn('ffmpeg', ['-version']);
    return { available: false, version: null };
  } catch (error) {
    return { available: false, version: null };
  }
}

/**
 * 获取视频信息
 */
async function getVideoInfo(input) {
  logger.info(`   📹 检查视频: ${input}`);
  // TODO: 实际调用 FFprobe
  return {
    exists: existsSync(input),
    path: input,
    size: 0,
    duration: 0
  };
}

/**
 * 模拟视频合成
 */
async function mockComposeVideo(options = {}) {
  const { audioPath, assets, outputPath, template } = options;
  
  logger.agent('Editor', `   🎬 模拟视频合成...`);
  
  // 模拟处理
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 创建占位文件
  const placeholder = `MOCK_VIDEO_${Date.now()}
Template: ${template || 'default'}
Audio: ${audioPath || 'none'}
Assets: ${assets?.length || 0} items
Created: ${new Date().toISOString()}
`;
  
  return {
    success: true,
    path: outputPath,
    placeholder,
    format: 'mp4',
    duration: 60
  };
}

/**
 * 模拟字幕烧录
 */
async function mockBurnSubtitles(videoPath, subtitlePath, outputPath) {
  logger.agent('Editor', `   🔤 模拟字幕烧录...`);
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const placeholder = `MOCK_VIDEO_WITH_SUBS_${Date.now()}
Video: ${videoPath}
Subtitles: ${subtitlePath}
Created: ${new Date().toISOString()}
`;
  
  return {
    success: true,
    path: outputPath,
    placeholder,
    format: 'mp4'
  };
}

/**
 * FFmpeg 合成视频
 * TODO: 实际实现
 */
async function ffmpegCompose(options = {}) {
  const { audioPath, images, outputPath, template, duration } = options;
  
  logger.agent('Editor', `   🎬 使用 FFmpeg 合成视频`);
  
  // FFmpeg 命令示例:
  // ffmpeg -framerate 1 -loop 1 -i image.jpg -i audio.mp3 -c:v libx264 -t 60 -pix_fmt yuv420p -c:a aac output.mp4
  
  // 目前使用模拟
  return mockComposeVideo(options);
}

/**
 * FFmpeg 烧录字幕
 * TODO: 实际实现
 */
async function ffmpegBurnSubtitles(videoPath, subtitlePath, outputPath) {
  logger.agent('Editor', `   🔤 使用 FFmpeg 烧录字幕`);
  
  // FFmpeg 命令:
  // ffmpeg -i video.mp4 -vf subtitles=subtitle.srt output.mp4
  
  return mockBurnSubtitles(videoPath, subtitlePath, outputPath);
}

/**
 * 创建占位视频
 */
async function createPlaceholderVideo(outputPath, duration) {
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const placeholder = `PLACEHOLDER_VIDEO
Duration: ${duration}s
Created: ${new Date().toISOString()}
`;
  
  writeFileSync(outputPath, placeholder);
  return outputPath;
}

/**
 * Editor Agent 主类
 */
class EditorAgent {
  constructor() {
    this.name = 'Editor Agent';
    this.queue = 'editor';
    this.ffmpegAvailable = false;
  }

  /**
   * 初始化
   */
  async init() {
    const { available } = await checkFFmpeg();
    this.ffmpegAvailable = available;
    logger.info(`🎞️ FFmpeg 状态: ${available ? '✅ 可用' : '⚠️ 不可用（使用模拟）'}`);
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
  async findAssetsManifest(projectPath) {
    const manifestPath = path.join(projectPath, 'assets-manifest.json');
    if (existsSync(manifestPath)) {
      const fs = await import('fs');
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
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
      f.endsWith('.mp4') || f.endsWith('.avi')
    );
    
    if (files.length > 0) {
      return path.join(exportsDir, files[0]);
    }
    return null;
  }

  /**
   * 剪辑视频
   */
  async edit(projectId, options = {}) {
    const taskId = taskManager.createTask(this.name, 'edit-video', { projectId });

    logger.agent(this.name, `🎞️ 开始视频剪辑`);

    try {
      const projectPath = storage.getProjectPath(projectId);
      
      // 1. 检查音频
      const audioPath = this.findAudioFile(projectPath);
      if (!audioPath) {
        throw new Error('未找到音频文件');
      }
      logger.info(`   ✅ 音频: ${audioPath}`);

      // 2. 检查素材
      const assetsManifest = this.findAssetsManifest(projectPath);
      logger.info(`   ${assetsManifest ? '✅' : '⚠️'} 素材: ${assetsManifest ? '已准备' : '未准备'}`);

      // 3. 获取模板设置
      const config = storage.readJSON(projectPath, 'config.json');
      const template = VIDEO_TEMPLATES[config?.type] || VIDEO_TEMPLATES.documentary;

      // 4. 合成视频
      const exportsDir = path.join(projectPath, 'exports');
      if (!existsSync(exportsDir)) {
        mkdirSync(exportsDir, { recursive: true });
      }
      
      const rawVideoPath = path.join(exportsDir, 'raw_video.mp4');

      let result;
      if (this.ffmpegAvailable) {
        result = await ffmpegCompose({
          audioPath,
          assets: assetsManifest?.assets || [],
          outputPath: rawVideoPath,
          template: template.name,
          duration: config?.duration || 60
        });
      } else {
        result = await mockComposeVideo({
          audioPath,
          assets: assetsManifest?.assets || [],
          outputPath: rawVideoPath,
          template: template.name
        });
      }

      // 5. 保存视频
      writeFileSync(rawVideoPath, result.placeholder || Buffer.alloc(0));

      // 6. 更新 manifest
      this.saveOutputPath(projectId, 'video', rawVideoPath);

      // 7. 发送完成消息
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
   * 最终合成
   */
  async finalize(projectId) {
    const taskId = taskManager.createTask(this.name, 'finalize-video', { projectId });

    logger.agent(this.name, `🎬 开始最终合成`);

    try {
      const projectPath = storage.getProjectPath(projectId);
      
      // 1. 查找粗剪视频
      const rawVideoPath = this.findRawVideo(projectPath);
      if (!rawVideoPath) {
        throw new Error('未找到粗剪视频');
      }
      logger.info(`   📹 粗剪视频: ${rawVideoPath}`);

      // 2. 查找字幕
      const subtitlePath = this.findSubtitleFile(projectPath);
      
      const exportsDir = path.join(projectPath, 'exports');
      const finalPath = path.join(exportsDir, 'final.mp4');

      let result;
      
      if (subtitlePath && existsSync(subtitlePath)) {
        logger.info(`   📝 字幕: ${subtitlePath}`);
        
        if (this.ffmpegAvailable) {
          result = await ffmpegBurnSubtitles(rawVideoPath, subtitlePath, finalPath);
        } else {
          result = await mockBurnSubtitles(rawVideoPath, subtitlePath, finalPath);
        }
      } else {
        logger.warn(`   ⚠️ 未找到字幕，跳过烧录`);
        // 直接复制视频
        const fs = await import('fs');
        fs.copyFileSync(rawVideoPath, finalPath);
        result = { success: true, path: finalPath, format: 'mp4' };
      }

      // 3. 保存最终视频
      if (result.placeholder) {
        writeFileSync(finalPath, result.placeholder);
      }

      // 4. 更新 manifest
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
   * 保存输出路径
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
