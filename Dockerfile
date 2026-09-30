# Site do Pontual: build do Vite servido pelo nginx, que também repassa
# "/api" e "/files" para a API (tudo num endereço só)
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .

# A API fica no mesmo endereço, em /api
ENV VITE_API_URL=/api
RUN yarn build

FROM nginx:1.27-alpine

# Endereço da API dentro do Docker (o compose chama o serviço de "api")
ENV API_UPSTREAM=http://api:3333

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
