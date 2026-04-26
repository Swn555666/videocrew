import { logger } from '../core/logger.js';
import { taskManager, TaskStatus } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { generateScript } from '../utils/openai.js';
import { storage } from '../utils/storage.js';

/**
 * Script Agent - 编剧 Agent
 * 负责根据主题生成视频脚本
 */
class ScriptAgent {
  constructor() {
    this.name = 'Script Agent';
    this.queue = 'script';
  }

  /**
   * 生成脚本
   */
  async generate(projectId, topic, type = 'documentary', duration = 180) {
    const taskId = taskManager.createTask(this.name, 'generate-script', {
      projectId,
      topic,
      type,
      duration
    });

    logger.agent(this.name, `Generating script for: ${topic}`, { taskId, type, duration });

    try {
      // 调用 OpenAI 生成脚本
      const script = await generateScript(topic, type, duration);
      
      // 保存脚本到项目
      const projectPath = storage.getProjectPath(projectId);
      const scriptPath = storage.saveScript(projectPath, script);

      // 发送脚本就绪消息
      messageQueue.send('script-ready', {
        taskId,
        projectId,
        script,
        scriptPath
      });

      taskManager.completeTask(taskId, { script, scriptPath });

      logger.agent(this.name, `Script generated successfully`, { 
        taskId, 
        title: script.title,
        scenes: script.scenes?.length || 0 
      });

      return { success: true, script, scriptPath, taskId };
    } catch (error) {
      logger.error(`Script generation failed`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理素材请求
   */
  async handleAssetRequest(message) {
    const { script, projectId } = message.payload;
    
    logger.agent(this.name, `Analyzing assets needed from script`);

    // 从脚本中提取素材需求
    const assetsNeeded = [];
    if (script.scenes) {
      script.scenes.forEach((scene, index) => {
        if (scene.assets_needed) {
          assetsNeeded.push(...scene.assets_needed.map(asset => ({
            sceneId: scene.id,
            asset,
            priority: index < 3 ? 'high' : 'medium'
          })));
        }
      });
    }

    messageQueue.send('asset-request', {
      projectId,
      assetsNeeded,
      script
    });

    return assetsNeeded;
  }
}

export const scriptAgent = new ScriptAgent();
export default scriptAgent;
