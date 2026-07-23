import { describe, expect, it } from "vitest";

import { parseReceiptQr } from "./receipt";

describe("parseReceiptQr", () => {
  it("normalizes a fiscal QR payload for a reviewed receipt", () => {
    expect(
      parseReceiptQr(
        "t=20260719T1200&s=456.78&fn=9282440301234567&i=12345&fp=9876543210&n=1"
      )
    ).toEqual({
      fiscalDocumentNumber: "12345",
      fiscalDriveNumber: "9282440301234567",
      fiscalSign: "9876543210",
      issuedAt: "2026-07-19T12:00",
      operationType: "1",
      totalKopecks: 45678
    });
  });

  it("rejects a payload without the fiscal data needed for a review", () => {
    expect(() => parseReceiptQr("t=20260719T1200&s=456.78")).toThrow(
      "Receipt QR payload is missing fiscal data"
    );
  });

  it("accepts a valid leap-day timestamp and supported operation boundary", () => {
    expect(
      parseReceiptQr(
        "t=20240229T235959&s=1.00&fn=9282440301234567&i=1234567890&fp=9876543210&n=4"
      )
    ).toMatchObject({ issuedAt: "2024-02-29T23:59", operationType: "4" });
  });

  it("accepts the application maximum receipt total", () => {
    expect(
      parseReceiptQr(
        "t=20260720T1200&s=20000000.00&fn=9282440301234567&i=12345&fp=9876543210&n=1"
      )
    ).toMatchObject({ totalKopecks: 2_000_000_000 });
  });

  it("rejects a receipt total one kopeck above the application maximum", () => {
    expect(() =>
      parseReceiptQr(
        "t=20260720T1200&s=20000000.01&fn=9282440301234567&i=12345&fp=9876543210&n=1"
      )
    ).toThrow("Receipt QR payload total is too large");
  });

  it.each([
    "20230229T1200",
    "20260431T1200",
    "20260720T2400",
    "20260720T1260",
    "20260720T125960"
  ])("rejects impossible fiscal timestamp %s", (timestamp) => {
    expect(() =>
      parseReceiptQr(
        `t=${timestamp}&s=1.00&fn=9282440301234567&i=12345&fp=9876543210&n=1`
      )
    ).toThrow("Receipt QR payload has an invalid date");
  });

  it.each([
    ["short fiscal drive", "fn=928244030123456"],
    ["long fiscal drive", "fn=92824403012345678"],
    ["long document number", "i=12345678901"],
    ["long fiscal sign", "fp=12345678901"],
    ["unsupported operation", "n=5"],
    ["multi-digit operation", "n=01"],
    ["non-digit fiscal value", "fp=1234x"]
  ])("rejects %s", (_label, replacement) => {
    const fields = {
      fn: "fn=9282440301234567",
      fp: "fp=9876543210",
      i: "i=12345",
      n: "n=1"
    };
    const field = replacement.slice(0, replacement.indexOf("=")) as keyof typeof fields;
    fields[field] = replacement;

    expect(() =>
      parseReceiptQr(
        `t=20260720T1200&s=1.00&${fields.fn}&${fields.i}&${fields.fp}&${fields.n}`
      )
    ).toThrow();
  });
});
