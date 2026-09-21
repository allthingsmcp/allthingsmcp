import {
  createMcpWorkspaceRequestSchema,
  updateMcpWorkspaceRequestSchema,
} from '@all-things-mcp/contracts';
import {
  currentRuntimeUser,
  fetchAnonymousGuideRuntime,
  fetchGuideRuntime,
  runtimeErrorResponse,
  runtimeResponse,
} from '@/lib/runtime-server';

function temporary(request: Request) {
  return {
    id: request.headers.get('x-atm-workspace-id'),
    credential: request.headers.get('x-atm-workspace-credential') ?? undefined,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  try {
    const signedIn = Boolean(await currentRuntimeUser());
    const temp = temporary(request);
    const response = signedIn
      ? await fetchGuideRuntime(`/v1/mcp-workspaces/${guideSlug}`)
      : temp.id
        ? await fetchAnonymousGuideRuntime(
            `/anonymous/workspaces/${temp.id}`,
            temp.credential,
          )
        : new Response(null, { status: 404 });
    return runtimeResponse(response);
  } catch (caught) {
    return runtimeErrorResponse(caught);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  const parsed = createMcpWorkspaceRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success || parsed.data.guideSlug !== guideSlug)
    return Response.json({ error: 'Invalid workspace.' }, { status: 400 });
  try {
    const signedIn = Boolean(await currentRuntimeUser());
    const response = signedIn
      ? await fetchGuideRuntime(`/v1/mcp-workspaces/${guideSlug}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed.data),
        })
      : await fetchAnonymousGuideRuntime('/anonymous/workspaces', undefined, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
    return runtimeResponse(response);
  } catch (caught) {
    return runtimeErrorResponse(caught);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  const parsed = updateMcpWorkspaceRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: 'Invalid workspace update.' },
      { status: 400 },
    );
  try {
    const signedIn = Boolean(await currentRuntimeUser());
    const temp = temporary(request);
    const response = signedIn
      ? await fetchGuideRuntime(`/v1/mcp-workspaces/${guideSlug}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed.data),
        })
      : temp.id
        ? await fetchAnonymousGuideRuntime(
            `/anonymous/workspaces/${temp.id}`,
            temp.credential,
            {
              method: 'PUT',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(parsed.data),
            },
          )
        : new Response(
            JSON.stringify({ error: 'Temporary workspace is unavailable.' }),
            { status: 401 },
          );
    return runtimeResponse(response);
  } catch (caught) {
    return runtimeErrorResponse(caught);
  }
}
