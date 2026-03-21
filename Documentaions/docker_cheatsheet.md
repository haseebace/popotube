# 🐳 PoPoTube Docker Crash Course

Here are the most common Docker Compose commands you will need to manage, build, and debug your application.

## 🏗️ 1. Building the Containers
You must run this whenever you change [package.json](file:///Users/haseebace/Desktop/Projects/popotube/package.json) dependencies, or whenever you modify the Next.js frontend code (since Next.js builds the static bundle during the Docker build step).

```bash
# Build the containers (no -d flag exists for building)
docker compose build

# Build the containers completely from scratch (ignores cache, useful if things get weird)
docker compose build --no-cache
```

## 🚀 2. Running your Application
This is how you turn everything on.

```bash
# Start all containers in the background (Detached mode)
docker compose up -d

# Start all containers IN the terminal (Useful for debugging, but you can't close the terminal)
docker compose up

# Build AND Start in the background in one command
docker compose up -d --build
```

## 🛑 3. Stopping your Application

```bash
# Stop all running containers gracefully (Leaves your data intact)
docker compose down

# Stop all containers AND wipe all database volumes (WARNING: Deletes persistent data)
docker compose down -v
```

## 🕵️ 4. Checking the Logs
When running in `-d` (detached) mode, you can't see the console output. Use these commands to see what your apps are doing.

```bash
# View live, scrolling logs for ALL services
docker compose logs -f

# View live logs for JUST the backend
docker compose logs -f backend

# View live logs for JUST the frontend
docker compose logs -f frontend

# See ONLY the last 50 lines of the backend logs
docker compose logs --tail=50 backend
```

## 🧹 5. Cleaning Up (When Docker breaks)
Sometimes Docker takes up too much hard drive space or caches bad builds. Use these if you are stuck.

```bash
# Nuke everything unused (stopped containers, unused images, dangling caches)
docker system prune -a

# See what containers are currently running right now
docker ps
```
