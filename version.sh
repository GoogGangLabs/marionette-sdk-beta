#!/bin/sh

GIT_DIFF=$(git diff package.json)
NEW_VERSION=""

if [[ "$GIT_DIFF" =~ "\"version\": \"" ]]; then
  DIFF_VERSION=($(git diff package.json | awk "/  \"version\":/" | cut -d "\"" -f 4))
  ORIGIN_VERSION=${DIFF_VERSION[0]}
  NEW_VERSION=${DIFF_VERSION[1]}
else
  # patch 버전 upgrade
  ORIGIN_VERSION=($(awk "/\"version\": /" package.json | cut -d "\"" -f 4 | tr "." " "))
  PATCH_VERSION=$((ORIGIN_VERSION[2] + 1))
  NEW_VERSION="${ORIGIN_VERSION[0]}.${ORIGIN_VERSION[1]}.${PATCH_VERSION}"
  sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"${NEW_VERSION}\"/g" package.json
fi

COMMIT_MESSAGE="v${NEW_VERSION}"
if [[ "${#1}" > 0 ]]; then
  COMMIT_MESSAGE="$COMMIT_MESSAGE - $1"
fi

git pull && \
git add . && \
git commit -m "$COMMIT_MESSAGE" && \
git push