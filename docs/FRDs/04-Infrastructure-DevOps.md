# FRD-04: Infrastructure & DevOps

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft

## 1. Overview

This document defines the infrastructure architecture, deployment strategies, CI/CD pipelines, and operational excellence practices for CodeSphere.

## 2. Cloud Platform Strategy

### 2.1 Primary Cloud Provider
**AWS (Amazon Web Services)** as primary provider

**Rationale:**
- Mature ecosystem with comprehensive services
- Strong Kubernetes support (EKS)
- Excellent developer tools (CodePipeline, CodeBuild)
- Global infrastructure with 30+ regions
- Competitive pricing with reserved instances and spot instances

### 2.2 Multi-Cloud Consideration
- **Secondary:** Google Cloud Platform (for AI/ML workloads, Vertex AI)
- **CDN:** Cloudflare (for DDoS protection and global edge network)
- **Avoid Vendor Lock-in:** Use Kubernetes for portability

### 2.3 Regions
- **Primary:** us-east-1 (N. Virginia) - lowest latency for US East Coast
- **Secondary:** eu-west-1 (Ireland) - serve European users
- **Future:** ap-southeast-1 (Singapore) - serve Asian market

## 3. Infrastructure Architecture

### 3.1 High-Level Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │ (CDN, DDoS protection)
                    │   + WAF         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  AWS CloudFront │ (Additional CDN layer)
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
       ┌──────▼──────┐            ┌────────▼────────┐
       │  Static     │            │  Application    │
       │  Assets     │            │  Load Balancer  │
       │  (S3)       │            │  (ALB)          │
       └─────────────┘            └────────┬────────┘
                                           │
                                  ┌────────▼────────┐
                                  │   API Gateway   │
                                  │   (EKS)         │
                                  └────────┬────────┘
                                           │
                   ┌───────────────────────┼───────────────────┐
                   │                       │                   │
            ┌──────▼──────┐      ┌────────▼────────┐   ┌──────▼──────┐
            │  Backend    │      │  Code Execution │   │  AI/ML      │
            │  Services   │      │  Service        │   │  Service    │
            │  (EKS)      │      │  (EKS + Fargate)│   │  (ECS/GPU)  │
            └──────┬──────┘      └────────┬────────┘   └──────┬──────┘
                   │                      │                    │
                   └──────────────┬───────┴────────────────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
            ┌──────▼──────┐  ┌───▼────┐   ┌─────▼─────┐
            │ PostgreSQL  │  │ Redis  │   │    S3     │
            │   (RDS)     │  │ Elastic│   │  (Object  │
            └─────────────┘  │ Cache  │   │  Storage) │
                             └────────┘   └───────────┘
