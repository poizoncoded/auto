import type { DataSource } from "typeorm";

import { Category, Expense } from "@/server/database/entities";
import { AppError } from "@/server/http/error";
import type { CreateCategoryInput } from "@/server/http/schemas";
import type { CategoryRecord } from "@/shared/api/auto";

import { toCategoryRecord } from "./finance-records";

function notFound(): AppError {
  return new AppError("Категория недоступна", "NOT_FOUND", 404);
}

export async function createCategory(
  database: DataSource,
  userId: string,
  input: CreateCategoryInput
): Promise<CategoryRecord> {
  const category = await database.getRepository(Category).save({
    ...input,
    kind: "expense",
    sortOrder: input.sortOrder ?? 999,
    userId
  });

  return toCategoryRecord(category);
}

export async function updateCategory(
  database: DataSource,
  userId: string,
  categoryId: string,
  input: Partial<CreateCategoryInput>
): Promise<CategoryRecord> {
  const repository = database.getRepository(Category);
  const category = await repository.findOneBy({ id: categoryId, userId });

  if (!category) {
    throw notFound();
  }

  Object.assign(category, input);
  return toCategoryRecord(await repository.save(category));
}

export async function deleteCategory(
  database: DataSource,
  userId: string,
  categoryId: string
): Promise<void> {
  const expenseExists = await database.getRepository(Expense).existsBy({ categoryId, userId });

  if (expenseExists) {
    throw new AppError("Нельзя удалить категорию с расходами", "CATEGORY_IN_USE", 409);
  }

  const result = await database.getRepository(Category).delete({ id: categoryId, userId });

  if (!result.affected) {
    throw notFound();
  }
}
