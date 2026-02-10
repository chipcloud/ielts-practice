@echo off
chcp 65001 >nul
echo ==========================================
echo    IELTS Practice - Database Manager
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if container exists
docker ps -a --format "{{.Names}}" | findstr "^ielts-postgres$" >nul
if errorlevel 1 (
    echo [INFO] Creating new PostgreSQL container...
    docker-compose up -d
    if errorlevel 1 (
        echo [ERROR] Failed to create container!
        pause
        exit /b 1
    )
    echo [SUCCESS] Container created!
    echo [INFO] Waiting for database to be ready...
    timeout /t 5 /nobreak >nul
) else (
    REM Check if container is running
    docker ps --format "{{.Names}}" | findstr "^ielts-postgres$" >nul
    if errorlevel 1 (
        echo [INFO] Starting existing container...
        docker start ielts-postgres
        timeout /t 3 /nobreak >nul
    ) else (
        echo [INFO] Container is already running.
    )
)

echo.
echo ==========================================
echo    Database Status
echo ==========================================
docker ps --filter "name=ielts-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo Connection Info:
echo   Host:     localhost
echo   Port:     5432
echo   Database: ielts_practice
echo   Username: postgres
echo   Password: postgres123
echo.
echo Adminer (DB GUI): http://localhost:8080
echo.
pause
