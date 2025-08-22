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
npm install -g commit-wizard
```

### Local Installation

```bash
npm install commit-wizard
```

## Setup

Before using the CLI, you need to configure your API keys:

```bash
commit-wizard config setup
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
commit-wizard workflow
```

### Just Commit

Generate AI commit messages and commit staged files:

```bash
commit-wizard commit
```

### Specify Branch Name

```bash
commit-wizard workflow -b feature/my-feature
```

### Skip PR Creation

```bash
commit-wizard workflow --no-pr
```

### Configuration Management

```bash
# Interactive setup
commit-wizard config setup

# List all configuration
commit-wizard config list

# Set individual values
commit-wizard config set openRouterApiKey YOUR_KEY
commit-wizard config set githubToken YOUR_TOKEN

# Get a specific value
commit-wizard config get defaultModel
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

Configuration is stored in `~/.commit-wizard/config.json`

### Available Settings

- `openRouterApiKey`: Your OpenRouter API key (required)
- `githubToken`: Your GitHub personal access token (required)
- `defaultModel`: AI model to use (default: "anthropic/claude-3.5-sonnet")
- `maxConcurrency`: Max parallel API requests (default: 3)

### Supported AI Models

- `anthropic/claude-3.5-sonnet` (Recommended)
- `google/gemini-flash-1.5` (Fast)
- `openai/gpt-4o-mini`
- `openai/gpt-4o`

## Examples

### Basic Usage

```bash
# Stage some files
git add src/components/Button.tsx
git add src/utils/helpers.ts

# Run AI workflow
commit-wizard workflow

### Advanced Usage

```bash
# Specify branch and base branch
commit-wizard workflow --branch feat/authentication --base-branch develop

# Just generate commits without PR
commit-wizard workflow --no-pr

# Only commit (no branch creation or PR)
commit-wizard commit
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
