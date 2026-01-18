# GlyphOS Unified Interface - Dockerfile

# Use a lightweight Nginx image
FROM nginx:alpine

# Copy the static site files to Nginx's html directory
COPY OS /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
