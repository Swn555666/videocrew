/**
 * Sub-Agent: Script Writer
 * 负责撰写脚本
 * 
 * 基于: youtube-script-writer/src/writer/writer.py
 */
import { logger } from '../../core/logger.js';

export class ScriptWriter {
  constructor() {
    this.name = 'Script Writer';
  }

  /**
   * 撰写章节脚本
   */
  async writeSection(section, researchData, inputs) {
    logger.agent(this.name, `✍️ 撰写: ${section.section_title}`);
    
    // TODO: 接入 LLM
    // const prompt = `
    //   Title: ${inputs.title}
    //   Section: ${section.section_title}
    //   Time: ${section.time}
    //   Research: ${researchData}
    //   Tone: ${inputs.tone}
    // `;
    
    return `
【${section.section_title}】(${section.time})

${section.description}相关内容...
这里包含详细的解说词撰写...

要点1: ${section.pointers?.[0] || '核心观点'}
要点2: ${section.pointers?.[1] || '补充说明'}
`.trim();
  }

  /**
   * 撰写完整脚本
   */
  async writeScript(blueprint, researchData, inputs) {
    logger.agent(this.name, `📝 撰写完整脚本`);
    
    const scripts = [];
    
    // 撰写每个章节
    for (const section of blueprint.sections) {
      const sectionScript = await this.writeSection(section, researchData, inputs);
      scripts.push(sectionScript);
    }
    
    // 组装完整脚本
    return {
      title: blueprint.title,
      type: blueprint.type,
      duration: blueprint.duration,
      tone: blueprint.tone,
      intro: `【开场】欢迎观看本期节目，今天我们来了解${blueprint.title}...`,
      sections: scripts,
      outro: `【结尾】以上就是关于${blueprint.title}的全部内容，感谢观看！`,
      hashtags: this.generateHashtags(blueprint.title),
      metadata: {
        createdAt: new Date().toISOString(),
        refined: blueprint.refined,
        sectionsCount: blueprint.sections.length
      }
    };
  }

  /**
   * 生成话题标签
   */
  generateHashtags(title) {
    const keywords = title.split(/[,，\s]+/).slice(0, 3);
    return keywords.map(k => `#${k}`).concat(['#科普', '#知识分享']);
  }
}

export default new ScriptWriter();
