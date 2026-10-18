// ============================================
// run-dev.js - Concurrently run Server & Client
// ============================================

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting AI Mock Interview (Backend + Frontend)...');

// Start Server
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

server.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[SERVER]\x1b[0m ${data}`);
});

server.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[SERVER ERR]\x1b[0m ${data}`);
});

// Start Client
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

client.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[CLIENT]\x1b[0m ${data}`);
});

client.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[CLIENT ERR]\x1b[0m ${data}`);
});

const cleanup = () => {
  console.log('\n\x1b[36m%s\x1b[0m', 'Stopping both server and client...');
  if (isWindows) {
    if (server.pid) spawn('taskkill', ['/pid', server.pid.toString(), '/T', '/F']);
    if (client.pid) spawn('taskkill', ['/pid', client.pid.toString(), '/T', '/F']);
  } else {
    server.kill();
    client.kill();
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
