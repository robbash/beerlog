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

First, run the development server:

```bash
pnpm dev
```

## Building

```
docker build -f infra/docker/Dockerfile --platform=linux/amd64,linux/arm64 -t <your-image-tag> .
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
