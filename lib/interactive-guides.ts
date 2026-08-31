import { z } from 'zod';

export const interactiveGuideIds = ['building-your-first-mcp-server'] as const;

export type InteractiveGuideId = (typeof interactiveGuideIds)[number];

export const interactiveGuideScenes = [
  'create-server',
  'add-tools',
  'add-resources',
  'add-prompts',
  'connect-client',
  'test-server',
  'completion',
] as const;

export type InteractiveGuideScene = (typeof interactiveGuideScenes)[number];
export type CapabilityKind = 'tool' | 'resource' | 'prompt';
export type FieldType = 'string' | 'number' | 'boolean';

export type CapabilityField = {
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  enumValues?: string[];
};

export type CapabilityDefinition = {
  id: string;
  kind: CapabilityKind;
  name: string;
  title: string;
  description: string;
  fields: CapabilityField[];
  uri?: string;
  mimeType?: string;
  template?: string;
};

export type ServerConfiguration = {
  name: string;
  version: string;
  created: boolean;
  tools: CapabilityDefinition[];
  resources: CapabilityDefinition[];
  prompts: CapabilityDefinition[];
};

export type ProtocolEvent = {
  id: string;
  sequence: number;
  label: string;
  method: string;
  direction: 'client-to-server' | 'server-to-client';
  status: 'request' | 'response' | 'error';
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  durationMs: number;
};

export type GuideObjective = {
  stepId: string;
  label: string;
  complete: boolean;
};

export type InteractiveGuideStateV1 = {
  version: 1;
  scenarioRevision: 1;
  server: ServerConfiguration;
  clientConnected: boolean;
  protocolEvents: ProtocolEvent[];
  selectedEventId?: string;
  lastResult?: Record<string, unknown>;
  finished: boolean;
};

export type InteractiveGuideDefinition = {
  id: InteractiveGuideId;
  title: string;
  specVersion: '2026-07-28';
  autoCompletedStepIds: string[];
  capabilities: CapabilityDefinition[];
};

export type InteractiveGuideAction =
  | { type: 'hydrate'; state: InteractiveGuideStateV1 }
  | { type: 'create-server'; name: string }
  | { type: 'upsert-capability'; capability: CapabilityDefinition }
  | { type: 'remove-capability'; kind: CapabilityKind; id: string }
  | { type: 'connect-client' }
  | { type: 'run-tool'; toolName: string; location: string; unit: string }
  | { type: 'read-resource'; resourceName: string }
  | { type: 'get-prompt'; promptName: string }
  | { type: 'select-event'; eventId: string }
  | { type: 'finish' }
  | { type: 'reset' };

const identifier = /^[a-z][a-z0-9_]*$/;
const serverName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const capabilityFieldSchema = z.object({
  name: z
    .string()
    .regex(identifier, 'Use lowercase letters, numbers, and underscores'),
  type: z.enum(['string', 'number', 'boolean']),
  description: z.string().min(8, 'Add a useful field description'),
  required: z.boolean(),
  enumValues: z.array(z.string().min(1)).optional(),
});

export const capabilitySchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['tool', 'resource', 'prompt']),
    name: z
      .string()
      .regex(identifier, 'Use lowercase letters, numbers, and underscores'),
    title: z.string().min(3, 'Add a short title'),
    description: z.string().min(12, 'Add a useful description'),
    fields: z.array(capabilityFieldSchema),
    uri: z.string().optional(),
    mimeType: z.string().optional(),
    template: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'resource') {
      if (!value.uri || !/^[-a-z][a-z0-9+.-]*:\/\/.+/i.test(value.uri)) {
        ctx.addIssue({
          code: 'custom',
          path: ['uri'],
          message: 'Use a complete resource URI such as weather://cities',
        });
      }
      if (!value.mimeType?.includes('/')) {
        ctx.addIssue({
          code: 'custom',
          path: ['mimeType'],
          message: 'Use a MIME type such as application/json',
        });
      }
    }
    if (value.kind === 'prompt' && !value.template?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['template'],
        message: 'Add prompt text',
      });
    }
    const names = new Set<string>();
    value.fields.forEach((field, index) => {
      if (names.has(field.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields', index, 'name'],
          message: 'Field names must be unique',
        });
      }
      names.add(field.name);
    });
  });

const protocolEventSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  label: z.string().min(1),
  method: z.string().min(1),
  direction: z.enum(['client-to-server', 'server-to-client']),
  status: z.enum(['request', 'response', 'error']),
  request: z.record(z.string(), z.unknown()),
  response: z.record(z.string(), z.unknown()),
  durationMs: z.number().nonnegative(),
});

const interactiveGuideStateV1Schema = z.object({
  version: z.literal(1),
  scenarioRevision: z.literal(1),
  server: z.object({
    name: z.string().regex(serverName),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    created: z.boolean(),
    tools: z.array(capabilitySchema),
    resources: z.array(capabilitySchema),
    prompts: z.array(capabilitySchema),
  }),
  clientConnected: z.boolean(),
  protocolEvents: z.array(protocolEventSchema),
  selectedEventId: z.string().min(1).optional(),
  lastResult: z.record(z.string(), z.unknown()).optional(),
  finished: z.boolean(),
});

const weatherCapabilities: CapabilityDefinition[] = [
  {
    id: 'get-weather',
    kind: 'tool',
    name: 'get_weather',
    title: 'Get current weather',
    description: 'Get current weather for a location.',
    fields: [
      {
        name: 'location',
        type: 'string',
        description: 'City name or coordinates',
        required: true,
      },
      {
        name: 'unit',
        type: 'string',
        description: 'Temperature unit',
        required: false,
        enumValues: ['celsius', 'fahrenheit'],
      },
    ],
  },
  {
    id: 'get-forecast',
    kind: 'tool',
    name: 'get_forecast',
    title: 'Get 7-day forecast',
    description: 'Get a seven-day forecast for a location.',
    fields: [
      {
        name: 'location',
        type: 'string',
        description: 'City name or coordinates',
        required: true,
      },
    ],
  },
  {
    id: 'search-locations',
    kind: 'tool',
    name: 'search_locations',
    title: 'Search locations',
    description: 'Search for supported places and coordinates.',
    fields: [
      {
        name: 'query',
        type: 'string',
        description: 'Place name to search for',
        required: true,
      },
    ],
  },
  {
    id: 'supported-cities',
    kind: 'resource',
    name: 'supported_cities',
    title: 'Supported cities',
    description: 'List of supported cities and coordinates.',
    fields: [],
    uri: 'weather://cities',
    mimeType: 'application/json',
  },
  {
    id: 'station-metadata',
    kind: 'resource',
    name: 'station_metadata',
    title: 'Weather station metadata',
    description: 'Metadata for the weather stations used by this server.',
    fields: [],
    uri: 'weather://stations',
    mimeType: 'application/json',
  },
  {
    id: 'api-usage-guide',
    kind: 'resource',
    name: 'api_usage_guide',
    title: 'API usage guide',
    description: 'Instructions and limits for the underlying weather API.',
    fields: [],
    uri: 'weather://usage-guide',
    mimeType: 'text/markdown',
  },
  {
    id: 'plan-for-weather',
    kind: 'prompt',
    name: 'plan_for_weather',
    title: 'Plan for weather',
    description: 'Suggest what to wear or plan based on the forecast.',
    fields: [
      {
        name: 'city',
        type: 'string',
        description: 'City to plan for',
        required: true,
      },
      {
        name: 'day',
        type: 'string',
        description: 'Day of the forecast',
        required: true,
      },
    ],
    template:
      'Given the forecast for {city} on {day}, suggest what to wear and any preparations to make.',
  },
  {
    id: 'compare-weather',
    kind: 'prompt',
    name: 'compare_weather',
    title: 'Compare weather between cities',
    description: 'Compare forecasts and conditions across two cities.',
    fields: [
      {
        name: 'first_city',
        type: 'string',
        description: 'First city to compare',
        required: true,
      },
      {
        name: 'second_city',
        type: 'string',
        description: 'Second city to compare',
        required: true,
      },
    ],
    template:
      'Compare the weather in {first_city} and {second_city}. Explain the practical difference.',
  },
  {
    id: 'what-to-wear',
    kind: 'prompt',
    name: 'what_should_i_wear',
    title: 'What should I wear today?',
    description: 'Suggest clothing based on current conditions.',
    fields: [
      {
        name: 'city',
        type: 'string',
        description: 'City to dress for',
        required: true,
      },
    ],
    template:
      'Suggest practical clothing for today in {city}, based on the available forecast.',
  },
];

