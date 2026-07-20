import { getUserContext } from "@/server/data-access";
import { exportAllData } from "@/modules/settings/services/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full data export (RGPD portability) as a downloadable JSON file. */
export async function GET() {
  const ctx = await getUserContext();
  const data = await exportAllData(ctx, ctx.userId);
  const body = JSON.stringify(data, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="rapiat-donnees.json"`,
      "Cache-Control": "no-store",
    },
  });
}
