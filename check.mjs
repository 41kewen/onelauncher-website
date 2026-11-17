import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const task = path.dirname(fileURLToPath(import.meta.url));
const directoryArgument = process.argv.indexOf('--directory');
if (directoryArgument !== -1 && !process.argv[directoryArgument + 1]) throw new Error('--directory 需要目录路径');
const root = directoryArgument === -1 ? path.join(task, 'dist') : path.resolve(task, process.argv[directoryArgument + 1]);
const reference = path.join(task, 'reference-repo');
const errors = [];
const htmlFiles = ['index.html', 'docs/index.html', 'docs/guide.html', 'docs/developers.html', 'docs/sources.html'];
const documents = new Map();
let linkCount = 0;
let sourceLinkCount = 0;
for (const file of htmlFiles) documents.set(file, await fs.readFile(path.join(root, file), 'utf8'));

for (const [file, html] of documents) {
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${file}: 需要且仅需要一个 H1`);
  if (!html.includes('lang="zh-CN"') || !html.includes('name="viewport"')) errors.push(`${file}: 缺少语言或视口`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${file}: 重复 ID`);
  if (/\{#[a-z0-9-]+\}/.test(html)) errors.push(`${file}: 残留 Markdown 锚点`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    linkCount++;
    if (/^https?:/.test(value)) {
      if (value.startsWith('http:')) errors.push(`${file}: 非 HTTPS 外部链接 ${value}`);
      const prefix = 'https://github.com/lnetface/OneLauncher/blob/507e3b7cddf19d6c9a720dd229ab191c34992faf/';
      if (value.startsWith(prefix) && await fs.access(reference).then(() => true, () => false)) {
        sourceLinkCount++;
        const sourcePath = decodeURIComponent(value.slice(prefix.length).split('#')[0]);
        try {
          const code = await fs.readFile(path.join(reference, sourcePath), 'utf8');
          const range = value.match(/#L(\d+)(?:-L(\d+))?$/);
          if (range && Number(range[2] || range[1]) > code.split('\n').length) errors.push(`${file}: 源码行号超出 ${sourcePath}`);
        } catch (error) { errors.push(`${file}: 源码不存在 ${sourcePath}`); }
      }
      continue;
    }
    if (/^(mailto:|data:)/.test(value)) continue;
    const [filename, fragment] = value.split('#');
    const target = filename ? path.resolve(root, path.dirname(file), decodeURIComponent(filename)) : path.join(root, file);
    if (!target.startsWith(`${root}${path.sep}`)) { errors.push(`${file}: 路径逃逸 ${value}`); continue; }
    try {
      await fs.access(target);
      if (fragment) {
        const targetHtml = await fs.readFile(target, 'utf8');
        if (!targetHtml.includes(`id="${decodeURIComponent(fragment)}"`)) errors.push(`${file}: 锚点不存在 ${value}`);
      }
    } catch (error) { errors.push(`${file}: 文件不存在 ${value}`); }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(match[0]) || !/\bwidth="/.test(match[0]) || !/\bheight="/.test(match[0])) errors.push(`${file}: 图片缺少 alt / 尺寸`);
  }
}
const home = documents.get('index.html');
if (!home.includes('fetchpriority="high"') || /<img[^>]*fetchpriority="high"[^>]*loading="lazy"/.test(home)) errors.push('首屏图片优先级不正确');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'assets/assets-manifest.json'), 'utf8'));
if (/D:\\|Tencent Files|1171016674/.test(JSON.stringify(manifest))) errors.push('公开素材清单含私人本机路径');
for (const asset of manifest.assets) {
  const bytes = await fs.readFile(path.join(root, 'assets', asset.path));
  if (bytes.length !== asset.bytes) errors.push(`${asset.path}: 素材大小与清单不一致`);
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) errors.push(`${asset.path}: 素材哈希与清单不一致`);
}
const report = { directory: root, pages: htmlFiles.length, checkedLinks: linkCount, checkedSourceLinks: sourceLinkCount, sourceReferenceAvailable: await fs.access(reference).then(() => true, () => false), imageAssets: manifest.assets.length, errors };
console.log(JSON.stringify(report, null, 2));
await fs.writeFile(path.join(task, 'static-check.json'), JSON.stringify(report, null, 2), 'utf8');
if (errors.length) process.exitCode = 1;
