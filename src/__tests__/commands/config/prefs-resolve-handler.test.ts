/**
 * Tests for `ck config prefs resolve` handler
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handlePrefsResolve } from "@/commands/config/phases/prefs-resolve-handler.js";
import { CkConfigManager } from "@/domains/config/index.js";

async function captureStdout(fn: () => Promise<void>): Promise<string> {
	const chunks: string[] = [];
	const original = console.log;
	console.log = (...args: unknown[]) => chunks.push(args.map(String).join(" "));
	try {
		await fn();
	} finally {
		console.log = original;
	}
	return chunks.join("\n");
}

describe("handlePrefsResolve", () => {
	let tempDir: string;
	let originalCwd: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "ck-prefs-resolve-"));
		originalCwd = process.cwd();
		process.chdir(tempDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		try {
			rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// Windows file locks
		}
		process.exitCode = 0;
	});

	it("emits a schema_version 1 payload with merged prefs", async () => {
		mkdirSync(join(tempDir, ".claude"), { recursive: true });
		writeFileSync(
			join(tempDir, ".claude", ".ck.json"),
			JSON.stringify({ statusline: "compact", plan: { dateFormat: "YYMMDD" } }),
		);

		const text = await captureStdout(async () => handlePrefsResolve({ json: true }));
		const payload = JSON.parse(text);

		expect(payload.schema_version).toBe(1);
		expect(typeof payload.prefs).toBe("object");
		// Project config wins over the built-in defaults.
		expect(payload.prefs.statusline).toBe("compact");
		expect(payload.prefs.plan.dateFormat).toBe("YYMMDD");
	});

	it("merges global config under project config", async () => {
		// Global file: CkConfigManager reads ~/.claude/.ck.json, derived from
		// the home dir — point HOME/USERPROFILE at a temp home for the call.
		const fakeHome = join(tempDir, "home");
		mkdirSync(join(fakeHome, ".claude"), { recursive: true });
		mkdirSync(join(tempDir, ".claude"), { recursive: true });
		writeFileSync(
			join(fakeHome, ".claude", ".ck.json"),
			JSON.stringify({ statusline: "full", docs: { maxLoc: 800 } }),
		);
		writeFileSync(join(tempDir, ".claude", ".ck.json"), JSON.stringify({ statusline: "compact" }));

		const prevHome = process.env.HOME;
		const prevUserProfile = process.env.USERPROFILE;
		process.env.HOME = fakeHome;
		process.env.USERPROFILE = fakeHome;
		try {
			const text = await captureStdout(async () => handlePrefsResolve({ json: true }));
			const payload = JSON.parse(text);
			expect(payload.prefs.statusline).toBe("compact"); // project wins
			expect(payload.prefs.docs.maxLoc).toBe(800); // global fills the rest
		} finally {
			if (prevHome === undefined) process.env.HOME = undefined;
			else process.env.HOME = prevHome;
			if (prevUserProfile === undefined) process.env.USERPROFILE = undefined;
			else process.env.USERPROFILE = prevUserProfile;
		}
	});

	it("strips the $schema editor key from prefs", async () => {
		mkdirSync(join(tempDir, ".claude"), { recursive: true });
		writeFileSync(
			join(tempDir, ".claude", ".ck.json"),
			JSON.stringify({ $schema: "./schemas/ck-config.schema.json", statusline: "compact" }),
		);

		const text = await captureStdout(async () => handlePrefsResolve({ json: true }));
		const payload = JSON.parse(text);
		expect(payload.prefs.$schema).toBeUndefined();
		expect(payload.prefs.statusline).toBe("compact");
	});

	it("without --json prints prefs only (no envelope)", async () => {
		const text = await captureStdout(async () => handlePrefsResolve({}));
		const parsed = JSON.parse(text);
		expect(parsed.schema_version).toBeUndefined();
		expect(typeof parsed).toBe("object");
	});

	it("matches CkConfigManager.loadFull output", async () => {
		const text = await captureStdout(async () => handlePrefsResolve({ json: true }));
		const payload = JSON.parse(text);
		const { config } = await CkConfigManager.loadFull(tempDir);
		expect(payload.prefs).toEqual(config);
	});
});
