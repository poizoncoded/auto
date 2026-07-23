import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { AppError } from "@/server/http/error";
import { api, json, readJson } from "@/server/http/response";
import { recordIdSchema, updateVehicleSchema } from "@/server/http/schemas";
import { deleteVehicle, updateVehicle } from "@/server/services/finance";

function readVehicleId(value: string | undefined): string {
  const parsed = recordIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new AppError("Некорректный идентификатор транспорта", "INVALID_INPUT");
  }

  return parsed.data;
}

export const PATCH = api(async (context) => {
  const userId = await requireUser(context);
  const vehicle = await updateVehicle(
    await getDataSource(),
    userId,
    readVehicleId(context.params.id),
    await readJson(context.request, updateVehicleSchema)
  );
  return json({ vehicle });
});

export const DELETE = api(async (context) => {
  const userId = await requireUser(context);
  await deleteVehicle(await getDataSource(), userId, readVehicleId(context.params.id));
  return json({ ok: true });
});
