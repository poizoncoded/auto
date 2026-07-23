import { maximumAmountKopecks } from "./amount";
import { isValidCalendarDate, isValidClockTime } from "./date";

export interface ReceiptQrPayload {
  fiscalDocumentNumber: string;
  fiscalDriveNumber: string;
  fiscalSign: string;
  issuedAt: string;
  operationType: string;
  totalKopecks: number;
}

const fiscalDatePattern = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(?:(\d{2}))?$/;
const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const fiscalDocumentPattern = /^\d{1,10}$/;
const fiscalDrivePattern = /^\d{16}$/;
const fiscalSignPattern = /^\d{1,10}$/;
const operationTypePattern = /^[1-4]$/;

function parseTotalKopecks(amount: string): number {
  if (!amountPattern.test(amount)) {
    throw new Error("Receipt QR payload has an invalid total");
  }

  const [rubles, fraction = ""] = amount.split(".");
  const totalKopecks = Number(`${rubles}${fraction.padEnd(2, "0")}`);

  if (!Number.isSafeInteger(totalKopecks) || totalKopecks > maximumAmountKopecks) {
    throw new Error("Receipt QR payload total is too large");
  }

  return totalKopecks;
}

function parseIssuedAt(value: string): string {
  const match = fiscalDatePattern.exec(value);

  if (!match) {
    throw new Error("Receipt QR payload has an invalid date");
  }

  const [, year, month, day, hour, minute, second = "00"] = match;

  if (
    !isValidCalendarDate(Number(year), Number(month), Number(day)) ||
    !isValidClockTime(Number(hour), Number(minute), Number(second))
  ) {
    throw new Error("Receipt QR payload has an invalid date");
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function parseReceiptQr(rawPayload: string): ReceiptQrPayload {
  const payload = new URLSearchParams(rawPayload.trim().replace(/^\?/, ""));
  const fiscalDriveNumber = payload.get("fn");
  const fiscalDocumentNumber = payload.get("i");
  const fiscalSign = payload.get("fp");
  const operationType = payload.get("n");
  const issuedAt = payload.get("t");
  const total = payload.get("s");

  if (
    !fiscalDriveNumber ||
    !fiscalDocumentNumber ||
    !fiscalSign ||
    !operationType ||
    !issuedAt ||
    !total ||
    !fiscalDrivePattern.test(fiscalDriveNumber) ||
    !fiscalDocumentPattern.test(fiscalDocumentNumber) ||
    !fiscalSignPattern.test(fiscalSign) ||
    !operationTypePattern.test(operationType)
  ) {
    throw new Error("Receipt QR payload is missing fiscal data");
  }

  return {
    fiscalDocumentNumber,
    fiscalDriveNumber,
    fiscalSign,
    issuedAt: parseIssuedAt(issuedAt),
    operationType,
    totalKopecks: parseTotalKopecks(total)
  };
}
