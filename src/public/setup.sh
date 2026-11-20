#!/usr/bin/env bash
set -e

echo "=============================================================="
echo "      PRITHON ENTERPRISE MDM - 1-CLICK RETAIL PROVISIONER     "
echo "=============================================================="
echo ""

# Find ADB binary
ADB_BIN="adb"
if ! command -v adb &> /dev/null; then
    if [ -f "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
        ADB_BIN="$HOME/Library/Android/sdk/platform-tools/adb"
    else
        echo "[ERROR] 'adb' command not found. Please install Android platform-tools or add adb to PATH."
        exit 1
    fi
fi

echo "[1/4] Checking connected device..."
DEVICE_COUNT=$("$ADB_BIN" devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')
if [ "$DEVICE_COUNT" -eq "0" ]; then
    echo "[ERROR] No authorized Android device detected via USB!"
    echo ""
    echo "Please ensure:"
    echo "  1. Phone is connected with a USB data cable."
    echo "  2. Developer Options is enabled (Settings -> About Phone -> Tap Build Number 7 times)."
    echo "  3. USB Debugging is turned ON."
    echo "  4. 'Allow USB debugging' prompt is accepted on the phone screen."
    exit 1
fi
echo "[OK] Phone detected!"

echo ""
echo "[2/4] Downloading latest production Prithon DPC Release APK..."
curl -sSL "https://prithon-mdm-backend.onrender.com/download/app-release.apk" -o "/tmp/prithon-app-release.apk"

echo ""
echo "[3/4] Installing Prithon Device Guard..."
"$ADB_BIN" install -r -g "/tmp/prithon-app-release.apk"

echo ""
echo "[4/4] Activating Device Owner privileges..."
"$ADB_BIN" shell dpm set-device-owner com.prithon.dpc/.receivers.PrithonAdminReceiver || {
    echo "[NOTE] If set-device-owner failed, ensure no accounts (Google, WhatsApp, etc.) are present in Settings -> Passwords & Accounts."
}

echo ""
echo "Launching Prithon Device Guard..."
"$ADB_BIN" shell am start -n com.prithon.dpc/.ui.MainActivity

echo ""
echo "=============================================================="
echo "  [SUCCESS] Device is successfully bound to Prithon MDM Cloud!"
echo "=============================================================="
echo "Manage this phone now at: https://prithon-mdm-backend.onrender.com/dashboard"
echo ""
