# Stage 1: Build the React application
FROM node:24-alpine AS build
WORKDIR /app
COPY . .
COPY ./.env.prod ./.env
RUN npm install
RUN npm run build 

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the built files from the 'build' stage to the Nginx static file directory

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.config /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80
# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
