FROM alpine:latest

RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Izin akses
RUN chmod +x /pb/pocketbase

# Salin migrations
COPY ./pb_migrations /pb/pb_migrations

# EXPOSE tidak perlu diisi angka spesifik, Railway yang akan atur
EXPOSE 8080

# PERINTAH PENTING: Menggunakan port dari Railway secara dinamis
CMD ["sh", "-c", "/pb/pocketbase serve --http=0.0.0.0:${PORT}"]