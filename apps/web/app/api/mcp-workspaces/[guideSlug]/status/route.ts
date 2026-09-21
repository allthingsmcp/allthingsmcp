import {
  fetchGuideRuntime,
  runtimeRoute,
  runtimeResponse,
} from '@/lib/runtime-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  const body: unknown = await request.json().catch(() => null);
  return runtimeRoute(async () => {
    const response = await fetchGuideRuntime(
      `/v1/mcp-workspaces/${guideSlug}/status`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    return runtimeResponse(response);
  });
}
