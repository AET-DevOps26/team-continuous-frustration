# Observability: Monitoring and Logging

This document covers how to run and use the monitoring stack — metrics, logs, and distributed
traces — both locally and on the Azure VM. For architecture/service decomposition, see
[system_structure.md](system_structure.md).

## What's included

| Pillar | Tool | Purpose |
|---|---|---|
| Metrics | **Prometheus** | Scrapes request rate/error/latency from every backend service |
| Dashboards | **Grafana** | Visualizes Prometheus (metrics), Loki (logs), and Jaeger (traces) in one place |
| Logs | **Loki** + **Promtail** | Aggregates every container's stdout/stderr, queryable by service |
| Traces | **Jaeger** (OpenTelemetry) | Connects one request across every service it touches |

All 5 backend services are instrumented:

| Service | Metrics endpoint | Tracing |
|---|---|---|
| `auth-service`, `flashcard-service`, `api-gateway` (Spring Boot) | `/actuator/prometheus` | Micrometer Tracing → OTLP |
| `genai-service`, `upload-service` (FastAPI) | `/metrics` | OpenTelemetry SDK → OTLP |

Config lives under `infra/prometheus`, `infra/loki`, `infra/promtail`, and
`infra/grafana/provisioning` — identical between local and Azure, since both reference services
purely by in-network container name/port.

---

## Running it locally

```bash
cd infra
docker compose up --build
```

| Tool | URL | Credentials |
|---|---|---|
| Prometheus | http://localhost:9090 | none |
| Grafana | http://localhost:3001 | `admin` / `admin` |
| Jaeger | http://localhost:16686 | none |
| Loki | http://localhost:3100 | (no UI — query via Grafana) |

> **Grafana login note:** the field is labeled "Email or username" — type `admin`, not a real
> email address.

> **Port conflict:** if `redis` fails to start with "port is already allocated", something else
> on your machine already holds `6379`. The host-side port is configurable —
> set `REDIS_PORT` in `infra/.env` (see `infra/.env.example`) to any free port; container-to-container
> traffic always uses `redis:6379` regardless, so nothing else needs to change.

### Checking it's actually working

```bash
# metrics
curl http://localhost:8031/actuator/prometheus   # auth-service
curl http://localhost:8090/metrics                # genai-service

# all Prometheus scrape targets should show "up"
open http://localhost:9090/targets
```

---

## Using each pillar

### Metrics — Grafana dashboard

Open Grafana → **Dashboards** → **Service Overview (RED Method)**. It follows the RED method
(Rate, Errors, Duration) taught for service-level metrics, split by stack since the two frameworks
expose different metric names:

- **Spring services** (`http_server_requests_seconds_*`): Request Rate, Error Rate (5xx), Client
  Error Rate (4xx), P95 Latency.
- **Python services** (`http_requests_total`, `http_request_duration_seconds_*`): same four panels.
- A **Logs** panel at the bottom, pulling from Loki.

The dashboard auto-refreshes every 30s. If a panel says "No data", that's often correct — it
means literally zero matching requests occurred yet (e.g. a service's 5xx panel is empty until
something actually errors), not that the panel is broken.

Useful raw PromQL (Prometheus → Graph, or Grafana → Explore → Prometheus):
```
sum by (job) (rate(http_server_requests_seconds_count[5m]))
histogram_quantile(0.95, sum by (job, le) (rate(http_server_requests_seconds_bucket[5m])))
```

### Logs — Grafana Explore → Loki

Log streams are labeled `service`, `container`, and `project` (there is **no** `job` label on
Loki streams — that's a Prometheus-only convention, don't confuse the two).

```
{service="auth-service"}
{service="auth-service"} |~ "(?i)error|exception"
{service=~".+"}                          # everything
```

Click **Live** (top right, next to the time picker) to stream new lines as they arrive instead of
a fixed window.

### Traces — Jaeger

Open Jaeger → pick a **Service** (e.g. `api-gateway`) → **Find Traces**. Click into one to see
the span waterfall across every service the request touched. To find failed requests
specifically, search with tag `error=true`.

Traces, logs, and metrics correlate by timestamp: pick a slow/failed trace in Jaeger, note its
time, then narrow Loki's time range to the same window to see exactly what each service logged
during that request.

### Generating test traffic

