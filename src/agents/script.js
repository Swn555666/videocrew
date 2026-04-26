import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
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

    logger.agent(this.name, `📝 正在生成脚本...`, { topic, type, duration });

    try {
      // 检查是否有 API Key
      const hasApiKey = process.env.OPENAI_API_KEY && 
                        process.env.OPENAI_API_KEY !== 'your-api-key-here';

      let script;

      if (hasApiKey) {
        // 有 API Key，调用 OpenAI
        script = await generateScript(topic, type, duration);
      } else {
        // 无 API Key，使用模拟数据
        logger.warn('⚠️ 未配置 OpenAI API Key，使用模拟脚本');
        script = this.generateMockScript(topic, type, duration);
      }
      
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

      logger.agent(this.name, `✅ 脚本生成成功`, { 
        title: script.title,
        scenes: script.scenes?.length || 0 
      });

      return { success: true, script, scriptPath, taskId };
    } catch (error) {
      logger.error(`❌ 脚本生成失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成模拟脚本（用于测试）
   */
  generateMockScript(topic, type, duration) {
    logger.info(`   生成模拟脚本: ${topic}`);

    // 根据类型生成不同的场景
    const sceneTemplates = {
      documentary: [
        { description: '开场画面 - 壮阔的自然景观或城市天际线', narration: '欢迎观看本期节目。' },
        { description: '历史资料画面 - 黑白照片或老录像', narration: '让我们一起回顾历史。' },
        { description: '专家访谈画面 - 人物特写', narration: '专家认为，这个领域发展迅速。' },
        { description: '数据图表展示 - 动画效果', narration: '数据显示，过去几年增长显著。' },
        { description: '结尾画面 - 总结回顾', narration: '以上就是本期节目的全部内容。' }
      ],
      short: [
        { description: '吸引眼球的画面 - 有趣的瞬间', narration: '你知道吗？' },
        { description: '核心内容展示', narration: '这个话题非常重要。' },
        { description: '精彩结尾 - 悬念或总结', narration: '让我们拭目以待！' }
      ],
      narration: [
        { description: '知识引入 - 问题或现象', narration: '今天我们来探讨一个有趣的话题。' },
        { description: '深入分析 - 案例或数据', narration: '让我们详细分析一下。' },
        { description: '总结要点 - 关键结论', narration: '总结一下今天的内容。' }
      ]
    };

    const templates = sceneTemplates[type] || sceneTemplates.documentary;
    
    // 生成场景
    const scenes = templates.map((template, index) => ({
      id: index + 1,
      description: template.description,
      narration: template.narration,
      duration: Math.floor(duration / templates.length),
      assets_needed: [
        index === 0 ? '开场画面' : '相关素材',
        index === templates.length - 1 ? '结尾画面' : '过渡素材'
      ]
    }));

    // 计算总时长
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    return {
      title: `${topic} - ${type === 'documentary' ? '纪录片' : type === 'short' ? '短视频' : '解说视频'}`,
      type,
      duration,
      scenes,
      totalDuration,
      mock: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 处理素材请求
   */
  async handleAssetRequest(message) {
    const { script, projectId } = message.payload;
    
    logger.agent(this.name, `📦 分析素材需求`);

    const assetsNeeded = [];
    if (script.scenes) {
      script.scenes.forEach((scene, index) => {
        if (scene.assets_needed) {
          assetsNeeded.push(...scene.assets_needed.map(asset => ({
            sceneId: scene.id,
            asset,
            priority: index < 2 ? 'high' : 'medium'
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
