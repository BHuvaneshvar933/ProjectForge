# Benchmarking

This folder contains basic load-testing scripts so you can measure and document ProjectForge performance.

## Prerequisites

- Backend running locally at `http://localhost:5000`
- A valid JWT token stored somewhere you can copy (from login response)
- At least one projectId where the token user is an active member (for chat tests)

## HTTP Load Test (Locust)

1. Install Locust (Python):

```bash
pip install locust
```

2. Set env vars:

- `PF_TOKEN` (required): JWT token string (without `Bearer `)

3. Run:

```bash
locust -f bench/locustfile.py --host=http://localhost:5000
```

4. Open the Locust UI and run scenarios.

## WebSocket Load Test (Socket.io)

1. Install deps:

```bash
npm -C bench install
```

2. Run:

```bash
npm -C bench run socket
```

Env vars:

- `PF_TOKEN` (required): JWT token string (without `Bearer `)
- `PF_PROJECT_ID` (required): projectId where user is an active team member
- `PF_SOCKET_URL` (optional): defaults to `http://localhost:5000`
- `PF_CONCURRENCY` (optional): defaults to `50`
- `PF_MESSAGES_PER_CLIENT` (optional): defaults to `2`

## Results

Fill these in after running:

- HTTP: 50 users, spawn rate 5/s:
  - p50 latency:
  - p95 latency:
  - RPS:

- Socket.io: 50/100/150 concurrent:
  - join success rate:
  - message ack success rate:
  - avg send->receive latency:
