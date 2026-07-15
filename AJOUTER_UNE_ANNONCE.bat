@echo off
setlocal
title Ajouter une annonce - L'Inventaire
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0OUVRIR_LE_SITE.ps1" -TargetPath "/admin/produits/nouveau"
if errorlevel 1 (
  echo.
  echo L'administration n'a pas pu demarrer.
  pause
)
endlocal
