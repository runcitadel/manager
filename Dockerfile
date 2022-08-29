FROM ghcr.io/runcitadel/deno:main
WORKDIR /app

COPY . .

RUN deno cache app.ts

EXPOSE 3000

CMD ["deno", "run", "--allow-all", "app.ts"]
