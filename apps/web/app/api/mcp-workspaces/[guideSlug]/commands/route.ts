import { mcpWorkspaceCommandSchema } from '@all-things-mcp/contracts';
import {
  currentRuntimeUser,
  fetchAnonymousGuideRuntime,
  fetchGuideRuntime,
  runtimeRoute,
  runtimeResponse,
} from '@/lib/runtime-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  const parsed = mcpWorkspaceCommandSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: 'Invalid MCP command.' }, { status: 400 });
  return runtimeRoute(async () => {
    const signedIn = Boolean(await currentRuntimeUser());
    const workspaceId = request.headers.get('x-atm-workspace-id');
    const credential =
      request.headers.get('x-atm-workspace-credential') ?? undefined;
    const response = signedIn
      ? await fetchGuideRuntime(`/v1/mcp-workspaces/${guideSlug}/commands`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed.data),
        })
      : workspaceId
        ? await fetchAnonymousGuideRuntime(
            `/anonymous/workspaces/${workspaceId}/commands`,
            credential,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(parsed.data),
            },
          )
        : new Response(
            JSON.stringify({ error: 'Temporary workspace is unavailable.' }),
            { status: 401 },
          );
    return runtimeResponse(response);
  });
}
