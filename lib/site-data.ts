export type HubKey = 'learn' | 'build' | 'operate' | 'security';

export type CardItem = {
  title: string;
  description: string;
  icon: string;
  meta?: string;
  href?: string;
  badge?: string;
};

export const primaryNav = [
  { label: 'Learn', href: '/learn' },
  { label: 'Build', href: '/build' },
  { label: 'Operate', href: '/operate' },
  { label: 'Security', href: '/security' },
  { label: 'Ecosystem', href: '/ecosystem' },
  { label: 'Spec Watch', href: '/spec-watch' },
];

export const hubs: Record<
  HubKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    diagram: 'radial' | 'code' | 'gateway' | 'trust';
    sectionTitle: string;
    cards: CardItem[];
    pathTitle: string;
    path: CardItem[];
  }
> = {
  learn: {
    eyebrow: 'Learn',
    title: 'Learn MCP',
    description:
      'Go from fundamentals to production-ready architecture. Structured paths, deep concepts, and practical examples help you master Model Context Protocol.',
    primaryAction: 'Start learning',
    secondaryAction: 'View learning paths',
    diagram: 'radial',
    sectionTitle: 'Core concepts',
    cards: [
      {
        title: 'Architecture',
        description: 'How MCP components fit together.',
        icon: 'network',
      },
      {
        title: 'Primitives',
        description: 'Resources, tools, and prompts.',
        icon: 'blocks',
      },
      {
        title: 'Transports',
        description: 'stdio, Streamable HTTP, and more.',
        icon: 'route',
      },
      {
        title: 'Lifecycle',
        description: 'From initialization to shutdown.',
        icon: 'cycle',
      },
      {
        title: 'Capabilities',
        description: 'Negotiation, discovery, and support.',
        icon: 'spark',
      },
      {
        title: 'Error handling',
        description: 'Failures, codes, and recovery.',
        icon: 'alert',
      },
    ],
    pathTitle: 'Learning paths',
    path: [
      {
        title: 'MCP Fundamentals',
        description: 'Understand the protocol and its core concepts.',
        icon: 'book',
        meta: '8 lessons · 2h 30m',
        badge: 'Beginner',
      },
      {
        title: 'Build an MCP Server',
        description: 'Build servers, tools, resources, and prompts.',
        icon: 'server',
        meta: '12 lessons · 4h 15m',
        badge: 'Intermediate',
      },
      {
        title: 'MCP in Production',
        description: 'Deploy, secure, and operate MCP systems at scale.',
        icon: 'rocket',
        meta: '10 lessons · 3h 45m',
        badge: 'Advanced',
      },
    ],
  },
  build: {
    eyebrow: 'Build',
    title: 'Build with MCP',
    description:
      'Build servers, clients, agents, and tools. Integrate with any data or capability and expose it through MCP.',
    primaryAction: 'Start building',
    secondaryAction: 'View tutorials',
    diagram: 'code',
    sectionTitle: 'What do you want to build?',
    cards: [
      {
        title: 'Build a server',
        description: 'Expose capabilities through MCP.',
        icon: 'server',
      },
      {
        title: 'Build a client',
        description: 'Connect to MCP servers.',
        icon: 'monitor',
      },
      {
        title: 'Add tools',
        description: 'Create tools that models can use.',
        icon: 'wrench',
      },
      {
        title: 'Add resources',
        description: 'Expose data and context.',
        icon: 'database',
      },
      {
        title: 'Add prompts',
        description: 'Create reusable prompt templates.',
        icon: 'message',
      },
      {
        title: 'Use SDKs',
        description: 'Official SDKs and community libraries.',
        icon: 'box',
      },
      {
        title: 'Test and debug',
        description: 'Inspect, test, and debug MCP apps.',
        icon: 'bug',
      },
      {
        title: 'Integrate APIs',
        description: 'Connect external APIs and services.',
        icon: 'plug',
      },
    ],
    pathTitle: 'Featured tutorials',
    path: [
      {
        title: 'Build your first MCP server',
        description:
          'A practical Python server with one tool and one resource.',
        icon: 'code',
        meta: '25 min · Beginner',
      },
      {
        title: 'Model a reliable tool surface',
        description: 'Descriptions, schemas, errors, and safe defaults.',
        icon: 'wrench',
        meta: '30 min · Intermediate',
      },
      {
        title: 'Connect a remote server',
        description: 'Configure transport and authentication boundaries.',
        icon: 'cloud',
        meta: '35 min · Intermediate',
      },
    ],
  },
  operate: {
    eyebrow: 'Operate',
    title: 'Operate with MCP',
    description:
      'Deploy, connect, protect, and observe MCP systems in production. Design for scale, reliability, and real-world performance.',
    primaryAction: 'Start operating',
    secondaryAction: 'View deployment guide',
    diagram: 'gateway',
    sectionTitle: 'Operate by capability',
    cards: [
      {
        title: 'Deployment',
        description: 'Package and deploy MCP servers anywhere.',
        icon: 'package',
      },
      {
        title: 'Gateways',
        description: 'Route, secure, and control traffic.',
        icon: 'network',
      },
      {
        title: 'Registries',
        description: 'Discover and publish servers and metadata.',
        icon: 'box',
      },
      {
        title: 'Observability',
        description: 'Logs, metrics, traces, and health.',
        icon: 'chart',
      },
      {
        title: 'Scaling',
        description: 'Scale MCP systems efficiently.',
        icon: 'scale',
      },
      {
        title: 'Reliability',
        description: 'Retries, timeouts, and resilience.',
        icon: 'shield',
      },
      {
        title: 'Configuration',
        description: 'Environments, secrets, and settings.',
        icon: 'settings',
      },
      {
        title: 'Governance',
        description: 'Policies, access, and compliance.',
        icon: 'landmark',
      },
    ],
    pathTitle: 'Production guides',
    path: [
      {
        title: 'How MCP gateways work',
        description: 'Routing, authorization, and observability boundaries.',
        icon: 'network',
        meta: '25 min · Intermediate',
      },
      {
        title: 'Deploy a remote MCP server',
        description: 'A production deployment decision guide.',
        icon: 'cloud',
        meta: '30 min · Intermediate',
      },
      {
        title: 'Observability for MCP systems',
        description: 'The signals that make failures diagnosable.',
        icon: 'chart',
        meta: '22 min · Intermediate',
      },
    ],
  },
  security: {
    eyebrow: 'Security',
    title: 'Secure MCP systems',
    description:
      'Understand authorization, identity, consent, permissions, and enterprise controls across the Model Context Protocol.',
    primaryAction: 'Explore security',
    secondaryAction: 'View security guides',
    diagram: 'trust',
    sectionTitle: 'Security by capability',
    cards: [
      {
        title: 'Authorization',
        description: 'Control who can access what.',
        icon: 'shield',
      },
      {
        title: 'Identity',
        description: 'Manage identities and claims.',
        icon: 'users',
      },
      {
        title: 'OAuth',
        description: 'Implement and validate OAuth flows.',
        icon: 'key',
      },
      {
        title: 'Consent',
        description: 'Capture and manage user consent.',
        icon: 'check',
      },
      {
        title: 'Permissions',
        description: 'Define and enforce least privilege.',
        icon: 'lock',
      },
      {
        title: 'Secrets',
        description: 'Store, rotate, and protect credentials.',
        icon: 'key',
      },
      {
        title: 'Threat modelling',
        description: 'Identify risks and attack paths.',
        icon: 'alert',
      },
      {
        title: 'Enterprise controls',
        description: 'Policy, logging, and audits.',
        icon: 'landmark',
      },
    ],
    pathTitle: 'Start with the essentials',
    path: [
      {
        title: 'Understand the trust model',
        description: 'Know where authority and data cross boundaries.',
        icon: 'shield',
        meta: '8 min · Beginner',
      },
      {
        title: 'Configure authorization',
        description: 'Set up explicit grants and protected resources.',
        icon: 'key',
        meta: '15 min · Intermediate',
      },
      {
        title: 'Enforce least privilege',
        description: 'Apply fine-grained permissions and reduce access scope.',
        icon: 'lock',
        meta: '12 min · Intermediate',
      },
      {
        title: 'Review threat scenarios',
        description: 'Explore common threats and mitigations.',
        icon: 'alert',
        meta: '20 min · Advanced',
      },
    ],
  },
};

export const toolFixtures: CardItem[] = [
  {
    title: 'Authorization Flow Explorer',
    description:
      'Inspect the roles, grants, and boundaries in an MCP authorization flow.',
    icon: 'shield',
    badge: 'Planned',
  },
  {
    title: 'Architecture Visualizer',
    description: 'Map hosts, clients, servers, and external systems.',
    icon: 'network',
    badge: 'Planned',
  },
  {
    title: 'Tool Description Linter',
    description: 'Review tool names, descriptions, inputs, and safety cues.',
    icon: 'check',
    badge: 'Planned',
  },
  {
    title: 'Transport Comparison',
    description: 'Compare transport constraints side by side.',
    icon: 'route',
    badge: 'Planned',
  },
];
