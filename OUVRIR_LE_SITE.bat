@echo off
setlocal
title L'Inventaire
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0OUVRIR_LE_SITE.ps1"
if errorlevel 1 (
  echo.
  echo Le site n'a pas pu demarrer.
  pause
)
endlocal
