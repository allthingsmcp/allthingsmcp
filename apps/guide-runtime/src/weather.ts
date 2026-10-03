const attribution = {
  label: "Weather data by Open-Meteo",
  url: "https://open-meteo.com/",
  license: "CC BY 4.0",
};

export class WeatherProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "UPSTREAM_UNAVAILABLE"
      | "UPSTREAM_QUOTA_EXCEEDED"
      | "LOCATION_NOT_FOUND" = "UPSTREAM_UNAVAILABLE",
  ) {
    super(message);
  }
}

export class OpenMeteoProvider {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private upstreamWindow = { day: "", count: 0 };
  constructor(
    private fetcher: typeof fetch = fetch,
    private geocodingUrl = process.env.OPEN_METEO_GEOCODING_URL ??
      "https://geocoding-api.open-meteo.com/v1/search",
    private forecastUrl = process.env.OPEN_METEO_FORECAST_URL ??
      "https://api.open-meteo.com/v1/forecast",
  ) {}

  private async json(url: URL, ttlMs: number) {
    const key = url.toString();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now())
      return structuredClone(cached.value);
    const day = new Date().toISOString().slice(0, 10);
    if (this.upstreamWindow.day !== day)
      this.upstreamWindow = { day, count: 0 };
    const dailyLimit = Number(process.env.MCP_UPSTREAM_DAILY_LIMIT ?? 8_000);
    if (this.upstreamWindow.count >= dailyLimit) {
      throw new WeatherProviderError(
        "The Open-Meteo daily quota is exhausted.",
        "UPSTREAM_QUOTA_EXCEEDED",
      );
    }
    this.upstreamWindow.count += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);
    try {
      const response = await this.fetcher(url, {
        signal: controller.signal,
        headers: { "user-agent": "All-Things-MCP/0.1" },
      });
      if (!response.ok)
        throw new WeatherProviderError(
          `Open-Meteo returned ${response.status}.`,
        );
      const value: unknown = await response.json();
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        ("error" in value && value.error)
      ) {
        throw new WeatherProviderError(
          "Open-Meteo returned an invalid response.",
        );
      }
      this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return structuredClone(value);
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      throw new WeatherProviderError("Open-Meteo is temporarily unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }

  async search(query: string) {
    const url = new URL(this.geocodingUrl);
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const data = (await this.json(url, 24 * 60 * 60 * 1000)) as {
      results?: Array<Record<string, unknown>>;
    };
    if (
      data.results &&
      (!Array.isArray(data.results) ||
        data.results.some((item) => !item || typeof item !== "object"))
    ) {
      throw new WeatherProviderError(
        "Open-Meteo returned invalid location data.",
      );
    }
    return {
      query,
      matches: (data.results ?? []).map((item) => ({
        name: item.name,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone,
      })),
      attribution,
    };
  }

  private async resolve(location: string) {
    const found = await this.search(location);
    const first = found.matches[0];
    if (
      !first ||
      typeof first.latitude !== "number" ||
      typeof first.longitude !== "number"
    ) {
      throw new WeatherProviderError(
        `No location matched “${location}”.`,
        "LOCATION_NOT_FOUND",
      );
    }
    return first;
  }

  async current(location: string, unit = "celsius") {
    const place = await this.resolve(location);
    const url = new URL(this.forecastUrl);
    url.searchParams.set("latitude", String(place.latitude));
    url.searchParams.set("longitude", String(place.longitude));
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
    url.searchParams.set(
      "temperature_unit",
      unit === "fahrenheit" ? "fahrenheit" : "celsius",
    );
    url.searchParams.set("timezone", "auto");
    const data = (await this.json(url, 10 * 60 * 1000)) as Record<
      string,
      unknown
    >;
    if (
      !data.current ||
      typeof data.current !== "object" ||
      !data.current_units ||
      typeof data.current_units !== "object"
    ) {
      throw new WeatherProviderError(
        "Open-Meteo returned incomplete current weather data.",
      );
    }
    return {
      location: place,
      current: data.current,
      units: data.current_units,
      attribution,
    };
  }

  async forecast(location: string) {
    const place = await this.resolve(location);
    const url = new URL(this.forecastUrl);
    url.searchParams.set("latitude", String(place.latitude));
    url.searchParams.set("longitude", String(place.longitude));
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    );
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("timezone", "auto");
    const data = (await this.json(url, 30 * 60 * 1000)) as Record<
      string,
      unknown
    >;
    if (
      !data.daily ||
      typeof data.daily !== "object" ||
      !data.daily_units ||
      typeof data.daily_units !== "object"
    ) {
      throw new WeatherProviderError(
        "Open-Meteo returned incomplete forecast data.",
      );
    }
    return {
      location: place,
      daily: data.daily,
      units: data.daily_units,
      attribution,
    };
  }
}

export { attribution as openMeteoAttribution };
