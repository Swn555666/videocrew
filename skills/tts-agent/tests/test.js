/**
 * TTS Skill Test
 */

import { TTSSkill } from '../src/skill.js';

async function test() {
  console.log('\n========================================');
  console.log('TTS Skill Test');
  console.log('========================================\n');

  // Create skill instance
  const skill = new TTSSkill({
    engine: 'xtts',
    speakerWav: null,
    language: 'zh'
  });

  const testText = '欢迎观看本期节目。今天我们来探讨人工智能的发展。人工智能正在以前所未有的速度改变我们的生活方式。';

  console.log(`Text: ${testText.slice(0, 50)}...`);
  console.log(`Engine: ${skill.engineType}`);
  console.log(`Language: ${skill.language}\n`);

  try {
    // Test text processing
    console.log('Testing text processing...');
    const cleaned = skill.textProcessor.cleanText(testText);
    console.log(`   Cleaned: ${cleaned.slice(0, 50)}...`);

    const chunks = skill.textProcessor.splitIntoChunks(cleaned);
    console.log(`   Chunks: ${chunks.length}`);
    chunks.forEach((c, i) => console.log(`      [${i + 1}] ${c.slice(0, 40)}...`));

    // Test TTS
    console.log('\nTesting TTS...');
    const result = await skill.textToSpeech(testText, {
      outputPath: './test_output/speech_mock.mp3',
      addSilence: true,
      silenceDuration: 1000
    });

    if (result.success) {
      console.log('\nTTS Test: SUCCESS');
      console.log(`   Output: ${result.outputPath}`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Chunks: ${result.chunks}`);
    } else {
      console.log('\nTTS Test: FAILED');
      console.log(`   Error: ${result.error}`);
    }

    // Test voice cloning (mock)
    console.log('\nTesting voice cloning...');
    console.log('   (Requires XTTS-v2 model with speaker reference)');

    // Test language list
    console.log('\nSupported languages:');
    const langs = TTSSkill.getSupportedLanguages();
    langs.slice(0, 5).forEach(l => console.log(`   ${l.code}: ${l.name}`));
    console.log(`   ... and ${langs.length - 5} more`);

  } catch (error) {
    console.log('\nTest Error:', error.message);
  }

  console.log('\n========================================\n');
}

test();
