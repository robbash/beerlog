declare namespace NodeJS {
  interface ProcessEnv {
    APP_NAME: string;

    DATABASE_URL: string;

    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL?: string;

    // PAYPAL_CLIENT_ID="your-sandbox-client-id"
    // PAYPAL_CLIENT_SECRET="your-sandbox-secret"
    // PAYPAL_ENV="sandbox"
    // NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-sandbox-client-id"

    SMTP_HOST: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_SENDER?: string;

    DEFAULT_BEER_PRICE_CENTS?: string;
    PAYPAL_ME_ID?: string;

    APP_BASE_URL?: string;

    /** Shared secret for /api/cron/*. Without it the cron endpoints stay closed. */
    CRON_SECRET?: string;
    /** Hours between two log reminders per person. Defaults to 4. */
    LOG_REMINDER_INTERVAL_HOURS?: string;
    /** Maximum reminders per person before a campaign gives up. Defaults to 6. */
    LOG_REMINDER_MAX_COUNT?: string;
  }
}
