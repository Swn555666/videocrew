# SKILL.md - Script Agent Skill

> 基于 OpenFilm (anders0821/OpenFilm) 开源项目架构

## 1. 概述

Script Agent Skill 负责视频脚本的智能生成，采用多阶段工作流：
- 研究分析 → 蓝图规划 → 打磨优化 → 脚本撰写

基于 OpenFilm 的 LangChain/LangGraph 架构，支持自然语言交互和专业影视编剧流程。

## 2. 技术架构

### 2.1 核心组件

```
ScriptSkill/
├── src/
│   ├── skill.js              # Skill 主入口
│   ├── researcher.js          # 研究分析子Agent
│   ├── planner.js            # 蓝图规划子Agent
│   ├── refiner.js            # 打磨优化子Agent
│   ├── writer.js            # 脚本撰写子Agent
│   └── prompts.js            # Prompt 模板
├── tests/
│   └── test.js               # 测试文件
├── examples/
│   └── demo.md               # 使用示例
└── SKILL.md
```

### 2.2 依赖

```json
{
  "dependencies": {
    "openai": "^4.77.0"
  }
}
```

## 3. 功能接口

### 3.1 核心方法

```javascript
class ScriptSkill {
  // 生成完整视频脚本
  async generateScript(topic, options)
  
  // 研究分析
  async research(topic)
  
  // 创建蓝图
  async createBlueprint(topic, researchData)
  
  // 打磨优化
  async refineBlueprint(blueprint, feedback)
  
  // 撰写脚本
  async writeScript(blueprint)
}
```

### 3.2 输入参数

| 参数 | 类型 | 说明 |
|------|------|------|
| topic | string | 视频主题 |
| type | string | 视频类型 (documentary/short/narration) |
| duration | number | 时长(秒) |
| tone | string | 语气风格 |

### 3.3 输出格式

```json
{
  "title": "视频标题",
  "type": "documentary",
  "duration": 180,
  "scenes": [
    {
      "id": 1,
      "description": "场景描述",
      "narration": "解说词",
      "duration": 15,
      "assets_needed": ["素材1", "素材2"]
    }
  ],
  "totalDuration": 180,
  "metadata": {
    "researchQueries": [],
    "blueprint": {},
    "versions": []
  }
}
```

## 4. Prompt 模板

### 4.1 系统 Prompt

```
你是一个专业影视编剧助手，名叫 ScriptAgent。

重要规则：
- 使用中文输出
- 喜欢用 emoji
- 在创作过程中会询问用户意见
- JSON 格式输出时不要添加尾部符号
```

### 4.2 研究分析 Prompt

```
根据主题 "{topic}"，生成 {count} 个搜索查询，
用于收集相关信息。

要求：
- 查询简洁 (4-6 词)
- 覆盖不同方面
- 包含事实性、历史性、趣味性内容
```

### 4.3 蓝图创建 Prompt

```
根据以下研究数据，为 {duration} 秒的 {type} 视频创建结构化蓝图。

研究数据：
{research_data}

输出格式：
{
  "title": "标题",
  "sections": [
    {
      "section_title": "章节标题",
      "description": "描述",
      "time": "时间戳",
      "pointers": ["要点1", "要点2"]
    }
  ],
  "targetAudience": "目标观众",
  "keyMessages": ["关键信息1", "关键信息2"]
}
```

### 4.4 脚本撰写 Prompt

```
根据以下蓝图，撰写完整的视频脚本。

蓝图：
{blueprint}

要求：
- 开场要吸引观众
- 内容有趣、有信息量
- 结尾有呼吁行动
- 添加话题标签
```

## 5. 使用示例

### 5.1 基础用法

```javascript
import { ScriptSkill } from './src/skill.js';

const skill = new ScriptSkill({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

const result = await skill.generateScript('人工智能的未来', {
  type: 'documentary',
  duration: 180,
  tone: '专业权威'
});

console.log(result);
```

### 5.2 分阶段使用

```javascript
// 阶段1: 研究
const researchData = await skill.research('人工智能的未来');

// 阶段2: 蓝图
const blueprint = await skill.createBlueprint('人工智能的未来', researchData);

// 阶段3: 打磨
const refined = await skill.refineBlueprint(blueprint, { /* 用户反馈 */ });

// 阶段4: 撰写
const script = await skill.writeScript(refined);
```

## 6. 参考开源项目

- **OpenFilm** (anders0821/OpenFilm) - AI-powered screenwriting assistant
  - LangChain/LangGraph 架构
  - 多Agent协作
  - 自然语言交互

## 7. 待接入 API

- [ ] OpenAI GPT-4 - 脚本生成
- [ ] Tavily AI - 互联网搜索
- [ ] YouSearch - 搜索工具
