import {
  guideRunSchema,
  upsertGuideRunRequestSchema,
} from '@all-things-mcp/contracts';
import { fetchGuideRuntime, runtimeErrorResponse } from '@/lib/runtime-server';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  if (!slugPattern.test(guideSlug)) {
    return Response.json({ error: 'Invalid Guide slug.' }, { status: 400 });
  }
  try {
    const response = await fetchGuideRuntime(`/v1/guide-runs/${guideSlug}`);
    if (response.status === 404) return new Response(null, { status: 404 });
    if (!response.ok) {
      return Response.json(
        { error: 'Unable to load Guide run.' },
        { status: response.status },
      );
    }
    return Response.json(guideRunSchema.parse(await response.json()));
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ guideSlug: string }> },
) {
  const { guideSlug } = await params;
  if (!slugPattern.test(guideSlug)) {
    return Response.json({ error: 'Invalid Guide slug.' }, { status: 400 });
  }
  const parsed = upsertGuideRunRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: 'Invalid Guide run.' }, { status: 400 });
  }
  try {
    const response = await fetchGuideRuntime(`/v1/guide-runs/${guideSlug}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) return Response.json(body, { status: response.status });
    return Response.json(guideRunSchema.parse(body));
  } catch (error) {
    return runtimeErrorResponse(error);
  }
}
