#!/bin/bash
# Agent 작업 완료 후 변경사항이 있으면 자동 커밋 & 푸시

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT" || exit 0

# 변경사항 없으면 종료
if [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

# 원격 저장소 확인
if ! git remote get-url origin &>/dev/null; then
  exit 0
fi

BRANCH=$(git branch --show-current)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

git add -A

# .env 등 민감 파일은 .gitignore로 제외됨
if [ -z "$(git diff --cached --name-only)" ]; then
  exit 0
fi

git commit -m "chore: auto-commit agent changes ($TIMESTAMP)" || exit 0
git push origin "$BRANCH" 2>/dev/null || git push -u origin "$BRANCH" 2>/dev/null

exit 0