```

### 3.2 Compute Resources

#### EKS (Elastic Kubernetes Service) - Primary Workloads
- **API Gateway:** 3-10 pods (t3.medium instances)
- **Backend Services:** 5-20 pods (t3.medium to t3.large)
- **Code Execution:** 10-100 pods (c5.xlarge - CPU-optimized)
- **Worker Queues:** 2-10 pods (t3.small)

**Node Groups:**
- **General Purpose:** t3.medium (2 vCPU, 4GB RAM) for API services
- **Compute Optimized:** c5.xlarge (4 vCPU, 8GB RAM) for code execution
- **Memory Optimized:** r5.large (2 vCPU, 16GB RAM) for analytics
- **Spot Instances:** 50% of code execution nodes (cost savings)

#### ECS Fargate - AI/ML Workloads
- **Use Case:** GPU-intensive tasks (model inference)
- **Instance Type:** p3.2xlarge (1 NVIDIA V100 GPU) for heavy models
- **Alternative:** g4dn.xlarge (1 NVIDIA T4 GPU) for lighter models

#### Lambda - Serverless Functions
- **Use Cases:**
  - Email sending (SNS triggers)
  - PDF report generation
  - Webhook handlers
  - Scheduled tasks (cron jobs)
- **Runtime:** Node.js 18, Python 3.11

### 3.3 Data Layer

#### RDS PostgreSQL
- **Instance:** db.r5.xlarge (4 vCPU, 32GB RAM) - Multi-AZ
- **Storage:** 500GB GP3 SSD (provisioned IOPS: 3000)
- **Backup:** Automated daily backups, 30-day retention
- **Read Replicas:** 2 replicas for read-heavy queries
- **Connection Pooling:** PgBouncer (separate EC2 instance)

#### ElastiCache Redis
- **Instance:** cache.r5.large (2 vCPU, 13.5GB RAM)
- **Mode:** Cluster mode enabled (for horizontal scaling)
- **Nodes:** 3 nodes (1 primary, 2 replicas)
- **Backup:** Daily snapshots

#### S3 Buckets
- **skillforge-assets:** User uploads (profile pictures, resumes)
- **skillforge-backups:** Database backups, snapshots
- **skillforge-archives:** Cold storage (old submissions, logs)
- **skillforge-static:** Frontend static files (Vite build output)
- **Lifecycle Policies:** Move to Glacier after 90 days (archives)

#### Elasticsearch
- **Service:** AWS OpenSearch Service
- **Instance:** r5.large.search (3 nodes for HA)
- **Storage:** 100GB EBS per node
- **Use Case:** Full-text search for problems, submissions

### 3.4 Networking

#### VPC (Virtual Private Cloud)
- **CIDR:** 10.0.0.0/16
- **Public Subnets:** 10.0.1.0/24, 10.0.2.0/24 (for ALB, NAT Gateway)
- **Private Subnets:** 10.0.10.0/24, 10.0.11.0/24 (for EKS nodes, RDS)
- **Availability Zones:** us-east-1a, us-east-1b (for HA)

#### Security Groups
- **ALB Security Group:** Allow 80, 443 from 0.0.0.0/0
- **EKS Node Security Group:** Allow 443, 10250 (kubelet) from ALB
- **RDS Security Group:** Allow 5432 from EKS nodes only
- **Redis Security Group:** Allow 6379 from EKS nodes only

#### NAT Gateway
- **Purpose:** Allow EKS nodes in private subnets to access internet (for package downloads)
- **HA:** One NAT Gateway per AZ

## 4. Kubernetes Configuration

### 4.1 Cluster Setup
```yaml
# eksctl cluster config
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: skillforge-prod
  region: us-east-1
  version: "1.28"

nodeGroups:
  - name: general-purpose
    instanceType: t3.medium
    desiredCapacity: 5
    minSize: 3
    maxSize: 10
    labels:
      workload: general
    tags:
      environment: production

  - name: compute-optimized
    instanceType: c5.xlarge
    desiredCapacity: 10
    minSize: 5
    maxSize: 100
    spot: true  # Use spot instances for cost savings
    labels:
      workload: code-execution
    taints:
      - key: workload
        value: code-execution
        effect: NoSchedule

  - name: memory-optimized
    instanceType: r5.large
    desiredCapacity: 2
    minSize: 2
    maxSize: 5
    labels:
      workload: analytics

managedNodeGroups: []

addons:
  - name: vpc-cni
  - name: coredns
  - name: kube-proxy
```

### 4.2 Key Deployments

#### API Gateway Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: skillforge/api-gateway:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: production
spec:
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### Code Execution Service (with node affinity)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: code-execution
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: code-execution
  template:
    metadata:
      labels:
        app: code-execution
    spec:
      tolerations:
      - key: workload
        operator: Equal
        value: code-execution
        effect: NoSchedule
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: workload
                operator: In
                values:
                - code-execution
      containers:
      - name: code-execution
        image: skillforge/code-execution:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
      volumes:
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock
```

### 4.3 Horizontal Pod Autoscaler (HPA)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 4.4 Secrets Management
- **Tool:** AWS Secrets Manager + External Secrets Operator
- **Secrets:**
  - Database credentials
  - Redis connection strings
  - JWT signing keys
  - Third-party API keys (OpenAI, Stripe, SendGrid)
  - OAuth client secrets

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-credentials
  data:
  - secretKey: connection-string
    remoteRef:
      key: prod/database/postgres
      property: connection_string
