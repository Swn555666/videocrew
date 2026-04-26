import chalk from 'chalk';

const levels = {
  info: { color: 'blue', label: 'INFO' },
  success: { color: 'green', label: 'SUCCESS' },
  warn: { color: 'yellow', label: 'WARN' },
  error: { color: 'red', label: 'ERROR' },
  agent: { color: 'magenta', label: 'AGENT' },
  task: { color: 'cyan', label: 'TASK' }
};

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  log(level, message, meta = {}) {
    const config = levels[level] || levels.info;
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefixStr = this.prefix ? chalk.gray(`[${this.prefix}]`) : '';
    const metaStr = Object.keys(meta).length ? chalk.gray(JSON.stringify(meta)) : '';
    
    console.log(
      chalk.gray(`${timestamp} `) +
      chalk[config.color](`[${config.label}]`) +
      prefixStr + ' ' +
      message +
      (metaStr ? ' ' + metaStr : '')
    );
  }

  info(message, meta) { this.log('info', message, meta); }
  success(message, meta) { this.log('success', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  error(message, meta) { this.log('error', message, meta); }

  agent(name, message, meta) {
    const fullMessage = chalk.magenta(`[${name}]`) + ' ' + message;
    const config = levels.agent;
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const metaStr = Object.keys(meta || {}).length ? chalk.gray(JSON.stringify(meta)) : '';
    console.log(chalk.gray(`${timestamp} `) + chalk[config.color](`[${config.label}]`) + ' ' + fullMessage + (metaStr ? ' ' + metaStr : ''));
  }

  task(id, message, status) {
    const statusColor = status === 'done' ? 'green' : status === 'fail' ? 'red' : 'cyan';
    console.log(chalk.cyan(`[TASK:${id}]`) + ' ' + message + ' ' + chalk[statusColor](`[${status}]`));
  }
}

export const logger = new Logger();

export function createLogger(prefix) {
  return new Logger(prefix);
}

export default logger;
