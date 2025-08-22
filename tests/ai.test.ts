import { describe, expect, it } from "vitest";
import { AIService } from "../src/lib/ai.js";
import type { Config } from "../src/types.js";

describe("AIService", () => {
	it("should create an instance with config", () => {
		const config: Config = {
			openRouterApiKey: "test-key",
			defaultModel: "google/gemini-flash-1.5",
			maxConcurrency: 3,
		};

		const aiService = new AIService(config);
		expect(aiService).toBeInstanceOf(AIService);
	});

	it("should throw error when API key is missing", async () => {
		const config: Config = {
			openRouterApiKey: "",
			defaultModel: "google/gemini-flash-1.5",
			maxConcurrency: 3,
		};

		const aiService = new AIService(config);

		await expect(
			aiService.generateCommitMessage(
				{ path: "test.ts", type: "M" },
				"test diff",
			),
		).rejects.toThrow("OpenRouter API key not configured");
	});
});
