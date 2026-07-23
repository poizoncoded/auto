import type { DataSource } from "typeorm";

import { Category, PinCredential, Session, User } from "@/server/database/entities";
import { AppError } from "@/server/http/error";
import type { ChangePinInput, LoginInput, RegisterUserInput } from "@/server/http/schemas";
import { hashPin, verifyPin } from "@/server/security/pin";
import { createSession, type ActiveSession } from "@/server/security/session-store";

interface DefaultCategory {
  color: string;
  icon: string;
  name: string;
  sortOrder: number;
}

const defaultCategories: DefaultCategory[] = [
  { color: "#147D64", icon: "Fuel", name: "Топливо", sortOrder: 10 },
  { color: "#4B7BE5", icon: "Zap", name: "Зарядка", sortOrder: 20 },
  { color: "#D97706", icon: "Wrench", name: "Обслуживание", sortOrder: 30 },
  { color: "#8B5CF6", icon: "ParkingCircle", name: "Парковка", sortOrder: 40 },
  { color: "#D14343", icon: "ShieldCheck", name: "Страховка", sortOrder: 50 },
  { color: "#2563EB", icon: "Car", name: "Лизинг", sortOrder: 60 },
  { color: "#6B7280", icon: "Package", name: "Запчасти", sortOrder: 70 },
  { color: "#06B6D4", icon: "Sparkles", name: "Мойка", sortOrder: 80 },
  { color: "#A16207", icon: "Milestone", name: "Платные дороги", sortOrder: 90 }
];

export interface PublicUser {
  displayName: string;
  id: string;
}

function toPublicUser(user: User): PublicUser {
  return { displayName: user.displayName, id: user.id };
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function listUsers(database: DataSource): Promise<PublicUser[]> {
  const users = await database.getRepository(User).find({
    order: { displayName: "ASC" },
    select: { displayName: true, id: true }
  });

  return users.map(toPublicUser);
}

export async function getPublicUser(database: DataSource, userId: string): Promise<PublicUser> {
  const user = await database.getRepository(User).findOneBy({ id: userId, status: "active" });

  if (!user) {
    throw new AppError("Профиль недоступен", "NOT_FOUND", 404);
  }

  return toPublicUser(user);
}

export async function registerUser(
  database: DataSource,
  input: RegisterUserInput
): Promise<PublicUser> {
  const credential = await hashPin(input.pin);

  try {
    const user = await database.transaction(async (manager) => {
      const createdUser = await manager.save(
        manager.create(User, { displayName: input.displayName, status: "active" })
      );

      await manager.save(
        manager.create(PinCredential, { credential, userId: createdUser.id })
      );

      await manager.save(
        defaultCategories.map((category) =>
          manager.create(Category, { ...category, kind: "expense", userId: createdUser.id })
        )
      );

      return createdUser;
    });

    return toPublicUser(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("Профиль с таким именем уже существует", "DUPLICATE_USER", 409);
    }

    throw error;
  }
}

export async function authenticateUser(
  database: DataSource,
  input: LoginInput
): Promise<PublicUser> {
  const [user, credential] = await Promise.all([
    database.getRepository(User).findOneBy({ id: input.userId, status: "active" }),
    database.getRepository(PinCredential).findOneBy({ userId: input.userId })
  ]);

  if (!user || !credential || !(await verifyPin(input.pin, credential.credential))) {
    throw new AppError("Неверный PIN", "INVALID_PIN", 401);
  }

  return toPublicUser(user);
}

export async function changePin(
  database: DataSource,
  userId: string,
  input: ChangePinInput
): Promise<ActiveSession> {
  return database.transaction(async (manager) => {
    const repository = manager.getRepository(PinCredential);
    const credential = await repository.findOne({
      lock: { mode: "pessimistic_write" },
      where: { userId }
    });

    if (!credential || !(await verifyPin(input.currentPin, credential.credential))) {
      throw new AppError("Текущий PIN неверный", "INVALID_PIN", 401);
    }

    credential.credential = await hashPin(input.nextPin);
    await repository.save(credential);
    await manager.delete(Session, { userId });
    return createSession(manager, userId);
  });
}
