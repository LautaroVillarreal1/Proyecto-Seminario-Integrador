FROM node:22-alpine AS build

WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sistema_gestor_remitos?schema=public

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --include=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma db push --force-reset --skip-generate && npm run db:seed && npm run start:prod"]