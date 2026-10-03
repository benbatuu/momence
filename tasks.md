# Studio OS — MVP Görev Dosyası

> **Çalışma adı:** Studio OS (nihai marka adı `momence.md` Bölüm 13'e göre Momence'ten net ayrışmalıdır)
> **Kaynak plan:** `momence.md` (Taslak v1, 3 Ekim 2026)
> **Hazırlanma tarihi:** 3 Ekim 2026
> **Kapsam:** Yalnızca MVP. Uçtan uca tamamlanmış, pilot stüdyoda gerçek para ve gerçek rezervasyonla çalışan ilk sürüm.
> **Teknoloji kararları (bu dosyada sabit):** Monolitik (modüler) API · ödeme altyapısı **iyzico** · müşteri mobil uygulaması **Flutter**
> **Sıralama kuralı:** Ödemeler, entegrasyonlar ve mobil uygulama listenin **en sonundadır**. Öncesindeki her şey ödeme ve mobil olmadan da çalışır (satış kasadan elle girilir, müşteri web sayfasından rezervasyon yapar).

---

## İçindekiler

1. [Bu dosya nasıl okunur](#1-bu-dosya-nasıl-okunur)
2. [Uygulamanın amacı](#2-uygulamanın-amacı)
3. [Çözülen sorunlar ve ürün ilkeleri](#3-çözülen-sorunlar-ve-ürün-ilkeleri)
4. [Kullanıcılar ve roller](#4-kullanıcılar-ve-roller)
5. [MVP kapsamı: içinde ve dışında](#5-mvp-kapsamı-içinde-ve-dışında)
6. [Kavram sözlüğü (alan modeli)](#6-kavram-sözlüğü-alan-modeli)
7. [Uçtan uca kullanıcı yolculukları](#7-uçtan-uca-kullanıcı-yolculukları)
8. [İş kuralları (en ince ayrıntısıyla)](#8-iş-kuralları-en-ince-ayrıntısıyla)
9. [Ledger (defter) tasarımı](#9-ledger-defter-tasarımı)
10. [Teknik mimari ve sabit kararlar](#10-teknik-mimari-ve-sabit-kararlar)
11. [iyzico ödeme tasarımı](#11-iyzico-ödeme-tasarımı)
12. [Flutter mobil uygulama tasarımı](#12-flutter-mobil-uygulama-tasarımı)
13. [Nitelik hedefleri ve MVP kabul ölçütleri](#13-nitelik-hedefleri-ve-mvp-kabul-ölçütleri)
14. [Varsayımlar ve açık riskler](#14-varsayımlar-ve-açık-riskler)
15. [GÖREV LİSTESİ (T-001 … T-120)](#15-görev-listesi)
16. [Bağımlılık özeti ve kritik yol](#16-bağımlılık-özeti-ve-kritik-yol)

---

## 1. Bu dosya nasıl okunur

- Bölüm 2–14 **ne yapıldığını ve neden** anlatır. Bölüm 15 **hangi sırayla ve neyle yapılacağını** anlatır.
- Görev listesi **tek ve düz bir listedir**; faz yoktur. Görevler yürütme sırasına göre numaralanmıştır: `T-001` önce, `T-120` en son.
- Her görevde şu alanlar vardır:
  - **Etiket:** Görevin ait olduğu modül (`altyapı`, `kimlik`, `zamanlama`, `rezervasyon`, `ledger`, `ödeme`, `entegrasyon`, `mobil`, `web`, `test`, `uyum` …).
  - **Bağımlılık (zorunlu):** Bu görev başlamadan önce **bitmiş olması gereken** görevler. Bir görevin bağımlılıkları bitmeden başlanmaz.
  - **İlişkili (bilgi):** Bitmesi şart olmayan ama birlikte düşünülmesi gereken görevler (aynı tabloyu, aynı kuralı veya aynı ekranı etkiler). Çakışma ve tutarsızlık riskini azaltmak için not edilmiştir.
  - **Detay:** Yapılacak işin kapsamı.
  - **Kabul:** Görevin "bitti" sayılması için gerekenler. `momence.md` Ek B'deki Epic'lere atıf varsa belirtilmiştir.
- Durum işaretleri: `⬜ Beklemede` · `🟨 Devam` · `✅ Bitti`. Dosyayı repoda tutup işaretleri elle güncelle.
- **Tanım (Definition of Done)** — her görev için geçerli: birim/entegrasyon testi yazıldı · yetki kontrolü eklendi · yazan her işlem audit log'a düşüyor · OpenAPI güncel · yeni kullanıcı davranışı için analitik olayı var · gerekiyorsa dokümantasyon güncellendi.

---

## 2. Uygulamanın amacı

### 2.1 Tek cümlelik tanım

**Studio OS**, pilates, yoga, dans, cycling ve benzeri **butik fitness/wellness stüdyoları** için bulut tabanlı bir yönetim platformudur: stüdyo sahibi **dersleri programlar, ürün/paket/üyelik satar, rezervasyonları ve ödemeleri yönetir, ne kadar kazandığını görür**; stüdyonun müşterisi **web sayfasından ve mobil uygulamadan ders bulur, rezervasyon yapar, ödeme yapar, haklarını takip eder**.

### 2.2 Neden var?

`momence.md` analizinin sonucu: Momence gibi kapsamlı rakiplerin işlevi iyi, ancak **fiyatı opak, ödeme/rezervasyon güvenilirliği tartışmalı, zamanlaması bazı senaryolarda zahmetli, API'si kapalıdır**. Studio OS'un MVP'si bunların **ilk dördünü doğrudan hedefler**:

1. **Güvenilirlik özellikten önce gelir:** Çift girişli ledger, idempotent işlemler, kapasite yarışına dayanıklı rezervasyon, geri alınabilir silme, audit log.
2. **Şeffaflık:** Her ödeme satırında brüt tutar, ödeme sağlayıcı ücreti ve net tutar ayrı görünür. Rapor rakamları ledger ile birebir uyuşur.
3. **Zamanlama rahatlığı:** "Pazartesi-Çarşamba-Cuma 07:00" sınıfı **tek formda** kurulur; seride "yalnızca bu / bundan sonrası / tümü" düzenlemesi, etkilenen rezervasyon sayısı önizlemesiyle yapılır.
4. **Hızlı başlangıç:** Kayıttan ilk gerçek rezervasyona **15 dakika** (ölçülen hedef).

### 2.3 MVP'nin başarı tanımı

Üç pilot stüdyo, **en az 4 hafta boyunca** MVP'yi gerçek müşterileriyle kullanır; bu sürede **ödeme hata oranı < %1, overbooking = 0, ilk rezervasyona kadar süre < 15 dakika**, rapordaki gelir ile iyzico/ledger mutabakatı tutarlıdır (Bölüm 13).

### 2.4 İlk pazar ve dikey (varsayım)

- **Pazar:** Türkiye (TL, 3D Secure, taksit, KVKK). Bu yüzden ödeme sağlayıcısı iyzico'dur.
- **Dikey:** Pilates ve yoga butik stüdyoları (Reformer/mat, 1–3 hoca, 1–2 oda, 50–500 aktif müşteri).
- **Dil:** Arayüz Türkçe; altyapı çok dilli kurulur (ikinci dil hazırlığı), ancak MVP'de yalnızca Türkçe metin bakımı yapılır.
- **Para birimi:** TRY. Tutarlar **kuruş cinsinden tamsayı** olarak saklanır; para birimi alanı her kayıtta bulunur (ileride çoklu para birimine kapı açık).

---

## 3. Çözülen sorunlar ve ürün ilkeleri

### 3.1 Kullanıcı sorunları (MVP'nin ele aldıkları)

| # | Sorun | MVP'deki karşılık |
|---|---|---|
| 1 | Stüdyo sahibi dersleri tek tek, tekrar tekrar giriyor | RRULE'lu seri + şablon + dönem |
| 2 | Aynı koltuğa iki kişi yazılıyor, "son yer" kavgası | Satır kilidi + kısıt + 100 eşzamanlı istek testi |
| 3 | Hangi paketten hangi ders düşüldü belli değil | Kredi ledger'ı, her tüketimde neden ve kaynak görünür |
| 4 | Rapor ile banka/PSP uyuşmuyor | Rapor = ledger; günlük mutabakat işi |
| 5 | Yanlışlıkla silinen ders/müşteri geri gelmiyor | 30 gün yumuşak silme + "geri al" |
| 6 | Kim ne yaptı bilinmiyor | Audit log (kim, ne, ne zaman, hangi IP) |
| 7 | Müşteri rezervasyon için arayıp yazıyor | Hosted sayfa + embed + mobil uygulama (self servis) |
| 8 | Başka yazılımdan geçiş korkusu | CSV içe aktarma + kuru çalıştırma + fark raporu + tam dışa aktarma |

### 3.2 Yedi ürün ilkesi (kodlama kararlarında hakem)

1. **Şeffaflık varsayılandır.** Gizli ücret yok; ücret satırları panelde görünür.
2. **Güvenilirlik özellikten önce gelir.** Para ve rezervasyon akışı testten geçmeden yayına çıkmaz.
3. **API-first.** Arayüzün yaptığı her şeyi API yapar. Mobil uygulama, hosted sayfa ve admin panel **aynı API'yi** kullanır; "arka kapı" endpoint yok.
4. **Önizle, sonra uygula.** Toplu/yıkıcı işlemler önce "bu işlem N kaydı etkiler" önizlemesi gösterir.
5. **Geri alınabilirlik.** Yıkıcı işlemlerin çoğu yumuşak silmedir; para hareketleri silinmez, **ters kayıtla** düzeltilir.
6. **Taşınabilirlik.** Giriş de çıkış da kolay; tam veri dışa aktarma ilk sürümde vardır.
7. **15 dakikada ilk rezervasyon.** Her tasarım kararı bu hedefe karşı tartılır.

---

## 4. Kullanıcılar ve roller

### 4.1 Persona'lar

| Persona | Kim? | MVP'de ne yapar? |
|---|---|---|
| **Stüdyo sahibi** | Kurucu, genelde hoca da | Kayıt olur, stüdyoyu kurar, program/ürün tanımlar, ödeme hesabını bağlar, raporlara bakar |
| **Yönetici** | Operasyon sorumlusu | Programı yönetir, personel/müşteri yönetir, ürün tanımlar, rapor görür |
| **Hoca** | Ders veren | Kendi derslerini ve katılımcı listesini görür, check-in yapar, ders notu/iptal talebi |
| **Resepsiyon** | Önde karşılayan | Müşteri açar, rezervasyon yapar/iptal eder, kasadan satış girer, check-in yapar |
| **Stüdyo müşterisi** | Ders alan kişi | Hesap açar, programı görür, rezervasyon yapar/iptal eder, ürün satın alır, haklarını/geçmişini görür |

### 4.2 Kimlik modeli (önemli)

- **Personel kimliği** (`admin_user`): e-posta + parola (+ 2FA). Bir kişi birden fazla stüdyoda farklı rolde olabilir (`tenant_membership`).
- **Müşteri kimliği** (`customer_account`): global hesap, e-posta ile tanımlanır. Mobil uygulamada **tek hesap**, birden fazla stüdyoya katılabilir.
- **Stüdyo müşteri kaydı** (`customer`): stüdyoya özel profil (notlar, etiketler, satın almalar, rezervasyonlar). `customer_account` ile **isteğe bağlı** bağlanır:
  - Resepsiyon müşteriyi elle açarsa `customer` vardır, `customer_account` yoktur.
  - Müşteri aynı e-postayla kayıt olunca (e-posta doğrulandıktan sonra) hesap, mevcut `customer` kaydına **sahiplenme (claim)** ile bağlanır; çift kayıt oluşmaz.
- Personel ve müşteri oturumları ayrı **audience** ile imzalanır; birbirinin endpoint'ine erişemez.

### 4.3 Yetki matrisi (MVP)

| Yetenek | Sahip | Yönetici | Hoca | Resepsiyon |
|---|:-:|:-:|:-:|:-:|
| İşletme ayarları, lokasyon/oda | ✅ | ✅ | ❌ | ❌ |
| Personel davet/rol değiştirme | ✅ | ✅ (sahip hariç) | ❌ | ❌ |
| Ödeme hesabı bağlama, iade onayı eşiği | ✅ | ❌ | ❌ | ❌ |
| Offering/seri/dönem/şablon yönetimi | ✅ | ✅ | ❌ (yalnız görür) | ❌ |
| Takvimi görme | ✅ | ✅ | Kendi dersleri | ✅ |
| Seans katılımcı listesi + check-in | ✅ | ✅ | Kendi dersleri | ✅ |
| Müşteri oluşturma/düzenleme | ✅ | ✅ | ❌ (kendi derslerindekileri sınırlı görür) | ✅ |
| Rezervasyon oluşturma/iptal (müşteri adına) | ✅ | ✅ | ❌ | ✅ |
| Ürün tanımlama | ✅ | ✅ | ❌ | ❌ |
| Kasadan satış / manuel kredi düzeltme | ✅ | ✅ | ❌ | ✅ (düzeltme: ❌) |
| İade | ✅ | ✅ | ❌ | ❌ |
| Gelir raporları | ✅ | ✅ | ❌ | ❌ |
| Katılım raporları | ✅ | ✅ | Kendi dersleri | ❌ |
| Audit log, çöp kutusu/geri al | ✅ | ✅ (kısmi) | ❌ | ❌ |
| Veri dışa aktarma | ✅ | ❌ | ❌ | ❌ |

---

## 5. MVP kapsamı: içinde ve dışında

### 5.1 MVP'nin içinde

**Hesap ve kurulum:** kayıt, işletme profili, 5 adımlı kurulum sihirbazı, sandbox örnek verisi, roller, personel daveti, lokasyon/oda, 2FA seçeneği.
**Müşteri yönetimi:** profil, etiket, not, arama, CSV içe aktarma, Customer 360 görünümü, KVKK rıza/silme/dışa aktarma.
**Zamanlama:** sınıf, randevu, workshop; RRULE ile çok günlü tekrar; dönem (temel); şablon; görünürlük ufku; çakışma denetimi; seri düzenleme önizlemesi; ders iptali ve hoca değişimi.
**Ürünler:** drop-in, paket, dönemli üyelik (sınırsız / limitli), intro offer; kredi ledger'ı; kasadan satış.
**Rezervasyon:** kapasite, bekleme listesi (otomatik terfi), iptal ve geç iptal politikası, check-in, no-show.
**Bildirim:** işlemsel e-posta (doğrulama, onay, hatırlatma, iptal, bekleme listesi terfisi, makbuz, ödeme başarısız).
**Raporlama:** satış (nakit + tahakkuk), katılım, üyelik; dashboard; CSV dışa aktarma.
**Kanallar:** admin web paneli, hosted rezervasyon sayfası, embed widget'lar (çoklu tür/filtre), Flutter müşteri uygulaması.
**Ödeme (iyzico):** Checkout Form ile satın alma, 3D Secure, taksit, kayıtlı kart, iade/iptal, ödeme linki, dönemli üyelik tahsilatı, dunning, geç iptal/no-show ücreti, günlük mutabakat, ücret şeffaflığı.
**Güvenilirlik:** audit log, yumuşak silme + geri al, idempotency, outbox, status sayfası v0, hata izleme, yedek/geri yükleme tatbikatı.
**Taşınabilirlik:** CSV içe aktarma (müşteri, üyelik, kalan kredi) + kuru çalıştırma + fark raporu; tam veri dışa aktarma.

### 5.2 MVP'nin dışında (bilinçli olarak yapılmayacak)

Inbox (SMS/WhatsApp/IG), sequences/otomasyon motoru, newsletter, lead yönetimi, intake formu/e-imzalı feragatname, hediye kartı, indirim kodu, ödeme planı (taksitli üyelik), "başkasına hediye et", üyelik dondurma/upgrade/downgrade/transfer, otomatik hoca ikamesi, mesai giriş-çıkış/bordro, kiosk/QR check-in, yorumlar, topluluk, spot (yer) seçimi, Spotfiller, AI özellikleri, MCP, **public API/webhook/Zapier**, retail/envanter, on-demand/LMS, SOAP, resital, WOD, çoklu lokasyon/franchise yönetimi (altyapı hazır, arayüz yok), marketplace/keşif, e-Arşiv/e-Fatura entegrasyonu, POS/kart okuyucu, doğrudan borçlandırma, white-label markalı mağaza uygulaması (tek paylaşımlı Flutter uygulaması yeterli), fiyat sayfası/pazarlama sitesi.

> Kapsam dışı bir şey MVP sırasında "küçük görünüyor" diye eklenmez; önce bu dosyaya yeni görev olarak yazılır ve bağımlılıkları çıkarılır.

---

## 6. Kavram sözlüğü (alan modeli)

| Kavram | Tanım |
|---|---|
| **Tenant** | Bir stüdyo işletmesi. Tüm veri `tenant_id` ile ayrılır, PostgreSQL RLS ile korunur. `slug` benzersizdir (`ornek-studyo`). |
| **Location / Room** | Fiziksel mekân ve içindeki oda/salon. Oda kapasitesi vardır. Zaman dilimi lokasyonda tutulur (varsayılan `Europe/Istanbul`). |
| **Staff / Instructor** | Personel; hoca profili (biyografi, fotoğraf, görünür ad). |
| **Customer** | Stüdyoya özel müşteri kaydı. Etiket, not, rıza durumu, satın almalar, rezervasyonlar. |
| **Offering** | Satılan/programlanan hizmetin tanımı. Tür: `class` (grup dersi), `appointment` (birebir), `workshop` (tek seferlik etkinlik). Kapasite, süre, kategori, iptal kuralları, drop-in fiyatı, görünürlük burada. |
| **Category** | Offering'leri gruplar (örn. "Reformer", "Mat Pilates", "Yoga"). Ürünlerin geçerlilik kapsamı kategori ile belirlenir. |
| **Series** | Bir offering'in tekrar kuralı (RRULE, başlangıç saati, süre, hoca, oda, bitiş türü). Seans üretir. |
| **Session** | Takvimdeki somut ders: `starts_at` (UTC), `ends_at`, hoca, oda, kapasite, durum (`draft`, `published`, `cancelled`). Tekil de olabilir. |
| **Term (Dönem)** | Tarih aralığı + tatil günleri + kayıt penceresi; seriler döneme bağlanabilir; "dönem ürünü" bir dönemin tüm derslerine hak verir. |
| **Template** | Offering/seri için kayıtlı ayar kümesi (hızlı kurulum). |
| **Booking** | Müşterinin bir seanstaki yeri. Durumlar: `confirmed`, `waitlisted`, `cancelled`, `late_cancelled`, `no_show`, `attended`. |
| **Waitlist entry** | Kapasite dolu seansta sıra kaydı; sıra numarası ve oluşturma zamanı vardır. |
| **Product** | Satılan şey: `drop_in` (tek giriş), `pack` (N kredi), `membership` (dönemli), `intro_offer` (yeni müşteriye tek seferlik tanıtım teklifi). |
| **Purchase** | Bir müşterinin ürünü satın alması (nakit/havale/online). Ödemeler ve ledger kayıtları buna bağlanır. |
| **Entitlement (hak)** | Satın almanın verdiği kullanım hakkı: kalan kredi / sınırsız / limitli, başlangıç-bitiş, kapsam (kategori), durum (`active`, `expired`, `exhausted`, `cancelled`). |
| **Money ledger** | Para ve gelir tanıma hareketlerinin çift girişli defteri (Bölüm 9). |
| **Credit ledger** | Hak (kredi) hareketlerinin defteri: `grant`, `consume`, `refund`, `expire`, `adjust`. Bakiye buradan türetilir. |
| **Payment / Refund** | Ödeme sağlayıcıdaki işlemin bizdeki karşılığı. Durum makinesi vardır. |
| **Outbox event** | Veritabanı işlemiyle birlikte yazılan olay; worker tarafından e-posta, mutabakat vb. için işlenir. |
| **Audit log** | Kim/ne/ne zaman/hangi IP+istemci ile neyi değiştirdi (önce/sonra). |

---

## 7. Uçtan uca kullanıcı yolculukları

### 7.1 Stüdyo kurulumu (hedef: ≤ 15 dk)

1. Sahip e-posta + parola ile kayıt olur → e-posta doğrulanır → tenant otomatik oluşur, `slug` önerilir.
2. **Sihirbaz — 5 adım:**
   (a) İşletme: ad, telefon, adres, logo, marka rengi, zaman dilimi;
   (b) Lokasyon/oda: en az bir oda, kapasite;
   (c) İlk sınıf: ad, kategori, süre, kapasite, hoca, gün/saat (RRULE), başlangıç tarihi;
   (d) İlk ürün: örn. "10'lu paket", "Aylık sınırsız", "Tanışma dersi";
   (e) Ödeme bağlantısı: iyzico alt üye işyeri başvurusu (ödeme görevleri bitene kadar "atla — sonra bağla" olarak çalışır).
3. Eksik zorunlu bilgi (iptal politikası, açıklama) sihirbazı **engellemez**, uyarı olarak görünür.
4. Hosted sayfa adresi gösterilir; "ilk rezervasyonu dene" bağlantısı çıkar.
5. İsteğe bağlı **sandbox**: örnek hoca, ders, müşteri ve ürünlerle dolu deneme verisi tek tıkla yüklenir/temizlenir.

### 7.2 Program yayınlama

1. Yönetici "Yeni seri" der: offering seçer, günleri (Pzt-Çar-Cum), saati, hocayı, odayı, bitişi (tarih / adet / süresiz) belirler.
2. Sistem çakışmayı (oda, hoca) kontrol eder, **önizleme** gösterir (kaç seans üretilecek, hangileri tatile denk geliyor).
3. Seans'lar `draft` üretilir; **görünürlük ufku** (personel 6 hafta, müşteri 3 hafta varsayılan, ayarlanabilir) job'ı zamanı gelen taslakları `published` yapar.
4. Sonradan düzenleme: "yalnızca bu / bundan sonrası / tümü" + "bu işlem 42 rezervasyonu etkiler" önizlemesi → onay → uygulanır, etkilenen müşterilere e-posta gider.

### 7.3 Müşteri rezervasyonu (web veya mobil)

1. Müşteri programı filtreleyerek (tür, hoca, gün) bakar → ders detayı → "Yerimi ayır".
2. Giriş yapmamışsa e-posta/parola ile hesap açar (stüdyoya otomatik katılır).
3. Sistem müşterinin **uygun hakkını** bulur (Bölüm 8.3):
   - Hak varsa rezervasyon kesinleşir, kredi düşer, onay e-postası gider.
   - Hak yoksa ve offering'in drop-in fiyatı varsa **satın alma akışı** açılır (ödeme görevleri öncesi: yalnızca "stüdyodan hak satın alın" mesajı); ödeme başarılı olunca rezervasyon tamamlanır.
   - Hak yoksa ve drop-in yoksa ürün seçimi gösterilir.
4. Seans doluysa "Bekleme listesine gir" seçeneği sunulur.
5. Müşteri "Hesabım"da yaklaşan/geçmiş rezervasyonlarını, kalan haklarını ve hak geçmişini görür; iptal edebilir.

### 7.4 İptal, geç iptal, no-show

1. **Serbest iptal penceresinde** (varsayılan: seanstan ≥ 12 saat önce) iptal → kredi geri yazılır, yer boşalır, bekleme listesi işler.
2. **Pencere dışında** iptal → "geç iptal": politika uygulanır (kredi yanar **veya** sabit ücret kayıtlı karttan alınır **veya** ceza yok). Personel istisna olarak ücreti/kredi kaybını **affedebilir** (neden notuyla, audit'e yazılır).
3. Seans bitince check-in yapılmayan `confirmed` rezervasyonlar (ayar açıksa) otomatik `no_show` olur ve no-show politikası uygulanır.

### 7.5 Bekleme listesi

1. Seans doluyken katılan müşteriler sıraya girer (kredi düşmez, sadece sıra).
2. Yer açılınca sıradaki **uygun haklı** müşteri otomatik olarak `confirmed` yapılır, kredi o anda düşer, e-posta gider. Uygun hakkı olmayan atlanır (sıra korunur, bir sonraki denenir).
3. Seans başlangıcına `waitlist_cutoff` (varsayılan 30 dk) kala terfi durur; kalan bekleme kayıtları seans başlayınca temizlenir.

### 7.6 Satın alma ve üyelik

1. **Kasadan:** Resepsiyon müşteriyi seçer, ürünü seçer, ödeme yöntemini (nakit / havale-EFT / kredi kartı POS-dışı-kayıt) işaretler → `Purchase` + hak + ledger oluşur.
2. **Online (iyzico):** Müşteri ürünü seçer → iyzico Checkout Form (3D Secure, taksit) → başarılı → webhook/callback → ödeme doğrulanır → hak verilir → makbuz e-postası.
3. **Üyelik:** İlk ödemeden sonra her dönem başında otomatik tahsilat (kayıtlı kart); başarılı → yeni dönem hakkı; başarısız → dunning (yeniden deneme + e-posta + kart güncelleme linki) → süre dolunca üyelik askıya alınır.

### 7.7 Günlük operasyon

1. Hoca/resepsiyon "Bugün" ekranından seans listesini açar, katılımcıları check-in yapar, son dakika müşteri ekler/çıkarır.
2. Hoca gelemezse yönetici seansın hocasını değiştirir (katılımcılara bildirim) veya seansı iptal eder (tüm krediler iade, bildirim).

### 7.8 Yönetim ve raporlama

1. Dashboard: bugünün doluluk özeti, bu hafta gelir, aktif üyelik, yeni müşteri, yaklaşan boşluklar.
2. Raporlar: satış (nakit / tahakkuk), katılım, üyelik; tarih/hoca/ürün filtresi; CSV dışa aktarma.
3. Her ödeme satırı: brüt · PSP ücreti · net; ödeme listesinde mutabakat durumu (eşleşti / fark var).
4. Hata düzeltme: yanlış silme → çöp kutusundan geri al; yanlış kredi → ters kayıtla düzelt.

### 7.9 Geçiş (başka yazılımdan)

1. Eski sistemden dışa aktarılan CSV'ler yüklenir (müşteri → üyelik/kalan kredi).
2. Sütun eşleme + **kuru çalıştırma raporu** (eşleşen/eşleşmeyen/olası çift) → onay → içe aktarma.
3. **Fark raporu:** kaynaktaki müşteri sayısı / toplam kalan kredi / aktif üyelik sayısı ↔ hedef.
4. İstenirse tek tıkla **tam veri dışa aktarma** (çıkış hakkı).

---

## 8. İş kuralları (en ince ayrıntısıyla)

### 8.1 Zaman, tarih, tekrar

- Tüm zaman damgaları **UTC** saklanır. Seri, **lokasyon zaman dilimindeki yerel saat** (örn. 07:00 Europe/Istanbul) üzerinden üretilir; her seans UTC'ye çevrilerek yazılır. (Türkiye 2016'dan beri sabit UTC+3 kullanır; ancak sistem DST'li zaman dilimleri için de doğru çalışmalıdır — test kümesi bunu kanıtlar.)
- `RRULE` (RFC 5545): `FREQ=WEEKLY;BYDAY=MO,WE,FR`; bitiş seçenekleri: **tarihe kadar**, **N adet**, **süresiz**.
- Süresiz seri, seans üretimi **ufuk + 8 hafta** ileriye kadar yapılır (periyodik "seri genişletme" job'ı).
- Tatil günleri (Term veya tenant tatil listesi) seri içinde atlanır; atlanan günler önizlemede gösterilir.
- Seri düzenleme kapsamları: **yalnızca bu seans**, **bu ve sonraki seanslar** (seri iki parçaya bölünür), **tüm seri**. Geçmiş seanslar değişmez.
- Bir seansı elle değiştirmek (örn. saatini kaydırmak) o seansı seriden "ayrılmış istisna" yapar; seri düzenlemesi istisnaları ezmez (kullanıcıya soru olarak sunulur: "3 elle düzenlenmiş seans var, üzerine yazılsın mı?").

### 8.2 Kapasite ve çakışma

- Seans kapasitesi varsayılan olarak offering'den gelir, seansta ezilebilir; oda kapasitesini **aşamaz**.
- **Çakışma denetimi:** aynı oda aynı anda iki seansa verilemez; aynı hoca aynı anda iki seansa atanamaz. Çakışma = **uyarı + onayla geç** (sahip/yönetici), randevu slotlarında sert engel.
- Rezervasyonlar **kapasite kontrolü + kayıt ekleme** işlemini tek veritabanı işleminde, seans satırı `FOR UPDATE` ile kilitlenerek yapar. Aşırı rezervasyon mümkün olmamalıdır (veritabanı kısıtı + test).

### 8.3 Hak (entitlement) seçimi ve kredi tüketimi

Rezervasyon sırasında **uygun haklar** şu filtrelerden geçer:

1. Durum `active`, bugün `starts_at ≤ seans zamanı ≤ ends_at` aralığında (üyelik/paket geçerlilik tarihi).
2. Kategori kapsamı seansın kategorisini içerir (boş = tümü).
3. Kalan kredi > 0 **veya** sınırsız **veya** limitli üyelikte dönem limiti dolmamış.
4. Offering'e özel kısıt (örn. "workshop pakete dahil değil") sağlanıyor.

Birden fazla uygun hak varsa **sıralama stratejisi** (tenant ayarı, varsayılan `expiring_first`):

- `expiring_first`: en erken sona eren → eşitlikte **limitli paket önce, sınırsız üyelik sonra** → eşitlikte en eski satın alma.
- `membership_first`: üyelik önce.
- `pack_first`: paket önce.

Her tüketim `credit_ledger`'a `consume` olarak yazılır; kayıtta **hangi hak, neden seçildi** (`reason` alanı: strateji adı ve karşılaştırma özeti) tutulur ve müşteri/personele görünür.

İade durumlarında (`serbest iptal`, `ders iptali`) `refund` girişi yazılır; **hak süresi dolmuşsa** iade edilen kredi, politikaya göre ya geçerliliği kısa süre uzatılarak (tenant ayarı: `refund_extends_validity_days`, varsayılan 7) ya da yanmış sayılarak işlenir.

### 8.4 Ürünler

| Ürün | Davranış |
|---|---|
| **Drop-in** | Tek seans hakkı. Offering'in `drop_in_price`'ı ile rezervasyon anında satılır; hak tek kullanımlıktır, aynı seansa bağlıdır. |
| **Pack (paket)** | N kredi. `validity_days` (örn. 90) ve `validity_start` (`purchase` ya da `first_use`). Kategori kapsamı. |
| **Membership (üyelik)** | Dönem: haftalık/aylık/3 aylık/yıllık. Tür: **sınırsız** veya **limitli** (dönem başına N ders, ya da haftada N ders). Otomatik yenilemeli (varsayılan) ya da tek dönemlik. Her dönem için ayrı entitlement üretilir. Dönem sonunda kullanılmayan krediler **devretmez** (rollover MVP dışı). |
| **Intro offer** | Örn. "3 derslik tanışma paketi". Müşteri başına **yalnızca bir kez** satın alınabilir (tenant bazında) ve `new_customers_only` işaretliyse daha önce hiç satın alma yapmamış olması gerekir. |

Ürün alanları: ad, açıklama, tür, fiyat (KDV dahil), KDV oranı, para birimi, kategori kapsamı, geçerlilik, görünürlük (herkese açık / yalnızca kasa), taksit izni (`allow_installments`), aktif/arşiv.

> KDV oranı ürün başına yapılandırılır. Spor hizmetlerinde uygulanacak oran mali müşavirle teyit edilir; kod sabit oran varsaymaz.

### 8.5 Rezervasyon durum makinesi

```
(yok) ──book──▶ confirmed ──check-in──▶ attended
   │               │  ├─cancel (pencere içi)──▶ cancelled
   │               │  ├─cancel (pencere dışı)─▶ late_cancelled
   │               │  └─seans biter, check-in yok──▶ no_show
   └─seans dolu──▶ waitlisted ──yer açıldı──▶ confirmed
                        └─cancel / seans başladı──▶ cancelled
```

- Aynı müşteri aynı seansa iki kez `confirmed` olamaz (benzersiz kısıt).
- Bir rezervasyonun her durum geçişi `booking_events` tablosuna ve audit log'a yazılır.
- Personel geçmişe dönük düzeltmeler yapabilir (örn. `no_show` → `attended`); bu, ilgili kredi/ücret hareketini **ters kayıtla** düzeltir.

### 8.6 İptal ve geç iptal politikası

- Ayar kademesi: **tenant varsayılanı → offering → seans**.
- Alanlar: `free_cancel_until_hours` (varsayılan 12), `late_cancel_action` (`forfeit_credit` | `charge_fee` | `none`), `late_cancel_fee` (sabit TL), `no_show_action` (aynı üç seçenek), `no_show_fee`.
- `charge_fee`, müşterinin **kayıtlı kartı varsa** otomatik tahsil edilir (ödeme görevleri ile); kart yoksa borç kaydı oluşur ve resepsiyon uyarısı gösterilir.
- Personel istisnası: ücret/kredi kaybı **affedilebilir** (neden zorunlu); yapıldıysa ters kayıt + audit.
- **Seans iptali (stüdyo kaynaklı)** her zaman tam iade eder ve politikayı uygulamaz.

### 8.7 Bekleme listesi

- `waitlist_capacity` (0 = kapalı). Sıra: ekleme zamanı (FIFO).
- Terfi kuralı: Bölüm 7.5. Terfi, rezervasyon motoruyla **aynı kod yolunu** kullanır (aynı kilit, aynı hak seçimi); ayrı bir "yarı rezervasyon" mantığı yoktur.
- Müşteri bekleme listesinden kendi isteğiyle çıkabilir.

### 8.8 Randevu (appointment)

- Hoca için haftalık **uygunluk aralıkları** tanımlanır; offering süresi + tampon (öncesi/sonrası dk) ile boş slotlar hesaplanır.
- Randevu slotu = kapasite 1'lik seans; çakışma **sert engeldir**.
- Müşteri slot seçer; aynı rezervasyon motoru çalışır.

### 8.9 Silme, geri alma, audit

- Silinebilir varlıklar (müşteri, offering, ürün, seans, seri, oda…) **yumuşak silinir** (`deleted_at`, `deleted_by`). 30 gün içinde "geri al" mümkündür; 30 gün sonra temizlik job'ı kalıcı siler (KVKK silme talebi ayrı ve kalıcıdır).
- **Para hareketleri (ledger, payment, refund) asla silinmez**; düzeltme ters kayıt iledir.
- Audit log: `actor` (kullanıcı/sistem/API), `action`, `entity`, `entity_id`, `before`, `after`, `ip`, `user_agent`, `request_id`, `at`. Değiştirilemez (yalnızca ekleme).

### 8.10 Bildirimler (MVP)

| Olay | Alıcı | Kanal |
|---|---|---|
| Hesap doğrulama, parola sıfırlama | Kullanıcı | E-posta |
| Rezervasyon onayı (ICS ekli) | Müşteri | E-posta |
| Hatırlatma (varsayılan 24 saat önce, ayarlanabilir) | Müşteri | E-posta (+ push: mobil sonrası) |
| İptal / geç iptal sonucu | Müşteri | E-posta |
| Bekleme listesinden terfi | Müşteri | E-posta (+ push) |
| Seans iptali / hoca değişimi | Katılımcılar | E-posta (+ push) |
| Satın alma makbuzu (fiş değil, bilgi amaçlı) | Müşteri | E-posta |
| Ödeme başarısız / kart güncelle | Müşteri | E-posta (+ push) |
| Personel daveti | Personel | E-posta |

Müşteri, işlemsel olmayan bildirimleri kapatabilir; **işlemsel (doğrulama, makbuz, iptal)** bildirimler kapatılamaz. Pazarlama amaçlı ileti MVP'de **gönderilmez** (İYS gereksinimi doğmaz).

### 8.11 KVKK

- Kayıtta aydınlatma metni onayı ve sürümü saklanır.
- Müşteri/personel kendi verisini JSON olarak dışa aktarabilir.
- Silme talebi: kişisel alanlar **anonimleştirilir** (ad, e-posta, telefon, not); yasal saklama zorunluluğu olan mali kayıtlar (satın alma tutarları, ledger) kimliksiz biçimde korunur.

---

## 9. Ledger (defter) tasarımı

Ledger, MVP'nin güvenilirlik omurgasıdır. İki defter vardır:

### 9.1 Money ledger (çift girişli)

- Her olay, **toplamı sıfır olan** satırlardan oluşur (`debit` = `credit`). Satır: `tenant_id`, `journal_id`, `account`, `amount` (kuruş, işaretli), `currency`, `ref_type/ref_id` (purchase, payment, refund, booking…), `occurred_at`, `description`.
- Hesaplar (tenant bazında):
  - `cash_clearing:{method}` — nakit/havale/iyzico bakiyesi (kasa ve PSP alacağı)
  - `psp_receivable` — iyzico'dan alınacak (henüz yatmamış) tutar
  - `deferred_revenue` — satılmış fakat henüz tüketilmemiş hak (ertelenmiş gelir)
  - `revenue` — tanınmış gelir
  - `revenue_breakage` — süresi dolan kullanılmamış hak geliri
  - `vat_payable` — KDV
  - `psp_fees` — ödeme sağlayıcı ücretleri
  - `refunds` — iadeler
  - `receivable_customer` — müşteri borcu (ödenmemiş geç iptal ücreti)
- **Satış:** `cash/psp_receivable` (borç) ↔ `deferred_revenue` + `vat_payable` (alacak).
- **Gelir tanıma (tahakkuk):**
  - Paket/drop-in: kredi **tüketildiğinde** (seans `attended`/`late_cancelled`/`no_show` olduğunda) `deferred_revenue → revenue`, tutar = (KDV hariç net fiyat ÷ toplam kredi). Rezervasyon sırasında düşen kredi "rezerve", seans tamamlanınca gelir olur.
  - Üyelik: dönem boyunca **günlük doğrusal** tanıma (günlük job).
  - Süresi dolan kullanılmamış kredi: kalan `deferred_revenue → revenue_breakage` (dolum anında).
- **İade:** ters kayıt (ilgili `deferred_revenue`/`revenue` azaltılır, `refunds` artar). Daha önce tanınmış gelir iadesi `revenue` hesabını ters çevirir.
- **PSP ücreti:** her online ödemede `psp_fees` (borç) ↔ `psp_receivable` (alacak) ile ayrı satır.

### 9.2 Credit ledger

- Satırlar: `entitlement_id`, `customer_id`, `type` (`grant`, `consume`, `refund`, `expire`, `adjust`), `amount` (kredi adedi, işaretli; sınırsız hak için 0 ve işaret `unlimited`), `booking_id?`, `reason`, `actor`, `occurred_at`.
- **Bakiye = satırların toplamı.** `entitlement.remaining` önbellektir; doğruluğu bir tutarlılık job'ı ve test ile doğrulanır.

### 9.3 Kural

- **Satış raporu, ledger'dan türetilir; ayrı bir "rapor tablosu" gerçeğin kaynağı olamaz.** Rapor toplamı ile ledger toplamı otomatik testle birebir eşleşir (Epic 7).
- Ledger'a yazan her kod yolu **idempotent** olmalıdır (`journal` için benzersiz `idempotency_key`).

---

## 10. Teknik mimari ve sabit kararlar

### 10.1 Yığın

| Katman | Karar |
|---|---|
| **API** | **Modüler monolit**: NestJS (TypeScript), tek dağıtım birimi, tek veritabanı. Modül sınırları net (aşağıda). Mikroservis **yok**. |
| Veritabanı | PostgreSQL 16+ (RLS ile çok kiracılı), Drizzle ORM + SQL migration'lar (şema değişikliği = kod incelemesi) |
| Kuyruk / zamanlayıcı | Redis + BullMQ (outbox işleyici, hatırlatma, seri genişletme, dunning, mutabakat, temizlik job'ları) |
| Admin web | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| Hosted sayfa | Next.js (aynı repo, ayrı uygulama); `/{slug}` altında, ileride alt alan adı |
| Embed widget | Web Components (Shadow DOM) + iframe fallback; gzip ≤ 60 KB |
| Mobil | **Flutter** (iOS + Android), Riverpod, go_router, dio, freezed/json_serializable; API istemcisi **OpenAPI'den üretilir** |
| Ödeme | **iyzico**; `PaymentProvider` soyutlaması arkasında |
| E-posta | Soyutlama + sağlayıcı (Postmark / SES / Resend'den biri; karar T-099'da) |
| Depolama | S3 uyumlu nesne depolama (geliştirmede MinIO) |
| Gözlemlenebilirlik | Sentry + OpenTelemetry + yapılandırılmış log |
| CI/CD | GitHub Actions, trunk-based, feature flag |
| Altyapı | Docker; başlangıçta yönetilen platform (Fly.io/Render/benzeri) + Terraform; Kubernetes **yok** |

### 10.2 API modülleri (monolit içindeki sınırlar)

`core` (config, hata, günlük) · `identity` (kimlik, oturum, RBAC) · `tenancy` (tenant, ayar, lokasyon, oda, personel) · `crm` (müşteri, KVKK) · `catalog` (offering, kategori, ürün) · `scheduling` (seri, seans, dönem, şablon, randevu) · `booking` (rezervasyon, bekleme listesi, check-in, politika) · `entitlements` (hak, kredi tüketimi) · `ledger` (money + credit ledger) · `payments` (iyzico, ödeme, iade, abonelik tahsilatı, mutabakat) · `notifications` (şablon, e-posta, push) · `reporting` · `migration` (import/export) · `audit` · `platform` (outbox, idempotency, feature flag, status).

Kural: Modüller yalnızca birbirinin **public servis arayüzünü** çağırır; başka modülün tablosuna doğrudan sorgu atılmaz (lint/dependency-cruiser ile zorunlu kılınır).

### 10.3 API yüzeyleri

| Önek | Kullanan | Kimlik |
|---|---|---|
| `/v1/admin/*` | Admin panel | Personel oturumu + tenant bağlamı (membership) |
| `/v1/me/*` | Müşteri (web + mobil) | Müşteri oturumu |
| `/v1/public/{slug}/*` | Anonim ziyaretçi, embed | Yok (rate limit + önbellek) |
| `/v1/webhooks/iyzico` | iyzico | İmza doğrulama |
| `/health`, `/ready`, `/status` | Altyapı | Yok |

### 10.4 API konvansiyonları

- JSON, `camelCase`; kimlikler **UUIDv7**; zaman **ISO 8601 UTC** (`Z`); para `{ "amount": 125000, "currency": "TRY" }` (kuruş).
- Hata biçimi **RFC 7807** (`application/problem+json`) + makine tarafından okunabilir `code`.
- **İmleç tabanlı sayfalama**, filtre ve sıralama sözleşmesi tüm listelerde aynı.
- Yazan her endpoint `Idempotency-Key` başlığı kabul eder (24 saat saklanır; aynı anahtar + farklı gövde = `422`).
- İyimser kilitleme: kayıtlarda `version`; güncellemede `If-Match`.
- Her yanıtta `X-Request-Id`; loglar ve audit bu kimlikle eşleşir.
- OpenAPI 3.1 belgesi koddan üretilir; CI'da **kırıcı değişiklik kontrolü** yapılır; Flutter ve web istemcileri belgeden üretilir.

### 10.5 Temel mimari kararlar

1. **Çok kiracılılık:** Tüm tablolarda `tenant_id`; her istekte `SET LOCAL app.tenant_id`; RLS politikaları `tenant_id = current_setting('app.tenant_id')`. Uygulama rolü RLS'i atlayamaz (`BYPASSRLS` yok). Tenant izolasyonu CI'da otomatik test edilir.
2. **Transactional outbox:** Domain olayı iş verisiyle **aynı işlemde** `outbox` tablosuna yazılır; worker (SKIP LOCKED ile) işler; at-least-once teslim, tüketiciler idempotent.
3. **Idempotency:** HTTP seviyesinde (başlık) ve ödeme seviyesinde (iyzico `conversationId` = bizim kararlaştırdığımız benzersiz anahtar).
4. **Para:** `bigint` kuruş; kayan nokta yok.
5. **Zaman:** UTC saklama; yerel saat yalnızca sunum ve RRULE üretiminde.
6. **Silme:** yumuşak silme; para hareketleri değişmez.
7. **Kendi faturalama zamanlaması:** Üyelik tahsilat takvimi **veritabanımızda** tutulur; iyzico yalnızca "şu karttan şu tutarı tahsil et" der (ayrıntı: T-092 spike).
8. **Feature flag:** Tenant bazlı bayraklar; riskli özellikler pilotlara kademeli açılır.

### 10.6 Repo yapısı (mono-repo)

```
/
├─ apps/
│  ├─ api/            # NestJS modüler monolit
│  ├─ admin/          # Next.js admin paneli
│  ├─ hosted/         # Next.js hosted rezervasyon sayfası
│  └─ mobile/         # Flutter (müşteri uygulaması)
├─ packages/
│  ├─ widgets/        # Web Components (embed)
│  ├─ api-client/     # OpenAPI'den üretilen TS istemcisi
│  ├─ ui/             # Ortak React bileşenleri / tasarım token'ları
│  └─ config/         # ESLint, tsconfig, ortak ayarlar
├─ infra/             # Terraform, Docker, deploy
├─ docs/              # ADR'ler, runbook'lar, API notları
└─ MVP_GOREVLER.md
```

---

## 11. iyzico ödeme tasarımı

> iyzico'nun API ayrıntıları (alan adları, imza algoritması, abonelik ürün özellikleri) görev sırasında **resmi dokümandan ve sandbox'tan teyit edilir**; aşağıdaki tasarım mimari niyeti anlatır.

### 11.1 Fon akışı ve hukuki yapı

- Hedef: **Müşteri fonlarını platform olarak tutmamak.** Stüdyo parası stüdyoya gitmeli. Bunun için iyzico'nun **pazaryeri / alt üye işyeri (sub-merchant)** modeli değerlendirilir: her stüdyo (tenant) iyzico'da bir alt üye işyeri olarak kaydolur; ödeme sepet kalemleri `subMerchantKey`/`subMerchantPrice` ile stüdyoya yönlenir.
- Karar noktası (T-082): (A) pazaryeri/alt üye işyeri modeli, (B) her stüdyonun kendi iyzico üye işyeri hesabı ve API anahtarlarıyla bağlanması. Seçim; iyzico'nun onayı, stüdyo KYC yükü, komisyon ve mutabakat yapısına göre yapılır. Kod, ikisini de destekleyecek şekilde `PaymentAccount` soyutlaması kullanır.
- Platformun komisyon almaması hedeflenir (plan Bölüm 4/10); iyzico işlem ücreti stüdyoya **olduğu gibi** yansır ve gösterilir.

### 11.2 Satın alma akışı (Checkout Form)

1. İstemci `POST /v1/me/checkout` ile ürün (veya drop-in rezervasyonu) için sipariş ister → sunucu **Order** (fiyat, KDV, taksit izni) kaydı + `idempotency_key` üretir.
2. Sunucu iyzico **Checkout Form Initialize** çağırır (`conversationId` = order id, `callbackUrl`, sepet kalemleri, alıcı bilgisi; kayıtlı kart saklama izni varsa `cardUserKey`).
3. İstemci iyzico'nun barındırdığı formu (web: yönlendirme/iframe; mobil: WebView) açar. **Kart verisi bizim sistemimize girmez** (PCI SAQ-A).
4. 3D Secure doğrulaması iyzico tarafında yapılır; sonuç `callbackUrl`'ye döner.
5. Sunucu callback'te gelen `token` ile iyzico **Retrieve** çağırır, **sunucu tarafında** durumu doğrular (istemciye güvenilmez).
6. Başarılıysa tek veritabanı işleminde: `Payment` → `succeeded`, `Purchase` + `Entitlement` + money ledger + credit ledger + outbox (makbuz) yazılır.
7. Callback kaçarsa/yavaşlarsa **webhook** ve **zamanlı durum çekme job'ı** (bekleyen ödemeler için) aynı sonucu idempotent biçimde üretir.

### 11.3 Durum makinesi (Payment)

`created → pending_3ds → succeeded | failed | cancelled` ; `succeeded → partially_refunded → refunded` ; `succeeded → voided` (aynı gün iptal). Her geçiş outbox olayı üretir ve audit'e yazılır.

### 11.4 İade ve iptal

- iyzico'da aynı gün/işlem **iptal (cancel)** ile, sonrası **iade (refund)** ile yapılır; iade genellikle **işlem kalemi (paymentTransactionId) bazındadır**. Sistemimiz tutarı kalemlere doğru dağıtır.
- İade → money ledger'da ters kayıt, ilgili hak `cancelled`/azaltılır (kullanılmış kredi varsa personel onayı ve politika gerekir).

### 11.5 Kayıtlı kart ve tekrarlayan tahsilat

- Kart, iyzico tarafında saklanır (`cardUserKey`, `cardToken`); biz yalnızca bu referansları, son 4 hane, marka ve son kullanma ayı/yılını tutarız.
- Üyelik yenilemesi ve geç iptal ücreti kayıtlı kartla tahsil edilir. Saklı kartla **3D Secure'suz** tahsilat için iyzico tarafında gerekli yetki/koşul ve (varsa) iyzico Abonelik ürünü ile farklar T-092 spike'ında netleştirilir. Karar: (A) iyzico Abonelik API'si, (B) kendi zamanlayıcımız + saklı kart tahsilatı. Plan (ADR-6) B'yi tercih eder; iyzico koşulları B'ye izin vermiyorsa A'ya geçilir ve yalnızca adaptör katmanı değişir.

### 11.6 Taksit

- Taksit seçenekleri iyzico Checkout Form'da kart BIN'ine göre sunulur; ürün bazında `allow_installments` ve izin verilen taksit sayıları ayarlanır. Taksit komisyon farkı ürün fiyatına otomatik eklenmez; müşterinin ödeyeceği tutar ve stüdyo net tutarı **ayrı** gösterilir (şeffaflık).

### 11.7 Webhook

- iyzico bildirim uç noktası imza doğrular, **tekrar oynatmaya dayanıklıdır** (olay kimliği ile idempotent), iş mantığını yalnızca olayı kaydedip kuyruğa atarak yürütür (hızlı `200`). Bildirim kaçarsa durum çekme job'ı tamamlar.

### 11.8 Mutabakat

- Günlük job: iyzico'dan önceki günün işlem/hakediş verisini çeker → bizim `payment` ve ledger ile satır satır eşleştirir → fark (eksik, fazla, tutar uyuşmazlığı) rapor ve uyarı üretir. Epic 5 kabul ölçütü.

---

## 12. Flutter mobil uygulama tasarımı

- **Tek, paylaşımlı müşteri uygulaması** (white-label markalı uygulama MVP dışı). Müşteri uygulamayı indirir, **stüdyoyu bağlar** (QR / davet bağlantısı / slug araması), yalnızca bağlandığı stüdyoları görür; başka işletme keşfi yoktur.
- **Mimari:** Feature-first klasörleme; Riverpod (durum), go_router (yönlendirme + derin bağlantı), dio + OpenAPI üretimli istemci, freezed modeller, `flutter_secure_storage` (token), ARB tabanlı i18n, `flavor`'lar (dev/staging/prod).
- **Ekranlar:** Karşılama/giriş/kayıt · Stüdyo bağla/seç · Program (gün/hafta, filtre) · Ders detayı · Rezervasyon (yap/iptal/bekleme listesi) · Hesabım (yaklaşan/geçmiş, haklar, hak geçmişi) · Ürünler/satın alma (iyzico WebView) · Kayıtlı kartlar · Profil/bildirim tercihleri · Hesabı sil.
- **Tema:** Stüdyonun marka rengi/logosu `public` API'den okunarak uygulama içinde bağlama göre uygulanır.
- **Bildirim:** FCM (Android) + APNs (FCM üzerinden iOS); hatırlatma, terfi, iptal.
- **Mağaza notu:** Gerçek hayatta tüketilen hizmetlerin (stüdyo dersi) uygulama dışı ödemesine Apple/Google politikaları genelde izin verir; ancak **Apple App Review yönergeleri (özellikle 3.1.x) görev sırasında yeniden doğrulanır**, aksi halde IAP gerektiren bir tasarıma düşme riski vardır (T-117).

---

## 13. Nitelik hedefleri ve MVP kabul ölçütleri

| Alan | Hedef |
|---|---|
| Rezervasyon doğruluğu | Overbooking = 0; 100 eşzamanlı istek testi geçer |
| Ödeme güvenilirliği | Başarısız olmayan niyetli ödemelerde hata oranı < %1; çift tahsilat = 0 (idempotency testi) |
| Rapor doğruluğu | Rapor toplamı = ledger toplamı (otomatik test) |
| Mutabakat | Günlük iş çalışır; fark bildirimi üretir |
| API gecikmesi | p95 < 300 ms (okuma), < 600 ms (yazma) — pilot yük profilinde |
| Kullanılabilirlik | Pilot dönemi hedefi ≥ %99,5; sağlık/status sayfası aktif |
| Yedek | RPO ≤ 5 dk, RTO ≤ 1 saat; geri yükleme tatbikatı yapıldı |
| Güvenlik | OWASP ASVS L2 odaklı kontrol listesi; RLS izolasyon testi; kart verisi yok (SAQ-A); parolalar argon2id |
| Erişilebilirlik | WCAG 2.1 AA (hosted sayfa ve admin kritik akışları) |
| Aktivasyon | Kayıt → ilk rezervasyon < 15 dk |
| Embed | Widget ≤ 60 KB gzip |
| Gizlilik | KVKK aydınlatma/rıza, silme/dışa aktarma akışları çalışır |

**MVP kabul toplantısı** (T-120): Üç pilot stüdyo ≥ 4 hafta canlı; yukarıdaki tablo ölçülmüş ve belgelenmiş; açık P1 hata yok.

---

## 14. Varsayımlar ve açık riskler

| # | Varsayım / risk | Etki | Önlem |
|---|---|---|---|
| 1 | Hedef pazar TR, dikey pilates/yoga | PSP, KDV, dil kararları | Değişirse yalnızca adaptör ve yerelleştirme etkilenir |
| 2 | iyzico pazaryeri/alt üye işyeri onayı süresi belirsiz | Ödeme görevlerini geciktirir | **T-082'yi çok erken başlat** (başvuru süreci paralel ilerler); sandbox ile geliştir |
| 3 | iyzico saklı kartla 3DS'siz tekrarlayan tahsilat koşulları | Üyelik yenileme tasarımı | T-092 spike; adaptör arkasında iki yol |
| 4 | Apple/Google ödeme politikaları | Mobil yayın reddi | T-117'de erken politika kontrolü + gerekçe metni |
| 5 | KDV oranı ve e-Arşiv/e-Fatura yükümlülüğü | Mali uyum | MVP'de makbuz bilgi amaçlıdır; stüdyo kendi muhasebesinden fatura keser. e-Arşiv entegrasyonu MVP sonrası |
| 6 | Kısıtlı ekip | Takvim | Kapsam dışı listesine sadık kal; ödeme/entegrasyon/mobil ayrı iş kolu olarak paralel yürüyebilir (bağımlılıklar izin verdiği ölçüde) |
| 7 | Gerçek müşteri verisiyle test | KVKK | Üretim verisi **maskelenmeden** test ortamına taşınmaz |
| 8 | Marka adı/alan adı kararı | Hosted URL, e-posta alan adı | T-001 kapsamında karar verilir |

---

## 15. GÖREV LİSTESİ

> Tek liste. Sıra = yürütme sırası. **Ödemeler (T-082…T-098), entegrasyonlar (T-099…T-103) ve mobil (T-104…T-118) bilinçli olarak sondadır.**

### T-001 · Karar kayıtları, marka adı ve proje kuralları
- **Etiket:** altyapı · yönetim
- **Bağımlılık:** —
- **İlişkili:** T-082 (ödeme başvurusu bu kararla paralel başlar)
- **Detay:** Bölüm 10'daki sabit kararları ADR dosyalarına dök (ADR-1…10 + "Flutter", "iyzico", "RLS", "outbox", "kendi faturalama zamanlaması"). Çalışma adı yerine nihai marka adı ve alan adını belirle (Momence'ten ayrışma, marka taraması). Kod stili, branch/PR kuralları, commit biçimi, sürümleme, "Definition of Done" şablonu, güvenlik/gizlilik temel kuralları (üretim verisi maskelenmeden test ortamına taşınmaz) yazılır. **iyzico alt üye işyeri/üye işyeri başvurusunu bu görevle birlikte başlat** (onay süresi belirsiz).
- **Kabul:** `docs/adr/` altında onaylı ADR'ler; marka/alan adı kararı; PR şablonu; iyzico başvurusu açılmış.
- **Durum:** ⬜ Beklemede

### T-002 · Mono-repo iskeleti
- **Etiket:** altyapı
- **Bağımlılık:** T-001
- **Detay:** Bölüm 10.6'daki yapı: `apps/api`, `apps/admin`, `apps/hosted`, `apps/mobile` (Flutter, şimdilik boş proje), `packages/widgets`, `packages/api-client`, `packages/ui`, `packages/config`, `infra`, `docs`. Paket yöneticisi ve task runner (pnpm + Turborepo veya muadili). Ortak ESLint/Prettier/tsconfig. Modül sınırı denetimi için dependency-cruiser (API içi modüller arası yasak bağımlılıkları kırmızıya düşürür).
- **Kabul:** `pnpm build`, `pnpm lint`, `pnpm test` tüm paketlerde çalışır; sınır ihlali CI'da hata verir.
- **Durum:** ✅ Bitti

### T-003 · Yerel geliştirme ortamı
- **Etiket:** altyapı
- **Bağımlılık:** T-002
- **Detay:** `docker-compose`: PostgreSQL 16, Redis, MinIO (S3), Mailpit (SMTP yakalayıcı). Tek komutla ayağa kalkan `make dev`/`pnpm dev`. Örnek `.env.example`; sırlar repoya girmez. Seed betiği (T-060 ile paylaşılan örnek veri üretici için hook).
- **Kabul:** Yeni geliştirici ≤ 15 dk içinde tüm yığını çalıştırır; README adımları doğrulanmış.
- **Durum:** ✅ Bitti

### T-004 · CI hattı
- **Etiket:** altyapı · test
- **Bağımlılık:** T-002, T-003
- **Detay:** GitHub Actions: lint, tip kontrolü, birim/entegrasyon testi (servis konteynerleriyle Postgres+Redis), migration'ı boş veritabanına uygulama + **geri/ileri uyumluluk kontrolü**, OpenAPI üretimi ve **kırıcı değişiklik denetimi**, bağımlılık ve sır taraması (SCA + secret scanning), Flutter için `analyze`/test işi (T-104'te doldurulur). Önbellekleme ile sürenin makul kalması.
- **Kabul:** PR'da zorunlu yeşil kontroller; ana dal korumalı.
- **Durum:** ✅ Bitti

### T-005 · API iskeleti (NestJS modüler monolit)
- **Etiket:** altyapı · api
- **Bağımlılık:** T-002, T-003
- **Detay:** Modül iskeletleri (Bölüm 10.2). `/v1` sürümleme, global doğrulama (class-validator/zod), RFC 7807 hata filtresi + hata kodu kataloğu, `X-Request-Id` ara katmanı, yapılandırılmış log, yapılandırma yükleyici (env şeması doğrulaması), `/health` ve `/ready`, OpenAPI üretimi (Swagger), CORS politikası iskeleti, rate limit iskeleti (Redis).
- **Kabul:** `/health` yeşil; OpenAPI belgesi üretilir; hata yanıtları tutarlı formatta.
- **Durum:** ✅ Bitti

### T-006 · Veritabanı katmanı ve konvansiyonlar
- **Etiket:** altyapı · veri
- **Bağımlılık:** T-005
- **Detay:** Drizzle şeması + SQL migration iş akışı. Ortak kolonlar: `id` (UUIDv7), `tenant_id`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `version`. Para `bigint` kuruş + `currency`. Zaman `timestamptz` (UTC). Enum yönetimi, indeks adlandırma, FK politikası. Testler için işlem içinde çalışan test veritabanı yardımcıları (hızlı).
- **Kabul:** Örnek tablo + migration + CI'da uygulama; konvansiyon belgesi `docs/db.md`.
- **Durum:** ⬜ Beklemede

### T-007 · Çok kiracılılık ve RLS
- **Etiket:** altyapı · güvenlik
- **Bağımlılık:** T-006
- **Detay:** İstek başına tenant bağlamı (admin: oturumdaki membership; public: slug; me: müşterinin seçtiği tenant). Her işlemde `SET LOCAL app.tenant_id`. Tüm tenant tablolarında RLS politikası (`USING` + `WITH CHECK`). Uygulama veritabanı rolü `BYPASSRLS`'siz; migration rolü ayrı. Tenant bağlamı olmayan istekte sorgu **hata verir** (varsayılan "tümünü göster" yok). Kuyruk worker'ları da tenant bağlamı kurar.
- **Kabul:** **Tenant izolasyonu testi** (A tenant'ı B'nin verisini okuyamaz/yazamaz) her yeni tabloya otomatik uygulanan bir test şablonuyla CI'da koşar.
- **Durum:** ⬜ Beklemede

### T-008 · Idempotency altyapısı
- **Etiket:** altyapı · güvenilirlik
- **Bağımlılık:** T-006, T-007
- **Detay:** `Idempotency-Key` ara katmanı: anahtar + endpoint + gövde özeti saklanır, 24 saat tutulur; aynı anahtar → ilk yanıt tekrar döner; aynı anahtar + farklı gövde → `422`; aynı anda gelen çift istek bekletilir/çakışma döner. Yazan tüm POST/PATCH/DELETE uçlarında etkinleştirme dekoratörü. Ledger/ödeme için ayrıca **alan düzeyi idempotency anahtarı** (benzersiz indeks) kullanım rehberi.
- **Kabul:** Aynı anahtarla 10 eşzamanlı istek tek yan etki üretir (test).
- **Durum:** ⬜ Beklemede

### T-009 · Transactional outbox ve kuyruk altyapısı
- **Etiket:** altyapı · güvenilirlik
- **Bağımlılık:** T-006, T-007
- **Detay:** `outbox` tablosu (olay türü, yük, tenant, durum, deneme sayısı, `available_at`). İş verisiyle **aynı işlemde** yazma yardımcısı. Worker: `FOR UPDATE SKIP LOCKED`, üstel geri çekilmeli yeniden deneme, ölü mektup (DLQ) durumu, işleme günlüğü. BullMQ kuyrukları ve zamanlanmış job çerçevesi (cron + dağıtık kilit). Olay türü kataloğu (`booking.created`, `payment.succeeded` …) tek dosyada tanımlı.
- **Kabul:** İşlem geri alınırsa olay yazılmaz; worker çökmesinde olay kaybolmaz; aynı olay iki kez işlenirse yan etki bir kez oluşur (test).
- **Durum:** ⬜ Beklemede

### T-010 · Audit log altyapısı
- **Etiket:** altyapı · güvenilirlik
- **Bağımlılık:** T-007, T-005
- **Detay:** Eklemeli (append-only) `audit_log` tablosu; uygulama rolünde UPDATE/DELETE yetkisi yok. Servis katmanında `audit.record(action, entity, before, after)` yardımcısı; HTTP bağlamından actor, IP, user agent, request id otomatik doldurulur. Hassas alanlar (parola, kart referansı) maskelenir. Sistem/worker eylemleri `actor=system:<job>` olarak yazılır.
- **Kabul:** Yazan her endpoint audit üretir (kontrol amaçlı entegrasyon testi, "audit'siz yazma" lint kuralı).
- **Durum:** ⬜ Beklemede

### T-011 · Yumuşak silme ve geri alma altyapısı
- **Etiket:** altyapı · güvenilirlik
- **Bağımlılık:** T-006, T-010
- **Detay:** Ortak yumuşak silme davranışı (varsayılan sorgular silinmişleri gizler). `restore()` yardımcısı + bağımlı kayıt kuralları (örn. silinen offering'in gelecekteki seansları da gizlenir/geri gelir). 30 gün sonrası kalıcı temizlik job'ı (KVKK silme akışından ayrı). Geri alma audit'e yazılır.
- **Kabul:** Silinen kayıt 30 gün içinde geri alınır; 30 gün sonra job kaldırır; ledger/payment tabloları silme API'si sunmaz.
- **Durum:** ⬜ Beklemede

### T-012 · Gözlemlenebilirlik (temel)
- **Etiket:** altyapı · operasyon
- **Bağımlılık:** T-005
- **Detay:** Sentry (API + web), OpenTelemetry iz/metrik (HTTP, DB, kuyruk), korelasyon kimliği, hata/yavaş sorgu logları, iş metrikleri (rezervasyon sayısı, ödeme sonucu, kuyruk gecikmesi). PII loglanmaz (e-posta/telefon maskeleme).
- **Kabul:** Yapay hata Sentry'de görünür; örnek iz uçtan uca takip edilebilir.
- **Durum:** ⬜ Beklemede

### T-013 · Feature flag altyapısı
- **Etiket:** altyapı
- **Bağımlılık:** T-007
- **Detay:** Tenant bazlı bayrak tablosu + sunucuda değerlendirme + önbellek; istemcilere (`/v1/admin/flags`, `/v1/me/flags`) güvenli alt küme sunulur. Varsayılan "kapalı". Bayrak kullanım rehberi (ödeme ve iade gibi riskli akışlar pilotlara kademeli açılır).
- **Kabul:** Bayrak değişince davranış değişir; test yardımcısı ile bayrak simülasyonu.
- **Durum:** ⬜ Beklemede

### T-014 · i18n, zaman ve para yardımcıları
- **Etiket:** altyapı
- **Bağımlılık:** T-005
- **Detay:** Sunucu ve web için mesaj katalogları (`tr` tam, `en` iskelet), tarih/saat biçimleme (tenant/lokasyon zaman dilimi), `Money` değer nesnesi (kuruş, yuvarlama kuralı, biçimleme), zaman dilimi dönüştürme yardımcıları (Luxon/Temporal), e-posta şablonları için de aynı katalog.
- **Kabul:** `Money` ile toplama/bölme/yüzde işlemleri kuruş kaybetmez (property test); yerel saat ↔ UTC dönüşümü testleri.
- **Durum:** ⬜ Beklemede

### T-015 · Dosya depolama soyutlaması
- **Etiket:** altyapı
- **Bağımlılık:** T-005, T-003
- **Detay:** `StorageService` arayüzü (S3 uyumlu): imzalı yükleme/indirme URL'leri, içerik türü ve boyut sınırı, tenant öneki (`tenants/{id}/…`), görsel yeniden boyutlandırma (logo, hoca fotoğrafı), geçici dosya temizliği. Geliştirmede MinIO. Üretim sağlayıcısı T-100'de bağlanır.
- **Kabul:** Logo yükle/oku akışı MinIO ile çalışır; başka tenant'ın dosyasına imzalı URL üretilemez.
- **Durum:** ⬜ Beklemede

### T-016 · E-posta soyutlaması ve şablon motoru
- **Etiket:** altyapı · bildirim
- **Bağımlılık:** T-009, T-014
- **Detay:** `EmailProvider` arayüzü + geliştirme sürücüleri (SMTP→Mailpit, log). Şablon motoru (MJML/React Email veya muadili) + TR şablon katalogları, tenant markası (ad, logo, renk) ile kişiselleştirme. Gönderim outbox'tan; `email_messages` tablosu (durum, deneme, sağlayıcı kimliği). Üretim sağlayıcısı T-099'da bağlanır.
- **Kabul:** Test e-postası Mailpit'te doğru markayla görünür; başarısız gönderim yeniden denenir.
- **Durum:** ⬜ Beklemede

### T-017 · Staging ortamı ve dağıtım hattı
- **Etiket:** altyapı · operasyon
- **Bağımlılık:** T-004, T-012
- **Detay:** Terraform ile staging (API, worker, Postgres, Redis, depolama, alan adı). Ayrı **web süreci** ve **worker süreci** olarak dağıtım. Her ana dal birleşmesinde otomatik staging dağıtımı; migration adımı (geri alınabilir). Sır yönetimi (platformun gizli deposu). Postgres otomatik yedek + PITR (RPO ≤ 5 dk hedefi). Üretim ortamı aynı koddan tek komutla kurulur (T-102 ve T-119'da kullanılır).
- **Kabul:** Staging'e otomatik dağıtım; sağlık kontrolü yeşil; yedekten geri yükleme **belgesi** hazır (tatbikat T-081).
- **Durum:** ⬜ Beklemede

### T-018 · Kimlik modeli ve oturum altyapısı
- **Etiket:** kimlik
- **Bağımlılık:** T-007, T-010
- **Detay:** Tablolar: `admin_users`, `tenant_memberships` (rol), `customer_accounts`, `sessions`/`refresh_tokens`. Oturum: kısa ömürlü erişim token'ı (15 dk) + **dönen** (rotating) refresh token (yeniden kullanım tespiti = oturum iptali). Web için `httpOnly` çerez, mobil için gövde ile token teslimi. Personel ve müşteri için ayrı `audience`. Parola: **argon2id**.
- **Kabul:** Token çalınma/yeniden kullanım testi; personel token'ıyla `/v1/me` çağrılamaz (ve tersi).
- **Durum:** ⬜ Beklemede

### T-019 · Kimlik doğrulama uçları
- **Etiket:** kimlik
- **Bağımlılık:** T-018, T-016
- **Detay:** Personel ve müşteri için: kayıt, e-posta doğrulama (süreli token), giriş, çıkış, oturum yenileme, "parolamı unuttum"/sıfırlama, parola değiştirme, hesap kilitleme/gecikme (brute force), IP + hesap bazlı rate limit, parola gücü kuralı. Müşteri kaydında **sahiplenme (claim)**: aynı e-postalı `customer` kaydı varsa doğrulama sonrası bağlanır (T-026 ile ilişkili). Müşteri kaydında aydınlatma metni sürümü ve zamanı saklanır.
- **Kabul:** Tüm akışların e2e testi; e-posta numaralandırmayı (user enumeration) sızdırmayan yanıtlar.
- **Durum:** ⬜ Beklemede

### T-020 · Personel 2FA (TOTP)
- **Etiket:** kimlik · güvenlik
- **Bağımlılık:** T-019
- **Detay:** TOTP kurulumu (QR + gizli anahtar), kurtarma kodları, giriş akışında 2. adım, tenant sahibi için "personel için zorunlu kıl" seçeneği (tenant ayarı).
- **Kabul:** 2FA zorunlu tenant'ta 2FA'sız personel erişemez; kurtarma kodu tek kullanımlık.
- **Durum:** ⬜ Beklemede

### T-021 · RBAC (roller ve izinler)
- **Etiket:** kimlik · güvenlik
- **Bağımlılık:** T-018
- **Detay:** Bölüm 4.3 matrisini **kodda izin kümesi** olarak tanımla (`permission` sabitleri). `@RequirePermission()` guard'ı, **kaynak düzeyi** kısıtlar (hoca yalnızca kendi seansları). Tüm endpoint'lerin izin etiketi zorunlu (etiketsiz endpoint CI'da hata). İzin matrisi test tablosu (rol × endpoint).
- **Kabul:** Matristeki her hücre için otomatik test; yetkisiz → `403`, başka tenant → `404`.
- **Durum:** ⬜ Beklemede

### T-022 · Tenant kaydı ve slug
- **Etiket:** kimlik · tenancy
- **Bağımlılık:** T-019, T-021
- **Detay:** Kayıt akışı sonunda tenant oluşturma (işlem içinde): tenant, sahip membership, varsayılan ayarlar, varsayılan kategori(ler). Slug üretimi/doğrulaması (benzersiz, yasaklı kelimeler, değiştirme kuralı: değişirse eski slug yönlendirir). Tenant durumları (`trial/active/suspended`). Tenant başına ayarlar tablosu (JSON şemalı + sürüm).
- **Kabul:** Kayıt → tenant → giriş akışı e2e; slug çakışması ve yasaklı isim testleri.
- **Durum:** ⬜ Beklemede

### T-023 · İşletme profili ve ayarlar
- **Etiket:** tenancy
- **Bağımlılık:** T-022, T-015
- **Detay:** Ad, açıklama, iletişim, adres, logo/kapak (T-015), marka rengi, zaman dilimi, para birimi (TRY). Politika varsayılanları (Bölüm 8.6): serbest iptal süresi, geç iptal/no-show eylem ve ücretleri; rezervasyon penceresi; bekleme listesi terfi kapanışı; hatırlatma süresi; hak sıralama stratejisi; iade sonrası geçerlilik uzatma; otomatik no-show; görünürlük ufku (personel/müşteri). Ayar değişiklikleri audit'lenir; **etki önizlemesi** (örn. "iptal süresini 12'den 4 saate indirmek yaklaşan X rezervasyonu etkiler").
- **Kabul:** Her ayar sunucuda doğrulanır ve ilgili modülde gerçekten kullanılır (T-047/T-048/T-049/T-055 ile uçtan uca doğrulama).
- **Durum:** ⬜ Beklemede

### T-024 · Lokasyon ve oda yönetimi
- **Etiket:** tenancy
- **Bağımlılık:** T-023
- **Detay:** Lokasyon CRUD (ad, adres, zaman dilimi), oda CRUD (kapasite, açıklama), varsayılan lokasyon. Çoklu lokasyon **altyapısı** var (tüm seans/offering lokasyona bağlı) ama MVP arayüzü tek lokasyon için sadeleştirilir. Yumuşak silme; aktif seansı olan oda silinemez (açık hata).
- **Kabul:** Oda silme önizlemesi ("X gelecek seansı etkiler"); kapasite alanı seans kapasitesini sınırlar.
- **Durum:** ⬜ Beklemede

### T-025 · Personel daveti ve hoca profilleri
- **Etiket:** tenancy · kimlik
- **Bağımlılık:** T-019, T-021, T-016
- **Detay:** E-postayla davet (süreli, tek kullanımlık bağlantı), rol atama/değiştirme/çıkarma, son sahip çıkarılamaz kuralı, **hoca profili** (görünür ad, biyografi, fotoğraf, aktif/pasif), hoca ile `admin_user` bağı (daveti kabul eden hoca olur; hesapsız "ghost" hoca da olabilir — yalnızca ad ile ders atanır).
- **Kabul:** Davet → kabul → rol kısıtlı panel e2e; rol değişikliği anında yetkiyi etkiler (token yenilemesiyle) ve audit'lenir.
- **Durum:** ⬜ Beklemede

### T-026 · Müşteri (Customer) CRUD ve arama
- **Etiket:** crm
- **Bağımlılık:** T-021, T-011
- **İlişkili:** T-019 (claim), T-029
- **Detay:** Alanlar: ad, soyad, e-posta, telefon, doğum tarihi (opsiyonel), notlar (dahili), etiketler, kaynak, durum, `customer_account_id?`. Tenant içinde e-posta benzersiz (boş olabilir), telefon normalize (E.164). **Arama:** Postgres FTS + trigram (ad/e-posta/telefon), sayfalama, filtre (etiket, durum, aktif hak var/yok). Yinelenen kayıt uyarısı (benzer ad+telefon). Sahiplenme (claim) servisi: hesap doğrulanınca eşleşen `customer` bağlanır.
- **Kabul:** 5.000 müşteride arama < 150 ms; claim sonrası çift kayıt oluşmaz.
- **Durum:** ⬜ Beklemede

### T-027 · Customer 360 görünümü (API)
- **Etiket:** crm
- **Bağımlılık:** T-026
- **İlişkili:** T-042, T-046 (sonradan bu modüllerden beslenir)
- **Detay:** `GET /customers/{id}/overview` ve zaman çizelgesi: profil, aktif haklar ve bakiye, yaklaşan/geçmiş rezervasyonlar, satın almalar, ödemeler, notlar, etiketler, rıza durumu. Zaman çizelgesi için ortak `timeline_events` projeksiyonu (booking, purchase, payment, note olayları; outbox olaylarından beslenir). Bu görevde yalnızca profil + not/etiket + projeksiyon altyapısı bitirilir; diğer parçalar ilgili modül görevlerinde bağlanır.
- **Kabul:** Projeksiyon iskeleti; yeni modül olay yayınlayınca zaman çizelgesinde görünür (örnek olayla).
- **Durum:** ⬜ Beklemede

### T-028 · Müşteri CSV içe aktarma
- **Etiket:** crm · taşıma
- **Bağımlılık:** T-026, T-009, T-015
- **İlişkili:** T-075
- **Detay:** Şablon indirme; CSV yükleme (UTF-8/Windows-1254 algılama), sütun eşleme ekranı için API (örnek satırlar + otomatik eşleme önerisi), **kuru çalıştırma (dry-run)**: eşleşen, eşleşmeyen, geçersiz, olası çift (e-posta/telefon/ad benzerliği) raporu; onay → arka plan job'ı ile yazma (idempotent, `import_batch_id`); hatalı satırlar indirilebilir CSV. İçe aktarma geri alınabilir (batch silme, 30 gün).
- **Kabul:** 5.000 satırlık dosya dakikalar içinde işlenir; dry-run raporu ile gerçek sonuç sayıları tutarlıdır (Epic 8).
- **Durum:** ⬜ Beklemede

### T-029 · KVKK: rıza, dışa aktarma ve silme/anonimleştirme
- **Etiket:** uyum · crm
- **Bağımlılık:** T-026, T-019, T-011
- **Detay:** Aydınlatma metni sürümleme ve onay kaydı (kim, hangi sürüm, ne zaman, IP). Müşteri/personel verisini JSON dışa aktarma (müşteri kendi `/v1/me/data-export`, stüdyo adına admin). **Silme/anonimleştirme:** kişisel alanlar geri döndürülemez maskelenir; mali kayıtlar kimliksiz korunur; bekleyen ödeme/abonelik varsa engelleyici uyarı. Silme talebi iş kuyruğu + audit. Mobil "hesabı sil" (T-112) bu akışı kullanır.
- **Kabul:** Silinen müşterinin hiçbir ekranda/dışa aktarmada kişisel verisi kalmaz; ledger toplamları değişmez (test).
- **Durum:** ⬜ Beklemede

### T-030 · Offering ve kategori modeli
- **Etiket:** zamanlama · katalog
- **Bağımlılık:** T-024, T-021, T-011
- **Detay:** Kategori CRUD. Offering CRUD: tür (`class`/`appointment`/`workshop`), ad, açıklama, kategori, süre, varsayılan kapasite, bekleme listesi kapasitesi, drop-in fiyatı (opsiyonel, KDV dahil + oran), iptal politikası ezmeleri (Bölüm 8.6), görünürlük (herkese açık/gizli), renk, görsel, hoca kısıtı (opsiyonel), "yalnızca belirli ürünlerle" kısıtı. Yayın kontrol listesi: eksik zorunlu alan (açıklama, iptal politikası) **uyarı** üretir, engellemez.
- **Kabul:** Üç tür için CRUD + doğrulama; uyarılar API'de `warnings[]` olarak döner.
- **Durum:** ⬜ Beklemede

### T-031 · RRULE motoru ve seans üretimi
- **Etiket:** zamanlama
- **Bağımlılık:** T-030, T-014, T-009
- **Detay:** `Series` modeli ve `Session` üretimi. RRULE (haftalık, gün seçimli, aralıklı), bitiş: tarih/adet/süresiz. Yerel saat → UTC üretimi lokasyon zaman dilimiyle. Süresiz seriler için **genişletme job'ı** (ufuk + 8 hafta, idempotent: `(series_id, occurrence_key)` benzersiz). Tatil günü atlama. Seans durumları `draft/published/cancelled`. Üretim tek işlemde ve **önizleme modu** (yazmadan sonuç döner).
- **Kabul:** Pzt-Çar-Cum 07:00 tek istekle üretilir; aynı üretim iki kez çalışsa kopya oluşmaz; önizleme ile gerçek üretim aynı sonucu verir (Epic 2).
- **Durum:** ⬜ Beklemede

### T-032 · Seri düzenleme (bu / bundan sonrası / tümü) ve etki önizlemesi
- **Etiket:** zamanlama
- **Bağımlılık:** T-031, T-021
- **İlişkili:** T-046 (rezervasyon sayısı), T-054 (bildirim)
- **Detay:** Düzenleme kapsamları ve **seri bölme** mantığı (bundan sonrası → yeni `Series` + eskinin bitişi). Elle düzenlenmiş seans (istisna) davranışı (Bölüm 8.1). `POST …/preview`: etkilenen seans sayısı, etkilenen **rezervasyon sayısı**, çakışmalar, atlanan tatiller. Uygulama onaydan sonra tek işlemde; etkilenen müşterilere bildirim olayı yayınlanır (T-054 şablonları kullanır; bu görev olayı ve yükünü tanımlar). Silme de aynı mantık (yumuşak silme).
- **Kabul:** "Yalnızca bu / bundan sonrası / tümü" üç yol için testler; önizleme sayısı ile gerçek etkilenen sayı eşit; geçmiş seanslar değişmez.
- **Durum:** ⬜ Beklemede

### T-033 · Görünürlük ufku ve yayınlama job'ı
- **Etiket:** zamanlama
- **Bağımlılık:** T-031, T-023
- **Detay:** Personel ufku (varsayılan 6 hf) ve müşteri ufku (3 hf): `draft` seanslar zamanı gelince `published` olur; `public`/`me` API'leri yalnızca `published` seansları ve ufuk içindekini döndürür. Elle "şimdi yayınla/yayından kaldır". Ufuk ayarı değişince job yeniden değerlendirir. Job idempotent ve tenant başına bölünebilir.
- **Kabul:** Ufuk dışı seans müşteriye görünmez; ufuk uzatılınca otomatik görünür olur.
- **Durum:** ⬜ Beklemede

### T-034 · Çakışma denetimi
- **Etiket:** zamanlama
- **Bağımlılık:** T-031, T-024, T-025
- **Detay:** Oda ve hoca çakışması: seans oluşturma/düzenleme/seri üretiminde denetim. Sert/yumuşak seviye: sınıflarda "uyarı + yönetici onayı ile geç", randevuda sert engel. Önizlemede çakışma listesi. Veritabanı seviyesinde randevu için `EXCLUDE USING gist` kısıtı (hoca + zaman aralığı) ile yarış koruması.
- **Kabul:** Eşzamanlı iki randevu oluşturma isteğinden yalnızca biri başarılı olur (test).
- **Durum:** ⬜ Beklemede

### T-035 · Dönem (Term) modeli — temel
- **Etiket:** zamanlama
- **Bağımlılık:** T-031, T-033
- **İlişkili:** T-041 (dönem ürünü)
- **Detay:** `Term`: ad, başlangıç/bitiş, tatil günleri, kayıt penceresi (açılış/kapanış). Seri ↔ dönem bağı; dönem değişince seri bitişi/atlanan günleri güncellenir (önizlemeli). **Dönem ürünü** (T-041'de) bir dönemin kategori/serilerindeki tüm derslere hak verir. Telafi dersi ve gelişmiş dönem özellikleri **MVP dışı**.
- **Kabul:** Dönem tatili seri üretimine yansır; kayıt penceresi dışında dönem ürünü satın alınamaz.
- **Durum:** ⬜ Beklemede

### T-036 · Şablonlar
- **Etiket:** zamanlama
- **Bağımlılık:** T-030, T-031
- **Detay:** Offering/seri için şablon kaydet ve uygulama (ad, süre, kapasite, hoca, oda, kural kümesi). "Şablondan seri oluştur" kısayolu. Sihirbazın ilk sınıfı (T-060) şablon altyapısını kullanır.
- **Kabul:** Şablondan seri oluşturma tek adımda önizleme + onay verir.
- **Durum:** ⬜ Beklemede

### T-037 · Randevu (appointment): uygunluk ve slot hesabı
- **Etiket:** zamanlama
- **Bağımlılık:** T-030, T-034, T-025
- **Detay:** Hoca haftalık uygunluk aralıkları + istisnalar (izin günü), offering süresi + tampon, **boş slot hesaplama** (mevcut seans/randevulara göre), slot rezervasyonunun seans kaydı üretmesi (kapasite 1). `public/me` slot listeleme uçları.
- **Kabul:** Slot hesabı DST'li zaman dilimi testinden geçer; tampon çakışmaları doğru engellenir.
- **Durum:** ⬜ Beklemede

### T-038 · Seans iptali ve hoca değişimi
- **Etiket:** zamanlama · rezervasyon
- **Bağımlılık:** T-031, T-021
- **İlişkili:** T-046, T-044, T-054
- **Detay:** Seans iptali (neden zorunlu): tüm `confirmed` rezervasyonlar `cancelled`, **tam kredi iadesi** (politika uygulanmaz), bekleme listesi temizlenir, katılımcılara bildirim olayı, önizleme ("N rezervasyon etkilenecek"). Hoca değişimi: yeni hoca çakışma kontrolü, katılımcılara bildirim. Bu görev, rezervasyon/kredi servislerine bağımlı kısımları **arayüz (port) üzerinden** çağırır; T-046/T-044 bitince entegrasyon testleri tamamlanır.
- **Kabul:** Seans iptalinde kredi bakiyeleri iptalden önceki duruma döner; çift iptal çift iade üretmez (idempotent).
- **Durum:** ⬜ Beklemede

### T-039 · Zamanlama test kümesi (RRULE + DST + zaman dilimi)
- **Etiket:** test · zamanlama
- **Bağımlılık:** T-031, T-032, T-037
- **Detay:** Parametrik test kümesi: haftalık/gün seçimli seriler; ay sonu, yıl sonu; **DST'li zaman dilimleri** (örn. `Europe/Berlin`, `America/New_York`) ve `Europe/Istanbul`; farklı saat dilimindeki lokasyon; seri bölme; süresiz genişletme. "Golden" sonuçlar `fixtures` içinde tutulur.
- **Kabul:** DST geçişinde yerel saat kaymaz; Epic 2 kabul ölçütleri otomatik test olarak yeşil.
- **Durum:** ⬜ Beklemede

### T-040 · Ledger tasarımı ve şeması
- **Etiket:** ledger
- **Bağımlılık:** T-006, T-007, T-008, T-014
- **Detay:** Bölüm 9'daki iki defteri uygula: `ledger_journals` (olay + idempotency_key), `ledger_entries` (hesap, işaretli tutar, referanslar), `credit_ledger`. **Bütünlük:** veritabanı seviyesinde "journal toplamı = 0" kısıtı (deferred constraint trigger), eklemeli (UPDATE/DELETE yok). Servis API'si: `postJournal(...)`, `postCreditEntry(...)`, hesap bakiyesi sorguları. Hesap planı tohumlanır (tenant başına). Gelir tanıma kuralları (Bölüm 9.1) için `RevenueRecognitionService` arayüzü: tüketimde tanıma, üyelik günlük tanıma job'ı, süre dolumu (breakage) job'ı.
- **Kabul:** Dengesiz journal veritabanında reddedilir; aynı idempotency anahtarı ikinci kez yazılamaz; örnek senaryolar (satış, tüketim, iade, süre dolumu) birim testleriyle doğrulanır (Epic 4).
- **Durum:** ⬜ Beklemede

### T-041 · Ürün (Product) modeli ve yönetimi
- **Etiket:** katalog · ledger
- **Bağımlılık:** T-030, T-035, T-040
- **Detay:** Drop-in, paket, üyelik, intro offer, dönem ürünü (Bölüm 8.4). Alanlar: ad, açıklama, tür, fiyat (KDV dahil), KDV oranı, kategori kapsamı, geçerlilik (`validity_days`, `validity_start`), üyelik dönemi/limit/otomatik yenileme, intro kuralları (`new_customers_only`, müşteri başına 1), görünürlük (herkese açık / yalnızca kasa), `allow_installments` ve izinli taksit sayıları (T-087 kullanır), sıralama, arşivleme. Fiyat değişikliği **geçmiş satın almaları etkilemez** (satın alma anında fiyat anlık kopya alınır).
- **Kabul:** Her ürün türü için doğrulama kuralları; arşivlenen ürün satılmaz ama geçmiş satın almalar bozulmaz.
- **Durum:** ⬜ Beklemede

### T-042 · Satın alma (Purchase) ve hak (Entitlement) modeli
- **Etiket:** ledger · katalog
- **Bağımlılık:** T-041, T-040, T-026
- **İlişkili:** T-027 (Customer 360 beslemesi), T-084 (ödeme bağlanır)
- **Detay:** `purchases` (müşteri, ürün anlık kopyası, tutar/KDV, durum, ödeme yöntemi, kaynak: `desk`/`online`/`import`/`adjustment`), `entitlements` (kalan, toplam, başlangıç/bitiş, kapsam, durum, üyelik dönem bilgisi). **Tek servis metodu** `grantPurchase()`: tek işlemde purchase + entitlement + money journal (satış) + credit ledger `grant` + outbox. Üyelik: ilk dönem entitlement'ı ve yenileme takvimi kaydı (`subscription_schedule`, T-092'de doldurulur). Intro offer ve dönem kuralları burada doğrulanır.
- **Kabul:** `grantPurchase` idempotent (aynı anahtar çift hak üretmez); journal dengeli; hak başlangıç/bitiş tarihleri `validity_start` kuralına uyar.
- **Durum:** ⬜ Beklemede

### T-043 · Kasadan satış ve manuel düzeltme
- **Etiket:** ledger · satış
- **Bağımlılık:** T-042, T-021
- **Detay:** Resepsiyon satışı: müşteri + ürün + ödeme yöntemi (nakit / havale-EFT / POS-dışı kart / ücretsiz-hediye) + not. Ücretsiz/hediye satışta tutar 0 ve neden zorunlu. **Manuel kredi düzeltmesi** (artır/azalt/süre uzat): yalnızca sahip/yönetici, neden notu zorunlu, credit ledger `adjust` + audit. İptal edilen satış → ters kayıt (para ledger'ında iade/ters, hak `cancelled`). Satış sonrası makbuz e-postası olayı.
- **Kabul:** Yanlış satışı iptal etmek ledger'ı bozmaz (toplam sıfırlanır, kayıtlar silinmez); düzeltme neden/aktör ile görünür (Epic 4).
- **Durum:** ⬜ Beklemede

### T-044 · Hak seçimi ve kredi tüketim motoru
- **Etiket:** ledger · rezervasyon
- **Bağımlılık:** T-042
- **Detay:** Bölüm 8.3'ü uygulayan `EntitlementResolver`: filtreler (durum, geçerlilik, kategori, kalan/limit), sıralama stratejileri (`expiring_first` / `membership_first` / `pack_first`), tüketim (`consume`), iade (`refund`), **limitli üyelik dönem/hafta limiti** hesabı, `reason` metni. Servis, rezervasyon kilidi içinden çağrılabilecek şekilde **aynı DB işlemine katılır**. Hak yoksa neden kodu döner (`NO_ELIGIBLE_ENTITLEMENT`, `LIMIT_REACHED`, `EXPIRED`, `WRONG_CATEGORY`) — arayüz bunları anlaşılır gösterir.
- **Kabul:** Strateji başına sıralama testleri; eşzamanlı iki tüketimde kalan kredi negatife düşmez (kilit/kısıt); `reason` müşteriye/personele görünür.
- **Durum:** ⬜ Beklemede

### T-045 · Ledger okuma API'si ve bakiye
- **Etiket:** ledger
- **Bağımlılık:** T-044, T-040
- **Detay:** Müşteri hak geçmişi (`/customers/{id}/credit-history`), hak detayı ve bakiye, para ledger'ı için hesap hareketleri, tutarlılık job'ı (`entitlement.remaining` ↔ credit ledger toplamı; fark alarmı). Müşteri tarafı salt okunur (`/v1/me/entitlements`).
- **Kabul:** Bakiye ledger toplamıyla birebir; tutarlılık job'ı yapay bozulmada alarm üretir.
- **Durum:** ⬜ Beklemede

### T-046 · Booking domain ve durum makinesi
- **Etiket:** rezervasyon
- **Bağımlılık:** T-031, T-026, T-044
- **Detay:** `bookings`, `waitlist_entries`, `booking_events`. Durum makinesi (Bölüm 8.5) tek yerde; izinli geçişler dışındaki geçiş reddedilir. Benzersiz kısıt: `(session_id, customer_id)` için aktif tek kayıt. Kapasite sayacı türetilmiş/doğrulanmış (confirmed sayısı ≤ kapasite). Domain olayları outbox'a.
- **Kabul:** Geçersiz geçiş testleri; her geçiş `booking_events` + audit üretir.
- **Durum:** ⬜ Beklemede

### T-047 · Rezervasyon oluşturma (kapasite, hak, idempotency)
- **Etiket:** rezervasyon
- **Bağımlılık:** T-046, T-044, T-008, T-033
- **İlişkili:** T-051, T-053, T-086 (drop-in satın alma ile birleşir)
- **Detay:** `POST /bookings` (admin adına, müşteri kendi adına): tek işlemde seans satırı `FOR UPDATE` → kapasite → rezervasyon penceresi (açılış/kapanış) → müşteri çakışması (aynı saatte başka seans uyarısı) → hak seçimi/tüketim → booking + credit ledger + outbox. Hak yoksa net hata ve yönlendirme bilgisi (uygun ürünler listesi). Drop-in fiyatlı seansta "ödeme gerekli" durumu (online ödeme gelene kadar yalnızca kasadan çözülür). Dolu seansta bekleme listesine yönlendirme.
- **Kabul:** Aynı istek tekrar edilince tek rezervasyon; kapasite aşılmaz; "neden bu hak kullanıldı" kayıtta (Epic 3).
- **Durum:** ⬜ Beklemede

### T-048 · İptal ve geç iptal politikası motoru
- **Etiket:** rezervasyon
- **Bağımlılık:** T-047, T-023
- **İlişkili:** T-094 (ücret tahsilatı)
- **Detay:** Politika çözümleme (tenant → offering → seans). Serbest iptal: kredi `refund`, yer boşalır (T-049 tetiklenir). Geç iptal: `forfeit_credit` (kredi yanar, gelir tanıma), `charge_fee` (borç kaydı `receivable_customer`; kayıtlı kart varsa tahsilat T-094'te), `none`. **Personel istisnası/affı:** neden zorunlu, ters kayıt. Hak süresi dolmuşsa iade kuralı (Bölüm 8.3). Müşteriye iptal öncesi **sonuç önizlemesi** ("şimdi iptal ederseniz 1 krediniz yanar").
- **Kabul:** Pencere sınırı (tam eşik anı) testleri; iptal idempotent; af ledger'da görünür.
- **Durum:** ⬜ Beklemede

### T-049 · Bekleme listesi
- **Etiket:** rezervasyon
- **Bağımlılık:** T-047, T-048
- **Detay:** Listeye ekle/çık, sıra numarası, **otomatik terfi** (Bölüm 7.5/8.7): yer açıldığında kuyruk işçisi sıradakini aynı rezervasyon kod yoluyla dener; hakkı olmayanı atlar (sıra korunur); `waitlist_cutoff` sonrası terfi durur; seans başlayınca kayıtlar `cancelled`. Terfi başarılıysa onay + bildirim olayı.
- **Kabul:** Yer açılınca terfi saniyeler içinde olur; eşzamanlı iki iptalde iki farklı kişi terfi eder, kimse çift terfi etmez.
- **Durum:** ⬜ Beklemede

### T-050 · Check-in ve no-show
- **Etiket:** rezervasyon
- **Bağımlılık:** T-047, T-048
- **Detay:** Personel check-in (tekli/toplu "herkesi geldi say"), geri alma. Seans bitince **otomatik no-show job'ı** (tenant ayarı açıksa; bitiş + `no_show_grace_minutes`): `confirmed` ve check-in'siz → `no_show` + politika. `attended` olduğunda gelir tanıma tetiklenir (T-040). Geçmişe dönük düzeltme (ters kayıt). Hoca yalnızca kendi seansında check-in yapar.
- **Kabul:** Check-in/no-show geçişleri ledger ile tutarlı; gelir tanıma tek sefer.
- **Durum:** ⬜ Beklemede

### T-051 · Yönetici/resepsiyon rezervasyon yönetimi
- **Etiket:** rezervasyon
- **Bağımlılık:** T-047, T-048, T-050
- **Detay:** Müşteri adına rezervasyon (belirli hakla veya otomatik seçimle), müşteriyi başka seansa taşıma (iptal + yeni, tek işlemde, kredi korunur), "kapasiteyi aşarak ekle" (yalnızca sahip/yönetici, neden zorunlu, audit — seans kapasitesini değiştirmez, `over_capacity` işareti), toplu iptal (önizlemeli).
- **Kabul:** Taşıma sırasında kredi kaybı/çift düşüm olmaz; aşım yalnızca yetkili rolde mümkün.
- **Durum:** ⬜ Beklemede

### T-052 · Intro offer kuralı uygulaması
- **Etiket:** katalog · rezervasyon
- **Bağımlılık:** T-042, T-047
- **Detay:** Satın almada: müşteri başına tek sefer, `new_customers_only` kontrolü (önceki herhangi bir purchase veya attended booking). Çakışan kullanım yarışı için benzersiz kısıt. Müşteri ve personel arayüzünde nedenli ret mesajı.
- **Kabul:** Aynı müşteri iki kez satın alamaz (eşzamanlı istek testi dahil).
- **Durum:** ⬜ Beklemede

### T-053 · Rezervasyon eşzamanlılık ve yük testleri
- **Etiket:** test · rezervasyon
- **Bağımlılık:** T-049, T-050, T-051, T-052
- **Detay:** 100+ eşzamanlı istek ile son yer yarışı (k6 + entegrasyon testi): kapasite aşılmaz, kalan istekler `FULL`/bekleme listesine düşer. Eşzamanlı iptal+rezervasyon, eşzamanlı terfi, aynı müşterinin çift tıklaması. Sabah 06:00 popüler sınıf açılışı yük senaryosu (p95 hedefleri).
- **Kabul:** Overbooking = 0 (tekrarlı çalıştırmalarla); p95 hedefleri (Bölüm 13) sağlanır. Epic 3 yeşil.
- **Durum:** ⬜ Beklemede

### T-054 · Bildirim olayları ve e-posta şablonları
- **Etiket:** bildirim
- **Bağımlılık:** T-016, T-047, T-048, T-049, T-043
- **İlişkili:** T-032, T-038
- **Detay:** Bölüm 8.10 tablosundaki tüm e-postalar için TR şablonları ve outbox tüketicileri: doğrulama (T-019 ile), davet, rezervasyon onayı, iptal sonucu, terfi, seans iptali/hoca değişimi/seri değişikliği, satın alma makbuzu (bilgi amaçlı, mali belge değildir uyarısıyla), (ödeme görevlerinde) ödeme başarısız/kart güncelle. Stüdyo markasıyla kişiselleştirme; önizleme ve test gönderimi.
- **Kabul:** Her olay için e-posta tetiklenir; aynı olay iki kez işlense tek e-posta gider.
- **Durum:** ⬜ Beklemede

### T-055 · Hatırlatma job'ları, ICS ve bildirim tercihleri
- **Etiket:** bildirim
- **Bağımlılık:** T-054, T-033
- **Detay:** Seans öncesi hatırlatma job'ı (varsayılan 24 saat; ayarlanabilir; iptal/taşıma durumunda yeniden planlama), onay e-postasına **ICS** eki (takvime ekle), müşteri bildirim tercihleri (`/v1/me/notification-preferences`): işlemsel olmayanları kapatma; işlemsel olanlar kapatılamaz. Kanal altyapısı e-postadan sonra push için genişleyebilir (`NotificationChannel` arayüzü).
- **Kabul:** İptal edilen seans için hatırlatma gitmez; ICS saat dilimi doğru (Outlook/Google/Apple'da doğrulanır).
- **Durum:** ⬜ Beklemede

### T-056 · Raporlar API'si
- **Etiket:** raporlama
- **Bağımlılık:** T-040, T-050, T-045
- **Detay:** Tümü **ledger/booking verisinden türetilir:**
  - **Satış:** nakit esaslı (tahsilat tarihi) ve tahakkuk esaslı (gelir tanıma tarihi); ürün, yöntem, hoca, kategori kırılımı; KDV ayrı; iade ayrı.
  - **Katılım:** seans doluluğu, katılan/no-show/geç iptal, hoca bazında, saat/gün ısı verisi (basit).
  - **Üyelik:** aktif, yeni, biten, askıya alınan, yenileme oranı (temel).
  - CSV dışa aktarma; büyük raporlar için arka plan job'ı.
- **Kabul:** Tüm rapor toplamları T-057 testinden geçer; filtre kombinasyonları testli.
- **Durum:** ⬜ Beklemede

### T-057 · Rapor ↔ ledger tutarlılık testi
- **Etiket:** test · raporlama
- **Bağımlılık:** T-056
- **Detay:** Rastgele senaryo üreticisiyle (satış, tüketim, iade, süre dolumu, düzeltme) sonuç üretip rapor toplamlarının ledger toplamlarına **birebir** eşitliğini doğrulayan property-based test; CI'da zorunlu.
- **Kabul:** Binlerce rastgele senaryoda fark 0 (Epic 7).
- **Durum:** ⬜ Beklemede

### T-058 · Dashboard KPI API'si
- **Etiket:** raporlama
- **Bağımlılık:** T-056
- **Detay:** Bugünkü seanslar ve doluluk, bu hafta/ay gelir (tahsilat ve tahakkuk), aktif üyelik, yeni müşteri, yaklaşan boş kontenjanlar, süresi dolmak üzere hak sayısı, başarısız ödeme (ödeme görevleri sonrası). Önbellekli, tenant bazlı.
- **Kabul:** Dashboard rakamları rapor API'siyle tutarlı; yanıt p95 < 300 ms.
- **Durum:** ⬜ Beklemede

### T-059 · Admin web iskeleti ve tasarım sistemi
- **Etiket:** web · tasarım
- **Bağımlılık:** T-005, T-019, T-021
- **Detay:** Next.js admin: yönlendirme, oturum/çerez yönetimi, rol bazlı menü, **OpenAPI'den üretilmiş istemci** (`packages/api-client`), React Query, form/doğrulama standardı, hata ve boş durum bileşenleri. **Tasarım sistemi v0:** renk/tipografi/aralık token'ları, 15 temel bileşen (düğme, girdi, seçim, tablo, modal, toast, tarih/saat seçici, sekmeler, rozet, boş durum…), erişilebilirlik kuralları (odak, klavye, kontrast), karanlık mod hazırlığı. Kayıt/giriş/2FA/parola sıfırlama ekranları.
- **Kabul:** Tüm bileşenler Storybook'ta; axe-core otomatik kontrol temiz; giriş akışı e2e.
- **Durum:** ⬜ Beklemede

### T-060 · Kurulum sihirbazı ve sandbox örnek veri
- **Etiket:** web · onboarding
- **Bağımlılık:** T-059, T-023, T-024, T-036, T-041
- **İlişkili:** T-085 (5. adım iyzico bağlama)
- **Detay:** Bölüm 7.1'deki **5 adımlı** sihirbaz; ilerleme kaydedilir, istediği yerden devam edilir. Eksik bilgiler uyarı olarak gösterilir (engellemez). Adım 5 (ödeme bağlantısı) ödeme görevleri bitene dek "sonra bağla" olarak çalışır; T-085'te gerçek bağlama devreye girer. **Sandbox verisi:** örnek hoca, kategoriler, 3 sınıf serisi, ürünler, 30 müşteri; tek tıkla yükle/temizle (yalnızca `sandbox=true` işaretli kayıtlar silinir). "Time-to-first-booking" analitik olayları.
- **Kabul:** Test kullanıcısı ≤ 15 dk'da ilk rezervasyonu yapar (zamanlı kullanılabilirlik testi, Epic 1); sandbox temizliği gerçek veriyi etkilemez.
- **Durum:** ⬜ Beklemede

### T-061 · Takvim ekranı
- **Etiket:** web · zamanlama
- **Bağımlılık:** T-059, T-031, T-032, T-034
- **Detay:** Gün/hafta/liste görünümü, hoca/oda/kategori filtresi, **sürükle-bırak** taşıma (çakışma uyarısı + etki önizlemesi), hızlı seans oluşturma, renk kodları, doluluk göstergesi, sanallaştırma (performans), zaman dilimi gösterimi. Taslak/yayında ayrımı.
- **Kabul:** 500 seanslı hafta akıcı; sürükle-bırak etki önizlemesi gösterir.
- **Durum:** ⬜ Beklemede

### T-062 · Offering, seri, dönem ve şablon ekranları
- **Etiket:** web · zamanlama
- **Bağımlılık:** T-061, T-035, T-036, T-030
- **Detay:** Offering/kategori yönetimi, **tek formlu seri oluşturma** (gün seçici, saat, bitiş türü), önizleme modalı (üretilecek seanslar, tatiller, çakışmalar), seri düzenlemede kapsam seçici ("yalnızca bu / bundan sonrası / tümü") + etki sayıları, dönem yönetimi, şablon yönetimi, randevu uygunluk ekranı.
- **Kabul:** Pzt-Çar-Cum 07:00 serisi ≤ 1 dk'da kurulur; etki sayıları API önizlemesiyle aynı.
- **Durum:** ⬜ Beklemede

### T-063 · Seans detay ve katılımcı ekranları
- **Etiket:** web · rezervasyon
- **Bağımlılık:** T-061, T-050, T-051, T-049
- **Detay:** Seans detayı: katılımcı listesi, hak bilgisi (hangi hak kullanıldı), check-in (tekli/toplu), müşteri ekle/taşı/iptal et, bekleme listesi yönetimi, seans iptali ve hoca değişimi akışları (önizleme + onay), hoca için sade "Bugün" ekranı (mobil tarayıcı uyumlu).
- **Kabul:** Hoca yalnızca kendi seanslarını görür; resepsiyon check-in'i 2 tıkta yapar.
- **Durum:** ⬜ Beklemede

### T-064 · Müşteri ekranları (liste, detay, 360, import)
- **Etiket:** web · crm
- **Bağımlılık:** T-059, T-026, T-027, T-028, T-045
- **Detay:** Liste (arama, filtre, sayfalama — **geri dönünce konum/filtre korunur**), detay (360: haklar, rezervasyonlar, satın almalar, notlar, zaman çizelgesi), etiket/not, hak geçmişi (ledger) tablosu, CSV içe aktarma sihirbazı (yükle → eşle → kuru çalıştırma raporu → onayla), KVKK dışa aktarma/silme eylemleri.
- **Kabul:** Epic 4 (resepsiyonist kredi hareketlerini tek ekranda görür) kabul testi.
- **Durum:** ⬜ Beklemede

### T-065 · Ürün ve kasa (manuel satış) ekranları
- **Etiket:** web · satış
- **Bağımlılık:** T-059, T-041, T-043
- **Detay:** Ürün listesi/formu (türe göre dinamik alanlar), önizleme ("müşteri şunu görür"), kasa ekranı: müşteri ara → ürün seç → ödeme yöntemi → onayla; satış iptali, manuel kredi düzeltme (neden zorunlu) ekranları. Kasa akışı klavye dostu ve hızlı.
- **Kabul:** Kasadan satış ≤ 20 sn (deneyimli kullanıcı); düzeltme neden notsuz kaydedilemez.
- **Durum:** ⬜ Beklemede

### T-066 · Ayarlar, personel, lokasyon/oda ekranları
- **Etiket:** web · tenancy
- **Bağımlılık:** T-059, T-023, T-024, T-025, T-020
- **Detay:** İşletme profili, politikalar (etki önizlemeli), personel davet/rol, hoca profilleri, lokasyon/oda, bildirim şablon önizlemeleri, 2FA ayarı, veri dışa aktarma bağlantısı (T-076).
- **Kabul:** Her ayar kaydında etkisi açıklayan metin; rol değişikliği anında menüyü etkiler.
- **Durum:** ⬜ Beklemede

### T-067 · Rapor ve dashboard ekranları
- **Etiket:** web · raporlama
- **Bağımlılık:** T-059, T-056, T-058
- **Detay:** Dashboard kartları ve grafikler, satış/katılım/üyelik rapor ekranları, tarih aralığı + kırılım seçimi, CSV indir, nakit/tahakkuk anahtarı, rakamların yanında "bu rakam nasıl hesaplandı" açıklaması.
- **Kabul:** Ekrandaki toplamlar API ile aynı; boş durumlar anlamlı.
- **Durum:** ⬜ Beklemede

### T-068 · Audit log ve çöp kutusu ekranları
- **Etiket:** web · güvenilirlik
- **Bağımlılık:** T-059, T-010, T-011
- **Detay:** Audit log görüntüleyici (filtre: kullanıcı, varlık, tarih), önce/sonra farkı gösterimi, dışa aktarma; **çöp kutusu** (silinen kayıtlar türe göre, "geri al" düğmesi, kalan gün sayacı).
- **Kabul:** Silinen ders/müşteri çöp kutusundan geri alınır ve takvimde/listede görünür (Epic 7).
- **Durum:** ⬜ Beklemede

### T-069 · Public (müşteri yüzü) API
- **Etiket:** api · hosted
- **Bağımlılık:** T-033, T-037, T-041, T-023, T-013
- **Detay:** Anonim `/v1/public/{slug}/…`: işletme profili ve tema (ad, logo, renk), kategoriler, hocalar, **program** (tarih aralığı, tür/kategori/hoca/lokasyon filtresi — **çoklu tür aynı istekte**), ders detayı, randevu slotları, herkese açık ürünler. CDN dostu önbellek başlıkları, ETag, rate limit, yalnızca ufuk içi `published` veri, kapasite doluluğu (yalnızca "dolu/yer var/az yer" seviyesi). CORS izinli kökenler ayarı (tenant bazlı; T-073 ile yönetilir).
- **Kabul:** Taslak/ufuk dışı veri sızmaz; yanıt boyutu ve süreleri hedefte; önbellek geçersiz kılma seans değişince çalışır.
- **Durum:** ⬜ Beklemede

### T-070 · Müşteri hesap akışları (`/v1/me`)
- **Etiket:** api · müşteri
- **Bağımlılık:** T-019, T-047, T-048, T-049, T-045, T-069
- **Detay:** Müşteri tarafı uçlar: stüdyoya katıl (slug), profilim, rezervasyonlarım (yaklaşan/geçmiş), rezervasyon yap/iptal (sonuç önizlemesiyle), bekleme listesi, haklarım ve hak geçmişi, ürünlerim, bildirim tercihleri, KVKK dışa aktarma/silme. Çoklu stüdyo bağlantısı (`customer_account` → birden çok `customer`). Müşteri yalnızca **kendi** verisine erişir (kaynak düzeyi yetki testi).
- **Kabul:** Müşteri başka müşterinin verisine erişemez (negatif testler); iptal önizlemesi ile gerçek sonuç aynıdır.
- **Durum:** ⬜ Beklemede

### T-071 · Hosted rezervasyon sayfası
- **Etiket:** web · hosted
- **Bağımlılık:** T-069, T-070, T-014
- **Detay:** `apps/hosted`: stüdyo ana sayfası (marka teması), program (gün/hafta, filtreler), ders detayı, giriş/kayıt (müşteri), rezervasyon + bekleme listesi, "Hesabım" (rezervasyonlar, haklar, iptal), ürünler sayfası, yasal bağlantılar. SSR/ISR ile SEO ve hız; tema değişkenleri (marka rengi); erişilebilirlik; mobil öncelikli. Ödeme akışı ödeme görevlerinde (T-086) bu sayfaya bağlanır; o ana kadar "hak yoksa stüdyoyla iletişime geçin" ve kasa yönlendirmesi gösterilir.
- **Kabul:** Lighthouse performans ≥ 90 (mobil); kritik akış e2e; WCAG 2.1 AA denetimi.
- **Durum:** ⬜ Beklemede

### T-072 · Embed widget'lar (Web Components)
- **Etiket:** web · embed
- **Bağımlılık:** T-069, T-070
- **Detay:** `<studio-schedule>`, `<studio-products>`, `<studio-account>` Web Component'leri (Shadow DOM, CSS değişkenleriyle tema). **Aynı sayfada birden çok widget ve filtre** (yoga + workshop ayrı widget'larda), `data-categories`, `data-types`, `data-instructors` nitelikleri. Rezervasyon için hosted sayfaya güvenli yönlendirme veya iframe modal fallback. Tek `<script>` etiketi ile yükleme, sürümlü CDN yolu.
- **Kabul:** Tek sayfada iki farklı filtreli widget çalışır (Epic 6); gzip ≤ 60 KB; CLS/LCP hedefleri.
- **Durum:** ⬜ Beklemede

### T-073 · Embed yönetim arayüzü ve snippet üretici
- **Etiket:** web · embed
- **Bağımlılık:** T-072, T-059, T-069
- **Detay:** Admin'de widget yapılandırıcı (tür/kategori/hoca seçimi, tema renkleri, önizleme), kopyalanabilir snippet, **izinli alan adları** listesi (CORS/iframe `frame-ancestors`), kullanım notları.
- **Kabul:** Üretilen snippet kopyala-yapıştır ile örnek sitede çalışır; izinsiz alan adı engellenir.
- **Durum:** ⬜ Beklemede

### T-074 · Widget performans ve erişilebilirlik bütçesi
- **Etiket:** test · embed
- **Bağımlılık:** T-072, T-071
- **Detay:** CI'da bundle boyut denetimi (≤ 60 KB gzip), Lighthouse CI (LCP/CLS), axe-core, klavye/ekran okuyucu kontrol listesi.
- **Kabul:** Bütçe aşılırsa CI kırmızı olur.
- **Durum:** ⬜ Beklemede

### T-075 · Taşıma v1: üyelik ve kalan kredi içe aktarma
- **Etiket:** taşıma
- **Bağımlılık:** T-028, T-042, T-041
- **Detay:** Müşteri içe aktarmaya ek olarak: aktif üyelik (ürün eşleme, bitiş tarihi), kalan paket kredisi (ürün eşleme, kalan, bitiş), geçmiş rezervasyonlar (opsiyonel). Eşleme ekranı: kaynak ürün → hedef ürün. **Kuru çalıştırma** (eşleşen/eşleşmeyen/çift) + **fark raporu** (kaynak toplamları ↔ hedef: müşteri sayısı, toplam kalan kredi, aktif üyelik sayısı). İçe aktarılan haklar `source=import` ile ledger'a `grant` yazılır (gelir tanıma etkilemez — açılış bakiyesi hesabı); batch geri alınabilir. Hazır şablonlar: genel şablon + sık kullanılan sistemlerin dışa aktarım biçimleri (kullanıcının kendi dışa aktardığı CSV'ler).
- **Kabul:** Fark raporu sıfır fark gösterir; batch geri alma ledger'ı bozmaz (Epic 8).
- **Durum:** ⬜ Beklemede

### T-076 · Tam veri dışa aktarma
- **Etiket:** taşınabilirlik
- **Bağımlılık:** T-045, T-056, T-015
- **Detay:** Sahip tek tıkla tüm veriyi alır: müşteriler, ürünler, satın almalar, haklar, rezervasyonlar, ledger, ödemeler, seanslar — CSV (+ JSON) ZIP'i. Arka plan job'ı + e-posta ile imzalı, süreli indirme bağlantısı. Audit'lenir; yalnızca sahip yapar.
- **Kabul:** Dışa aktarılan toplamlar ekran raporlarıyla eşleşir; bağlantı süresi dolunca erişilemez.
- **Durum:** ⬜ Beklemede

### T-077 · Status sayfası v0 ve sağlık kontrolleri
- **Etiket:** operasyon · güvenilirlik
- **Bağımlılık:** T-017, T-012
- **Detay:** Bileşen sağlık denetimleri (API, DB, Redis, kuyruk gecikmesi, e-posta, ödeme sağlayıcı erişimi), herkese açık statik/hafif status sayfası (bileşen bazlı durum + olay geçmişi), olay yayınlama aracı (manuel). Ödeme ve bildirim bileşenleri ayrı izlenir (Epic 7).
- **Kabul:** Bileşen düşürülünce status sayfası güncellenir; olay geçmişi tutulur.
- **Durum:** ⬜ Beklemede

### T-078 · Güvenlik sertleştirme
- **Etiket:** güvenlik
- **Bağımlılık:** T-021, T-069, T-071
- **Detay:** Güvenlik başlıkları (CSP, HSTS, X-Content-Type…), CORS sıkılaştırma, rate limit ayarları (login, public, kayıt), CSRF stratejisi (çerez kullanan uçlar), girdi doğrulama taraması, dosya yükleme güvenliği, bağımlılık ve imaj taraması, sır rotasyonu prosedürü, OWASP ASVS L2 kontrol listesi, **RLS izolasyon testlerinin** tüm tablolara kapsaması, temel sızma testi (iç) ve bulguların kapatılması.
- **Kabul:** ASVS kontrol listesi işaretli; kritik/yüksek bulgu yok.
- **Durum:** ⬜ Beklemede

### T-079 · Yasal sayfalar, yardım içeriği ve "yapamadıklarımız"
- **Etiket:** uyum · içerik
- **Bağımlılık:** T-029, T-071
- **Detay:** Kullanım şartları, gizlilik politikası, KVKK aydınlatma metni şablonu (stüdyonun kendi metnini ekleyebileceği alan), çerez bilgilendirmesi, iptal/iade politikası şablonları, mesafeli satış bilgilendirmesi şablonu (hukukçu onaylı), **"Yapamadıklarımız" sayfası** (kapsam dışı liste — Bölüm 5.2), kısa yardım merkezi (kurulum, program, ürün, rezervasyon, iade). Hukuki inceleme.
- **Kabul:** Hukukçu onayı; kayıt ve satın alma akışlarında yasal onay kutuları ve sürümleme çalışıyor.
- **Durum:** ⬜ Beklemede

### T-080 · E2E test paketi (Playwright) — ödeme öncesi çekirdek akışlar
- **Etiket:** test
- **Bağımlılık:** T-060, T-063, T-064, T-065, T-071, T-072, T-043
- **Detay:** Kritik akışlar: kayıt → kurulum → seri oluşturma → müşteri hosted sayfadan hesap açma → kasadan paket satışı → rezervasyon → hatırlatma/iptal/geç iptal → bekleme listesi → check-in/no-show → rapor. Çoklu tarayıcı (Chromium + WebKit), CI'da kararlı çalışma (flaky yönetimi), test verisi kurulum/söküm yardımcıları, maskelenmiş veri politikası.
- **Kabul:** Paket CI'da yeşil ve < 15 dk; kritik akış başına en az bir test.
- **Durum:** ⬜ Beklemede

### T-081 · Yedekten geri yükleme tatbikatı
- **Etiket:** operasyon
- **Bağımlılık:** T-017, T-080
- **Detay:** Staging yedeğinden yeni ortama geri yükleme, PITR ile belirli ana dönme, RTO/RPO ölçümü, runbook yazımı ve ekip tatbikatı; geri yükleme sonrası ledger tutarlılık denetimi.
- **Kabul:** RTO ≤ 1 saat, RPO ≤ 5 dk ölçümü belgelenmiş; runbook gözden geçirilmiş.
- **Durum:** ⬜ Beklemede

### T-082 · iyzico hesap, sandbox ve fon akışı kararı (spike)
- **Etiket:** ödeme · hukuk
- **Bağımlılık:** T-001, T-042
- **Detay:** iyzico sandbox hesabı, test kartları, API anahtarları ve imza yönteminin (HMAC tabanlı kimlik doğrulama başlığı) çalışan örneği. **Karar belgesi:** (A) pazaryeri/alt üye işyeri modeli ve (B) stüdyo başına kendi üye işyeri hesabı — onay süreci, stüdyo KYC yükü (şahıs/şirket, IBAN, vergi bilgileri), komisyon, hakediş/mutabakat yapısı, iade ve itiraz (chargeback) sorumluluğu, platformun "fon tutmama" hedefine uyumu. Checkout Form, saklı kart, taksit, iptal/iade, webhook (imza doğrulama), abonelik ürünü için **sandbox'ta uçtan uca küçük denemeler**; bulgular `docs/payments/iyzico.md` olarak yazılır. Hukuki görüş (ödeme hizmetleri mevzuatı, mesafeli satış, KVKK işleyici sözleşmesi).
- **Kabul:** Onaylı fon akışı kararı; sandbox'ta başarılı/başarısız/3DS/iade/iptal örnekleri çalışıyor; açık riskler listelenmiş (özellikle T-092 için).
- **Durum:** ⬜ Beklemede

### T-083 · PaymentProvider arayüzü ve iyzico istemcisi
- **Etiket:** ödeme
- **Bağımlılık:** T-082, T-008, T-009
- **Detay:** `PaymentProvider` arayüzü: `initializeCheckout`, `retrieveCheckoutResult`, `retrievePayment`, `cancel`, `refund`, `chargeStoredCard`, `listStoredCards`, `deleteCard`, `parseWebhook`, `fetchSettlement`. iyzico adaptörü: HTTP istemcisi, kimlik doğrulama başlığı, zaman aşımı/yeniden deneme politikası (**yazan çağrılar yalnızca idempotent anahtarla** yeniden denenir), hata normalizasyonu (kart reddi, yetersiz bakiye, 3DS başarısız, sağlayıcı hatası → kendi hata kodlarımız), istek/yanıt loglama (**kart verisi/PII maskeli**), sağlayıcı sandbox/üretim yapılandırması, kontrat testleri (kaydedilmiş yanıtlarla). `PaymentAccount` soyutlaması (A/B modelini destekler).
- **Kabul:** Adaptör kontrat testlerinden geçer; ağ hatasında çift tahsilat oluşmaz (idempotency testi).
- **Durum:** ⬜ Beklemede

### T-084 · Payment domain, durum makinesi ve ledger entegrasyonu
- **Etiket:** ödeme · ledger
- **Bağımlılık:** T-083, T-040, T-042
- **Detay:** `orders`, `payments`, `payment_attempts`, `refunds`, `payment_events` tabloları; durum makinesi (Bölüm 11.3); sağlayıcı `conversationId` = bizim benzersiz anahtarımız. Başarılı ödemede **tek işlemde**: payment durumu, `grantPurchase()` (T-042), money journal (`psp_receivable`/`deferred_revenue`/`vat_payable`), **PSP ücreti satırı** (`psp_fees`), outbox (makbuz). Başarısız/iptal ödeme yan etki bırakmaz. Ücret verisi sağlayıcı yanıtından/mutabakattan alınır, tahmin edilmez; kesin ücret gelmeden önce "tahmini" işaretlenir ve mutabakatta kesinleşir.
- **Kabul:** Aynı ödeme sonucu iki kez işlenirse tek `Purchase` ve tek journal oluşur; journal dengeli; brüt/PSP ücreti/net ayrı satır (Epic 5).
- **Durum:** ⬜ Beklemede

### T-085 · Stüdyo ödeme hesabı bağlama (onboarding)
- **Etiket:** ödeme · web
- **Bağımlılık:** T-082, T-083, T-021, T-066
- **İlişkili:** T-060 (sihirbaz 5. adım)
- **Detay:** Sahip için "Ödemeleri etkinleştir" akışı: T-082 kararına göre alt üye işyeri başvurusu (işletme türü, vergi/kimlik bilgileri, IBAN) ya da kendi iyzico anahtarlarını bağlama; başvuru durumu takibi (`not_started/pending/approved/rejected`), red nedeni gösterimi, hassas alanların şifreli saklanması (anahtarlar KMS/sır deposu). Sihirbazın 5. adımı bu akışa bağlanır. Ödeme hesabı **onaylanmadan** online satış kapalıdır (feature flag + UI bilgisi); kasa satışı etkilenmez.
- **Kabul:** Sandbox'ta başvuru → onay → ilk test ödemesi uçtan uca; kimlik/IBAN verileri loglarda yok.
- **Durum:** ⬜ Beklemede

### T-086 · Online satın alma (Checkout Form + 3D Secure)
- **Etiket:** ödeme · satış
- **Bağımlılık:** T-084, T-085, T-047, T-070, T-071, T-054
- **İlişkili:** T-052 (intro offer), T-035 (dönem kayıt penceresi)
- **Detay:** `POST /v1/me/checkout` (ürün veya drop-in rezervasyon niyeti) → sipariş + iyzico Checkout Form başlatma (Bölüm 11.2). Hosted sayfa ve embed'de form açılışı; callback uç noktası **sunucu tarafında Retrieve ile doğrular**; başarılıysa hak verilir ve (drop-in ise) bekleyen rezervasyon aynı işlemde tamamlanır; başarısızsa rezervasyon kapasitesi serbest bırakılır. **Kapasite tutma:** drop-in ödeme beklerken yer kısa süre (örn. 10 dk) `pending_payment` ile ayrılır, süre dolunca bırakılır. Ödeme geri dönüş sayfaları (başarılı/başarısız/iptal), makbuz e-postası, ürün satın alma önkoşulları (intro, dönem penceresi) denetimi. Bayrakla pilotlara kademeli açılır.
- **Kabul:** Başarılı, başarısız, 3DS terk, çift tıklama, callback gecikmesi senaryoları testli; hak yalnızca doğrulanmış ödemeden sonra verilir; yer kilidi sızıntısı yok.
- **Durum:** ⬜ Beklemede

### T-087 · Taksit desteği
- **Etiket:** ödeme
- **Bağımlılık:** T-086, T-041
- **Detay:** Ürün bazında `allow_installments` ve izinli taksit sayıları; checkout isteğinde taksit parametreleri; müşteriye taksit seçenekleri (kart BIN'ine göre iyzico formunda); **taksit farkı şeffaflığı:** müşterinin toplam ödeyeceği tutar ve stüdyonun alacağı net tutar ayrı hesaplanır/gösterilir; ledger'a brüt/PSP ücreti/net doğru yazılır. Taksitli satışın iadesinin davranışı (kalem bazında) test edilir.
- **Kabul:** Taksitli ödemede ledger toplamları iyzico işlem detayıyla eşleşir; iade taksitte doğru çalışır.
- **Durum:** ⬜ Beklemede

### T-088 · Kayıtlı kart
- **Etiket:** ödeme · müşteri
- **Bağımlılık:** T-086, T-070
- **Detay:** Checkout'ta "kartımı kaydet" onayı (açık rıza + aydınlatma), iyzico `cardUserKey/cardToken` referanslarının saklanması (kart verisi bizde yok), `/v1/me/cards` (liste: marka, son 4 hane, son kullanma; sil; varsayılan yap), **kart güncelleme akışı** (yeni kart ekle → eskisini değiştir; dunning bağlantısı için tek kullanımlık güvenli link). Kart silme/hesap silme, iyzico tarafındaki karşılığını da siler.
- **Kabul:** Kayıtlı kartla ikinci satın alma akışı çalışır; kart silinince tekrar tahsilatta kullanılamaz.
- **Durum:** ⬜ Beklemede

### T-089 · iyzico webhook alıcısı ve durum çekme job'ı
- **Etiket:** ödeme · güvenilirlik
- **Bağımlılık:** T-084, T-083, T-009
- **Detay:** `/v1/webhooks/iyzico`: **imza doğrulama**, ham gövde kaydı (`payment_events`), olay kimliği ile idempotent işleme, hızlı `200` (iş kuyruğa), bilinmeyen olayı güvenle yoksayma. Webhook kaçırma/sıra bozukluğuna karşı **zamanlı durum çekme job'ı**: `pending_3ds` ödemeleri ve belirli süredir güncellenmeyen ödemeleri sağlayıcıdan sorgulayıp kapatır. Tekrar oynatma (replay) aracı (admin/operasyon).
- **Kabul:** Aynı webhook 10 kez gelse tek etki; webhook hiç gelmese de job ödemeyi sonuçlandırır; hatalı imza reddedilir.
- **Durum:** ⬜ Beklemede

### T-090 · İade ve iptal (void)
- **Etiket:** ödeme · ledger
- **Bağımlılık:** T-084, T-089, T-043, T-044
- **Detay:** Tam/kısmi iade: aynı gün ise sağlayıcı **iptal**, sonrası **iade** (kalem bazlı dağıtım). Ledger'da ters kayıt (gelir tanınmış/tanınmamış kısım doğru hesaba), ilgili hakkın `cancelled`/azaltılması (kullanılmış kredi varsa uyarı + onay + politika), iade nedeni zorunlu, tutar eşiği üstünde yalnızca sahip onayı (tenant ayarı), müşteriye bilgilendirme e-postası. Admin ekranı (ödeme listesi → iade). Sağlayıcı reddederse tutarlı hata yönetimi (durum `refund_failed`, yeniden deneme).
- **Kabul:** Kısmi iade ledger toplamlarını doğru günceller; çift iade engellenir (idempotency + toplam iade ≤ ödenen); iade sonrası rapor tutarlı (T-057 kapsamı genişler).
- **Durum:** ⬜ Beklemede

### T-091 · Ödeme bağlantısı (payment link)
- **Etiket:** ödeme · satış
- **Bağımlılık:** T-086, T-043
- **İlişkili:** T-065 (kasa ekranı), T-093 (dunning kart güncelleme)
- **Detay:** Personel müşteri adına ürün için **tek kullanımlık, süreli bağlantı** üretir (e-posta/panoya kopyala); bağlantı hosted sayfada checkout'u önceden doldurur, ödeme sonunda hak otomatik verilir; iptal/süre dolumu; bağlantı durumları ve ödeme sonucu admin'de görünür. Güvenlik: tahmin edilemez belirteç, tek kullanım, müşteri kimliğine bağlı.
- **Kabul:** Bağlantı iki kez kullanılamaz; süresi dolmuş bağlantı ödeme açmaz.
- **Durum:** ⬜ Beklemede

### T-092 · Dönemli üyelik tahsilat motoru (spike + uygulama)
- **Etiket:** ödeme · üyelik
- **Bağımlılık:** T-088, T-089, T-042, T-040
- **Detay:** **Önce spike:** iyzico saklı kartla müşteri yokken tahsilat koşulları (3DS gereksinimi, yetki) ve iyzico Abonelik API'si; karar belgesi T-082'deki bulgularla birleştirilir. **Uygulama (varsayılan B):** `subscription_schedule` (müşteri, ürün, sonraki tahsilat tarihi, tutar, durum); günlük/dakikalık job vadesi gelenleri idempotent tahsil eder (`conversationId = subscription_id + period`); başarılı → yeni dönem entitlement'ı + journal + makbuz; başarısız → dunning (T-093). Üyeliği **iptal etme** (dönem sonunda bitir / hemen bitir), müşterinin self-servis iptali (`/v1/me`), fiyat değişikliği (yalnızca yeni dönemlere). Alternatif A seçilirse yalnızca adaptör ve webhook eşlemesi farklıdır; domain aynı kalır.
- **Kabul:** Aynı dönem için çift tahsilat oluşmaz (job çift çalışsa bile); dönem tarihleri (ay sonu, 29-31 günleri) testli; iptal sonrası yeni tahsilat yapılmaz.
- **Durum:** ⬜ Beklemede

### T-093 · Dunning (başarısız tahsilat yönetimi)
- **Etiket:** ödeme · üyelik
- **Bağımlılık:** T-092, T-054
- **Detay:** Yeniden deneme takvimi (tenant ayarı; varsayılan 1., 3., 5. gün), her denemede ve final öncesi e-posta, **kartı güncelle bağlantısı** (T-088), müşteri hesabında uyarı bandı, süre sonunda üyelik **askıya alma** (yeni rezervasyon engellenir, mevcut rezervasyonlar korunur/yönetici kararı), ödeme alınınca otomatik geri açma. Sebebe göre davranış (kalıcı ret → erken kart güncelle isteği). Yönetici panelinde "başarısız ödemeler" listesi.
- **Kabul:** Takvim aynen uygulanır; kart güncellenince bir sonraki deneme hemen yapılır; askıya alma/geri açma ledger ve haklarla tutarlı.
- **Durum:** ⬜ Beklemede

### T-094 · Geç iptal / no-show ücreti tahsilatı
- **Etiket:** ödeme · rezervasyon
- **Bağımlılık:** T-088, T-048, T-084
- **Detay:** `charge_fee` politikası olan geç iptal/no-show olaylarında kayıtlı karttan otomatik tahsilat (idempotent anahtar: `booking_id + event`), başarısızsa `receivable_customer` borcu + resepsiyon uyarısı + müşteri bildirimi; ücret affı (T-048 ile) sonrası **iade/iptal**; borçlu müşterinin yeni rezervasyonunda uyarı/engel ayarı (varsayılan uyarı).
- **Kabul:** Aynı no-show iki kez ücretlendirilmez; af ledger'da ters kayıtla görünür.
- **Durum:** ⬜ Beklemede

### T-095 · Günlük mutabakat (reconciliation)
- **Etiket:** ödeme · güvenilirlik
- **Bağımlılık:** T-084, T-089, T-040
- **Detay:** Günlük job: önceki günün iyzico işlem/hakediş verisini çek → bizim `payment`/`refund`/ledger ile satır satır eşleştir → farklar: sağlayıcıda olup bizde olmayan, bizde olup sağlayıcıda olmayan, tutar/ücret farkı, durum farkı. Kesinleşen PSP ücretlerini ledger'a işle (tahmini → kesin). Sonuç `reconciliation_runs` + `reconciliation_items` tabloları; fark varsa sahibe uyarı e-postası + operasyon alarmı; admin ekranı (eşleşti/fark var). Otomatik düzeltme **yapılmaz**; düzeltme ters kayıtla elle (neden + audit).
- **Kabul:** Yapay uyuşmazlık (silinmiş test ödemesi) fark olarak raporlanır; tüm eşleşen günlerde "0 fark" raporu üretir (Epic 5).
- **Durum:** ⬜ Beklemede

### T-096 · Ücret şeffaflığı (ödeme detay ve raporlar)
- **Etiket:** ödeme · raporlama
- **Bağımlılık:** T-084, T-095, T-056, T-067
- **Detay:** Ödeme detayı ekranı: **brüt · PSP ücreti · (varsa) platform ücreti · net** ayrı satır; taksit farkı; iade; mutabakat durumu. Rapor/dashboard'a "ödenen toplam ücret" ve net kazanç; basit **ücret hesaplayıcı** ("X TL satışta stüdyoya kalan"), ayar ekranında açıklama metni. Kesinleşmemiş ücretler "tahmini" etiketli.
- **Kabul:** Ekranda gösterilen ücret tutarları ledger ile birebir; her ücret satırının açıklaması var (Epic 5 hikâyesi).
- **Durum:** ⬜ Beklemede

### T-097 · Ödeme güvenliği ve canlıya alma kontrol listesi
- **Etiket:** ödeme · güvenlik · uyum
- **Bağımlılık:** T-086, T-088, T-092, T-089
- **Detay:** PCI SAQ-A doğrulaması (kart verisi hiçbir log/DB/istek gövdesinde yok — otomatik tarama + manuel inceleme), sır yönetimi (API anahtarları, rotasyon), webhook uç noktası saldırı yüzeyi (imza, boyut sınırı, rate limit), callback manipülasyonu testleri (tutar/ürün değiştirme), iyzico **canlıya alma kontrol listesi** (üretim anahtarları, callback/webhook URL'leri, gerçek düşük tutarlı canlı test işlemleri + iade), yasal metin/iptal-iade bilgilendirmesi gösterimi.
- **Kabul:** Kontrol listesi tamam; canlı düşük tutarlı satın alma + iade başarıyla yapılmış ve ledger/mutabakat tutarlı.
- **Durum:** ⬜ Beklemede

### T-098 · Ödeme e2e ve kaos testleri
- **Etiket:** test · ödeme
- **Bağımlılık:** T-090, T-091, T-093, T-094, T-095, T-096, T-097, T-080
- **Detay:** Sandbox ile e2e: başarılı/başarısız/3DS terk, taksit, kayıtlı kart, iade/iptal, ödeme linki, üyelik yenileme + dunning, geç iptal ücreti. **Kaos:** webhook çift/gecikmeli/sırasız, callback kaybı, sağlayıcı zaman aşımı, worker çökmesi, DB bağlantı kopması, eşzamanlı iade; her senaryoda çift tahsilat = 0, ledger dengeli, rapor = ledger. Playwright paketi (T-080) ödeme akışlarıyla genişler.
- **Kabul:** Kaos senaryolarının hepsi yeşil; Epic 5 ve Epic 7 kabul ölçütleri otomatik testte geçer.
- **Durum:** ⬜ Beklemede

### T-099 · E-posta sağlayıcısı entegrasyonu (üretim)
- **Etiket:** entegrasyon · bildirim
- **Bağımlılık:** T-016, T-054
- **Detay:** Sağlayıcı seçimi (Postmark / Amazon SES / Resend — teslim edilebilirlik, TR performansı, maliyet), alan adı doğrulaması (**SPF, DKIM, DMARC**), gönderim alt alan adı, bounce/şikâyet webhook'ları, **bastırma listesi** (suppression), oran sınırlama, sağlayıcı yedeklemesi için sürücü hazırlığı, tenant "gönderen adı" (adres sabit, ad stüdyo adı). Gönderim metrikleri ve alarm.
- **Kabul:** Üretim alan adından test e-postaları spam'e düşmez (Gmail/Outlook/Yandex); bounce'lar bastırma listesine yazılır.
- **Durum:** ⬜ Beklemede

### T-100 · Nesne depolama (üretim) ve CDN
- **Etiket:** entegrasyon
- **Bağımlılık:** T-015, T-072
- **Detay:** Üretim S3 uyumlu depolama (bucket politikaları, şifreleme, yaşam döngüsü), görsel CDN'i, widget bundle'ının sürümlü CDN dağıtımı (uzun önbellek + sürüm yolu), imzalı URL süreleri, yedekleme/çapraz bölge kararı, erişim günlükleri.
- **Kabul:** Logo/hoca fotoğrafı CDN'den servis edilir; widget yeni sürümü eski sayfaları bozmaz.
- **Durum:** ⬜ Beklemede

### T-101 · Üretim izleme, alarm ve çağrı düzeni
- **Etiket:** entegrasyon · operasyon
- **Bağımlılık:** T-012, T-077
- **Detay:** Üretim Sentry/telemetri panoları, alarm kuralları (5xx oranı, p95, kuyruk gecikmesi, **ödeme başarı oranı düşüşü**, webhook hata oranı, mutabakat farkı, tutarlılık job'ı alarmı), alarm kanalı (Slack/e-posta/SMS) ve çağrı (on-call) rotası, harici uptime denetimi, olay yönetimi şablonu (P1 tanımı: ödeme/rezervasyon).
- **Kabul:** Her alarm için runbook bağlantısı; yapay alarm tatbikatı.
- **Durum:** ⬜ Beklemede

### T-102 · Üretim ortamı, alan adı ve TLS
- **Etiket:** entegrasyon · altyapı
- **Bağımlılık:** T-017, T-078, T-081, T-099, T-100
- **Detay:** Terraform ile üretim ortamı; ana alan adı + **alt alan adı yönlendirmesi** (`{slug}.…` hosted sayfa), wildcard TLS, WAF/DDoS temel koruma, ortam ayrımı (staging↔üretim sır/veri izolasyonu), otomatik ölçekleme/limitler, **sıfır kesinti dağıtım** (migration uyumluluğu), geri alma prosedürü, iyzico üretim callback/webhook URL'lerinin yapılandırılması, DB/Redis yedekleri ve alarmları.
- **Kabul:** Üretimde sağlık kontrolleri yeşil; örnek tenant uçtan uca çalışır; geri alma tatbik edilmiş.
- **Durum:** ⬜ Beklemede

### T-103 · Push bildirim altyapısı (backend + FCM/APNs)
- **Etiket:** entegrasyon · bildirim
- **Bağımlılık:** T-055, T-070
- **Detay:** Firebase projesi (FCM; iOS için APNs anahtarı), `device_tokens` kaydı (`/v1/me/devices`: kayıt/silme, platform, uygulama sürümü, tenant ilişkisi), `PushChannel` (T-055'teki `NotificationChannel` arayüzü): hatırlatma, terfi, seans iptali/hoca değişimi, ödeme başarısız; geçersiz token temizliği, tercih kontrolü, tenant bazlı sessiz saat (varsayılan yok), push içeriğinde PII minimizasyonu, derin bağlantı yükleri (ör. `booking/{id}`).
- **Kabul:** Test cihazına tüm bildirim türleri ulaşır; kapatılan tercih push'u durdurur; hesap silinince token'lar silinir.
- **Durum:** ⬜ Beklemede

### T-104 · Flutter proje iskeleti
- **Etiket:** mobil
- **Bağımlılık:** T-002, T-004, T-070
- **Detay:** `apps/mobile`: Flutter (kararlı kanal), feature-first klasör yapısı, Riverpod, go_router (derin bağlantı: `studio/{slug}`, `booking/{id}`, ödeme dönüşü), dio + **OpenAPI'den üretilen Dart istemcisi** (CI'da yeniden üretim + fark kontrolü), freezed/json_serializable, ARB tabanlı i18n (`tr`), flavor'lar (`dev/staging/prod` — ayrı API adresi, uygulama kimliği, Firebase projesi), `analysis_options` sıkı lint, ortam yapılandırması, hata yakalama zinciri, günlükleme, CI işi (analyze + test + derleme).
- **Kabul:** Üç flavor'da simülatörde açılır; API istemcisi üretim betiği tek komut; CI yeşil.
- **Durum:** ⬜ Beklemede

### T-105 · Flutter tasarım sistemi ve tema
- **Etiket:** mobil · tasarım
- **Bağımlılık:** T-104, T-059
- **Detay:** Web tasarım token'larıyla uyumlu (renk, tipografi, aralık, köşe, gölge), açık/koyu tema, **stüdyo marka rengi/logo ile dinamik tema** (`public` API'den), temel bileşenler (düğme, girdi, kart, liste öğesi, rozet, boş durum, hata, yükleniyor/iskelet, alt sayfa, tarih şeridi), erişilebilirlik (dokunma alanı ≥ 44pt, kontrast, metin ölçeklendirme), ikon seti.
- **Kabul:** Bileşen vitrini ekranı (golden testli); marka rengi değişince tema doğru güncellenir; metin ölçeği %200'de taşma yok.
- **Durum:** ⬜ Beklemede

### T-106 · Flutter kimlik doğrulama
- **Etiket:** mobil · kimlik
- **Bağımlılık:** T-104, T-019, T-070
- **Detay:** Kayıt (KVKK aydınlatma onayı), e-posta doğrulama (derin bağlantı), giriş, parola sıfırlama, çıkış; token'lar `flutter_secure_storage`'da, **sessiz yenileme** (401 → refresh → tekrar), yenileme başarısızsa güvenli çıkış; hız sınırı/hata mesajları; biyometrik kilit (opsiyonel, yerel). Çoklu cihaz oturum yönetimi arayüzü yok (MVP).
- **Kabul:** Süresi dolan token kullanıcıya hissettirmeden yenilenir; refresh yeniden kullanım tespiti uygulamayı güvenle çıkışa yönlendirir.
- **Durum:** ⬜ Beklemede

### T-107 · Stüdyoya bağlanma ve çoklu stüdyo seçici
- **Etiket:** mobil
- **Bağımlılık:** T-106, T-069, T-070
- **Detay:** İlk açılışta "stüdyonu bağla": **QR okuma**, davet/derin bağlantı (`https://…/s/{slug}`; iOS Universal Links / Android App Links), slug ile arama. Bağlı stüdyoların listesi ve seçici (ayrıldığı stüdyoyu **listeden kaldırabilme**), stüdyo teması uygulaması, başka işletme keşfi **yok**. Hosted sayfa/admin'de QR ve bağlantı üreten ekran (T-066/T-071'e küçük ek).
- **Kabul:** QR ile bağlanıp aynı hesapla web'de aynı veriyi görür (tek hesap); stüdyo ayrılınca listeden kalkar, geçmiş veri stüdyoda korunur.
- **Durum:** ⬜ Beklemede

### T-108 · Flutter program ve ders detayı
- **Etiket:** mobil
- **Bağımlılık:** T-107, T-069, T-105
- **Detay:** Gün şeridi + liste, hafta görünümü, filtreler (tür/kategori/hoca/lokasyon), ders detayı (hoca, açıklama, süre, doluluk seviyesi, iptal politikası özeti), randevu slot seçimi, boş durumlar, **çevrimdışı önbellek** (son program salt okunur), yenile-çek (pull-to-refresh), sayfalama.
- **Kabul:** 4 haftalık program akıcı kayar; çevrimdışıyken önbellekten açılır ve "çevrimdışı" uyarısı gösterir.
- **Durum:** ⬜ Beklemede

### T-109 · Flutter rezervasyon akışları
- **Etiket:** mobil · rezervasyon
- **Bağımlılık:** T-108, T-070, T-048, T-049
- **Detay:** Rezervasyon yap (hak seçimi sonucu "şu hakkınızdan düşecek"), bekleme listesine gir/çık, iptal (**önizleme**: "şimdi iptal ederseniz 1 krediniz yanar"), takvime ekle (cihaz takvimi), idempotent istek anahtarı (çift dokunma), hata durumlarının anlaşılır gösterimi (hak yok, dolu, pencere kapalı, limit doldu), hak yoksa ürün satın alma yönlendirmesi (T-111).
- **Kabul:** Çift dokunma tek rezervasyon üretir; her hata kodunun kullanıcı metni var.
- **Durum:** ⬜ Beklemede

### T-110 · Flutter "Hesabım": rezervasyonlar, haklar, geçmiş
- **Etiket:** mobil
- **Bağımlılık:** T-109, T-045, T-070
- **Detay:** Yaklaşan/geçmiş rezervasyonlar, bekleme listesi durumum, haklarım (kalan kredi, bitiş, üyelik durumu/dönemi), **hak geçmişi** (hangi ders hangi hakkı kullandı), satın alma geçmişi ve makbuzlar, üyelik iptali (T-092 self-servis uçları), yenile ve boş durumlar.
- **Kabul:** Bakiye ve geçmiş API/ledger ile birebir; üyelik iptali sonucu net gösterilir.
- **Durum:** ⬜ Beklemede

### T-111 · Flutter satın alma (iyzico) ve kayıtlı kartlar
- **Etiket:** mobil · ödeme
- **Bağımlılık:** T-110, T-086, T-088, T-087
- **Detay:** Ürün listesi/detayı, taksit seçenekleri bilgisi, `POST /v1/me/checkout` → iyzico Checkout Form'u **WebView**'da açma (kart verisi uygulamaya girmez; ekran görüntüsü/kayıt korumaları), 3DS dahil akış, callback sonrası backend'in döndürdüğü sayfa → **derin bağlantıyla uygulamaya dönüş** (`studioos://payment-result?order=…`; Universal/App Link), sonuç ekranı (başarılı/başarısız/iptal/beklemede), "beklemede" durumunda **sunucudan durum yoklama** (webhook gecikmesi), kayıtlı kartlar ekranı (liste/sil/varsayılan), dunning "kartı güncelle" derin bağlantısı, drop-in rezervasyon + ödeme akışı, makbuz görüntüleme.
- **Kabul:** Test kartıyla satın alma → hak anında görünür; uygulamadan çıkma/arka plana atma durumunda durum doğru toparlanır; çift ödeme oluşmaz.
- **Durum:** ⬜ Beklemede

### T-112 · Flutter profil, ayarlar ve hesap silme
- **Etiket:** mobil · uyum
- **Bağımlılık:** T-106, T-029, T-055
- **Detay:** Profil düzenleme, bildirim tercihleri (T-055), dil, yasal metinler (T-079), veri dışa aktarma isteği, **uygulama içinden hesap silme** (App Store gereği; T-029 akışı; bekleyen üyelik/borç uyarıları), çıkış, uygulama sürümü ve destek e-postası/yardım bağlantısı.
- **Kabul:** Hesap silme uçtan uca çalışır; silinen hesap giriş yapamaz ve kişisel veri anonimleşir.
- **Durum:** ⬜ Beklemede

### T-113 · Flutter push bildirim istemcisi
- **Etiket:** mobil · bildirim
- **Bağımlılık:** T-103, T-112
- **Detay:** İzin isteme (bağlamsal, ilk rezervasyondan sonra), FCM token kaydı/yenileme/silme (çıkışta), ön plan/arka plan/kapalı durumlarda gösterim, bildirime dokununca **derin bağlantı** (rezervasyon, ödeme güncelleme), kanal/ses ayarları (Android), iOS APNs yapılandırması, tercih eşlemesi.
- **Kabul:** T-103'teki tüm bildirim türleri iki platformda test cihazında doğru ekrana götürür.
- **Durum:** ⬜ Beklemede

### T-114 · Mobil erişilebilirlik, hata ve çevrimdışı durumları
- **Etiket:** mobil · kalite
- **Bağımlılık:** T-109, T-110, T-111, T-112, T-113
- **Detay:** VoiceOver/TalkBack turu, dinamik yazı boyutu, kontrast, odak sırası; ağ yok/yavaş ağ/sunucu hatası/bakım modu ekranları; zorunlu **minimum sürüm** (kırıcı API değişikliğinde güncelle uyarısı — API `X-App-Version` kontrolü); yeniden deneme davranışı (yazan istekler yalnızca idempotent), boş durum metinleri, ilk açılış ve izin akışları.
- **Kabul:** Kritik akışlar ekran okuyucuyla tamamlanabilir; ağ kopmasında veri bozulmaz.
- **Durum:** ⬜ Beklemede

### T-115 · Mobil test paketi
- **Etiket:** mobil · test
- **Bağımlılık:** T-114
- **Detay:** Birim (repository, durum yönetimi), widget ve golden testleri, entegrasyon testleri (Patrol/integration_test): kayıt → stüdyo bağla → program → rezervasyon → iptal → satın alma (sandbox iyzico) → hesabım. API sözleşme testi (üretilen istemci ↔ gerçek API'nin staging sürümü). CI'da çalışır; cihaz çiftliği veya emülatör matrisi (en az iki iOS ve üç Android sürümü).
- **Kabul:** Kritik akışlar otomatik testte yeşil; sözleşme uyuşmazlığı CI'yi kırar.
- **Durum:** ⬜ Beklemede

### T-116 · Mobil çökme raporlama ve analitik
- **Etiket:** mobil · operasyon
- **Bağımlılık:** T-104, T-101
- **Detay:** Crashlytics veya Sentry (karar T-101 ile uyumlu), PII'siz kullanıcı kimliği, sürüm/flavor etiketleri, ANR/çökme alarmları, temel ürün analitiği (aktivasyon: kayıt → stüdyo bağla → ilk rezervasyon → ilk satın alma), analitik rıza gereksinimi (KVKK/mağaza beyanlarıyla uyumlu).
- **Kabul:** Yapay çökme panoda görünür; analitik olayları şema ile uyumlu.
- **Durum:** ⬜ Beklemede

### T-117 · Mağaza hazırlığı ve politika uyumu
- **Etiket:** mobil · uyum
- **Bağımlılık:** T-115, T-116, T-079, T-112
- **Detay:** Geliştirici hesapları (Apple/Google), bundle/package kimlikleri, imzalama ve gizli anahtar yönetimi (CI'da), ikon/açılış ekranı, mağaza listesi (TR), ekran görüntüleri, gizlilik beyanları (Apple App Privacy, Google Data Safety), **ödeme politikası incelemesi** (gerçek dünyada tüketilen hizmetin harici ödemesi — Apple 3.1.x ve Google Play ödeme politikası **güncel metinden teyit**, red riskine karşı gerekçe notu), inceleme için test hesabı + sandbox ödeme talimatı, hesap silme ve destek bağlantıları, yaş derecelendirme, evrensel bağlantı dosyaları (`apple-app-site-association`, `assetlinks.json`).
- **Kabul:** Her iki mağaza için gönderime hazır paket; politika kontrol listesi onaylı.
- **Durum:** ⬜ Beklemede

### T-118 · Beta dağıtımı (TestFlight / Play Dahili Test)
- **Etiket:** mobil · operasyon
- **Bağımlılık:** T-117
- **Detay:** TestFlight ve Play iç/kapalı test kanalları, pilot stüdyo çalışanlarının ve gönüllü müşterilerin davet edilmesi, geri bildirim kanalı, sürüm notları, **kademeli yayın** planı, mağaza inceleme geri bildirimlerinin giderilmesi, mağaza yayını (pilot stüdyonun müşterilerine açılış).
- **Kabul:** Her iki platformda beta dağıtılmış; mağaza incelemesi geçilmiş ve uygulama yayında.
- **Durum:** ⬜ Beklemede

### T-119 · Pilot stüdyoları canlıya alma
- **Etiket:** operasyon · taşıma
- **Bağımlılık:** T-098, T-102, T-118, T-075, T-076, T-101
- **Detay:** Her pilot için: hesap/tenant kurulumu, iyzico alt üye işyeri onayı (T-085), mevcut veriyi içe aktarma **provası** (kuru çalıştırma + fark raporu, sıfır fark onayı), politikaların ve ürünlerin kurulumu, hoca/resepsiyon eğitimi (kısa video + canlı oturum), canlıya alma kontrol listesi (e-posta alan adı, hosted sayfa bağlantısı, QR/mobil bağlantı, ilk gerçek satış + iade denemesi), **geri dönüş planı** (eski sisteme dönüş), destek kanalı (P1 tanımı ve ilk yanıt hedefi), hata/geri bildirim triyajı toplantı ritmi, kademeli bayrak açma (online satış, mobil).
- **Kabul:** Üç pilot stüdyo canlı; gerçek müşteriler web ve mobilden rezervasyon/satın alma yapabiliyor.
- **Durum:** ⬜ Beklemede

### T-120 · MVP kabul ölçümü ve kapanış
- **Etiket:** yönetim · kalite
- **Bağımlılık:** T-119
- **Detay:** Pilotlarda **≥ 4 hafta** ölçüm: ödeme hata oranı (< %1; PSP kaynaklı olmayan), overbooking (0), ilk rezervasyona kadar süre (< 15 dk, kurulum kaydı verisinden), mutabakat farkı (0 veya açıklanmış), rapor ↔ ledger tutarlılığı, API p95, uptime, açık P1/P2 hata sayısı, destek yanıt süresi, NPS ön ölçümü. Bulguların raporu, **MVP sonrası backlog** (kapsam dışı listesinden öncelik sırası: inbox/WhatsApp, sequences, public API/webhook, hediye kartı/indirim, ödeme planları, dondurma, AI) ve `momence.md` planının güncellenmesi.
- **Kabul:** Bölüm 13 tablosundaki her ölçüt işaretlenmiş ve kanıtlanmış; MVP kabul toplantısı kararı (devam / düzeltme).
- **Durum:** ⬜ Beklemede

---

## 16. Bağımlılık özeti ve kritik yol

### 16.1 Kritik yol (en uzun bağımlılık zinciri)

Aşağıdaki zincirdeki bir görev gecikirse MVP tarihi doğrudan kayar. Zincirin uzunluğu: **37 görev**.

`T-001 → T-002 → T-003 → T-005 → T-006 → T-007 → T-010 → T-018 → T-019 → T-022 → T-023 → T-024 → T-030 → T-031 → T-033 → T-035 → T-041 → T-042 → T-044 → T-046 → T-047 → T-048 → T-049 → T-070 → T-104 → T-106 → T-107 → T-108 → T-109 → T-110 → T-111 → T-114 → T-115 → T-117 → T-118 → T-119 → T-120`

| Sıra | Görev | Başlık |
|---:|---|---|
| 1 | T-001 | Karar kayıtları, marka adı ve proje kuralları |
| 2 | T-002 | Mono-repo iskeleti |
| 3 | T-003 | Yerel geliştirme ortamı |
| 4 | T-005 | API iskeleti (NestJS modüler monolit) |
| 5 | T-006 | Veritabanı katmanı ve konvansiyonlar |
| 6 | T-007 | Çok kiracılılık ve RLS |
| 7 | T-010 | Audit log altyapısı |
| 8 | T-018 | Kimlik modeli ve oturum altyapısı |
| 9 | T-019 | Kimlik doğrulama uçları |
| 10 | T-022 | Tenant kaydı ve slug |
| 11 | T-023 | İşletme profili ve ayarlar |
| 12 | T-024 | Lokasyon ve oda yönetimi |
| 13 | T-030 | Offering ve kategori modeli |
| 14 | T-031 | RRULE motoru ve seans üretimi |
| 15 | T-033 | Görünürlük ufku ve yayınlama job'ı |
| 16 | T-035 | Dönem (Term) modeli — temel |
| 17 | T-041 | Ürün (Product) modeli ve yönetimi |
| 18 | T-042 | Satın alma (Purchase) ve hak (Entitlement) modeli |
| 19 | T-044 | Hak seçimi ve kredi tüketim motoru |
| 20 | T-046 | Booking domain ve durum makinesi |
| 21 | T-047 | Rezervasyon oluşturma (kapasite, hak, idempotency) |
| 22 | T-048 | İptal ve geç iptal politikası motoru |
| 23 | T-049 | Bekleme listesi |
| 24 | T-070 | Müşteri hesap akışları (`/v1/me`) |
| 25 | T-104 | Flutter proje iskeleti |
| 26 | T-106 | Flutter kimlik doğrulama |
| 27 | T-107 | Stüdyoya bağlanma ve çoklu stüdyo seçici |
| 28 | T-108 | Flutter program ve ders detayı |
| 29 | T-109 | Flutter rezervasyon akışları |
| 30 | T-110 | Flutter "Hesabım": rezervasyonlar, haklar, geçmiş |
| 31 | T-111 | Flutter satın alma (iyzico) ve kayıtlı kartlar |
| 32 | T-114 | Mobil erişilebilirlik, hata ve çevrimdışı durumları |
| 33 | T-115 | Mobil test paketi |
| 34 | T-117 | Mağaza hazırlığı ve politika uyumu |
| 35 | T-118 | Beta dağıtımı (TestFlight / Play Dahili Test) |
| 36 | T-119 | Pilot stüdyoları canlıya alma |
| 37 | T-120 | MVP kabul ölçümü ve kapanış |

### 16.2 Paralel çalışılabilecek iş kolları

Bağımlılıklar izin verdiği ölçüde ekip aşağıdaki kollarda **eşzamanlı** ilerleyebilir (sıralama listesi "tek yürütme sırası"dır; kişi sayısı arttıkça kollar paralelleşir).

| İş kolu | Görevler | Not |
|---|---|---|
| **Platform ve altyapı** | T-001…T-017, T-077, T-078, T-081, T-101, T-102 | Diğer tüm kolların önkoşulu (T-001…T-009 hepsini bekletir) |
| **Kimlik ve işletme** | T-018…T-025 | Çekirdek kolların kapısı |
| **Müşteri (CRM) ve KVKK** | T-026…T-029, T-075, T-076 | T-028 ve T-075 aynı içe aktarma altyapısını paylaşır |
| **Zamanlama** | T-030…T-039 | T-038 rezervasyon portlarına dayanır |
| **Ledger, ürün, hak** | T-040…T-045 | Rezervasyon (T-047) ve ödeme (T-084) bu kola bağlıdır — **en riskli kol** |
| **Rezervasyon** | T-046…T-053 | T-053 test kapısı: geçmeden ödeme akışları açılmaz |
| **Bildirim ve raporlama** | T-054…T-058 | Ledger oturduktan sonra |
| **Admin web** | T-059…T-068 | API uçları hazır oldukça ekran ekran ilerler |
| **Hosted sayfa ve embed** | T-069…T-074 | T-070 müşteri API'sine bağlı |
| **Ödeme (iyzico)** | T-082…T-098 | **T-082 (başvuru/spike) T-001 ile birlikte erkenden başlatılmalı**, kodlama T-042 sonrası |
| **Entegrasyonlar** | T-099…T-103 | T-099 ve T-100 erken başlatılabilir (alan adı doğrulaması bekleme gerektirir) |
| **Mobil (Flutter)** | T-104…T-118 | İskelet ve tasarım sistemi T-070/T-059 sonrası başlayabilir; satın alma (T-111) ödeme kolunu bekler |
| **Yayın** | T-119, T-120 | Tüm kolların birleşimi |

### 16.3 Kritik bağlantı noktaları (gözden kaçmasın)

| İlişki | Neden önemli |
|---|---|
| **T-040 → T-042 → T-044 → T-047** | Rezervasyon, hak seçimi ve ledger birbirine kilitlidir; ledger sonradan değişirse rezervasyon ve rapor yeniden yazılır. Önce şemayı dondur. |
| **T-047 ↔ T-086** | Drop-in satın alma, rezervasyonla ödemeyi birleştirir; `pending_payment` yer kilidi iki görevin ortak sözleşmesidir. |
| **T-042 ↔ T-084** | Online ödeme sonucu, kasa satışıyla **aynı** `grantPurchase()` yolundan hak üretmelidir; iki ayrı satın alma yolu yazılmaz. |
| **T-048 ↔ T-094** | Geç iptal politikası T-048'de kurulur; ücret tahsilatı kayıtlı kart gelince T-094'te bağlanır. |
| **T-056 ↔ T-057 ↔ T-090/T-096** | Rapor ledger'dan türediği için iade ve ücret hareketleri geldiğinde rapor tutarlılık testi (T-057) genişletilmelidir. |
| **T-069/T-070 → T-104** | Mobil istemci OpenAPI sözleşmesine dayanır; müşteri API'si dondurulmadan mobilde yeniden iş çıkar. |
| **T-092 ↔ T-082** | Saklı kartla tekrarlayan tahsilat kararı iyzico koşullarına bağlıdır; erken spike olmadan üyelik tasarımı riske girer. |
| **T-103 → T-113** | Push yalnızca backend + istemci birlikte bitince test edilebilir. |

### 16.4 Görev dizini (otomatik üretildi)

| ID | Görev | Bağımlılık |
|---|---|---|
| T-001 | Karar kayıtları, marka adı ve proje kuralları | — |
| T-002 | Mono-repo iskeleti | T-001 |
| T-003 | Yerel geliştirme ortamı | T-002 |
| T-004 | CI hattı | T-002, T-003 |
| T-005 | API iskeleti (NestJS modüler monolit) | T-002, T-003 |
| T-006 | Veritabanı katmanı ve konvansiyonlar | T-005 |
| T-007 | Çok kiracılılık ve RLS | T-006 |
| T-008 | Idempotency altyapısı | T-006, T-007 |
| T-009 | Transactional outbox ve kuyruk altyapısı | T-006, T-007 |
| T-010 | Audit log altyapısı | T-007, T-005 |
| T-011 | Yumuşak silme ve geri alma altyapısı | T-006, T-010 |
| T-012 | Gözlemlenebilirlik (temel) | T-005 |
| T-013 | Feature flag altyapısı | T-007 |
| T-014 | i18n, zaman ve para yardımcıları | T-005 |
| T-015 | Dosya depolama soyutlaması | T-005, T-003 |
| T-016 | E-posta soyutlaması ve şablon motoru | T-009, T-014 |
| T-017 | Staging ortamı ve dağıtım hattı | T-004, T-012 |
| T-018 | Kimlik modeli ve oturum altyapısı | T-007, T-010 |
| T-019 | Kimlik doğrulama uçları | T-018, T-016 |
| T-020 | Personel 2FA (TOTP) | T-019 |
| T-021 | RBAC (roller ve izinler) | T-018 |
| T-022 | Tenant kaydı ve slug | T-019, T-021 |
| T-023 | İşletme profili ve ayarlar | T-022, T-015 |
| T-024 | Lokasyon ve oda yönetimi | T-023 |
| T-025 | Personel daveti ve hoca profilleri | T-019, T-021, T-016 |
| T-026 | Müşteri (Customer) CRUD ve arama | T-021, T-011 |
| T-027 | Customer 360 görünümü (API) | T-026 |
| T-028 | Müşteri CSV içe aktarma | T-026, T-009, T-015 |
| T-029 | KVKK: rıza, dışa aktarma ve silme/anonimleştirme | T-026, T-019, T-011 |
| T-030 | Offering ve kategori modeli | T-024, T-021, T-011 |
| T-031 | RRULE motoru ve seans üretimi | T-030, T-014, T-009 |
| T-032 | Seri düzenleme (bu / bundan sonrası / tümü) ve etki önizlemesi | T-031, T-021 |
| T-033 | Görünürlük ufku ve yayınlama job'ı | T-031, T-023 |
| T-034 | Çakışma denetimi | T-031, T-024, T-025 |
| T-035 | Dönem (Term) modeli — temel | T-031, T-033 |
| T-036 | Şablonlar | T-030, T-031 |
| T-037 | Randevu (appointment): uygunluk ve slot hesabı | T-030, T-034, T-025 |
| T-038 | Seans iptali ve hoca değişimi | T-031, T-021 |
| T-039 | Zamanlama test kümesi (RRULE + DST + zaman dilimi) | T-031, T-032, T-037 |
| T-040 | Ledger tasarımı ve şeması | T-006, T-007, T-008, T-014 |
| T-041 | Ürün (Product) modeli ve yönetimi | T-030, T-035, T-040 |
| T-042 | Satın alma (Purchase) ve hak (Entitlement) modeli | T-041, T-040, T-026 |
| T-043 | Kasadan satış ve manuel düzeltme | T-042, T-021 |
| T-044 | Hak seçimi ve kredi tüketim motoru | T-042 |
| T-045 | Ledger okuma API'si ve bakiye | T-044, T-040 |
| T-046 | Booking domain ve durum makinesi | T-031, T-026, T-044 |
| T-047 | Rezervasyon oluşturma (kapasite, hak, idempotency) | T-046, T-044, T-008, T-033 |
| T-048 | İptal ve geç iptal politikası motoru | T-047, T-023 |
| T-049 | Bekleme listesi | T-047, T-048 |
| T-050 | Check-in ve no-show | T-047, T-048 |
| T-051 | Yönetici/resepsiyon rezervasyon yönetimi | T-047, T-048, T-050 |
| T-052 | Intro offer kuralı uygulaması | T-042, T-047 |
| T-053 | Rezervasyon eşzamanlılık ve yük testleri | T-049, T-050, T-051, T-052 |
| T-054 | Bildirim olayları ve e-posta şablonları | T-016, T-047, T-048, T-049, T-043 |
| T-055 | Hatırlatma job'ları, ICS ve bildirim tercihleri | T-054, T-033 |
| T-056 | Raporlar API'si | T-040, T-050, T-045 |
| T-057 | Rapor ↔ ledger tutarlılık testi | T-056 |
| T-058 | Dashboard KPI API'si | T-056 |
| T-059 | Admin web iskeleti ve tasarım sistemi | T-005, T-019, T-021 |
| T-060 | Kurulum sihirbazı ve sandbox örnek veri | T-059, T-023, T-024, T-036, T-041 |
| T-061 | Takvim ekranı | T-059, T-031, T-032, T-034 |
| T-062 | Offering, seri, dönem ve şablon ekranları | T-061, T-035, T-036, T-030 |
| T-063 | Seans detay ve katılımcı ekranları | T-061, T-050, T-051, T-049 |
| T-064 | Müşteri ekranları (liste, detay, 360, import) | T-059, T-026, T-027, T-028, T-045 |
| T-065 | Ürün ve kasa (manuel satış) ekranları | T-059, T-041, T-043 |
| T-066 | Ayarlar, personel, lokasyon/oda ekranları | T-059, T-023, T-024, T-025, T-020 |
| T-067 | Rapor ve dashboard ekranları | T-059, T-056, T-058 |
| T-068 | Audit log ve çöp kutusu ekranları | T-059, T-010, T-011 |
| T-069 | Public (müşteri yüzü) API | T-033, T-037, T-041, T-023, T-013 |
| T-070 | Müşteri hesap akışları (`/v1/me`) | T-019, T-047, T-048, T-049, T-045, T-069 |
| T-071 | Hosted rezervasyon sayfası | T-069, T-070, T-014 |
| T-072 | Embed widget'lar (Web Components) | T-069, T-070 |
| T-073 | Embed yönetim arayüzü ve snippet üretici | T-072, T-059, T-069 |
| T-074 | Widget performans ve erişilebilirlik bütçesi | T-072, T-071 |
| T-075 | Taşıma v1: üyelik ve kalan kredi içe aktarma | T-028, T-042, T-041 |
| T-076 | Tam veri dışa aktarma | T-045, T-056, T-015 |
| T-077 | Status sayfası v0 ve sağlık kontrolleri | T-017, T-012 |
| T-078 | Güvenlik sertleştirme | T-021, T-069, T-071 |
| T-079 | Yasal sayfalar, yardım içeriği ve "yapamadıklarımız" | T-029, T-071 |
| T-080 | E2E test paketi (Playwright) — ödeme öncesi çekirdek akışlar | T-060, T-063, T-064, T-065, T-071, T-072, T-043 |
| T-081 | Yedekten geri yükleme tatbikatı | T-017, T-080 |
| T-082 | iyzico hesap, sandbox ve fon akışı kararı (spike) | T-001, T-042 |
| T-083 | PaymentProvider arayüzü ve iyzico istemcisi | T-082, T-008, T-009 |
| T-084 | Payment domain, durum makinesi ve ledger entegrasyonu | T-083, T-040, T-042 |
| T-085 | Stüdyo ödeme hesabı bağlama (onboarding) | T-082, T-083, T-021, T-066 |
| T-086 | Online satın alma (Checkout Form + 3D Secure) | T-084, T-085, T-047, T-070, T-071, T-054 |
| T-087 | Taksit desteği | T-086, T-041 |
| T-088 | Kayıtlı kart | T-086, T-070 |
| T-089 | iyzico webhook alıcısı ve durum çekme job'ı | T-084, T-083, T-009 |
| T-090 | İade ve iptal (void) | T-084, T-089, T-043, T-044 |
| T-091 | Ödeme bağlantısı (payment link) | T-086, T-043 |
| T-092 | Dönemli üyelik tahsilat motoru (spike + uygulama) | T-088, T-089, T-042, T-040 |
| T-093 | Dunning (başarısız tahsilat yönetimi) | T-092, T-054 |
| T-094 | Geç iptal / no-show ücreti tahsilatı | T-088, T-048, T-084 |
| T-095 | Günlük mutabakat (reconciliation) | T-084, T-089, T-040 |
| T-096 | Ücret şeffaflığı (ödeme detay ve raporlar) | T-084, T-095, T-056, T-067 |
| T-097 | Ödeme güvenliği ve canlıya alma kontrol listesi | T-086, T-088, T-092, T-089 |
| T-098 | Ödeme e2e ve kaos testleri | T-090, T-091, T-093, T-094, T-095, T-096, T-097, T-080 |
| T-099 | E-posta sağlayıcısı entegrasyonu (üretim) | T-016, T-054 |
| T-100 | Nesne depolama (üretim) ve CDN | T-015, T-072 |
| T-101 | Üretim izleme, alarm ve çağrı düzeni | T-012, T-077 |
| T-102 | Üretim ortamı, alan adı ve TLS | T-017, T-078, T-081, T-099, T-100 |
| T-103 | Push bildirim altyapısı (backend + FCM/APNs) | T-055, T-070 |
| T-104 | Flutter proje iskeleti | T-002, T-004, T-070 |
| T-105 | Flutter tasarım sistemi ve tema | T-104, T-059 |
| T-106 | Flutter kimlik doğrulama | T-104, T-019, T-070 |
| T-107 | Stüdyoya bağlanma ve çoklu stüdyo seçici | T-106, T-069, T-070 |
| T-108 | Flutter program ve ders detayı | T-107, T-069, T-105 |
| T-109 | Flutter rezervasyon akışları | T-108, T-070, T-048, T-049 |
| T-110 | Flutter "Hesabım": rezervasyonlar, haklar, geçmiş | T-109, T-045, T-070 |
| T-111 | Flutter satın alma (iyzico) ve kayıtlı kartlar | T-110, T-086, T-088, T-087 |
| T-112 | Flutter profil, ayarlar ve hesap silme | T-106, T-029, T-055 |
| T-113 | Flutter push bildirim istemcisi | T-103, T-112 |
| T-114 | Mobil erişilebilirlik, hata ve çevrimdışı durumları | T-109, T-110, T-111, T-112, T-113 |
| T-115 | Mobil test paketi | T-114 |
| T-116 | Mobil çökme raporlama ve analitik | T-104, T-101 |
| T-117 | Mağaza hazırlığı ve politika uyumu | T-115, T-116, T-079, T-112 |
| T-118 | Beta dağıtımı (TestFlight / Play Dahili Test) | T-117 |
| T-119 | Pilot stüdyoları canlıya alma | T-098, T-102, T-118, T-075, T-076, T-101 |
| T-120 | MVP kabul ölçümü ve kapanış | T-119 |

---

*Bu dosya `momence.md` planının MVP'ye indirgenmiş uygulama görevleridir. Kapsam dışı bir iş eklenmeden önce Bölüm 5.2 ve Bölüm 14 yeniden okunmalıdır.*
