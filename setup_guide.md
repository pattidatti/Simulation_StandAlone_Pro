# Simulation StandAlone Pro - Linux Setup Guide

This guide helps you set up the development environment on Linux.

## Prerequisites

- **Node.js**: v18.19.1 or higher (v20+ recommended for best compatibility).
- **npm**: v9.2.0 or higher.
- **Git**: Installed.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Simulation_StandAlone_Pro
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```
    *Note: You may see warnings about peer dependencies (React 19 vs 18) and engine compatibility. These are generally safe to ignore for local development unless you encounter specific startup errors.*

## Running the Application

1.  **Start the development server**:
    ```bash
    npm run dev
    ```
    This will start Vite on `http://localhost:5173`.

2.  **Build for production**:
    ```bash
    npm run build
    ```

## Post-Clone checks (Linux specific)

If you encounter issues with file imports (e.g., "Module not found" due to case sensitivity):

1.  Run the fix imports workflow:
    ```bash
    # This feature is part of the agent workflow context, but manually you can check for casing matches.
    # The workflow `/fix-imports` is available via the agent.
    ```

## Database / Backend

The project uses Firebase. Configuration is located in `src/features/simulation/simulationFirebase.ts`.
- Ensure you have the necessary Firebase permissions if you plan to write to the production database.
- Database rules are in `database.rules.json`.
