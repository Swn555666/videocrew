/**
 * Script Writer - Script Writing Sub-Agent
 */

import { logger } from '../../../src/core/logger.js';
import { PROMPTS } from './prompts.js';

/**
 * ScriptWriter Class
 */
export class ScriptWriter {
  constructor(skill) {
    this.skill = skill;
    this.name = 'Script Writer';
  }

  /**
   * Write complete script
   */
  async writeScript(blueprint, options = {}) {
    const { type = 'documentary', duration = 180, tone = 'Professional' } = options;
    
    logger.agent(this.name, `Writing video script`);
    
    const prompt = PROMPTS.script
      .replace('{blueprint}', JSON.stringify(blueprint, null, 2))
      .replace('{type}', type)
      .replace('{duration}', duration.toString())
      .replace('{tone}', tone);
    
    try {
      const response = await this.skill.callLLM(prompt);
      
      let script;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          script = JSON.parse(jsonMatch[0]);
        } else {
          script = this.parseMarkdownScript(response, blueprint);
        }
      } catch (e) {
        logger.warn(`   JSON parse failed`);
        script = this.parseMarkdownScript(response, blueprint);
      }
      
      const standardScript = this.convertToStandardFormat(script, blueprint, type, duration);
      
      logger.agent(this.name, `Script writing complete`);
      
      return standardScript;
    } catch (error) {
      logger.error(`   Script writing failed: ${error.message}`);
      return this.createDefaultScript(blueprint, type, duration);
    }
  }

  /**
   * Parse markdown format script
   */
  parseMarkdownScript(markdown, blueprint) {
    return {
      title: blueprint.title,
      intro: 'Welcome to this episode...',
      sections: (blueprint.sections || []).map(s => ({
        section_title: s.section_title,
        time: s.time,
        narration: s.description + '...'
      })),
      outro: 'That concludes this episode!',
      hashtags: this.generateHashtags(blueprint.title),
      visual_notes: 'Use footage and text animation'
    };
  }

  /**
   * Convert to standard output format
   */
  convertToStandardFormat(script, blueprint, type, duration) {
    const scenes = [];
    
    // Opening
    scenes.push({
      id: 1,
      description: 'Opening - Attract attention',
      narration: script.intro || 'Welcome to this episode',
      duration: 15,
      assets_needed: ['Opening footage', 'Background music']
    });
    
    // Middle sections
    if (script.sections && script.sections.length > 0) {
      script.sections.forEach((section, i) => {
        scenes.push({
          id: i + 2,
          description: section.description || section.section_title || `Part ${i + 1}`,
          narration: section.narration || section.description,
          duration: Math.floor((duration - 30) / (script.sections.length || 1)),
          assets_needed: ['Related footage', 'Transition animation']
        });
      });
    }
    
    // Ending
    scenes.push({
      id: scenes.length + 1,
      description: 'Ending - Summary and CTA',
      narration: script.outro || 'Thanks for watching!',
      duration: 15,
      assets_needed: ['Ending footage', 'Subscribe prompt']
    });
    
    return {
      title: script.title || blueprint.title,
      type,
      duration,
      scenes,
      totalDuration: duration,
      hashtags: script.hashtags || this.generateHashtags(blueprint.title),
      visual_notes: script.visual_notes || '',
      tone: script.tone || 'Professional',
      metadata: {
        createdAt: new Date().toISOString(),
        blueprint: blueprint.title,
        sectionsCount: scenes.length
      }
    };
  }

  /**
   * Create default script
   */
  createDefaultScript(blueprint, type, duration) {
    const scenes = [];
    
    scenes.push({
      id: 1,
      description: 'Opening',
      narration: 'Welcome',
      duration: 15,
      assets_needed: ['Opening footage']
    });
    
    (blueprint.sections || []).forEach((section, i) => {
      scenes.push({
        id: i + 2,
        description: section.section_title,
        narration: section.description,
        duration: Math.floor((duration - 30) / (blueprint.sections?.length || 1)),
        assets_needed: ['Footage']
      });
    });
    
    scenes.push({
      id: scenes.length + 1,
      description: 'Ending',
      narration: 'Thanks for watching',
      duration: 15,
      assets_needed: ['Ending footage']
    });
    
    return {
      title: blueprint.title,
      type,
      duration,
      scenes,
      totalDuration: duration,
      hashtags: this.generateHashtags(blueprint.title)
    };
  }

  /**
   * Generate hashtags
   */
  generateHashtags(title) {
    if (!title) return ['#Education', '#Knowledge'];
    
    const keywords = title.split(/[,,\s]+/).slice(0, 3);
    const tags = keywords.map(k => `#${k.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '')}`);
    
    return [...new Set([...tags, '#Education', '#Knowledge'])].slice(0, 5);
  }
}

export default ScriptWriter;
