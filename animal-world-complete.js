/**
 * Animal World Video - Complete Production
 * Uses VideoCrew pipeline with Pexels videos
 */

import VideoCrew from './src/VideoCrew.js';

const OutputDir = 'C:\\Users\\wn\\Desktop\\animal_world';

// Animal world script with 8 scenes
const script = {
  title: '动物世界',
  subtitle: 'Animal World Documentary',
  scenes: [
    {
      title: '非洲草原',
      description: '非洲大草原日出，野生动物开始新的一天',
      searchQuery: 'african safari草原',
      duration: 38
    },
    {
      title: '狮子王国',
      description: '狮群在草原上休憩，展现百兽之王的风采',
      searchQuery: 'lion wildlife狮子',
      duration: 38
    },
    {
      title: '大象家族',
      description: '象群在草原上漫步，母象照顾着小象',
      searchQuery: 'elephant wildlife大象',
      duration: 38
    },
    {
      title: '猎豹竞速',
      description: '猎豹以120公里时速追捕猎物的精彩瞬间',
      searchQuery: 'cheetah running猎豹',
      duration: 38
    },
    {
      title: '斑马群落',
      description: '斑马群在草原上奔跑，黑白条纹在阳光下闪烁',
      searchQuery: 'zebra wildlife斑马',
      duration: 38
    },
    {
      title: '长颈鹿',
      description: '长颈鹿优雅地品尝金合欢树的嫩叶',
      searchQuery: 'giraffe wildlife长颈鹿',
      duration: 38
    },
    {
      title: '河马戏水',
      description: '河马整天泡在水里，只露出眼睛和耳朵',
      searchQuery: 'hippopotamus河马',
      duration: 38
    },
    {
      title: '动物世界',
      description: '每个生命都在讲述着属于自己的故事',
      searchQuery: 'wildlife documentary自然',
      duration: 38
    }
  ]
};

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🎬 Animal World - Real Production     ║');
  console.log('║  5-Minute Nature Documentary           ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  // Create VideoCrew instance with API key (user needs to provide)
  const vc = new VideoCrew({
    outputDir: OutputDir,
    pexelsApiKey: process.env.PEXELS_API_KEY // Set this environment variable
  });
  
  // Run the pipeline
  const result = await vc.createVideoFromScript(script, {
    title: 'animal_world',
    voiceover: false,
    music: true
  });
  
  if (result.success) {
    console.log(`\n📍 Video saved to: ${result.path}`);
  }
}

main().catch(console.error);
