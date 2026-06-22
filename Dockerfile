# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variáveis VITE_* são injetadas no bundle em build-time.
# O Railway as expõe como build args quando declaradas aqui.
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL

RUN npm run build

# ---- serve ----
FROM caddy:2-alpine
COPY --from=build /app/dist /srv/dist
COPY Caddyfile /etc/caddy/Caddyfile
