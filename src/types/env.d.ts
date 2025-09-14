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
  }
}
