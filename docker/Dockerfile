FROM node:lts-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

# NOTE: In case we are building locally and have put a file here
RUN rm -f public/configuration.json

RUN pnpm run setup:vocabs /app/vocab.json && \
  pnpm run build

FROM nginx:alpine

EXPOSE 80

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/entrypoint.sh /entrypoint.sh

RUN ln -s /configuration.json /usr/share/nginx/html/configuration.json

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
