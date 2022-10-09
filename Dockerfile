FROM ghcr.io/runcitadel/deno:main
WORKDIR /app

COPY . .

RUN deno cache --unstable app.ts

RUN apt update \
  && apt install -y curl \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["deno", "run", "--unstable", "--allow-all", "app.ts"]
