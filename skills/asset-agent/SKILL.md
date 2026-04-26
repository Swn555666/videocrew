# SKILL.md - Asset Agent Skill

> 基于 Pexels API (salvoventura/pypexels) + Pixabay API 开源项目架构

## 1. 概述

Asset Agent Skill 负责素材的搜索、下载和管理。

支持：
- Pexels 视频/图片搜索 + 下载
- Pixabay 素材搜索 + 下载
- Archive.org 公共领域视频搜索
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
│   ├── downloader.js         # 素材下载 (支持URL/Pexels/Pixabay/Archive)
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

### 3.2 直接下载

```javascript
// 从 URL 下载
const result = await assetDownloader.downloadFromUrl(url, outputPath);

// 从 asset 对象下载（自动识别来源）
const result = await assetDownloader.download(asset, outputDir);
```

### 3.3 平台搜索

```javascript
// Pexels 视频搜索
const { videos } = await assetDownloader.searchPexelsVideos('lion safari');

// Pixabay 视频搜索
const { videos } = await assetDownloader.searchPixabayVideos('elephant');

// Archive.org 公共领域视频搜索
const { videos } = await assetDownloader.searchArchiveVideos('wildlife documentary');
```

## 4. API 配置

### 4.1 环境变量

```bash
PEXELS_API_KEY=your_pexels_api_key
PIXABAY_API_KEY=your_pixabay_api_key
```

### 4.2 Pexels API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/v1/search` | GET | 搜索照片 |
| `/videos/search` | GET | 搜索视频 |
| `/videos/popular` | GET | 热门视频 |

### 4.3 Pixabay API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/` | GET | 搜索照片 |
| `/api/videos/` | GET | 搜索视频 |

## 5. 使用示例

### 5.1 配置 API Keys

```bash
# .env
PEXELS_API_KEY=your_key_here
PIXABAY_API_KEY=your_key_here
```

### 5.2 搜索并下载视频

```javascript
import { AssetDownloader } from './src/downloader.js';

const downloader = new AssetDownloader({
  pexelsApiKey: process.env.PEXELS_API_KEY,
  pixabayApiKey: process.env.PIXABAY_API_KEY
});

// 搜索 Pexels 视频
const { videos } = await downloader.searchPexelsVideos('african safari', { perPage: 5 });

// 下载第一个视频
if (videos.length > 0) {
  const result = await downloader.download(videos[0], './downloads');
  console.log('Downloaded:', result.path);
}
```

### 5.3 从 Archive.org 下载公共领域视频

```javascript
// Archive.org 不需要 API key
const { videos } = await downloader.searchArchiveVideos('wildlife nature');

if (videos.length > 0) {
  const result = await downloader.download(videos[0], './videos');
  console.log('Downloaded:', result.path);
}
```

### 5.4 批量下载

```javascript
const videos = await downloader.searchPexelsVideos('nature', { perPage: 10 });

const results = await Promise.all(
  videos.map(video => downloader.download(video, './downloads'))
);

console.log(`Successfully downloaded: ${results.filter(r => r.success).length}`);
```

## 6. 免费视频资源

### 6.1 Archive.org 公共领域视频

| 关键词 | 内容类型 |
|--------|----------|
| wildlife | 野生动物 |
| nature documentary | 自然纪录片 |
| african animals | 非洲动物 |
| marine life | 海洋生物 |
| national geographic | 国家地理 |

### 6.2 示例搜索

```javascript
// 野生动物
await downloader.searchArchiveVideos('wildlife documentary');

// 海洋生物
await downloader.searchArchiveVideos('ocean marine life');

// 非洲动物
await downloader.searchArchiveVideos('african wildlife safari');
```

## 7. 参考开源项目

**PyPexels** (salvoventura/pypexels)
- Pexels REST API Python 封装
- 支持照片和视频搜索
- 简洁的 API 设计

## 8. 待接入

- [x] Pexels API (需要 API key)
- [x] Pixabay API (需要 API key)
- [x] Archive.org 公共领域视频
- [ ] 本地素材库
- [ ] AI 素材生成