```

## 5. CI/CD Pipeline

### 5.1 Git Workflow
- **Branching Strategy:** Trunk-based development
  - `main` branch: production-ready code
  - `feature/*` branches: short-lived feature branches
  - `hotfix/*` branches: urgent production fixes
- **Pull Requests:** Required for all changes, 2 approvals minimum

### 5.2 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm type-check

      - name: Run tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build-images:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push API Gateway image
        run: |
          docker build -t skillforge/api-gateway:${{ github.sha }} -f services/api-gateway/Dockerfile .
          docker tag skillforge/api-gateway:${{ github.sha }} $ECR_REGISTRY/api-gateway:latest
          docker push $ECR_REGISTRY/api-gateway:${{ github.sha }}
          docker push $ECR_REGISTRY/api-gateway:latest
```

### 5.3 CD Pipeline (ArgoCD)

**Why ArgoCD?**
- GitOps approach: Kubernetes manifests in Git are source of truth
- Automatic sync: Detects changes in Git and applies to cluster
- Rollback: Easy rollback to previous versions
- Multi-cluster support: Deploy to dev, staging, prod

**ArgoCD Application:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-gateway
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/skillforge/infrastructure
    targetRevision: main
    path: kubernetes/api-gateway
    helm:
      valueFiles:
      - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 5.4 Deployment Environments
- **Development:** Developers' local machines (Docker Compose)
- **Staging:** Kubernetes cluster (smaller instance sizes, us-east-1)
- **Production:** Kubernetes cluster (full-scale, multi-region)

### 5.5 Deployment Strategy
- **Rolling Update:** Default for most services (zero downtime)
- **Blue-Green:** For database migrations or major changes
- **Canary:** For high-risk changes (10% traffic to new version, monitor, then 100%)

```yaml
# Blue-Green deployment example
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-gateway
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: api-gateway
      previewService: api-gateway-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 300
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: skillforge/api-gateway:latest
```

## 6. Monitoring & Observability

### 6.1 Metrics (Prometheus + Grafana)
**Prometheus:** Scrapes metrics from services every 15s
**Grafana:** Visualizes metrics with pre-built dashboards

**Key Metrics:**
- **Request Rate:** Requests per second by endpoint
- **Latency:** p50, p95, p99 response times
- **Error Rate:** 5xx errors per second
- **Saturation:** CPU, memory, disk usage per pod
- **Custom:**
  - Code executions per minute
  - Active WebSocket connections
  - Queue depth (code execution jobs)

**Grafana Dashboard Example:**
- **API Gateway Dashboard:** Request rate, latency, error rate by endpoint
- **Code Execution Dashboard:** Queue depth, execution time, success rate
- **Database Dashboard:** Queries per second, slow queries, connection pool usage

### 6.2 Logging (ELK Stack)
**Elasticsearch:** Stores logs
**Logstash:** Ingests logs from services (via Fluentd or Filebeat)
**Kibana:** Search and visualize logs

**Log Format (JSON):**
```json
{
  "timestamp": "2025-01-15T10:30:45Z",
  "level": "INFO",
  "service": "api-gateway",
  "message": "Request received",
  "request_id": "abc123",
  "user_id": "user-456",
  "method": "POST",
  "path": "/api/v1/execute",
  "status": 200,
  "duration_ms": 150
}
```

**Log Retention:**
- **Hot:** 7 days in Elasticsearch
- **Warm:** 30 days in S3
- **Cold:** 90 days in Glacier (compliance)

### 6.3 Distributed Tracing (Jaeger)
**Purpose:** Trace requests across microservices
**Example Trace:**
1. API Gateway receives request (span 1: 50ms)
2. Routes to Problem Service (span 2: 30ms)
3. Problem Service queries database (span 3: 20ms)
4. Total: 100ms

**Instrumentation:**
- **Node.js:** `opentelemetry-js`
- **Go:** `opentelemetry-go`
- **Rust:** `opentelemetry-rust`

### 6.4 Uptime Monitoring
- **Tool:** UptimeRobot or Pingdom
- **Checks:** HTTP health endpoints every 1 minute
- **Alerts:** Slack, PagerDuty for downtime

### 6.5 Error Tracking
- **Tool:** Sentry
- **Integration:** Frontend (React) and backend services
- **Features:**
  - Real-time error notifications
  - Stack traces with source maps
  - Error grouping and trends
  - User impact analysis

## 7. Alerting & Incident Response

### 7.1 Alert Rules (Prometheus Alertmanager)
```yaml
groups:
- name: api-gateway-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate on API Gateway"
      description: "Error rate is {{ $value }} errors/sec"

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High latency on API Gateway"
      description: "p95 latency is {{ $value }}s"

  - alert: PodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Pod {{ $labels.pod }} is crash looping"
```

### 7.2 Incident Response
- **On-Call Rotation:** PagerDuty with weekly rotations
- **Runbooks:** Documented procedures for common incidents
  - Database connection errors → Check connection pool, restart pods
  - High latency → Check for slow queries, scale up pods
  - Service down → Check logs, restart deployment
- **Post-Mortems:** Blameless post-mortems for all production incidents

## 8. Disaster Recovery & Business Continuity

### 8.1 Backup Strategy
- **Databases:** Automated daily backups, 30-day retention
- **S3 Data:** Cross-region replication to eu-west-1
- **Kubernetes State:** etcd backups daily via Velero

### 8.2 Recovery Procedures
- **Database Restore:** Point-in-time recovery from RDS snapshots (< 1 hour)
- **Cluster Failure:** Failover to standby region (< 30 minutes)
- **Data Center Outage:** Multi-AZ deployment ensures HA

### 8.3 Chaos Engineering
- **Tool:** Chaos Monkey (by Netflix) or Gremlin
- **Tests:**
  - Random pod terminations (test auto-healing)
  - Network latency injection (test timeout handling)
  - Resource exhaustion (test resource limits)
- **Frequency:** Monthly in staging, quarterly in production

## 9. Cost Optimization

### 9.1 Strategies
- **Reserved Instances:** 1-year commitment for baseline compute (30% savings)
- **Spot Instances:** 50% of code execution nodes (70% savings)
- **Auto-Scaling:** Scale down during off-peak hours (nights, weekends)
- **S3 Lifecycle Policies:** Move old data to Glacier (90% cheaper)
- **Right-Sizing:** Use AWS Compute Optimizer for instance recommendations

### 9.2 Cost Monitoring
- **Tool:** AWS Cost Explorer + Kubecost (for Kubernetes)
- **Budget Alerts:** Notify when spending exceeds $10k/month
- **Cost Allocation Tags:** Tag resources by team, environment, service

## 10. Security Hardening

### 10.1 Network Security
- **WAF (Web Application Firewall):** Block SQL injection, XSS attacks
- **DDoS Protection:** Cloudflare + AWS Shield
- **Private Subnets:** EKS nodes and databases in private subnets (no public IPs)

### 10.2 Container Security
- **Image Scanning:** Trivy scans all images for vulnerabilities before deployment
- **Non-Root Containers:** Run containers as non-root user
- **Read-Only Filesystem:** Mount root filesystem as read-only where possible
- **Network Policies:** Restrict pod-to-pod communication

### 10.3 Access Control
- **IAM Roles:** Fine-grained permissions for services (least privilege)
- **RBAC (Kubernetes):** Role-based access for developers
- **MFA:** Required for all AWS console access
- **Bastion Host:** Jump server for SSH access to private instances

## 11. Success Metrics

- **Deployment Frequency:** Daily deployments to production
- **Lead Time:** < 1 hour from code commit to production
- **Change Failure Rate:** < 5% of deployments cause issues
- **MTTR (Mean Time to Recovery):** < 30 minutes for incidents
- **Uptime:** 99.9% availability (43 minutes downtime/month)
- **Cost per User:** < $0.50/month per active user
