#!/bin/sh

echo "🔍 Running pre-push checks..."

# Run tests
echo "🧪 Running tests..."
bun run test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Push aborted."
    exit 1
fi

# Run check (TypeScript + linting + formatting)
echo "🔧 Running checks..."
bun run check
if [ $? -ne 0 ]; then
    echo "❌ Checks failed. Push aborted."
    exit 1
fi

echo "✅ All pre-push checks passed!"
exit 0
