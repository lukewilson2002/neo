#!/bin/sh
# Install script for neo.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/lukewilson2002/neo/main/install.sh | sh
#
# Environment overrides:
#   NEO_VERSION=v0.2.0  Install a specific version (default: latest)
#   NEO_INSTALL_DIR=/usr/local/bin  Where to put the binary (default: ~/.local/bin)

set -eu

REPO="lukewilson2002/neo"
INSTALL_DIR="${NEO_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="${NEO_VERSION:-latest}"

err() { printf '\033[31merror:\033[0m %s\n' "$1" >&2; exit 1; }
info() { printf '%s\n' "$1"; }

case "$(uname -s)" in
  Linux*)  OS=linux ;;
  Darwin*) OS=darwin ;;
  MINGW*|MSYS*|CYGWIN*)
    err "Windows is not supported by this script. Download neo-windows-*.exe from https://github.com/$REPO/releases"
    ;;
  *) err "Unsupported OS: $(uname -s)" ;;
esac

case "$(uname -m)" in
  x86_64|amd64)   ARCH=x64 ;;
  arm64|aarch64)  ARCH=arm64 ;;
  *) err "Unsupported architecture: $(uname -m)" ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  err "curl is required but not installed"
fi

if [ "$VERSION" = "latest" ]; then
  VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
    | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' \
    | head -n1)
  if [ -z "$VERSION" ]; then
    err "Could not resolve latest version. Set NEO_VERSION=vX.Y.Z explicitly."
  fi
fi

ASSET="neo-$OS-$ARCH"
URL="https://github.com/$REPO/releases/download/$VERSION/$ASSET"

info "Downloading neo $VERSION ($OS-$ARCH)..."

mkdir -p "$INSTALL_DIR"
TMP=$(mktemp)
# shellcheck disable=SC2064
trap "rm -f '$TMP'" EXIT INT TERM

if ! curl -fsSL "$URL" -o "$TMP"; then
  err "Download failed: $URL"
fi

chmod +x "$TMP"
mv "$TMP" "$INSTALL_DIR/neo"

info "Installed neo to $INSTALL_DIR/neo"

case ":${PATH:-}:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    info ""
    info "Add $INSTALL_DIR to your PATH by adding this line to your shell profile:"
    info "  export PATH=\"$INSTALL_DIR:\$PATH\""
    ;;
esac

info ""
info "Run 'neo --help' to get started."
