import { getDataSource } from "@/server/database/data-source";
import { api, json } from "@/server/http/response";
import { listUsers } from "@/server/services/auth";

export const GET = api(async () => json({ users: await listUsers(await getDataSource()) }));
