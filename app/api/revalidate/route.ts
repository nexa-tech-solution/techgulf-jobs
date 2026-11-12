import { revalidateTag } from "next/cache";

// Called by scripts/daily.mjs after the job sync, so pages refresh only when data changed.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  revalidateTag("catalog", "max");
  return Response.json({ revalidated: true });
}
