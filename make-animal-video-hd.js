/**
 * Animal World Video - Enhanced Version
 * Creates a 5-minute documentary with high-quality scene slides
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, statSync, unlinkSync } from 'fs';

const FFmpegPath = 'C:\\Users\\wn\\AppData\\Roaming\\npm\\node_modules\\@ffmpeg-installer\\ffmpeg\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const OutputDir = 'C:\\Users\\wn\\Desktop\\animal_world';

// Enhanced scenes with nature colors and narration
const scenes = [
  { 
    title: '非洲草原', 
    subtitle: 'African Savanna', 
    color: '0xCD853F', // Peru/Sandy brown
    naration: '在非洲大草原上，生命以最原始的方式繁衍生息',
    duration: 37 
  },
  { 
    title: '狮子王国', 
    subtitle: 'Lion Kingdom', 
    color: '0xDAA520', // Goldenrod
    naration: '狮子被称为百兽之王，威严地统治着这片领地',
    duration: 37 
  },
  { 
    title: '大象家族', 
    subtitle: 'Elephant Family', 
    color: '0x696969', // Dim gray
    naration: '象群缓缓走过草原，母象带领着幼崽寻找水源',
    duration: 37 
  },
  { 
    title: '猎豹追逐', 
    subtitle: 'Cheetah Chase', 
    color: '0xF4A460', // Sandy brown
    naration: '猎豹以每小时120公里的速度追逐猎物',
    duration: 37 
  },
  { 
    title: '斑马群落', 
    subtitle: 'Zebra Herd', 
    color: '0x2F4F4F', // Dark slate gray
    naration: '斑马的黑白条纹在阳光下格外醒目',
    duration: 37 
  },
  { 
    title: '长颈鹿', 
    subtitle: 'Giraffe', 
    color: '0x556B2F', // Dark olive green
    naration: '长颈鹿优雅地品尝金合欢树的嫩叶',
    duration: 37 
  },
  { 
    title: '河马在水', 
    subtitle: 'Hippo Time', 
    color: '0x4682B4', // Steel blue
    naration: '河马整天泡在水里，只露出眼睛和耳朵',
    duration: 37 
  },
  { 
    title: '动物世界', 
    subtitle: 'Animal World', 
    color: '0x191970', // Midnight blue
    naration: '每个生命都在讲述着属于自己的故事',
    duration: 37 
  },
];

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFmpegPath, args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exit ${code}: ${stderr.slice(-300)}`));
    });
    proc.on('error', reject);
  });
}

async function createScene(index, scene) {
  const outputPath = `${OutputDir}\\scene_${String(index).padStart(2, '0')}.mp4`;
  
  console.log(`  Creating scene ${index + 1}: ${scene.title}`);
  
  // Use allrgb-style color with overlay pattern for visual interest
  const escapedTitle = scene.title.replace(/'/g, "\\'").replace(/:/g, '\\:');
  const escapedSubtitle = scene.subtitle.replace(/'/g, "\\'").replace(/:/g, '\\:');
  const escapedNaration = scene.naration.replace(/'/g, "\\'").replace(/:/g, '\\:');
  
  const args = [
    '-f', 'lavfi',
    '-i', `color=c=${scene.color}:s=1280x720:d=${scene.duration}`,
    '-vf', `drawtext=text='${escapedTitle}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-60:borderw=4:bordercolor=black@0.6,drawtext=text='${escapedSubtitle}':fontsize=36:fontcolor=0xFFFFE0:x=(w-text_w)/2:y=(h-text_h)/2+40:borderw=2:bordercolor=black@0.4,drawtext=text='${escapedNaration}':fontsize=28:fontcolor=0xFFFFE0:x=(w-text_w)/2:y=h-120:borderw=2:bordercolor=black@0.5`,
    '-t', scene.duration.toString(),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-y', outputPath
  ];
  
  await runFFmpeg(args);
  return outputPath;
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🎬 Animal World Video (Enhanced)       ║');
  console.log('║  5-Minute Nature Documentary            ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  mkdirSync(OutputDir, { recursive: true });
  
  // Verify FFmpeg
  try {
    await runFFmpeg(['-version']);
    console.log('✓ FFmpeg ready\n');
  } catch (e) {
    console.error('FFmpeg not ready');
    return;
  }
  
  console.log('🎨 Generating high-quality scenes...\n');
  
  const clips = [];
  for (let i = 0; i < scenes.length; i++) {
    const clip = await createScene(i, scenes[i]);
    clips.push(clip);
  }
  
  console.log('\n🎞️  Combining scenes...');
  
  // Create concat list
  const listFile = `${OutputDir}\\concat.txt`;
  writeFileSync(listFile, clips.map(c => `file '${c}'`).join('\n'));
  
  const concatFile = `${OutputDir}\\concat.mp4`;
  await runFFmpeg([
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', '-y', concatFile
  ]);
  
  console.log('🎵 Generating ambient audio...');
  
  // Ambient nature sounds (brown noise with fade)
  const audioFile = `${OutputDir}\\ambient.aac`;
  await runFFmpeg([
    '-f', 'lavfi',
    '-i', 'anoisesrc=color=brown:duration=300',
    '-af', 'lowpass=f=300,highpass=f=100,afade=t=in:st=0:d=5,afade=t=out:st=285:d=15,volume=0.2',
    '-c:a', 'aac', '-b:a', '128k', '-y', audioFile
  ]);
  
  console.log('🎬 Creating final video...\n');
  
  const finalFile = `${OutputDir}\\animal_world_hd.mp4`;
  await runFFmpeg([
    '-i', concatFile, '-i', audioFile,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-y', finalFile
  ]);
  
  // Cleanup temp files
  console.log('🧹 Cleaning up...');
  clips.forEach(c => { try { unlinkSync(c); } catch {} });
  try { unlinkSync(audioFile); } catch {}
  try { unlinkSync(concatFile); } catch {}
  try { unlinkSync(listFile); } catch {}
  
  const stats = statSync(finalFile);
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ✅ Video Created Successfully!          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n📦 Output: ${finalFile}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('   Duration: 5 minutes (8 scenes)');
  console.log('\n🎬 Scenes:');
  scenes.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.title} - ${s.naration.substring(0, 25)}...`);
  });
  
  console.log('\n📝 Features:');
  console.log('   • Nature color backgrounds');
  console.log('   • Bilingual titles (Chinese + English)');
  console.log('   • Chinese narration text overlay');
  console.log('   • Ambient nature audio');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
