import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// CI exercises the real Next BFF and MCP SDK runtime. Only Open-Meteo is
// deterministic; the live demo can be checked with PLAYWRIGHT_BASE_URL instead.
const webDirectory = fileURLToPath(new URL('../../', import.meta.url));
const runtimeDirectory = fileURLToPath(
  new URL('../../../guide-runtime/', import.meta.url),
);
// Next writes its isolated output path into these project files at startup.
// Restore only that recognized generated edit; preserve concurrent user edits.
const configSnapshots = ['next-env.d.ts', 'tsconfig.json'].map((name) => {
  const path = new URL(`../../${name}`, import.meta.url);
  return { name, path, original: readFileSync(path, 'utf8') };
});
process.on('exit', () => {
  for (const { name, path, original } of configSnapshots) {
    try {
      const current = readFileSync(path, 'utf8');
      if (current === original) continue;
      let recognized: boolean;
      if (name === 'next-env.d.ts') {
        const generated = original.replace(
          /^import ["'][^"']*types\/routes\.d\.ts["'];$/m,
          'import "./.next-e2e/dev/types/routes.d.ts";',
        );
        recognized = current === generated;
      } else {
        const expected = JSON.parse(original) as { include?: string[] };
        for (const entry of [
          '.next-e2e/types/**/*.ts',
          '.next-e2e/dev/types/**/*.ts',
        ]) {
          if (!expected.include?.includes(entry)) expected.include?.push(entry);
        }
        recognized = current === `${JSON.stringify(expected, null, 2)}\n`;
      }
      if (recognized) writeFileSync(path, original);
      else
        console.warn(
          `Preserved ${name}: it changed beyond the E2E-generated paths.`,
        );
    } catch {
      console.warn(
        `Could not safely restore ${name}; inspect its generated paths.`,
      );
    }
  }
});
const children: ChildProcess[] = [];
const provider = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost:8890');
  response.setHeader('content-type', 'application/json');
  if (url.pathname === '/v1/search') {
    const name = url.searchParams.get('name') ?? 'London';
    response.end(
      JSON.stringify({
        results: [
          {
            name,
            country: name === 'Lagos' ? 'Nigeria' : 'United Kingdom',
            latitude: 51.5085,
            longitude: -0.1257,
            timezone: 'Europe/London',
          },
        ],
      }),
    );
  } else if (url.pathname === '/v1/forecast') {
    response.end(
      JSON.stringify({
        current: {
          time: '2026-09-21T12:00',
          temperature_2m: 18.5,
          apparent_temperature: 18,
          weather_code: 2,
          wind_speed_10m: 8.4,
        },
        current_units: {
          temperature_2m: '°C',
          apparent_temperature: '°C',
          wind_speed_10m: 'km/h',
        },
        daily: {
          time: ['2026-09-21'],
          weather_code: [2],
          temperature_2m_max: [20],
          temperature_2m_min: [14],
          precipitation_probability_max: [10],
        },
        daily_units: { temperature_2m_max: '°C', temperature_2m_min: '°C' },
      }),
    );
  } else {
    response.writeHead(404).end('{}');
  }
});

let stopping = false;
function stop(code: number) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill('SIGTERM'));
  provider.close();
  process.exitCode = code;
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

function launch(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

await new Promise<void>((resolve, reject) => {
  provider.once('error', reject);
  provider.listen(8890, '127.0.0.1', resolve);
});
const sharedSecret = 'playwright-isolated-runtime-secret-not-for-deployment';
launch(['--import', 'tsx', 'src/server.ts'], runtimeDirectory, {
  NODE_ENV: 'test',
  PORT: '8887',
  DATABASE_URL: '',
  GUIDE_RUNTIME_SHARED_SECRET: sharedSecret,
  GUIDE_RUNTIME_PUBLIC_URL: 'http://localhost:8887',
  REAL_MCP_GUIDES: 'building-your-first-mcp-server',
  OPEN_METEO_GEOCODING_URL: 'http://127.0.0.1:8890/v1/search',
  OPEN_METEO_FORECAST_URL: 'http://127.0.0.1:8890/v1/forecast',
  MCP_REQUESTS_PER_IP_MINUTE: '10000',
  MCP_REQUESTS_PER_WORKSPACE_HOUR: '1000',
});
for (let attempt = 0; ; attempt += 1) {
  if (attempt > 100) throw new Error('E2E Guide Runtime did not start.');
  const ready = await fetch('http://localhost:8887/health').catch(() => null);
  if (ready?.ok) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const require = createRequire(import.meta.url);
launch(
  [require.resolve('next/dist/bin/next'), 'dev', '--port', '3100'],
  webDirectory,
  {
    NODE_ENV: 'development',
    NEXT_DIST_DIR: '.next-e2e',
    NEXT_PUBLIC_SUPABASE_ENABLED: 'false',
    GUIDE_RUNTIME_URL: 'http://localhost:8887',
    GUIDE_RUNTIME_SHARED_SECRET: sharedSecret,
  },
);
