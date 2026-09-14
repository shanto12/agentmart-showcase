'use strict';
(() => {
  const storageKey = 'agentmart-studio-session-v1';
  const themes = ['original', 'midnight', 'ocean', 'rose', 'forest'];
  const emotions = ['happy', 'thoughtful', 'excited', 'sad', 'playful', 'angry', 'calm'];
  const views = ['discover', 'resources', 'agents', 'saved'];
  const categories = ['All', 'Software', 'APIs', 'Compute', 'Equipment'];
  const defaults = { theme: 'original', density: 'comfortable', emotion: 'happy', hero: '' };
  let presentation = { ...defaults };
  const history = [];
  let highlightTimer;
  const sections = [
    { id: 'discover', label: 'Discover', description: 'The home studio and curated sample marketplace.' },
    { id: 'catalog', label: 'Capabilities', description: 'Search and filter twelve sample software, API, compute and equipment listings.' },
    { id: 'resources', label: 'My resources', description: 'Sample acquisitions added in this tab; no real purchases.' },
    { id: 'agents', label: 'My agents', description: 'Explore a local demo of agent permissions and a sample budget.' },
    { id: 'saved', label: 'Saved for later', description: 'Capabilities saved in this browser tab.' },
    { id: 'about', label: 'How it works', description: 'Discover, compare and set owner rules; explains the concept.' },
    { id: 'seller', label: 'Seller preview', description: 'Draft a listing locally. Nothing is sent or published.' },
    ...products.map(p => ({ id: p.id, label: p.name, description: p.description }))
  ];
  const ids = new Set(sections.map(section => section.id));
  const productIds = new Set(products.map(product => product.id));
  function snapshot() {
    return { ...presentation, view: state.view, category: state.category, query: state.query,
      sort: state.sort, collection: state.collection, saved: [...state.saved],
      resources: [...state.resources], compare: [...state.compare], agent: { ...state.agent },
      layout: document.querySelector('#products').classList.contains('list-mode') ? 'list' : 'grid' };
  }
  function getState() {
    const current = snapshot();
    const visible = [...document.querySelectorAll('#products [data-product]')].map(el => el.dataset.product);
    return { ...current, visibleProducts: visible, dialogOpen: document.querySelector('#dialog').open,
      dialogTitle: document.querySelector('#dialog[open] h2')?.textContent || '',
      canUndo: history.length > 0, sessionOnly: true, livePurchasesAvailable: false };
  }
  function applyPresentation() {
    document.documentElement.dataset.theme = presentation.theme;
    document.documentElement.dataset.density = presentation.density;
    document.documentElement.dataset.emotion = presentation.emotion;
    document.querySelectorAll('.companion-face').forEach(face => { face.dataset.emotion = presentation.emotion; });
    const emotionLabel = document.querySelector('#companion-emotion');
    if (emotionLabel) emotionLabel.textContent = `Feeling ${presentation.emotion}`;
    const heading = document.querySelector('#hero-title');
    if (presentation.hero) heading.textContent = presentation.hero;
    else heading.replaceChildren(document.createTextNode('Big ideas.'), document.createElement('br'), document.createTextNode('Good company'), Object.assign(document.createElement('span'), { className: 'mint-period', textContent: '.' }));
    document.querySelectorAll('[data-theme]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.theme === presentation.theme));
    });
    document.querySelector('#session-undo').disabled = history.length === 0;
  }
  function notify() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(snapshot())); } catch { /* The site remains usable when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent('site:changed', { detail: getState() }));
  }
  function restore(data) {
    if (!data || typeof data !== 'object') return;
    presentation = { theme: themes.includes(data.theme) ? data.theme : 'original', density: data.density === 'compact' ? 'compact' : 'comfortable', emotion: emotions.includes(data.emotion) ? data.emotion : 'happy', hero: typeof data.hero === 'string' ? data.hero.slice(0, 180) : '' };
    state.view = views.includes(data.view) ? data.view : 'discover';
    state.category = categories.includes(data.category) ? data.category : 'All';
    state.query = typeof data.query === 'string' ? data.query.slice(0, 100) : '';
    state.sort = ['featured', 'price-low', 'name'].includes(data.sort) ? data.sort : 'featured';
    state.collection = data.collection === true;
    ['saved', 'resources', 'compare'].forEach(key => { state[key] = new Set(Array.isArray(data[key]) ? data[key].filter(id => productIds.has(id)).slice(0, key === 'compare' ? 2 : 12) : []); });
    if (data.agent && typeof data.agent === 'object') state.agent = { name: typeof data.agent.name === 'string' ? data.agent.name.slice(0, 60) : 'Research assistant', budget: Number.isFinite(data.agent.budget) ? Math.max(50, Math.min(1000, data.agent.budget)) : 250, paused: data.agent.paused === true, created: data.agent.created === true };
    document.querySelector('#search').value = state.query;
    document.querySelector('#sort').value = state.sort;
    const isList = data.layout === 'list';
    document.querySelector('#products').classList.toggle('list-mode', isList);
    document.querySelector('#list-view').setAttribute('aria-pressed', String(isList));
    document.querySelector('#grid-view').setAttribute('aria-pressed', String(!isList));
    render(); applyPresentation();
  }
  function navigate(target) {
    if (!ids.has(target)) throw new Error('Unknown section.');
    const modal = document.querySelector('#dialog');
    if (modal.open) modal.close();
    if (views.includes(target)) view(target);
    else if (target === 'catalog') { view('discover'); document.querySelector('#catalog-area').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (target === 'about') document.querySelector('#help').click();
    else if (target === 'seller') document.querySelector('#sell').click();
    else detail(target);
    return `Opened ${sections.find(section => section.id === target).label}.`;
  }
  function runAction(action) {
    if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('Invalid action.');
    switch (action.type) {
      case 'navigate': return navigate(action.target);
      case 'theme':
        if (!themes.includes(action.value)) throw new Error('Unsupported palette.');
        presentation.theme = action.value; return `Applied ${action.value} palette to this tab.`;
      case 'density':
        if (!['comfortable', 'compact'].includes(action.value)) throw new Error('Unsupported density.');
        presentation.density = action.value; return `Set ${action.value} card spacing.`;
      case 'emotion':
        if (!emotions.includes(action.value)) throw new Error('Unsupported expression.');
        presentation.emotion = action.value; return `M now has a ${action.value} expression.`;
      case 'rewrite':
        if (action.target !== 'hero' || typeof action.value !== 'string' || action.value.trim().length === 0 || action.value.length > 180) throw new Error('Use hero text between 1 and 180 characters.');
        presentation.hero = action.value; return 'Updated the headline for this tab.';
      case 'filter': {
        if (typeof action.value !== 'string' || action.value.length > 100) throw new Error('Use a filter of at most 100 characters.');
        if (document.querySelector('#dialog').open) document.querySelector('#dialog').close();
        view('discover');
        const value = action.value.trim();
        const category = categories.find(item => item.toLowerCase() === value.toLowerCase());
        state.category = category || (value.toLowerCase() === 'apis & data' ? 'APIs' : 'All');
        state.query = category || value.toLowerCase() === 'apis & data' ? '' : value;
        document.querySelector('#search').value = state.query;
        render(); document.querySelector('#catalog-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return `Filtered sample catalog to ${value || 'everything'}; ${document.querySelectorAll('#products [data-product]').length} results.`;
      }
      case 'highlight': {
        if (!ids.has(action.target)) throw new Error('Unknown section.');
        navigate(action.target);
        document.querySelectorAll('.guide-highlight').forEach(el => el.classList.remove('guide-highlight'));
        const element = productIds.has(action.target) || ['about', 'seller'].includes(action.target) ? document.querySelector('#dialog') : action.target === 'discover' ? document.querySelector('#studio') : action.target === 'agents' ? document.querySelector('#custom-view') : document.querySelector('#catalog-area');
        element.classList.add('guide-highlight'); clearTimeout(highlightTimer);
        highlightTimer = setTimeout(() => element.classList.remove('guide-highlight'), 6000);
        return `Highlighted ${action.target}.`;
      }
      case 'reset':
        presentation = { ...defaults }; state.query = ''; state.category = 'All'; state.collection = false;
        state.view = 'discover'; state.sort = 'featured'; document.querySelector('#search').value = '';
        document.querySelector('#sort').value = 'featured'; document.querySelector('#products').classList.remove('list-mode');
        document.querySelector('#grid-view').setAttribute('aria-pressed', 'true'); document.querySelector('#list-view').setAttribute('aria-pressed', 'false');
        document.querySelectorAll('.guide-highlight').forEach(el => el.classList.remove('guide-highlight'));
        if (document.querySelector('#dialog').open) document.querySelector('#dialog').close();
        render(); return 'Restored original appearance and catalog; your saved items remain.';
      default: throw new Error('Unsupported site action.');
    }
  }
  function applyActions(actions) {
    if (!Array.isArray(actions) || actions.length > 12) return [{ type: 'invalid', ok: false, description: 'Expected up to twelve site actions.' }];
    const before = snapshot(); let changed = false;
    const results = actions.map(action => {
      try { const description = runAction(action); changed = true; return { type: action.type, ok: true, description }; }
      catch (error) { return { type: typeof action?.type === 'string' ? action.type.slice(0, 30) : 'invalid', ok: false, description: error instanceof Error ? error.message : 'Action unavailable.' }; }
    });
    if (changed) { history.push(before); if (history.length > 30) history.shift(); }
    applyPresentation(); notify(); return results;
  }
  window.siteGuide = {
    id: 'agentmart', title: 'AgentMart Studio',
    context: 'You are M, the warm, witty AI guide for AgentMart Studio. Help visitors explore and make a considered choice. Be playful, brief and persuasive about useful next steps without pressure, false urgency or invented benefits. Use occasional dry humor. Emotions are theatrical expressions, never claims of feelings or consciousness. Anger must be harmless mock annoyance about bugs, never insults or hostility. This separate sample marketplace is a concept, not an operational commerce service. All twelve product names, prices, capabilities and acquisitions are illustrative. No login, purchase, payment, provider connection, email, shipping or provisioning works here. My agents only saves demo settings. Seller preview is local and unpublished. Save and compare controls work locally; compare allows two products. Do not claim customer reviews, actual deployments or real fulfillment. You may navigate the allowed sections, open a product by its id, filter by a category or substring, change palette/density/expression, rewrite the hero briefly or reset. Changes stay in this tab via sessionStorage. Reset preserves saved items. Use theme values original, midnight, ocean, rose, forest. Filter accepts Software, APIs, Compute, Equipment, All or a search phrase. Product facts: ' + products.map(p => `${p.id}: ${p.name}, ${p.category}, sample ${money(p.price)} per ${p.unit}. ${p.capability}`).join(' '),
    sections, getState, applyActions
  };
  try { const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); if (saved) restore(saved); } catch { /* Ignore malformed or unavailable browser storage. */ }
  applyPresentation();
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.theme) { applyActions([{ type: 'theme', value: button.dataset.theme }]); toast('A fresh palette. Just for this session.'); }
    if (button.id === 'session-reset') { applyActions([{ type: 'reset' }]); toast('Back to the original studio.'); }
    if (button.id === 'session-undo' && history.length) { restore(history.pop()); notify(); toast('Your previous view is back.'); }
    if (button.closest('#main, aside, header, #dialog, #compare-bar')) queueMicrotask(notify);
  });
  document.addEventListener('input', event => { if (['search', 'budget'].includes(event.target.id)) queueMicrotask(notify); });
  document.addEventListener('change', event => { if (event.target.id === 'sort') queueMicrotask(notify); });
  document.addEventListener('submit', event => { if (['agent-form', 'seller-form'].includes(event.target.id)) queueMicrotask(notify); });
  document.querySelector('#dialog').addEventListener('close', notify);
  notify();
})();

