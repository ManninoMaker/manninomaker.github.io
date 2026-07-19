@echo off
cd /d "%~dp0"
py build_portfolio.py
if errorlevel 1 python build_portfolio.py
pause
