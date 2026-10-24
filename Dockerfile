FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY server ./server
COPY multiplayer/engine.cjs multiplayer/shared.cjs ./multiplayer/
COPY index.html Bulk-Import*.html ./
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860
USER node
CMD ["node", "server/index.cjs"]
