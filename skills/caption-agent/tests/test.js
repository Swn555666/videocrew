/**
 * Caption Skill Test
 */

import { CaptionSkill } from '../src/skill.js';

async function test() {
  console.log('\n========================================');
  console.log('Caption Skill Test');
  console.log('========================================\n');

  // Create skill instance
  const skill = new CaptionSkill({
    whisperModel: 'base',
    language: 'zh'
  });

  // Test formatting
  console.log('Testing subtitle formatting...');
  
  const testSegments = [
    { start: 0.0, end: 2.5, text: '欢迎观看本期节目。' },
    { start: 2.5, end: 5.0, text: '今天我们来探讨人工智能。' },
    { start: 5.0, end: 8.0, text: '人工智能正在改变世界。' }
  ];

  // Test SRT
  const srt = skill.formatter.format(testSegments, 'srt');
  console.log('\nSRT format:');
  console.log(srt);

  // Test VTT
  const vtt = skill.formatter.format(testSegments, 'vtt');
  console.log('\nVTT format:');
  console.log(vtt);

  // Test models
  console.log('\nSupported Whisper models:');
  const models = CaptionSkill.getSupportedModels();
  models.slice(0, 3).forEach(m => {
    console.log(`   ${m.id}: ${m.name} (${m.size})`);
  });

  // Test formats
  console.log('\nSupported formats:');
  const formats = CaptionSkill.getSupportedFormats();
  console.log(`   ${formats.join(', ')}`);

  // Test transcription (mock)
  console.log('\nTesting transcription...');
  const result = await skill.transcribe('./test_audio.mp3', {
    format: 'srt',
    outputPath: './test_output/subtitle.srt'
  });
  
  console.log(`   Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  if (result.success) {
    console.log(`   Output: ${result.outputPath}`);
    console.log(`   Duration: ${result.duration}s`);
    console.log(`   Chunks: ${result.chunks}`);
  }

  console.log('\n========================================\n');
}

test().catch(console.error);
