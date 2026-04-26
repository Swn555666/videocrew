# Asset Skill 使用示例

## 基本用法

### 1. 导入和初始化

```javascript
import { AssetSkill } from './src/skill.js';

const skill = new AssetSkill({
  pexelsApiKey: 'YOUR_PEXELS_API_KEY',
  pixabayApiKey: 'YOUR_PIXABAY_API_KEY',
  localLibrary: './workspace/assets'
});
```

### 2. 搜索素材

```javascript
// 搜索所有类型
const results = await skill.search('nature');

// 搜索视频
const videos = await skill.searchVideos('forest', { perPage: 10 });

// 搜索图片
const images = await skill.searchImages('technology', { orientation: 'vertical' });
```

### 3. 下载素材

```javascript
// 下载单个
const result = await skill.download(asset, {
  outputDir: './downloads'
});

// 批量下载
const batch = await skill.downloadBatch(assets, {
  outputDir: './downloads',
  parallel: 5
});
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| pexelsApiKey | string | env.PEXELS_API_KEY | Pexels API Key |
| pixabayApiKey | string | env.PIXABAY_API_KEY | Pixabay API Key |
| localLibrary | string | ./workspace/assets | 本地素材库路径 |

## 搜索选项

```javascript
const results = await skill.search('query', {
  type: 'all',           // all, image, video
  limit: 10,             // 结果数量
  perPage: 20,           // 每页数量
  page: 1,               // 页码
  orientation: 'all',    // all, horizontal, vertical, square
  size: 'large'          // large, medium, small
});
```

## 素材分类

```javascript
const classified = skill.classify(asset);

// 输出:
// {
//   id: 123,
//   assetType: 'image',
//   tags: ['nature', 'forest', 'landscape'],
//   category: 'nature',
//   quality: { score: 9, quality: 'high', resolution: '1920x1080' },
//   usage: ['Thumbnail', 'Cover image', 'Social media', 'Documentary'],
//   classified: true
// }
```

## 本地素材库

```javascript
// 搜索本地
const local = await skill.searchLocal('nature', 'video');

// 获取统计
const stats = await skill.getLibraryStats();

// 清理旧文件
await skill.cleanup(30); // 删除30天前的文件
```

## 参考开源项目

**PyPexels** (salvoventura/pypexels)
- Pexels REST API Python 封装
- 简洁的 API 设计
- 支持照片和视频搜索

## 待接入 API

- [ ] Pexels API
- [ ] Pixabay API
- [ ] 本地素材库
- [ ] AI 素材生成
