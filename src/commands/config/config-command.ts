/**
 * Config command orchestrator - routes to appropriate handler
 */

import { configUICommand } from "./config-ui-command.js";
import { handleGet } from "./phases/get-handler.js";
import { handlePrefsResolve } from "./phases/prefs-resolve-handler.js";
import { handleSet } from "./phases/set-handler.js";
import { handleShow } from "./phases/show-handler.js";
import type { ConfigCommandOptions, ConfigUIOptions } from "./types.js";

export async function configCommand(
	action: string | undefined,
	keyOrOptions?: string | ConfigCommandOptions,
	valueOrOptions?: string | ConfigCommandOptions,
	options?: ConfigCommandOptions,
): Promise<void> {
	// Route to subcommand
	if (action === "ui") {
		// cac puts flags in the last parameter (options), not in positional args
		const uiOpts = options || (typeof keyOrOptions === "object" ? keyOrOptions : {});
		return configUICommand(uiOpts as ConfigUIOptions);
	}

	if (action === "get") {
		if (typeof keyOrOptions !== "string" || !keyOrOptions.trim()) {
			console.error("Usage: ck config get <key>");
			process.exitCode = 1;
			return;
		}
		return handleGet(keyOrOptions, options || {});
	}

	if (action === "set") {
		if (typeof keyOrOptions !== "string" || !keyOrOptions.trim()) {
			console.error("Usage: ck config set <key> <value>");
			process.exitCode = 1;
			return;
		}
		if (typeof valueOrOptions !== "string") {
			console.error("Usage: ck config set <key> <value>");
			process.exitCode = 1;
			return;
		}
		return handleSet(keyOrOptions, valueOrOptions, options || {});
	}

	if (action === "prefs") {
		const sub = typeof keyOrOptions === "string" ? keyOrOptions : undefined;
		if (sub !== "resolve") {
			console.error("Usage: ck config prefs resolve [--json]");
			process.exitCode = 1;
			return;
		}
		const prefsOpts = options || (typeof valueOrOptions === "object" ? valueOrOptions : {});
		return handlePrefsResolve(prefsOpts as ConfigCommandOptions);
	}

	if (action === "show") {
		const opts = typeof keyOrOptions === "object" ? keyOrOptions : options || {};
		return handleShow(opts);
	}

	// Handle unknown actions (not undefined)
	if (action && !["ui", "get", "set", "show", "prefs"].includes(action)) {
		console.error(`Unknown action: ${action}`);
		console.error("Valid actions: get, set, show, ui, prefs");
		process.exitCode = 1;
		return;
	}

	// Default: launch dashboard (bare `ck config`)
	const rawOpts = options || (typeof keyOrOptions === "object" ? keyOrOptions : {});
	const openOption = (rawOpts as Record<string, unknown>).open;
	const noOpen = rawOpts.noOpen === true || openOption === false ? true : undefined;
	const uiOpts: ConfigUIOptions = {
		port: rawOpts.port,
		noOpen,
		dev: rawOpts.dev,
		host: rawOpts.host,
	};
	return configUICommand(uiOpts);
}
