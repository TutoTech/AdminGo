# --- AdminGo Flashcard SPA ---
# Serve static files with nginx:alpine
FROM nginx:alpine

# Copy static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY mentions-legales.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY database.csv /usr/share/nginx/html/
COPY particles.js /usr/share/nginx/html/

# Copy logo if present (optional)
COPY logo.pn[g] /usr/share/nginx/html/

# Expose port 80
EXPOSE 80