export const buildingFirstServerDefinition: InteractiveGuideDefinition = {
  id: 'building-your-first-mcp-server',
  title: 'Building Your First MCP Server',
  specVersion: '2026-07-28',
  autoCompletedStepIds: [
    'create-your-server',
    'add-tools',
    'add-resources',
    'add-prompts',
    'connect-the-atm-client',
    'test-your-server',
  ],
  capabilities: weatherCapabilities,
};

export const interactiveGuideDefinitions: Record<
  InteractiveGuideId,
  InteractiveGuideDefinition
> = {
  'building-your-first-mcp-server': buildingFirstServerDefinition,
};

export function cloneCapability(capability: CapabilityDefinition) {
  return structuredClone(capability);
}

export function createInitialInteractiveGuideState(): InteractiveGuideStateV1 {
  return {
    version: 1,
    scenarioRevision: 1,
    server: {
      name: 'weather-server',
      version: '0.1.0',
      created: false,
      tools: [],
      resources: [],
      prompts: [],
    },
    clientConnected: false,
    protocolEvents: [],
    finished: false,
  };
}

export function isInteractiveGuideState(
  value: unknown,
): value is InteractiveGuideStateV1 {
  return interactiveGuideStateV1Schema.safeParse(value).success;
}

export function validateServerName(name: string) {
  if (!serverName.test(name)) {
    return 'Use lowercase letters, numbers, and hyphens.';
  }
  return undefined;
}

export function validateCapability(
  capability: CapabilityDefinition,
  existing: CapabilityDefinition[],
) {
  const parsed = capabilitySchema.safeParse(capability);
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.') || 'form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    });
  }
  if (
    existing.some(
      (item) => item.id !== capability.id && item.name === capability.name,
    )
  ) {
    fieldErrors.name = 'Capability names must be unique.';
  }
  return fieldErrors;
}

function capabilityCollection(kind: CapabilityKind) {
  return kind === 'tool'
    ? 'tools'
    : kind === 'resource'
      ? 'resources'
      : 'prompts';
}

function discoveryEvents(state: InteractiveGuideStateV1): ProtocolEvent[] {
  const envelope = {
    'io.modelcontextprotocol/spec-version': '2026-07-28',
    'io.modelcontextprotocol/client': {
      name: 'atm-learning-client',
      version: '0.1.0',
    },
  };
  const events: ProtocolEvent[] = [
    {
      id: 'discover',
      sequence: 1,
      label: 'Discover server',
      method: 'server/discover',
      direction: 'client-to-server',
      status: 'response',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'server/discover',
        _meta: envelope,
      },
      response: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2026-07-28',
          serverInfo: {
            name: state.server.name,
            version: state.server.version,
          },
          capabilities: { tools: {}, resources: {}, prompts: {} },
        },
      },
      durationMs: 18,
    },
  ];
  const listings: Array<[string, string[]]> = [
    ['tools/list', state.server.tools.map((item) => item.name)],
    [
      'resources/list',
      state.server.resources.map((item) => item.uri ?? item.name),
    ],
    ['prompts/list', state.server.prompts.map((item) => item.name)],
  ];
  listings.forEach(([method, items], index) => {
    events.push({
      id: method.replace('/', '-'),
      sequence: index + 2,
      label: method.split('/')[0].replace(/^./, (value) => value.toUpperCase()),
      method,
      direction: 'client-to-server',
      status: 'response',
      request: { jsonrpc: '2.0', id: index + 2, method, _meta: envelope },
      response: {
        jsonrpc: '2.0',
        id: index + 2,
        result: { [method.split('/')[0]]: items },
      },
      durationMs: 12 + index * 3,
    });
  });
  return events;
}

