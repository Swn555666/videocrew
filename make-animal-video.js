/**
 * Animal World Video Generator
 * Creates a 5-minute nature documentary style video
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';

const FFmpegPath = 'C:\\Users\\wn\\AppData\\Roaming\\npm\\node_modules\\@ffmpeg-installer\\ffmpeg\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const OutputDir = 'C:\\Users\\wn\\Desktop\\animal_world';

const scenes = [
  { name: 'savanna', color: '0xDEB887', text: '非洲草原 · African Savanna', duration: 37 },
  { name: 'forest', color: '0x228B22', text: '热带雨林 · Rainforest', duration: 37 },
  { name: 'ocean', color: '0x006994', text: '深海世界 · Ocean Depths', duration: 37 },
  { name: 'desert', color: '0xDAA520', text: '沙漠地带 · Desert Landscape', duration: 37 },
  { name: 'night', color: '0x191970', text: '星空夜景 · Night Sky', duration: 37 },
  { name: 'sunrise', color: '0xFF6347', text: '草原日出 · Savanna Sunrise', duration: 37 },
  { name: 'rainforest', color: '0x006400', text: '绿色丛林 · Green Jungle', duration: 37 },
  { name: 'arctic', color: '0xE8F4F8', text: '极地世界 · Arctic World', duration: 37 },
];

async function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFmpegPath, args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('close', code => {
      if (code === 0) resolve();
      else {
        const err = stderr.includes('Output') ? stderr.split('Output')[1]?.slice(-100) : stderr.slice(-200);
        reject(new Error(`FFmpeg exit ${code}: ${err}`));
      }
    });
    proc.on('error', reject);
  });
}

async function generateSlides() {
  const slides = [];
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const slideFile = `${OutputDir}\\slide_${i}.mp4`;
    
    const args = [
      '-f', 'lavfi',
      '-i', `color=c=${scene.color}:s=1280x720:d=${scene.duration}`,
      '-vf', `drawtext=text='${scene.text}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black@0.5`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-t', scene.duration.toString(),
      '-y', slideFile
    ];
    
    await runFFmpeg(args);
    slides.push(slideFile);
    process.stdout.write(`\rSlide ${i + 1}/8: ${scene.name}...`);
  }
  console.log('\nAll slides generated!');
  return slides;
}

async function generateAudio() {
  const audioFile = `${OutputDir}\\ambient.aac`;
  
  // Generate soft ambient noise
  const args = [
    '-f', 'lavfi',
    '-i', 'anoisesrc=color=pink:duration=300',
    '-af', 'afade=t=in:st=0:d=5,afade=t=out:st=290:d=10,volume=0.2',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-y', audioFile
  ];
  
  await runFFmpeg(args);
  console.log('Ambient audio generated!');
  return audioFile;
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🎬 Animal World Video Generator        ║');
  console.log('║  5-Minute Nature Documentary            ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  // Check FFmpeg
  try {
    await runFFmpeg(['-version']);
    console.log('✓ FFmpeg ready\n');
  } catch (e) {
    console.error('FFmpeg not working:', e.message);
    return;
  }
  
  // Generate slides
  console.log('📽️  Generating slides...');
  const slides = await generateSlides();
  
  // Generate audio
  console.log('\n🎵 Generating ambient audio...');
  const audioFile = await generateAudio();
  
  // Create concat list
  console.log('\n🎞️  Combining video...');
  const listFile = `${OutputDir}\\concat.txt`;
  writeFileSync(listFile, slides.map(s => `file '${s}'`).join('\n'));
  
  const concatFile = `${OutputDir}\\concat.mp4`;
  await runFFmpeg([
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', '-y', concatFile
  ]);
  
  // Add audio
  const finalFile = `${OutputDir}\\animal_world.mp4`;
  await runFFmpeg([
    '-i', concatFile, '-i', audioFile,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-y', finalFile
  ]);
  
  // Cleanup
  const fs = await import('fs');
  slides.forEach(s => { try { fs.unlinkSync(s); } catch {} });
  try { fs.unlinkSync(audioFile); } catch {}
  try { fs.unlinkSync(concatFile); } catch {}
  try { fs.unlinkSync(listFile); } catch {}
  
  const stats = statSync(finalFile);
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ✅ Video Created Successfully!          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n📦 Output: ${finalFile}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('   Duration: 5 minutes (8 scenes)');
  console.log('\n🎬 场景:');
  scenes.forEach((s, i) => console.log(`   ${i + 1}. ${s.text}`));
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
