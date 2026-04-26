/**
 * FFmpeg Commander
 * 
 * Builds FFmpeg commands for various operations
 */

/**
 * FFmpegCommander Class
 */
export class FFmpegCommander {
  constructor(options = {}) {
    this.name = 'FFmpegCommander';
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
  }

  /**
   * Build cut command
   */
  buildCutCommand(input, output, options = {}) {
    const { start, duration, toEnd } = options;
    
    const args = [];
    
    // Input
    args.push('-i', input);
    
    // Start time
    if (start) {
      args.push('-ss', start);
    }
    
    // Duration
    if (duration) {
      args.push('-t', duration.toString());
    } else if (toEnd) {
      // No explicit duration, will go to end
    }
    
    // Codec (copy for fast processing)
    args.push('-c', 'copy');
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }

  /**
   * Build concat command
   */
  buildConcatCommand(inputs, output, options = {}) {
    const { deleteOriginals = false } = options;
    
    // Method 1: Concat with demuxer (requires file list)
    // For simplicity, we'll use method 2: concat protocol
    const args = [];
    
    // Build concat protocol string
    // ffmpeg -i "concat:input1.mp4|input2.mp4" -c copy output
    
    // Note: This method doesn't work well with different codecs
    // Better to use: ffmpeg -f concat -safe 0 -i list.txt -c copy output
    
    // We'll use the protocol method for simplicity
    const concatStr = inputs.join('|');
    
    args.push('-i', `concat:${concatStr}`);
    args.push('-c', 'copy');
    args.push('-y');
    args.push(output);
    
    return { cmd: this.ffmpegPath, args, inputs };
  }

  /**
   * Build convert command
   */
  buildConvertCommand(input, output, options = {}) {
    const {
      videoCodec = 'libx264',
      audioCodec = 'aac',
      videoBitrate,
      audioBitrate = '128k',
      preset = 'medium',
      crf = '23'
    } = options;
    
    const args = [];
    
    // Input
    args.push('-i', input);
    
    // Video codec
    args.push('-c:v', videoCodec);
    
    // Video bitrate
    if (videoBitrate) {
      args.push('-b:v', videoBitrate);
    }
    
    // CRF (if using libx264/265)
    if (videoCodec.includes('264') || videoCodec.includes('265')) {
      args.push('-crf', crf.toString());
      args.push('-preset', preset);
    }
    
    // Audio codec
    args.push('-c:a', audioCodec);
    
    // Audio bitrate
    if (audioBitrate) {
      args.push('-b:a', audioBitrate);
    }
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }

  /**
   * Build subtitle command
   */
  buildSubtitleCommand(input, subtitle, output, options = {}) {
    const { language = 'en' } = options;
    
    const args = [];
    
    // Input video
    args.push('-i', input);
    
    // Input subtitle
    args.push('-i', subtitle);
    
    // Map streams
    args.push('-c:v', 'copy');
    args.push('-c:a', 'copy');
    
    // Burn subtitle into video
    args.push('-c:s', 'mov_text');
    args.push('-metadata:s:s:0', `language=${language}`);
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }

  /**
   * Build watermark command
   */
  buildWatermarkCommand(input, watermark, output, options = {}) {
    const { position = 'overlay=10:10' } = options;
    
    const args = [];
    
    // Input video
    args.push('-i', input);
    
    // Input watermark
    args.push('-i', watermark);
    
    // Filter complex
    args.push('-filter_complex', position);
    
    // Copy audio
    args.push('-c:a', 'copy');
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }

  /**
   * Build audio extract command
   */
  buildAudioExtractCommand(input, output, options = {}) {
    const { format = 'mp3', bitrate = '128k' } = options;
    
    const args = [];
    
    // Input
    args.push('-i', input);
    
    // No video
    args.push('-vn');
    
    // Audio codec
    const codecMap = { mp3: 'libmp3lame', wav: 'pcm_s16le', aac: 'aac' };
    args.push('-c:a', codecMap[format] || 'libmp3lame');
    
    // Bitrate
    if (format !== 'wav') {
      args.push('-b:a', bitrate);
    }
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }

  /**
   * Build GIF command
   */
  buildGifCommand(input, output, options = {}) {
    const { fps = 10, scale = 480 } = options;
    
    const args = [];
    
    // Input
    args.push('-i', input);
    
    // Filter for GIF
    // fps=10: output 10 FPS
    // scale=480:-1: scale to width 480, keep aspect ratio
    args.push('-vf', `fps=${fps},scale=${scale}:-1:flags=lanczos`);
    
    // Output format
    args.push('-f', 'gif');
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }

  /**
   * Build snapshot command
   */
  buildSnapshotCommand(input, output, options = {}) {
    const { 
      format = 'jpg',
      fps = 1,
      timestamp
    } = options;
    
    const args = [];
    
    // Input
    args.push('-i', input);
    
    if (timestamp) {
      // Extract specific frame at timestamp
      args.push('-ss', timestamp);
      args.push('-vframes', '1');
    } else {
      // Extract frame at fps
      args.push('-vf', `fps=${fps}`);
      args.push('-vsync', 'vfr');
    }
    
    // Output format
    args.push('-f', 'image2');
    
    // Overwrite
    args.push('-y');
    
    // Output
    args.push(output);
    
    return { cmd: this.ffmpegPath, args };
  }
}

export default FFmpegCommander;
