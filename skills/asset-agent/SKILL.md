# SKILL.md - Asset Agent Skill

> 基于 Pexels API (salvoventura/pypexels) 开源项目架构

## 1. 概述

Asset Agent Skill 负责素材的搜索、下载和管理。

基于 PyPexels 的架构设计，支持：
- Pexels 视频/图片搜索
- Pixabay 素材搜索
- 本地素材库管理
- 素材分类和标签

## 2. 技术架构

```
asset-agent/
├── src/
│   ├── skill.js              # Skill 主入口
│   ├── providers/
│   │   ├── pexels.js        # Pexels API
│   │   └── pixabay.js       # Pixabay API
│   ├── downloader.js         # 素材下载
│   ├── classifier.js         # 素材分类
│   └── storage.js           # 本地存储
├── tests/
│   └── test.js               # 测试文件
├── examples/
│   └── demo.md               # 使用示例
└── SKILL.md
```

## 3. 核心功能

### 3.1 素材搜索

```javascript
class AssetSkill {
  // 搜索视频
  async searchVideos(query, options)
  
  // 搜索图片
  async searchImages(query, options)
  
  // 搜索素材（视频+图片）
  async search(query, options)
}
```

### 3.2 Pexels API

```javascript
class PexelsProvider {
  // 搜索
  search(query, options)
  
  // 获取热门
  popular(options)
  
  // 获取单个
  getPhoto(id)
  getVideo(id)
}
```

## 4. Pexels API 配置

### 4.1 端点

- 搜索照片: `GET /v1/search`
- 热门照片: `GET /v1/popular`
- 搜索视频: `GET /videos/search`
- 热门视频: `GET /videos/popular`
- 单个照片: `GET /v1/photos/:id`
- 单个视频: `GET /videos/videos/:id`

### 4.2 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| query | string | 搜索关键词 |
| per_page | number | 每页数量 (1-100) |
| page | number | 页码 |
| orientation | string | horizontal/vertical/square |
| size | string | large/medium/small |

## 5. 使用示例

### 5.1 基础搜索

```javascript
import { AssetSkill } from './src/skill.js';

const skill = new AssetSkill({
  pexelsApiKey: 'YOUR_PEXELS_API_KEY'
});

const results = await skill.searchVideos('nature');
console.log(results);
```

### 5.2 带选项搜索

```javascript
const results = await skill.searchImages('technology', {
  orientation: 'vertical',
  size: 'large',
  perPage: 20
});
```

## 6. 参考开源项目

**PyPexels** (salvoventura/pypexels)
- Pexels REST API Python 封装
- 支持照片和视频搜索
- 简洁的 API 设计

## 7. 待接入

- [ ] Pexels API
- [ ] Pixabay API
- [ ] 本地素材库
- [ ] AI 素材生成
