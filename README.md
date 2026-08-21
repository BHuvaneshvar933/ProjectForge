

<div align="center">

  <h3 align="center">ProjectForge</h3>

  <p align="center">
    A comprehensive platform for building teams, managing projects, and seamless collaboration.
    <br />
    <br />
  </p>
</div>

<!-- BADGES -->
<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io" />
  <img src="https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS S3" />
</div>

---

## About The Project

ProjectForge is a full-stack, real-time platform designed to streamline the way professionals and students discover projects, form teams, and collaborate. Whether you are looking to recruit skilled individuals for your next big idea, or seeking opportunities to contribute to exciting projects, ProjectForge provides the ecosystem to make it happen.

Built with performance, scalability, and user experience in mind, the platform bridges the gap between project ideation and execution.

### Key Features

* **Real-time Collaboration Workspace:** Instant messaging powered by Socket.io, featuring markdown rendering, live typing indicators, read receipts, and file attachments.
* **Intelligent Project Discovery:** Skill-based project recommendation engine powered by MongoDB aggregation pipelines (Overlap Coefficient Algorithm).
* **Application System & Server-side Pagination:** Apple-style paginated workflows with status-based filtering to seamlessly apply to projects or review incoming applications. 
* **Advanced Task Management:** Organize your team with infinite-depth hierarchical subtasks, visual tree-branching in List view, and synchronized drag-and-drop Kanban boards.
* **Transaction-Safe Team Formation:** Secure MongoDB multi-document transactions to eliminate race conditions during concurrent project recruitment.
* **Smart UI & Theming:** A modern, highly polished dashboard layout featuring a custom "Smart Invert" Dark Mode architecture and responsive design.
* **Cloud Storage Integration:** Secure and scalable file uploads utilizing AWS S3 and multer-s3.
* **Comprehensive Analytics:** Gain insights into user engagement, project traction, and application success rates.

---

## Tech Stack

### Frontend
- **React (v19)** - UI Library
- **Vite** - High-performance Frontend Build Tool
- **TailwindCSS & Vanilla CSS** - Styling and layout foundation
- **React Router** - Navigation & Routing
- **Socket.io-client** - Real-time websocket communication
- **Axios** - HTTP client
- **Markdown & Syntax Highlighting** - Custom message rendering in chat

### Backend
- **Node.js & Express** - Runtime & Web Framework
- **MongoDB & Mongoose** - Database & ODM (Multi-document transactions utilized)
- **Socket.io** - WebSocket server for real-time events
- **JWT & Bcrypt** - Security & Authentication
- **AWS SDK (S3)** - Cloud object storage for file attachments
- **Multer & Multer-S3** - File uploads handling and streaming

---

## Project Structure

```bash
ProjectForge/
├── frontend/             # React/Vite Client Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages (Browse, Detail, etc.)
│   │   └── ...
│   └── package.json
├── backend/              # Node/Express API Server
│   ├── src/
│   │   ├── config/       # Database & env configurations
│   │   ├── controllers/  # Route controllers logic
│   │   ├── models/       # Mongoose Schemas (User, Project, Task, etc.)
│   │   ├── routes/       # Express API routes
│   │   ├── services/     # Business logic & Analytics
│   │   └── sockets/      # Socket.io event handlers
│   └── server.js
└── README.md
```

---

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

Ensure you have the following installed:
* Node.js (v18 or higher)
* MongoDB (Local instance or MongoDB Atlas)
* Git

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/BHuvaneshvar933/ProjectForge.git
   cd ProjectForge
   ```

2. **Setup Backend**
   ```sh
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_ORIGIN=http://localhost:5173
   ```

3. **Setup Frontend**
   ```sh
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory based on `.env.example`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

### Running the Application

**Run Backend (Development Mode)**
```sh
# Inside the backend directory
npm run dev
```

**Run Frontend (Development Mode)**
```sh
# Inside the frontend directory
npm run dev
```

The application will now be running on `http://localhost:5173` and the API server on `http://localhost:5000`.

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Testing & CI/CD

### How to Run Tests Locally
- **Backend Unit & API Tests:** `cd backend && npm run test`
- **Frontend Component Tests:** `cd frontend && npm run test`
- **End-to-End (E2E) Tests:** `npx playwright test` (from root dir)
- **Test Coverage:** Run `npm run coverage` in either backend/frontend directories.

### CI/CD Pipelines
We use GitHub Actions to enforce quality on every pull request and handle continuous deployment.

**CI Checks (On Pull Request to `main` or `dev`)**
1. Checks out repository and installs dependencies.
2. Runs code linter (`npm run lint`).
3. Executes Backend Unit/API Tests.
4. Executes Frontend Tests and computes coverage.
5. Builds the Frontend artifact.
6. Runs Playwright E2E tests and uploads the report artifact.
*(Pull requests are blocked if any of these quality gates fail).*

**CD Pipeline (On Merge to `main`)**
1. Mocks building the production artifact.
2. Executes a mock deployment.
3. Runs an automated post-deployment API Smoke Test (Health Check) to verify the live application is functioning correctly.
