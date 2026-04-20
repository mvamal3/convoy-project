@echo off
SET PROJECT_DIR=C:\Users\NIC\Desktop\convey-express\backend\src
SET SERVER_FILE=server.js
SET NODE_EXE=node.exe

cd /d %PROJECT_DIR%

REM Check if node server.js is already running
tasklist | findstr /I "%SERVER_FILE%" >nul

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Node server already running.
) ELSE (
    echo [%DATE% %TIME%] Node server not running. Starting...
    start "NodeServer" %NODE_EXE% %SERVER_FILE%
)

exit
