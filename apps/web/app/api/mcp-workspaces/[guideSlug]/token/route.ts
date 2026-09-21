import {
  fetchGuideRuntime,
  runtimeRoute,
  runtimeResponse,
} from '@/lib/runtime-server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  return runtimeRoute(async () => {
    const response = await fetchGuideRuntime(
      `/v1/mcp-workspaces/${guideSlug}/token`,
      { method: 'POST' },
    );
    return runtimeResponse(response);
  });
}
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  return runtimeRoute(async () => {
    const response = await fetchGuideRuntime(
      `/v1/mcp-workspaces/${guideSlug}/token`,
      { method: 'DELETE' },
    );
    return runtimeResponse(response);
  });
}
