import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenMeteoProvider } from "../src/weather.js";

function fixture() {
  const fetcher = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    return url.hostname.startsWith("geocoding")
      ? Response.json({
          results: [
            {
              name: url.searchParams.get("name"),
              country: "Nigeria",
              latitude: 6.45,
              longitude: 3.39,
              timezone: "Africa/Lagos",
            },
          ],
        })
      : Response.json({
          current: { temperature_2m: 30 },
          current_units: { temperature_2m: "°C" },
        });
  });
  const provider = new OpenMeteoProvider(
    fetcher as typeof fetch,
    "https://geocoding.example.test/search",
    "https://weather.example.test/forecast",
  );
  return { fetcher, provider };
}

// Inspect retention directly: correct TTL responses alone do not prove stale
// values have been released from the long-lived provider's cache.
function retainedCache(provider: OpenMeteoProvider) {
  return Reflect.get(provider, "cache") as Map<
    string,
    { value: unknown; expiresAt: number }
  >;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime("2026-10-01T00:00:00Z");
  vi.stubEnv("MCP_UPSTREAM_DAILY_LIMIT", "8000");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("weather cache memory bounds", () => {
  it("releases expired locations even if they are never requested again", async () => {
    const { provider } = fixture();
    for (let index = 0; index < 100; index++) {
      await provider.search(`location-${index}`);
    }
    expect(retainedCache(provider).size).toBe(100);

    vi.setSystemTime("2026-10-02T01:00:00Z");
    await provider.search("new-location");

    expect(retainedCache(provider).size).toBe(1);
    expect([...retainedCache(provider).keys()][0]).toContain("new-location");
  });

  it("bounds retention after many distinct locations within their TTL", async () => {
    const { fetcher, provider } = fixture();
    for (let index = 0; index < 600; index++) {
      await provider.search(`location-${index}`);
    }
    expect(fetcher).toHaveBeenCalledTimes(600);
    expect(retainedCache(provider).size).toBe(256);
  });

  it("keeps recently read locations and evicts the least recently used", async () => {
    const { fetcher, provider } = fixture();
    for (let index = 0; index < 256; index++) {
      await provider.search(`location-${index}`);
    }
    await provider.search("location-0");
    expect(fetcher).toHaveBeenCalledTimes(256);

    await provider.search("new-location");
    await provider.search("location-0");
    expect(fetcher).toHaveBeenCalledTimes(257);

    await provider.search("location-1");
    expect(fetcher).toHaveBeenCalledTimes(258);
    expect(retainedCache(provider).size).toBe(256);
  });

  it("keeps the bound when many concurrent misses finish together", async () => {
    const { provider } = fixture();
    await Promise.all(
      Array.from({ length: 300 }, (_, index) =>
        provider.search(`location-${index}`),
      ),
    );
    expect(retainedCache(provider).size).toBe(256);
  });

  it("does not extend weather freshness when a cached result is read", async () => {
    const { fetcher, provider } = fixture();
    await provider.current("Lagos");
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.setSystemTime("2026-10-01T00:09:00Z");
    await provider.current("Lagos");
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.setSystemTime("2026-10-01T00:10:00Z");
    await provider.current("Lagos");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(retainedCache(provider).size).toBe(2);
  });

  it("returns isolated values so callers cannot mutate retained results", async () => {
    const { fetcher, provider } = fixture();
    const first = await provider.current("Lagos");
    (first.current as Record<string, unknown>).temperature_2m = -100;
    const second = await provider.current("Lagos");

    expect(second.current).toEqual({ temperature_2m: 30 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("serves oversized query keys without retaining them", async () => {
    const { fetcher, provider } = fixture();
    const query = "a".repeat(3_000);
    const result = await provider.search(query);
    await provider.search(query);

    expect(result.matches[0]?.name).toBe(query);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(retainedCache(provider).size).toBe(0);
  });
});
