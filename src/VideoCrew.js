/**
 * Video Crew - Complete Production Pipeline
 * 
 * This is the main skill that orchestrates the entire video creation process:
 * 1. Script generation (GPT)
 * 2. Asset search (Pexels/Pixabay)
 * 3. TTS voiceover
 * 4. Video composition (FFmpeg)
 * 5. Subtitle/burn-in
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync, unlinkSync, createWriteStream } from 'fs';
import https from 'https';
import http from 'http';

// FFmpeg path
const FFmpegPath = 'C:\\Users\\wn\\AppData\\Roaming\\npm\\node_modules\\@ffmpeg-installer\\ffmpeg\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';

/**
 * VideoCrew Production Pipeline
 */
class VideoCrew {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './output';
    this.pexelsApiKey = options.pexelsApiKey || process.env.PEXELS_API_KEY;
    this.pixabayApiKey = options.pixabayApiKey || process.env.PIXABAY_API_KEY;
    
    mkdirSync(this.outputDir, { recursive: true });
  }

  /**
   * Run FFmpeg command
   */
  async runFFmpeg(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(FFmpegPath, args, { stdio: 'pipe' });
      let stderr = '';
      proc.stderr.on('data', d => stderr += d.toString());
      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exit ${code}: ${stderr.slice(-200)}`));
      });
      proc.on('error', reject);
    });
  }

  /**
   * Download file from URL
   */
  async downloadFile(url, outputPath) {
    console.log(`  Downloading: ${url.substring(0, 60)}...`);
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          this.downloadFile(res.headers.location, outputPath).then(resolve).catch(reject);
          return;
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        
        const total = parseInt(res.headers['content-length'] || '0');
        let downloaded = 0;
        const writeStream = require('fs').createWriteStream(outputPath);
        
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          writeStream.write(chunk);
        });
        
        res.on('end', () => {
          writeStream.end();
          resolve({ path: outputPath, size: statSync(outputPath).size });
        });
        
        res.on('error', reject);
      });
      
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  /**
   * Search Pexels for videos
   */
  async searchPexels(query, perPage = 5) {
    if (!this.pexelsApiKey) {
      throw new Error('Pexels API key required. Get one at https://www.pexels.com/api/');
    }
    
    console.log(`  Searching Pexels: ${query}`);
    
    return new Promise((resolve, reject) => {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
      
      const req = https.get(url, {
        headers: { 'Authorization': this.pexelsApiKey },
        rejectUnauthorized: false
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.videos) {
              resolve(json.videos);
            } else {
              reject(new Error(json.code || 'Pexels error'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  /**
   * Download Pexels video
   */
  async downloadPexelsVideo(video, outputPath) {
    // Get best quality
    const best = video.video_files.reduce((prev, curr) => 
      (curr.width || 0) > (prev.width || 0) ? curr : prev
    );
    
    console.log(`  Downloading Pexels video: ${best.width}x${best.height}`);
    return this.downloadFile(best.link || best.src, outputPath);
  }

  /**
   * Create video with text overlay
   */
  async createTextVideo(text, outputPath, options = {}) {
    const {
      duration = 5,
      color = '0x1a1a2e',
      textColor = 'white',
      fontSize = 48,
      subtitle = ''
    } = options;
    
    console.log(`  Creating text video: "${text.substring(0, 30)}..."`);
    
    const escapedText = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    const escapedSubtitle = subtitle ? subtitle.replace(/'/g, "\\'").replace(/:/g, '\\:') : '';
    
    let filter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${textColor}:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black@0.7`;
    
    if (escapedSubtitle) {
      filter += `,drawtext=text='${escapedSubtitle}':fontsize=28:fontcolor=0xFFFFE0:x=(w-text_w)/2:y=h-100:borderw=2:bordercolor=black@0.5`;
    }
    
    await this.runFFmpeg([
      '-f', 'lavfi', '-i', `color=c=${color}:s=1280x720:d=${duration}`,
      '-vf', filter,
      '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p',
      '-t', duration.toString(), '-y', outputPath
    ]);
    
    return outputPath;
  }

  /**
   * Create video from image with Ken Burns effect
   */
  async createSlideshowFromImages(images, outputPath, options = {}) {
    const { durationPerSlide = 5, transition = 1 } = options;
    
    console.log(`  Creating slideshow from ${images.length} images`);
    
    // Create concat file
    const listFile = `${this.outputDir}/concat_list.txt`;
    const clips = [];
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const clipPath = `${this.outputDir}/slide_${i}.mp4`;
      
      // Apply Ken Burns effect
      await this.runFFmpeg([
        '-loop', '1', '-i', img,
        '-vf', `zoompan=z='min(zoom+0.001,1.2)':d=${durationPerSlide * 25}:s=1280x720`,
        '-t', durationPerSlide.toString(),
        '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p',
        '-y', clipPath
      ]);
      
      clips.push(clipPath);
      writeFileSync(listFile, clips.map(c => `file '${c}'`).join('\n'));
    }
    
    // Concatenate all clips
    await this.runFFmpeg([
      '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c', 'copy', '-y', outputPath
    ]);
    
    // Cleanup
    clips.forEach(c => { try { unlinkSync(c); } catch {} });
    try { unlinkSync(listFile); } catch {} catch {}
    
    return outputPath;
  }

  /**
   * Concatenate multiple videos
   */
  async concatenateVideos(videos, outputPath) {
    console.log(`  Concatenating ${videos.length} videos`);
    
    const listFile = `${this.outputDir}/concat.txt`;
    writeFileSync(listFile, videos.map(v => `file '${v}'`).join('\n'));
    
    await this.runFFmpeg([
      '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c', 'copy', '-y', outputPath
    ]);
    
    try { unlinkSync(listFile); } catch {}
    
    return outputPath;
  }

  /**
   * Add audio to video
   */
  async addAudio(videoPath, audioPath, outputPath) {
    console.log(`  Adding audio`);
    
    await this.runFFmpeg([
      '-i', videoPath, '-i', audioPath,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
      '-shortest', '-y', outputPath
    ]);
    
    return outputPath;
  }

  /**
   * Generate TTS audio (placeholder - needs API)
   */
  async generateTTS(text, outputPath, options = {}) {
    // This is a placeholder - implement with actual TTS service
    console.log(`  TTS generation not implemented - needs API key`);
    console.log(`  Text: ${text.substring(0, 50)}...`);
    return null;
  }

  /**
   * Full pipeline: Create video from script
   */
  async createVideoFromScript(script, options = {}) {
    const {
      title = 'Video',
      voiceover = false,
      music = true
    } = options;
    
    console.log(`\n🎬 VideoCrew Pipeline: ${title}`);
    console.log('═'.repeat(50));
    
    const clips = [];
    const timestamp = Date.now();
    
    try {
      // Step 1: For each scene, create or fetch content
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        console.log(`\nScene ${i + 1}/${script.scenes.length}: ${scene.title}`);
        
        // Try to download from Pexels
        if (this.pexelsApiKey && scene.searchQuery) {
          try {
            const videos = await this.searchPexels(scene.searchQuery, 3);
            if (videos.length > 0) {
              const clipPath = `${this.outputDir}/clip_${i}_${timestamp}.mp4`;
              await this.downloadPexelsVideo(videos[0], clipPath);
              clips.push(clipPath);
              continue;
            }
          } catch (e) {
            console.log(`  Pexels search failed: ${e.message}`);
          }
        }
        
        // Fallback: Create text/gradient video
        const clipPath = `${this.outputDir}/text_${i}_${timestamp}.mp4`;
        await this.createTextVideo(scene.title, clipPath, {
          duration: scene.duration || 5,
          subtitle: scene.description
        });
        clips.push(clipPath);
      }
      
      // Step 2: Concatenate all clips
      console.log('\n📦 Combining clips...');
      const combinedPath = `${this.outputDir}/combined_${timestamp}.mp4`;
      await this.concatenateVideos(clips, combinedPath);
      
      // Step 3: Add music (ambient)
      const finalPath = `${this.outputDir}/${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.mp4`;
      
      // Generate ambient audio
      const ambientPath = `${this.outputDir}/ambient_${timestamp}.aac`;
      await this.runFFmpeg([
        '-f', 'lavfi', '-i', 'anoisesrc=color=pink:duration=300',
        '-af', 'lowpass=f=300,volume=0.15,afade=t=in:st=0:d=3,afade=t=out:st=290:d=10',
        '-c:a', 'aac', '-b:a', '96k', '-y', ambientPath
      ]);
      
      await this.addAudio(combinedPath, ambientPath, finalPath);
      
      // Cleanup temp files
      clips.forEach(c => { try { unlinkSync(c); } catch {} });
      try { unlinkSync(combinedPath); } catch {}
      try { unlinkSync(ambientPath); } catch {}
      
      const stats = statSync(finalPath);
      
      console.log('\n' + '═'.repeat(50));
      console.log(`✅ Video Created: ${finalPath}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log('═'.repeat(50));
      
      return { success: true, path: finalPath, size: stats.size };
      
    } catch (err) {
      console.error(`\n❌ Pipeline error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

export default VideoCrew;
