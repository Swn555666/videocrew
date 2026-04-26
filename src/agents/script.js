import { logger } from '../core/logger.js';
import { taskManager } from '../core/taskManager.js';
import { messageQueue } from '../core/messageQueue.js';
import { storage } from '../utils/storage.js';

/**
 * Script Agent - 编剧 Agent
 * 基于开源项目 smolagents-video-script-generator 的架构
 * 
 * 核心功能：
 * 1. 研究规划 - 搜索主题相关内容
 * 2. 脚本生成 - 基于研究生成初稿
 * 3. 脚本打磨 - 优化增强
 * 4. 质量评估 - 评分并反馈
 */

// 默认提示词模板（参考开源项目结构）
const PROMPTS = {
  research: {
    system: 'You are a research expert. Generate focused search queries to gather comprehensive information.',
    user: `As a research expert, create EXACTLY {count} focused search queries to gather comprehensive information about {topic}.
    
Requirements:
- Generate EXACTLY {count} queries, no more, no less, no less
- Each query should target a different aspect of the topic
- Keep queries short (4-6 words) and specific
- Include a mix of factual, historical, and engaging content
- Focus on information that would be interesting in a video
- Avoid redundant or overlapping queries

Format:
- Return EXACTLY {count} queries, one per line
- Do not include numbering or bullet points
- Do not include quotes or special characters
- Do not include any other text or explanations

Example output (if {count} were 3):
topic history origins background
topic major achievements milestones
topic interesting unknown facts trivia`
  },

  script: {
    system: 'You are a professional video script writer. Return ONLY valid JSON.',
    user: `Create an engaging {format} video script using the provided research data.
Video Length: {duration} minutes
Questions: {questions}
Topic: {topic}

Research Data:
{research_data}

Requirements:
1. Create a structured script with clear sections
2. Include specific timestamps
3. Write engaging questions and explanations
4. Add voiceover text
5. Suggest visual elements

Return a valid JSON object matching this exact structure:
{
  "intro_script": "Opening hook and introduction text",
  "questions": [
    {
      "question": "The question text",
      "answer": "The answer text",
      "fact": "An interesting related fact",
      "timestamp": "MM:SS format",
      "transition": "Transition text to next question"
    }
  ],
  "outro_script": "Closing remarks and call to action",
  "visual_notes": "Visual suggestions and transitions",
  "timestamps": {
    "intro": "MM:SS format",
    "questions": ["MM:SS format"],
    "outro": "MM:SS format"
  }
}

Important:
- Return ONLY the JSON object, no markdown, no explanations
- Ensure all fields match the example structure exactly`
  },

  polish: {
    system: 'You are an expert in social media engagement and video optimization. Always return valid JSON.',
    user: `Enhance this {format} video script for maximum engagement.
Original Script:
{original_script}

Requirements:
1. Improve hook and intro
2. Enhance transitions between questions
3. Add engaging facts/context
4. Optimize for platform ({format})
5. Include trending hashtags
6. Enhance visual suggestions

Return a valid JSON object with this exact structure:
{
  "intro_script": "Enhanced opening hook",
  "questions": [
    {
      "question": "Enhanced question text",
      "answer": "Enhanced answer text",
      "fact": "Enhanced interesting fact",
      "timestamp": "MM:SS format",
      "transition": "Enhanced transition text"
    }
  ],
  "outro_script": "Enhanced closing remarks",
  "visual_notes": "Enhanced visual suggestions",
  "timestamps": {
    "intro": "MM:SS format",
    "questions": ["MM:SS format"],
    "outro": "MM:SS format"
  },
  "hashtags": ["list", "of", "hashtags"],
  "engagement_notes": "Platform-specific engagement tips"
}

Important:
- Return ONLY valid JSON, no markdown code blocks
- Ensure all fields are present and match structure`
  },

  evaluate: {
    system: 'You are an expert content evaluator. Return valid JSON with scores.',
    user: `Evaluate this {format} video script for quality and engagement potential.

Script to evaluate:
{script}

Score each criterion from 0-10:
1. Comprehensiveness: How well does it cover all aspects?
2. Relevance: How relevant is the content to the topic?
3. Credibility: How reliable are the sources?
4. Engagement: How engaging is the content?
5. Topic coverage: How well does it cover the specific topic?

Provide specific, actionable feedback and list 3-5 concrete improvement suggestions.

Return valid JSON exactly like this:
{
  "scores": {
    "comprehensiveness": 0-10,
    "relevance": 0-10,
    "credibility": 0-10,
    "engagement": 0-10,
    "coverage": 0-10
  },
  "total_score": 0-10 average,
  "feedback": "Detailed feedback text",
  "improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
}`
  }
};

