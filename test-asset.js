/**
 * 测试脚本 - 阶段2b: Asset Agent
 * 
 * 测试目标：验证素材 Agent 能否正常工作
 */

import { assetAgent } from './src/agents/asset.js';
import { storage } from './src/utils/storage.js';

async function test() {
  console.log('\n========================================');
  console.log('📦 阶段2测试: Asset Agent');
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
  
  // 读取脚本
  const scriptPath = `${projectPath}/script.json`;
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ 没有找到脚本文件');
    return;
  }

  const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
  console.log(`📄 脚本: ${script.title}\n`);

  // 提取素材需求
  const assetsNeeded = [];
  if (script.scenes) {
    script.scenes.forEach(scene => {
      if (scene.assets_needed) {
        scene.assets_needed.forEach(asset => {
          assetsNeeded.push({
            sceneId: scene.id,
            asset,
            priority: 'medium'
          });
        });
      }
    });
  }

  console.log(`📋 素材需求: ${assetsNeeded.length} 项`);
  assetsNeeded.forEach((a, i) => {
    console.log(`   ${i + 1}. [场景${a.sceneId}] ${a.asset} (${a.priority})`);
  });
  console.log();

  try {
    console.log('🚀 调用 Asset Agent...\n');
    const result = await assetAgent.collect(projectId, assetsNeeded, script);

    if (result.success) {
      console.log('\n✅ Asset Agent 测试成功!');
      console.log('========================================');
      console.log('📦 收集的素材:');
      console.log('========================================');
      
      result.assets.forEach((asset, i) => {
        console.log(`\n   ${i + 1}. [场景${asset.sceneId}] ${asset.description}`);
        console.log(`      类型: ${asset.type} | 来源: ${asset.source} | 优先级: ${asset.priority}`);
      });

      console.log(`\n📁 素材清单: ${result.assetsPath}`);
    } else {
      console.log('\n❌ Asset Agent 测试失败!');
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n========================================\n');
}

test();
