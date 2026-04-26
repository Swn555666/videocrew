/**
 * 测试脚本 - 完整流水线测试
 * 
 * 测试目标：验证从输入到输出的完整流程
 */

import { directorAgent } from './src/agents/director.js';

async function test() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║     🎬 VideoCrew 完整流水线测试                           ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const topic = '人工智能的未来';
  const type = 'documentary';
  const duration = 60;

  console.log('📋 测试参数:');
  console.log('----------------------------------------');
  console.log(`   主题: ${topic}`);
  console.log(`   类型: ${type}`);
  console.log(`   时长: ${duration}秒`);
  console.log('----------------------------------------\n');

  const startTime = Date.now();

  try {
    const result = await directorAgent.produce(topic, type, duration);

    const duration_ms = Date.now() - startTime;

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    
    if (result.status === 'completed') {
      console.log('║     ✅ 视频制作完成！                                      ║');
    } else {
      console.log('║     ❌ 视频制作失败                                        ║');
    }
    
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');

    console.log('📊 执行统计:');
    console.log('----------------------------------------');
    console.log(`   状态: ${result.status}`);
    console.log(`   耗时: ${duration_ms}ms`);
    console.log(`   项目ID: ${result.projectId}`);
    console.log('----------------------------------------\n');

    if (result.outputs) {
      console.log('📦 输出文件:');
      console.log('----------------------------------------');
      const icons = {
        script: '📄',
        audio: '🎙️',
        video: '🎞️',
        subtitles: '📝',
        finalVideo: '🎬'
      };
      
      for (const [type, path] of Object.entries(result.outputs)) {
        const icon = icons[type] || '📦';
        console.log(`   ${icon} ${type}: ${path}`);
      }
      console.log('----------------------------------------\n');
    }

    if (result.error) {
      console.log('❌ 错误信息:');
      console.log('----------------------------------------');
      console.log(`   ${result.error}`);
      console.log('----------------------------------------\n');
    }

  } catch (error) {
    console.log('\n❌ 测试异常!');
    console.log(`   错误: ${error.message}`);
  }

  console.log('\n');
}

test();
