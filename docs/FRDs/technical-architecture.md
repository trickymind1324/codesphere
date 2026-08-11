# Feature Requirement Document (FRD): Universal Code Execution Engine (UCE)

## 1. Introduction {#introduction}

The **UCE (Universal Code Engine)** is the backend service responsible
for compiling, running, and testing user-submitted code securely. It is
the \"brain\" of CodeSphere.

## 2. Functional Requirements {#functional-requirements}

### 2.1 Multi-Language Support {#multi-language-support}

- **Day 1 Support:** Python 3.9+, JavaScript (Node.js 18+), Java 17,
  > C++, SQL (PostgreSQL), React (WebContainer).

- **Architecture:** Dockerized containers for each language runtime.

### 2.2 Security & Isolation (The Sandbox) {#security-isolation-the-sandbox}

- **Requirement:** User code must NEVER access the host server or other
  > users\' sessions.

- **Solution:**

  - Use **Ephemeral Docker Containers** or **Firecracker MicroVMs** (AWS
    > Lambda style).

  - **Resource Limits:** Cap CPU usage at 50%, Memory at 512MB,
    > Execution Time at 5s.

  - **Network Ban:** Disable internet access within the container
    > (except for specific whitelisted APIs if needed for real-world
    > tasks).

### 2.3 Real-Time Execution (WebSocket) {#real-time-execution-websocket}

- **Requirement:** Output must stream to the client immediately (e.g.,
  > print(\"Hello\") shows up before the script finishes).

- **Protocol:** WebSocket connection between Client IDE -\> API Gateway
  > -\> Code Runner Service.

### 2.4 \"Real-World\" File System {#real-world-file-system}

- **Requirement:** Support not just single strings of code, but a
  > virtual file system (VFS).

- **Input:** A JSON object representing the file tree structure.  
  > {  
  > \"root\": {  
  > \"src\": {  
  > \"App.js\": \"content\...\",  
  > \"utils.js\": \"content\...\"  
  > },  
  > \"package.json\": \"content\...\"  
  > }  
  > }

- **Execution:** The Runner mounts this JSON as a physical volume inside
  > the Docker container before execution.

## 3. Non-Functional Requirements {#non-functional-requirements}

- **Latency:** Time from clicking \"Run\" to seeing first output \<
  > 500ms.

- **Scalability:** Must handle 10,000 concurrent code executions
  > (requires auto-scaling Kubernetes cluster).

- **Reliability:** 99.9% Uptime (Code runners are stateless; if one
  > crashes, spin up another).

## 4. API Endpoint Definition (Draft) {#api-endpoint-definition-draft}

**POST /api/v1/execute**

- **Request:**  
  > {  
  > \"language\": \"python\",  
  > \"files\": \[  
  > {\"name\": \"main.py\", \"content\": \"print(\'hello\')\"}  
  > \],  
  > \"stdin\": \"input_data\"  
  > }

- **Response:**  
  > {  
  > \"stdout\": \"hello\n\",  
  > \"stderr\": \"\",  
  > \"exit_code\": 0,  
  > \"execution_time_ms\": 120  
  > }
