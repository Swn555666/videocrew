import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * Script Agent - 编剧 Agent
 * 基于开源项目: rahulanand1103/youtube-script-writer
 * 
 * 参考架构:
 * - LangGraph 状态图工作流
 * - 多阶段生成: Research → Blueprint → Refined → Script
 * - YouSearch 互联网搜索
 * 
 * 流程:
 * 1. 研究分析 (Research) - 搜索相关资料
 * 2. 创建蓝图 (Blueprint) - 规划视频结构
 * 3. 打磨蓝图 (Refined) - 优化结构
 * 4. 生成脚本 (Script) - 输出完整脚本
 */

const VIDEO_TYPES = {
  documentary: { name: '纪录片', sections: 4, tone: '专业、权威' },
  short: { name: '短视频', sections: 3, tone: '活泼、吸引人' },
  narration: { name: '解说视频', sections: 5, tone: '娓娓道来、有深度' }
};

const TONES = [
  '专业权威', '轻松活泼', '幽默风趣', '严肃认真', 
  '温暖亲切', '理性分析', '激情澎湃', '娓娓道来'
];

/**
 * 研究分析师
 * 参考: youtube-script-writer/src/internet_research/researcher.py
 */
class ResearchAnalyst {
  constructor() {
    this.name = 'Research Analyst';
  }

  /**
   * 生成研究问题
   * 参考: _generate_question()
   */
  async generateQuestions(topic, sectionInfo, previousQuestions = []) {
    logger.agent('Script', `   🔍 生成研究问题...`);
    
    // TODO: 接入 LLM 生成研究问题
    // const prompt = `
    //   Section: ${sectionInfo.title}
    //   Description: ${sectionInfo.description}
    //   Previous Questions: ${previousQuestions.join(', ') || 'None'}
    // `;
    // const question = await llm.call(prompt);
    
    // 模拟返回
    const questions = [
      `${topic}的历史背景是什么？`,
      `${topic}的核心技术有哪些？`,
      `${topic}有哪些实际应用案例？`
    ];
    
    return questions;
  }

  /**
   * 执行互联网搜索
   * 参考: _internet_search() 使用 YouSearchTool
   */
  async searchInternet(question) {
    logger.agent('Script', `   🌍 搜索: ${question.slice(0, 50)}...`);
    
    // TODO: 接入搜索 API
    // - YouSearchTool (langchain_community)
    // - Tavily AI
    // - DuckDuckGo
    
    // 模拟搜索结果
    return {
      question,
      results: [
        {
          title: `关于${question}的研究`,
          content: `这是关于"${question}"的相关内容...`,
          url: 'https://example.com'
        }
      ]
    };
  }

  /**
   * 执行完整的研究流程
   * 参考: run() 使用 StateGraph
   */
  async research(topic, sectionInfo) {
    logger.agent('Script', `   📊 开始研究: ${sectionInfo.title}`);
    
    const questions = await this.generateQuestions(topic, sectionInfo);
    const researchData = [];
    
    for (const question of questions) {
      const result = await this.searchInternet(question);
      researchData.push(result);
    }
    
    return researchData;
  }
}

/**
 * 蓝图创建器
 * 参考: youtube-script-writer/src/blueprint/create_blueprint.py
 */
class BlueprintCreator {
  constructor() {
    this.name = 'Blueprint Creator';
  }

  /**
   * 创建视频蓝图
   * 参考: 结构化输出 schema
   */
  async createBlueprint(topic, videoType, duration, tone) {
    logger.agent('Script', `   📋 创建视频蓝图...`);
    
    // TODO: 接入 LLM 生成结构化蓝图
    // const schema = {
    //   title: string,
    //   sections: [{ title, description, time, pointers }],
    //   targetAudience: string,
    //   keyMessages: [string]
    // };
    
    // 模拟蓝图
    const typeConfig = VIDEO_TYPES[videoType] || VIDEO_TYPES.documentary;
    const sections = [];
    
    // 生成默认章节
    const sectionNames = ['开场引入', '核心内容', '案例分析', '总结收尾'];
    const sectionTime = Math.floor(duration / sectionNames.length);
    
    for (let i = 0; i < sectionNames.length; i++) {
      sections.push({
        section_title: sectionNames[i],
        description: `第${i + 1}部分内容介绍`,
        time: `${Math.floor(i * sectionTime / 60)}:${String(i * sectionTime % 60).padStart(2, '0')}`,
        pointers: [`要点${i + 1}1`, `要点${i + 1}2`]
      });
    }
    
    return {
      title: topic,
      type: videoType,
      duration,
      tone,
      sections,
      targetAudience: '普通观众',
      keyMessages: ['核心观点1', '核心观点2', '核心观点3']
    };
  }
}

/**
 * 蓝图打磨器
 * 参考: youtube-script-writer/src/refined_blueprint/refined_blueprint.py
 */
class BlueprintRefiner {
  constructor() {
    this.name = 'Blueprint Refiner';
  }

  /**
   * 打磨优化蓝图
   */
  async refineBlueprint(blueprint, researchData) {
    logger.agent('Script', `   ✨ 打磨优化蓝图...`);
    
    // TODO: 基于研究数据优化蓝图
    // - 融入研究结果
    // - 调整时间分配
    // - 优化要点
    
    return {
      ...blueprint,
      refined: true,
      researchIntegrated: researchData.length > 0
    };
  }
}

/**
 * 脚本作家
 * 参考: youtube-script-writer/src/writer/writer.py
 */
class ScriptWriter {
  constructor() {
    this.name = 'Script Writer';
  }

