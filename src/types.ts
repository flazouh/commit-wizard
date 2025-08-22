// Simple types for the working version
export interface FileChange {
	path: string;
	type: "A" | "M" | "D";
}

export interface CommitMessage {
	emoji: string;
	type: string;
	scope?: string;
	subject: string;
	body?: string;
	formatted: string;
}

export interface Config {
	openRouterApiKey?: string;
	githubToken?: string;
	defaultModel?: string;
	maxConcurrency?: number;
}

export interface RepoInfo {
	owner: string;
	name: string;
	remoteUrl: string;
}

export interface OpenRouterRequest {
	model: string;
	messages: Array<{
		role: "system" | "user" | "assistant";
		content: string;
	}>;
	max_tokens?: number;
	temperature?: number;
}

export interface OpenRouterResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}
