/**
 * Pexels Provider
 * 
 * Based on PyPexels (salvoventura/pypexels) architecture
 * 
 * Pexels API wrapper for searching videos and photos
 */

import { logger } from '../../../../src/core/logger.js';

const API_BASE = 'https://api.pexels.com';

/**
 * PexelsProvider Class
 */
export class PexelsProvider {
  constructor(options = {}) {
    this.name = 'PexelsProvider';
    this.apiKey = options.apiKey;
    this.apiVersion = 'v1';
  }

  /**
   * Make API request
   */
  async request(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('Pexels API key not configured');
    }
    
    const url = new URL(`${API_BASE}/${this.apiVersion}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    logger.agent(this.name, `GET ${endpoint}`, { params });
    
    // TODO: Implement actual fetch
    // const response = await fetch(url.toString(), {
    //   headers: { Authorization: this.apiKey }
    // });
    // return response.json();
    
    // Mock response
    return this.mockResponse(endpoint, params);
  }

  /**
   * Search for photos
   * Reference: PyPexels Search class
   */
  async search(query, options = {}) {
    const {
      perPage = 15,
      page = 1,
      orientation,
      size,
      color,
      locale
    } = options;
    
    const params = {
      query,
      per_page: perPage,
      page
    };
    
    if (orientation) params.orientation = orientation;
    if (size) params.size = size;
    if (color) params.color = color;
    if (locale) params.locale = locale;
    
    const response = await this.request('search', params);
    return this.parsePhotos(response);
  }

  /**
   * Get popular photos
   * Reference: PyPexels Popular class
   */
  async popular(options = {}) {
    const { perPage = 15, page = 1 } = options;
    
    const response = await this.request('popular', {
      per_page: perPage,
      page
    });
    
    return this.parsePhotos(response);
  }

  /**
   * Get curated photos
   * Reference: PyPexels Curated class
   */
  async curated(options = {}) {
    const { perPage = 15, page = 1 } = options;
    
    const response = await this.request('curated', {
      per_page: perPage,
      page
    });
    
    return this.parsePhotos(response);
  }

  /**
   * Get single photo
   * Reference: PyPexels SinglePhoto class
   */
  async getPhoto(photoId) {
    const response = await this.request(`photos/${photoId}`);
    return this.parseSinglePhoto(response);
  }

  /**
   * Search for videos
   * Reference: PyPexels VideosSearch class
   */
  async videosSearch(query, options = {}) {
    const {
      perPage = 15,
      page = 1,
      orientation,
      size
    } = options;
    
    const params = {
      query,
      per_page: perPage,
      page
    };
    
    if (orientation) params.orientation = orientation;
    if (size) params.size = size;
    
    const response = await this.request('videos/search', params);
    return this.parseVideos(response);
  }

  /**
   * Get popular videos
   * Reference: PyPexels VideosPopular class
   */
  async videosPopular(options = {}) {
    const { perPage = 15, page = 1 } = options;
    
    const response = await this.request('videos/popular', {
      per_page: perPage,
      page
    });
    
    return this.parseVideos(response);
  }

  /**
   * Get single video
   * Reference: PyPexels SingleVideo class
   */
  async getVideo(videoId) {
    const response = await this.request(`videos/videos/${videoId}`);
    return this.parseSingleVideo(response);
  }

  /**
   * Parse photo response
   */
  parsePhotos(response) {
    if (!response.photos) return [];
    
    return response.photos.map(photo => ({
      id: photo.id,
      width: photo.width,
      height: photo.height,
      url: photo.url,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      src: photo.src,
      liked: photo.liked,
      assetType: 'image'
    }));
  }

  /**
   * Parse single photo response
   */
  parseSinglePhoto(response) {
    return {
      id: response.id,
      width: response.width,
      height: response.height,
      url: response.url,
      photographer: response.photographer,
      photographerUrl: response.photographer_url,
      src: response.src,
      liked: response.liked,
      assetType: 'image'
    };
  }

  /**
   * Parse video response
   */
  parseVideos(response) {
    if (!response.videos) return [];
    
    return response.videos.map(video => ({
      id: video.id,
      width: video.width,
      height: video.height,
      url: video.url,
      image: video.image,
      duration: video.duration,
      user: video.user,
      videoFiles: video.video_files,
      videoPictures: video.video_pictures,
      assetType: 'video'
    }));
  }

  /**
   * Parse single video response
   */
  parseSingleVideo(response) {
    return {
      id: response.id,
      width: response.width,
      height: response.height,
      url: response.url,
      image: response.image,
      duration: response.duration,
      user: response.user,
      videoFiles: response.video_files,
      videoPictures: response.video_pictures,
      assetType: 'video'
    };
  }

  /**
   * Mock response for testing
   */
  mockResponse(endpoint, params) {
    logger.warn(`   Using mock response (API not configured)`);
    
    if (endpoint.includes('video')) {
      return {
        page: 1,
        per_page: params.per_page || 15,
        total_results: 2,
        videos: [
          {
            id: 123456,
            width: 1920,
            height: 1080,
            duration: 30,
            image: 'https://example.com/thumbnail.jpg',
            url: 'https://www.pexels.com/video/123456',
            user: { name: 'Example User', url: 'https://www.pexels.com/@example' },
            video_files: [{ link: 'https://example.com/video.mp4' }],
            video_pictures: []
          }
        ]
      };
    }
    
    return {
      page: 1,
      per_page: params.per_page || 15,
      total_results: 2,
      photos: [
        {
          id: 123456,
          width: 1920,
          height: 1080,
          url: 'https://www.pexels.com/photo/123456',
          photographer: 'Example User',
          photographer_url: 'https://www.pexels.com/@example',
          src: {
            original: 'https://example.com/original.jpg',
            large: 'https://example.com/large.jpg',
            medium: 'https://example.com/medium.jpg',
            small: 'https://example.com/small.jpg'
          },
          liked: false
        }
      ]
    };
  }
}

export default PexelsProvider;




