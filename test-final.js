/**
 * 测试脚本 - 阶段5: 最终合成
 * 
 * 测试目标：验证最终合成功能
 */

import { editorAgent } from './src/agents/editor.js';

async function test() {
  console.log('\n========================================');
  console.log('🎬 阶段5测试: 最终合成');
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
  const rawVideo = `${projectPath}/exports/raw_video.mp4`;
  const subtitle = `${projectPath}/subtitles/caption.srt`;
  const finalVideo = `${projectPath}/exports/final.mp4`;
  
  console.log(`\n📋 检查文件:`);
  console.log(`   粗剪视频: ${fs.existsSync(rawVideo) ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   字幕文件: ${fs.existsSync(subtitle) ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   最终视频: ${fs.existsSync(finalVideo) ? '✅ 已存在' : '❌ 待生成'}`);

  if (!fs.existsSync(rawVideo)) {
    console.log('\n❌ 缺少粗剪视频，请先运行 test-editor.js');
    return;
  }

  console.log('\n🚀 调用最终合成...\n');

  try {
    const result = await editorAgent.finalize(projectId);

    if (result.success) {
      console.log('\n✅ 最终合成测试成功!');
      console.log('========================================');
      console.log('🎉 最终成片:');
      console.log('========================================');
      console.log(`\n📁 视频路径: ${result.videoPath}`);
      
      if (fs.existsSync(result.videoPath)) {
        const stats = fs.statSync(result.videoPath);
        console.log(`📊 文件大小: ${stats.size} bytes`);
      }

      // 显示项目所有输出文件
      console.log('\n📦 项目完整输出:');
      console.log('----------------------------------------');
      
      const subDirs = ['audio', 'subtitles', 'exports'];
      for (const subDir of subDirs) {
        const dirPath = `${projectPath}/${subDir}`;
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const filePath = `${dirPath}/${file}`;
            const stats = fs.statSync(filePath);
            console.log(`   📄 ${subDir}/${file} (${stats.size} bytes)`);
          }
        }
      }
      console.log('----------------------------------------');

    } else {
      console.log('\n❌ 最终合成测试失败!');
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n========================================\n');
}

test();
