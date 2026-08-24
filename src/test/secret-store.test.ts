import { describe, expect, it } from "vitest";
import { FakeSecretStore, redactSecrets } from "@/ai/secretStore";

describe("SecretStore", () => {
  it("fulfills save/get/has/delete fake contract", async () => {
    const store = new FakeSecretStore();
    await expect(store.hasSecret("fake/provider")).resolves.toBe(false);
    await store.saveSecret("fake/provider", "sk_abcdefghijklmnop");
    await expect(store.getSecret("fake/provider")).resolves.toBe("sk_abcdefghijklmnop");
    await store.deleteSecret("fake/provider");
    await expect(store.hasSecret("fake/provider")).resolves.toBe(false);
  });

  it("redacts common secret forms", () => {
    expect(redactSecrets("Authorization: Bearer sk_abcdefghijklmnop")).not.toContain("sk_abcdefghijklmnop");
    expect(redactSecrets("api_key=abcdefghijklmnop")).not.toContain("abcdefghijklmnop");
  });
});
