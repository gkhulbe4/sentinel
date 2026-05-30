import { describe, expect, it } from "vitest";
import {
  formatSol,
  formatUsd,
  lamportsToSol,
  relativeTime,
  shortenAddress,
  solscanTx,
  usdValue,
} from "./helpers";
import { LAMPORTS_PER_SOL } from "./constants";

describe("shortenAddress", () => {
  it("shortens long addresses with an ellipsis", () => {
    expect(shortenAddress("So11111111111111111111111111111111111111112")).toBe("So11…1112");
  });
  it("respects the chars argument", () => {
    expect(shortenAddress("So11111111111111111111111111111111111111112", 6)).toBe("So1111…111112");
  });
  it("leaves short strings untouched", () => {
    expect(shortenAddress("abc")).toBe("abc");
  });
});

describe("sol/usd math", () => {
  it("converts lamports to SOL", () => {
    expect(lamportsToSol(LAMPORTS_PER_SOL)).toBe(1);
    expect(lamportsToSol(LAMPORTS_PER_SOL / 2)).toBe(0.5);
  });
  it("computes usd value", () => {
    expect(usdValue(2, 150)).toBe(300);
  });
  it("formats SOL", () => {
    expect(formatSol(1.23456)).toBe("1.2346 SOL");
  });
  it("formats USD with cents above $1 and more precision below", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(formatUsd(0.1234)).toBe("$0.1234");
  });
});

describe("solscan links", () => {
  it("builds a tx url", () => {
    expect(solscanTx("abc")).toBe("https://solscan.io/tx/abc");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-01-01T00:00:00Z").getTime();
  it("formats seconds/minutes/hours/days", () => {
    expect(relativeTime("2025-12-31T23:59:50Z", now)).toBe("10s ago");
    expect(relativeTime("2025-12-31T23:55:00Z", now)).toBe("5m ago");
    expect(relativeTime("2025-12-31T21:00:00Z", now)).toBe("3h ago");
    expect(relativeTime("2025-12-29T00:00:00Z", now)).toBe("3d ago");
  });
  it("never goes negative", () => {
    expect(relativeTime("2026-01-01T00:00:10Z", now)).toBe("0s ago");
  });
});
