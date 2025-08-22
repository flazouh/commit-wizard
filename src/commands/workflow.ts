import chalk from 'chalk';
import { AIService } from '../lib/ai.js';
import { ConfigManager } from '../lib/config.js';
import { GitService } from '../lib/git.js';
import { GitHubService } from '../lib/github.js';

interface WorkflowOptions {
  branch?: string;
  baseBranch?: string;
  noPr?: boolean;
}

export async function handleWorkflow(options: WorkflowOptions): Promise<void> {
  const configManager = new ConfigManager();
  const { config, repo, isValid, missing } = configManager.getWorkingConfig();

  // Check configuration
  if (!isValid) {
    console.error(chalk.red.bold('❌ Configuration missing!'));
    console.error(`Missing: ${missing.join(', ')}`);
    console.log('\nRun: ai-git-wizard config setup');
    process.exit(1);
  }

  if (!repo) {
    console.error(
      chalk.red.bold('❌ Not a git repository or repository not recognized')
    );
    console.error(
      'Make sure you are in a git repository with a GitHub remote.'
    );
    process.exit(1);
  }

  console.log(chalk.blue.bold('🔮 Commit Wizard'));
  console.log(`📦 Repository: ${repo.owner}/${repo.name}`);
  console.log(`📁 Working directory: ${process.cwd()}\n`);

  const gitService = new GitService();
  const aiService = new AIService(config);

  // Check if we're in a git repository
  if (!gitService.isGitRepository()) {
    console.error(chalk.red.bold('❌ Not a git repository'));
    process.exit(1);
  }

  try {
    // Step 1: Get staged files
    console.log('📋 Getting staged files...');
    const stagedFiles = gitService.getStagedFiles();

    if (stagedFiles.length === 0) {
      console.error(chalk.yellow.bold('⚠️  No staged files found'));
      console.log('Please stage your changes with: git add <files>');
      process.exit(1);
    }

    console.log(`Found ${stagedFiles.length} staged files:`);
    stagedFiles.forEach((file) => {
      const icon = file.type === 'A' ? '✨' : file.type === 'M' ? '📝' : '🗑️';
      console.log(`  ${icon} ${file.path} (${file.type})`);
    });

    // Step 2: Generate commit messages
    console.log('\n🤖 Generating commit messages...');
    const filesWithDiffs = stagedFiles.map((file) => ({
      file,
      diff: gitService.getDiffForFile(file),
    }));

    const commitMessages =
      await aiService.generateCommitMessagesInParallel(filesWithDiffs);

    // Step 3: Create branch if specified
    let branchName = options.branch;
    if (branchName && !gitService.branchExists(branchName)) {
      console.log(`\n🌿 Creating branch: ${branchName}`);
      gitService.createBranch(branchName);
    } else if (!branchName) {
      // Auto-generate branch name
      console.log('\n🌿 Generating branch name...');
      branchName = await aiService.generateBranchName(commitMessages);

      if (!gitService.branchExists(branchName)) {
        gitService.createBranch(branchName);
      }
    }

    // Step 4: Unstage all files first, then commit each individually
    console.log('\n💾 Creating individual commits...');

    // First, unstage all files
    try {
      gitService.unstageAllFiles();
    } catch (_error) {
      // If unstaging fails, it might be because there are no staged files, which is fine
      console.log(
        '⚠️  Note: Could not unstage files (they may already be unstaged)'
      );
    }

    const commitHashes: string[] = [];

    // Commit each file individually with its own message
    for (let i = 0; i < commitMessages.length; i++) {
      const message = commitMessages[i];
      const file = stagedFiles[i];

      console.log(`\n📝 Committing: ${file.path}`);
      const commitHash = gitService.stageAndCommitFile(
        file.path,
        message.formatted
      );
      commitHashes.push(commitHash);
    }

    // Step 5: Push branch
    console.log('\n🚀 Pushing to remote...');
    gitService.pushBranch(branchName);

    // Step 6: Create PR if requested
    if (!options.noPr && config.githubToken) {
      console.log('\n📄 Creating pull request...');

      const githubService = new GitHubService(config.githubToken);
      const commits = gitService.getCommits(options.baseBranch || 'main');

      // Check if PR already exists
      const existingPr = await githubService.findExistingPR(repo, branchName);

      if (existingPr) {
        console.log(
          `📄 Updating existing pull request: ${existingPr.html_url}`
        );
        const description = await aiService.generatePRDescription(
          branchName,
          commits
        );
        await githubService.updatePullRequest(
          repo,
          existingPr.number,
          branchName,
          description
        );
      } else {
        const description = await aiService.generatePRDescription(
          branchName,
          commits
        );
        const pr = await githubService.createPullRequest(
          repo,
          branchName,
          branchName,
          description,
          options.baseBranch || 'main'
        );
        console.log(`📄 Pull request created: ${pr.html_url}`);
      }
    }

    console.log(chalk.green.bold('\n✅ Workflow completed successfully!'));
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Workflow failed:'), error);
    process.exit(1);
  }
}

interface CommitOptions {
  push?: boolean;
}

export async function handleCommit(options: CommitOptions = {}): Promise<void> {
  const configManager = new ConfigManager();
  const { config, isValid, missing } = configManager.getWorkingConfig();

  if (!isValid) {
    console.error(chalk.red.bold('❌ Configuration missing!'));
    console.error(`Missing: ${missing.join(', ')}`);
    console.log('\nRun: ai-git-wizard config setup');
    process.exit(1);
  }

  console.log(chalk.blue.bold('💾 AI Commit Generator'));

  const gitService = new GitService();
  const aiService = new AIService(config);

  if (!gitService.isGitRepository()) {
    console.error(chalk.red.bold('❌ Not a git repository'));
    process.exit(1);
  }

  try {
    const stagedFiles = gitService.getStagedFiles();

    if (stagedFiles.length === 0) {
      console.error(chalk.yellow.bold('⚠️  No staged files found'));
      console.log('Please stage your changes with: git add <files>');
      process.exit(1);
    }

    console.log(`Found ${stagedFiles.length} staged files`);

    const filesWithDiffs = stagedFiles.map((file) => ({
      file,
      diff: gitService.getDiffForFile(file),
    }));

    const commitMessages =
      await aiService.generateCommitMessagesInParallel(filesWithDiffs);

    // First, unstage all files
    try {
      gitService.unstageAllFiles();
    } catch (_error) {
      console.log(
        '⚠️  Note: Could not unstage files (they may already be unstaged)'
      );
    }

    // Commit each file individually with its own message
    for (let i = 0; i < commitMessages.length; i++) {
      const message = commitMessages[i];
      const file = stagedFiles[i];

      console.log(`📝 Committing: ${file.path}`);
      gitService.stageAndCommitFile(file.path, message.formatted);
    }

    console.log(chalk.green.bold('\n✅ All changes committed!'));

    // Push to remote if requested
    if (options.push) {
      console.log('\n🚀 Pushing to remote...');
      const currentBranch = gitService.getCurrentBranch();
      gitService.pushBranch(currentBranch);
    }
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Commit failed:'), error);
    process.exit(1);
  }
}
