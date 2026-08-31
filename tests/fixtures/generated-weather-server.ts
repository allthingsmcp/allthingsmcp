import { createServer } from 'node:http';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from '@modelcontextprotocol/node';
import * as z from 'zod/v4';

function buildServer() {
  const server = new McpServer({ name: 'weather-server', version: '0.1.0' });

  server.registerTool(
    'get_weather',
    {
      description: 'Get current weather for a location.',
      inputSchema: z.object({
        location: z.string().describe('City name or coordinates'),
        unit: z
          .enum(['celsius', 'fahrenheit'])
          .describe('Temperature unit')
          .optional(),
      }),
    },
    async ({ location, unit }) => {
      const result = {
        location,
        temperature: 18,
        unit: unit ?? 'celsius',
        conditions: 'Partly cloudy',
      };
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );

  server.registerResource(
    'supported_cities',
    'weather://cities',
    {
      title: 'Supported cities',
      description: 'List of supported cities and coordinates.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            cities: ['London', 'Lagos', 'San Francisco'],
          }),
        },
      ],
    }),
  );

  server.registerPrompt(
    'plan_for_weather',
    {
      title: 'Plan for weather',
      description: 'Suggest what to wear or plan based on the forecast.',
      argsSchema: z.object({
        city: z.string().describe('City to plan for'),
        day: z.string().describe('Day of the forecast'),
      }),
    },
    ({ city, day }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: 'Given the forecast for {city} on {day}, suggest what to wear.'
              .replaceAll('{city}', String(city))
              .replaceAll('{day}', String(day)),
          },
        },
      ],
    }),
  );

  return server;
}

const handler = createMcpHandler(buildServer);
const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

export const generatedWeatherServer = createServer((request, response) => {
  if (!validateHost(request, response) || !validateOrigin(request, response)) {
    return;
  }
  void nodeHandler(request, response);
});
