# GlyphOS Unified Interface - Dockerfile

# Use a lightweight Nginx image
FROM nginx:alpine

# Copy the static site files to Nginx's html directory
# The trailing slash ensures we copy the contents, not the folder itself
COPY OS/ /usr/share/nginx/html/

# Ensure permissions are correct (readable by everyone)
RUN chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
