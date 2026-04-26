import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { existsSync, writeFileSync, mkdirSync, readdirSync, readFileSync, copyFileSync } from 'fs';
import path from 'path';

/**
 * Editor Agent - 剪辑 Agent
 * 基于开源项目:
 * - FFmpeg 命令行自动化
 * - fast-video-editor (视频合并/剪切)
 * 
 * 功能:
 * 1. 视频合成 - 音频+素材 → 粗剪视频
 * 2. 字幕烧录 - 视频+字幕 → 最终成片
 * 3. 格式转换 - 支持多种格式
 */

const VIDEO_TEMPLATES = {
  short: {
    name: '短视频',
    ratio: '9:16',
    resolution: '1080:1920',
    fps: 30,
    duration: { max: 60 }
  },
  documentary: {
    name: '纪录片',
    ratio: '16:9',
    resolution: '1920:1080',
    fps: 30,
    duration: { max: 600 }
  },
  narration: {
    name: '解说视频',
    ratio: '16:9',
    resolution: '1920:1080',
    fps: 30,
    duration: { max: 300 }
  },
  youtube: {
    name: 'YouTube',
    ratio: '16:9',
    resolution: '1920:1080',
    fps: 30,
    duration: { max: 600 }
  }
};

/**
 * FFmpeg 命令构建器
 * 参考: 各类 FFmpeg 自动化脚本
 */
class FFmpegBuilder {
  /**
   * 构建合并音视频命令
   */
  static mergeAudioVideo(videoInput, audioInput, output) {
    // ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest output.mp4
    return [
      '-i', videoInput,
      '-i', audioInput,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      '-y',
      output
    ];
  }

  /**
   * 构建添加字幕命令
   */
  static burnSubtitles(videoInput, subtitleInput, output) {
    // ffmpeg -i input.mp4 -vf subtitles=subtitle.srt output.mp4
    return [
      '-i', videoInput,
      '-vf', `subtitles=${subtitleInput}`,
      '-c:a', 'copy',
      '-y',
      output
    ];
  }

  /**
   * 构建剪切视频命令
   */
  static cutVideo(input, start, duration, output) {
    // ffmpeg -i input.mp4 -ss 00:00:10 -t 00:00:30 -c copy output.mp4
    return [
      '-i', input,
      '-ss', start,
      '-t', duration,
      '-c', 'copy',
      '-y',
      output
    ];
  }

  /**
   * 构建拼接视频命令
   */
  static concatVideos(inputs, output, format = 'mp4') {
    // ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
    // 需要先创建临时文件列表
    return {
      type: 'concat',
      inputs,
      output,
      format
    };
  }

  /**
   * 构建缩放视频命令
   */
  static scaleVideo(input, output, width, height) {
    // ffmpeg -i input -vf scale=1920:1080 output
    return [
      '-i', input,
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-c:a', 'copy',
      '-y',
      output
    ];
  }

  /**
   * 构建提取音频命令
   */
  static extractAudio(input, output) {
    // ffmpeg -i input.mp4 -vn -acodec libmp3lame -y output.mp3
    return [
      '-i', input,
      '-vn',
      '-acodec', 'libmp3lame',
      '-y',
      output
    ];
  }

  /**
   * 构建添加水印命令
   */
  static addWatermark(input, watermark, output, position = 'overlay=10:10') {
    // ffmpeg -i input -i watermark -filter_complex overlay=10:10 output
    return [
      '-i', input,
      '-i', watermark,
      '-filter_complex', position,
      '-c:a', 'copy',
      '-y',
      output
    ];
  }
}

/**
 * 视频合成器
 * 参考: fast-video-editor 的合并逻辑
 */
class VideoComposer {
  /**
   * 从图片和音频合成视频
   */
  static async composeFromImagesAndAudio(images, audioPath, outputPath, duration) {
    logger.agent('Editor', `   🎬 从 ${images.length} 张图片和音频合成视频...`);
    
    // TODO: 实际调用 FFmpeg
    // ffmpeg -framerate 1 -loop 1 -i image%d.jpg -i audio.mp3 \
    //        -c:v libx264 -t 60 -pix_fmt yuv420p -c:a aac output.mp4
    
    // 模拟
    return mockProcessVideo(outputPath, duration);
  }