export function simulateToolResult(
  toolName: string,
  location: string,
  unit: string,
) {
  if (toolName === 'get_forecast') {
    return {
      location,
      unit,
      forecast: [
        { day: 'Monday', high: 22, low: 15, conditions: 'Partly cloudy' },
        { day: 'Tuesday', high: 20, low: 14, conditions: 'Light rain' },
      ],
    };
  }
  if (toolName === 'search_locations') {
    return {
      query: location,
      matches: [{ name: location, latitude: 51.5072, longitude: -0.1276 }],
    };
  }
  return {
    location,
    temperature: unit === 'fahrenheit' ? 64 : 18,
    unit,
    conditions: 'Partly cloudy',
  };
}

function toolCallEvent(
  state: InteractiveGuideStateV1,
  toolName: string,
  location: string,
  unit: string,
): ProtocolEvent {
  const result = simulateToolResult(toolName, location, unit);
  return {
    id: `tools-call-${state.protocolEvents.length + 1}`,
    sequence: state.protocolEvents.length + 1,
    label: `Call ${toolName}`,
    method: 'tools/call',
    direction: 'client-to-server',
    status: 'response',
    request: {
      jsonrpc: '2.0',
      id: state.protocolEvents.length + 1,
      method: 'tools/call',
      params: { name: toolName, arguments: { location, unit } },
      _meta: { 'io.modelcontextprotocol/spec-version': '2026-07-28' },
    },
    response: {
      jsonrpc: '2.0',
      id: state.protocolEvents.length + 1,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result,
      },
    },
    durationMs: 43,
  };
}

