# Script Skill 使用示例

## 基本用法

### 1. 导入和初始化

```javascript
import { ScriptSkill } from './src/skill.js';

const skill = new ScriptSkill({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o'
});
```

### 2. 生成完整脚本

```javascript
const result = await skill.generateScript('人工智能的未来', {
  type: 'documentary',
  duration: 180,
  tone: '专业权威'
});

if (result.success) {
  console.log(result.script);
} else {
  console.error(result.error);
}
```

### 3. 分阶段使用

```javascript
// 阶段1: 研究
const research = await skill.research('人工智能的未来');
console.log(research.queries);
console.log(research.results);

// 阶段2: 蓝图
const blueprint = await skill.createBlueprint('人工智能的未来', research);
console.log(blueprint.sections);

// 阶段3: 打磨 (可选)
const refined = await skill.refineBlueprint(blueprint, research, {
  feedback: '增加更多案例'
});

// 阶段4: 撰写
const script = await skill.writeScript(refined || blueprint);
console.log(script.scenes);
```

## 输出格式

### 脚本对象

```json
{
  "title": "人工智能的未来",
  "type": "documentary",
  "duration": 180,
  "scenes": [
    {
      "id": 1,
      "description": "开场画面",
      "narration": "欢迎观看本期节目...",
      "duration": 15,
      "assets_needed": ["开场画面", "背景音乐"]
    },
    {
      "id": 2,
      "description": "核心内容",
      "narration": "人工智能正在快速发展...",
      "duration": 45,
      "assets_needed": ["相关素材"]
    }
  ],
  "totalDuration": 180,
  "hashtags": ["#人工智能", "#AI", "#科普"],
  "visual_notes": "使用图表和动画"
}
```

### 研究数据

```json
{
  "topic": "人工智能的未来",
  "queries": [
    "人工智能的历史",
    "人工智能的核心技术"
  ],
  "results": [
    {
      "query": "人工智能的历史",
      "results": [
        {
          "title": "关于人工智能的历史",
          "content": "人工智能起源于1956年...",
          "url": "https://example.com"
        }
      ]
    }
  ],
  "timestamp": "2026-04-26T10:00:00.000Z"
}
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | env.OPENAI_API_KEY | OpenAI API Key |
| model | string | gpt-4o | 使用的模型 |
| maxTokens | number | 4096 | 最大 token 数 |

## 视频类型

- `documentary` - 纪录片 (4章节)
- `short` - 短视频 (3章节)
- `narration` - 解说视频 (5章节)

## 语气风格

- 专业权威
- 轻松活泼
- 幽默风趣
- 严肃认真
- 温暖亲切
- 理性分析
- 激情澎湃
- 娓娓道来
