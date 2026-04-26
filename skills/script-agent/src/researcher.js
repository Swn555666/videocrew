/**
 * Script Researcher - Research Analysis Sub-Agent
 */

import { logger } from '../../../src/core/logger.js';

/**
 * ScriptResearcher Class
 */
export class ScriptResearcher {
  constructor(skill) {
    this.skill = skill;
    this.name = 'Script Researcher';
  }

  /**
   * Execute complete research flow
   */
  async research(topic, options = {}) {
    const { count = 5 } = options;
    
    logger.agent(this.name, `Starting research: ${topic}`);
    
    // 1. Generate search queries
    const queries = await this.generateQueries(topic, { count });
    logger.info(`   Generated ${queries.length} search queries`);
    
    // 2. Execute search
    const results = [];
    for (const query of queries) {
      const result = await this.search(query);
      if (result) {
        results.push(result);
      }
    }
    
    logger.agent(this.name, `Research complete: ${results.length} results`);
    
    return {
      topic,
      queries,
      results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate search queries
   */
  async generateQueries(topic, options = {}) {
    const { count = 5 } = options;
    
    logger.agent(this.name, `Generating ${count} search queries...`);
    
    const prompt = `
Based on the topic "${topic}", generate ${count} search queries.

Requirements:
- Query is concise (4-6 words)
- Cover different aspects
- One query per line, no numbering

Example output:
AI history
AI core technology`;

    try {
      const response = await this.skill.callLLM(prompt, 'You are a research assistant.');
      
      // Parse queries
      const queries = response
        .split('\n')
        .map(q => q.trim())
        .filter(q => q && !q.startsWith('#') && !q.match(/^\d/))
        .slice(0, count);
      
      return queries;
    } catch (error) {
      logger.error(`   Query generation failed, using default queries`);
      return [
        `${topic} history`,
        `${topic} core technology`,
        `${topic} applications`,
        `${topic} development`,
        `${topic} future`
      ];
    }
  }

  /**
   * Execute search
   */
  async search(query) {
    logger.agent(this.name, `Searching: ${query}`);
    
    try {
      // Mock search result
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        query,
        results: [
          {
            title: `Research on ${query}`,
            content: `Related content about "${query}"...`,
            url: 'https://example.com',
            relevance: 0.9
          }
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`   Search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract key information
   */
  extractKeyInfo(data) {
    return data.results?.map(r => r.content).join('\n\n') || '';
  }
}

export default ScriptResearcher;
