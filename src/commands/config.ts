import chalk from "chalk";
import inquirer from "inquirer";
import { ConfigManager } from "../lib/config.js";

interface ConfigOptions {
	key?: string;
	value?: string;
}

export async function handleConfig(
	action: string,
	options: ConfigOptions,
): Promise<void> {
	const configManager = new ConfigManager();

	switch (action) {
		case "list":
			configManager.listConfig();
			break;

		case "set":
			await handleConfigSet(configManager, options);
			break;

		case "get":
			await handleConfigGet(configManager, options);
			break;

		case "setup":
			await handleConfigSetup(configManager);
			break;

		default:
			console.error(`Unknown config action: ${action}`);
			console.log("Available actions: list, set, get, setup");
			process.exit(1);
	}
}

async function handleConfigSet(
	configManager: ConfigManager,
	options: ConfigOptions,
): Promise<void> {
	let { key, value } = options;

	// If both key and value are provided, set directly without prompting
	if (key && value) {
		const finalValue = key === "maxConcurrency" ? parseInt(value, 10) : value;
		configManager.setConfig(key as any, finalValue);
		return;
	}

	if (!key) {
		const { selectedKey } = await inquirer.prompt([
			{
				type: "list",
				name: "selectedKey",
				message: "Which configuration would you like to set?",
				choices: [
					{ name: "OpenRouter API Key", value: "openRouterApiKey" },
					{ name: "GitHub Token", value: "githubToken" },
					{ name: "Default AI Model", value: "defaultModel" },
					{ name: "Max Concurrency", value: "maxConcurrency" },
				],
			},
		]);
		key = selectedKey;
	}

	if (!value) {
		const isSecret =
			key?.toLowerCase().includes("key") ||
			key?.toLowerCase().includes("token");

		const { inputValue } = await inquirer.prompt([
			{
				type: isSecret ? "password" : "input",
				name: "inputValue",
				message: `Enter ${key}:`,
				validate: (input: string) => {
					if (!input.trim()) return "Value cannot be empty";
					if (key === "maxConcurrency") {
						const num = parseInt(input, 10);
						if (Number.isNaN(num) || num < 1 || num > 10) {
							return "Max concurrency must be a number between 1 and 10";
						}
					}
					return true;
				},
			},
		]);
		value = inputValue;
	}

	if (!key || !value) {
		console.error("Both key and value are required");
		return;
	}

	const finalValue = key === "maxConcurrency" ? parseInt(value, 10) : value;
	configManager.setConfig(key as any, finalValue);
}

async function handleConfigGet(
	configManager: ConfigManager,
	options: ConfigOptions,
): Promise<void> {
	const { key } = options;

	if (!key) {
		console.error("Please specify a configuration key to get");
		console.log("Example: commit-wizard config get openRouterApiKey");
		return;
	}

	const value = configManager.getConfigValue(key as any);
	if (value === undefined) {
		console.log(`Configuration ${key} is not set`);
	} else {
		const displayValue =
			(key.toLowerCase().includes("key") ||
				key.toLowerCase().includes("token")) &&
			typeof value === "string" &&
			value.length > 8
				? `${value.slice(0, 4)}...${value.slice(-4)}`
				: value;
		console.log(`${key}: ${displayValue}`);
	}
}

async function handleConfigSetup(configManager: ConfigManager): Promise<void> {
	console.log(chalk.blue.bold("🚀 AI Git CLI Setup"));
	console.log("Let's configure your API keys and preferences.\n");

	// OpenRouter API Key
	const { openRouterApiKey } = await inquirer.prompt([
		{
			type: "password",
			name: "openRouterApiKey",
			message: "🤖 Enter your OpenRouter API key:",
			validate: (input: string) => {
				if (!input.trim()) return "OpenRouter API key is required";
				return true;
			},
		},
	]);

	// GitHub Token
	const { githubToken } = await inquirer.prompt([
		{
			type: "password",
			name: "githubToken",
			message: "🐙 Enter your GitHub personal access token:",
			validate: (input: string) => {
				if (!input.trim()) return "GitHub token is required";
				return true;
			},
		},
	]);

	// AI Model
	const { defaultModel } = await inquirer.prompt([
		{
			type: "list",
			name: "defaultModel",
			message: "🧠 Choose your preferred AI model:",
			choices: [
				{
					name: "Gemini Flash 2.5 (Recommended)",
					value: "google/gemini-flash-2.5",
				},
				{ name: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet" },
				{ name: "Gemini Flash 1.5 (Fast)", value: "google/gemini-flash-1.5" },
				{ name: "GPT-4o Mini", value: "openai/gpt-4o-mini" },
				{ name: "GPT-4o", value: "openai/gpt-4o" },
			],
			default: "google/gemini-flash-2.5",
		},
	]);

	// Concurrency
	const { maxConcurrency } = await inquirer.prompt([
		{
			type: "number",
			name: "maxConcurrency",
			message: "⚡ Max concurrent API requests:",
			default: 3,
			validate: (input: number) => {
				if (input < 1 || input > 10) return "Must be between 1 and 10";
				return true;
			},
		},
	]);

	// Save configuration
	configManager.setConfig("openRouterApiKey", openRouterApiKey);
	configManager.setConfig("githubToken", githubToken);
	configManager.setConfig("defaultModel", defaultModel);
	configManager.setConfig("maxConcurrency", maxConcurrency);

	console.log(chalk.green.bold("\n✅ Configuration saved successfully!"));
			console.log("\nYou can now use commit-wizard to automate your workflow.");
		console.log("Try: commit-wizard commit");
}
