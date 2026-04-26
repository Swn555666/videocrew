import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { transcribeAudio } from '../utils/openai.js';

/**
 * Caption Agent - 字幕 Agent
 * 负责生成字幕
 */
class CaptionAgent {
  constructor() {
    this.name = 'Caption Agent';
    this.queue = 'caption';
  }

  /**
   * 生成字幕
   */
  async generate(projectId, audioPath, options = {}) {
    const taskId = taskManager.createTask(this.name, 'generate-caption', {
      projectId,
      audioPath
    });

    logger.agent(this.name, `Starting caption generation`, { taskId });

    try {
      // 调用 Whisper 转写
      const srtContent = await this.transcribe(audioPath, options);

      // 保存字幕
      const projectPath = storage.getProjectPath(projectId);
      const subtitlePath = storage.saveSubtitles(projectPath, srtContent, 'srt');

      // 发送字幕就绪消息
      messageQueue.send('caption-ready', {
        taskId,
        projectId,
        subtitlePath,
        format: 'srt'
      });

      taskManager.completeTask(taskId, { subtitlePath });

      logger.agent(this.name, `Caption generation completed`, { taskId });

      return { success: true, subtitlePath, taskId };
    } catch (error) {
      logger.error(`Caption generation failed`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 转写音频为字幕
   */
  async transcribe(audioPath, options = {}) {
    logger.agent(this.name, `Transcribing audio with Whisper`);

    // TODO: 接入 OpenAI Whisper API
    // 目前返回模拟字幕

    // 模拟处理
    await new Promise(resolve => setTimeout(resolve, 500));

    // 返回模拟 SRT 格式
    const mockSRT = `1
00:00:00,000 --> 00:00:03,500
欢迎观看本期视频

2
00:00:03,500 --> 00:00:07,000
今天我们来探讨人工智能的发展

3
00:00:07,000 --> 00:00:11,000
以及它如何改变我们的日常生活

4
00:00:11,000 --> 00:00:15,000
让我们一起进入 AI 的世界
`;

    return mockSRT;
  }

  /**
   * 处理视频就绪事件
   */
  async handleVideoReady(message) {
    const { projectId, videoPath } = message.payload;
    
    // 查找对应的音频文件来生成字幕
    const projectPath = storage.getProjectPath(projectId);
    const audioPath = this.findAudioFile(projectPath);
    
    if (audioPath) {
      return this.generate(projectId, audioPath);
    }
    
    logger.warn('No audio found for caption generation');
    return { success: false, reason: 'No audio file' };
  }

  /**
   * 查找音频文件
   */
  findAudioFile(projectPath) {
    const fs = require('fs');
    const audioDir = `${projectPath}/audio`;
    
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
   * 将 SRT 转换为 VTT
   */
  convertSRTtoVTT(srtContent) {
    return `WEBVTT\n\n${srtContent}`;
  }
}

export const captionAgent = new CaptionAgent();
export default captionAgent;
