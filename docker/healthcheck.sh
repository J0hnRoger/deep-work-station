#!/bin/sh
# Health check script for nginx container

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "nginx is not running"
    exit 1
fi

# Check if the health endpoint responds
if ! wget --no-verbose --tries=1 --spider http://localhost/health; then
    echo "Health endpoint is not responding"
    exit 1
fi

echo "Health check passed"
exit 0