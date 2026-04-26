import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

// 导入子 Agent
import { 
  scriptResearcher, 
  scriptBlueprint, 
  scriptRefiner, 
  scriptWriter 
} from './sub/index.js';

/**
 * Script Agent - 编剧 Agent
 * 
 * 使用子 Agent:
 * - scriptResearcher: 研究分析
 * - scriptBlueprint: 蓝图创建
 * - scriptRefiner: 蓝图打磨
 * - scriptWriter: 脚本撰写
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

    logger.agent(this.name, `📝 开始生成脚本...`, { topic, type, duration });

    try {
      // ===== 阶段1: 研究分析 =====
      logger.agent(this.name, `🔍 阶段1: 研究分析`);
      
      const sectionInfo = {
        title: '主要内容',
        description: `关于${topic}的全面介绍`
      };
      
      // 使用 scriptResearcher 子 Agent
      const aspects = ['历史背景', '核心原理', '应用场景', '未来发展'];
      const allResearchData = [];
      
      for (const aspect of aspects) {
        const research = await scriptResearcher.research(topic, {
          title: aspect,
          description: `${topic}的${aspect}`
        });
        allResearchData.push(...research);
      }
      
      logger.info(`   ✅ 研究完成: ${allResearchData.length} 条资料`);

      // ===== 阶段2: 创建蓝图 =====
      logger.agent(this.name, `📋 阶段2: 创建蓝图`);
      
      // 使用 scriptBlueprint 子 Agent
      const blueprint = await scriptBlueprint.createBlueprint(topic, type, duration);
      
      logger.info(`   ✅ 蓝图创建: ${blueprint.sections.length} 个章节`);

      // ===== 阶段3: 打磨优化 =====
      logger.agent(this.name, `✨ 阶段3: 打磨优化`);
      
      // 使用 scriptRefiner 子 Agent
      const refinedBlueprint = await scriptRefiner.refineBlueprint(blueprint, allResearchData);
      
      logger.info(`   ✅ 蓝图打磨完成`);

      // ===== 阶段4: 撰写脚本 =====
      logger.agent(this.name, `✍️ 阶段4: 撰写脚本`);
      
      // 使用 scriptWriter 子 Agent
      const inputs = { title: topic, tone: blueprint.tone, duration };
      const script = await scriptWriter.writeScript(refinedBlueprint, allResearchData, inputs);
      
      logger.info(`   ✅ 脚本撰写完成`);

      // ===== 转换为输出格式 =====
      const finalScript = this.convertToOutputFormat(script, type, duration);
      
      // ===== 保存 =====
      const projectPath = storage.getProjectPath(projectId);
      const scriptPath = storage.saveScript(projectPath, finalScript);
      
      // 保存研究数据
      storage.writeJSON(projectPath, 'research.json', {
        queries: aspects,
        data: allResearchData,
        blueprint: refinedBlueprint
      });

      // 发送完成消息
      messageQueue.send('script-ready', {
        taskId,
        projectId,
        script: finalScript,
        scriptPath
      });

      taskManager.completeTask(taskId, { script: finalScript, scriptPath });

      logger.agent(this.name, `✅ 脚本生成成功`, { 
        title: finalScript.title,
        scenes: finalScript.scenes?.length || 0
      });

      return { success: true, script: finalScript, scriptPath, taskId };
    } catch (error) {
      logger.error(`❌ 脚本生成失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 转换为标准输出格式
   */
  convertToOutputFormat(script, type, duration) {
    const scenes = [];
    
    // 开场
    scenes.push({
      id: 1,
      description: '开场画面 - 吸引观众注意',
      narration: script.intro || `欢迎观看本期节目`,
      duration: 15,
      assets_needed: ['开场画面', '背景音乐']
    });
    
    // 中间章节
    if (script.sections) {
      script.sections.forEach((section, i) => {
        scenes.push({
          id: i + 2,
          description: `第${i + 1}部分内容`,
          narration: section.slice(0, 200),
          duration: Math.floor((duration - 30) / (script.sections.length || 1)),
          assets_needed: ['相关素材', '过渡动画']
        });
      });
    }
    
    // 结尾
    scenes.push({
      id: scenes.length + 1,
      description: '结尾画面 - 总结和呼吁',
      narration: script.outro || '以上就是全部内容，感谢观看！',
      duration: 15,
      assets_needed: ['结尾画面', '关注引导']
    });
    
    return {
      title: script.title,
      type,
      duration,
      scenes,
      totalDuration: duration,
      hashtags: script.hashtags || [],
      tone: script.tone
    };
  }
}

export const scriptAgent = new ScriptAgent();
export default scriptAgent;
