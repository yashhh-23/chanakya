#!/bin/bash
set -e

# Expected environment variables:
# COMMITS_JSON - JSON string of commits from github payload
# WORKSPACE - github workspace directory

cd "$WORKSPACE"
mkdir -p docs/commit-log
DATE=$(date -u +"%Y-%m-%d")
COMMIT_LOG="docs/commit-log/$DATE.md"

if [ ! -f "$COMMIT_LOG" ]; then
  echo "# Commit Log: $DATE" > "$COMMIT_LOG"
  echo "" >> "$COMMIT_LOG"
fi

# Process each commit in the push payload
echo "$COMMITS_JSON" | jq -c '.[]' | while read -r commit; do
  # Skip empty or null commits
  if [ -z "$commit" ] || [ "$commit" = "null" ]; then continue; fi

  ID=$(echo "$commit" | jq -r '.id')
  MSG=$(echo "$commit" | jq -r '.message')
  AUTHOR=$(echo "$commit" | jq -r '.author.name')
  URL=$(echo "$commit" | jq -r '.url')
  
  # Only take the first line of the message for the log/changelog
  FIRST_LINE=$(echo "$MSG" | head -n 1)

  # Parse prefix
  PREFIX=$(echo "$FIRST_LINE" | grep -oE "^(FEATURE|BUG|UI|PERF|SEC|DOCS|REFACTOR|TEST|CHORE):" || true)
  
  if [ -n "$PREFIX" ]; then
    # Append to daily commit log
    echo "- [\`${ID:0:7}\`]($URL) by **$AUTHOR**: $FIRST_LINE" >> "$COMMIT_LOG"

    # Determine CHANGELOG section
    SECTION=""
    case "$PREFIX" in
      "FEATURE:") SECTION="### Added" ;;
      "BUG:"|"UI:") SECTION="### Fixed" ;;
      "REFACTOR:"|"PERF:"|"SEC:"|"DOCS:") SECTION="### Changed" ;;
      "TEST:"|"CHORE:") SECTION="### Internal" ;;
    esac

    # Append to CHANGELOG
    if [ -n "$SECTION" ]; then
      awk -v sec="$SECTION" -v msg="- [\`${ID:0:7}\`]($URL) $FIRST_LINE" '
      $0 == sec {print; print msg; next}
      {print}
      ' docs/CHANGELOG.md > docs/CHANGELOG.md.tmp && mv docs/CHANGELOG.md.tmp docs/CHANGELOG.md
    fi

    # Check for Closes-PRD-Section in the entire commit message body
    PRD_SECTIONS=$(echo "$MSG" | grep -oE "Closes-PRD-Section: §[0-9]+(\.[0-9]+)?" || true)
    if [ -n "$PRD_SECTIONS" ]; then
      while IFS= read -r section; do
        if [ -n "$section" ]; then
          echo "- $section completed in [\`${ID:0:7}\`]($URL)" >> docs/Implementation_Status.md
        fi
      done <<< "$PRD_SECTIONS"
    fi

    # Check for BUG touching infra/build files
    if [ "$PREFIX" = "BUG:" ]; then
      MODIFIED_FILES=$(echo "$commit" | jq -r '(.added + .modified + .removed)[]' 2>/dev/null || true)
      if echo "$MODIFIED_FILES" | grep -qE "Dockerfile|go\.mod|go\.sum|helm/|terraform/|\.github/workflows/"; then
         echo "- [\`${ID:0:7}\`]($URL) $FIRST_LINE" >> docs/Build_Issue_Report.md
      fi
    fi
  fi
done
