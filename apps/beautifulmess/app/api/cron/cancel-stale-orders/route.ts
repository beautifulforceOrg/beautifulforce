import { cancelStaleOrders } from "../../../../lib/jobs/cancel-stale-orders";

// Vercel Cron calls this on the schedule in vercel.json, sending
// `Authorization: Bearer $CRON_SECRET` -- see
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
// A manual curl/browser hit without that header is rejected the same way.
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET must be set");
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cancelledCount = await cancelStaleOrders();
  return Response.json({ cancelledCount });
}
