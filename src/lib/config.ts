import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Config, RepoInfo } from "../types.js";

class ConfigManager {
	private configDir: string;
	private configFile: string;

	constructor() {
		this.configDir = path.join(os.homedir(), ".ai-git-wizard");
		this.configFile = path.join(this.configDir, "config.json");
		this.ensureConfigDir();
	}

	private ensureConfigDir(): void {
		if (!fs.existsSync(this.configDir)) {
			fs.mkdirSync(this.configDir, { recursive: true });
		}
	}

	public getConfig(): Config {
		if (!fs.existsSync(this.configFile)) {
			return {};
		}

		try {
			const content = fs.readFileSync(this.configFile, "utf-8");
			return JSON.parse(content);
		} catch (_error) {
			console.warn(`Warning: Could not parse config file, using defaults`);
			return {};
		}
	}

	public setConfig(key: keyof Config, value: string | number): void {
		const config = this.getConfig();
		(config as any)[key] = value;

		fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
		console.log(
			`✅ Configuration updated: ${key} = ${this.maskValue(key, value)}`,
		);
	}

	public getConfigValue(key: keyof Config): string | number | undefined {
		const config = this.getConfig();
		return config[key];
	}

	public listConfig(): void {
		const config = this.getConfig();
		console.log("📋 Current configuration:");

		if (Object.keys(config).length === 0) {
			console.log(
				'  No configuration found. Use "ai-git-wizard config set" to configure.',
			);
			return;
		}

		for (const [key, value] of Object.entries(config)) {
			console.log(`  ${key}: ${this.maskValue(key as keyof Config, value)}`);
		}
	}

	private maskValue(key: keyof Config, value: any): string {
		if (
			key.toLowerCase().includes("token") ||
			key.toLowerCase().includes("key")
		) {
			return typeof value === "string" && value.length > 8
				? `${value.slice(0, 4)}...${value.slice(-4)}`
				: "[SET]";
		}
		return String(value);
	}

	public validateConfig(): { isValid: boolean; missing: string[] } {
		const config = this.getConfig();
		const required = ["openRouterApiKey", "githubToken"];
		const missing = required.filter((key) => !config[key as keyof Config]);

		return {
			isValid: missing.length === 0,
			missing,
		};
	}

	public detectRepository(): RepoInfo | null {
		try {
			// Check if we're in a git repository
			execSync("git rev-parse --git-dir", { stdio: "pipe" });

			// Get remote URL
			const remoteUrl = execSync("git remote get-url origin", {
				encoding: "utf-8",
			}).trim();

			// Parse GitHub URL (supports both HTTPS and SSH)
			const match = remoteUrl.match(
				/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/,
			);
			if (match) {
				return {
					owner: match[1],
					name: match[2],
					remoteUrl,
				};
			}

			console.warn("⚠️  Repository detected but URL format not recognized");
			return null;
		} catch (_error) {
			return null;
		}
	}

	public getWorkingConfig(): {
		config: Config;
		repo: RepoInfo | null;
		isValid: boolean;
		missing: string[];
	} {
		const config = this.getConfig();
		const repo = this.detectRepository();
		const { isValid, missing } = this.validateConfig();

		// Apply defaults
		const workingConfig: Config = {
			defaultModel: "google/gemini-flash-1.5",
			maxConcurrency: 3,
			...config,
		};

		return {
			config: workingConfig,
			repo,
			isValid,
			missing,
		};
	}
}

export { ConfigManager };
