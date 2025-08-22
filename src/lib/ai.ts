import pLimit from "p-limit";
import type {
	CommitMessage,
	Config,
	FileChange,
	OpenRouterRequest,
	OpenRouterResponse,
} from "../types.js";

class AIService {
	private config: Config;
	private limit: ReturnType<typeof pLimit>;

	constructor(config: Config) {
		this.config = config;
		this.limit = pLimit(config.maxConcurrency || 3);
	}

	private async makeOpenRouterRequest(
		request: OpenRouterRequest,
	): Promise<OpenRouterResponse> {
		const apiKey = this.config.openRouterApiKey;
		if (!apiKey) {
			throw new Error(
				'OpenRouter API key not configured. Use "ai-git-wizard config set openRouterApiKey YOUR_KEY"',
			);
		}

		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "https://github.com/fluentai-pro/ai-git-wizard",
					"X-Title": "AI Git CLI",
				},
				body: JSON.stringify(request),
			},
		);

		if (!response.ok) {
			throw new Error(
				`OpenRouter API error: ${response.status} ${response.statusText}`,
			);
		}

		return response.json() as Promise<OpenRouterResponse>;
	}

	public async generateCommitMessage(
		file: FileChange,
		diff: string,
	): Promise<CommitMessage> {
		return this.limit(async () => {
			console.log(`🤖 Generating commit message for: ${file.path}`);

			const prompt = `Analyze this git diff and generate a conventional commit message.

File: ${file.path}
Change Type: ${file.type === "M" ? "Modified" : file.type === "A" ? "Added" : file.type === "D" ? "Deleted" : "Changed"}

Diff:
${diff}

Guidelines:
- Use conventional commit format: type(scope): description
- Common types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- Be specific about what changed
- Use imperative mood ("add", "fix", "update", not "added", "fixed", "updated")  
- Focus on the functional change, not implementation details
- Keep description under 50 characters
- Include appropriate scope if relevant (e.g., component name, feature area)
- Examples: "feat(auth): add user authentication", "fix(ui): resolve button alignment", "docs(readme): update installation guide"

Return only the commit message in conventional format, no explanation.`;

			const request: OpenRouterRequest = {
				model: this.config.defaultModel || "google/gemini-flash-2.5",
				messages: [
					{
						role: "system",
						content:
							"You are a git commit message expert. Generate clear, concise conventional commit messages.",
					},
					{ role: "user", content: prompt },
				],
			};

			const response = await this.makeOpenRouterRequest(request);
			const fullMessage =
				response.choices[0]?.message.content.trim() ||
				`feat: update ${file.path}`;

			// Parse the conventional commit message
			const match = fullMessage.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
			const type = match?.[1] || "feat";
			const scope = match?.[2] || undefined;
			const subject = match?.[3] || fullMessage;

			const commitMessage: CommitMessage = {
				emoji: "",
				type,
				scope,
				subject,
				body: undefined,
				formatted: fullMessage,
			};

			console.log(`✅ Generated: ${commitMessage.formatted}`);
			return commitMessage;
		});
	}

	public async generateBranchName(
		commitMessages: CommitMessage[],
	): Promise<string> {
		console.log("🌿 Generating branch name from commit messages...");

		const commitSummaries = commitMessages
			.map(
				(msg) =>
					`${msg.type}${msg.scope ? `(${msg.scope})` : ""}: ${msg.subject}`,
			)
			.join("\n");

		const prompt = `Analyze these commit messages and generate a descriptive git branch name.

Commits:
${commitSummaries}

Guidelines:
- Use kebab-case (lowercase with hyphens)
- Maximum 40 characters
- Be descriptive but concise
- Include the main theme/feature being worked on
- Use conventional prefixes: feat/, fix/, chore/, refactor/, docs/, test/
- Examples: "feat/user-authentication", "fix/payment-processing-bug", "chore/remove-deprecated-apis"

Return only the branch name, no explanation.`;

		const request: OpenRouterRequest = {
			model: this.config.defaultModel || "google/gemini-flash-1.5",
			messages: [
				{
					role: "system",
					content:
						"You are a git branch naming expert. Generate clear, descriptive branch names.",
				},
				{ role: "user", content: prompt },
			],
		};

		const response = await this.makeOpenRouterRequest(request);
		const branchName =
			response.choices[0]?.message.content.trim() || "feat/automated-changes";

		console.log(`✅ Generated branch name: ${branchName}`);
		return branchName;
	}

	public async generatePRDescription(
		branchName: string,
		commits: Array<{ hash: string; message: string; files: string[] }>,
	): Promise<string> {
		console.log("📄 Generating PR description...");

		const commitList = commits
			.map(
				(commit) =>
					`- \`${commit.hash.substring(0, 8)}\` ${commit.message}\n  Files: ${commit.files.join(", ")}`,
			)
			.join("\n\n");

		const prompt = `Generate a comprehensive Pull Request description for this branch.

Branch: ${branchName}
Commits: ${commits.length}

Detailed Commits:
${commitList}

Generate a PR description with:
1. A clear title summarizing the main changes
2. A brief overview of what this PR accomplishes
3. A "Changes" section listing each commit with its hash and description
4. Any notable technical details or considerations

Format as markdown. Be professional but concise.`;

		const request: OpenRouterRequest = {
			model: this.config.defaultModel || "google/gemini-flash-1.5",
			messages: [
				{
					role: "system",
					content:
						"You are a technical writer creating pull request descriptions. Be clear, comprehensive, and professional.",
				},
				{ role: "user", content: prompt },
			],
		};

		const response = await this.makeOpenRouterRequest(request);
		const description =
			response.choices[0]?.message.content.trim() ||
			`## Changes\n\nThis PR contains ${commits.length} commits with various improvements and updates.`;

		console.log("✅ Generated PR description");
		return description;
	}

	public async generateCommitMessagesInParallel(
		filesWithDiffs: Array<{ file: FileChange; diff: string }>,
	): Promise<CommitMessage[]> {
		console.log(
			`🚀 Generating ${filesWithDiffs.length} commit messages in parallel (concurrency: ${this.config.maxConcurrency || 3})`,
		);

		const promises = filesWithDiffs.map(({ file, diff }) =>
			this.generateCommitMessage(file, diff),
		);

		try {
			const results = await Promise.all(promises);
			console.log(
				`✅ Successfully generated ${results.length} commit messages`,
			);
			return results;
		} catch (error) {
			throw new Error(`Failed to generate commit messages: ${error}`);
		}
	}
}

export { AIService };
