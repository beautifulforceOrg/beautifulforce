import { NextResponse } from "next/server";
import { getCollections } from "../../../../lib/catalog";

export async function GET() {
  const collections = await getCollections();
  return NextResponse.json(collections.map((collection) => ({ id: collection.id, slug: collection.slug, name: collection.name })));
}
