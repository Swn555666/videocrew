/**
 * Script Agent Skill
 * 
 * Based on OpenFilm architecture for video script generation
 */

import OpenAI from 'openai';
import { logger } from '../../../src/core/logger.js';
import { PROMPTS } from './prompts.js';
import { ScriptResearcher } from './researcher.js';
import { ScriptPlanner } from './planner.js';
import { ScriptRefiner } from './refiner.js';
import { ScriptWriter } from './writer.js';

/**
 * ScriptSkill Main Class
 */
export class ScriptSkill {
  constructor(options = {}) {
    this.name = 'ScriptSkill';
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.model = options.model || 'gpt-4o';
    this.maxTokens = options.maxTokens || 4096;
    
    // Initialize OpenAI client
    if (this.apiKey && this.apiKey !== 'your-api-key-here') {
      this.client = new OpenAI({ apiKey: this.apiKey });
    } else {
      this.client = null;
      logger.warn('OpenAI API Key not configured, using mock mode');
    }
    
    // Initialize sub-agents
    this.researcher = new ScriptResearcher(this);
    this.planner = new ScriptPlanner(this);
    this.refiner = new ScriptRefiner(this);
    this.writer = new ScriptWriter(this);
  }

  /**
   * Generate complete video script
   */
  async generateScript(topic, options = {}) {
    const { type = 'documentary', duration = 180, tone = 'Professional' } = options;
    
    logger.info(`ScriptSkill: Generating script`, { topic, type, duration });
    
    try {
      // Phase 1: Research
      logger.agent(this.name, 'Phase 1: Research');
      const researchData = await this.research(topic, { type, duration });
      
      // Phase 2: Blueprint
      logger.agent(this.name, 'Phase 2: Create Blueprint');
      const blueprint = await this.createBlueprint(topic, researchData, { type, duration, tone });
      
      // Phase 3: Refine
      logger.agent(this.name, 'Phase 3: Refine');
      const refinedBlueprint = await this.refineBlueprint(blueprint, researchData, { tone });
      
      // Phase 4: Write
      logger.agent(this.name, 'Phase 4: Write Script');
      const script = await this.writeScript(refinedBlueprint, { type, duration });
      
      return {
        success: true,
        script,
        researchData,
        blueprint: refinedBlueprint
      };
    } catch (error) {
      logger.error(`ScriptSkill error`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Research
   */
  async research(topic, options = {}) {
    return this.researcher.research(topic, options);
  }

  /**
   * Create Blueprint
   */
  async createBlueprint(topic, researchData, options = {}) {
    return this.planner.createBlueprint(topic, researchData, options);
  }

  /**
   * Refine Blueprint
   */
  async refineBlueprint(blueprint, researchData, options = {}) {
    return this.refiner.refineBlueprint(blueprint, researchData, options);
  }

  /**
   * Write Script
   */
  async writeScript(blueprint, options = {}) {
    return this.writer.writeScript(blueprint, options);
  }

  /**
   * Call LLM
   */
  async callLLM(prompt, systemPrompt = PROMPTS.system) {
    if (!this.client) {
      return this.mockLLMResponse(prompt);
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      logger.error(`LLM call failed`, { error: error.message });
      throw error;
    }
  }

  /**
   * Mock LLM Response
   */
  mockLLMResponse(prompt) {
    if (prompt.includes('search') || prompt.includes('Search')) {
      return 'AI history\nAI technology\nAI applications\nAI future trends\nAI ethics';
    }
    
    if (prompt.includes('blueprint') || prompt.includes('Blueprint')) {
      return JSON.stringify({
        title: 'AI Future',
        sections: [
          { section_title: 'Intro', description: 'Opening hook', time: '00:00', pointers: ['Hook', 'Topic intro'] },
          { section_title: 'Core', description: 'Main content', time: '00:30', pointers: ['Point 1', 'Point 2'] }
        ],
        targetAudience: 'General audience',
        keyMessages: ['Message 1', 'Message 2']
      });
    }
    
    return 'Mock response';
  }
}

export default ScriptSkill;
