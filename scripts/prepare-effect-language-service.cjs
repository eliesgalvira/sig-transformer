const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const binName = process.platform === 'win32'
  ? 'effect-language-service.cmd'
  : 'effect-language-service';

const binPath = join(process.cwd(), 'node_modules', '.bin', binName);

if (!existsSync(binPath)) {
  console.log('[prepare] effect-language-service not installed; skipping patch.');
  process.exit(0);
}

const result = spawnSync(binPath, ['patch'], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
