FROM alpine:latest

RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Izin akses
RUN chmod +x /pb/pocketbase

# Salin migrations (agar tabel otomatis terbuat)
COPY ./pb_migrations /pb/pb_migrations

# Jalankan PocketBase dan simpan data ke folder Volume (/pb_data)
CMD ["sh", "-c", "/pb/pocketbase serve --http=0.0.0.0:${PORT:-8080} --dir=/pb_data"]