/**
 * 测试脚本 - 阶段4: Caption Agent
 * 
 * 测试目标：验证字幕 Agent 能否正常工作
 */

import { captionAgent } from './src/agents/caption.js';

async function test() {
  console.log('\n========================================');
  console.log('📝 阶段4测试: Caption Agent');
  console.log('========================================\n');

  const fs = await import('fs');
  const projectsDir = './workspace/projects';
  
  // 获取最新的项目
  const projects = fs.readdirSync(projectsDir).filter(p => 
    fs.statSync(`${projectsDir}/${p}`).isDirectory()
  );
  
  if (projects.length === 0) {
    console.log('❌ 没有找到项目');
    return;
  }

  const projectId = projects[projects.length - 1];
  const projectPath = `${projectsDir}/${projectId}`;
  
  console.log(`📁 项目: ${projectId}`);

  // 检查音频文件
  const audioPath = `${projectPath}/audio/narration.mp3`;
  
  console.log(`\n📋 检查文件:`);
  console.log(`   音频: ${fs.existsSync(audioPath) ? '✅ 存在' : '❌ 不存在'}`);

  if (!fs.existsSync(audioPath)) {
    console.log('\n❌ 缺少音频文件');
    return;
  }

  console.log('\n🚀 调用 Caption Agent...\n');

  try {
    const result = await captionAgent.generate(projectId, audioPath);

    if (result.success) {
      console.log('\n✅ Caption Agent 测试成功!');
      console.log('========================================');
      console.log('📝 生成的字幕:');
      console.log('========================================');
      console.log(`\n📁 字幕路径: ${result.subtitlePath}`);
      
      if (fs.existsSync(result.subtitlePath)) {
        const content = fs.readFileSync(result.subtitlePath, 'utf-8');
        console.log(`📊 文件大小: ${content.length} bytes`);
        console.log('\n📖 字幕预览 (前500字符):');
        console.log('----------------------------------------');
        console.log(content.slice(0, 500));
        console.log('----------------------------------------');
      }
    } else {
      console.log('\n❌ Caption Agent 测试失败!');
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n========================================\n');
}

test();
