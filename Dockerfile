FROM node:20-alpine

WORKDIR /app

# Copy app files
COPY server.js .
COPY index.html .
COPY style.css .
COPY app.js .

# Expose port
EXPOSE 22318

# Run server
CMD ["node", "server.js"]