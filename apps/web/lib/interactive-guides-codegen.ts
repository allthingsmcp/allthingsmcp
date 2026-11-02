import type {
  CapabilityDefinition,
  CapabilityField,
  InteractiveGuideStateV1,
} from '@/lib/interactive-guides';

/** Generates the downloadable project files for an interactive Guide server. */
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
      const result = await executeWeatherTool(${JSON.stringify(tool.name)}, ${inputObject});
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

const attribution = { label: "Weather data by Open-Meteo", url: "https://open-meteo.com/" };

async function executeWeatherTool(name: string, input: Record<string, unknown>) {
  const location = String(input.location ?? input.query ?? "");
  const geocoding = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocoding.searchParams.set("name", location);
  geocoding.searchParams.set("count", name === "search_locations" ? "5" : "1");
  const matches = await fetch(geocoding).then(async response => {
    if (!response.ok) throw new Error("Open-Meteo geocoding returned " + response.status);
    return (await response.json() as { results?: Array<Record<string, unknown>> }).results ?? [];
  });
  if (name === "search_locations") return { query: location, matches, attribution };
  const place = matches[0];
  if (!place) throw new Error("No location matched “" + location + "”.");
  const forecast = new URL("https://api.open-meteo.com/v1/forecast");
  forecast.searchParams.set("latitude", String(place.latitude));
  forecast.searchParams.set("longitude", String(place.longitude));
  forecast.searchParams.set("timezone", "auto");
  if (name === "get_forecast") {
    forecast.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    forecast.searchParams.set("forecast_days", "7");
  } else {
    forecast.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
    forecast.searchParams.set("temperature_unit", input.unit === "fahrenheit" ? "fahrenheit" : "celsius");
  }
  const weather = await fetch(forecast).then(async response => {
    if (!response.ok) throw new Error("Open-Meteo forecast returned " + response.status);
    return await response.json() as Record<string, unknown>;
  });
  return { location: place, ...weather, attribution };
}

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
const port = Number(process.env.PORT ?? 3001);

createServer((request, response) => {
  if (!validateHost(request, response) || !validateOrigin(request, response)) {
    return;
  }
  void nodeHandler(request, response);
}).listen(port, "127.0.0.1", () => {
  console.log("MCP server available at http://127.0.0.1:" + port + "/mcp");
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
    'README.md': `# ${state.server.name}\n\nGenerated by the All Things MCP interactive Guide. Weather data is provided by [Open-Meteo](https://open-meteo.com/) under CC BY 4.0.\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\nThe MCP endpoint is available at \`http://127.0.0.1:3001/mcp\`. Set the \`PORT\` environment variable to use another port.\n`,
    'src/server.ts': generateServerSource(state),
  };
}
