@echo off
title PocketBase Auto-Server
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set IP=%%a
)
echo ========================================
echo SERVER SEDANG BERJALAN
echo IP LAPTOP ANDA: %IP%
echo ----------------------------------------
echo LINK ADMIN: http://%IP%:8090/_/
echo ========================================
pocketbase.exe serve --http="%IP%:8090"
start /d "C:\Users\jaede\Inventory" npm start
pause

