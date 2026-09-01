export type GlossaryTerm = {
  term: string;
  definition: string;
  category: 'Protocol' | 'Primitives' | 'Transport' | 'Security';
};

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: 'Authorization',
    definition:
      'The process of determining what actions a client or user is allowed to perform.',
    category: 'Security',
  },
  {
    term: 'Capability',
    definition:
      'A feature or function that an MCP participant can support or negotiate.',
    category: 'Protocol',
  },
  {
    term: 'Client',
    definition:
      'A protocol participant inside a host that connects to one MCP server.',
    category: 'Protocol',
  },
  {
    term: 'Elicitation',
    definition:
      'A server-initiated request for additional information from a user through a client.',
    category: 'Primitives',
  },
  {
    term: 'Host',
    definition:
      'The application environment that coordinates one or more MCP clients.',
    category: 'Protocol',
  },
  {
    term: 'Resource',
    definition: 'Contextual data that a server exposes for clients to read.',
    category: 'Primitives',
  },
  {
    term: 'Tool',
    definition:
      'An operation exposed by a server that a model can invoke through a client.',
    category: 'Primitives',
  },
  {
    term: 'Transport',
    definition: 'The communication mechanism that carries MCP messages.',
    category: 'Transport',
  },
];
