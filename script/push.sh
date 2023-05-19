#!/bin/sh

COMMIT_MESSAGE="$1"

git pull && \
git add . && \
git commit -m "$COMMIT_MESSAGE" && \
git push