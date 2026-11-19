import * as fs from 'node:fs';
import * as path from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR || process.cwd();
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const postPath = path.join(botDir, 'POST.json');

if (!fs.existsSync(postPath)) {
  console.error(`Error: POST.json does not exist at ${postPath}`);
  process.exit(1);
}

const stats = fs.statSync(postPath);
if (stats.size > 16384) {
  console.error(`Error: POST.json exceeds 16384 bytes (size: ${stats.size} bytes)`);
  process.exit(1);
}

let content: string;
try {
  content = fs.readFileSync(postPath, 'utf8');
} catch (err) {
  console.error(`Error reading ${postPath}:`, err);
  process.exit(1);
}

if (Buffer.byteLength(content, 'utf8') > 16384) {
  console.error(`Error: POST.json content exceeds 16384 bytes`);
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(content);
} catch (err) {
  console.error(`Error: POST.json contains invalid JSON:`, err);
  process.exit(1);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  console.error('Error: POST.json must be a JSON object');
  process.exit(1);
}

const data = parsed as Record<string, unknown>;

if (typeof data.url !== 'string') {
  console.error("Error: POST.json must contain a 'url' string property");
  process.exit(1);
}

const twitterUrlPattern = /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+(?:\/|\?.*)?$/;
if (!twitterUrlPattern.test(data.url)) {
  console.error(`Error: URL "${data.url}" does not match an X / Twitter status URL format (https://x.com/<handle>/status/<digits> or twitter.com)`);
  process.exit(1);
}

try {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(postPath, path.join(outputDir, 'POST.json'));
  console.log(`Successfully copied POST.json to ${outputDir}`);
} catch (err) {
  console.error(`Error copying POST.json to ${outputDir}:`, err);
  process.exit(1);
}
