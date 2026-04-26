/**
 * Pixabay Provider
 * 
 * Pixabay API wrapper for searching images and videos
 */

import { logger } from '../../../../src/core/logger.js';

const API_BASE = 'https://pixabay.com/api';

/**
 * PixabayProvider Class
 */
export class PixabayProvider {
  constructor(options = {}) {
    this.name = 'PixabayProvider';
    this.apiKey = options.apiKey;
  }

  /**
   * Make API request
   */
  async request(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('Pixabay API key not configured');
    }
    
    const url = new URL(`${API_BASE}`);
    params.key = this.apiKey;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    logger.agent(this.name, `GET ${endpoint}`, { params });
    
    // TODO: Implement actual fetch
    // const response = await fetch(url.toString());
    // return response.json();
    
    return this.mockResponse(params);
  }

  /**
   * Search for images
   */
  async search(query, options = {}) {
    const {
      perPage = 20,
      page = 1,
      imageType = 'photo',
      orientation,
      category,
      minWidth,
      minHeight,
      editorsChoice = true,
      safeSearch = true
    } = options;
    
    const params = {
      q: query,
      per_page: perPage,
      page,
      image_type: imageType
    };
    
    if (orientation) params.orientation = orientation;
    if (category) params.category = category;
    if (minWidth) params.min_width = minWidth;
    if (minHeight) params.min_height = minHeight;
    if (editorsChoice) params.editors_choice = editorsChoice;
    if (safeSearch) params.safe_search = safeSearch;
    
    const response = await this.request('', params);
    return this.parseImages(response);
  }

  /**
   * Search for videos
   */
  async videosSearch(query, options = {}) {
    const {
      perPage = 20,
      page = 1,
      videoType = 'film',
      category,
      minWidth,
      minHeight
    } = options;
    
    const params = {
      q: query,
      per_page: perPage,
      page,
      video_type: videoType
    };
    
    if (category) params.category = category;
    if (minWidth) params.min_width = minWidth;
    if (minHeight) params.min_height = minHeight;
    
    const response = await this.request('videos/', params);
    return this.parseVideos(response);
  }

  /**
   * Parse image response
   */
  parseImages(response) {
    if (!response.hits) return [];
    
    return response.hits.map(image => ({
      id: image.id,
      width: image.imageWidth,
      height: image.imageHeight,
      tags: image.tags,
      url: image.pageURL,
      previewUrl: image.previewURL,
      largeUrl: image.largeImageURL,
      fullHdUrl: image.fullHDURL,
      imageUrl: image.webformatURL,
      photographer: image.user,
      photographerUrl: `https://pixabay.com/users/${image.user}-${image.user_id}`,
      downloads: image.downloads,
      likes: image.likes,
      comments: image.comments,
      assetType: 'image'
    }));
  }

  /**
   * Parse video response
   */
  parseVideos(response) {
    if (!response.hits) return [];
    
    return response.hits.map(video => ({
      id: video.id,
      width: video.videos?.medium?.width || 1920,
      height: video.videos?.medium?.height || 1080,
      duration: video.duration,
      tags: video.tags,
      url: video.pageURL,
      thumbnail: video.videos?.medium?.url || video.picture_id,
      user: video.user,
      userUrl: `https://pixabay.com/users/${video.user}-${video.user_id}`,
      videos: video.videos,
      downloads: video.downloads,
      likes: video.likes,
      comments: video.comments,
      assetType: 'video'
    }));
  }

  /**
   * Mock response for testing
   */
  mockResponse(params) {
    logger.warn(`   Using mock response (API not configured)`);
    
    if (params.video_type) {
      return {
        totalHits: 1,
        hits: [
          {
            id: 789,
            duration: 15,
            tags: 'nature, forest',
            pageURL: 'https://pixabay.com/videos/789',
            picture_id: 'abc123',
            videos: {
              medium: { url: 'https://example.com/video.mp4', width: 640, height: 360 }
            },
            user: 'example_user',
            user_id: 123,
            downloads: 100,
            likes: 50,
            comments: 10
          }
        ]
      };
    }
    
    return {
      totalHits: 1,
      hits: [
        {
          id: 789,
          imageWidth: 1920,
          imageHeight: 1080,
          tags: 'nature, landscape',
          pageURL: 'https://pixabay.com/photo/789',
          previewURL: 'https://example.com/preview.jpg',
          largeImageURL: 'https://example.com/large.jpg',
          webformatURL: 'https://example.com/webformat.jpg',
          user: 'example_user',
          user_id: 123,
          downloads: 500,
          likes: 200,
          comments: 30
        }
      ]
    };
  }
}

export default PixabayProvider;