/**
 * 研究规划器
 */
async function planResearch(topic, count = 5) {
  logger.agent('Script Agent', `📊 规划搜索查询 (${count}个)...`);
  
  const prompt = PROMPTS.research.user
    .replace('{count}', count.toString())
    .replace('{topic}', topic);

  const queries = await callLLM([
    { role: 'system', content: PROMPTS.research.system },
    { role: 'user', content: prompt }
  ]);

  // 解析查询结果
  return queries
    .split('\n')
    .map(q => q.trim())
    .filter(q => q && !q.startsWith('-') && !q.match(/^\d/))
    .slice(0, count);
}

/**
 * 模拟 LLM 调用
 * 后续可接入真实 API
 */
async function callLLM(messages, options = {}) {
  const hasApiKey = process.env.OPENAI_API_KEY && 
                    process.env.OPENAI_API_KEY !== 'your-api-key-here';

  if (hasApiKey) {
    // TODO: 接入真实 OpenAI API
    return mockLLMResponse(messages);
  }

  return mockLLMResponse(messages);
}

/**
 * 模拟 LLM 响应（用于测试）
 */
async function mockLLMResponse(messages) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // 模拟研究查询
  if (lastMessage.includes('search queries') || lastMessage.includes('Research')) {
    return `topic history origins background
topic major developments breakthroughs
topic real world applications uses
topic interesting facts secrets
topic future predictions trends`;
  }

  // 模拟脚本生成
  if (lastMessage.includes('Create an engaging') || lastMessage.includes('script')) {
    return JSON.stringify({
      intro_script: '欢迎观看本期节目！今天我们来探讨一个引人入胜的话题。',
      questions: [
        {
          question: '这个问题非常重要？',
          answer: '答案是肯定的！',
          fact: '这是一个有趣的事实',
          timestamp: '00:15',
          transition: '接下来让我们深入了解'
        },
        {
          question: '第二个问题是什么？',
          answer: '这是第二个答案',
          fact: '这是另一个有趣的事实',
          timestamp: '00:30',
          transition: '让我们继续'
        }
      ],
      outro_script: '以上就是本期节目的全部内容，感谢观看！',
      visual_notes: '建议使用图表、动画和素材剪辑',
      timestamps: {
        intro: '00:00',
        questions: ['00:15', '00:30'],
        outro: '00:45'
      }
    });
  }

  // 模拟打磨
  if (lastMessage.includes('Enhance') || lastMessage.includes('engagement')) {
    return JSON.stringify({
      intro_script: '🔥 惊人发现！这个话题你一定要知道！',
      questions: [
        {
          question: '🔥 这个问题你可能从没听过？',
          answer: '答案是...太不可思议了！',
          fact: '震惊的事实：大多数人不知道这个！',
          timestamp: '00:15',
          transition: '但这还不是最惊人的...'
        }
      ],
      outro_script: '如果觉得有用，请点赞关注！更多精彩内容下期见！',
      visual_notes: '使用动态文字、快切、emoji 标注',
      hashtags: ['#话题', '#科普', '#涨知识', '#必看'],
      engagement_notes: '开头用悬念抓住注意力，结尾引导互动'
    });
  }

  // 模拟评估
  if (lastMessage.includes('Evaluate') || lastMessage.includes('Score')) {
    return JSON.stringify({
      scores: {
        comprehensiveness: 7.5,
        relevance: 8.0,
        credibility: 7.0,
        engagement: 8.5,
        coverage: 7.5
      },
      total_score: 7.7,
      feedback: '脚本整体质量不错，有较好的结构和吸引力。建议加强事实核查，增加互动元素。',
      improvement_suggestions: [
        '添加更多数据支撑',
        '增加观众互动引导',
        '优化开头3秒的吸引力',
        '添加字幕动画效果',
        '加入热点话题关联'
      ]
    });
  }

  return '模拟响应';
}

