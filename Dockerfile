FROM alpine:latest

RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Izin akses
RUN chmod +x /pb/pocketbase

# Salin migrations
COPY ./pb_migrations /pb/pb_migrations

# Jalankan PocketBase di folder /tmp agar tidak 'read-only error'
CMD ["sh", "-c", "/pb/pocketbase serve --http=0.0.0.0:${PORT:-8080} --dir=/tmp/pb_data"]