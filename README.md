# Beer Log

This app was designed to replace our handball team's physical beerlog and allow
our players to track the beer consumption online. The idea is not to glorify
drinking, but to ease the process of charging for the beers. Players track their
own drinks and it's based on trust. It's been that way since we started playing
in adult teams.

The app started as a vibe-coding experiment using ChatGPT, and while it did some
good, it forgot other stuff. Code was incomplete and some lib version didn't
really go well with others. In the end I pulled it all apart and redid the whole
lot. Anyway, Chatty nudged me towards Prisma which I had not used before.

**EDIT**:

I started using [OpenCode.ai](https://opencode.ai) - that's next level, check it
out. I added a few features using it together with an Anthropic Pro
subscription.

To contain the AI, I run it in Docker. Check [OpenCode in Docker](https://github.com/robbash/opencode-docker)..

## Stack

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Auth.js](https://authjs.dev/)

## Development

```bash
cp .env.example .env # fill in DATABASE_URL and NEXTAUTH_SECRET
pnpm install
pnpm prisma migrate deploy
pnpm seed # optional, creates admin@example.com
pnpm dev
```

The app runs on http://localhost:3000.

## Database migrations

Migrations are applied automatically when the container starts. The entrypoint
runs `prisma migrate deploy` against `DATABASE_URL` before the app boots, so
deploying a new image brings its schema with it. Only migrations that have not
been applied yet are run, and the container exits instead of serving with an
out-of-date schema if they fail.

Set `RUN_MIGRATIONS=false` to skip the step, for example when a separate job
owns migrations or the app's database user may not alter the schema.

To apply them by hand against a database you can reach:

```bash
pnpm prisma migrate deploy
```

## Log reminders

Managers and admins can start a reminder campaign for an event date under
`/{locale}/reminders`: pick the date, pick who was there (the list shows
approved users without a log for that date, most frequent attendees first) and
the app emails them every few hours until they either log their drinks or use
the "I didn't drink" link in the mail.

Sending is driven externally by the `beerlog-log-reminders` CronJob, which posts
to `/api/cron/log-reminders` with a bearer token. The endpoint only sends what
is actually due, so calling it more often than the reminder interval is safe.

| Variable                      | Default | Purpose                                            |
| ----------------------------- | ------- | -------------------------------------------------- |
| `CRON_SECRET`                 | —       | Bearer token for `/api/cron/*`. Unset = closed.    |
| `LOG_REMINDER_INTERVAL_HOURS` | `4`     | Hours between two reminders per person.            |
| `LOG_REMINDER_MAX_COUNT`      | `6`     | Reminders per person before the campaign gives up. |

`APP_BASE_URL` must be set for the links in the emails to work.

## Building

```
docker build -f infra/Dockerfile --platform=linux/amd64,linux/arm64 -t <your-image-tag> .
```

## Deployment

### Kubernetes

There's a set of [Kubernetes](https://kubernetes.io/) manifests to be used with
[Kustomize](https://kustomize.io/). A sample set of kustomization files are
provided. Create a copy and update as needed.

Then create the secret and deploy:

```
kubectl create secret generic beerlog-dotenv-secrets -n {namespace} --from-env-file=.env

kubectl apply -k overlays/{your-deployment}
```

### Docker

Quite simple, just start the container and provide the env variables.

```
docker run --rm -p 3000:3000 --env-file .env  ghcr.io/robbash/beerlog:latest
```

Hint: Set `AUTH_URL=http://0.0.0.0:3000`.
