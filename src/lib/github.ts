import type { RepoInfo } from '../types.js';

interface GitHubPR {
  number: number;
  title: string;
  html_url: string;
  state: string;
}

class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  // Create a pull request
  public async createPullRequest(
    repo: RepoInfo,
    branchName: string,
    title: string,
    description: string,
    baseBranch: string = 'main'
  ): Promise<GitHubPR> {
    const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`;

    const body = {
      title,
      body: description,
      head: branchName,
      base: baseBranch,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'ai-git-wizard',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`
        );
      }

      const pr = (await response.json()) as GitHubPR;
      console.log(`✅ Created pull request: ${pr.html_url}`);
      return pr;
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  // Check if a PR already exists for the branch
  public async findExistingPR(
    repo: RepoInfo,
    branchName: string
  ): Promise<GitHubPR | null> {
    const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls?head=${repo.owner}:${branchName}&state=open`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'ai-git-wizard',
        },
      });

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const prs = (await response.json()) as GitHubPR[];
      return prs.length > 0 ? prs[0] : null;
    } catch (error) {
      console.warn('⚠️  Could not check for existing PRs:', error);
      return null;
    }
  }

  // Update an existing pull request
  public async updatePullRequest(
    repo: RepoInfo,
    prNumber: number,
    title: string,
    description: string
  ): Promise<GitHubPR> {
    const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls/${prNumber}`;

    const body = {
      title,
      body: description,
    };

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'ai-git-wizard',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`
        );
      }

      const pr = (await response.json()) as GitHubPR;
      console.log(`✅ Updated pull request: ${pr.html_url}`);
      return pr;
    } catch (error) {
      throw new Error(`Failed to update pull request: ${error}`);
    }
  }

  // Test GitHub token validity
  public async testToken(): Promise<{
    valid: boolean;
    user?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'ai-git-wizard',
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `${response.status} ${response.statusText}`,
        };
      }

      const user = (await response.json()) as { login: string };
      return { valid: true, user: user.login };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  // Get repository information
  public async getRepository(
    repo: RepoInfo
  ): Promise<{ exists: boolean; defaultBranch?: string }> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'ai-git-wizard',
          },
        }
      );

      if (!response.ok) {
        return { exists: false };
      }

      const repoData = (await response.json()) as { default_branch: string };
      return { exists: true, defaultBranch: repoData.default_branch };
    } catch (_error) {
      return { exists: false };
    }
  }
}

export { GitHubService, type GitHubPR };