  /**
   * 从素材列表合成视频
   */
  static async composeFromAssets(assets, audioPath, outputPath, template) {
    logger.agent('Editor', `   🎬 从 ${assets.length} 个素材合成视频...`);
    
    // TODO: 实现素材拼接逻辑
    // 1. 按场景顺序排列素材
    // 2. 计算每个素材的时长
    // 3. 调用 FFmpeg concat
    
    return mockProcessVideo(outputPath, 60);
  }
}

/**
 * 模拟视频处理
 */
function mockProcessVideo(outputPath, duration) {
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const placeholder = `MOCK_VIDEO_${Date.now()}
Duration: ${duration}s
Template: ${path.basename(dir)}
Created: ${new Date().toISOString()}
`;
  
  writeFileSync(outputPath, placeholder);
  
  return {
    success: true,
    path: outputPath,
    duration,
    format: 'mp4'
  };
}

/**
 * 检查 FFmpeg 是否可用
 */
async function checkFFmpeg() {
  try {
    // TODO: 检查 FFmpeg
    // const result = spawn('ffmpeg', ['-version']);
    return { available: false, version: null };
  } catch {
    return { available: false, version: null };
  }
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
    const { available, version } = await checkFFmpeg();
    this.ffmpegAvailable = available;
    logger.info(`🎞️ FFmpeg 状态: ${available ? `✅ ${version}` : '⚠️ 不可用（使用模拟）'}`);
  }

  /**
   * 获取视频模板
   */
  getTemplates() {
    return Object.entries(VIDEO_TEMPLATES).map(([id, config]) => ({
      id,
      ...config
    }));
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
    
    return files.length > 0 ? path.join(audioDir, files[0]) : null;
  }

  /**
   * 查找素材清单
   */
  async findAssetsManifest(projectPath) {
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
    
    return files.length > 0 ? path.join(subtitlesDir, files[0]) : null;
  }

  /**
   * 查找粗剪视频
   */
  findRawVideo(projectPath) {
    const exportsDir = path.join(projectPath, 'exports');
    
    if (!existsSync(exportsDir)) return null;
    
    const files = readdirSync(exportsDir).filter(f => 
      f.startsWith('raw_') && f.endsWith('.mp4')
    );
    
    return files.length > 0 ? path.join(exportsDir, files[0]) : null;
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
      const assetsManifest = await this.findAssetsManifest(projectPath);
      const hasAssets = assetsManifest?.assets?.length > 0;
      logger.info(`   ${hasAssets ? '✅' : '⚠️'} 素材: ${hasAssets ? `${assetsManifest.assets.length} 个` : '未准备'}`);

      // 3. 获取模板
      const config = storage.readJSON(projectPath, 'config.json');
      const template = VIDEO_TEMPLATES[config?.type] || VIDEO_TEMPLATES.documentary;

      // 4. 合成视频
      const exportsDir = path.join(projectPath, 'exports');
      if (!existsSync(exportsDir)) {
        mkdirSync(exportsDir, { recursive: true });
      }
      
      const rawVideoPath = path.join(exportsDir, 'raw_video.mp4');

      if (this.ffmpegAvailable) {
        // TODO: 实际 FFmpeg 合成
        // 使用 FFmpeg 从素材合成
        if (hasAssets) {
          await VideoComposer.composeFromAssets(
            assetsManifest.assets,
            audioPath,
            rawVideoPath,
            template
          );
        } else {
          // 无素材，创建占位视频
          await VideoComposer.composeFromImagesAndAudio(
            ['placeholder'],
            audioPath,
            rawVideoPath,
            config?.duration || 60
          );
        }
      } else {
        // 模拟
        mockProcessVideo(rawVideoPath, config?.duration || 60);
      }

      // 5. 更新 manifest
      this.saveOutputPath(projectId, 'video', rawVideoPath);

      // 6. 发送完成消息
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

      if (subtitlePath && existsSync(subtitlePath)) {
        logger.info(`   📝 字幕: ${subtitlePath}`);
        
        if (this.ffmpegAvailable) {
          // TODO: 实际 FFmpeg 烧录字幕
          // FFmpegBuilder.burnSubtitles(rawVideoPath, subtitlePath, finalPath);
          mockProcessVideo(finalPath, 60);
        } else {
          // 模拟
          mockProcessVideo(finalPath, 60);
        }
      } else {
        logger.warn(`   ⚠️ 未找到字幕，直接复制视频`);
        copyFileSync(rawVideoPath, finalPath);
      }

      // 3. 更新 manifest
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
