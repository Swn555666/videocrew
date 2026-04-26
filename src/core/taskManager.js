import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * 任务状态
 */
export const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * 任务管理器
 * 管理所有 Agent 任务的创建、跟踪、完成
 */
class TaskManager {
  constructor() {
    this.tasks = new Map();
  }

  /**
   * 创建新任务
   */
  createTask(agent, type, payload) {
    const id = uuidv4();
    const task = {
      id,
      agent,
      type,
      payload,
      status: TaskStatus.PENDING,
      result: null,
      error: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      dependencies: []
    };

    this.tasks.set(id, task);
    logger.task(id, `[${agent}] ${type}`, 'created');

    return id;
  }

  /**
   * 添加任务依赖
   */
  addDependency(taskId, dependsOnId) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.dependencies.push(dependsOnId);
    }
  }

  /**
   * 开始执行任务
   */
  startTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      // 检查依赖是否完成
      const pendingDeps = task.dependencies.filter(depId => {
        const dep = this.tasks.get(depId);
        return dep && dep.status !== TaskStatus.DONE;
      });

      if (pendingDeps.length > 0) {
        logger.warn(`Task [${taskId.slice(0, 8)}] has pending dependencies`, { pending: pendingDeps.length });
        return false;
      }

      task.status = TaskStatus.RUNNING;
      task.startedAt = Date.now();
      logger.task(taskId, `[${task.agent}] ${task.type}`, 'started');
      return true;
    }
    return false;
  }

  /**
   * 完成任务
   */
  completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = TaskStatus.DONE;
      task.result = result;
      task.completedAt = Date.now();
      const duration = task.completedAt - task.startedAt;
      logger.task(taskId, `[${task.agent}] ${task.type} completed`, 'done');
      logger.info(`Task duration: ${duration}ms`);
      return true;
    }
    return false;
  }

  /**
   * 标记任务失败
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = TaskStatus.FAILED;
      task.error = error;
      task.completedAt = Date.now();
      logger.error(`[${task.agent}] ${task.type} failed`, { error });
      return true;
    }
    return false;
  }

  /**
   * 获取任务
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取任务状态摘要
   */
  getSummary() {
    const tasks = this.getAllTasks();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      running: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
      done: tasks.filter(t => t.status === TaskStatus.DONE).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length
    };
  }

  /**
   * 获取可以开始执行的任务（依赖已满足）
   */
  getRunnableTasks() {
    return this.getAllTasks().filter(task => {
      if (task.status !== TaskStatus.PENDING) return false;
      const pendingDeps = task.dependencies.filter(depId => {
        const dep = this.tasks.get(depId);
        return dep && dep.status !== TaskStatus.DONE;
      });
      return pendingDeps.length === 0;
    });
  }

  /**
   * 取消任务
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.status === TaskStatus.PENDING) {
      task.status = TaskStatus.CANCELLED;
      task.completedAt = Date.now();
      logger.task(taskId, `[${task.agent}] cancelled`, 'cancelled');
      return true;
    }
    return false;
  }

  /**
   * 清理已完成的任务
   */
  cleanup(maxAge = 3600000) {
    const now = Date.now();
    for (const [id, task] of this.tasks) {
      if (task.completedAt && (now - task.completedAt) > maxAge) {
        this.tasks.delete(id);
      }
    }
  }
}

export const taskManager = new TaskManager();
export default taskManager;