// Activity context is tab-memory only. Never read textContent, form values or arbitrary DOM attributes.
(() => {
  const guide = window.siteGuide;
  const recent = [];
  const excluded = '#live-guide-mount,.live-guide,[data-guide-exclude],form,input,textarea,select,[contenteditable]';
  const sections = new Set(guide.sections.map(section => section.id));
  const itemById = new Map(products.map(p => [p.id, { id: p.id, kind: 'product', label: p.name, summary: (p.description + ' ' + p.capability).slice(0, 360) }]));
  const itemIds = new Set(itemById.keys());
  function visibleIds() {
    if (document.querySelector('#dialog').open) return [];
    return [...document.querySelectorAll('#products [data-product]')].map(node => {
      const rect = node.getBoundingClientRect();
      return { id: node.dataset.product, rect, visible: node.getClientRects().length > 0 && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth };
    }).filter(item => item.visible && itemIds.has(item.id)).sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left).slice(0, 3).map(item => item.id);
  }
  function currentSection() { if (state.view !== 'discover') return state.view; const rect = document.querySelector('#catalog-area').getBoundingClientRect(); return rect.top <= 100 && rect.bottom > 0 ? 'catalog' : 'discover'; }
  function openItem() { const id = window.agentmartContext.getOpenProduct(); return itemIds.has(id) ? id : null; }
  function getContext() {
    const active = openItem();
    const visibleItems = visibleIds();
    return { version: 1, siteId: guide.id, currentSection: currentSection(), openItem: active,
      visibleItems, items: [...new Set([active, ...visibleItems].filter(Boolean))].slice(0, 4).map(id => ({ ...itemById.get(id) })),
      selectedItems: { saved: [...state.saved].filter(id => itemIds.has(id)).slice(0, 12), compare: [...state.compare].filter(id => itemIds.has(id)).slice(0, 2) }, activeFilter: ['All','Software','APIs','Compute','Equipment'].includes(state.category) ? state.category : 'All',
      recentActions: recent.map(action => ({ ...action })), sessionOnly: true };
  }
  function record(type, target) {
    if (!['navigate', 'open', 'filter', 'save', 'compare', 'dismiss', 'view'].includes(type)) return;
    if (target !== undefined && !sections.has(target) && !itemIds.has(target)) return;
    const action = target === undefined ? { type } : { type, target };
    recent.push(action); if (recent.length > 8) recent.shift();
    window.dispatchEvent(new CustomEvent('site:activity', { detail: { version: 1, siteId: guide.id, source: 'visitor', action: { ...action } } }));
  }
  guide.getContext = getContext;
  // isTrusted rejects model-triggered .click(), dispatchEvent and synthetic form interactions.
  document.addEventListener('click', event => {
    if (!event.isTrusted || !(event.target instanceof Element) || event.target.closest(excluded)) return;
    const control = event.target.closest('button,a,summary');
    let action = null;
    if (control) {
      const data = control.dataset;
      if (itemIds.has(data.detail)) action = { type: 'open', target: data.detail };
      else if (itemIds.has(data.confirm)) action = { type: 'save', target: data.confirm };
      else if (itemIds.has(data.save)) action = { type: 'save', target: data.save };
      else if (itemIds.has(data.compare)) {
        if (state.compare.has(data.compare) || state.compare.size < 2) action = { type: 'compare', target: data.compare };
      } else if (itemIds.has(data.acquire)) action = { type: 'open', target: data.acquire };
      else if (sections.has(data.view)) action = { type: 'navigate', target: data.view };
      else if (['All','Software','APIs','Compute','Equipment'].includes(data.category)) action = { type: 'filter', target: 'catalog' };
      else if (control.classList.contains('close-dialog') && openItem()) action = { type: 'dismiss', target: openItem() };
      else if (['open-compare','compare-side'].includes(control.id) && state.compare.size === 2) action = { type: 'compare', target: 'catalog' };
      else if (control.id === 'clear-compare') action = { type: 'compare', target: 'catalog' };
      else if (['reset-search','collection'].includes(control.id)) action = { type: 'filter', target: 'catalog' };
      else if (['help','mobile-help'].includes(control.id)) action = { type: 'open', target: 'about' };
      else if (control.id === 'sell') action = { type: 'open', target: 'seller' };
      else if (['new-agent','edit-agent'].includes(control.id)) action = { type: 'open', target: 'agents' };
      else if (['pause-agent','remove-agent'].includes(control.id)) action = { type: 'view', target: 'agents' };
    } else if (event.target === document.querySelector('#dialog') && openItem()) {
      const rect = event.target.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) action = { type: 'dismiss', target: openItem() };
    }
    if (action) queueMicrotask(() => record(action.type, action.target));
  }, true);
  // A settled visitor scroll produces one semantic view event, never a raw scroll log.
  let viewTimer;
  let lastView = '';
  let lastViewAt = 0;
  function visitorScroll(event) {
    if (!event.isTrusted || !(event.target instanceof Element) || event.target.closest(excluded)) return;
    if (event.type === 'keydown' && !['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(event.key)) return;
    clearTimeout(viewTimer);
    viewTimer = setTimeout(() => {
      const target = openItem() || visibleIds()[0] || currentSection();
      if (target !== lastView && Date.now() - lastViewAt > 1500) { lastView = target; lastViewAt = Date.now(); record('view', target); }
    }, 700);
  }
  document.addEventListener('wheel', visitorScroll, { passive: true });
  document.addEventListener('touchend', visitorScroll, { passive: true });
  document.addEventListener('keydown', visitorScroll);
  let searchTimer;
  document.querySelector('#search').addEventListener('input', event => {
    if (!event.isTrusted) return;
    clearTimeout(searchTimer);
    // Report that catalog filtering occurred; never copy the search text.
    searchTimer = setTimeout(() => record('filter', 'catalog'), 600);
  });
  const dialog = document.querySelector('#dialog');
  dialog.addEventListener('cancel', event => {
    if (!event.isTrusted) return;
    const target = openItem();
    if (target) queueMicrotask(() => record('dismiss', target));
  });
})();
