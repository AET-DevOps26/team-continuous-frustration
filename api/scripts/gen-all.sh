#!/usr/bin/env bash
set -euo pipefail

npx @redocly/cli lint api/*.yaml

openapi-generator-cli generate -i api/auth.yaml -g spring \
  -o services/auth-service/generated \
  --api-package com.devops.authservice.api \
  --model-package com.devops.authservice.model \
  --additional-properties=interfaceOnly=true,useSpringBoot3=true,useTags=true,openApiNullable=false \
  --skip-validate-spec

openapi-generator-cli generate -i api/genai.yaml -g python-fastapi \
  -o services/genai-service --skip-validate-spec

npm --prefix "./web-client" run orval
