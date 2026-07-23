import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  BootstrapData,
  CategoryInput,
  CategoryRecord,
  ExpenseInput,
  ExpenseRecord,
  ReceiptRecord,
  VehicleInput,
  VehicleRecord
} from "@/shared/api/auto";
import { requestJson } from "@/shared/api/auto";

import { getBrowserStorage } from "./browser-storage";
import {
  loadQueuedExpenses,
  saveQueuedExpenses,
  shouldRetryExpense,
  submitNewExpense,
  type QueuedExpense
} from "./expense-queue";

export type WorkspaceDataStatus = "error" | "idle" | "loading" | "ready";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось выполнить запрос";
}

function replaceRecord<T extends { id: string }>(records: T[], record: T): T[] {
  return records.some((item) => item.id === record.id)
    ? records.map((item) => (item.id === record.id ? record : item))
    : [record, ...records];
}

function readQueue(storage: Storage | null, userId: string): QueuedExpense[] {
  return storage ? loadQueuedExpenses(storage, userId) : [];
}

function writeQueue(storage: Storage | null, userId: string, queue: QueuedExpense[]): void {
  if (!storage) {
    throw new Error("Браузер запретил локальное сохранение. Подключитесь к сети и повторите.");
  }

  try {
    saveQueuedExpenses(storage, userId, queue);
  } catch {
    throw new Error("Не удалось сохранить расход на устройстве. Подключитесь к сети и повторите.");
  }
}

