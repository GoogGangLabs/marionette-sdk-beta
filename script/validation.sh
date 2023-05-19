#!/bin/sh

if [[ ! "$(git diff package.json)" =~ "\"version\": \"" ]]; then
  exit 1;
fi