/* 主题的事实来源是 color-scheme meta；存储只是跨页面持久化。 */
(() => {
  const meta = document.querySelector('meta[name="color-scheme"]');
  const toggle = document.querySelector('.theme-toggle');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const readTheme = () => {
    try {
      const value = localStorage.getItem('olan-theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return meta.content === 'light' || meta.content === 'dark' ? meta.content : null;
    }
  };
  const refreshLabel = () => {
    const current = meta.content === 'light dark' ? (system.matches ? 'dark' : 'light') : meta.content;
    if (!toggle) return;
    toggle.dataset.renderedTheme = current;
    toggle.setAttribute('aria-label', current === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    toggle.title = `${toggle.getAttribute('aria-label')} · 切回系统配色时恢复跟随系统`;
  };
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const current = meta.content === 'light dark' ? (system.matches ? 'dark' : 'light') : meta.content;
      const target = current === 'dark' ? 'light' : 'dark';
      const preference = target === (system.matches ? 'dark' : 'light') ? null : target;
      meta.content = preference || 'light dark';
      try {
        if (preference) localStorage.setItem('olan-theme', preference);
        else localStorage.removeItem('olan-theme');
      } catch (error) {
        // 页面仍已切换主题；受限制的浏览器只是无法跨页面保存。
      }
      refreshLabel();
    });
  }
  system.addEventListener('change', refreshLabel);
  window.addEventListener('storage', (event) => {
    if (event.key === 'olan-theme' || event.key === null) {
      meta.content = readTheme() || 'light dark';
      refreshLabel();
    }
  });
  refreshLabel();

  // 所有内容默认可见，GSAP 缺失或用户减弱动态效果时，仍可完整阅读。
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (document.querySelector('.hero')) {
        gsap.from('.hero-content > *', { y: 26, opacity: 0, duration: 1.05, stagger: 0.1, ease: 'power3.out', clearProps: 'all' });
        gsap.to('.hero-image img', { yPercent: 12, scale: 1.04, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.to('.hero-content', { y: -55, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: 1 } });
      }
      gsap.utils.toArray('.reveal').forEach((element) => {
        gsap.from(element, { y: 36, opacity: 0, duration: 0.9, ease: 'power2.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 92%', once: true } });
      });
      if (document.querySelector('.app-showcase')) {
        gsap.fromTo('.app-showcase', { rotationX: 8, y: 28 }, { rotationX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.showcase-stage', start: 'top 90%', end: 'center 48%', scrub: 1 } });
      }
    });
  }

  const search = document.querySelector('#docs-search');
  const panel = document.querySelector('#search-results');
  if (search && panel && window.OLAN_SEARCH) {
    const status = document.querySelector('#search-status');
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase();
      panel.replaceChildren();
      panel.hidden = !query;
      if (!query) {
        status.textContent = '';
        return;
      }
      const terms = query.split(/\s+/);
      const allMatches = window.OLAN_SEARCH
        .filter((item) => terms.every((term) => `${item.title} ${item.text}`.toLocaleLowerCase().includes(term)))
        .map((item) => ({ ...item, score: terms.reduce((score, term) => score + (item.title.toLocaleLowerCase().includes(term) ? 10 : 1), 0) }))
        .sort((a, b) => b.score - a.score);
      const matches = allMatches.slice(0, 12);
      status.textContent = matches.length ? `找到 ${allMatches.length} 个相关章节${allMatches.length > 12 ? '，显示最相关的 12 个' : ''}` : '没有找到相关内容，试试 Java、安装、账户或 AOT。';
      for (const item of matches) {
        const link = document.createElement('a');
        link.href = item.url;
        const title = document.createElement('strong');
        title.textContent = item.title;
        const excerpt = document.createElement('span');
        const index = item.text.toLocaleLowerCase().indexOf(terms[0]);
        excerpt.textContent = `${index > 20 ? '…' : ''}${item.text.slice(Math.max(0, index - 20), Math.max(0, index - 20) + 80)}…`;
        link.append(title, excerpt);
        panel.append(link);
      }
    });
    search.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        search.value = '';
        search.dispatchEvent(new Event('input'));
      }
    });
  }

  const headings = [...document.querySelectorAll('.doc-article h2[id], .doc-article h3[id]')];
  if (headings.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      document.querySelectorAll('.doc-toc a').forEach((link) => {
        if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-100px 0px -65% 0px' });
    headings.forEach((heading) => observer.observe(heading));
  }
})();
