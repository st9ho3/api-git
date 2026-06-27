import { createHmac, timingSafeEqual } from "node:crypto";

type VerifyGitHubWebhookSignatureInput = {
  rawBody: Buffer;
  secret: string;
  signatureHeader: string;
};

export function verifyGitHubWebhookSignature({
  rawBody,
  secret,
  signatureHeader
}: VerifyGitHubWebhookSignatureInput): boolean {
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`
  );
  const actual = Buffer.from(signatureHeader);

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
