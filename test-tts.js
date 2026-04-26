/**
 * 测试脚本 - 阶段2a: TTS Agent
 * 
 * 测试目标：验证 TTS Agent 能否正常工作
 */

import { ttsAgent } from './src/agents/tts.js';
import { storage } from './src/utils/storage.js';

async function test() {
  console.log('\n========================================');
  console.log('🎙️ 阶段2测试: TTS Agent');
  console.log('========================================\n');

  // 读取上一个测试生成的脚本
  const fs = await import('fs');
  const projectsDir = './workspace/projects';
  
  // 获取最新的项目
  const projects = fs.readdirSync(projectsDir).filter(p => 
    fs.statSync(`${projectsDir}/${p}`).isDirectory()
  );
  
  if (projects.length === 0) {
    console.log('❌ 没有找到项目，请先运行 test-script.js');
    return;
  }

  // 使用最新的项目
  const projectId = projects[projects.length - 1];
  const projectPath = `${projectsDir}/${projectId}`;
  
  console.log(`📁 项目: ${projectId}`);
  
  // 读取脚本
  const scriptPath = `${projectPath}/script.json`;
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ 没有找到脚本文件');
    return;
  }

  const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
  console.log(`📄 脚本: ${script.title}`);
  console.log(`📖 场景数: ${script.scenes?.length || 0}\n`);

  try {
    console.log('🚀 调用 TTS Agent...\n');
    const result = await ttsAgent.generate(projectId, script);

    if (result.success) {
      console.log('\n✅ TTS Agent 测试成功!');
      console.log('========================================');
      console.log('🎙️ 生成的音频:');
      console.log('========================================');
      console.log(`\n📁 音频路径: ${result.audioPath}`);
      
      // 检查文件是否存在
      if (fs.existsSync(result.audioPath)) {
        const stats = fs.statSync(result.audioPath);
        console.log(`📊 文件大小: ${stats.size} bytes`);
      }
    } else {
      console.log('\n❌ TTS Agent 测试失败!');
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n========================================\n');
}

test();
