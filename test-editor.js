/**
 * 测试脚本 - 阶段3: Editor Agent
 * 
 * 测试目标：验证剪辑 Agent 能否正常工作
 */

import { editorAgent } from './src/agents/editor.js';

async function test() {
  console.log('\n========================================');
  console.log('🎞️ 阶段3测试: Editor Agent');
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

  // 检查必要文件
  const audioPath = `${projectPath}/audio/narration.mp3`;
  const assetsManifest = `${projectPath}/assets-manifest.json`;
  
  console.log(`\n📋 检查文件:`);
  console.log(`   音频: ${fs.existsSync(audioPath) ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   素材清单: ${fs.existsSync(assetsManifest) ? '✅ 存在' : '❌ 不存在'}`);

  if (!fs.existsSync(audioPath)) {
    console.log('\n❌ 缺少音频文件，请先运行 test-tts.js');
    return;
  }
  if (!fs.existsSync(assetsManifest)) {
    console.log('\n❌ 缺少素材清单，请先运行 test-asset.js');
    return;
  }

  console.log('\n🚀 调用 Editor Agent...\n');

  try {
    const result = await editorAgent.edit(projectId);

    if (result.success) {
      console.log('\n✅ Editor Agent 测试成功!');
      console.log('========================================');
      console.log('🎞️ 生成的视频:');
      console.log('========================================');
      console.log(`\n📁 视频路径: ${result.videoPath}`);
      
      if (fs.existsSync(result.videoPath)) {
        const stats = fs.statSync(result.videoPath);
        console.log(`📊 文件大小: ${stats.size} bytes`);
      }
    } else {
      console.log('\n❌ Editor Agent 测试失败!');
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n========================================\n');
}

test();
