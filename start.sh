#!/bin/bash
# Diamond Scout — Production Server
# Run this to start the app. Access from any device on the same WiFi.

export PATH="$HOME/node-dist/node-v22.12.0-darwin-arm64/bin:$PATH"
cd "$(dirname "$0")"

# Show local network IP so you know what to type on iPad
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Diamond Scout — Grand Rapids Thunderhawks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Local:   http://localhost:3000"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")
echo "  Network: http://$IP:3000"
echo ""
echo "  On your iPad or other device, open:"
echo "  http://$IP:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm start
