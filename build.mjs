import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, 'site');
const outputArgument = process.argv.indexOf('--output');
if (outputArgument !== -1 && !process.argv[outputArgument + 1]) throw new Error('--output 需要目录路径');
const output = outputArgument === -1 ? path.join(root, 'dist') : path.resolve(root, process.argv[outputArgument + 1]);
if (output === root || output === source || path.relative(source, output).startsWith(`..${path.sep}`) === false) {
  throw new Error('输出目录不得覆盖源码或位于 site 内');
}
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
const commit = '507e3b7cddf19d6c9a720dd229ab191c34992faf';
const assetManifest = JSON.parse(await fs.readFile(path.join(source, 'assets/assets-manifest.json'), 'utf8'));
const pages = [
  { file: 'index', title: '项目介绍', label: '项目介绍', eyebrow: 'ONELAUNCHER', intro: 'OneLauncher 是 Minecraft Java 版启动器。这里介绍项目功能、技术栈和使用限制。', source: 'overview.md' },
  { file: 'guide', title: '使用指南', label: '使用指南', eyebrow: 'GUIDE', intro: '账户设置、版本安装、实例管理和资源下载的操作说明，按当前源码流程整理。', source: 'guide.md' },
  { file: 'developers', title: '开发与贡献', label: '开发与贡献', eyebrow: 'DEVELOPMENT', intro: '开发环境、构建命令、工程结构、数据流、AOT 限制和贡献说明。', source: 'developers.md' },
  { file: 'sources', title: '文档依据与版本说明', label: '来源与版本', eyebrow: 'SOURCES & VERSIONS', intro: '本网站使用的源码版本、文档依据和设计素材来源。', source: 'sources.md' },
];
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function prepareMarkdown(text, page) {
  const toc = [];
  let sectionIndex = 0;
  const withAnchors = text.replace(/^(#{2,3}) (.+)$/gm, (_, marks, raw) => {
    const match = raw.match(/^(.*?)\s*\{#([a-z0-9-]+)\}\s*$/);
    const title = match ? match[1] : raw;
    const id = match ? match[2] : `${page.file}-section-${++sectionIndex}`;
    toc.push({ title, id, level: marks.length });
    return `${marks} ${title} {#${id}}`;
  });
  const tokens = markdown.parse(withAnchors, {});
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== 'heading_open') continue;
    const inline = tokens[index + 1];
    const match = inline.content.match(/\s*\{#([a-z0-9-]+)\}$/);
    if (!match) continue;
    tokens[index].attrSet('id', match[1]);
    inline.content = inline.content.replace(/\s*\{#[a-z0-9-]+\}$/, '');
    inline.children = markdown.parseInline(inline.content, {})[0].children;
  }
  const defaultImage = markdown.renderer.rules.image;
  markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
    tokens[index].attrSet('loading', 'lazy');
    const asset = assetManifest.assets.find((item) => item.path === path.basename(tokens[index].attrGet('src')));
    if (asset) {
      tokens[index].attrSet('width', String(asset.dimensions[0]));
      tokens[index].attrSet('height', String(asset.dimensions[1]));
    }
    return defaultImage(tokens, index, options, env, renderer);
  };
  const html = markdown.renderer.render(tokens, markdown.options, {})
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>');
  const sections = [];
  let current = { title: page.label, url: `${page.file}.html`, text: '' };
  let fenced = false;
  for (const line of withAnchors.split('\n')) {
    if (line.startsWith('```')) { fenced = !fenced; continue; }
    const heading = !fenced && line.match(/^#{2,3} (.*?) \{#([a-z0-9-]+)\}$/);
    if (heading) {
      if (current.text.trim()) sections.push(current);
      current = { title: `${page.label} · ${heading[1]}`, url: `${page.file}.html#${heading[2]}`, text: '' };
    } else {
      current.text += ` ${line.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*#>|]/g, '').trim()}`;
    }
  }
  if (current.text.trim()) sections.push(current);
  return { html, toc, sections };
}

function template(page, result, index) {
  const previous = pages[index - 1];
  const next = pages[index + 1];
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <script>try{const t=localStorage.getItem('olan-theme');if(t==='light'||t==='dark')document.querySelector('meta[name="color-scheme"]').content=t;}catch(e){/* 无存储也能跟随系统主题。 */}</script>
  <title>${escape(page.label)} · OneLauncher 文档</title>
  <meta name="description" content="${escape(page.intro)}">
  <link rel="icon" href="../assets/onelauncher-icon.png">
  <link rel="stylesheet" href="../assets/styles.css">
  <script defer src="../assets/search-index.js"></script>
  <script defer src="../assets/app.js"></script>
</head>
<body class="docs-page">
  <a class="skip-link" href="#main">跳到文档正文</a>
  <div class="reading-progress" aria-hidden="true"></div>
  <header class="site-header"><a class="brand" href="../index.html" aria-label="返回 OneLauncher 首页"><img src="../assets/onelauncher-icon.png" width="32" height="32" alt=""><span>OneLauncher</span></a><nav class="header-nav" aria-label="主导航"><a class="desktop-link" href="../index.html#features">功能</a><a href="index.html">文档</a><a class="desktop-link" href="https://github.com/lnetface/OneLauncher" target="_blank" rel="noopener noreferrer">GitHub ↗</a><button class="theme-toggle" type="button" aria-label="切换颜色主题" hidden><svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"></path></svg><svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.4 15.8A9 9 0 0 1 8.2 3.6a9 9 0 1 0 12.2 12.2Z"></path></svg></button></nav></header>
  <div class="docs-shell"><div class="docs-banner"><strong>文档 / ${escape(page.label)}</strong><span>源码核对 · 2026.11.17 · ${commit.slice(0, 7)}</span></div><div class="docs-layout">
    <aside class="doc-sidebar" aria-label="文档导航"><label class="search-label" for="docs-search">搜索文档</label><input class="search-input" id="docs-search" type="search" placeholder="Java、账户、AOT…" aria-controls="search-results" autocomplete="off"><p class="search-hint">在所有文档章节中搜索 · Esc 清空</p><p id="search-status" class="search-status" role="status"></p><div id="search-results" class="search-results" hidden></div><noscript><p class="no-script-note">搜索需要 JavaScript；下方导航与正文仍可完整使用。</p></noscript><nav class="doc-nav" aria-label="文档板块"><span>ONELAUNCHER DOCS</span>${pages.map((item) => `<a href="${item.file}.html"${item.file === page.file ? ' aria-current="page"' : ''}>${item.label}</a>`).join('')}</nav><div class="doc-source">依据官方仓库源码快照<br><a href="https://github.com/lnetface/OneLauncher/tree/${commit}" target="_blank" rel="noopener noreferrer">${commit.slice(0, 7)} · 查看源码 ↗</a><br>实际界面以下载版本为准。</div></aside>
    <main id="main" class="doc-article"><span class="eyebrow">${escape(page.eyebrow)}</span><h1>${escape(page.title)}</h1><p class="doc-intro">${escape(page.intro)}</p>${result.html}<nav class="doc-pagination" aria-label="上一页与下一页">${previous ? `<a href="${previous.file}.html"><span>← 上一篇</span>${previous.label}</a>` : ''}${next ? `<a href="${next.file}.html"><span>下一篇 →</span>${next.label}</a>` : ''}</nav></main>
    <nav class="doc-toc" aria-label="本页目录"><strong>本页内容</strong>${result.toc.map((item) => `<a href="#${escape(item.id)}"${item.level === 3 ? ' class="toc-sub"' : ''}>${escape(item.title)}</a>`).join('')}</nav>
  </div></div>
  <footer class="site-footer"><div class="footer-top"><a class="brand" href="../index.html"><img src="../assets/onelauncher-icon.png" width="28" height="28" alt=""><span>OneLauncher</span></a><div><a href="../index.html">返回首页</a><a href="https://github.com/lnetface/OneLauncher/issues" target="_blank" rel="noopener noreferrer">反馈问题</a><a href="sources.html">文档依据</a></div></div><div class="footer-bottom"><p>OneLauncher · Minecraft Java 版启动器</p><p>非 Minecraft 官方产品，与 Mojang 或 Microsoft 没有从属关系。</p></div></footer>
</body>
</html>\n`;
}

async function main() {
  await fs.access(path.join(source, 'index.html'));
  const prepared = [];
  for (const page of pages) {
    const text = await fs.readFile(path.join(root, 'content', page.source), 'utf8');
    prepared.push(prepareMarkdown(text, page));
  }
  const vendor = path.join(source, 'assets/vendor');
  await fs.mkdir(vendor, { recursive: true });
  for (const file of ['gsap.min.js', 'ScrollTrigger.min.js']) {
    await fs.copyFile(path.join(root, 'node_modules/gsap/dist', file), path.join(vendor, file));
  }
  await fs.mkdir(path.join(source, 'docs'), { recursive: true });
  for (let index = 0; index < pages.length; index++) {
    await fs.writeFile(path.join(source, 'docs', `${pages[index].file}.html`), template(pages[index], prepared[index], index), 'utf8');
  }
  await fs.writeFile(path.join(source, 'assets/search-index.js'), `window.OLAN_SEARCH = ${JSON.stringify(prepared.flatMap((item) => item.sections)).replace(/</g, '\\u003c')};\n`, 'utf8');
  await fs.writeFile(path.join(source, 'THIRD_PARTY_NOTICES.md'), await fs.readFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8'), 'utf8');
  await fs.mkdir(output, { recursive: true });
  // 输出目录是本任务独占的交付目录，只覆盖同名生成文件，不删除其他目录。
  await fs.cp(source, output, { recursive: true, force: true });
  // 发布清单只保留资源名与校验值，不把用户本机路径随官网公开。
  await fs.writeFile(path.join(output, 'assets/assets-manifest.json'), JSON.stringify({
    source_repository: assetManifest.source_repository,
    source_commit: assetManifest.source_commit,
    background_sha256: assetManifest.background_sha256 || Object.values(assetManifest.sources_sha256)[0],
    assets: assetManifest.assets,
    originals_unchanged: assetManifest.originals_unchanged,
  }, null, 2), 'utf8');
  console.log(`Built ${pages.length + 1} static HTML pages → ${output}`);
}

await main();
