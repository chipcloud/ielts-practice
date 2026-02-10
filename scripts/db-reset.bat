@echo off
chcp 65001 >nul
echo ==========================================
echo    IELTS Practice - Reset Database
echo ==========================================
echo WARNING: This will DELETE all data!
echo.

set /p confirm="Are you sure? Type 'yes' to continue: "
if /I not "%confirm%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Stopping and removing container...
docker-compose down -v

echo [INFO] Removing Docker volume...
docker volume rm ielts-practice_postgres_data 2>nul

echo [INFO] Starting fresh container...
docker-compose up -d

echo.
echo [SUCCESS] Database has been reset!
echo [INFO] Run 'npm run db:migrate' to apply schema.
echo.
pause
