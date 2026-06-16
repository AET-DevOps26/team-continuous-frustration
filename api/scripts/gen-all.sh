#!/usr/bin/env bash
set -euo pipefail

#npx @redocly/cli lint api/*.yaml

openapi-client-python --spec api/upload.json --output services/genai-service/src --service-name upload-service-client

npm --prefix "./web-client" run orval
