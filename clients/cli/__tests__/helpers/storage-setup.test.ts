import { describe, it, expect } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { getStateFilePath } from "@inspector/core/auth/node/storage-node.js";

describe("CLI test storage isolation (#2719)", () => {
  it("resolves the default OAuth state path inside os.tmpdir()", () => {
    const resolved = getStateFilePath();
    expect(resolved.startsWith(os.tmpdir())).toBe(true);
    expect(resolved).not.toContain(path.join(".mcp-inspector", "storage"));
  });
});
