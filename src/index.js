/**
 * VideoCrew - AI Multi-Agent Video Creation System
 * 主入口文件
 */
import { cli } from './cli.js';
import { logger } from './core/logger.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 显示欢迎信息
console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║     🎬  VideoCrew  v1.0.0                  ║
║     AI Multi-Agent Video Creation           ║
║                                            ║
╚════════════════════════════════════════════╝
`);

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'create': {
        // 解析参数
        const topic = args.slice(2).join(' ') || 'AI人工智能的发展历程';
        const options = {
          type: 'documentary',
          duration: 180
        };

        // 检查选项
        args.forEach(arg => {
          if (arg === '--short') { options.type = 'short'; options.duration = 60; }
          if (arg === '--narration') { options.type = 'narration'; options.duration = 300; }
          if (arg.startsWith('--duration=')) {
            options.duration = parseInt(arg.split('=')[1]);
          }
        });

        const result = await cli.create(topic, options);
        process.exit(result.status === 'completed' ? 0 : 1);
        break;
      }

      case 'list':
      case 'ls': {
        const projects = cli.listProjects();
        console.log('\n📁 Projects:\n');
        if (projects.length === 0) {
          console.log('   No projects found');
        } else {
          projects.forEach(p => {
            console.log(`   [${p.id.slice(0, 8)}] ${p.name || 'Untitled'}`);
            console.log(`   Status: ${p.status} | Created: ${p.createdAt}\n`);
          });
        }
        break;
      }

      case 'status': {
        if (!args[1]) {
          console.log('Usage: videocrew status <project-id>');
          process.exit(1);
        }
        const status = cli.status(args[1]);
        console.log('\n📊 Project Status:\n');
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      case 'tasks': {
        const status = cli.taskStatus();
        console.log('\n📋 Task Queue:\n');
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      case 'help':
      default: {
        console.log(`
Usage: videocrew <command> [options]

Commands:
  create [topic]     Create a new video project
                      Topic defaults to "AI人工智能的发展历程"
  
  list, ls           List all projects
  
  status <id>        Show project status
  
  tasks              Show task queue status

Options:
  --short            Short video mode (60s)
  --narration        Narration video mode (5min)
  --duration=<sec>   Custom duration

Examples:
  videocrew create "美食纪录片"
  videocrew create "科技解说" --short
  videocrew create "纪录片" --duration=300
  videocrew list
  videocrew tasks
`);
        process.exit(0);
      }
    }
  } catch (error) {
    logger.error('Fatal error', { error: error.message });
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
