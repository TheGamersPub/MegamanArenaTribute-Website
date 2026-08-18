@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  Simple Web Server for local testing of the Megaman build
REM  ------------------------------------------------------------
REM  Serves this folder (the site) on http://localhost:8000
REM  Usage:
REM    serve.bat            -> serves this folder on port 8000
REM    serve.bat 8080       -> custom port
REM ============================================================

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "PORT=8000"
if not "%~1"=="" set "PORT=%~1"

set "SERVER_JS=%~dp0serve.js"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH. Install it from https://nodejs.org
    pause
    exit /b 1
)

if not exist "%SERVER_JS%" (
    echo [ERROR] serve.js not found: "%SERVER_JS%"
    pause
    exit /b 1
)

echo [INFO] Starting server...
echo   Root: "%ROOT%"
echo   URL : http://localhost:%PORT%
echo   Press Ctrl+C to stop.
echo.

call node "%SERVER_JS%" "%ROOT%" "%PORT%"

echo.
echo [ERROR] Server stopped unexpectedly.
pause
