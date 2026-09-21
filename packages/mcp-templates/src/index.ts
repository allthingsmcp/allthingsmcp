import { mcpTemplateManifestSchema } from '@all-things-mcp/contracts';

export const weatherTemplate = mcpTemplateManifestSchema.parse({
  id: 'weather',
  version: 1,
  guideSlug: 'building-your-first-mcp-server',
  title: 'Weather MCP',
  description: 'Live geocoding, current weather, forecasts, resources, and planning prompts.',
  serverVersion: '0.1.0',
  attribution: { label: 'Weather data by Open-Meteo', url: 'https://open-meteo.com/' },
  capabilities: [
    {
      id: 'get-weather', executorId: 'weather.current', kind: 'tool', name: 'get_weather',
      title: 'Get current weather', description: 'Get current weather for a location.',
      fields: [
        { name: 'location', type: 'string', description: 'City name or coordinates', required: true },
        { name: 'unit', type: 'string', description: 'Temperature unit', required: false, enumValues: ['celsius', 'fahrenheit'] },
      ],
    },
    {
      id: 'get-forecast', executorId: 'weather.forecast', kind: 'tool', name: 'get_forecast',
      title: 'Get forecast', description: 'Get a seven-day forecast for a location.',
      fields: [{ name: 'location', type: 'string', description: 'Place name to forecast', required: true }],
    },
    {
      id: 'search-locations', executorId: 'weather.search', kind: 'tool', name: 'search_locations',
      title: 'Search locations', description: 'Search for supported places and coordinates.',
      fields: [{ name: 'query', type: 'string', description: 'Place name to search for', required: true }],
    },
    {
      id: 'supported-cities', executorId: 'weather.cities', kind: 'resource', name: 'supported_cities',
      title: 'Supported cities', description: 'A curated set of example cities.', fields: [],
      uri: 'weather://cities', mimeType: 'application/json',
    },
    {
      id: 'api-usage-guide', executorId: 'weather.usage', kind: 'resource', name: 'api_usage_guide',
      title: 'Weather API usage guide', description: 'Usage and attribution guidance.', fields: [],
      uri: 'weather://docs/usage', mimeType: 'text/markdown',
    },
    {
      id: 'plan-for-weather', executorId: 'weather.plan', kind: 'prompt', name: 'plan_for_weather',
      title: 'Plan for weather', description: 'Create a concise planning request for a city and day.',
      fields: [
        { name: 'city', type: 'string', description: 'City to plan for', required: true },
        { name: 'day', type: 'string', description: 'Day to plan for', required: true },
      ],
      template: 'Help me plan for the weather in {city} on {day}.',
    },
  ],
});

export const mcpTemplates = [weatherTemplate] as const;
export function getMcpTemplate(id: string, version?: number) {
  return mcpTemplates.find((item) => item.id === id && (version === undefined || item.version === version));
}
export function getMcpTemplateForGuide(guideSlug: string) {
  return mcpTemplates.find((item) => item.guideSlug === guideSlug);
}
