#!/bin/sh
# Keep the engine PID and the pipe protocol when handing off to the selected binary.
case $(uname -m) in
  aarch64|arm64)
    if "$0-dotprod" --probe >/dev/null 2>&1; then
      exec "$0-dotprod" "$@"
    fi
    exec "$0-arm64" "$@"
    ;;
  armv7*|armv8*|arm) exec "$0-armv7" "$@" ;;
  *) exit 2 ;;
esac
