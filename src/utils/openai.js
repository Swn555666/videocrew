import OpenAI from 'openai';
import { api } from '../config/settings.js';
import { logger } from '../core/logger.js';

// 创建 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

/**
 * 调用 OpenAI GPT-4 生成内容
 */
export async function generateText(prompt, options = {}) {
  const {
    model = api.openai.model,
    maxTokens = api.openai.maxTokens,
    temperature = api.openai.temperature
  } = options;

  logger.agent('OpenAI', `Generating text with ${model}`);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error('OpenAI API error', { error: error.message });
    throw error;
  }
}

/**
 * 语音转文字 (Whisper)
 */
export async function transcribeAudio(audioPath) {
  logger.agent('Whisper', `Transcribing audio: ${audioPath}`);

  try {
    const response = await openai.audio.transcriptions.create({
      file: audioPath,
      model: 'whisper-1',
      response_format: 'srt'
    });

    return response;
  } catch (error) {
    logger.error('Whisper API error', { error: error.message });
    throw error;
  }
}

/**
 * 生成结构化脚本
 */
export async function generateScript(topic, type = 'documentary', duration = 180) {
  const typePrompts = {
    short: `生成一个短视频脚本，时长约${duration}秒。格式要求：`,
    documentary: `生成一个纪录片解说脚本，时长约${duration}秒。格式要求：`,
    narration: `生成一个知识解说视频脚本，时长约${duration}秒。格式要求：`
  };

  const formatPrompt = `
{
  "title": "视频标题",
  "type": "${type}",
  "duration": ${duration},
  "scenes": [
    {
      "id": 1,
      "description": "场景描述/画面建议",
      "narration": "解说词",
      "duration": 10,
      "assets_needed": ["素材类型1", "素材类型2"]
    }
  ],
  "totalDuration": ${duration}
}

请确保：
1. 解说词自然流畅，适合配音
2. 场景描述具体，便于素材收集
3. 总时长接近目标时长
4. 内容有趣、有信息量
`;

  const prompt = typePrompts[type] + '\n' + formatPrompt + '\n\n主题：' + topic;
  
  const result = await generateText(prompt);
  
  try {
    // 尝试解析 JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    logger.warn('Failed to parse script JSON, returning raw text');
  }
  
  return {
    title: 'Generated Script',
    type,
    duration,
    rawText: result,
    scenes: []
  };
}

export default {
  generateText,
  transcribeAudio,
  generateScript,
  client: openai
};
