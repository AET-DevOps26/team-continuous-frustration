#!/usr/bin/env bash
set -euo pipefail

npx @redocly/cli lint api/*.yaml

openapi-generator-cli generate -i api/genai.yaml -g python-fastapi \
  -o services/genai-service --skip-validate-spec

npm --prefix "./web-client" run orval
