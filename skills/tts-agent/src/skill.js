/**
 * TTS Agent Skill
 * 
 * Based on audiocoqui (tcsenpai/audiocoqui) architecture
 * 
 * Features:
 * - XTTS-v2 voice cloning
 * - Multi-language TTS
 * - Text chunking
 * - Progress tracking
 * - Audio concatenation
 */

import { logger } from '../../../src/core/logger.js';
import { TTSEngine } from './engine.js';
import { TextProcessor } from './text_processor.js';
import { AudioProcessor } from './audio_processor.js';
import { ProgressTracker } from './progress_tracker.js';

/**
 * TTSSkill Main Class
 */
export class TTSSkill {
  constructor(options = {}) {
    this.name = 'TTSSkill';
    this.engineType = options.engine || 'xtts';
    this.speakerWav = options.speakerWav || null;
    this.language = options.language || 'zh';
    this.chunkSize = options.chunkSize || 200;
    this.maxChunkSize = options.maxChunkSize || 250;
    this.silenceDuration = options.silenceDuration || 2000;
    
    // Initialize components
    this.engine = new TTSEngine({
      type: this.engineType,
      speakerWav: this.speakerWav,
      language: this.language
    });
    this.textProcessor = new TextProcessor({
      chunkSize: this.chunkSize,
      maxChunkSize: this.maxChunkSize
    });
    this.audioProcessor = new AudioProcessor();
    this.progressTracker = new ProgressTracker();
  }

  /**
   * Initialize TTS engine
   */
  async initialize() {
    logger.info(`TTSSkill: Initializing ${this.engineType} engine`);
    await this.engine.initialize();
    return this;
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(text, options = {}) {
    const {
      outputPath = './output/speech.mp3',
      addSilence = true,
      progressCallback = null
    } = options;
    
    logger.info(`TTSSkill: Converting text to speech`);
    logger.info(`   Text length: ${text.length} characters`);
    logger.info(`   Output: ${outputPath}`);
    
    try {
      // Clean text
      const cleanedText = this.textProcessor.cleanText(text);
      
      // Split into chunks
      const chunks = this.textProcessor.splitIntoChunks(cleanedText);
      logger.info(`   Split into ${chunks.length} chunks`);
      
      // Generate audio for each chunk
      const audioFiles = [];
      const totalChunks = chunks.length;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPath = this.getChunkPath(outputPath, i);
        
        logger.info(`   Processing chunk ${i + 1}/${totalChunks}`);
        
        // Generate audio
        await this.engine.synthesize(chunk, chunkPath);
        
        // Add silence if needed
        if (addSilence && i < chunks.length - 1) {
          await this.audioProcessor.addSilence(chunkPath, this.silenceDuration);
        }
        
        audioFiles.push(chunkPath);
        
        // Progress callback
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: totalChunks,
            percentage: Math.round(((i + 1) / totalChunks) * 100)
          });
        }
      }
      
      // Concatenate all audio files
      logger.info(`   Concatenating ${audioFiles.length} audio files`);
      const finalPath = await this.audioProcessor.concatenateAudio(audioFiles, outputPath);
      
      // Calculate duration
      const duration = this.estimateDuration(text);
      
      logger.info(`TTSSkill: Conversion complete`, { outputPath: finalPath, duration });
      
      return {
        success: true,
        outputPath: finalPath,
        duration,
        chunks: audioFiles.length
      };
    } catch (error) {
      logger.error(`TTSSkill: Conversion failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert text to speech with voice cloning
   */
  async cloneVoice(text, options = {}) {
    const {
      speakerWav,
      outputPath = './output/cloned.mp3',
      language = this.language
    } = options;
    
    if (!speakerWav) {
      return { success: false, error: 'Speaker wav file is required for voice cloning' };
    }
    
    logger.info(`TTSSkill: Cloning voice`);
    logger.info(`   Speaker: ${speakerWav}`);
    
    // Update engine with speaker
    this.engine.speakerWav = speakerWav;
    this.engine.language = language;
    
    // Process text
    const cleanedText = this.textProcessor.cleanText(text);
    const chunks = this.textProcessor.splitIntoChunks(cleanedText);
    
    // Generate with voice cloning
    const audioFiles = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = this.getChunkPath(outputPath, i);
      await this.engine.ttsWithVoiceClone(chunks[i], speakerWav, chunkPath, language);
      audioFiles.push(chunkPath);
    }
    
    // Concatenate
    const finalPath = await this.audioProcessor.concatenateAudio(audioFiles, outputPath);
    
    return {
      success: true,
      outputPath: finalPath,
      duration: this.estimateDuration(text),
      chunks: audioFiles.length
    };
  }

  /**
   * Get chunk path
   */
  getChunkPath(outputPath, index) {
    const ext = outputPath.split('.').pop();
    const base = outputPath.replace(`.${ext}`, '');
    return `${base}_chunk_${String(index).padStart(3, '0')}.wav`;
  }

  /**
   * Estimate audio duration
   */
  estimateDuration(text) {
    // Chinese: ~400 chars/min, English: ~150 words/min
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    const chars = text.replace(/\s/g, '').length;
    
    if (isChinese) {
      return Math.ceil((chars / 400) * 60);
    } else {
      const words = text.split(/\s+/).length;
      return Math.ceil((words / 150) * 60);
    }
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'zh', name: 'Chinese' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'ru', name: 'Russian' },
      { code: 'nl', name: 'Dutch' },
      { code: 'cs', name: 'Czech' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'ko', name: 'Korean' },
      { code: 'ja', name: 'Japanese' },
      { code: 'hi', name: 'Hindi' }
    ];
  }
}

export default TTSSkill;
