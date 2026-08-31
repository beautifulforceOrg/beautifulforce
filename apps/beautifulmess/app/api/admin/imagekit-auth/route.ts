import ImageKit from "imagekit";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";

// The client-side ImageKit upload SDK needs {token, expire, signature}
// via a plain fetch() before it can upload directly to ImageKit's own
// endpoint -- a route handler, not a Server Action, since the SDK expects
// plain JSON, not an RSC payload. IMAGEKIT_PRIVATE_KEY is read only here,
// server-side -- it must never reach a client bundle.
export async function GET(): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!privateKey || !publicKey || !urlEndpoint) {
    return new Response("ImageKit is not configured", { status: 500 });
  }

  const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
  const authParams = imagekit.getAuthenticationParameters();

  return Response.json({ ...authParams, publicKey, urlEndpoint });
}
