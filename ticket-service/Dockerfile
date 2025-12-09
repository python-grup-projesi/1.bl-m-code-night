# Node.js ortamını kullan
FROM node:18-alpine
# Çalışma dizinini ayarla
WORKDIR /app
# Bağımlılık dosyalarını kopyala
COPY package*.json ./
# Bağımlılıkları yükle
RUN npm install
# Tüm kodları kopyala
COPY . .
# Servisin çalışacağı portu bildir
EXPOSE 5000
# Uygulamayı başlat
CMD ["npm", "run", "dev"]