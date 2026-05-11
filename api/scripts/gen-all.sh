#!/usr/bin/env bash
set -euo pipefail

openapi-generator-cli generate -i api/openapi.yaml -g spring \
  -o services/spring-order/generated --skip-validate-spec

openapi-generator-cli generate -i api/openapi.yaml -g python-fastapi \
  -o services/py-order/generated --skip-validate-spec

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
npm --prefix "$ROOT_DIR/web-client" run orval
