import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { AppError } from "@/server/http/error";
import { api, json, readJson } from "@/server/http/response";
import { recordIdSchema, reviewReceiptSchema } from "@/server/http/schemas";
import { reviewReceipt } from "@/server/services/finance";

function readReceiptId(value: string | undefined): string {
  const parsed = recordIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new AppError("Некорректный идентификатор чека", "INVALID_INPUT");
  }

  return parsed.data;
}

export const POST = api(async (context) => {
  const userId = await requireUser(context);
  const expense = await reviewReceipt(
    await getDataSource(),
    userId,
    readReceiptId(context.params.id),
    await readJson(context.request, reviewReceiptSchema)
  );
  return json({ expense }, 201);
});
