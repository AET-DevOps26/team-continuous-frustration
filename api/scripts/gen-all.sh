#!/usr/bin/env bash
set -euo pipefail

#npx @redocly/cli lint api/*.yaml

openapi-client-python --spec api/upload.json --output services/genai-service/src --service-name upload-service-client

python -m grpc_tools.protoc --proto_path=api/genai-proto/ --python_out=services/genai-service/src/grpc_server --grpc_python_out=services/genai-service/src/grpc_server --grpc_python_out=services/genai-service/src/grpc_server api/genai-proto/genai.proto
python -m grpc_tools.protoc -Iapi/genai-proto/ --python_out=services/genai-service/src/grpc_server --pyi_out=services/genai-service/src/grpc_server --grpc_python_out=services/genai-service/src/grpc_server api/genai-proto/genai.proto


npm --prefix "./web-client" run orval
