# --- deps: shared base for dev and build ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- dev stage: live Metro dev server with hot reload (web target) ---
# Source is bind-mounted over this in docker-compose.yml, so COPY here only
# matters if you build/run this stage standalone.
FROM deps AS dev
COPY . .
EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--port", "8081"]

# --- build stage: static web export used by the `serve` stage below ---
FROM deps AS build
COPY . .

# EXPO_PUBLIC_* vars are inlined into the JS bundle at build time, not read at
# container start — pass them as build args if they differ from .env.example.
ARG EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
ARG EXPO_PUBLIC_APP_NAME="Company Vault"
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_APP_NAME=$EXPO_PUBLIC_APP_NAME

RUN npx expo export -p web --output-dir dist

# --- serve stage: production nginx serving the static export ---
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
