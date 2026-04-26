/**
 * Script Planner - Blueprint Planning Sub-Agent
 */

import { logger } from '../../../src/core/logger.js';
import { PROMPTS, VIDEO_TYPES } from './prompts.js';

/**
 * ScriptPlanner Class
 */
export class ScriptPlanner {
  constructor(skill) {
    this.skill = skill;
    this.name = 'Script Planner';
  }

  /**
   * Create video blueprint
   */
  async createBlueprint(topic, researchData, options = {}) {
    const { type = 'documentary', duration = 180, tone = 'Professional' } = options;
    
    logger.agent(this.name, `Creating blueprint: ${topic}`);
    logger.info(`   Type: ${type}, Duration: ${duration}s, Tone: ${tone}`);
    
    // Get type config
    const typeConfig = VIDEO_TYPES[type] || VIDEO_TYPES.documentary;
    
    // Format research data
    const researchText = this.formatResearchData(researchData);
    
    // Call LLM to generate blueprint
    const prompt = PROMPTS.blueprint
      .replace('{research_data}', researchText)
      .replace('{duration}', duration.toString())
      .replace('{type}', type)
      .replace('{tone}', tone);
    
    try {
      const response = await this.skill.callLLM(prompt);
      
      // Parse JSON response
      let blueprint;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          blueprint = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        logger.warn(`   JSON parse failed, using default blueprint`);
        blueprint = this.createDefaultBlueprint(topic, type, duration);
      }
      
      // Validate and complete blueprint
      blueprint = this.validateBlueprint(blueprint, topic, type, duration);
      
      logger.agent(this.name, `Blueprint created: ${blueprint.sections?.length || 0} sections`);
      
      return blueprint;
    } catch (error) {
      logger.error(`   Blueprint creation failed: ${error.message}`);
      return this.createDefaultBlueprint(topic, type, duration);
    }
  }

  /**
   * Format research data
   */
  formatResearchData(researchData) {
    if (!researchData) return 'No research data';
    if (typeof researchData === 'string') return researchData;
    if (researchData.results) {
      return researchData.results
        .map(r => `- ${r.query}: ${r.results?.map(rr => rr.content).join(' ')}`)
        .join('\n');
    }
    return JSON.stringify(researchData);
  }

  /**
   * Create default blueprint
   */
  createDefaultBlueprint(topic, type, duration) {
    const sectionCount = VIDEO_TYPES[type]?.sections || 4;
    const sections = [];
    
    const sectionNames = ['Opening', 'Core Content', 'Case Analysis', 'Summary'];
    const sectionDuration = Math.floor(duration / sectionCount);
    
    for (let i = 0; i < sectionCount; i++) {
      sections.push({
        section_title: sectionNames[i] || `Part ${i + 1}`,
        description: `Content for ${sectionNames[i]}`,
        time: this.formatTime(i * sectionDuration),
        pointers: [`Point ${i + 1}-1`, `Point ${i + 1}-2`]
      });
    }
    
    return {
      title: topic,
      type,
      duration,
      sections,
      targetAudience: 'General audience',
      keyMessages: ['Key point 1', 'Key point 2', 'Key point 3']
    };
  }

  /**
   * Validate and complete blueprint
   */
  validateBlueprint(blueprint, topic, type, duration) {
    return {
      title: blueprint.title || topic,
      type: blueprint.type || type,
      duration: blueprint.duration || duration,
      sections: blueprint.sections || [],
      targetAudience: blueprint.targetAudience || 'General audience',
      keyMessages: blueprint.keyMessages || [],
      validated: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Format time
   */
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

export default ScriptPlanner;
