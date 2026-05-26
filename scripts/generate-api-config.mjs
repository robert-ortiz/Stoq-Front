import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, '..');
const outputFile = path.join(workspaceRoot, 'src', 'app', 'core', 'config', 'generated-api.config.ts');
const defaultBaseUrl = 'https://stoq-backend-2.onrender.com';
const rawBaseUrl = (process.env.STOQ_API_BASE_URL ?? '').trim();

const apiBaseUrl = rawBaseUrl || defaultBaseUrl;

const fileContents = `export const API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\n`;

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, fileContents, 'utf8');