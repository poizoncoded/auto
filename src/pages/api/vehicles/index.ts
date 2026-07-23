import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { createVehicleSchema } from "@/server/http/schemas";
import { createVehicle, getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  const { vehicles } = await getBootstrap(await getDataSource(), userId);
  return json({ vehicles });
});

export const POST = api(async (context) => {
  const userId = await requireUser(context);
  const vehicle = await createVehicle(
    await getDataSource(),
    userId,
    await readJson(context.request, createVehicleSchema)
  );
  return json({ vehicle }, 201);
});
