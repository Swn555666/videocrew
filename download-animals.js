/**
 * Video Crew - Real Animal Video Downloader
 * Uses ytdl-core to download real animal/wildlife videos from YouTube
 */

import ytdl from 'ytdl-core';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync, unlinkSync, createWriteStream } from 'fs';

const FFmpegPath = 'C:\\Users\\wn\\AppData\\Roaming\\npm\\node_modules\\@ffmpeg-installer\\ffmpeg\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const OutputDir = 'C:\\Users\\wn\\Desktop\\animal_world';

// Wildlife/Animal YouTube videos (search for CC licensed content)
const animalVideoQueries = [
  { title: 'African Wildlife', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ' }, // Nature documentary
  { title: 'Big Cats', url: 'https://www.youtube.com/watch?v=PunRI3YJY6w' }, // Lions
  { title: 'Elephants', url: 'https://www.youtube.com/watch?v=2-vjFoWiZPo' }, // Elephants
  { title: 'Ocean Life', url: 'https://www.youtube.com/watch?v=6CRsD6UJJpA' }, // Underwater
];

async function downloadYouTubeVideo(url, outputPath, title) {
  console.log(`  Downloading: ${title}`);
  
  return new Promise(async (resolve, reject) => {
    try {
      const info = await ytdl.getInfo(url);
      
      // Get best format with video and audio
      const format = ytdl.chooseFormat(info.formats, {
        quality: '18', // 360p MP4 - good balance
        filter: f => f.hasAudio && f.hasVideo 
      });
      
      if (!format) {
        reject(new Error('No suitable format found'));
        return;
      }
      
      console.log(`    Quality: ${format.qualityLabel || format.quality}`);
      console.log(`    Format: ${format.container}`);
      
      // Download
      const stream = ytdl(url, { format });
      const writer = createWriteStream(outputPath);
      
      let downloaded = 0;
      const total = parseInt(format.contentLength || '0');
      
      stream.on('data', (chunk) => {
        downloaded += chunk.length;
        writer.write(chunk);
        process.stdout.write(`\r    Progress: ${Math.round(downloaded / total * 100)}%`);
      });
      
      stream.on('end', () => {
        writer.end();
        console.log('\n    Download complete!');
        resolve({ path: outputPath, size: statSync(outputPath).size });
      });
      
      stream.on('error', (err) => {
        writer.end();
        reject(err);
      });
      
    } catch (err) {
      reject(err);
    }
  });
}

async function downloadWithProgress(url, outputPath, title) {
  try {
    return await downloadYouTubeVideo(url, outputPath, title);
  } catch (err) {
    console.log(`\n    Failed: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🎬 Video Crew - Animal Video Pipeline  ║');
  console.log('║  Downloading Real Wildlife Footage      ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  mkdirSync(OutputDir, { recursive: true });
  
  // Test 1: Just get video info
  console.log('Test 1: Getting video info...');
  try {
    const info = await ytdl.getInfo(animalVideoQueries[0].url);
    console.log(`  Title: ${info.videoDetails.title}`);
    console.log(`  Duration: ${Math.round(info.videoDetails.lengthSeconds / 60)} minutes`);
    console.log(`  Views: ${parseInt(info.videoDetails.viewCount).toLocaleString()}`);
    
    // Show available formats
    const formats = info.formats.filter(f => f.hasAudio && f.hasVideo);
    console.log(`  Available formats: ${formats.length}`);
    formats.slice(0, 5).forEach(f => {
      console.log(`    - ${f.qualityLabel || f.quality} (${f.container})`);
    });
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
  
  console.log('\nTest 2: Trying to download video...');
  const testPath = `${OutputDir}\\test_download.mp4`;
  
  try {
    const result = await downloadYouTubeVideo(
      animalVideoQueries[0].url,
      testPath,
      'Test Download'
    );
    console.log(`  Downloaded: ${result.path}`);
    console.log(`  Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.log(`  Download failed: ${err.message}`);
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
