import QRCode from "qrcode";
import { describe, expect, it } from "vitest";

import { decodeQrPixels } from "./receipt-image";
import { parseReceiptQr } from "@/shared/lib/receipt";

const fiscalPayload = "t=20260721T2152&s=1234.56&fn=9282440300999999&i=12345&fp=1234567890&n=1";

interface ScreenshotOptions {
  dark?: number;
  height?: number;
  light?: number;
  quarterTurns?: 0 | 1 | 2 | 3;
  scale?: number;
  width?: number;
}

function setPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  color: number
): void {
  const offset = (y * width + x) * 4;
  data[offset] = color;
  data[offset + 1] = color;
  data[offset + 2] = color;
  data[offset + 3] = 255;
}

function rotateModule(row: number, column: number, size: number, quarterTurns: number): [number, number] {
  switch (quarterTurns) {
    case 1:
      return [column, size - row - 1];
    case 2:
      return [size - row - 1, size - column - 1];
    case 3:
      return [size - column - 1, row];
    default:
      return [row, column];
  }
}

function fiscalQrScreenshot({
  dark = 0,
  height = 410,
  light = 255,
  quarterTurns = 0,
  scale = 4,
  width = 514
}: ScreenshotOptions = {}): { data: Uint8ClampedArray; height: number; width: number } {
  const qr = QRCode.create(fiscalPayload, { errorCorrectionLevel: "M" });
  const quietZone = 4;
  const symbolSize = qr.modules.size + quietZone * 2;
  const renderedSize = symbolSize * scale;
  const startX = Math.floor((width - renderedSize) / 2);
  const startY = 38;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(data, width, x, y, 255);
    }
  }

  for (let row = 0; row < symbolSize; row += 1) {
    for (let column = 0; column < symbolSize; column += 1) {
      const moduleRow = row - quietZone;
      const moduleColumn = column - quietZone;
      const [rotatedRow, rotatedColumn] = rotateModule(
        moduleRow,
        moduleColumn,
        qr.modules.size,
        quarterTurns
      );
      const isDark =
        moduleRow >= 0 &&
        moduleColumn >= 0 &&
        moduleRow < qr.modules.size &&
        moduleColumn < qr.modules.size &&
        qr.modules.get(rotatedRow, rotatedColumn) === 1;

      for (let pixelY = 0; pixelY < scale; pixelY += 1) {
        for (let pixelX = 0; pixelX < scale; pixelX += 1) {
          setPixel(
            data,
            width,
            startX + column * scale + pixelX,
            startY + row * scale + pixelY,
            isDark ? dark : light
          );
        }
      }
    }
  }

  // Screenshot-like text below the code must not be mistaken for QR modules.
  const textTop = startY + renderedSize + 20;
  for (const [line, lineWidth] of [190, 310, 260].entries()) {
    for (let y = textTop + line * 30; y < Math.min(height, textTop + line * 30 + 8); y += 1) {
      for (let x = Math.floor((width - lineWidth) / 2); x < Math.floor((width + lineWidth) / 2); x += 1) {
        setPixel(data, width, x, y, 150);
      }
    }
  }

  return { data, height, width };
}

describe("receipt image QR decoding", () => {
  it("decodes a Russian fiscal QR from a screenshot-style image", () => {
    const image = fiscalQrScreenshot();
    const decoded = decodeQrPixels(image.data, image.width, image.height);

    expect(decoded).toBe(fiscalPayload);
    expect(parseReceiptQr(decoded ?? "")).toEqual({
      fiscalDocumentNumber: "12345",
      fiscalDriveNumber: "9282440300999999",
      fiscalSign: "1234567890",
      issuedAt: "2026-07-21T21:52",
      operationType: "1",
      totalKopecks: 123456
    });
  });

  it("decodes a compact fiscal QR surrounded by screenshot content", () => {
    const image = fiscalQrScreenshot({ scale: 2 });

    expect(decodeQrPixels(image.data, image.width, image.height)).toBe(fiscalPayload);
  });

  it("decodes a rotated fiscal QR at the FNS minimum 40% contrast", () => {
    const image = fiscalQrScreenshot({ dark: 128, light: 230, quarterTurns: 1 });

    expect(decodeQrPixels(image.data, image.width, image.height)).toBe(fiscalPayload);
  });

  it("returns null when an image contains no QR code", () => {
    expect(decodeQrPixels(new Uint8ClampedArray(32 * 32 * 4), 32, 32)).toBeNull();
  });
});