  /**
   * 生成章节脚本
   * 参考: _generate_section()
   */
  async writeSection(section, researchData, inputs) {
    logger.agent('Script', `   ✍️ 撰写: ${section.section_title}`);
    
    // TODO: 接入 LLM 撰写脚本
    // const prompt = `
    //   Video Title: ${inputs.title}
    //   Section: ${section.section_title}
    //   Allocated Time: ${section.time}
    //   Research: ${researchData}
    //   Tone: ${inputs.tone}
    // `;
    
    // 模拟生成
    const script = `
【${section.section_title}】(${section.time})

${section.description}相关的详细内容...
这里包含解说词的撰写...

要点1: ${section.pointers?.[0] || '核心观点'}
要点2: ${section.pointers?.[1] || '补充说明'}
`.trim();
    
    return script;
  }

  /**
   * 生成完整脚本
   * 参考: generate()
   */
  async writeScript(blueprint, researchData, inputs) {
    logger.agent('Script', `   📝 开始撰写完整脚本...`);
    
    const scripts = [];
    
    for (const section of blueprint.sections) {
      const sectionScript = await this.writeSection(section, researchData, inputs);
      scripts.push(sectionScript);
    }
    
    // 组装完整脚本
    const fullScript = {
      title: blueprint.title,
      type: blueprint.type,
      duration: blueprint.duration,
      tone: blueprint.tone,
      intro: `【开场】欢迎观看本期节目，今天我们来了解${blueprint.title}...`,
      sections: scripts,
      outro: `【结尾】以上就是关于${blueprint.title}的全部内容，感谢观看！`,
      hashtags: generateHashtags(blueprint.title),
      metadata: {
        createdAt: new Date().toISOString(),
        refined: blueprint.refined,
        sectionsCount: blueprint.sections.length
      }
    };
    
    return fullScript;
  }
}

/**
 * 生成相关话题标签
 */
function generateHashtags(title) {
  const keywords = title.split(/[,，\s]+/).slice(0, 3);
  return keywords.map(k => `#${k}`).concat(['#科普', '#知识分享']);
}

/**
 * Script Agent 主类
 */
class ScriptAgent {
  constructor() {
    this.name = 'Script Agent';
    this.queue = 'script';
    
    // 初始化子模块
    this.researcher = new ResearchAnalyst();
    this.blueprintCreator = new BlueprintCreator();
    this.blueprintRefiner = new BlueprintRefiner();
    this.scriptWriter = new ScriptWriter();
  }

  /**
   * 获取视频类型配置
   */
  getVideoTypes() {
    return Object.entries(VIDEO_TYPES).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 获取可用语气
   */
  getAvailableTones() {
    return TONES;
  }

  /**
   * 生成脚本
   * 主流程: 研究 → 蓝图 → 打磨 → 撰写
   */
  async generate(projectId, topic, type = 'documentary', duration = 180) {
    const taskId = taskManager.createTask(this.name, 'generate-script', {
      projectId,
      topic,
      type,
      duration
    });

    logger.agent(this.name, `📝 开始生成脚本...`, { topic, type, duration });
    logger.info(`   类型: ${VIDEO_TYPES[type]?.name || type}`);
    logger.info(`   时长: ${duration}秒`);

    try {
      // 输入参数
      const tone = TONES[0]; // 默认语气
      const inputs = { topic, title: topic, tone, duration };

      // ===== 阶段1: 研究分析 =====
      logger.agent(this.name, `🔍 阶段1: 研究分析`);
      
      const sectionInfo = {
        title: '主要内容',
        description: `关于${topic}的全面介绍`
      };
      
      // 研究多个方面
      const allResearchData = [];
      const aspects = ['历史背景', '核心原理', '应用场景', '未来发展'];
      
      for (const aspect of aspects) {
        const research = await this.researcher.research(topic, {
          title: aspect,
          description: `${topic}的${aspect}`
        });
        allResearchData.push(...research);
      }
      
      logger.info(`   ✅ 研究完成: ${allResearchData.length} 条资料`);

      // ===== 阶段2: 创建蓝图 =====
      logger.agent(this.name, `📋 阶段2: 创建蓝图`);
      
      const blueprint = await this.blueprintCreator.createBlueprint(
        topic, type, duration, tone
      );
      
      logger.info(`   ✅ 蓝图创建: ${blueprint.sections.length} 个章节`);

      // ===== 阶段3: 打磨蓝图 =====
      logger.agent(this.name, `✨ 阶段3: 打磨优化`);
      
      const refinedBlueprint = await this.blueprintRefiner.refineBlueprint(
        blueprint, allResearchData
      );
      
      logger.info(`   ✅ 蓝图打磨完成`);

      // ===== 阶段4: 撰写脚本 =====
      logger.agent(this.name, `✍️ 阶段4: 撰写脚本`);
      
      const script = await this.scriptWriter.writeScript(
        refinedBlueprint, allResearchData, inputs
      );
      
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
    // 从脚本中提取场景
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
        // 提取解说词
        const narrationMatch = section.match(/【[\u4e00-\u9fa5]+】.*?\n\n([\s\S]*?)(?=\n\n【|$)/);
        const narration = narrationMatch 
          ? narrationMatch[1].trim() 
          : section;
        
        scenes.push({
          id: i + 2,
          description: `第${i + 1}部分内容`,
          narration: narration.slice(0, 200),
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
      tone: script.tone,
      metadata: script.metadata
    };
  }
}

export const scriptAgent = new ScriptAgent();
export default scriptAgent;
