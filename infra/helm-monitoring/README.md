# infra/helm-monitoring

Observability stack for team-continuous-frustration on Kubernetes (Rancher):
Prometheus + Alertmanager + Grafana (via `kube-prometheus-stack`), Loki (via
`loki-stack`) with Grafana Alloy shipping logs to it, and a hand-rolled
Jaeger all-in-one for tracing. Deployed into its own
`team-continuous-frustration-monitoring` namespace, separate from the
`team-continuous-frustration` app namespace.

## Cluster RBAC constraint (read this first)

The account used to deploy this chart on the shared TUM Rancher cluster only
has **namespace-scoped** RBAC - no rights to create
CustomResourceDefinitions, ClusterRoles, or ClusterRoleBindings (verified via
`kubectl auth can-i`). This was confirmed by running `helm install --dry-run=server`
against the real cluster and fixing each cluster-scoped resource it tried to
create until the dry-run passed cleanly. As a result, this chart assumes:

- **A Prometheus Operator is already running cluster-wide** (its CRDs -
  `prometheuses.monitoring.coreos.com`, `servicemonitors.monitoring.coreos.com`,
  etc. - are already registered; `kube-prometheus-stack.crds.enabled` and
  `kube-prometheus-stack.prometheusOperator.enabled` are both `false` here).
  This chart only creates the `Prometheus`/`Alertmanager`/`ServiceMonitor`/
  `PrometheusRule` custom resources and lets the existing operator reconcile
  them. **Verify a shared operator exists and watches your namespaces before
  relying on this** - if `kubectl get prometheuses -n team-continuous-frustration-monitoring`
  never produces a running StatefulSet after install, it doesn't, and the
  chart needs rework (either get the CRDs/operator RBAC granted, or use a
  cluster with a dedicated one).
- Discovery (`serviceMonitorNamespaceSelector` etc.) is restricted to the
  `team-continuous-frustration` and `team-continuous-frustration-monitoring`
  namespaces explicitly, rather than "all namespaces" - this makes the
  operator provision namespaced Roles for Prometheus's ServiceAccount
  instead of a ClusterRole.
- `kubeStateMetrics` runs scoped to those same two namespaces
  (`rbac.useClusterRole: false` + `namespaces: [...]`) instead of its
  default cluster-wide ClusterRole.
- `nodeExporter`, and the control-plane ServiceMonitors
  (`kubeApiServer`/`kubeControllerManager`/`kubeScheduler`/`kubeProxy`/
  `kubeEtcd`/`coreDns`) are disabled - they need host-level access or
  `kube-system` visibility this account doesn't have, and aren't part of
  the required best practices.
- `defaultRules.create` is `false` - the ~12 stock alert-rule groups assume
  cluster-wide kube-state-metrics/node-exporter data we don't have. Our own
  alerts live in `templates/prometheusrules.yaml`.
- Logs are shipped by Grafana Alloy rather than Promtail. Promtail tails
  local files via hostPath, so it needs a DaemonSet (one pod per node) and a
  cluster-wide ClusterRole for unrestricted pod discovery - neither of which
  this account/quota can afford on a 28-node cluster (see the `loki-stack`
  comment in `values.yaml`). Alloy's `loki.source.kubernetes` component
  instead tails logs through the Kubernetes API, so it runs as a single
  Deployment replica with namespaced Roles in our two namespaces
  (`alloy.rbac.namespaces` in `values.yaml` - the chart creates these
  natively, no custom RBAC template needed) instead of a ClusterRole.
- Grafana's dashboard/datasource sidecar runs with `rbac.namespaced: true`
  (Role, not ClusterRole) since the dashboard ConfigMap lives in the same
  namespace as Grafana anyway.

If you deploy this on a cluster where you *do* have cluster-admin rights,
all of the above can be safely re-enabled for a more complete picture
(cluster-wide service discovery, node metrics, control-plane dashboards).

## Prerequisites

1. Namespace exists: `kubectl create namespace team-continuous-frustration-monitoring`
   (already done per the task that created this chart).
2. An `nginx` IngressClass and a `letsencrypt-prod` ClusterIssuer are
   available cluster-wide (same ones the `infra/helm` app chart uses) -
   confirm with your cluster admin if unsure, or adjust
   `ingress.ingressClassName` / `*.clusterIssuer` in `values.yaml`.