There's no built-in load generator; a simple loop against the gateway is enough to populate the
dashboards:
```bash
while true; do
  curl -s -o /dev/null -X POST http://localhost:8088/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123!","username":"test"}'
  sleep 2
done
```
To specifically populate error panels, send requests that are *expected* to fail: wrong
passwords (401), duplicate registrations (409), malformed bodies (422), unknown routes (404). Note
some of these are **client errors (4xx)**, tracked in a separate dashboard panel from **server
errors (5xx)** — a 4xx is the caller's fault, a 5xx means the service itself broke.

---

## Running it on Azure

The same stack runs on the Azure VM via `docker-compose.azure.yml`, deployed by
`infra/ansible/playbook.yml` through the `Deploy Docker Images` GitHub Action. Unlike local, it's
reachable from a browser, not exposed with default credentials:

| Tool | URL |
|---|---|
| Grafana | `https://grafana.<vm-ip>.nip.io` |
| Prometheus | `https://prometheus.<vm-ip>.nip.io` |
| Jaeger | `https://jaeger.<vm-ip>.nip.io` |

**Two layers of auth** protect these:
1. **Traefik HTTP Basic Auth** — required just to load the page. Configured via a Traefik
   *file-provider* config (`infra/ansible/templates/traefik-dynamic.yml.j2`), rendered by Ansible
   directly onto the VM — deliberately **not** passed through a docker-compose `${VAR}`, because
   Compose's env-file interpolation mangles `$` characters found in htpasswd-style hashes
   (confirmed empirically: `admin:$apr1$abc...` silently collapses to `admin:`). Rendering via
   Jinja2 sidesteps that entirely.
2. **Grafana's own login** — a real generated `GRAFANA_ADMIN_USER`/`PASSWORD`, not local's
   `admin`/`admin`.

Prometheus and Jaeger have no login of their own — Basic Auth is their *only* protection, so
don't skip setting it up.

### One-time setup

Before the first deploy that includes this stack, add to the repo's `Azure` GitHub environment:

| Type | Name | Value |
|---|---|---|
| Variable | `GRAFANA_ADMIN_USER` | e.g. `admin` |
| Secret | `GRAFANA_ADMIN_PASSWORD` | a real random password (avoid `$` — this one *does* go through plain compose interpolation) |
| Secret | `MONITORING_BASIC_AUTH_USERS` | output of the command below |

Generate a password and its htpasswd hash locally (prefer running these yourself via `!` so the
password never lands in a chat transcript, and use `htpasswd`'s interactive prompt so it's not
saved in shell history either):
```bash
LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32; echo   # for GRAFANA_ADMIN_PASSWORD
htpasswd -nB admin                                              # prompts for password, no echo
# or, without httpd-tools installed:
echo "admin:$(openssl passwd -apr1 'your-password')"
```
Paste the full `admin:$2y$...` (or `$apr1$...`) line as the `MONITORING_BASIC_AUTH_USERS` secret.

Until these three exist, the `Deploy Docker Images` workflow will fail (or Traefik will error on
an empty middleware) — this is intentional; production secrets in this repo are never given
silent local-style defaults (see the "Azure vs. local env var philosophy" note below).

### Azure vs. local env var philosophy

`docker-compose.yml` (local) gives every variable a `:-default` fallback so a fresh clone runs
with zero setup — this was a deliberate fix (commit `1362d2b`) after a past incident where a
missing `.env` file broke a grader's run. `docker-compose.azure.yml` intentionally does the
**opposite**: no defaults for secrets (`POSTGRES_PASSWORD`, `JWT_SECRET`,
`GOOGLE_CLIENT_SECRET`, and now `GRAFANA_ADMIN_PASSWORD` all require a real value). This is safe
specifically because Azure only ever runs through the Ansible pipeline with a fully-populated
`.env.prod` — never cloned-and-run ad hoc — so there's no equivalent failure mode to guard against
there.

---

## Troubleshooting

- **A panel says "No data"** — check whether any request has actually hit that status/service
  yet; `sum by (job, status) (http_server_requests_seconds_count)` in Prometheus shows every
  status code seen per job.
- **`{job="..."}` returns nothing in Loki** — Loki streams here use `service`/`container`/`project`
  labels, not `job`. Use `curl http://localhost:3100/loki/api/v1/labels` to see what's actually
  available.
- **A service's error shows up on `api-gateway` but not the service itself** — the gateway can
  generate its own 5xx (e.g. a transient connection failure calling a downstream service) that
  never touched that service at all; check Loki for which container actually logged the
  exception.
- **`redis` (or any container) fails with "port is already allocated"** — something else on the
  host already holds that port; override the host-side mapping via the corresponding `*_PORT`
  variable in `infra/.env`, container-to-container traffic is unaffected.
