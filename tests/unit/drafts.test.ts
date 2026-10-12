import { describe, it, expect } from "vitest";
import { restoreDraft } from "../../src/domain/drafts";
describe("draft version provenance", () => {
  it("keeps the original baseline and version after a newer server response", () => {
    const stored = {
      value: { name: "My old edit" },
      baseline: { name: "Original" },
      baseVersion: 2,
    };
    expect(
      restoreDraft(JSON.stringify(stored), { name: "Other staff update" }, 3),
    ).toEqual(stored);
  });
  it("does not adopt an unversioned legacy draft as a current version", () => {
    expect(
      restoreDraft(
        JSON.stringify({ name: "Old edit" }),
        { name: "Current" },
        3,
      ),
    ).toEqual({
      value: { name: "Current" },
      baseline: { name: "Current" },
      baseVersion: 3,
    });
  });
});
