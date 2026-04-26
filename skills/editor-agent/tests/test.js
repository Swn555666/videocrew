/**
 * Editor Skill Test
 */

import { EditorSkill } from '../src/skill.js';

async function test() {
  console.log('\n========================================');
  console.log('Editor Skill Test');
  console.log('========================================\n');

  // Create skill instance
  const skill = new EditorSkill({
    ffmpegPath: 'ffmpeg'
  });

  // Test metadata
  console.log('Testing metadata...');
  const meta = await skill.getMetadata('./test.mp4');
  console.log(`   Format: ${meta.format?.format_name}`);
  console.log(`   Duration: ${meta.format?.duration}s`);
  console.log(`   Video: ${meta.video?.width}x${meta.video?.height} @ ${meta.video?.fps}fps`);
  console.log(`   Audio: ${meta.audio?.codec_name} @ ${meta.audio?.sample_rate}Hz`);

  // Test cut command building
  console.log('\nTesting cut command...');
  const cutCmd = skill.commander.buildCutCommand('input.mp4', 'output.mp4', {
    start: '00:00:10',
    duration: 30
  });
  console.log(`   Command: ${cutCmd.cmd} ${cutCmd.args.join(' ')}`);

  // Test concat command building
  console.log('\nTesting concat command...');
  const concatCmd = skill.commander.buildConcatCommand(['a.mp4', 'b.mp4', 'c.mp4'], 'merged.mp4');
  console.log(`   Command: ${concatCmd.cmd} ${concatCmd.args.join(' ')}`);

  // Test convert command building
  console.log('\nTesting convert command...');
  const convertCmd = skill.commander.buildConvertCommand('input.mp4', 'output.mp4', {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '5M'
  });
  console.log(`   Command: ${convertCmd.cmd} ${convertCmd.args.join(' ')}`);

  // Test subtitle command building
  console.log('\nTesting subtitle command...');
  const subCmd = skill.commander.buildSubtitleCommand('input.mp4', 'subs.srt', 'output.mp4');
  console.log(`   Command: ${subCmd.cmd} ${subCmd.args.join(' ')}`);

  // Test watermark command building
  console.log('\nTesting watermark command...');
  const wmCmd = skill.commander.buildWatermarkCommand('input.mp4', 'logo.png', 'output.mp4');
  console.log(`   Command: ${wmCmd.cmd} ${wmCmd.args.join(' ')}`);

  // Test audio extract command building
  console.log('\nTesting audio extract command...');
  const audioCmd = skill.commander.buildAudioExtractCommand('input.mp4', 'audio.mp3', { format: 'mp3' });
  console.log(`   Command: ${audioCmd.cmd} ${audioCmd.args.join(' ')}`);

  // Test GIF command building
  console.log('\nTesting GIF command...');
  const gifCmd = skill.commander.buildGifCommand('input.mp4', 'output.gif', { fps: 10, scale: 480 });
  console.log(`   Command: ${gifCmd.cmd} ${gifCmd.args.join(' ')}`);

  console.log('\n========================================\n');
}

test().catch(console.error);
