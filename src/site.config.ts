/**
 * ---------------------------------------------------------------------------
 * SITE CONFIG — the single source of truth.
 * ---------------------------------------------------------------------------
 * Change copy, links, metadata, version stamps and placeholders here only.
 * Every component and route imports from this file.
 *
 * Convention: an empty `href` means "not provided yet" and the link is
 * omitted from the UI automatically, so nothing broken gets published.
 * Anything wrapped in [PLACEHOLDER: ...] is a real fact you still need to add.
 * ---------------------------------------------------------------------------
 */

export interface NavItem {
  label: string;
  href: string;
  key: string;
}

export interface Fact {
  label: string;
  value: string;
  placeholder?: boolean;
}

export interface WorkItem {
  index: string;
  title: string;
  kind: string;
  year: string;
  summary: string;
  stack: string[];
  href: string;
  placeholder?: boolean;
}

export interface ConsoleLine {
  text: string;
  tone?: 'plain' | 'dim' | 'signal';
}

export const site = {
  /* ---------------------------------------------------------------- identity */
  identity: {
    name: 'Abdul Haseeb',
    shortName: 'A. Haseeb',
    role: 'Systems & Cybersecurity (Defense) Programmer',
    status: 'Undergraduate Computer Science student',
    initials: 'AH'
  },

  /* ----------------------------------------------------------- build / stamps */
  build: {
    version: '1.0.0',
    codename: 'quiet-signal',
    date: '2026-11-20'
  },

  /* ------------------------------------------------------------------ metadata */
  meta: {
    title: 'Abdul Haseeb — Systems & Defense Programmer',
    description:
      'Portfolio of Abdul Haseeb, an undergraduate computer science student working in systems programming and defensive security.',
    keywords: [
      'systems programming',
      'defensive security',
      'Rust',
      'C',
      'Python',
      'computer science',
      'portfolio'
    ],
    locale: 'en_US',
    themeColor: '#0E1013',
    canonicalPath: '/'
  },

  /* -------------------------------------------------------------- navigation */
  nav: [
    { label: 'About', href: '/#about', key: 'a' },
    { label: 'Work', href: '/#work', key: 'w' },
    { label: 'Contact', href: '/#contact', key: 'c' }
  ] satisfies NavItem[],

  /* -------------------------------------------------------------------- links */
  // Fill these in one place. Empty strings are hidden everywhere.
  links: {
    github: 'https://github.com/PLACEHOLDER',
    gitlab: 'https://gitlab.com/PLACEHOLDER',
    instagram: 'https://instagram.com/PLACEHOLDER',
    discord: '',
    linkedin: '',
    email: 'mailto:PLACEHOLDER@example.com'
  },

  /* --------------------------------------------------------------------- hero */
  hero: {
    eyebrow: 'ABDUL HASEEB · SYSTEMS / CYBERSECURITY (DEFENSE)',
    display: ['I write software', 'that respects', 'the machine.'],
    lede:
      'Undergraduate computer science student. I work where abstraction thins out — memory, process boundaries, and the small gap between what code says and what it does.',
    primaryCta: { label: 'Start a conversation', href: '/#contact' },
    hint: 'or press  ⌘K  to navigate'
  },

  /* -------------------------------------------------------------------- about */
  about: {
    eyebrow: '01 / ABOUT',
    heading: 'I like the part most people never see.',
    paragraphs: [
      "I didn't arrive at programming through a career plan. I arrived by taking things apart and being irritated that I couldn't explain exactly what happened inside. That irritation never really left — it just got more precise.",
      'These days I spend most of my time at the seam between systems programming and defensive security. I want to understand a bug all the way down: the compiler decision, the allocator behaviour, the boundary that was assumed instead of checked. The further down the explanation goes, the more satisfied I am. Surface-level fixes have never interested me.',
      "I'm still an undergraduate, and I treat that as an advantage rather than a disclaimer. There is time to be rigorous, to read the manual, to write the small version again until it is obviously correct. I care about tools that stay out of the way, code that remains legible under pressure, and the quiet discipline of verifying what you think you know.",
      "If you want someone who will ask one more question about how it actually works, we will get along."
    ],
    languages: ['Rust', 'Python', 'C', 'C++', 'Lua', 'Bash', 'Assembly'],
    facts: [
      {
        label: 'Focus',
        value: '[PLACEHOLDER: e.g. memory safety, binary exploitation, network defense]',
        placeholder: true
      },
      {
        label: 'Studying',
        value: '[PLACEHOLDER: university / programme]',
        placeholder: true
      },
      {
        label: 'Based in',
        value: '[PLACEHOLDER: city, country]',
        placeholder: true
      },
      {
        label: 'Open to',
        value: '[PLACEHOLDER: internships, freelance, collaborations]',
        placeholder: true
      }
    ] satisfies Fact[]
  },

  /* --------------------------------------------------------------------- work */
  work: {
    eyebrow: '02 / SELECTED WORK',
    heading: 'A few things, deliberately understated.',
    note:
      'Details are intentionally sparse. These are placeholders — replace them with real work when it exists.',
    items: [
      {
        index: '01',
        title: '[PLACEHOLDER: project name]',
        kind: 'systems / rust',
        year: '20XX',
        summary:
          'One honest sentence about the problem and the part you personally owned.',
        stack: ['Rust', 'C', 'PLACEHOLDER'],
        href: '',
        placeholder: true
      },
      {
        index: '02',
        title: '[PLACEHOLDER: project name]',
        kind: 'defense / tooling',
        year: '20XX',
        summary:
          'What it observed, what it changed, and why the constraint mattered.',
        stack: ['Python', 'Bash', 'PLACEHOLDER'],
        href: '',
        placeholder: true
      },
      {
        index: '03',
        title: '[PLACEHOLDER: project name]',
        kind: 'low-level / experiment',
        year: '20XX',
        summary:
          'A small thing built to answer one specific question. That question goes here.',
        stack: ['C', 'Assembly', 'PLACEHOLDER'],
        href: '',
        placeholder: true
      }
    ] satisfies WorkItem[]
  },

  /* ------------------------------------------------------------------- notes */
  notes: {
    enabled: false,
    eyebrow: '03 / NOTES',
    heading: 'Writing, when there is something worth writing.',
    body:
      'This space is reserved. No posts are published yet — the structure is here so nothing has to be redesigned later.'
  },

  /* ----------------------------------------------------------------- contact */
  contact: {
    eyebrow: '04 / CONTACT',
    heading: 'Tell me what you are trying to understand.',
    lede:
      'A short note is enough. Tell me who you are, what the problem is, and what you have already ruled out.',
    response: '[PLACEHOLDER: typical reply time, e.g. within two days]',
    fields: {
      name: 'Name or organization',
      email: 'Email address',
      message: 'Message',
      website: 'Website'
    },
    placeholders: {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'A few sentences about the work…'
    },
    submit: 'Send message',
    submitting: 'Sending…',
    success: 'Received. I will get back to you.',
    failure: "That did not go through — your message is still here. Try again.",
    bot: 'Something looked off. Please try again in a moment.',
    rateLimited: 'Too many messages in a short span. Try again shortly.',
    validation: 'Check the highlighted fields.'
  },

  /* ------------------------------------------------------------------ footer */
  footer: {
    statement: 'Built to be read, not to be watched.',
    statusLabel: 'CURRENTLY',
    status:
      '[PLACEHOLDER: one line on what you are focused on right now — this is the rolling-release line]',
    statusUpdated: '2026-11-20',
    colophon: 'Colophon'
  },

  /* --------------------------------------------------------------- 404 page */
  notFound: {
    code: '404',
    title: 'address not mapped',
    message:
      'The route you asked for does not resolve to anything here. It may have moved, or it may never have existed.',
    cta: 'Return to the index'
  },

  /* ----------------------------------------------------- hidden / discoverable */
  secrets: {
    // base64 of: "the best defense is knowing exactly how it breaks"
    encoded:
      'dGhlIGJlc3QgZGVmZW5zZSBpcyBrbm93aW5nIGV4YWN0bHkgaG93IGl0IGJyZWFrcw==',
    hint: 'decode me',
    decodedTitle: 'a note left in the margin'
  },

  console: [
    { text: 'quiet-signal / build 1.0.0 (2026-11-20)', tone: 'signal' },
    { text: 'no trackers. no runtime framework. no photographs.', tone: 'dim' },
    { text: 'modal by habit. press ? if you are curious.', tone: 'plain' }
  ] satisfies ConsoleLine[],

  /* ------------------------------------------------------------ colophon page */
  colophon: {
    eyebrow: 'COLOPHON',
    title: 'How this is put together.',
    intro:
      'A short record of the decisions behind the interface. Nothing here is required to use the site.',
    rows: [
      {
        label: 'Type',
        value:
          'IBM Plex Mono for labels and code; Instrument Sans for everything people actually read.'
      },
      {
        label: 'Colour',
        value:
          'Blue-graphite ground, warm off-white text, one muted brass signal. No gradients, no glow.'
      },
      {
        label: 'Motion',
        value:
          'Short, purposeful transitions. Entirely disabled when reduced motion is requested.'
      },
      {
        label: 'Structure',
        value:
          'Static HTML and CSS. One small script handles navigation and the form. All content lives in one config file.'
      },
      {
        label: 'Build',
        value: '1.0.0 · quiet-signal · 2026-11-20'
      }
    ],
    note:
      'Everything is configurable. That is the whole point. If something feels deliberate, it was.'
  },

  /* ------------------------------------------------------------- privacy page */
  privacy: {
    eyebrow: 'PRIVACY',
    title: 'What happens when you send a message.',
    updated: '2026-11-20',
    sections: [
      {
        heading: 'What is collected',
        body:
          'Only what you type into the contact form: your name or organization, your email address, and your message. Your IP address is converted to a one-way keyed hash before it is ever written down; the raw address is not stored.'
      },
      {
        heading: 'Why it is collected',
        body:
          'To reply to you and to keep automated abuse out of the inbox. The hashed address is used solely to limit repeated submissions.'
      },
      {
        heading: 'Who receives it',
        body:
          'The message is stored in a private database and forwarded to the owner by email. No advertising network, analytics service, or third party receives it.'
      },
      {
        heading: 'Retention and your options',
        body:
          'Messages are kept only while they are useful. Ask for deletion at any time using the email address in security.txt and it will be removed.'
      },
      {
        heading: 'Cookies and tracking',
        body:
          'No analytics or tracking cookies are set. A local draft may be kept in your browser storage so a failed submission never loses your text; it stays on your device.'
      }
    ]
  }
};

export type SiteConfig = typeof site;
