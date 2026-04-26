/**
 * Progress Tracker Module
 * 
 * Based on audiocoqui/src/lib/progress_tracker.py
 * 
 * Features:
 * - State saving
 * - Crash recovery
 * - Progress tracking
 */

import { logger } from '../../../src/core/logger.js';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';

/**
 * Processing State
 */
export class ProcessingState {
  constructor(data = {}) {
    this.currentPage = data.currentPage || 0;
    this.totalPages = data.totalPages || 0;
    this.chunksProcessed = data.chunksProcessed || 0;
    this.lastChunkFile = data.lastChunkFile || null;
    this.startTime = data.startTime || Date.now();
  }

  toJSON() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      chunksProcessed: this.chunksProcessed,
      lastChunkFile: this.lastChunkFile,
      startTime: this.startTime
    };
  }

  static fromJSON(json) {
    return new ProcessingState(json);
  }
}

/**
 * ProgressTracker Class
 */
export class ProgressTracker {
  constructor(options = {}) {
    this.name = 'ProgressTracker';
    this.journalPath = options.journalPath || './progress.json';
    this.state = null;
  }

  /**
   * Save current progress
   * Reference: audiocoqui save_progress()
   */
  saveProgress(state) {
    logger.agent(this.name, `Saving progress: page ${state.currentPage}/${state.totalPages}`);
    
    try {
      const data = JSON.stringify(state.toJSON(), null, 2);
      const tempPath = `${this.journalPath}.tmp`;
      
      writeFileSync(tempPath, data);
      
      // Atomic rename
      if (existsSync(this.journalPath)) {
        unlinkSync(this.journalPath);
      }
      writeFileSync(this.journalPath, data);
      
      logger.agent(this.name, `   Progress saved`);
      return true;
    } catch (error) {
      logger.error(`Failed to save progress: ${error.message}`);
      return false;
    }
  }

  /**
   * Load previous progress
   * Reference: audiocoqui load_progress()
   */
  loadProgress() {
    if (!existsSync(this.journalPath)) {
      logger.agent(this.name, `No previous progress found`);
      return null;
    }
    
    try {
      const data = readFileSync(this.journalPath, 'utf-8');
      const json = JSON.parse(data);
      this.state = ProcessingState.fromJSON(json);
      
      logger.agent(this.name, `Loaded progress: page ${this.state.currentPage}/${this.state.totalPages}`);
      return this.state;
    } catch (error) {
      logger.warn(`Failed to load progress: ${error.message}`);
      return null;
    }
  }

  /**
   * Clear progress
   */
  clearProgress() {
    if (existsSync(this.journalPath)) {
      unlinkSync(this.journalPath);
      logger.agent(this.name, `Progress cleared`);
    }
    this.state = null;
  }

  /**
   * Create initial state
   */
  createInitialState(totalPages) {
    this.state = new ProcessingState({
      currentPage: 0,
      totalPages: totalPages,
      chunksProcessed: 0,
      startTime: Date.now()
    });
    
    return this.state;
  }

  /**
   * Update state
   */
  updateState(updates) {
    if (!this.state) {
      throw new Error('No state to update');
    }
    
    Object.assign(this.state, updates);
    this.saveProgress(this.state);
    
    return this.state;
  }

  /**
   * Mark page as complete
   */
  markPageComplete(pageNum, chunksCount, lastChunkFile) {
    this.state.currentPage = pageNum;
    this.state.chunksProcessed += chunksCount;
    this.state.lastChunkFile = lastChunkFile;
    
    this.saveProgress(this.state);
    
    return this.state;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage() {
    if (!this.state || this.state.totalPages === 0) {
      return 0;
    }
    
    return Math.round((this.state.currentPage / this.state.totalPages) * 100);
  }

  /**
   * Get elapsed time
   */
  getElapsedTime() {
    if (!this.state) return 0;
    return Date.now() - this.state.startTime;
  }

  /**
   * Estimate remaining time
   */
  estimateRemainingTime() {
    if (!this.state || this.state.currentPage === 0) {
      return null;
    }
    
    const elapsed = this.getElapsedTime();
    const avgTimePerPage = elapsed / this.state.currentPage;
    const remainingPages = this.state.totalPages - this.state.currentPage;
    
    return Math.ceil(avgTimePerPage * remainingPages);
  }
}

export default ProgressTracker;
