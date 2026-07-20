import { describe, it, expect } from "vitest";

import {
  emptyToNull,
  buildCategoryTree,
} from "@/modules/categories/domain/category.rules";

describe("emptyToNull", () => {
  it("returns null for empty / whitespace", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull("   ")).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
  });
  it("trims and keeps non-empty values", () => {
    expect(emptyToNull("  hello ")).toBe("hello");
  });
});

describe("buildCategoryTree", () => {
  const cats = [
    { id: "a", name: "Logement", parentId: null },
    { id: "b", name: "Loyer", parentId: "a" },
    { id: "c", name: "Charges", parentId: "a" },
    { id: "d", name: "Transport", parentId: null },
    { id: "e", name: "Orphan", parentId: "zzz" }, // missing parent -> treated as root
  ];

  it("groups children under their parent and keeps roots", () => {
    const tree = buildCategoryTree(cats);
    const logement = tree.find((t) => t.node.id === "a");
    expect(logement?.children.map((c) => c.id)).toEqual(["b", "c"]);
    const roots = tree.map((t) => t.node.id);
    expect(roots).toContain("d");
    expect(roots).toContain("e"); // orphan promoted to root
    expect(roots).not.toContain("b");
  });
});
