# ================================================================
# Studio OS — Makefile
# Kullanim: make <hedef>
# ================================================================

.PHONY: help dev dev-up dev-down dev-logs dev-ps dev-clean \
        db-migrate db-push db-seed db-studio db-reset \
        api-start api-build install

# Varsayilan hedef: yardim
help: ## Bu yardim mesajini goster
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─────────────────────────────────────────────────────────────────
# Geliştirme ortamı
# ─────────────────────────────────────────────────────────────────
dev: dev-up ## Tüm yığını başlat (Docker + API)
	@echo ""
	@echo "  ✅  Yerel yığın hazır!"
	@echo ""
	@echo "  📦  PostgreSQL   → localhost:5432"
	@echo "  🗄   Redis        → localhost:6379"
	@echo "  🪣  MinIO        → localhost:9000  (konsol: localhost:9001)"
	@echo "  📧  Mailpit      → localhost:1025  (UI: http://localhost:8025)"
	@echo ""
	@echo "  API başlatmak için:  make api-start"
	@echo ""

dev-up: ## Docker servislerini başlat (arka planda)
	@echo "▶  Docker servisleri başlatılıyor..."
	@if [ -S /var/run/docker.sock ]; then \
		docker compose up -d --wait; \
	elif [ -S $$HOME/.docker/run/docker.sock ]; then \
		DOCKER_HOST=unix://$$HOME/.docker/run/docker.sock docker compose up -d --wait; \
	else \
		echo "❌  Docker daemon çalışmıyor. Docker Desktop'ı başlat ve tekrar dene."; \
		exit 1; \
	fi
	@echo "✅  Servisler hazır."

dev-down: ## Docker servislerini durdur
	docker compose down

dev-logs: ## Tüm servislerin loglarını izle
	docker compose logs -f

dev-ps: ## Çalışan servisleri listele
	docker compose ps

dev-clean: ## Servisleri durdur ve volume'ları sil (veri sıfırlanır!)
	@echo "⚠️  Tüm yerel veri silinecek. Emin misin? [Ctrl+C ile iptal]"
	@sleep 3
	docker compose down -v
	@echo "✅  Ortam temizlendi."

# ─────────────────────────────────────────────────────────────────
# Veritabanı
# ─────────────────────────────────────────────────────────────────
db-migrate: ## Prisma migration uygula (geliştirme)
	cd apps/api && bunx prisma migrate dev

db-push: ## Prisma şemasını direkt uygula (prototipleme)
	cd apps/api && bunx prisma db push

db-seed: ## Örnek veri yükle
	cd apps/api && bunx prisma db seed

db-studio: ## Prisma Studio'yu aç
	cd apps/api && bunx prisma studio

db-reset: ## Veritabanını sıfırla ve seed'le
	cd apps/api && bunx prisma migrate reset

# ─────────────────────────────────────────────────────────────────
# API
# ─────────────────────────────────────────────────────────────────
api-start: ## API'yi geliştirme modunda başlat (hot reload)
	cd apps/api && bun run start

api-build: ## API'yi build et
	cd apps/api && bun run build

# ─────────────────────────────────────────────────────────────────
# Kalite ve CI Kontrolleri
# ─────────────────────────────────────────────────────────────────
lint: ## Kod lint denetimi
	bun run lint

typecheck: ## TypeScript tip kontrolü
	bun run typecheck

test: ## Tüm birim/entegrasyon testlerini çalıştır
	bun run test

check-boundaries: ## dependency-cruiser ile modül ve mimari sınırlarını denetle
	bun run check:boundaries

check-openapi: ## OpenAPI spesifikasyonu ve kırıcı değişiklik kontrolü
	./scripts/check-openapi.sh

ci: lint check-boundaries typecheck test check-openapi ## Tüm yerel CI kontrollerini koştur
	@echo "✅ Tüm yerel CI kontrolleri başarıyla geçti!"

# ─────────────────────────────────────────────────────────────────
# Genel
# ─────────────────────────────────────────────────────────────────
install: ## Tüm bağımlılıkları yükle
	bun install