3. Externally managed secrets (never commit these). `.github/workflows/deploy_k8s.yaml`
   creates/updates both from GitHub Actions secrets/vars (`GRAFANA_ADMIN_USER`,
   `GRAFANA_ADMIN_PASSWORD`, `MONITORING_BASIC_AUTH_USERS`) before every
   install. For a manual/local install, create them yourself, same convention
   as `app-secrets` in `infra/helm`:

   ```bash
   # Grafana admin login
   kubectl create secret generic grafana-admin-credentials \
     --from-literal=admin-user=admin \
     --from-literal=admin-password=<strong-password> \
     -n team-continuous-frustration-monitoring

   # Basic-auth gate in front of every UI (Grafana/Prometheus/Alertmanager/Jaeger)
   htpasswd -c auth admin
   kubectl create secret generic monitoring-basic-auth \
     --from-file=auth -n team-continuous-frustration-monitoring
   ```

## Install

```bash
cd infra/helm-monitoring
helm dependency update
helm upgrade --install monitoring . \
  --namespace team-continuous-frustration-monitoring \
  --values values.yaml
```

Also redeploy `infra/helm` (the app chart) - it now labels the five app
Services/Deployments with `monitoring: "true"` / `app: <name>` (for
ServiceMonitor discovery) and points the three Spring services'
`OTLP_TRACING_ENDPOINT` at this chart's Jaeger instance:

```bash
cd infra/helm
helm upgrade --install tcf . \
  --namespace team-continuous-frustration \
  --values values.yaml
```

## What's included

| Component | Purpose | Best-practice item |
|---|---|---|
| `kube-prometheus-stack` (Prometheus + Grafana) | metrics, dashboards | 1, 2, 5, 6 |
| Alertmanager | **disabled** - RBAC-blocked, see below | 8 (partial - rules evaluate, no routing) |
| `templates/servicemonitors.yaml` | one `ServiceMonitor` per app microservice, label-selected | 3, 4 |
| `templates/prometheusrules.yaml` | `ServiceDown`, `PodRestartingTooMuch`, `HighErrorRate*`, `SlowResponseTime*` | 8 |
| `templates/grafana-dashboards.yaml` + `dashboards/service-overview.json` | dashboard as code, auto-loaded via the Grafana sidecar | 5 |
| `loki-stack` (Loki) + `alloy` (log shipper) | log aggregation | parity with docker-compose stack |
| `templates/jaeger.yaml` | distributed tracing (all-in-one, badger-persisted) | parity with docker-compose stack |
| Ingress + `monitoring-basic-auth` on every UI | access control | 6 |
| PVCs (Prometheus, Grafana, Jaeger) | data survives restarts | 2 |

## Known gaps / follow-ups

- **Version visibility (best practice 7)**: the "Deployed Versions" panel in
  the dashboard queries `app_build_info{version="..."}`, a metric none of
  the services currently emit. Add a `Gauge` (Micrometer for the three
  Spring services, `prometheus_client` for genai-service/upload-service) set
  to `1` with a `version` label at startup to populate it - out of scope for
  this chart since it requires application code changes.
- **Alertmanager is disabled** (`kube-prometheus-stack.alertmanager.enabled:
  false`) - this account has read-only (`get`/`list`/`watch`) rights on the
  `alertmanagers.monitoring.coreos.com` CRD, confirmed via
  `kubectl auth can-i`, so it can never create one. `templates/prometheusrules.yaml`
  still evaluates in Prometheus either way; the alerts just have nowhere to
  route. Once `create`/`patch`/`update`/`delete` on that CRD is granted (or
  a shared Alertmanager instance elsewhere is identified to route to), set
  `alertmanager.enabled: true` and wire up a real receiver - the
  Slack-via-secret example is still in `values.yaml`, commented out.
- Confirm the shared Prometheus Operator assumption above actually holds
  before treating this as production-ready monitoring.
- **Alloy's API-based log tailing shifts cost onto the kubelets** instead of
  this namespace's quota - pulling logs via the Kubernetes API is more
  CPU/network-expensive per log line for the kubelet than local file tailing
  would be. Negligible at this app's traffic volume, but worth knowing if
  log volume grows a lot or the cluster admin flags kubelet load.
- **One-time manual fix required for the Grafana `Recreate` strategy
  change**: earlier releases of this chart left `deploymentStrategy` empty,
  so Kubernetes defaulted `spec.strategy` on the live Deployment to
  `RollingUpdate` with a `rollingUpdate` block outside Helm's field
  ownership. Now that `values.yaml` asserts `type: Recreate`, server-side
  apply rejects the upgrade (`rollingUpdate: Forbidden ... when type is
  Recreate`) because it won't clear a field it doesn't own - and a literal
  `rollingUpdate: null` in `values.yaml` doesn't help, since Helm's
  values-merge treats `null` as "delete this key" before the template ever
  sees it. Fix once, then `helm upgrade` proceeds normally:
  ```bash
  kubectl patch deployment monitoring-grafana -n team-continuous-frustration-monitoring \
    --type=json -p='[{"op":"remove","path":"/spec/strategy/rollingUpdate"}]'
  ```
