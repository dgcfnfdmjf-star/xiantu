#!/usr/bin/env bash
set -euo pipefail
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/tmp/xiantu-playwright-cache}"
export npm_config_cache="${npm_config_cache:-/tmp/xiantu-npm-cache}"
exec npx --yes --package @playwright/cli@0.1.22 playwright-cli "$@"
