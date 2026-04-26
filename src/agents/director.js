import { v4 as uuidv4 } from 'uuid';
import { logger } from '../core/logger.js';
import { taskManager, TaskStatus } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * Director Agent - 导演 Agent
 * 统筹协调所有 Agent 的工作
 * 
 * 工作流程：
 * 1. 编剧生成脚本
 * 2. TTS + Asset 并行执行
 * 3. 剪辑合成视频
 * 4. 生成字幕
 * 5. 最终合成输出
 */
class DirectorAgent {
  constructor() {
    this.name = 'Director';
    this.projectId = null;
    this.state = 'idle';
    this.listenersStarted = false;
  }

  /**
   * 创建新项目
   */
  createProject(topic, type = 'documentary', duration = 180) {
    this.projectId = uuidv4();
    this.state = 'planning';

    logger.info(`🎬 创建新项目`, { projectId: this.projectId, topic, type, duration });

    // 创建项目文件夹
    const projectPath = storage.createProject(this.projectId, topic);

    // 保存项目配置
    const config = { topic, type, duration, createdAt: new Date().toISOString() };
    storage.writeJSON(projectPath, 'config.json', config);

    return this.projectId;
  }

  /**
   * 启动消息监听（事件驱动模式）
   */
  startListening() {
    if (this.listenersStarted) return;
    this.listenersStarted = true;

    // 监听脚本就绪 → 触发 TTS 和 Asset 并行
    messageQueue.subscribe('script-ready', async (msg) => {
      logger.agent('Director', `📝 脚本就绪，触发 TTS 和素材并行执行`);
      const { projectId, script } = msg.payload;
      
      // 导入 agents
      const { ttsAgent, assetAgent } = await import('./script.js').then(m => ({ ttsAgent: m.scriptAgent })).catch(() => ({ ttsAgent: null }));
    });

    // 监听 TTS 和素材都就绪 → 触发剪辑
    messageQueue.subscribe('tts-ready', (msg) => {
      logger.agent('Director', `🎙️ TTS 就绪，等待素材中...`);
      this.checkAndTriggerEdit(msg.payload.projectId);
    });

    messageQueue.subscribe('assets-ready', (msg) => {
      logger.agent('Director', `📦 素材就绪，等待 TTS 中...`);
      this.checkAndTriggerEdit(msg.payload.projectId);
    });

    // 监听视频就绪 → 触发字幕
    messageQueue.subscribe('video-ready', (msg) => {
      logger.agent('Director', `🎞️ 视频就绪，触发字幕生成`);
      const { projectId } = msg.payload;
      this.phaseCaption(projectId);
    });

    // 监听字幕就绪 → 完成
    messageQueue.subscribe('caption-ready', (msg) => {
      logger.agent('Director', `✅ 字幕就绪，制作完成！`);
      const { projectId, subtitlePath } = msg.payload;
      this.finalize(projectId, subtitlePath);
    });
  }

  /**
   * 检查是否可以触发剪辑（需 TTS 和 Asset 都完成）
   */
  checkAndTriggerEdit(projectId) {
    const projectPath = storage.getProjectPath(projectId);
    
    // 检查是否有音频
    const audioExists = storage.exists(`${projectPath}/audio/narration.mp3`);
    // 检查是否有素材清单
    const assetsExist = storage.exists(`${projectPath}/assets-manifest.json`);
    
    if (audioExists && assetsExist) {
      logger.agent('Director', `🎙️ TTS 和 📦 素材都已就绪，开始剪辑`);
      this.phaseEdit(projectId);
    }
  }

  /**
   * 开始制作视频（顺序模式）
   */
  async produce(topic, type = 'documentary', duration = 180) {
    const projectId = this.createProject(topic, type, duration);

    logger.info(`🎬 开始视频制作`, { projectId });

    try {
      // 阶段 1: 生成脚本（必须先完成）
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`📝 阶段1: 编剧Agent生成脚本`);
      logger.info(`${'='.repeat(50)}`);
      
      const scriptResult = await this.phaseScript(projectId, topic, type, duration);
      if (!scriptResult.success) throw new Error('脚本生成失败');
      this.saveOutput(projectId, 'script', scriptResult.scriptPath);

      // 阶段 2: TTS 和 素材 并行
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`🎙️ 阶段2: TTS配音 + 📦 素材收集 (并行执行)`);
      logger.info(`${'='.repeat(50)}`);
      
      const [ttsResult, assetResult] = await Promise.all([
        this.phaseTTS(projectId, scriptResult.script),
        this.phaseAssets(projectId, scriptResult.script)
      ]);

