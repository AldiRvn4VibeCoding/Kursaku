# Tampilkan daftar perintah
default:
    just --list

# Jalankan web untuk development
r:
    npm run dev

# Install dependency sesuai lockfile
install:
    npm ci

# Build produksi
build:
    npm run build

# Jalankan hasil build produksi
start:
    npm run start
