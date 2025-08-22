# Commit Wizard 🔮

An AI-powered commit wizard that automatically generates commit messages, creates branches, and makes pull requests.

## Features

- 🤖 AI-generated commit messages using OpenRouter API
- 🌿 Automatic branch name generation 
- 📄 PR creation with detailed descriptions
- ⚡ Parallel commit message generation for better performance
- 🔧 Global configuration management
- 📦 Works with any GitHub repository

## Installation

### Global Installation (Recommended)

```bash
npm install -g ai-git-wizard
```

### Local Installation

```bash
npm install ai-git-wizard
```

## Setup

Before using the CLI, you need to configure your API keys:

```bash
ai-git-wizard config setup
```

This will prompt you for:
- OpenRouter API key (for AI features)
- GitHub personal access token (for PR creation)
- Preferred AI model
- Max concurrency for API requests

### Getting API Keys

#### OpenRouter API Key
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Go to Keys section
3. Create a new API key

#### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token

## Usage

### Quick Workflow

Run the complete workflow (generates commits, creates branch, makes PR):

```bash
ai-git-wizard workflow
```

### Just Commit

Generate AI commit messages and commit staged files:

```bash
ai-git-wizard commit
```

### Commit and Push

Generate commit messages and push to remote:

```bash
ai-git-wizard commit --push
```

### Specify Branch Name

```bash
ai-git-wizard workflow -b feature/my-feature
```

### Skip PR Creation

```bash
ai-git-wizard workflow --no-pr
```

### Configuration Management

```bash
# Interactive setup
ai-git-wizard config setup

# List all configuration
ai-git-wizard config list

# Set individual values
ai-git-wizard config set openRouterApiKey YOUR_KEY
ai-git-wizard config set githubToken YOUR_TOKEN

# Get a specific value
ai-git-wizard config get defaultModel
```

## Workflow Steps

The complete workflow performs these steps:

1. **Detect Repository**: Automatically detects GitHub repository info
2. **Get Staged Files**: Finds all staged changes
3. **Generate Commit Messages**: Creates AI-powered commit messages for each file
4. **Create/Switch Branch**: Creates a new branch or uses specified branch
5. **Create Commits**: Makes individual commits for each file
6. **Push Branch**: Pushes the branch to GitHub
7. **Create PR**: Creates or updates a pull request with AI-generated description

## Configuration

Configuration is stored in `~/.ai-git-wizard/config.json`

### Available Settings

- `openRouterApiKey`: Your OpenRouter API key (required)
- `githubToken`: Your GitHub personal access token (required)
- `defaultModel`: AI model to use (default: "google/gemini-flash-2.5")
- `maxConcurrency`: Max parallel API requests (default: 3)

### Supported AI Models

Any model available on OpenRouter is supported! Some popular options include:

- `google/gemini-flash-2.5` (Recommended - Fast & Reliable)
- `anthropic/claude-3.5-sonnet` (High Quality)
- `google/gemini-flash-1.5` (Very Fast)
- `openai/gpt-4o-mini` (Good Balance)
- `openai/gpt-4o` (Highest Quality)
- `meta-llama/llama-3.1-8b-instruct` (Open Source)
- `mistralai/mistral-7b-instruct` (Open Source)

You can browse all available models at [openrouter.ai/models](https://openrouter.ai/models)

## Examples

### Basic Usage

```bash
# Stage some files
git add src/components/Button.tsx
git add src/utils/helpers.ts

# Run AI workflow
ai-git-wizard workflow

### Advanced Usage

```bash
# Specify branch and base branch
ai-git-wizard workflow --branch feat/authentication --base-branch develop

# Just generate commits without PR
ai-git-wizard workflow --no-pr

# Only commit (no branch creation or PR)
ai-git-wizard commit

# Commit and push to remote
ai-git-wizard commit --push
```

## Requirements

- Node.js 18+
- Git repository with GitHub remote
- OpenRouter API key
- GitHub personal access token

## Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Test locally: `npm link`

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