      if (!ttsResult.success) throw new Error('配音生成失败');
      if (!assetResult.success) throw new Error('素材收集失败');
      
      this.saveOutput(projectId, 'audio', ttsResult.audioPath);
      this.saveOutput(projectId, 'assets', assetResult.assetsPath);

      // 阶段 3: 剪辑合成
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`🎞️ 阶段3: 剪辑Agent合成视频`);
      logger.info(`${'='.repeat(50)}`);
      
      const videoResult = await this.phaseEdit(projectId);
      if (!videoResult.success) throw new Error('视频剪辑失败');
      
      this.saveOutput(projectId, 'video', videoResult.videoPath);

      // 阶段 4: 生成字幕
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`📝 阶段4: 字幕Agent生成字幕`);
      logger.info(`${'='.repeat(50)}`);
      
      const captionResult = await this.phaseCaption(projectId);
      if (!captionResult.success) throw new Error('字幕生成失败');
      
      this.saveOutput(projectId, 'subtitles', captionResult.subtitlePath);

      // 阶段 5: 最终合成
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`🎬 阶段5: 最终合成输出`);
      logger.info(`${'='.repeat(50)}`);
      
      const finalResult = await this.phaseFinal(projectId);
      this.state = 'completed';

      const finalOutput = {
        projectId,
        status: 'completed',
        topic,
        outputs: this.getOutputs(projectId)
      };

      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`✅ 视频制作完成！`);
      logger.info(`${'='.repeat(50)}`);
      this.printOutputs(finalOutput.outputs);

      return finalOutput;

    } catch (error) {
      this.state = 'failed';
      logger.error(`制作失败`, { error: error.message });
      return { projectId, status: 'failed', error: error.message };
    }
  }

  /**
   * 阶段1: 脚本生成
   */
  async phaseScript(projectId, topic, type, duration) {
    const { scriptAgent } = await import('./script.js');
    return await scriptAgent.generate(projectId, topic, type, duration);
  }

  /**
   * 阶段2a: TTS 生成
   */
  async phaseTTS(projectId, script) {
    const { ttsAgent } = await import('./tts.js');
    return await ttsAgent.generate(projectId, script);
  }

  /**
   * 阶段2b: 素材收集
   */
  async phaseAssets(projectId, script) {
    const { assetAgent } = await import('./asset.js');
    
    // 从脚本提取素材需求
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
    
    return await assetAgent.collect(projectId, assetsNeeded, script);
  }

  /**
   * 阶段3: 视频剪辑
   */
  async phaseEdit(projectId) {
    const { editorAgent } = await import('./editor.js');
    return await editorAgent.edit(projectId);
  }

  /**
   * 阶段4: 字幕生成
   */
  async phaseCaption(projectId) {
    const { captionAgent } = await import('./caption.js');
    const projectPath = storage.getProjectPath(projectId);
    const audioPath = `${projectPath}/audio/narration.mp3`;
    
    return await captionAgent.generate(projectId, audioPath);
  }

  /**
   * 阶段5: 最终合成（视频+字幕）
   */
  async phaseFinal(projectId) {
    const { editorAgent } = await import('./editor.js');
    return await editorAgent.finalize(projectId);
  }

  /**
   * 保存输出路径
   */
  saveOutput(projectId, type, path) {
    const projectPath = storage.getProjectPath(projectId);
    const manifest = storage.readJSON(projectPath, 'manifest.json') || {};
    
    if (!manifest.outputs) manifest.outputs = {};
    manifest.outputs[type] = path;
    
    storage.writeJSON(projectPath, 'manifest.json', manifest);
  }

  /**
   * 获取所有输出
   */
  getOutputs(projectId) {
    const projectPath = storage.getProjectPath(projectId);
    const manifest = storage.readJSON(projectPath, 'manifest.json');
    return manifest?.outputs || {};
  }

  /**
   * 打印输出列表
   */
  printOutputs(outputs) {
    const icons = {
      script: '📄',
      audio: '🎙️',
      video: '🎞️',
      subtitles: '📝'
    };
    
    for (const [type, path] of Object.entries(outputs)) {
      const icon = icons[type] || '📦';
      logger.info(`   ${icon} ${type}: ${path}`);
    }
  }

  /**
   * 完成制作
   */
  finalize(projectId, subtitlePath) {
    this.state = 'completed';
    const outputs = this.getOutputs(projectId);
    
    logger.info(`\n✅ 全部完成！`);
    this.printOutputs(outputs);
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
}

export const directorAgent = new DirectorAgent();
export default directorAgent;
