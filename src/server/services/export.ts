import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { BootstrapData, ExpenseRecord } from "./finance";

function isFormulaLike(text: string): boolean {
  let index = 0;

  while (index < text.length) {
    const character = text[index]!;
    const code = character.charCodeAt(0);

    if (!/\s/u.test(character) && code > 31 && (code < 127 || code > 159)) {
      break;
    }

    index += 1;
  }

  return ["=", "+", "-", "@"].includes(text[index] ?? "");
}

function escapeCsv(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  const safeText = isFormulaLike(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function toCsvRow(expense: ExpenseRecord): string {
  return [
    expense.id,
    expense.occurredOn,
    expense.categoryName,
    expense.merchant,
    (expense.amountKopecks / 100).toFixed(2),
    expense.vehicleId,
    expense.note
  ]
    .map(escapeCsv)
    .join(",");
}

export async function exportExpensesCsv(data: BootstrapData): Promise<string> {
  const chunks: Buffer[] = [];

  await pipeline(
    Readable.from(data.expenses),
    async function* encodeRows(source) {
      yield "id,date,category,merchant,amount_rub,vehicle_id,note\n";

      for await (const expense of source) {
        yield `${toCsvRow(expense)}\n`;
      }
    },
    new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    })
  );

  return Buffer.concat(chunks).toString("utf8");
}
