# Studio OS Monorepo Kullanım Rehberi

Bu rehber, Studio OS projesinin monorepo altyapısını kullanarak projeyi nasıl geliştireceğinizi, build alacağınızı ve veritabanı işlemlerini (Prisma) nasıl yöneteceğinizi detaylı olarak açıklamaktadır. Projede paket yöneticisi olarak **Bun** ve task runner olarak **Turborepo** kullanılmaktadır.

## 📂 Dizin Yapısı

Monorepo mimarisi şu şekilde kurgulanmıştır:

- **`apps/api`**: Backend (NestJS/Hono) API uygulaması.
- **`apps/admin`**: Frontend (Next.js) yönetim paneli uygulaması.
- **`apps/hosted`**, **`apps/mobile`**: Diğer uygulama bileşenleri.
- **`packages/*`**: Uygulamalar arası paylaşılan ortak modüller (örn: `ui`, `config`, `widgets`).

## 🚀 Çalıştırma (Development)

Tüm projeyi yerel geliştirme modunda çalıştırmak için kök dizinde şu komutu çalıştırabilirsiniz:

```bash
bun run dev
```
*(Eğer `package.json`'da dev scripti tanımlıysa, Turborepo ile tüm `dev` scriptleri aynı anda ayağa kalkar. Tekil olarak çalıştırmak isterseniz `cd apps/api && bun run start` vb. kullanabilirsiniz.)*

## 📦 Build Alma (Production)

Tüm uygulamaları ve paketleri eşzamanlı olarak derlemek için kök dizinde:

```bash
bun run build
```
Turborepo sayesinde daha önce derlenmiş ve değişmemiş olan uygulamalar önbellekten (cache) okunur ve derleme süresi ciddi oranda kısalır.

## 🗄️ Veritabanı ve Prisma İşlemleri

Projedeki backend uygulamanızda ORM olarak **Prisma** kullanılmaktadır. Prisma ile ilgili komutlar genellikle `apps/api` dizininde veya kök dizinden `bunx prisma` üzerinden çalıştırılır. Aşağıdaki komutları kullanırken **ilgili uygulamanın dizinine (`cd apps/api`) geçmeyi unutmayın**.

### 1. Prisma Client Üretme (Generate)
Şema değişikliklerinden sonra veritabanı istemcisini oluşturmak/güncellemek için:
```bash
cd apps/api
bunx prisma generate
```

### 2. Şemayı Veritabanına Basma (Push)
Geliştirme (development) ortamında, migration dosyası oluşturmadan direkt şemayı veritabanına eşitlemek için:
```bash
cd apps/api
bun run db:push
# veya
bunx prisma db push
```

### 3. Migration Oluşturma (Migrate)
Değişikliklerinizi versiyonlu bir migration dosyası olarak kaydetmek ve veritabanına uygulamak için (üretim/sahneleme ortamı pratikleri):
```bash
cd apps/api
bun run db:migrate
# veya
bunx prisma migrate dev --name <migration_adi>
```
*(Veritabanını sıfırdan kurmak veya prod ortamında migration uygulamak için `bunx prisma migrate deploy` kullanılır.)*

### 4. Başlangıç Verilerini Yükleme (Seed)
Veritabanınıza test veya başlangıç verilerini (roller, admin kullanıcısı, test stüdyoları vb.) eklemek için:
```bash
cd apps/api
bun run db:seed
```
*(Bu komut, `package.json` içindeki `prisma.seed` konfigürasyonuna bağlıdır ve genellikle `prisma/seed.ts` dosyasını çalıştırır.)*

### 5. Prisma Studio (Veritabanı İnceleme)
Veritabanınızı web arayüzü üzerinden tablo formatında görüntülemek ve düzenlemek için:
```bash
cd apps/api
bun run db:studio
# veya
bunx prisma studio
```
(Komut çalıştırıldıktan sonra http://localhost:5555 adresinden arayüze ulaşabilirsiniz.)

## 🧹 Temizlik ve Sorun Giderme

Eğer paketlerde veya build sırasında açıklanamayan hatalar yaşarsanız:
1. Kök dizindeki ve tüm `apps/*` dizinlerindeki `node_modules` klasörlerini ve `bun.lock` dosyalarını silin.
2. `bun install` ile paketleri yeniden yükleyin.
3. `cd apps/api && bunx prisma generate` komutu ile Prisma client'i mutlaka yeniden oluşturun.
4. `bun run build` komutu ile projenizi tekrar derleyin.

Studio OS geliştirme sürecinizde başarılar!
