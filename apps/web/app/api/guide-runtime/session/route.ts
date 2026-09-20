import { runtimeSessionResponseSchema } from '@all-things-mcp/contracts';
import {
  AuthenticationRequiredError,
  fetchGuideRuntime,
  RuntimeConfigurationError,
} from '@/lib/runtime-server';

export async function GET() {
  try {
    const response = await fetchGuideRuntime('/v1/me');
    if (!response.ok) {
      return Response.json(
        { error: 'Guide Runtime rejected the session.' },
        { status: response.status },
      );
    }
    return Response.json(
      runtimeSessionResponseSchema.parse(await response.json()),
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