/**
 * 生成脚本
 */
async function generateScript(topic, type = 'documentary', duration = 180) {
  logger.agent('Script Agent', `📝 开始生成脚本...`);
  
  const format = type === 'short' ? 'TikTok' : type === 'narration' ? 'YouTube' : 'Documentary';
  const questions = type === 'short' ? 3 : type === 'narration' ? 5 : 4;

  // 阶段1: 研究规划
  logger.agent('Script Agent', `🔍 阶段1: 研究规划`);
  const searchQueries = await planResearch(topic, 5);
  logger.info(`   生成 ${searchQueries.length} 个搜索查询`);
  
  // 模拟搜索结果（实际应用中会调用搜索API）
  const researchData = await simulateResearch(searchQueries, topic);

  // 阶段2: 脚本生成
  logger.agent('Script Agent', `✍️ 阶段2: 生成初稿`);
  const scriptPrompt = PROMPTS.script.user
    .replace('{format}', format)
    .replace('{duration}', (duration / 60).toString())
    .replace('{questions}', questions.toString())
    .replace('{topic}', topic)
    .replace('{research_data}', researchData);

  const rawScript = await callLLM([
    { role: 'system', content: PROMPTS.script.system },
    { role: 'user', content: scriptPrompt }
  ]);

  let initialScript;
  try {
    initialScript = JSON.parse(rawScript);
  } catch (e) {
    logger.warn('   脚本解析失败，使用默认结构');
    initialScript = createDefaultScript(topic);
  }

  // 阶段3: 打磨优化
  logger.agent('Script Agent', `✨ 阶段3: 打磨优化`);
  const polishPrompt = PROMPTS.polish.user
    .replace('{format}', format)
    .replace('{original_script}', JSON.stringify(initialScript));

  const polishedRaw = await callLLM([
    { role: 'system', content: PROMPTS.polish.system },
    { role: 'user', content: polishPrompt }
  ]);

  let polishedScript;
  try {
    polishedScript = JSON.parse(polishedRaw);
  } catch (e) {
    logger.warn('   打磨解析失败，使用初稿');
    polishedScript = initialScript;
  }

  // 阶段4: 质量评估
  logger.agent('Script Agent', `📊 阶段4: 质量评估`);
  const evalPrompt = PROMPTS.evaluate.user
    .replace('{format}', format)
    .replace('{script}', JSON.stringify(polishedScript));

  const evalRaw = await callLLM([
    { role: 'system', content: PROMPTS.evaluate.system },
    { role: 'user', content: evalPrompt }
  ]);

  let evaluation;
  try {
    evaluation = JSON.parse(evalRaw);
  } catch (e) {
    evaluation = { total_score: 7.0, feedback: '评估完成' };
  }

  // 转换为我们熟悉的格式
  const finalScript = convertToOutputFormat(polishedScript, topic, type, duration);

  logger.agent('Script Agent', `✅ 脚本生成完成 (评分: ${evaluation.total_score}/10)`);

  return {
    script: finalScript,
    evaluation,
    searchQueries,
    metadata: {
      format,
      questions,
      duration,
      topic
    }
  };
}

/**
 * 模拟研究搜索
 */
