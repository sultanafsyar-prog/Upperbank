FROM alpine:latest

# Instalasi tools yang dibutuhkan
RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase versi terbaru untuk Linux
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Salin data migrations dari laptop Anda ke server online
COPY ./pb_migrations /pb/pb_migrations

# Expose port agar bisa diakses
EXPOSE 8080

# Jalankan PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]