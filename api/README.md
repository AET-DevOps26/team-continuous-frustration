# API-Driven Design and OpenAPI Usage

## API-first, contract-strong
Design the API contract first, implement the server later. The OpenAPI spec is the source of truth for both backend and frontend code generation.

Key principles:
- Define and review the OpenAPI spec collaboratively before implementation.
- Treat the spec as a contract that protects clients.
- Version endpoints from day one (for example: /api/v1/resource).

## Design first workflow
1. Draft or update the OpenAPI spec in api/openapi.yaml.
2. Review the spec with the team.
3. Validate in Swagger Editor or Stoplight.
4. Only then start implementing server logic.

## Code generation
We generate server stubs and client code from the contract.

Tools:
- Java (Spring Boot): OpenAPI Generator (Spring server stub). Use Spring Boot 4.x and Java 25 (LTS).
- Python: openapi-python-client.

## How to run the generation script
The script lives at api/scripts/gen-all.sh and regenerates both server stubs and the web client.

From the repo root:

```bash
bash api/scripts/gen-all.sh
```

What it does:
- Generates the Spring server stub into services/spring-order/generated
- Generates the Python FastAPI server stub into services/py-order/generated
- Runs the web client generator (orval)

## Notes
- Regeneration overwrites files under the generated folders. Keep custom logic outside those folders.
- Update this doc if the generator choices or versions change.
