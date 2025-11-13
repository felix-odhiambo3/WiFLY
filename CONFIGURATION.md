# WiFly Configuration Guide

This guide provides instructions for configuring OpenWrt and Nodogsplash to work with the WiFly backend.

## Prerequisites

1.  A router flashed with a recent version of [OpenWrt](https://openwrt.org/).
2.  `ssh` access to your OpenWrt router.
3.  The WiFly application deployed and publicly accessible via HTTPS (e.g., `https://your-wifly-app.com`).

## 1. OpenWrt Basic Setup

Ensure your OpenWrt router has a working WAN (internet) connection and a separate LAN interface for the hotspot. For this guide, we'll assume the hotspot interface is `lan`.

## 2. Install Nodogsplash

Connect to your router via SSH and install Nodogsplash:

```bash
opkg update
opkg install nodogsplash
```

## 3. Configure Nodogsplash for RADIUS Authentication

The WiFly system supports two authentication modes:

### Option A: RADIUS Authentication (Recommended for Production)

For production deployment with FreeRADIUS server:

1. **Install FreeRADIUS** (see section 5 below)
2. **Configure Nodogsplash for RADIUS**:

```bash
# Run the RADIUS configuration script
chmod +x openwrt/nodogsplash-radius-config
./openwrt/nodogsplash-radius-config
```

This script will:
- Configure Nodogsplash to authenticate against FreeRADIUS
- Set up RADIUS server addresses and shared secrets
- Configure firewall rules for RADIUS traffic
- Allow access to WiFly portal and payment services

**Manual Configuration** (if you prefer to configure manually):

Edit `/etc/config/nodogsplash`:

```
config nodogsplash
    option enabled '1'
    option gateway_interface 'br-lan'
    option gateway_address '192.168.1.1'
    option max_clients '250'
    option preauth_idle_timeout '30'
    option auth_idle_timeout '120'
    option session_timeout '1440'  # 24 hours
    option web_root '/etc/nodogsplash/htdocs'
    option gateway_name 'WiFly Hotspot'

    # RADIUS Authentication
    option authenticate_immediately '1'
    option radius_auth_server '127.0.0.1:1812'
    option radius_auth_secret 'testing123'
    option radius_acct_server '127.0.0.1:1813'
    option radius_acct_secret 'testing123'
    option radius_realm 'wifly'
    option radius_nas_identifier 'WiFly-Hotspot'
    option radius_nas_port_type '19'

    # Allow access to portal and payment services
    list authenticated_users 'allow tcp port 80 to your-wifly-app.com'
    list authenticated_users 'allow tcp port 443 to your-wifly-app.com'
    list authenticated_users 'allow tcp port 443 to intasend.com'
    list authenticated_users 'allow tcp port 443 to *.intasend.com'
    list authenticated_users 'allow tcp port 443 to *.africastalking.com'
    list authenticated_users 'allow udp port 53'
    list authenticated_users 'allow tcp port 53'
```

### Option B: FAS Authentication (Development/Legacy)

For development or backward compatibility, you can still use Forwarding Authentication Service:

```
config nodogsplash
    option enabled '1'
    option gateway_interface 'br-lan'
    option gateway_address '192.168.1.1'
    option max_clients '250'
    option preauth_idle_timeout '60'
    option auth_idle_timeout '120'
    option session_timeout '720'
    option web_root '/etc/nodogsplash/htdocs'
    option gateway_name 'WiFly Hotspot'

    # FAS Configuration
    option fas_secure_enabled '2'
    option fas_host 'your-wifly-app.com'
    option fas_path '/api/auth'
    option fas_port '443'

    # Allow access to portal and payment services
    list authenticated_users 'allow tcp port 443 to your-wifly-app.com'
    list authenticated_users 'allow tcp port 443 to *.intasend.com'
    list authenticated_users 'allow tcp port 443 to *.africastalking.com'
    list authenticated_users 'allow udp port 53'
    list authenticated_users 'allow tcp port 53'
```

**IMPORTANT**: Replace `your-wifly-app.com` with your actual deployed WiFly application URL.

## 4. Firewall Rules (Important for Security)

Before authentication, users should only be able to access the captive portal and payment processor. The `authenticated_users` list in the Nodogsplash config helps, but you should also configure OpenWrt's firewall.

1.  **Restrict all traffic**: By default, Nodogsplash will block most traffic for unauthenticated users.
2.  **Allow Portal & Stripe**: The Nodogsplash configuration above whitelists your portal domain and `*.stripe.com`.
3.  **Allow DNS**: The configuration also allows DNS queries (port 53), which is essential.

This setup ensures that unauthenticated users can do nothing but access the captive portal to log in or pay.

## 5. FreeRADIUS Integration (Advanced)

While this project simulates database interactions, integrating with a real FreeRADIUS server would involve:

1.  **Database Backend for FreeRADIUS**: Configure FreeRADIUS to use a PostgreSQL database (`rlm_sql`). The schema provided in `schema.sql` can be adapted for FreeRADIUS's `radcheck` and `radacct` tables.
2.  **Dynamic Voucher Management**: Your Node.js backend would perform `INSERT` operations into the `radcheck` table to add new users/vouchers.
    -   **Attribute**: `Cleartext-Password`
    -   **op**: `:=`
    -   **Value**: The voucher code
3.  **Session Expiry**: Use the `Session-Timeout` attribute to enforce session duration.
4.  **MAC Address Binding**: You can use the `Calling-Station-Id` (which is the MAC address) to lock a voucher to a specific device.

Your WiFly backend would need database credentials for the FreeRADIUS database to manage these entries dynamically.

## 6. SSL with Let's Encrypt

Your WiFly backend and API **must** be served over HTTPS. If you're using a platform like Firebase, SSL is automatically handled.

If deploying on your own server (e.g., a VPS):
1.  **Install Certbot**: Follow the instructions at [certbot.eff.org](https://certbot.eff.org/) for your server's OS.
2.  **Obtain a Certificate**: Run Certbot to get a certificate for your domain. For a Node.js/Express app, you'd typically use a reverse proxy like Nginx.
    ```bash
    sudo certbot --nginx -d your-wifly-app.com
    ```
3.  **Auto-Renewal**: Certbot automatically sets up a cron job or systemd timer to renew certificates.
