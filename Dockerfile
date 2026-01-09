FROM alpine:latest

RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Beri izin eksekusi
RUN chmod +x /pb/pocketbase

# Salin migrations jika ada
COPY ./pb_migrations /pb/pb_migrations

# EXPOSE port default
EXPOSE 8080

# Jalankan PocketBase dengan folder data di /tmp agar bisa menulis file
CMD ["sh", "-c", "/pb/pocketbase serve --http=0.0.0.0:${PORT:-8080} --dir=/tmp/pb_data"]