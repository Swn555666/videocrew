/**
 * Animal World Video - Real Footage Version
 * Downloads real wildlife footage and creates a 5-minute documentary
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync, unlinkSync } from 'fs';
import https from 'https';
import http from 'http';

const FFmpegPath = 'C:\\Users\\wn\\AppData\\Roaming\\npm\\node_modules\\@ffmpeg-installer\\ffmpeg\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const OutputDir = 'C:\\Users\\wn\\Desktop\\animal_world';

// Animal video scenes with search terms and durations
const scenes = [
  { title: '非洲草原', subtitle: 'African Savanna', query: 'african safari', duration: 37 },
  { title: '狮子王国', subtitle: 'Lion Kingdom', query: 'lion wildlife', duration: 37 },
  { title: '大象家族', subtitle: 'Elephant Family', query: 'elephant wildlife', duration: 37 },
  { title: '猎豹速度', subtitle: 'Cheetah Speed', query: 'cheetah running', duration: 37 },
  { title: '斑马群落', subtitle: 'Zebra Herd', query: 'zebra wildlife', duration: 37 },
  { title: '长颈鹿', subtitle: 'Giraffe', query: 'giraffe wildlife', duration: 37 },
  { title: '河流生态', subtitle: 'River Ecosystem', query: 'river wildlife', duration: 37 },
  { title: '动物世界', subtitle: 'Animal World', query: 'wildlife documentary', duration: 37 },
];

// Free wildlife videos from Archive.org (public domain)
const archiveVideos = [
  { query: 'african safari', id: 'Africana-2', title: 'Africana Collection' },
  { query: 'lion', id: 'lion', title: 'Lion Video' },
  { query: 'elephant', id: 'elephants', title: 'Elephant Video' },
  { query: 'cheetah', id: 'wildlife', title: 'Wildlife' },
  { query: 'zebra', id: 'wildlife', title: 'Wildlife' },
  { query: 'giraffe', id: 'Africana-2', title: 'Africana' },
  { query: 'river nature', id: 'nature', title: 'Nature' },
  { query: 'wildlife documentary', id: 'animals_100', title: 'Animals' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`  Downloading: ${url.split('/').pop()}`);
    
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      const total = parseInt(res.headers['content-length'] || '0');
      let downloaded = 0;
      
      const writeStream = require('fs').createWriteStream(dest);
      
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        writeStream.write(chunk);
      });
      
      res.on('end', () => {
        writeStream.end();
        const stats = statSync(dest);
        console.log(`  Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        resolve(stats.size);
      });
      
      res.on('error', reject);
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function searchArchiveVideo(query) {
  console.log(`  Searching Archive.org for: ${query}`);
  
  return new Promise((resolve, reject) => {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:movies&fl[]=identifier,title,downloads&output=json&rows=3&sort[]=downloads desc`;
    
    const req = https.get(url, { timeout: 15000, rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const items = json.response?.docs || [];
          if (items.length > 0) {
            const item = items[0];
            const videoUrl = `https://archive.org/download/${item.identifier}/${item.identifier}.mp4`;
            console.log(`  Found: ${item.title || item.identifier}`);
            resolve({ url: videoUrl, title: item.title, id: item.identifier });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function runFFmpeg(args) {
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

async function processClip(inputPath, outputPath, duration, text) {
  // Scale/crop to 1280x720, add text overlay, cut to duration
  const escapedText = text.replace(/'/g: "\\'").replace(/:/g, '\\\\:');
  
  await runFFmpeg([
    '-i', inputPath,
    '-vf', `scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,drawtext=text='${escapedText}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h-80:borderw=2:bordercolor=black@0.5`,
    '-t', duration.toString(),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-y', outputPath
  ]);
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🎬 Animal World Video (Real Footage)  ║');
  console.log('║  5-Minute Nature Documentary            ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  mkdirSync(OutputDir, { recursive: true });
  
  // Verify FFmpeg
  try {
    await runFFmpeg(['-version']);
    console.log('✓ FFmpeg ready\n');
  } catch (e) {
    console.error('FFmpeg not ready:', e.message);
    return;
  }
  
  const clips = [];
  
  // Download clips for each scene
  console.log('📥 Downloading real wildlife footage...\n');
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const clipFile = `${OutputDir}\\clip_${i}.mp4`;
    const text = `${scene.title} · ${scene.subtitle}`;
    
    console.log(`Scene ${i + 1}/${scenes.length}: ${scene.title}`);
    
    // Search for video
    const found = await searchArchiveVideo(scene.query);
    
    if (found) {
      try {
        const tempFile = `${OutputDir}\\temp_${i}.mp4`;
        await download(found.url, tempFile);
        await processClip(tempFile, clipFile, scene.duration, text);
        unlinkSync(tempFile);
        clips.push(clipFile);
        console.log(`  ✓ Processed: ${scene.title}\n`);
      } catch (e) {
        console.log(`  ✗ Download failed, creating slide instead\n`);
        await createFallbackSlide(i, scene, clipFile);
        clips.push(clipFile);
      }
    } else {
      console.log(`  ✗ No video found, creating slide\n`);
      await createFallbackSlide(i, scene, clipFile);
      clips.push(clipFile);
    }
  }
  
  // Create concat list
  console.log('🎞️  Combining clips...');
  const listFile = `${OutputDir}\\concat.txt`;
  writeFileSync(listFile, clips.map(c => `file '${c}'`).join('\n'));
  
  const concatFile = `${OutputDir}\\concat.mp4`;
  await runFFmpeg([
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', '-y', concatFile
  ]);
  
  // Generate ambient audio
  console.log('🎵 Generating ambient audio...');
  const audioFile = `${OutputDir}\\ambient.aac`;
  await runFFmpeg([
    '-f', 'lavfi', '-i', 'anoisesrc=color=pink:duration=300',
    '-af', 'afade=t=in:st=0:d=5,afade=t=out:st=290:d=10,volume=0.15',
    '-c:a', 'aac', '-b:a', '96k', '-y', audioFile
  ]);
  
  // Final video with audio
  console.log('🎬 Creating final video...');
  const finalFile = `${OutputDir}\\animal_world_real.mp4`;
  await runFFmpeg([
    '-i', concatFile, '-i', audioFile,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-y', finalFile
  ]);
  
  // Cleanup temp files
  clips.forEach(c => { try { unlinkSync(c); } catch {} });
  try { unlinkSync(audioFile); } catch {}
  try { unlinkSync(concatFile); } catch {}
  try { unlinkSync(listFile); } catch {}
  
  const stats = statSync(finalFile);
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ✅ Video Created Successfully!         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n📦 Output: ${finalFile}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('   Duration: ~5 minutes (8 scenes)');
  console.log('\n🎬 Scenes:');
  scenes.forEach((s, i) => console.log(`   ${i + 1}. ${s.title} · ${s.subtitle}`));
}

async function createFallbackSlide(index, scene, outputPath) {
  const colors = ['0x228B22', '0x006400', '0x8B4513', '0xDEB887', '0x191970'];
  const color = colors[index % colors.length];
  const text = `${scene.title} · ${scene.subtitle}`;
  const escapedText = text.replace(/'/g, "\\'");
  
  await runFFmpeg([
    '-f', 'lavfi', '-i', `color=c=${color}:s=1280x720:d=${scene.duration}`,
    '-vf', `drawtext=text='${escapedText}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black@0.5`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-t', scene.duration.toString(), '-y', outputPath
  ]);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
