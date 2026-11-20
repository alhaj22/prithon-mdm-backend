@echo off
title Prithon MDM Enterprise 1-Click Provisioner
color 0B
echo ==============================================================
echo       PRITHON ENTERPRISE MDM - 1-CLICK RETAIL PROVISIONER
echo ==============================================================
echo.
echo [1/4] Checking ADB connection...
adb devices -l | findstr "device" >nul
if errorlevel 1 (
    echo [ERROR] No authorized Android device detected via USB!
    echo.
    echo Please make sure:
    echo  1. Phone is connected via USB cable.
    echo  2. Developer Options is enabled (Settings - About Phone - Tap Build Number 7 times).
    echo  3. USB Debugging is turned ON.
    echo  4. Allow USB Debugging prompt on the phone screen is accepted.
    echo.
    pause
    exit /b 1
)

echo [OK] Device detected!
echo.
echo [2/4] Downloading latest production Prithon DPC Release APK...
powershell -Command "Invoke-WebRequest -Uri 'https://prithon-mdm-backend.onrender.com/download/app-release.apk' -OutFile 'app-release.apk'"
if not exist "app-release.apk" (
    echo [ERROR] Failed to download APK. Check internet connection.
    pause
    exit /b 1
)

echo.
echo [3/4] Installing Prithon Device Guard on connected phone...
adb install -r -g app-release.apk
if errorlevel 1 (
    echo [ERROR] Installation failed! Please check if an older conflicting version exists.
    pause
    exit /b 1
)

echo.
echo [4/4] Activating Device Owner privileges...
adb shell dpm set-device-owner com.prithon.dpc/.receivers.PrithonAdminReceiver
if errorlevel 1 (
    echo [WARNING] Device owner command returned an alert.
    echo If accounts already exist, remove Google/WhatsApp accounts from phone Settings first.
)

echo.
echo Launching Prithon Device Guard on phone...
adb shell am start -n com.prithon.dpc/.ui.MainActivity

echo.
echo ==============================================================
echo  [SUCCESS] Device is successfully bound to Prithon MDM Cloud!
echo ==============================================================
echo You can now manage and lock this phone from your dashboard:
echo https://prithon-mdm-backend.onrender.com/dashboard
echo.
pause
