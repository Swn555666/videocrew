import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * 简单的内存消息队列
 * 用于 Agent 之间的通信
 */
class MessageQueue {
  constructor() {
    this.messages = new Map();
    this.subscribers = new Map();
  }

  /**
   * 发送消息到指定队列
   */
  send(queue, message) {
    const id = uuidv4();
    const envelope = {
      id,
      queue,
      payload: message,
      timestamp: Date.now(),
      status: 'pending'
    };

    if (!this.messages.has(queue)) {
      this.messages.set(queue, []);
    }
    this.messages.get(queue).push(envelope);

    logger.agent('MQ', `Message sent to queue [${queue}]`, { id: id.slice(0, 8), size: JSON.stringify(message).length });

    // 通知订阅者
    this.notify(queue, envelope);

    return id;
  }

  /**
   * 订阅队列
   */
  subscribe(queue, callback) {
    if (!this.subscribers.has(queue)) {
      this.subscribers.set(queue, []);
    }
    this.subscribers.get(queue).push(callback);

    return () => {
      const callbacks = this.subscribers.get(queue);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }

  /**
   * 通知订阅者
   */
  notify(queue, message) {
    const callbacks = this.subscribers.get(queue) || [];
    callbacks.forEach(cb => {
      try {
        cb(message);
      } catch (err) {
        logger.error(`Subscriber error for queue [${queue}]`, { error: err.message });
      }
    });
  }

  /**
   * 获取队列中的消息（不删除）
   */
  peek(queue) {
    return this.messages.get(queue) || [];
  }

  /**
   * 获取并删除消息
   */
  receive(queue) {
    const messages = this.messages.get(queue) || [];
    const pending = messages.filter(m => m.status === 'pending');
    
    if (pending.length > 0) {
      const message = pending[0];
      message.status = 'received';
      return message;
    }
    return null;
  }

  /**
   * 确认消息已处理
   */
  ack(queue, messageId) {
    const messages = this.messages.get(queue) || [];
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.status = 'completed';
      logger.agent('MQ', `Message acknowledged`, { queue, id: messageId.slice(0, 8) });
    }
  }

  /**
   * 清空队列
   */
  clear(queue) {
    this.messages.delete(queue);
  }

  /**
   * 获取队列状态
   */
  status() {
    const status = {};
    for (const [queue, messages] of this.messages) {
      status[queue] = {
        total: messages.length,
        pending: messages.filter(m => m.status === 'pending').length,
        received: messages.filter(m => m.status === 'received').length,
        completed: messages.filter(m => m.status === 'completed').length
      };
    }
    return status;
  }
}

export const messageQueue = new MessageQueue();
export default messageQueue;
