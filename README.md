# 🏒 Ice Hockey League Standings & Management Application


A full-stack web application designed to manage ice hockey league standings, teams, and player rosters. Built with a robust **Spring Boot** backend REST API and a modern **React + TypeScript** frontend.

---

## Features

* **Live Standings Table:** View updated league tables with team points, games played, wins, losses, overtime losses, and streak counts.
* **Team & Roster Explorer:** Inspect specific teams and view their complete active player rosters.
* **Multi-Competition Support:** Filter tables and teams by competition type (Regular Season, Playoffs) and season year.
* **Automated Data Seeding:** Embedded database initialization pre-loads demo teams, rosters, and standing tables on application startup.

---

## Tech Stack

### Backend
* **Java 25** / **Spring Boot 3**
* **Spring Data JPA & Hibernate:** Entity mapping with relational cascades.
* **H2 Database:** In-memory relational database for local development.
* **Jackson:** Specialized JSON serialization handling bidirectional entity references.

### Frontend
* **React 18** with **TypeScript**
* **Vite:** Lightning-fast build tool and local development server.
* **Axios / Fetch API:** Asynchronous API client for consuming backend REST endpoints.

---


## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/teams` | Fetch all teams (and their rosters) |
| `GET` | `/league-tables/{id}` | Fetch standings rows for a specific league table |
| `GET` | `/teams?competitionType={TYPE}&seasonYear={YEAR}` | Filter teams by competition and season |

---

## Getting Started

### Prerequisites
* **JDK 25+** (or Java 25)
* **Node.js** (v18+) and `npm`

### 1. Spring Boot Backend
1. Open the project in IntelliJ IDEA (or your preferred Java IDE).
2. Run `HockeyApplication.java`.
3. The server will start on `http://localhost:8080`.


### 2. React Frontend
1. Open a terminal in the frontend directory.
2. Install dependencies:
   ```bash
   npm install