/**
 * Sub-Agent: Caption Formatter
 * 负责格式化字幕
 * 
 * 支持格式: SRT, VTT, ASS
 */
import { logger } from '../../core/logger.js';

const FORMATS = {
  srt: { name: 'SubRip', extension: '.srt' },
  vtt: { name: 'WebVTT', extension: '.vtt' },
  ass: { name: 'Advanced SubStation Alpha', extension: '.ass' }
};

const STYLES = {
  default: { font: 'Arial', size: 24, color: 'white' },
  modern: { font: 'Helvetica', size: 28, color: 'white', shadow: true },
  karaoke: { font: 'Arial Black', size: 32, color: 'yellow' },
  social: { font: 'Arial', size: 36, color: 'white', bold: true }
};

export class CaptionFormatter {
  constructor() {
    this.name = 'Caption Formatter';
  }

  /**
   * 格式化字幕
   */
  format(segments, format = 'srt', style = 'default') {
    logger.agent(this.name, `📝 格式化: ${format} (${style})`);
    
    const styleConfig = STYLES[style] || STYLES.default;
    
    switch (format) {
      case 'vtt':
        return this.toVTT(segments, styleConfig);
      case 'ass':
        return this.toASS(segments, styleConfig);
      default:
        return this.toSRT(segments);
    }
  }

  /**
   * 转为 SRT
   */
  toSRT(segments) {
    const lines = [];
    
    segments.forEach((seg, i) => {
      const start = this.formatTime(seg.start, 'srt');
      const end = this.formatTime(seg.end, 'srt');
      const text = seg.text?.trim() || '';
      
      lines.push(`${i + 1}`);
      lines.push(`${start} --> ${end}`);
      lines.push(text);
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * 转为 VTT
   */
  toVTT(segments, style) {
    const lines = ['WEBVTT', ''];
    
    // 添加样式
    if (style.shadow) {
      lines.push('STYLE');
      lines.push('::cue {');
      lines.push('  font-family: ' + style.font + ';');
      lines.push('  font-size: ' + style.size + 'px;');
      lines.push('  text-shadow: 2px 2px 4px black;');
      lines.push('}');
      lines.push('');
    }
    
    segments.forEach((seg, i) => {
      const start = this.formatTime(seg.start, 'vtt');
      const end = this.formatTime(seg.end, 'vtt');
      const text = seg.text?.trim() || '';
      
      lines.push(`${i + 1}`);
      lines.push(`${start} --> ${end}`);
      lines.push(text);
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * 转为 ASS
   */
  toASS(segments, style) {
    const lines = [
      '[Script Info]',
      'Title: Generated Subtitles',
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, Bold, Alignment',
      `Style: Default,${style.font},${style.size},&H00FFFFFF,0,2`,
      '',
      '[Events]',
      'Format: Layer, Start, End, Text'
    ];
    
    segments.forEach((seg, i) => {
      const start = this.formatTime(seg.start, 'ass');
      const end = this.formatTime(seg.end, 'ass');
      const text = (seg.text || '').replace(/\n/g, '\\N');
      
      lines.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
    });
    
    return lines.join('\n');
  }

  /**
   * 格式化时间
   */
  formatTime(seconds, format) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    
    if (format === 'srt') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    } else if (format === 'vtt') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    } else if (format === 'ass') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(Math.floor(ms / 10)).padStart(2, '0')}`;
    }
    
    return '00:00:00,000';
  }

  /**
   * 获取可用格式
   */
  getFormats() {
    return Object.entries(FORMATS).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 获取可用样式
   */
  getStyles() {
    return Object.entries(STYLES).map(([id, config]) => ({
      id,
      ...config
    }));
  }
}

export default new CaptionFormatter();
