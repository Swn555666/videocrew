import { v4 as uuidv4 } from 'uuid';
import { logger } from '../core/logger.js';
import { taskManager, TaskStatus } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';
import { scriptAgent } from './script.js';
import { ttsAgent } from './tts.js';
import { assetAgent } from './asset.js';
import { editorAgent } from './editor.js';
import { captionAgent } from './caption.js';

/**
 * Director Agent - 导演 Agent
 * 统筹协调所有 Agent 的工作
 */
class DirectorAgent {
  constructor() {
    this.name = 'Director';
    this.projectId = null;
    this.state = 'idle';
  }

  /**
   * 创建新项目
   */
  createProject(topic, type = 'documentary', duration = 180) {
    this.projectId = uuidv4();
    this.state = 'planning';

    logger.info(`🎬 Creating new project`, { projectId: this.projectId, topic, type, duration });

    // 创建项目文件夹
    const projectPath = storage.createProject(this.projectId, topic);

    // 保存项目配置
    const config = { topic, type, duration, createdAt: new Date().toISOString() };
    storage.writeJSON(projectPath, 'config.json', config);

    return this.projectId;
  }

  /**
   * 开始制作视频
   */
  async produce(topic, type = 'documentary', duration = 180) {
    const projectId = this.createProject(topic, type, duration);

    logger.info(`🎬 Starting video production`, { projectId });

    try {
      // 阶段 1: 生成脚本
      const scriptResult = await this.phaseScript(projectId, topic, type, duration);
      if (!scriptResult.success) throw new Error('Script phase failed');

      // 阶段 2: 并行生成配音和收集素材
      const [ttsResult, assetResult] = await Promise.all([
        this.phaseTTS(projectId, scriptResult.script),
        this.phaseAssets(projectId, scriptResult.script)
      ]);

      // 阶段 3: 视频剪辑
      const videoResult = await this.phaseEdit(projectId);
      if (!videoResult.success) throw new Error('Edit phase failed');

      // 阶段 4: 生成字幕
      const captionResult = await this.phaseCaption(projectId);
      if (!captionResult.success) throw new Error('Caption phase failed');

      // 完成
      this.state = 'completed';
      
      const finalOutput = {
        projectId,
        status: 'completed',
        outputs: {
          script: scriptResult.scriptPath,
          audio: ttsResult.audioPath,
          video: videoResult.videoPath,
          subtitles: captionResult.subtitlePath
        }
      };

      logger.info(`🎬 Video production completed`, finalOutput);

      return finalOutput;

    } catch (error) {
      this.state = 'failed';
      logger.error(`Production failed`, { error: error.message });
      return { projectId, status: 'failed', error: error.message };
    }
  }

  /**
   * 阶段 1: 脚本生成
   */
  async phaseScript(projectId, topic, type, duration) {
    logger.info(`📝 Phase 1: Script Generation`);

    const result = await scriptAgent.generate(projectId, topic, type, duration);

    return result;
  }

  /**
   * 阶段 2a: TTS 生成
   */
  async phaseTTS(projectId, script) {
    logger.info(`🎙️ Phase 2a: TTS Generation`);

    const result = await ttsAgent.generate(projectId, script);

    return result;
  }

  /**
   * 阶段 2b: 素材收集
   */
  async phaseAssets(projectId, script) {
    logger.info(`📦 Phase 2b: Asset Collection`);

    // 提取素材需求
    const assetsNeeded = [];
    if (script.scenes) {
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
    }

    const result = await assetAgent.collect(projectId, assetsNeeded, script);

    return result;
  }

  /**
   * 阶段 3: 视频剪辑
   */
  async phaseEdit(projectId) {
    logger.info(`🎞️ Phase 3: Video Editing`);

    const result = await editorAgent.edit(projectId);

    return result;
  }

  /**
   * 阶段 4: 字幕生成
   */
  async phaseCaption(projectId) {
    logger.info(`📝 Phase 4: Caption Generation`);

    // 查找音频文件
    const projectPath = storage.getProjectPath(projectId);
    const audioPath = editorAgent.findAudioFile(projectPath);

    if (!audioPath) {
      return { success: false, reason: 'No audio found' };
    }

    const result = await captionAgent.generate(projectId, audioPath);

    return result;
  }

  /**
   * 获取项目状态
   */
  getStatus(projectId) {
    const projectPath = storage.getProjectPath(projectId);
    const manifest = storage.readJSON(projectPath, 'manifest.json');
    const config = storage.readJSON(projectPath, 'config.json');
    const summary = taskManager.getSummary();

    return {
      projectId,
      state: this.state,
      manifest,
      config,
      tasks: summary
    };
  }

  /**
   * 监听消息队列
   */
  startListening() {
    // 监听各 Agent 的消息
    messageQueue.subscribe('script-ready', (msg) => {
      logger.agent('Director', `Script ready, triggering TTS and Assets`);
    });

    messageQueue.subscribe('tts-ready', (msg) => {
      logger.agent('Director', `TTS ready`);
    });

    messageQueue.subscribe('assets-ready', (msg) => {
      logger.agent('Director', `Assets ready`);
    });

    messageQueue.subscribe('video-ready', (msg) => {
      logger.agent('Director', `Video ready, triggering captions`);
    });

    messageQueue.subscribe('caption-ready', (msg) => {
      logger.agent('Director', `Captions ready, production complete!`);
    });
  }
}

export const directorAgent = new DirectorAgent();
export default directorAgent;
