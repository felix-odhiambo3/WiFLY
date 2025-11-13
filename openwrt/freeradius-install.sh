#!/bin/sh
# FreeRADIUS Installation Script for OpenWrt
# This script installs and configures FreeRADIUS on OpenWrt for WiFly hotspot management

set -e

echo "Installing FreeRADIUS packages on OpenWrt..."

# Update package lists
opkg update

# Install FreeRADIUS core packages
opkg install freeradius3
opkg install freeradius3-mod-sql
opkg install freeradius3-mod-sql-postgresql
opkg install freeradius3-mod-files
opkg install freeradius3-mod-logintime
opkg install freeradius3-mod-expr

# Install PostgreSQL client (if not already installed)
opkg install libpq

echo "FreeRADIUS packages installed successfully."

# Create FreeRADIUS configuration directory structure
mkdir -p /etc/freeradius3
mkdir -p /etc/freeradius3/mods-available
mkdir -p /etc/freeradius3/mods-enabled
mkdir -p /etc/freeradius3/sites-available
mkdir -p /etc/freeradius3/sites-enabled
mkdir -p /etc/freeradius3/certs

echo "Configuration directories created."

# Copy configuration files (assuming they are in the same directory as this script)
# Note: In a real deployment, these would be copied from the WiFly repository

echo "FreeRADIUS installation completed."
echo ""
echo "Next steps:"
echo "1. Copy configuration files to /etc/freeradius3/"
echo "2. Configure PostgreSQL connection in mods-available/sql"
echo "3. Enable required modules: ln -s ../mods-available/sql mods-enabled/sql"
echo "4. Enable default site: ln -s ../sites-available/default sites-enabled/default"
echo "5. Start FreeRADIUS: /etc/init.d/freeradius start"
echo "6. Test configuration: freeradius -C"
echo "7. Enable auto-start: /etc/init.d/freeradius enable"
