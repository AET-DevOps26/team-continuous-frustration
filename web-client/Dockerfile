FROM node:22.18.0-slim AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---

FROM node:22.18.0-slim AS builder

WORKDIR /app

# Baked into the built JS bundle at compile time (Vite), so they must be
# passed as build-args, not runtime container env vars. Keep in sync with
# study-service's STUDY_EASE_*/STUDY_HARD_FIRST_STEP_MINUTES env vars
# (see services/study-service/README.md).
ARG VITE_STUDY_EASE_MIN
ARG VITE_STUDY_EASE_AGAIN_PENALTY
ARG VITE_STUDY_EASE_HARD_PENALTY
ARG VITE_STUDY_EASE_EASY_BONUS
ARG VITE_STUDY_HARD_FIRST_STEP_MINUTES
ENV VITE_STUDY_EASE_MIN=$VITE_STUDY_EASE_MIN \
    VITE_STUDY_EASE_AGAIN_PENALTY=$VITE_STUDY_EASE_AGAIN_PENALTY \
    VITE_STUDY_EASE_HARD_PENALTY=$VITE_STUDY_EASE_HARD_PENALTY \
    VITE_STUDY_EASE_EASY_BONUS=$VITE_STUDY_EASE_EASY_BONUS \
    VITE_STUDY_HARD_FIRST_STEP_MINUTES=$VITE_STUDY_HARD_FIRST_STEP_MINUTES

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
