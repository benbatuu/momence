#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  OpenAPI Doğrulama ve Kırıcı Değişiklik  "
echo "=========================================="

BASE_BRANCH="${1:-origin/main}"
CURRENT_SPEC="docs/openapi.json"
BASE_SPEC="docs/openapi-base.json"

# docs dizinini oluştur
mkdir -p docs

# Eğer docs/openapi.json henüz yoksa veya boşsa, minimal OpenAPI 3.0 şablonu oluştur (T-005'te dinamik üretilecek)
if [ ! -f "$CURRENT_SPEC" ]; then
  cat << 'EOF' > "$CURRENT_SPEC"
{
  "openapi": "3.0.0",
  "info": {
    "title": "Studio OS API",
    "version": "1.0.0",
    "description": "Multi-tenant Pilates & Yoga Stüdyo Yönetim API"
  },
  "paths": {
    "/health": {
      "get": {
        "summary": "Sağlık Kontrolü",
        "responses": {
          "200": {
            "description": "Sunucu durumu"
          }
        }
      }
    }
  }
}
EOF
  echo "✔ Örnek OpenAPI spesifikasyonu hazırlandı: $CURRENT_SPEC"
fi

# JSON geçerlilik denetimi
node -e "JSON.parse(require('fs').readFileSync('$CURRENT_SPEC', 'utf8'))"
echo "✔ OpenAPI spesifikasyonu geçerli bir JSON formatında."

# Base branch'ten eski spesifikasyonu çekmeyi dene
if git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  if git show "$BASE_BRANCH:$CURRENT_SPEC" > "$BASE_SPEC" 2>/dev/null; then
    echo "✔ Karşılaştırma için temel dal ($BASE_BRANCH) spesifikasyonu bulundu."
    
    # Basit kırıcı değişiklik denetimi (Node.js ile endpoint silinme kontrolü)
    node -e "
      const fs = require('fs');
      const base = JSON.parse(fs.readFileSync('$BASE_SPEC', 'utf8'));
      const curr = JSON.parse(fs.readFileSync('$CURRENT_SPEC', 'utf8'));
      
      const basePaths = Object.keys(base.paths || {});
      const currPaths = new Set(Object.keys(curr.paths || {}));
      
      const removedPaths = basePaths.filter(p => !currPaths.has(p));
      if (removedPaths.length > 0) {
        console.error('❌ KRİTİK: Temel dalda var olan endpoint(ler) kaldırılmış (Kırıcı Değişiklik!):', removedPaths);
        process.exit(1);
      }
      console.log('✔ OpenAPI kırıcı değişiklik denetimi başarılı: Hiçbir mevcut endpoint kaldırılmadı.');
    "
    rm -f "$BASE_SPEC"
  else
    echo "ℹ Temel dalda $CURRENT_SPEC bulunamadı, kırıcı değişiklik kontrolü atlanıyor."
  fi
else
  echo "ℹ Karşılaştırma dalı ($BASE_BRANCH) bulunamadı veya ilk commit; kırıcı değişiklik kontrolü atlanıyor."
fi

echo "✔ OpenAPI doğrulaması tamamlandı."
