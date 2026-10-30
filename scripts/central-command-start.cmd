@echo off
cd /d "%~dp0.."
node scripts\central-command-start.mjs %*
if errorlevel 1 pause
