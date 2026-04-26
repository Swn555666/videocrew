/**
 * Validators
 * 
 * Input/output validation utilities
 */

import { existsSync } from 'fs';

// Video formats
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg'];

// Audio formats
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];

// Subtitle formats
const SUBTITLE_EXTENSIONS = ['.srt', '.vtt', '.ass', '.ssa', '.sub'];

// Image formats
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

/**
 * Get file extension
 */
function getExtension(filePath) {
  const match = filePath.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Validate input file exists
 */
export function validateInput(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // Allow URLs
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return true;
  }
  
  // Check file exists
  return existsSync(filePath);
}

/**
 * Validate output path
 */
export function validateOutput(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // Must have extension
  const ext = getExtension(filePath);
  const validExtensions = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS, ...IMAGE_EXTENSIONS];
  
  return validExtensions.includes(ext);
}

/**
 * Validate time range
 */
export function validateTimeRange(start, end) {
  if (start !== undefined && typeof start !== 'string') {
    return false;
  }
  
  if (end !== undefined && typeof end !== 'string') {
    return false;
  }
  
  // Basic time format check (HH:MM:SS or MM:SS)
  const timePattern = /^\d{1,2}:\d{2}(:\d{2})?$/;
  
  if (start && !timePattern.test(start)) {
    return false;
  }
  
  if (end && !timePattern.test(end)) {
    return false;
  }
  
  return true;
}

/**
 * Validate video file
 */
export function validateVideo(filePath) {
  if (!validateInput(filePath)) {
    return false;
  }
  
  const ext = getExtension(filePath);
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Validate subtitle file
 */
export function validateSubtitle(filePath) {
  if (!validateInput(filePath)) {
    return false;
  }
  
  const ext = getExtension(filePath);
  return SUBTITLE_EXTENSIONS.includes(ext);
}

/**
 * Validate watermark file
 */
export function validateWatermark(filePath) {
  if (!validateInput(filePath)) {
    return false;
  }
  
  const ext = getExtension(filePath);
  return IMAGE_EXTENSIONS.includes(ext);
}

export default {
  validateInput,
  validateOutput,
  validateTimeRange,
  validateVideo,
  validateSubtitle,
  validateWatermark
};