function capabilityRequestEvent(
  state: InteractiveGuideStateV1,
  kind: 'resource' | 'prompt',
  name: string,
): ProtocolEvent {
  const collection =
    kind === 'resource' ? state.server.resources : state.server.prompts;
  const capability = collection.find(
    (item) => item.name === name || item.uri === name,
  );
  const method = kind === 'resource' ? 'resources/read' : 'prompts/get';
  const id = state.protocolEvents.length + 1;
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params:
      kind === 'resource'
        ? { uri: capability?.uri ?? name }
        : { name, arguments: { city: 'London', day: 'Monday' } },
    _meta: { 'io.modelcontextprotocol/spec-version': '2026-07-28' },
  };
  if (!capability) {
    return {
      id: `${method.replace('/', '-')}-${id}`,
      sequence: id,
      label: `Failed ${method}`,
      method,
      direction: 'client-to-server',
      status: 'error',
      request,
      response: {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Unknown ${kind}: ${name}` },
      },
      durationMs: 9,
    };
  }
  const result =
    kind === 'resource'
      ? {
          contents: [
            {
              uri: capability.uri,
              mimeType: capability.mimeType,
              text: JSON.stringify({
                cities: ['London', 'Lagos', 'San Francisco'],
              }),
            },
          ],
        }
      : {
          description: capability.description,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: (capability.template ?? '')
                  .replaceAll('{city}', 'London')
                  .replaceAll('{day}', 'Monday'),
              },
            },
          ],
        };
  return {
    id: `${method.replace('/', '-')}-${id}`,
    sequence: id,
    label:
      kind === 'resource'
        ? `Read ${capability.title}`
        : `Get ${capability.title}`,
    method,
    direction: 'client-to-server',
    status: 'response',
    request,
    response: { jsonrpc: '2.0', id, result },
    durationMs: kind === 'resource' ? 21 : 17,
  };
}

export function interactiveGuideReducer(
  state: InteractiveGuideStateV1,
  action: InteractiveGuideAction,
): InteractiveGuideStateV1 {
  switch (action.type) {
    case 'hydrate':
      return isInteractiveGuideState(action.state)
        ? action.state
        : createInitialInteractiveGuideState();
    case 'create-server':
      return {
        ...state,
        server: { ...state.server, created: true, name: action.name },
        finished: false,
      };
    case 'upsert-capability': {
      const collection = capabilityCollection(action.capability.kind);
      const items = state.server[collection];
      const next = items.some((item) => item.id === action.capability.id)
        ? items.map((item) =>
            item.id === action.capability.id ? action.capability : item,
          )
        : [...items, action.capability];
      return {
        ...state,
        server: { ...state.server, [collection]: next },
        clientConnected: false,
        protocolEvents: [],
        selectedEventId: undefined,
        lastResult: undefined,
        finished: false,
      };
    }
    case 'remove-capability': {
      const collection = capabilityCollection(action.kind);
      return {
        ...state,
        server: {
          ...state.server,
          [collection]: state.server[collection].filter(
            (item) => item.id !== action.id,
          ),
        },
        clientConnected: false,
        protocolEvents: [],
        selectedEventId: undefined,
        lastResult: undefined,
        finished: false,
      };
    }
    case 'connect-client': {
      const events = discoveryEvents(state);
      return {
        ...state,
        clientConnected: true,
        protocolEvents: events,
        selectedEventId: events[0]?.id,
        lastResult: undefined,
      };
    }
    case 'run-tool': {
      const event = toolCallEvent(
        state,
        action.toolName,
        action.location,
        action.unit,
      );
      const result = event.response.result as Record<string, unknown>;
      return {
        ...state,
        protocolEvents: [...state.protocolEvents, event],
        selectedEventId: event.id,
        lastResult: result.structuredContent as Record<string, unknown>,
      };
    }
    case 'read-resource':
    case 'get-prompt': {
      const event = capabilityRequestEvent(
        state,
        action.type === 'read-resource' ? 'resource' : 'prompt',
        action.type === 'read-resource'
          ? action.resourceName
          : action.promptName,
      );
      return {
        ...state,
        protocolEvents: [...state.protocolEvents, event],
        selectedEventId: event.id,
        lastResult:
          event.status === 'response'
            ? (event.response.result as Record<string, unknown>)
            : state.lastResult,
      };
    }
    case 'select-event':
      return { ...state, selectedEventId: action.eventId };
    case 'finish':
      return { ...state, finished: true };
    case 'reset':
      return createInitialInteractiveGuideState();
  }
}

export function getGuideObjectives(
  state: InteractiveGuideStateV1,
): GuideObjective[] {
  return [
    {
      stepId: 'create-your-server',
      label: 'Create the server',
      complete: state.server.created,
    },
    {
      stepId: 'add-tools',
      label: 'Add at least one tool',
      complete: state.server.tools.length > 0,
    },
    {
      stepId: 'add-resources',
      label: 'Add at least one resource',
      complete: state.server.resources.length > 0,
    },
    {
      stepId: 'add-prompts',
      label: 'Add at least one prompt',
      complete: state.server.prompts.length > 0,
    },
    {
      stepId: 'connect-the-atm-client',
      label: 'Connect and discover the server',
      complete:
        state.clientConnected &&
        state.protocolEvents.some(
          (event) => event.method === 'server/discover',
        ),
    },
    {
      stepId: 'test-your-server',
      label: 'Complete a tool call',
      complete:
        !!state.lastResult &&
        state.protocolEvents.some((event) => event.method === 'tools/call'),
    },
    {
      stepId: 'review-and-export',
      label: 'Finish the guide',
      complete: state.finished,
    },
  ];
}

function zodField(field: CapabilityField) {
  let expression =
    field.enumValues?.length && field.type === 'string'
      ? `z.enum(${JSON.stringify(field.enumValues)})`
      : field.type === 'number'
        ? 'z.number()'
        : field.type === 'boolean'
          ? 'z.boolean()'
          : 'z.string()';
  expression += `.describe(${JSON.stringify(field.description)})`;
  if (!field.required) expression += '.optional()';
  return `${JSON.stringify(field.name)}: ${expression}`;
}

function toolSource(tool: CapabilityDefinition) {
  const schema = tool.fields.map(zodField).join(',\n        ');
  const params = tool.fields.map((field) => field.name).join(', ');
  const handlerParameters = params ? `{ ${params} }` : '';
  const inputObject = params ? `{ ${params} }` : '{}';
  return `  server.registerTool(
    ${JSON.stringify(tool.name)},
    {
      description: ${JSON.stringify(tool.description)},
      inputSchema: z.object({
        ${schema}
      })
    },
    async (${handlerParameters}) => {
      const result = {
        tool: ${JSON.stringify(tool.name)},
        inputs: ${inputObject},
        output: "Deterministic weather simulation"
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
        structuredContent: result
      };
    }
  );`;
}

function resourceSource(resource: CapabilityDefinition) {
  const value =
    resource.mimeType === 'text/markdown'
      ? '# Weather API usage\n\nUse the server capabilities responsibly.'
      : JSON.stringify({ cities: ['London', 'Lagos', 'San Francisco'] });
  return `  server.registerResource(
    ${JSON.stringify(resource.name)},
    ${JSON.stringify(resource.uri)},
    {
      title: ${JSON.stringify(resource.title)},
      description: ${JSON.stringify(resource.description)},
      mimeType: ${JSON.stringify(resource.mimeType)}
    },
    async uri => ({
      contents: [{
        uri: uri.href,
        mimeType: ${JSON.stringify(resource.mimeType)},
        text: ${JSON.stringify(value)}
      }]
    })
  );`;
}

function promptSource(prompt: CapabilityDefinition) {
  const schema = prompt.fields.map(zodField).join(',\n        ');
  const params = prompt.fields.map((field) => field.name).join(', ');
  const handlerParameters = params ? `{ ${params} }` : '';
  const replacements = prompt.fields
    .map(
      (field) =>
        `.replaceAll(${JSON.stringify(`{${field.name}}`)}, String(${field.name}))`,
    )
    .join('');
  return `  server.registerPrompt(
    ${JSON.stringify(prompt.name)},
    {
      title: ${JSON.stringify(prompt.title)},
      description: ${JSON.stringify(prompt.description)},
      argsSchema: z.object({
        ${schema}
      })
    },
    (${handlerParameters}) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: ${JSON.stringify(prompt.template ?? '')}${replacements}
        }
      }]
    })
  );`;
}

export function generateServerSource(state: InteractiveGuideStateV1) {
  const registrations = [
    ...state.server.tools.map(toolSource),
    ...state.server.resources.map(resourceSource),
    ...state.server.prompts.map(promptSource),
  ].join('\n\n');
  return `import { createServer } from "node:http";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler
} from "@modelcontextprotocol/node";
import * as z from "zod/v4";

