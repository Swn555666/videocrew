import { spawn } from 'child_process';
import { createLogger } from '../core/logger.js';
import { ffmpeg as ffmpegConfig } from '../config/settings.js';

const logger = createLogger('FFmpeg');

/**
 * 运行 FFmpeg 命令
 */
function runCommand(args) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = ffmpegConfig.path || 'ffmpeg';
    
    logger.info(`Running: ${ffmpegPath} ${args.join(' ')}`);
    
    const process = spawn(ffmpegPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        logger.error('FFmpeg failed', { code, stderr: stderr.slice(-500) });
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 获取视频信息
 */
export async function getVideoInfo(input) {
  const args = [
    '-i', input,
    '-hide_banner'
  ];

  try {
    await runCommand(args);
  } catch (e) {
    // FFmpeg 会输出错误信息，包含视频信息
  }

  // 简化版本，返回基本信息
  return {
    input,
    exists: true
  };
}

/**
 * 合并音频和视频
 */
export async function mergeAudioVideo(videoPath, audioPath, outputPath) {
  const args = [
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    '-y',
    outputPath
  ];

  await runCommand(args);
  return outputPath;
}

/**
 * 添加字幕到视频
 */
export async function addSubtitles(videoPath, subtitlePath, outputPath) {
  const args = [
    '-i', videoPath,
    '-vf', `subtitles=${subtitlePath}`,
    '-c:a', 'copy',
    '-y',
    outputPath
  ];

  await runCommand(args);
  return outputPath;
}

/**
 * 剪切视频
 */
export async function cutVideo(input, start, duration, output) {
  const args = [
    '-i', input,
    '-ss', start.toString(),
    '-t', duration.toString(),
    '-c', 'copy',
    '-y',
    output
  ];

  await runCommand(args);
  return output;
}

/**
 * 拼接视频
 */
export async function concatVideos(inputs, output) {
  // 创建临时文件列表
  const listFile = inputs.map(f => `file '${f}'`).join('\n');
  
  // 简化版本，假设使用复杂滤镜
  const args = [
    '-i', `concat:${inputs.join('|')}`,
    '-c', 'copy',
    '-y',
    output
  ];

  await runCommand(args);
  return output;
}

/**
 * 调整视频尺寸和比例
 */
export async function resizeVideo(input, output, width, height) {
  const args = [
    '-i', input,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    '-c:a', 'copy',
    '-y',
    output
  ];

  await runCommand(args);
  return output;
}

/**
 * 提取音频
 */
export async function extractAudio(input, output) {
  const args = [
    '-i', input,
    '-vn',
    '-acodec', 'libmp3lame',
    '-y',
    output
  ];

  await runCommand(args);
  return output;
}

/**
 * 添加水印
 */
export async function addWatermark(input, watermarkPath, output, position = 'overlay=10:10') {
  const args = [
    '-i', input,
    '-i', watermarkPath,
    '-filter_complex', position,
    '-c:a', 'copy',
    '-y',
    output
  ];

  await runCommand(args);
  return output;
}

export default {
  getVideoInfo,
  mergeAudioVideo,
  addSubtitles,
  cutVideo,
  concatVideos,
  resizeVideo,
  extractAudio,
  addWatermark
};
