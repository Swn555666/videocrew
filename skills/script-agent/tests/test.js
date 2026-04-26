/**
 * Script Skill 测试
 */

import { ScriptSkill } from '../src/skill.js';

async function test() {
  console.log('\n========================================');
  console.log('🧪 ScriptSkill 测试');
  console.log('========================================\n');

  // 创建 skill 实例
  const skill = new ScriptSkill({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o'
  });

  const topic = '人工智能的未来';
  const options = {
    type: 'documentary',
    duration: 60,
    tone: '专业权威'
  };

  console.log(`📋 测试参数:`);
  console.log(`   主题: ${topic}`);
  console.log(`   类型: ${options.type}`);
  console.log(`   时长: ${options.duration}秒\n`);

  try {
    // 测试完整流程
    console.log('🚀 开始测试...\n');
    
    const result = await skill.generateScript(topic, options);
    
    if (result.success) {
      console.log('\n✅ 测试成功!\n');
      console.log('📄 生成的脚本:');
      console.log('----------------------------------------');
      console.log(`   标题: ${result.script.title}`);
      console.log(`   类型: ${result.script.type}`);
      console.log(`   场景数: ${result.script.scenes?.length || 0}`);
      console.log(`   时长: ${result.script.duration}秒`);
      console.log(`   话题标签: ${result.script.hashtags?.join(', ')}`);
      console.log('----------------------------------------');
      
      // 显示场景
      if (result.script.scenes) {
        console.log('\n📖 场景预览:');
        result.script.scenes.slice(0, 3).forEach(scene => {
          console.log(`   [${scene.id}] ${scene.description}`);
          console.log(`       解说: ${scene.narration?.slice(0, 50)}...`);
        });
      }
    } else {
      console.log('\n❌ 测试失败:', result.error);
    }
  } catch (error) {
    console.log('\n❌ 测试异常:', error.message);
  }

  console.log('\n========================================\n');
}

test();
