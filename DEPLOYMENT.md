# WiFly Deployment Guide

This guide covers deploying the WiFly Next.js application to Firebase and setting up a PostgreSQL database.

## 1. Prerequisites

-   A [Firebase](https://firebase.google.com/) project.
-   A [Google Cloud](https://cloud.google.com/) account with billing enabled (required for Cloud Functions).
-   [Node.js](https://nodejs.org/) and `npm` installed locally.
-   [Firebase CLI](https://firebase.google.com/docs/cli) installed and authenticated (`npm install -g firebase-tools`, then `firebase login`).
-   A free-tier PostgreSQL database provider. We recommend [Supabase](https://supabase.com/) or [ElephantSQL](https://www.elephantsql.com/).

## 2. Setting up PostgreSQL

1.  **Create a Database**: Sign up for Supabase or another provider and create a new project/database.
2.  **Get Connection String**: Find the database connection string (URI). It will look something like this:
    `postgres://user:password@host:port/database`
3.  **Run Schema**: Connect to your new database using a tool like `psql`, DBeaver, or the provider's web interface and run the contents of `schema.sql` to create the necessary tables.

## 3. Configuring Firebase for Next.js

1.  **Initialize Firebase**: In your project root, run:
    ```bash
    firebase init hosting
    ```
2.  When prompted:
    -   Select **"Use an existing project"** and choose your Firebase project.
    -   For "What do you want to use as your public directory?", enter **`.next`**. This is important for Next.js.
    -   Configure as a single-page app (SPA)? **No**.
    -   Set up automatic builds and deploys with GitHub? **No** (for now).

This creates `firebase.json` and `.firebaserc` files.

## 4. Environment Variables

Your deployed functions need access to the secrets defined in `.env.local.example`.

### For Cloud Functions for Firebase:

You can set these secrets using the Firebase CLI. **Do not commit your `.env.local` file.**

```bash
# Replace ... with your actual values
firebase functions:config:set \
  secrets.jwt_secret="your-super-secret-jwt-key..." \
  secrets.intasend_public_key="your_intasend_public_key..." \
  secrets.intasend_secret_key="your_intasend_secret_key..." \
  secrets.africastalking_username="your_africastalking_username" \
  secrets.africastalking_api_key="your_africastalking_api_key" \
  secrets.database_url="postgres://..." \
  secrets.next_public_base_url="https://your-domain.com" \
  secrets.email_from="noreply@yourdomain.com" \
  secrets.email_smtp_host="smtp.yourprovider.com" \
  secrets.email_smtp_port="587" \
  secrets.email_smtp_user="your_smtp_username" \
  secrets.email_smtp_pass="your_smtp_password"
```

The application's server-side code will need to be configured to read these at runtime.

### For Firebase App Hosting (Recommended)

If you are using Firebase App Hosting (the modern way to deploy Next.js apps on Firebase):

1. Go to the Firebase Console -> App Hosting.
2. Link your GitHub repository.
3. In the "Backend settings", you can securely add your secrets. The environment variable names should match those in `.env.local.example`.

### Local Development

For local development, copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

## 5. Deploying the Application

With Firebase App Hosting, deployment is triggered by a `git push` to your linked branch (e.g., `main`).

If you are using the older Firebase Hosting + Cloud Functions model:

1.  **Build your Next.js app**:
    ```bash
    npm run build
    ```
2.  **Deploy to Firebase**:
    ```bash
    firebase deploy
    ```

This command will deploy your Next.js application, with static parts going to Firebase Hosting and dynamic parts (API Routes, Server Actions) being automatically wrapped in Cloud Functions.

## 6. Final Steps

1.  **Update Stripe Webhook**: In your Stripe dashboard, update your webhook endpoint to point to your deployed URL: `https://your-domain.com/api/webhook`.
2.  **Update Nodogsplash Config**: Update `/etc/config/nodogsplash` on your OpenWrt router to point to your new production domain. Refer to `CONFIGURATION.md`.
3.  **Testing**: Connect a device to your hotspot Wi-Fi network and test the full authentication flow.
