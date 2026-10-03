# Studio OS — Monorepo

> **Çalışma adı:** Studio OS  
> Pilates, yoga ve butik wellness stüdyoları için çok kiracılı SaaS yönetim platformu.

---

## Hızlı Başlangıç (≤ 15 dakika)

### Gereksinimler

| Araç | Min. Sürüm | Kontrol |
|------|-----------|---------|
| [Bun](https://bun.sh) | 1.1+ | `bun --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ | `docker --version` |
| [Git](https://git-scm.com) | 2.x | `git --version` |

---

### 1. Depoyu klonla ve bağımlılıkları yükle

```bash
git clone https://github.com/yourorg/studio-os.git
cd studio-os
bun install
```

### 2. Ortam değişkenlerini ayarla

```bash
cp .env.example apps/api/.env
```

> `.env` içindeki değerler yerel Docker servisleriyle uyumludur.  
> Gerçek sırları (JWT, iyzico vb.) üretim ortamında vault/secret manager ile yönet.

### 3. Yerel yığını başlat

```bash
make dev
```

Bu komut şunları başlatır:

| Servis | Port | Açıklama |
|--------|------|----------|
| PostgreSQL 16 | `5432` | Ana veritabanı |
| Redis 7 | `6379` | Cache + kuyruk |
| MinIO | `9000` / `9001` | S3-uyumlu depolama (konsol: [localhost:9001](http://localhost:9001)) |
| Mailpit | `1025` / `8025` | SMTP yakalayıcı (UI: [localhost:8025](http://localhost:8025)) |

### 4. Veritabanı migration ve seed

```bash
make db-migrate   # Prisma migration uygula
make db-seed      # Örnek veri yükle
```

### 5. API'yi başlat

```bash
make api-start
```

API şu adreste çalışır: **http://localhost:3001**  
Swagger UI: **http://localhost:3001/swagger**  
Health check: **http://localhost:3001/health**

---

## Monorepo Yapısı

```
studio-os/
├── apps/
│   ├── api/          # Hono + Prisma (TypeScript) — ana API
│   ├── admin/        # Admin web paneli (Next.js) — TODO
│   ├── hosted/       # Hosted rezervasyon sayfası — TODO
│   └── mobile/       # Flutter müşteri uygulaması — TODO
├── packages/
│   ├── ui/           # Paylaşılan UI bileşenleri — TODO
│   ├── api-client/   # Üretilmiş API istemcisi — TODO
│   ├── widgets/      # Embed widget'lar — TODO
│   └── config/       # Ortak ESLint/TypeScript ayarları
├── infra/
│   └── postgres/     # PostgreSQL init script'leri
├── docs/
│   └── adr/          # Mimari Karar Kayıtları (ADR)
├── docker-compose.yml
├── Makefile
├── .env.example
└── turbo.json
```

---

## Yaygın Komutlar

```bash
make help          # Tüm komutları listele
make dev           # Yerel yığını başlat
make dev-down      # Servisleri durdur
make dev-logs      # Logları izle
make dev-clean     # Tüm yerel veriyi sil

make db-migrate    # Migration uygula
make db-seed       # Örnek veri yükle
make db-studio     # Prisma Studio'yu aç
make db-reset      # Veritabanını sıfırla

make api-start     # API'yi hot-reload ile başlat
make install       # Tüm bağımlılıkları yükle
```

---

## Geliştirme Kuralları

- `main` dalına direkt push yapılmaz; PR açılır.
- Her PR'da `bun lint` ve `bun test` geçmelidir.
- Üretim verisi maskelenmeden test/dev ortamına taşınamaz.
- Commit formatı: `type(scope): kısa açıklama` (Conventional Commits).

---

## Dokümantasyon

- [`tasks.md`](./tasks.md) — MVP görev listesi (T-001 … T-120)
- [`momence.md`](./momence.md) — Ürün tasarım belgesi
- [`docs/adr/`](./docs/adr/) — Mimari Karar Kayıtları