function buildServer() {
  const server = new McpServer({
    name: ${JSON.stringify(state.server.name)},
    version: ${JSON.stringify(state.server.version)}
  });

${registrations || '  // Add tools, resources, and prompts here.'}

  return server;
}

const handler = createMcpHandler(buildServer);
const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

createServer((request, response) => {
  if (!validateHost(request, response) || !validateOrigin(request, response)) {
    return;
  }
  void nodeHandler(request, response);
}).listen(3000, "127.0.0.1", () => {
  console.log("MCP server available at http://127.0.0.1:3000/mcp");
});
`;
}

export function generateProjectFiles(state: InteractiveGuideStateV1) {
  return {
    'package.json': `${JSON.stringify(
      {
        name: state.server.name,
        version: state.server.version,
        private: true,
        type: 'module',
        scripts: {
          dev: 'tsx watch src/server.ts',
          start: 'tsx src/server.ts',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          '@modelcontextprotocol/node': '^2.0.0',
          '@modelcontextprotocol/server': '^2.0.0',
          zod: '^4.1.12',
        },
        devDependencies: {
          '@types/node': '^24.0.0',
          tsx: '^4.20.0',
          typescript: '^6.0.0',
        },
      },
      null,
      2,
    )}\n`,
    'tsconfig.json': `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noEmit: true,
          types: ['node'],
        },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    )}\n`,
    'README.md': `# ${state.server.name}\n\nGenerated by the All Things MCP interactive Guide.\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\nThe MCP endpoint is available at \`http://127.0.0.1:3000/mcp\`.\n`,
    'src/server.ts': generateServerSource(state),
  };
}
