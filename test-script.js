/**
 * 测试脚本 - 阶段1: 编剧 Agent
 * 
 * 测试目标：验证编剧 Agent 能否正常工作
 * 
 * 使用方式:
 * node test-script.js
 */

// 导入
import { scriptAgent } from './src/agents/script.js';
import { storage } from './src/utils/storage.js';
import { v4 as uuidv4 } from 'uuid';

async function test() {
  console.log('\n========================================');
  console.log('📝 阶段1测试: 编剧 Agent');
  console.log('========================================\n');

  // 创建测试项目
  const projectId = uuidv4();
  const topic = '人工智能的未来';
  const type = 'documentary';
  const duration = 60;

  console.log(`📋 测试参数:`);
  console.log(`   项目ID: ${projectId}`);
  console.log(`   主题: ${topic}`);
  console.log(`   类型: ${type}`);
  console.log(`   时长: ${duration}秒\n`);

  // 创建项目目录
  const projectPath = storage.createProject(projectId, topic);
  console.log(`📁 项目目录: ${projectPath}\n`);

  try {
    // 调用编剧 Agent
    console.log('🚀 调用编剧 Agent...\n');
    const result = await scriptAgent.generate(projectId, topic, type, duration);

    if (result.success) {
      console.log('\n✅ 编剧 Agent 测试成功!');
      console.log('========================================');
      console.log('📄 生成的脚本:');
      console.log('========================================');
      
      const script = result.script;
      console.log(`\n📌 标题: ${script.title}`);
      console.log(`📌 类型: ${script.type}`);
      console.log(`📌 场景数: ${script.scenes?.length || 0}`);
      
      if (script.scenes && script.scenes.length > 0) {
        console.log('\n📖 场景预览:');
        script.scenes.slice(0, 3).forEach((scene, i) => {
          console.log(`\n   [场景${scene.id}] ${scene.description?.slice(0, 50)}...`);
          console.log(`   解说: ${scene.narration?.slice(0, 60)}...`);
        });
      }

      console.log(`\n📁 脚本保存位置: ${result.scriptPath}`);
    } else {
      console.log('\n❌ 编剧 Agent 测试失败!');
      console.log(`   错误: ${result.error}`);
    }
  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n========================================\n');
}

test();
