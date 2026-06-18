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
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

---

## About The Project

**ProjectForge** is a full-stack, real-time platform designed to streamline the way professionals and students discover projects, form teams, and collaborate. Whether you are looking to recruit skilled individuals for your next big idea, or seeking opportunities to contribute to exciting projects, ProjectForge provides the ecosystem to make it happen.

Built with performance, scalability, and user experience in mind, the platform bridges the gap between project ideation and execution.

### Key Features

* **Real-time Collaboration:** Instant messaging and notifications powered by Socket.io.
* **Project Discovery:** Browse, filter, and search through a diverse pool of projects.
* **Application System:** Seamlessly apply to projects or review incoming applications with custom workflows.
* **Team & Task Management:** Organize teams, assign roles, and track project tasks efficiently.
* **Comprehensive Analytics:** Gain insights into user engagement, project traction, and application success rates.
* **Secure Authentication:** JWT-based authentication with bcrypt password hashing.
* **Responsive UI:** A modern, mobile-first design built with Tailwind CSS and React 19.

---

## Tech Stack

### Frontend
- **React (v19)** - UI Library
- **Vite** - Frontend Build Tool
- **TailwindCSS (v4)** - Utility-first CSS Framework
- **React Router** - Navigation
- **Socket.io-client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js & Express** - Runtime & Web Framework
- **MongoDB & Mongoose** - Database & ODM
- **Socket.io** - WebSocket server
- **JWT & Bcrypt** - Security & Authentication
- **Multer** - File uploads handling

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
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
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

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Built by the ProjectForge Team</b>
</div>
