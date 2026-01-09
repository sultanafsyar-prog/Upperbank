FROM alpine:latest

RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Beri izin eksekusi file (Penting agar tidak error)
RUN chmod +x /pb/pocketbase

# Salin migrations jika ada
COPY ./pb_migrations /pb/pb_migrations

# Railway menggunakan port dinamis, kita paksa ke 8080 sesuai settingan tadi
EXPOSE 8080

# Jalankan dengan host 0.0.0.0 agar bisa diakses publik
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]