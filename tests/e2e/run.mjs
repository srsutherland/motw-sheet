// Start the dev server, run each browser test in turn, stop the server.
//   npm run test:e2e              all tests
//   npm run test:e2e -- edit      only tests whose file name contains "edit"
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const dir = dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] ?? '';
const tests = readdirSync(dir).filter((f) => f.endsWith('.test.mjs') && f.includes(filter));

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const env = { ...process.env, TEST_BASE_URL: server.resolvedUrls.local[0] };

// Async, not spawnSync: the dev server runs in this process and has to keep serving.
const run = (file) => new Promise((resolve) => {
    spawn(process.execPath, [file], { stdio: 'inherit', env }).on('exit', resolve);
});

const failed = [];
try {
    for (const test of tests) {
        console.log(`\n=== ${test}`);
        const status = await run(join(dir, test));
        if (status !== 0) {
            failed.push(test);
        }
    }
} finally {
    await server.close();
}

console.log(failed.length ? `\nFailed: ${failed.join(', ')}` : `\nAll ${tests.length} browser tests passed`);
process.exit(failed.length ? 1 : 0);
