/**
 * runtime.ts — progressive enhancement only.
 * Nothing on this site requires JS to read. JS adds: scroll reveals, a command
 * palette, modal-editor-style jumps, a decoded note, and dynamic date stamps.
 */
import { site } from '../site.config';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';

/* ------------------------------------------------------------------ console */

{
  const tone: Record<string, string> = {
    plain: 'color: inherit',
    dim: 'color: #818A96',
    signal: 'color: #C8A96A; font-weight: 600'
  };
  console.log(
    '%c quiet-signal / v' + site.build.version + ' ',
    'background:#C8A96A;color:#0E1013;font-family:monospace;font-weight:600'
  );
  for (const line of site.console) {
    console.log('%c' + line.text, tone[line.tone ?? 'plain']);
  }
}

/* ------------------------------------------------------------------ reveals */

if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  for (const el of document.querySelectorAll<HTMLElement>('.reveal')) {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
      el.classList.add('is-pending');
    }
    observer.observe(el);
  }
}

/* ------------------------------------------------------------- relative date */

{
  for (const el of document.querySelectorAll<HTMLElement>('[data-relative-date]')) {
    const iso = el.dataset.date;
    if (!iso) continue;
    const then = new Date(`${iso}T00:00:00Z`).getTime();
    const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
    let label: string;
    if (days === 0) label = 'last touched today';
    else if (days === 1) label = 'last touched yesterday';
    else if (days < 30) label = `last touched ${days} days ago`;
    else if (days < 365) {
      const months = Math.floor(days / 30);
      label = `last touched ${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(days / 365);
      label = `last touched ${years} year${years === 1 ? '' : 's'} ago`;
    }
    el.textContent = label;
  }
}

/* ------------------------------------------------------------- hidden note */

let lastFocus: HTMLElement | null = null;
const secretPanel = document.querySelector<HTMLElement>('[data-secret-panel]');
const secretText = document.querySelector<HTMLElement>('[data-secret-text]');

function openSecret(): void {
  if (!secretPanel || !secretText) return;
  lastFocus = document.activeElement as HTMLElement | null;
  const bytes = Uint8Array.from(atob(site.secrets.encoded), (c) => c.charCodeAt(0));
  secretText.textContent = new TextDecoder().decode(bytes);
  secretPanel.hidden = false;
  secretPanel.querySelector<HTMLElement>('[data-secret-close]')?.focus();
}

function closeSecret(): void {
  if (!secretPanel || secretPanel.hidden) return;
  secretPanel.hidden = true;
  lastFocus?.focus();
}

document.querySelector('[data-secret-open]')?.addEventListener('click', openSecret);
document
  .querySelector('[data-secret-close]')
  ?.addEventListener('click', closeSecret);
secretPanel?.addEventListener('click', (event) => {
  if (event.target === secretPanel) closeSecret();
});

/* --------------------------------------------------------------- navigation */

function navigate(href: string): void {
  if (href.startsWith('/#')) {
    const id = href.slice(2);
    document.getElementById(id)?.scrollIntoView({ behavior });
    history.replaceState(null, '', `#${id}`);
  } else if (href === '/') {
    window.scrollTo({ top: 0, behavior });
    history.replaceState(null, '', '/');
  } else {
    window.location.assign(href);
  }
}

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        for (const link of document.querySelectorAll<HTMLAnchorElement>('.nav-link')) {
          const active = link.getAttribute('href') === `/#${id}`;
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  for (const id of ['top', 'about', 'work', 'contact']) {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  }
}

/* -------------------------------------------------------------- shortcuts UI */

const shortcutsPanel = document.querySelector<HTMLElement>('[data-shortcuts]');

function openShortcuts(): void {
  if (!shortcutsPanel) return;
  lastFocus = document.activeElement as HTMLElement | null;
  shortcutsPanel.hidden = false;
  shortcutsPanel.querySelector<HTMLElement>('[data-shortcuts-close]')?.focus();
}

function closeShortcuts(): void {
  if (!shortcutsPanel || shortcutsPanel.hidden) return;
  shortcutsPanel.hidden = true;
  lastFocus?.focus();
}

function toggleShortcuts(): void {
  if (shortcutsPanel?.hidden) openShortcuts();
  else closeShortcuts();
}

document
  .querySelectorAll('[data-shortcuts-close]')
  .forEach((el) => el.addEventListener('click', closeShortcuts));
shortcutsPanel?.addEventListener('click', (event) => {
  if (event.target === shortcutsPanel) closeShortcuts();
});

/* ----------------------------------------------------------- command palette */

interface Command {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

const commands: Command[] = [
  ...site.nav.map((item) => ({
    id: `jump-${item.key}`,
    label: `Go to ${item.label}`,
    hint: `g ${item.key}`,
    run: () => navigate(item.href)
  })),
  {
    id: 'top',
    label: 'Go to top',
    hint: 'g g',
    run: () => navigate('/')
  },
  {
    id: 'bottom',
    label: 'Go to bottom',
    hint: 'G',
    run: () => window.scrollTo({ top: document.body.scrollHeight, behavior })
  },
  {
    id: 'colophon',
    label: 'Open colophon',
    hint: '',
    run: () => window.location.assign('/colophon')
  },
  {
    id: 'privacy',
    label: 'Open privacy note',
    hint: '',
    run: () => window.location.assign('/privacy')
  },
  {
    id: 'email',
    label: 'Copy email address',
    hint: '',
    run: () => {
      const address = site.links.email.replace(/^mailto:/, '');
      void navigator.clipboard?.writeText(address);
    }
  },
  {
    id: 'secret',
    label: 'Read the margin note',
    hint: '',
    run: openSecret
  }
];

const palette = document.querySelector<HTMLElement>('[data-palette]');
const paletteInput = document.querySelector<HTMLInputElement>('[data-palette-input]');
const paletteList = document.querySelector<HTMLElement>('[data-palette-list]');
let visible: Command[] = [];
let activeIndex = 0;

function renderPalette(): void {
  if (!paletteList) return;
  paletteList.replaceChildren();

  visible.forEach((command, index) => {
    const item = document.createElement('li');
    item.className = 'palette-item';
    item.id = `palette-option-${command.id}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(index === activeIndex));
    item.dataset.index = String(index);

    const label = document.createElement('span');
    label.textContent = command.label;

    const hint = document.createElement('span');
    hint.className = 'palette-item-hint mono';
    hint.textContent = command.hint;

    item.append(label, hint);
    item.addEventListener('click', () => execute(index));
    paletteList.append(item);
  });

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'palette-empty mono';
    empty.textContent = 'no matching command';
    paletteList.append(empty);
  }

  paletteInput?.setAttribute(
    'aria-activedescendant',
    visible.length ? `palette-option-${visible[activeIndex].id}` : ''
  );
}

function filterPalette(query: string): void {
  const needle = query.trim().toLowerCase();
  visible = commands.filter(
    (command) =>
      command.label.toLowerCase().includes(needle) ||
      command.hint.toLowerCase().includes(needle)
  );
  activeIndex = 0;
  renderPalette();
}

function moveActive(delta: number): void {
  if (visible.length === 0) return;
  activeIndex = (activeIndex + delta + visible.length) % visible.length;
  renderPalette();
}

function execute(index: number): void {
  const command = visible[index];
  if (!command) return;
  closePalette();
  command.run();
}

function openPalette(): void {
  if (!palette) return;
  lastFocus = document.activeElement as HTMLElement | null;
  palette.hidden = false;
  if (paletteInput) {
    paletteInput.value = '';
    paletteInput.focus();
  }
  filterPalette('');
}

function closePalette(): void {
  if (!palette || palette.hidden) return;
  palette.hidden = true;
  lastFocus?.focus();
}

document
  .querySelectorAll('[data-palette-open]')
  .forEach((el) => el.addEventListener('click', openPalette));
document
  .querySelectorAll('[data-palette-close]')
  .forEach((el) => el.addEventListener('click', closePalette));

paletteInput?.addEventListener('input', () => filterPalette(paletteInput.value));
paletteInput?.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'j':
      event.preventDefault();
      moveActive(1);
      break;
    case 'ArrowUp':
    case 'k':
      event.preventDefault();
      moveActive(-1);
      break;
    case 'Enter':
      event.preventDefault();
      execute(activeIndex);
      break;
  }
});

/* ----------------------------------------------------------- global keymap */

let gArmed = false;
let gTimer = 0;

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  const typing = !!target?.matches('input, textarea, [contenteditable="true"]');

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (palette?.hidden) openPalette();
    else closePalette();
    return;
  }

  if (event.key === 'Escape') {
    closePalette();
    closeSecret();
    closeShortcuts();
    return;
  }

  if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === '?') {
    event.preventDefault();
    toggleShortcuts();
    return;
  }

  if (event.key === 'G') {
    event.preventDefault();
    window.scrollTo({ top: document.body.scrollHeight, behavior });
    return;
  }

  if (event.key.toLowerCase() === 'g' && !gArmed) {
    gArmed = true;
    window.clearTimeout(gTimer);
    gTimer = window.setTimeout(() => (gArmed = false), 900);
    return;
  }

  if (gArmed) {
    gArmed = false;
    window.clearTimeout(gTimer);
    const key = event.key.toLowerCase();
    if (key === 'g') {
      event.preventDefault();
      navigate('/');
      return;
    }
    const link = document.querySelector<HTMLAnchorElement>(`[data-jump="${key}"]`);
    if (link) {
      event.preventDefault();
      const href = link.getAttribute('href');
      if (href) navigate(href);
    }
  }
});
