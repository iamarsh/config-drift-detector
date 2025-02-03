#!/bin/bash

# Retroactive Commit Helper
# This script helps create commits with backdated timestamps for aesthetic purposes
# Usage: ./retroactive-commit.sh "commit message" "2025-02-15"

set -e

COMMIT_MESSAGE="$1"
COMMIT_DATE="$2"

if [ -z "$COMMIT_MESSAGE" ] || [ -z "$COMMIT_DATE" ]; then
  echo "Usage: $0 \"commit message\" \"YYYY-MM-DD\""
  echo "Example: $0 \"feat: add drift trends\" \"2025-03-15\""
  exit 1
fi

# Parse date and add random time
YEAR=$(echo "$COMMIT_DATE" | cut -d'-' -f1)
MONTH=$(echo "$COMMIT_DATE" | cut -d'-' -f2)
DAY=$(echo "$COMMIT_DATE" | cut -d'-' -f3)

# Generate random hour (9-17 for business hours)
HOUR=$(printf "%02d" $((9 + RANDOM % 9)))
MINUTE=$(printf "%02d" $((RANDOM % 60)))
SECOND=$(printf "%02d" $((RANDOM % 60)))

FULL_DATE="${YEAR}-${MONTH}-${DAY} ${HOUR}:${MINUTE}:${SECOND}"

echo "Creating commit with date: $FULL_DATE"
echo "Message: $COMMIT_MESSAGE"

# Stage all changes
git add -A

# Create commit with backdated timestamp
GIT_AUTHOR_DATE="$FULL_DATE" GIT_COMMITTER_DATE="$FULL_DATE" git commit -m "$COMMIT_MESSAGE"

echo "✓ Commit created successfully!"
echo "Run 'git push' to push to remote (WARNING: This rewrites history if amending)"
