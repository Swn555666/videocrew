import { logger } from '../core/logger.js';

/**
 * 素材存储管理
 * 管理项目素材的存储和访问
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'fs';
import path from 'path';
import { project } from '../config/settings.js';

class Storage {
  constructor() {
    this.workspace = project.workspace;
    this.ensureWorkspace();
  }

  ensureWorkspace() {
    const dirs = [this.workspace, this.projectsDir, this.assetsDir];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  get projectsDir() {
    return path.join(this.workspace, 'projects');
  }

  get assetsDir() {
    return path.join(this.workspace, 'assets');
  }

  /**
   * 创建项目文件夹
   */
  createProject(projectId, projectName) {
    const projectPath = path.join(this.projectsDir, `${projectId}`);
    const subDirs = ['raw', 'audio', 'video', 'subtitles', 'exports'];
    
    mkdirSync(projectPath, { recursive: true });
    subDirs.forEach(sub => {
      mkdirSync(path.join(projectPath, sub), { recursive: true });
    });

    // 创建项目元数据
    const meta = {
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      status: 'initialized'
    };
    
    this.writeJSON(projectPath, 'manifest.json', meta);

    logger.info(`Project created: ${projectName}`, { path: projectPath });
    return projectPath;
  }

  /**
   * 保存脚本
   */
  saveScript(projectPath, script) {
    this.writeJSON(projectPath, 'script.json', script);
    return path.join(projectPath, 'script.json');
  }

  /**
   * 保存音频
   */
  saveAudio(projectPath, audioData, filename = 'narration.mp3') {
    const audioPath = path.join(projectPath, 'audio', filename);
    writeFileSync(audioPath, audioData);
    logger.info(`Audio saved`, { path: audioPath });
    return audioPath;
  }

  /**
   * 保存字幕
   */
  saveSubtitles(projectPath, subtitles, format = 'srt') {
    const subtitlePath = path.join(projectPath, 'subtitles', `caption.${format}`);
    writeFileSync(subtitlePath, subtitles);
    logger.info(`Subtitles saved`, { path: subtitlePath });
    return subtitlePath;
  }

  /**
   * 保存视频
   */
  saveVideo(projectPath, videoData, filename = 'final.mp4') {
    const videoPath = path.join(projectPath, 'exports', filename);
    writeFileSync(videoPath, videoData);
    logger.info(`Video saved`, { path: videoPath });
    return videoPath;
  }

  /**
   * 复制素材到项目
   */
  copyAsset(projectPath, sourcePath, category = 'raw') {
    const destDir = path.join(projectPath, category);
    const filename = path.basename(sourcePath);
    const destPath = path.join(destDir, filename);
    
    try {
      cpSync(sourcePath, destPath);
      logger.info(`Asset copied`, { from: sourcePath, to: destPath });
      return destPath;
    } catch (e) {
      logger.warn(`Failed to copy asset`, { source: sourcePath, error: e.message });
      return null;
    }
  }

  /**
   * 读取 JSON 文件
   */
  readJSON(projectPath, filename) {
    const filePath = path.join(projectPath, filename);
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
    return null;
  }

  /**
   * 写入 JSON 文件
   */
  writeJSON(projectPath, filename, data) {
    const filePath = path.join(projectPath, filename);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * 获取项目路径
   */
  getProjectPath(projectId) {
    return path.join(this.projectsDir, projectId);
  }

  /**
   * 清理项目临时文件
   */
  cleanup(projectPath) {
    const tempDirs = ['raw', 'temp'];
    tempDirs.forEach(dir => {
      const tempPath = path.join(projectPath, dir);
      if (existsSync(tempPath)) {
        rmSync(tempPath, { recursive: true, force: true });
      }
    });
  }
}

export const storage = new Storage();
export default storage;
