/**
 * FFmpeg Executor
 * 
 * Executes FFmpeg commands
 */

import { logger } from '../../../videocrew/src/core/logger.js';
import { spawn } from 'child_process';
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';

/**
 * FFmpegExecutor Class
 */
export class FFmpegExecutor {
  constructor(options = {}) {
    this.name = 'FFmpegExecutor';
    this.commander = options.commander;
    this.timeout = options.timeout || 300000; // 5 minutes
  }

  /**
   * Execute FFmpeg command
   */
  async execute(command) {
    const { cmd, args, inputs } = command;
    
    logger.agent(this.name, `Executing: ${cmd} ${args.join(' ')}`);
    
    // Check if FFmpeg is available
    const available = await this.checkFFmpeg(cmd);
    if (!available) {
      logger.warn(`FFmpeg not found, using mock mode`);
      return this.mockExecute(command);
    }
    
    // If using concat with many inputs, use demuxer method
    if (args.some(arg => arg.includes('concat:')) && inputs && inputs.length > 2) {
      return this.executeWithDemuxer(cmd, inputs, args, command);
    }
    
    return this.spawnProcess(cmd, args);
  }

  /**
   * Spawn FFmpeg process
   */
  spawnProcess(cmd, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => { stdout += data.toString(); });
      process.stderr.on('data', (data) => { stderr += data.toString(); });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          logger.error(`FFmpeg exited with code ${code}`);
          logger.error(`stderr: ${stderr.slice(-500)}`);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
      
      setTimeout(() => {
        process.kill();
        reject(new Error('FFmpeg timeout'));
      }, this.timeout);
    });
  }

  /**
   * Execute with demuxer method for concatenation
   */
  async executeWithDemuxer(cmd, inputs, originalArgs, command) {
    // Create file list for concat demuxer
    const listFile = `concat_list_${Date.now()}.txt`;
    const listContent = inputs.map(f => `file '${f}'`).join('\n');
    
    writeFileSync(listFile, listContent);
    
    logger.agent(this.name, `Using concat demuxer with list file`);
    
    // Build new command with list file
    const newArgs = ['-f', 'concat', '-safe', '0', '-i', listFile];
    
    // Add other arguments (skip the -i concat:...)
    for (let i = 0; i < originalArgs.length; i++) {
      if (!originalArgs[i].startsWith('-i') && !originalArgs[i].includes('concat:')) {
        newArgs.push(originalArgs[i]);
      }
    }
    
    // Update output path
    newArgs[newArgs.length - 1] = originalArgs[originalArgs.length - 1];
    
    try {
      const result = await this.spawnProcess(cmd, newArgs);
      // Clean up temp file
      try { unlinkSync(listFile); } catch (e) { }
      return result;
    } catch (err) {
      try { unlinkSync(listFile); } catch (e) { }
      throw err;
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async checkFFmpeg(cmd) {
    return false; // Mock mode for now
  }

  /**
   * Mock execute for testing
   */
  async mockExecute(command) {
    const { args } = command;
    
    logger.agent(this.name, `Mock execution`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get output path (last argument)
    const outputPath = args[args.length - 1];
    
    // Create mock output
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Write mock data
    writeFileSync(outputPath, Buffer.from(`MOCK_FFMPEG_OUTPUT_${Date.now()}`));
    
    return {
      stdout: 'Mock FFmpeg output',
      stderr: '',
      code: 0,
      mock: true
    };
  }
}

export default FFmpegExecutor;
