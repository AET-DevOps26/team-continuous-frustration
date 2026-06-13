#!/usr/bin/env bash
set -euo pipefail

npx @redocly/cli lint api/*.yaml

openapi-generator-cli generate -i services/genai-service/openapi.json -g openapi-yaml \
  -o api/ --additional-properties=outputFile=genai.yaml --skip-validate-spec

npm --prefix "./web-client" run orval
