import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGitHubWebhookSignature } from "../src/github-webhook-signature.js";

describe("verifyGitHubWebhookSignature", () => {
  it("returns true for a matching GitHub SHA-256 signature", () => {
    const rawBody = Buffer.from(JSON.stringify({ zen: "ship it" }));
    const signatureHeader = `sha256=${createHmac("sha256", "topsecret")
      .update(rawBody)
      .digest("hex")}`;

    const result = verifyGitHubWebhookSignature({
      rawBody,
      secret: "topsecret",
      signatureHeader
    });

    expect(result).toBe(true);
  });

  it("returns false for a non-matching signature", () => {
    const rawBody = Buffer.from(JSON.stringify({ zen: "ship it" }));

    const result = verifyGitHubWebhookSignature({
      rawBody,
      secret: "topsecret",
      signatureHeader: "sha256=definitely-wrong"
    });

    expect(result).toBe(false);
  });
});