export function useWorkspaceData(userId: string | null) {
  const storage = useMemo(() => getBrowserStorage(), []);
  const [data, setData] = useState<BootstrapData | null>(null);
  const [status, setStatus] = useState<WorkspaceDataStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [snapshotUserId, setSnapshotUserId] = useState<string | null>(null);

  const fetchBootstrap = useCallback(async (): Promise<BootstrapData> => {
    if (!userId) {
      throw new Error("Нужна разблокировка профиля");
    }

    return requestJson<BootstrapData>("/api/bootstrap");
  }, [userId]);

  const refreshData = useCallback(async (): Promise<BootstrapData> => {
    setStatus("loading");

    try {
      const bootstrap = await fetchBootstrap();
      setData(bootstrap);
      setError(null);
      setSnapshotUserId(userId);
      setStatus("ready");
      return bootstrap;
    } catch (caught) {
      setError(errorMessage(caught));
      setSnapshotUserId(userId);
      setStatus("error");
      throw caught;
    }
  }, [fetchBootstrap, userId]);

  const reconcile = useCallback(async (): Promise<void> => {
    try {
      const bootstrap = await fetchBootstrap();
      setData(bootstrap);
      setError(null);
      setSnapshotUserId(userId);
      setStatus("ready");
    } catch {
      setNotice("Изменение сохранено. Не удалось обновить весь список; повторим позже.");
    }
  }, [fetchBootstrap, userId]);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      return undefined;
    }

    void fetchBootstrap()
      .then((bootstrap) => {
        if (!cancelled) {
          setData(bootstrap);
          setError(null);
          setNotice(null);
          setQueuedCount(readQueue(storage, userId).length);
          setSnapshotUserId(userId);
          setStatus("ready");
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(errorMessage(caught));
          setNotice(null);
          setQueuedCount(readQueue(storage, userId).length);
          setSnapshotUserId(userId);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchBootstrap, storage, userId]);

  const flushQueuedExpenses = useCallback(async (): Promise<void> => {
    if (!userId || !storage || !navigator.onLine) {
      return;
    }

    const queued = readQueue(storage, userId);

    if (!queued.length) {
      setQueuedCount(0);
      return;
    }

    const remaining: QueuedExpense[] = [];
    let rejected = 0;
    let sent = 0;

    for (const expense of queued) {
      try {
        await requestJson("/api/expenses", { body: expense, method: "POST" });
        sent += 1;
      } catch (caught) {
        if (shouldRetryExpense(caught)) {
          remaining.push(expense);
        } else {
          rejected += 1;
        }
      }
    }

    try {
      writeQueue(storage, userId, remaining);
      setQueuedCount(remaining.length);
    } catch (caught) {
      setNotice(errorMessage(caught));
      return;
    }

    if (sent) {
      await reconcile();
    }

    if (sent || rejected) {
      const messages = [
        ...(sent ? [`Синхронизировано записей: ${sent}.`] : []),
        ...(rejected ? [`Отклонено записей: ${rejected}. Проверьте введённые данные.`] : [])
      ];
      setNotice(messages.join(" "));
    }
  }, [reconcile, storage, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const sync = (): void => {
      void flushQueuedExpenses();
    };
    window.addEventListener("online", sync);
    const timeoutId = window.setTimeout(sync, 0);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("online", sync);
    };
  }, [flushQueuedExpenses, userId]);

  const saveExpense = useCallback(
    async (input: ExpenseInput, expenseId?: string): Promise<void> => {
      if (!userId) {
        throw new Error("Нужна разблокировка профиля");
      }

      if (expenseId) {
        const response = await requestJson<{ expense: ExpenseRecord }>(`/api/expenses/${expenseId}`, {
          body: input,
          method: "PATCH"
        });
        setData((current) =>
          current
            ? { ...current, expenses: replaceRecord(current.expenses, response.expense) }
            : current
        );
        await reconcile();
        return;
      }

      let savedExpense: ExpenseRecord | null = null;
      const result = await submitNewExpense(input, {
        isOnline: navigator.onLine,
        queue: (expense) => {
          const queued = readQueue(storage, userId);
          const nextQueue = [
            ...queued.filter((record) => record.clientMutationId !== expense.clientMutationId),
            expense
          ];
          writeQueue(storage, userId, nextQueue);
          setQueuedCount(nextQueue.length);
        },
        send: async (expense) => {
          const response = await requestJson<{ expense: ExpenseRecord }>("/api/expenses", {
            body: expense,
            method: "POST"
          });
          savedExpense = response.expense;
        }
      });

      if (result === "queued") {
        setNotice("Расход сохранён на устройстве и ждёт подключения.");
        return;
      }

      if (savedExpense) {
        const expense = savedExpense as ExpenseRecord;
        setData((current) =>
          current
            ? {
                ...current,
                expenses: [expense, ...current.expenses.filter((item) => item.id !== expense.id)]
              }
            : current
        );
      }
      await reconcile();
    },
    [reconcile, storage, userId]
  );

  const deleteExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      await requestJson(`/api/expenses/${expenseId}`, { method: "DELETE" });
      setData((current) =>
        current
          ? { ...current, expenses: current.expenses.filter((expense) => expense.id !== expenseId) }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const createReceipt = useCallback(
    async (rawPayload: string): Promise<ReceiptRecord> => {
      const response = await requestJson<{ receipt: ReceiptRecord }>("/api/receipts", {
        body: { rawPayload },
        method: "POST"
      });
      setData((current) =>
        current
          ? { ...current, receipts: replaceRecord(current.receipts, response.receipt) }
          : current
      );
      await reconcile();
      return response.receipt;
    },
    [reconcile]
  );

  const reviewReceipt = useCallback(
    async (receiptId: string, input: ExpenseInput): Promise<void> => {
      const response = await requestJson<{ expense: ExpenseRecord }>(
        `/api/receipts/${receiptId}/review`,
        { body: input, method: "POST" }
      );
      setData((current) =>
        current
          ? {
              ...current,
              expenses: replaceRecord(current.expenses, response.expense),
              receipts: current.receipts.map((receipt) =>
                receipt.id === receiptId ? { ...receipt, status: "reviewed" } : receipt
              )
            }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const createVehicle = useCallback(
    async (input: VehicleInput): Promise<void> => {
      const response = await requestJson<{ vehicle: VehicleRecord }>("/api/vehicles", {
        body: input,
        method: "POST"
      });
      setData((current) =>
        current
          ? { ...current, vehicles: [...current.vehicles, response.vehicle] }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const updateVehicle = useCallback(
    async (vehicleId: string, input: Partial<VehicleInput> & { archived?: boolean }): Promise<void> => {
      const response = await requestJson<{ vehicle: VehicleRecord }>(`/api/vehicles/${vehicleId}`, {
        body: input,
        method: "PATCH"
      });
      setData((current) =>
        current
          ? { ...current, vehicles: replaceRecord(current.vehicles, response.vehicle) }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const deleteVehicle = useCallback(
    async (vehicleId: string): Promise<void> => {
      await requestJson(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
      setData((current) =>
        current
          ? { ...current, vehicles: current.vehicles.filter((vehicle) => vehicle.id !== vehicleId) }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const createCategory = useCallback(
    async (input: CategoryInput): Promise<void> => {
      const response = await requestJson<{ category: CategoryRecord }>("/api/categories", {
        body: input,
        method: "POST"
      });
      setData((current) =>
        current
          ? {
              ...current,
              categories: replaceRecord(current.categories, response.category).sort(
                (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ru")
              )
            }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const updateCategory = useCallback(
    async (categoryId: string, input: Partial<CategoryInput>): Promise<void> => {
      const response = await requestJson<{ category: CategoryRecord }>(`/api/categories/${categoryId}`, {
        body: input,
        method: "PATCH"
      });
      setData((current) =>
        current
          ? {
              ...current,
              categories: replaceRecord(current.categories, response.category).sort(
                (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ru")
              )
            }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<void> => {
      await requestJson(`/api/categories/${categoryId}`, { method: "DELETE" });
      setData((current) =>
        current
          ? {
              ...current,
              categories: current.categories.filter((category) => category.id !== categoryId)
            }
          : current
      );
      await reconcile();
    },
    [reconcile]
  );

  const changePin = useCallback(async (currentPin: string, nextPin: string): Promise<void> => {
    await requestJson("/api/auth/pin", {
      body: { currentPin, nextPin },
      method: "PATCH"
    });
  }, []);

  const hasCurrentSnapshot = Boolean(userId) && snapshotUserId === userId;

  return {
    changePin,
    clearNotice: () => setNotice(null),
    createCategory,
    createReceipt,
    createVehicle,
    data: hasCurrentSnapshot ? data : null,
    deleteCategory,
    deleteExpense,
    deleteVehicle,
    error: hasCurrentSnapshot ? error : null,
    notice: hasCurrentSnapshot ? notice : null,
    queuedCount: hasCurrentSnapshot ? queuedCount : 0,
    refreshData,
    reviewReceipt,
    saveExpense,
    status: !userId ? "idle" : hasCurrentSnapshot ? status : "loading",
    updateCategory,
    updateVehicle
  };
}
