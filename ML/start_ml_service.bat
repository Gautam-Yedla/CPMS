@echo off
setlocal

REM Check if venv exists
if not exist "venv\Scripts\activate" (
    echo [INFO] Virtual environment not found. Creating one...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment. Please ensure Python is installed.
        pause
        exit /b %ERRORLEVEL%
    )
    
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate
    
    echo [INFO] Installing dependencies from requirements.txt...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
) else (
    echo [INFO] Activating existing virtual environment...
    call venv\Scripts\activate
)

echo [INFO] Starting ML Bridge API...
python src/api_bridge.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] ML Bridge API failed to start.
)
pause
