/**
 * Keeps CLI tests off the developer's real OAuth state (#2719).
 *
 * Several CLI tests invoke `runCli()` in-process against HTTP transports
 * (`oauth-runner.test.ts`, `programmatic-ergonomics.test.ts`, `stored-auth.test.ts`).
 * Without an override, `storage-node.ts` falls back to `~/.mcp-inspector/storage/oauth.json`,
 * so running tests could rewrite the stored OAuth state of whoever ran them.
 * It also made concurrent test workers share one file, risking contention and flakes.
 *
 * Mirrors `clients/web/src/test/integrationStorageSetup.ts` (#2670 / #2677):
 * points `MCP_INSPECTOR_OAUTH_STATE_PATH` at a per-test-file temp directory,
 * cleans it up in `afterAll()`, and guards with `beforeEach()` so any regression
 * fails before touching real user state.
 */

import { afterAll, afterEach, beforeEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getStateFilePath } from "@inspector/core/auth/node/storage-node.js";

const isolatedStorageDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "mcp-inspector-cli-oauth-"),
);

const isolatedOAuthStatePath = path.join(isolatedStorageDir, "oauth.json");

process.env.MCP_INSPECTOR_OAUTH_STATE_PATH = isolatedOAuthStatePath;

beforeEach(() => {
  const resolved = getStateFilePath();
  if (
    !resolved.startsWith(os.tmpdir()) ||
    resolved.includes(path.join(".mcp-inspector", "storage"))
  ) {
    throw new Error(
      `Default OAuth store resolves to ${resolved}, outside the test temp ` +
        `directory; storage-setup.ts is not in effect (#2719).`,
    );
  }
});

afterEach(() => {
  process.env.MCP_INSPECTOR_OAUTH_STATE_PATH = isolatedOAuthStatePath;
});

afterAll(() => {
  fs.rmSync(isolatedStorageDir, { recursive: true, force: true });
});
