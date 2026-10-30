/**
 * Handler for `ck config prefs resolve` command.
 *
 * Prints the fully resolved kit configuration (defaults <- global
 * ~/.claude/.ck.json <- project .claude/.ck.json) as a JSON payload. Hook
 * scripts that cannot parse config files themselves (the kit ships with no
 * YAML/JSON dependencies beyond node stdlib) call this command instead of
 * re-implementing the merge, keyed by the payload's schema_version.
 */

import { CkConfigManager } from "@/domains/config/index.js";
import type { ConfigCommandOptions } from "../types.js";

const SUPPORTED_SCHEMA_VERSION = 1;

export async function handlePrefsResolve(options: ConfigCommandOptions): Promise<void> {
	const projectDir = process.cwd();
	const { config } = await CkConfigManager.loadFull(projectDir);

	// $schema is editor sugar, not a preference.
	const { $schema: _schema, ...prefs } = config as Record<string, unknown>;

	if (options.json) {
		console.log(JSON.stringify({ schema_version: SUPPORTED_SCHEMA_VERSION, prefs }, null, 2));
	} else {
		console.log(JSON.stringify(prefs, null, 2));
	}
}