async function simulateResearch(queries, topic) {
  // 模拟获取搜索结果
  return `
关于"${topic}"的研究资料：

1. 历史背景：该话题起源于20世纪，经过多年发展已成为重要领域。

2. 关键技术：包括核心技术1、技术2和技术3，这些技术推动了整个领域的进步。

3. 应用场景：广泛应用于行业A、行业B和行业C，给社会带来深远影响。

4. 发展趋势：未来几年将朝着更智能、更高效的方向发展。

5. 趣味知识：这个领域有很多有趣的冷知识，比如...。
`;
}

/**
 * 创建默认脚本
 */
function createDefaultScript(topic) {
  return {
    intro_script: `欢迎观看本期节目，今天我们来了解${topic}。`,
    questions: [
      {
        question: `${topic}是什么？`,
        answer: `${topic}是一个重要的概念。`,
        fact: '这是一个有趣的事实',
        timestamp: '00:20',
        transition: '让我们继续了解'
      }
    ],
    outro_script: `以上就是关于${topic}的介绍，感谢观看！`,
    visual_notes: '使用素材和文字动画',
    timestamps: { intro: '00:00', questions: ['00:20'], outro: '00:40' }
  };
}

/**
 * 转换为输出格式
 */
function convertToOutputFormat(script, topic, type, duration) {
  // 提取场景
  const scenes = [];
  
  // 开场
  scenes.push({
    id: 1,
    description: script.visual_notes || '开场画面',
    narration: script.intro_script,
    duration: 15,
    assets_needed: ['开场画面', '背景音乐']
  });

  // 问题场景
  if (script.questions && script.questions.length > 0) {
    script.questions.forEach((q, i) => {
      scenes.push({
        id: i + 2,
        description: `问题${i + 1}相关素材`,
        narration: `${q.question}\n${q.answer}`,
        duration: Math.floor((duration - 30) / (script.questions.length || 1)),
        assets_needed: ['相关素材', '过渡动画']
      });
    });
  }

  // 结尾
  scenes.push({
    id: scenes.length + 1,
    description: '结尾画面',
    narration: script.outro_script,
    duration: 15,
    assets_needed: ['结尾画面', '关注引导']
  });

  return {
    title: `${topic} - ${type === 'documentary' ? '纪录片' : type === 'short' ? '短视频' : '解说视频'}`,
    type,
    duration,
    scenes,
    totalDuration: duration,
    hashtags: script.hashtags || [],
    engagement_notes: script.engagement_notes || '',
    timestamps: script.timestamps || {},
    raw: script
  };
}

/**
 * Script Agent 主类
 */
class ScriptAgent {
  constructor() {
    this.name = 'Script Agent';
    this.queue = 'script';
  }

  /**
   * 生成脚本
   */
  async generate(projectId, topic, type = 'documentary', duration = 180) {
    const taskId = taskManager.createTask(this.name, 'generate-script', {
      projectId,
      topic,
      type,
      duration
    });

    logger.agent(this.name, `📝 正在生成脚本...`, { topic, type, duration });

    try {
      const result = await generateScript(topic, type, duration);
      
      // 保存脚本
      const projectPath = storage.getProjectPath(projectId);
      const scriptPath = storage.saveScript(projectPath, result.script);

      // 保存研究数据
      if (result.searchQueries) {
        storage.writeJSON(projectPath, 'research.json', {
          queries: result.searchQueries,
          evaluation: result.evaluation
        });
      }

      // 发送脚本就绪消息
      messageQueue.send('script-ready', {
        taskId,
        projectId,
        script: result.script,
        scriptPath
      });

      taskManager.completeTask(taskId, { script: result.script, scriptPath });

      logger.agent(this.name, `✅ 脚本生成成功`, { 
        title: result.script.title,
        scenes: result.script.scenes?.length || 0,
        score: result.evaluation?.total_score || 'N/A'
      });

      return { success: true, script: result.script, scriptPath, taskId };
    } catch (error) {
      logger.error(`❌ 脚本生成失败`, { error: error.message });
      taskManager.failTask(taskId, error.message);
      return { success: false, error: error.message };
    }
  }
}

export const scriptAgent = new ScriptAgent();
export default scriptAgent;
