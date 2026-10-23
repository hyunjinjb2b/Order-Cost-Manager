@echo off
setlocal

cd /d "%~dp0"

set "LOCAL_NODE_DIR=%~dp0.tools\node-v22.23.2-win-x64"

if exist "%LOCAL_NODE_DIR%\node.exe" if exist "%LOCAL_NODE_DIR%\npm.cmd" (
  set "PATH=%LOCAL_NODE_DIR%;%PATH%"
  set "NPM_CMD=%LOCAL_NODE_DIR%\npm.cmd"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js was not found.
    echo The bundled Node.js files are also missing from .tools.
    pause
    exit /b 1
  )

  where npm.cmd >nul 2>nul
  if errorlevel 1 (
    echo npm was not found.
    pause
    exit /b 1
  )

  set "NPM_CMD=npm.cmd"
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call "%NPM_CMD%" install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo Starting local app...
echo Open this URL in your browser:
echo http://localhost:3000
echo.

call "%NPM_CMD%" run dev

pause
