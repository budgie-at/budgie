#!/bin/bash
# Image-build-time guest hygiene for macOS CI base VMs. Run once with sudo
# inside the base VM. Idempotent. Deliberately does NOT touch unified
# logging or guest swap (see docs: disabling swap converts pressure into
# process kills).
#
#   LAUNCH_DAEMONS_DIR  override for tests (default /Library/LaunchDaemons)
set -euo pipefail

LAUNCH_DAEMONS_DIR="${LAUNCH_DAEMONS_DIR:-/Library/LaunchDaemons}"

# 1. Permanently unload diagnosticd: a fresh simulator boot floods it, and
#    killing the process is useless because launchd respawns it. `bootout`
#    alone does not survive a reboot (the image build reboots the guest once),
#    so persist the intent with `disable` first. Best-effort because SIP may
#    deny this on some configurations.
if launchctl disable system/com.apple.diagnosticd 2>/dev/null; then
    echo "diagnosticd disabled persistently"
else
    echo "warning: could not disable diagnosticd (SIP may block this); continuing" >&2
fi
if launchctl bootout system/com.apple.diagnosticd 2>/dev/null; then
    echo "diagnosticd booted out"
else
    echo "warning: could not boot out diagnosticd (may already be stopped); continuing" >&2
fi

# 2. Raise process/file-descriptor limits: each booted simulator adds ~150
#    processes and ~3000 file descriptors; two lanes plus Maestro JVMs
#    exceed the default 2666-process ceiling.
write_limit_plist() {
    local plist_path="$1" label="$2" limit_flag="$3" soft="$4" hard="$5"

    cat > "$plist_path" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>$label</string>
    <key>ProgramArguments</key>
    <array>
        <string>launchctl</string>
        <string>limit</string>
        <string>$limit_flag</string>
        <string>$soft</string>
        <string>$hard</string>
    </array>
    <key>RunAtLoad</key><true/>
</dict>
</plist>
PLIST
    launchctl load -w "$plist_path" 2>/dev/null || true
}

write_limit_plist "$LAUNCH_DAEMONS_DIR/ci.limit.maxfiles.plist" ci.limit.maxfiles maxfiles 100000 300000
write_limit_plist "$LAUNCH_DAEMONS_DIR/ci.limit.maxproc.plist" ci.limit.maxproc maxproc 3500 4000

# 3. Spotlight off (idempotent; already policy for sealed job images).
mdutil -a -i off >/dev/null 2>&1 || mdutil -a -i off || true

echo "Guest hygiene applied."
