# syntax=docker/dockerfile:1

# --- build: Astro estático → dist/ ---
FROM node:22-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /src
RUN corepack enable
# Deps primero (cache): package.json + lock + workspace (este último trae el
# allowBuilds:esbuild que el build necesita).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# PUBLIC_API_URL se hornea en el build: Astro lo inlinea en import.meta.env y con
# él el buscador de agencias pasa a consultar el API real (GET /v1/agencies, sin
# key: lectura pública rate-limitada por IP) en vez de los datos de ejemplo. NO
# es secreto —es la URL pública del API y viaja al navegador—, por eso vive acá y
# no como GitHub Secret: así el MISMO Dockerfile produce el modo vivo tanto en el
# deploy local como en CI.
ARG PUBLIC_API_URL=https://api.tracking-peru.com
ENV PUBLIC_API_URL=$PUBLIC_API_URL
# PUBLIC_TURNSTILE_SITE_KEY: la site key del CAPTCHA de Cloudflare en el alta
# gratis. Es PÚBLICA por diseño (viaja en el HTML, es su lugar), así que vive acá
# como default y no como secret — el mismo Dockerfile activa el widget en local y
# en CI. La SECRET va en el backend (TURNSTILE_SECRET). Con esta seteada, el
# widget se renderiza; sin ella, el alta funciona sin CAPTCHA.
ARG PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAETKJDOCmZGZxLoj
ENV PUBLIC_TURNSTILE_SITE_KEY=$PUBLIC_TURNSTILE_SITE_KEY
RUN pnpm build

# --- runtime: nginx sirve el estático ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
