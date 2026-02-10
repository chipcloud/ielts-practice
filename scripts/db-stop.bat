@echo off
chcp 65001 >nul
echo ==========================================
echo    IELTS Practice - Stop Database
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker is not running.
    pause
    exit /b 0
)

REM Check if container exists
docker ps -a --format "{{.Names}}" | findstr "^ielts-postgres$" >nul
if errorlevel 1 (
    echo [INFO] Container does not exist.
    pause
    exit /b 0
)

echo [INFO] Stopping container...
docker stop ielts-postgres
if errorlevel 1 (
    echo [ERROR] Failed to stop container.
) else (
    echo [SUCCESS] Container stopped.
)

echo.
pause
