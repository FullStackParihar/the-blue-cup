FROM node:20-alpine AS base

# Setup npm
# (npm is pre-installed with node)

WORKDIR /app

# Copy the entire workspace
COPY . .

# Install dependencies
RUN npm install

# Build everything
RUN npm run build

# ==========================================
# Frontend Image
# ==========================================
FROM nginx:alpine AS client
COPY --from=base /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# Backend Image
# ==========================================
FROM node:20-alpine AS server
WORKDIR /app
COPY --from=base /app/apps/server/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/server/package.json ./package.json

EXPOSE 5000
CMD ["node", "dist/index.js"]
