import { execSync } from "node:child_process";
import type { FileChange } from "../types.js";

class GitService {
	// Check if we're in a git repository
	public isGitRepository(): boolean {
		try {
			execSync("git rev-parse --git-dir", { stdio: "pipe" });
			return true;
		} catch {
			return false;
		}
	}

	// Get staged files
	public getStagedFiles(): FileChange[] {
		try {
			const output = execSync("git diff --cached --name-status", {
				encoding: "utf-8",
			});

			if (!output.trim()) {
				return [];
			}

			return output
				.trim()
				.split("\n")
				.map((line) => {
					const [type, path] = line.split("\t");
					return {
						type: type as "A" | "M" | "D",
						path: path,
					};
				});
		} catch (error) {
			throw new Error(`Failed to get staged files: ${error}`);
		}
	}

	// Get diff for a specific file
	public getDiffForFile(file: FileChange): string {
		try {
			if (file.type === "D") {
				// For deleted files, show the last known content
				return `File deleted: ${file.path}`;
			}

			const diff = execSync(`git diff --cached -- "${file.path}"`, {
				encoding: "utf-8",
			});
			return diff;
		} catch (error) {
			throw new Error(`Failed to get diff for file ${file.path}: ${error}`);
		}
	}

	// Create and checkout a new branch
	public createBranch(branchName: string): void {
		try {
			execSync(`git checkout -b "${branchName}"`, { stdio: "pipe" });
			console.log(`✅ Created and switched to branch: ${branchName}`);
		} catch (error) {
			throw new Error(`Failed to create branch ${branchName}: ${error}`);
		}
	}

	// Stage and commit a specific file
	public stageAndCommitFile(filePath: string, message: string): string {
		try {
			// Stage the specific file
			execSync(`git add "${filePath}"`, { stdio: "pipe" });

			// Commit the staged file
			execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
				stdio: "pipe",
			});

			// Get the commit hash
			const commitHash = execSync("git rev-parse HEAD", {
				encoding: "utf-8",
			}).trim();
			console.log(`✅ Committed: ${commitHash.substring(0, 8)} - ${message}`);
			return commitHash;
		} catch (error) {
			throw new Error(`Failed to stage and commit file ${filePath}: ${error}`);
		}
	}

	// Push branch to remote
	public pushBranch(branchName: string): void {
		try {
			execSync(`git push -u origin "${branchName}"`, { stdio: "inherit" });
			console.log(`✅ Pushed branch: ${branchName}`);
		} catch (error) {
			throw new Error(`Failed to push branch ${branchName}: ${error}`);
		}
	}

	// Get current branch name
	public getCurrentBranch(): string {
		try {
			return execSync("git branch --show-current", {
				encoding: "utf-8",
			}).trim();
		} catch (error) {
			throw new Error(`Failed to get current branch: ${error}`);
		}
	}

	// Get commits on current branch
	public getCommits(
		fromBranch: string = "main",
	): Array<{ hash: string; message: string; files: string[] }> {
		try {
			const currentBranch = this.getCurrentBranch();

			// Get commit hashes and messages
			const commitData = execSync(
				`git log ${fromBranch}..${currentBranch} --pretty=format:"%H|%s"`,
				{ encoding: "utf-8" },
			);

			if (!commitData.trim()) {
				return [];
			}

			const commits = commitData
				.trim()
				.split("\n")
				.map((line) => {
					const [hash, message] = line.split("|");

					// Get files changed in this commit
					const filesOutput = execSync(
						`git diff-tree --no-commit-id --name-only -r "${hash}"`,
						{ encoding: "utf-8" },
					);

					const files = filesOutput.trim()
						? filesOutput.trim().split("\n")
						: [];

					return { hash, message, files };
				});

			return commits;
		} catch (error) {
			throw new Error(`Failed to get commits: ${error}`);
		}
	}

	// Check if branch exists
	public branchExists(branchName: string): boolean {
		try {
			execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, {
				stdio: "pipe",
			});
			return true;
		} catch {
			return false;
		}
	}

	// Unstage all files
	public unstageAllFiles(): void {
		try {
			execSync("git reset HEAD", { stdio: "pipe" });
			console.log("✅ Unstaged all files");
		} catch (error) {
			throw new Error(`Failed to unstage files: ${error}`);
		}
	}
}

export { GitService };
