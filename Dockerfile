# Build stage
FROM node:20-alpine AS build

# Install pnpm (pin to v9 to match lockfileVersion 9.0 and ensure compatibility with Node 20)
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package configuration files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build argument for API URL (injected at build time)
ARG VITE_API_URL=http://76.13.233.243:3090
ENV VITE_API_URL=${VITE_API_URL}

# Run the build
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from build stage to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 inside the container
EXPOSE 80


# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
