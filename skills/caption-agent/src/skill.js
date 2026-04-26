/**
 * Caption Agent Skill
 * 
 * Based on subtitle-composing (Bl叹了一口气) architecture
 * 
 * Features:
 * - Whisper speech recognition
 * - Multi-process transcription
 * - VAD (Voice Activity Detection)
 * - SRT/VTT subtitle generation
 */

import { logger } from '../../../videocrew/src/core/logger.js';
import { Transcriber } from './transcriber.js';
import { AudioProcessor } from './audio_processor.js';
import { SubtitleFormatter } from './formatter.js';

/**
 * CaptionSkill Main Class
 */
export class CaptionSkill {
  constructor(options = {}) {
    this.name = 'CaptionSkill';
    
    // Whisper model
    this.model = options.whisperModel || 'base';
    this.language = options.language || 'auto';
    this.device = options.device || 'cpu'; // cpu, cuda
    
    // Initialize components
    this.transcriber = new Transcriber({
      model: this.model,
      language: this.language,
      device: this.device
    });
    this.audioProcessor = new AudioProcessor();
    this.formatter = new SubtitleFormatter();
  }

  /**
   * Transcribe audio to subtitles
   */
  async transcribe(audioPath, options = {}) {
    const {
      format = 'srt',
      outputPath,
      task = 'transcribe' // transcribe or translate
    } = options;
    
    logger.info(`CaptionSkill: Transcribing ${audioPath}`);
    
    try {
      // Process audio
      const audioInfo = await this.audioProcessor.process(audioPath);
      logger.info(`   Audio: ${audioInfo.duration}s, ${audioInfo.sampleRate}Hz`);
      
      // Split into chunks for parallel processing
      const chunks = this.audioProcessor.splitAudio(audioPath, {
        chunkDuration: 30, // 30 seconds per chunk
        overlap: 0.5
      });
      logger.info(`   Split into ${chunks.length} chunks`);
      
      // Transcribe each chunk in parallel
      const transcriptions = [];
      for (let i = 0; i < chunks.length; i++) {
        logger.info(`   Transcribing chunk ${i + 1}/${chunks.length}`);
        const result = await this.transcriber.transcribe(chunks[i].path, { task });
        transcriptions.push({
          ...result,
          startTime: chunks[i].startTime
        });
      }
      
      // Merge transcriptions
      const merged = this.mergeTranscriptions(transcriptions);
      
      // Format subtitle
      const subtitle = this.formatter.format(merged, format);
      
      // Save to file
      const finalPath = outputPath || this.getOutputPath(audioPath, format);
      this.formatter.save(subtitle, finalPath);
      
      logger.info(`CaptionSkill: Done -> ${finalPath}`);
      
      return {
        success: true,
        outputPath: finalPath,
        format,
        duration: audioInfo.duration,
        chunks: chunks.length
      };
    } catch (error) {
      logger.error(`CaptionSkill: Transcription failed`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract audio from video and transcribe
   */
  async extractAndTranscribe(videoPath, options = {}) {
    logger.info(`CaptionSkill: Extracting audio from ${videoPath}`);
    
    // Extract audio
    const audioPath = await this.audioProcessor.extractAudio(videoPath);
    logger.info(`   Extracted to ${audioPath}`);
    
    // Transcribe
    const result = await this.transcribe(audioPath, options);
    
    // Clean up temp audio
    // Note: In production, you might want to keep this
    
    return result;
  }

  /**
   * Batch transcribe multiple files
   */
  async batchTranscribe(audioPaths, options = {}) {
    const { parallel = 4, format = 'srt' } = options;
    
    logger.info(`CaptionSkill: Batch transcribing ${audioPaths.length} files`);
    
    const results = [];
    for (let i = 0; i < audioPaths.length; i += parallel) {
      const batch = audioPaths.slice(i, i + parallel);
      logger.info(`   Processing batch ${Math.floor(i / parallel) + 1}/${Math.ceil(audioPaths.length / parallel)}`);
      
      const batchResults = await Promise.all(
        batch.map(audio => this.transcribe(audio, { format }))
      );
      results.push(...batchResults);
    }
    
    const successful = results.filter(r => r.success).length;
    logger.info(`CaptionSkill: Batch complete - ${successful}/${audioPaths.length} successful`);
    
    return { results, successful, failed: audioPaths.length - successful };
  }

  /**
   * Merge transcriptions from chunks
   */
  mergeTranscriptions(transcriptions) {
    const merged = [];
    let globalIndex = 0;
    
    for (const transcription of transcriptions) {
      for (const segment of transcription.segments) {
        merged.push({
          index: globalIndex++,
          start: segment.start + (transcription.startTime || 0),
          end: segment.end + (transcription.startTime || 0),
          text: segment.text
        });
      }
    }
    
    return merged;
  }

  /**
   * Get output path for subtitle
   */
  getOutputPath(audioPath, format) {
    const base = audioPath.replace(/\.[^.]+$/, '');
    return `${base}.${format}`;
  }

  /**
   * Get supported formats
   */
  static getSupportedFormats() {
    return ['srt', 'vtt', 'ass'];
  }

  /**
   * Get supported models
   */
  static getSupportedModels() {
    return [
      { id: 'tiny', name: 'Whisper Tiny', size: '39MB', langs: 99 },
      { id: 'base', name: 'Whisper Base', size: '74MB', langs: 99 },
      { id: 'small', name: 'Whisper Small', size: '243MB', langs: 99 },
      { id: 'medium', name: 'Whisper Medium', size: '769MB', langs: 99 },
      { id: 'large', name: 'Whisper Large', size: '1.5GB', langs: 99 }
    ];
  }
}

export default CaptionSkill;
