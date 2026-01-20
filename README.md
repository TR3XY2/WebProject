# Newton–Raphson WebProject

Full-stack web application for solving equations with the Newton–Raphson method. The project provides a React UI with authentication, real-time progress updates over SignalR, and an ASP.NET Core backend backed by PostgreSQL. It can be run locally for development or via Docker Compose behind an Nginx reverse proxy.

## Tech Stack

- **Frontend:** React, React-Bootstrap, Axios, SignalR client
- **Backend:** ASP.NET Core 8, Entity Framework Core, SignalR, Identity
- **Database:** PostgreSQL
- **Reverse proxy:** Nginx (TLS termination + load balancing)

## Repository Structure

- `newton-raphson-frontend/` – React application
- `newton-raphson-backend/` – ASP.NET Core API + SignalR hub
- `newton-raphson-tests/` – .NET tests
- `nginx/` – Nginx reverse proxy configuration + local TLS certs
- `docker-compose.yml` – Docker Compose setup for the full stack

## Getting Started (Docker)

The quickest way to run the full stack is Docker Compose.

```bash
docker compose up --build
```

Once running, open:

- https://localhost (React UI)
- https://localhost/api (API behind Nginx)

## Getting Started (Local Development)

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- PostgreSQL (or run just the database with Docker)

### Backend

Create `newton-raphson-backend/appsettings.json` with a connection string (use your own password):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=newtonraphsondb;Username=postgres;Password=your_password_here"
  }
}
```

Run the backend (from the backend folder, in **separate terminals**):

```bash
cd newton-raphson-backend
dotnet run --launch-profile Backend5001
dotnet run --launch-profile Backend5002
```

> On Windows, you can also use `run-backends.ps1` to start both instances.

### Frontend

```bash
cd newton-raphson-frontend
npm install
npm start
```

For local development without Nginx, manually edit these hardcoded JavaScript constants directly in the source files (defaults shown):

- `newton-raphson-frontend/src/App.jsx` → `API_BASE` (default: `https://localhost/api`)
- `newton-raphson-frontend/src/api/newtonRaphsonApi.js` → `API_BASE` (default: `https://localhost/api/NewtonRaphson`) and `HUB_URL` (default: `https://localhost/progressHub`)

Point them to the backend instance you want to hit (for example, `https://localhost:5001/api`, `https://localhost:5001/api/NewtonRaphson`, and `https://localhost:5001/progressHub`).
When using Docker Compose + Nginx, the default `https://localhost` values work.
For future maintenance, you may want to move these to environment variables.

### Trust the Development Certificate

If you are running the backend locally with HTTPS, trust the development certificate once:

```bash
dotnet dev-certs https --trust
```

## Tests

```bash
dotnet test
```

## Features

- Newton–Raphson equation solver with configurable tolerance and iteration limits
- Real-time progress updates via SignalR
- User authentication (register/login/logout)
- Solve history per user
