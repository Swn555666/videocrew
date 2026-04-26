/**
 * Text Processor Module
 * 
 * Based on audiocoqui/src/lib/ebook_reader.py
 * 
 * Features:
 * - Text cleaning
 * - Chunk splitting
 * - Section break detection
 */

import { logger } from '../../../src/core/logger.js';

/**
 * TextProcessor Class
 */
export class TextProcessor {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 200;
    this.maxChunkSize = options.maxChunkSize || 250;
    this.sectionBreakThreshold = options.sectionBreakThreshold || 0.3;
    
    // Common PDF artifacts
    this.replacements = {
      '-\n': '',
      'fi': 'fi',
      'ff': 'ff',
      '...': '...',
      '-': '-',
      '-': '-',
      '"': '"',
      '"': '"',
      "'": "'",
      "'": "'",
      'Dr.': 'Doctor',
      'Mr.': 'Mister',
      'Mrs.': 'Misses',
      'vs.': 'versus'
    };
  }

  /**
   * Clean text from PDF artifacts
   * Reference: audiocoqui clean_text()
   */
  cleanText(text) {
    if (!text) return '';
    
    logger.agent('TextProcessor', `Cleaning text (${text.length} chars)`);
    
    let cleaned = text;
    
    // Apply replacements
    for (const [old, newVal] of Object.entries(this.replacements)) {
      cleaned = cleaned.replace(old, newVal);
    }
    
    // Handle multiple spaces and line breaks
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove control characters
    cleaned = cleaned.replace(/[^\x20-\x7E\n\u0080-\uFFFF]/g, '');
    
    return cleaned.trim();
  }

  /**
   * Split text into chunks while preserving sentence boundaries
   * Reference: audiocoqui split_into_chunks()
   */
  splitIntoChunks(text, options = {}) {
    const { chunkSize = this.chunkSize, maxSize = this.maxChunkSize } = options;
    
    if (!text) return [];
    
    logger.agent('TextProcessor', `Splitting into chunks (target: ${chunkSize}, max: ${maxSize})`);
    
    const chunks = [];
    
    // Split into sentences
    const sentences = this.splitIntoSentences(text);
    
    let currentChunk = [];
    let currentLength = 0;
    
    for (const sentence of sentences) {
      const sentenceLen = sentence.length + 1;
      
      // Handle sentences that exceed max size
      if (sentenceLen > maxSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentLength = 0;
        }
        
        // Split long sentence word by word
        const subChunks = this.splitLongSentence(sentence, maxSize);
        chunks.push(...subChunks);
        continue;
      }
      
      // Try to keep sentences together
      if (currentLength + sentenceLen > chunkSize) {
        // Check if would exceed max
        if (currentLength + sentenceLen > maxSize) {
          // Save current and start new
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentLength = 0;
        }
      }
      
      currentChunk.push(sentence);
      currentLength += sentenceLen;
      
      // Create new chunk if over target size
      if (currentLength >= chunkSize) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
    }
    
    // Add remaining text
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    logger.agent('TextProcessor', `   Split into ${chunks.length} chunks`);
    
    return chunks;
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting
    // Handles . ! ? followed by space or end
    const sentencePattern = /[^.!?]+[.!?]+[\s]+|[^.!?]+[.!?]+$/g;
    const sentences = text.match(sentencePattern) || [text];
    
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Split a long sentence word by word
   */
  splitLongSentence(sentence, maxSize) {
    const words = sentence.split(/\s+/);
    const chunks = [];
    let tempChunk = [];
    let tempLength = 0;
    
    for (const word of words) {
      const wordLen = word.length + 1;
      
      if (tempLength + wordLen > maxSize && tempChunk.length > 0) {
        chunks.push(tempChunk.join(' '));
        tempChunk = [];
        tempLength = 0;
      }
      
      tempChunk.push(word);
      tempLength += wordLen;
    }
    
    if (tempChunk.length > 0) {
      chunks.push(tempChunk.join(' '));
    }
    
    return chunks;
  }

  /**
   * Detect section break based on trailing whitespace
   * Reference: audiocoqui detect_section_break()
   */
  detectSectionBreak(text, options = {}) {
    const threshold = options.threshold || this.sectionBreakThreshold;
    
    if (!text || text.length === 0) return false;
    
    const trailingSpace = text.length - text.trimEnd().length;
    const whitespaceRatio = trailingSpace / text.length;
    
    return whitespaceRatio > threshold;
  }

  /**
   * Detect paragraph break
   */
  detectParagraphBreak(text) {
    // Double newline indicates paragraph break
    return text.includes('\n\n') || text.includes('\r\n\r\n');
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Count characters in text
   */
  countChars(text) {
    return text.replace(/\s/g, '').length;
  }

  /**
   * Estimate speaking duration
   */
  estimateDuration(text, options = {}) {
    const lang = options.language || 'zh';
    
    if (lang === 'zh') {
      // Chinese: ~400 chars/min
      const chars = this.countChars(text);
      return Math.ceil((chars / 400) * 60);
    } else {
      // English: ~150 words/min
      const words = this.countWords(text);
      return Math.ceil((words / 150) * 60);
    }
  }
}

export default TextProcessor;
