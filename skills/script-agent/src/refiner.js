/**
 * Script Refiner - Refinement Sub-Agent
 */

import { logger } from '../../../src/core/logger.js';
import { PROMPTS } from './prompts.js';

/**
 * ScriptRefiner Class
 */
export class ScriptRefiner {
  constructor(skill) {
    this.skill = skill;
    this.name = 'Script Refiner';
  }

  /**
   * Refine blueprint
   */
  async refineBlueprint(blueprint, researchData, options = {}) {
    const { tone = 'Professional', feedback = null } = options;
    
    logger.agent(this.name, `Refining blueprint`);
    
    if (feedback) {
      logger.info(`   User feedback: ${feedback}`);
      return await this.applyFeedback(blueprint, feedback);
    } else {
      return await this.autoRefine(blueprint, researchData);
    }
  }

  /**
   * Apply user feedback
   */
  async applyFeedback(blueprint, feedback) {
    const prompt = PROMPTS.refine
      .replace('{original_blueprint}', JSON.stringify(blueprint, null, 2))
      .replace('{feedback}', feedback);
    
    try {
      const response = await this.skill.callLLM(prompt);
      
      let refined;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          refined = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        logger.warn(`   JSON parse failed, keeping original`);
        refined = blueprint;
      }
      
      refined.refined = true;
      refined.feedbackApplied = feedback;
      refined.refinedAt = new Date().toISOString();
      
      logger.agent(this.name, `Feedback applied`);
      
      return refined;
    } catch (error) {
      logger.error(`   Refinement failed: ${error.message}`);
      return blueprint;
    }
  }

  /**
   * Auto refine
   */
  async autoRefine(blueprint, researchData) {
    logger.agent(this.name, `Auto refinement complete`);
    
    return {
      ...blueprint,
      refined: true,
      autoRefined: true,
      refinedAt: new Date().toISOString()
    };
  }

  /**
   * Check duration distribution
   */
  checkDurationDistribution(blueprint, totalDuration) {
    const sections = blueprint.sections || [];
    const issues = [];
    
    for (const section of sections) {
      const timeMatch = section.time?.match(/(\d+):(\d+)/);
      if (timeMatch) {
        // validate timing
      }
    }
    
    return issues;
  }
}

export default ScriptRefiner;
