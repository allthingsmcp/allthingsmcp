import { jwtVerify } from "jose";
import {
  runtimePrincipalSchema,
  type RuntimePrincipal,
} from "@all-things-mcp/contracts";

export const runtimeTokenIssuer = "all-things-mcp-web";
export const runtimeTokenAudience = "all-things-mcp-guide-runtime";

export class RuntimeAuthenticationError extends Error {}

export async function verifyRuntimeToken(
  authorization: string | undefined,
  sharedSecret: string,
): Promise<RuntimePrincipal> {
  const [scheme, token] = authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    throw new RuntimeAuthenticationError("A bearer token is required.");
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(sharedSecret),
      {
        issuer: runtimeTokenIssuer,
        audience: runtimeTokenAudience,
        algorithms: ["HS256"],
      },
    );

    return runtimePrincipalSchema.parse({
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      image: payload.image ?? null,
    });
  } catch {
    throw new RuntimeAuthenticationError("The bearer token is invalid.");
  }
}
