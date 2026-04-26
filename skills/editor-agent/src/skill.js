/**
 * Editor Agent Skill
 * 
 * Based on python_cli_video_editor (jeadys) architecture
 * 
 * Features:
 * - Video cutting
 * - Concatenation
 * - Format conversion
 * - Subtitle burn-in
 * - Watermark
 * - Audio extraction
 */

import { logger } from '../../../videocrew/src/core/logger.js';
import { FFmpegCommander } from './ffmpeg/commander.js';
import { FFmpegExecutor } from './ffmpeg/executor.js';
import { VideoMetadata } from './metadata.js';
import { validateInput, validateOutput, validateTimeRange } from './validators.js';

/**
 * EditorSkill Main Class
 */
export class EditorSkill {
  constructor(options = {}) {
    this.name = 'EditorSkill';
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.ffprobePath = options.ffprobePath || 'ffprobe';
    
    // Initialize FFmpeg components
    this.commander = new FFmpegCommander({ ffmpegPath: this.ffmpegPath });
    this.executor = new FFmpegExecutor({ commander: this.commander });
  }

  /**
   * Cut video
   */
  async cut(input, output, options = {}) {
    const { start, duration, toEnd } = options;
    
    logger.info(`EditorSkill: Cutting video`);
    logger.info(`   Input: ${input}`);
    logger.info(`   Output: ${output}`);
    logger.info(`   Start: ${start}, Duration: ${duration || 'to end'}`);
    
    // Validate inputs
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input file' };
    }
    if (!validateOutput(output)) {
      return { success: false, error: 'Invalid output file' };
    }
    
    // Build command
    const args = this.commander.buildCutCommand(input, output, { start, duration, toEnd });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: Cut complete`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Cut failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Concatenate videos
   */
  async concat(inputs, output, options = {}) {
    const { deleteOriginals = false } = options;
    
    logger.info(`EditorSkill: Concatenating ${inputs.length} videos`);
    logger.info(`   Output: ${output}`);
    
    // Validate inputs
    if (!Array.isArray(inputs) || inputs.length < 2) {
      return { success: false, error: 'Need at least 2 input files' };
    }
    
    for (const input of inputs) {
      if (!validateInput(input)) {
        return { success: false, error: `Invalid input: ${input}` };
      }
    }
    
    // Build command
    const args = this.commander.buildConcatCommand(inputs, output, { deleteOriginals });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: Concatenation complete`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Concatenation failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert format
   */
  async convert(input, output, options = {}) {
    const { 
      videoCodec, 
      audioCodec, 
      videoBitrate, 
      audioBitrate,
      preset 
    } = options;
    
    logger.info(`EditorSkill: Converting format`);
    logger.info(`   Input: ${input}`);
    logger.info(`   Output: ${output}`);
    
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input file' };
    }
    
    // Build command
    const args = this.commander.buildConvertCommand(input, output, {
      videoCodec, audioCodec, videoBitrate, audioBitrate, preset
    });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: Conversion complete`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Conversion failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add subtitles
   */
  async addSubtitle(input, subtitle, output, options = {}) {
    const { language = 'en' } = options;
    
    logger.info(`EditorSkill: Adding subtitles`);
    logger.info(`   Video: ${input}`);
    logger.info(`   Subtitle: ${subtitle}`);
    logger.info(`   Output: ${output}`);
    
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input file' };
    }
    
    if (!validateInput(subtitle)) {
      return { success: false, error: 'Invalid subtitle file' };
    }
    
    // Build command
    const args = this.commander.buildSubtitleCommand(input, subtitle, output, { language });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: Subtitles added`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Add subtitles failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add watermark
   */
  async addWatermark(input, watermark, output, options = {}) {
    const { position = 'overlay=10:10' } = options;
    
    logger.info(`EditorSkill: Adding watermark`);
    logger.info(`   Video: ${input}`);
    logger.info(`   Watermark: ${watermark}`);
    logger.info(`   Position: ${position}`);
    
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input file' };
    }
    
    if (!validateInput(watermark)) {
      return { success: false, error: 'Invalid watermark file' };
    }
    
    // Build command
    const args = this.commander.buildWatermarkCommand(input, watermark, output, { position });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: Watermark added`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Add watermark failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract audio
   */
  async extractAudio(input, output, options = {}) {
    const { format = 'mp3', bitrate = '128k' } = options;
    
    logger.info(`EditorSkill: Extracting audio`);
    logger.info(`   Input: ${input}`);
    logger.info(`   Output: ${output}`);
    
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input file' };
    }
    
    // Build command
    const args = this.commander.buildAudioExtractCommand(input, output, { format, bitrate });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: Audio extracted`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Extract audio failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get video metadata
   */
  async getMetadata(input) {
    logger.info(`EditorSkill: Getting metadata for ${input}`);
    
    const metadata = new VideoMetadata();
    return metadata.getInfo(input);
  }

  /**
   * Create GIF
   */
  async createGif(input, output, options = {}) {
    const { fps = 10, scale = 480 } = options;
    
    logger.info(`EditorSkill: Creating GIF`);
    logger.info(`   Input: ${input}`);
    logger.info(`   Output: ${output}`);
    
    if (!validateInput(input)) {
      return { success: false, error: 'Invalid input file' };
    }
    
    // Build command
    const args = this.commander.buildGifCommand(input, output, { fps, scale });
    
    // Execute
    try {
      const result = await this.executor.execute(args);
      logger.info(`EditorSkill: GIF created`);
      return { success: true, output, ...result };
    } catch (error) {
      logger.error(`EditorSkill: Create GIF failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

export default EditorSkill;
