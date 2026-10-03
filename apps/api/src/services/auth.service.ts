import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { CacheService } from '../utils/cache';
import { LoggerService } from '../utils/logger';
import { systemQueue } from '../utils/queue';
import { Sanitizer } from '../utils/sanitizer';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface Meta {
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  // 1. Kayıt Ol (Transaction + Sanitization)
  /**
    * Stüdyoya yeni Müşteri (CLIENT) kaydı oluşturur.
    * @param studioId Target studio ID (SUPER_ADMIN kayıtları için null olabilir)
    * @param data Kullanıcı kayıt bilgileri
    * @param meta İsteği atan istemciye ait IP ve UserAgent bilgileri
    */
  static async register(studioId: string | null, data: RegisterData, meta?: Meta) {
    const normalizedEmail = Sanitizer.normalizeEmail(data.email);
    const sanitizedName = Sanitizer.sanitizeString(data.name);

    // 1. Şifre Hashleme
    const hashedPassword = await hashPassword(data.password);

    // 2. Atomik Veritabanı İşlemi
    const { user, refreshToken } = await prisma.$transaction(async (tx) => {
      // Stüdyo bazlı e-posta kontrolü (Multi-tenant)
      const existingUser = await tx.user.findFirst({
        where: {
          email: normalizedEmail,
          studioId: studioId ?? undefined,
        },
      });

      if (existingUser) {
        throw new Error('Bu e-posta adresi bu stüdyoda zaten kayıtlı.');
      }

      // Yeni Kullanıcı Oluşturma
      const newUser = await tx.user.create({
        data: {
          studioId,
          name: sanitizedName,
          email: normalizedEmail,
          phone: data.phone ?? null,
          password: hashedPassword,
          role: 'CLIENT',
          isActive: true,
        },
        select: {
          id: true,
          studioId: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Temporary token for DB record (Refresh Token Transaction içinde kaydediliyor)
      const refresh = await generateRefreshToken({
        userId: newUser.id,
        studioId: newUser.studioId,
        role: newUser.role,
      });

      await tx.refreshToken.create({
        data: {
          userId: newUser.id,
          token: refresh,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Gün
        },
      });

      return { user: newUser, refreshToken: refresh };
    });

    // 3. Access Token Üretimi (Transaction Dışında Hızlıca)
    const accessToken = await generateAccessToken({
      userId: user.id,
      studioId: user.studioId,
      role: user.role,
    });

    // 4. Audit Log Kaydı
    await LoggerService.audit({
      studioId: user.studioId ?? 'GLOBAL',
      actorId: user.id,
      actorRole: user.role,
      category: 'AUTH',
      action: 'USER_REGISTERED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { userId: user.id, email: user.email },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  // 2. Giriş Yap
  /**
   * Kullanıcı giriş servisi (SUPER_ADMIN, ADMIN, INSTRUCTOR, CLIENT)
   * @param studioId Hedef stüdyo ID'si (SUPER_ADMIN için null/undefined gelebilir)
   * @param email E-posta adresi
   * @param password Şifre
   * @param meta İstemci meta bilgileri (IP, UserAgent)
   */
  static async login(studioId: string | null | undefined,email: string,password?: string,meta?: Meta) {
    const normalizedEmail = Sanitizer.normalizeEmail(email);

    if (!password) {
      throw new Error('Lütfen şifrenizi girin.');
    }

    // 1. Önce SUPER_ADMIN kontrolü yap (Global yetkili, stüdyoya bağlı değildir)
    let user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'SUPER_ADMIN',
        studioId: null,
      },
    });

    let targetStudioId: string | null = null;

    // 2. SUPER_ADMIN değilse Stüdyo Kullanıcısı (ADMIN, INSTRUCTOR, CLIENT) araması yap
    if (!user) {
      if (!studioId) {
        throw new Error('Stüdyo bilgisi eksik. Lütfen geçerli bir stüdyo üzerinden giriş yapın.');
      }

      // Stüdyo aktiflik kontrolü
      const studio = await prisma.studio.findUnique({
        where: { id: studioId },
        select: { id: true , isActive: true},
      });

      if (!studio || !studio.isActive) {
        throw new Error('Giriş yapılmak istenen stüdyo bulunamadı veya hizmeti durdurulmuş.');
      }

      targetStudioId = studio.id;

      user = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          studioId: targetStudioId,
        },
      });
    }

    // 3. Kullanıcı Varlık, Aktiflik ve Şifre Varlık Kontrolü
    if (!user || !user.isActive || !user.password) {
      await LoggerService.audit({
        studioId: targetStudioId ?? 'GLOBAL',
        category: 'AUTH',
        action: 'LOGIN_FAILED',
        severity: 'WARN',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        details: { attemptedEmail: normalizedEmail, reason: 'Kullanıcı bulunamadı, pasif veya şifresiz hesap' },
      });

      // Saldırganlara detay vermemek için genel hata mesajı
      throw new Error('E-posta adresi veya şifre hatalı.');
    }

    // 4. Şifre Doğrulama
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      await LoggerService.audit({
        studioId: user.studioId ?? 'GLOBAL',
        actorId: user.id,
        actorRole: user.role,
        category: 'AUTH',
        action: 'LOGIN_FAILED',
        severity: 'WARN',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        details: { attemptedEmail: normalizedEmail, reason: 'Hatalı şifre' },
      });

      throw new Error('E-posta adresi veya şifre hatalı.');
    }

    // 5. JWT Token'ları Üretme
    const accessToken = await generateAccessToken({
      userId: user.id,
      studioId: user.studioId,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      studioId: user.studioId,
      role: user.role,
    });

    // 6. Refresh Token'ı DB'ye Kaydetme
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Gün
      },
    });

    // 7. Audit Log & Yanıt Hazırlama
    await LoggerService.audit({
      studioId: user.studioId ?? 'GLOBAL',
      actorId: user.id,
      actorRole: user.role,
      category: 'AUTH',
      action: 'LOGIN_SUCCESS',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  // 3. Refresh Token ile Yeni Access Token Alma
  /**
   * Refresh Token kullanarak yeni Access Token üretir.
   * @param refreshTokenClient İstemciden gelen refresh token string
   * @param meta İstemci IP ve UserAgent bilgileri
   */
  static async refreshToken(refreshTokenClient: string, meta?: Meta) {
    if (!refreshTokenClient) {
      throw new Error('Refresh token bulunamadı.');
    }

    // 1. Token İmza & Süre Doğrulaması (JWT Level)
    let payload;
    try {
      payload = await verifyRefreshToken(refreshTokenClient);
    } catch {
      throw new Error('Geçersiz veya süresi dolmuş refresh token.');
    }

    // 2. Veritabanı Kaydı Kontrolü
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenClient },
      include: {
        user: {
          select: {
            id: true,
            studioId: true,
            role: true,
            isActive: true,
            studio: {
              select: { id: true, isActive: true },
            },
          },
        },
      },
    });

    // Token DB'de yoksa veya zaman aşımına uğradıysa
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token süresi dolmuş veya geçersiz.');
    }

    // 3. Güvenlik Kontrolü: İptal Edilmiş (Revoked) Token Kullanımı
    if (storedToken.revoked) {
      await LoggerService.audit({
        studioId: storedToken.user?.studioId ?? 'GLOBAL',
        actorId: storedToken.userId,
        actorRole: storedToken.user?.role,
        category: 'AUTH',
        action: 'REVOKED_TOKEN_REUSE_ATTEMPT',
        severity: 'CRITICAL',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        details: { attemptedToken: refreshTokenClient },
      });

      // İptal edilmiş token tekrar kullanılmaya çalışılırsa güvenlik gereği kullanıcının tüm oturumlarını iptal et
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });

      throw new Error('Oturum güvenliği ihlali tespit edildi. Lütfen tekrar giriş yapın.');
    }

    const { user } = storedToken;

    // 4. Kullanıcı Aktiflik Kontrolü
    if (!user || !user.isActive) {
      throw new Error('Kullanıcı hesabı pasife alınmış.');
    }

    // 5. Stüdyo Aktiflik Kontrolü (SUPER_ADMIN hariç)
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.studio || !user.studio.isActive) {
        throw new Error('Stüdyo hesabı dondurulmuş veya aktif değil.');
      }
    }

    // 6. Yeni Access Token Üretimi
    const newAccessToken = await generateAccessToken({
      userId: user.id,
      studioId: user.studioId, // SUPER_ADMIN için null, diğerleri için studioId
      role: user.role,
    });

    return {
      accessToken: newAccessToken,
    };
  }

  // 4. Şifremi Unuttum (OTP Kod Üretimi)
  /**
   * Şifre sıfırlama OTP kodu oluşturur ve e-posta ile gönderir.
   * @param studioId Hedef stüdyo ID'si (SUPER_ADMIN için null/undefined)
   * @param email E-posta adresi
   * @param meta İstemci IP ve UserAgent bilgileri
   */
  static async forgotPassword(
    studioId: string | null | undefined,
    email: string,
    meta?: Meta
  ) {
    const normalizedEmail = Sanitizer.normalizeEmail(email);

    // 1. Önce SUPER_ADMIN mi kontrol et (Global Yetkili)
    let user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'SUPER_ADMIN',
        studioId: null,
      },
    });

    let targetStudioId: string | null = null;

    // 2. SUPER_ADMIN değilse Stüdyo Kullanıcısı araması yap
    if (!user) {
      if (studioId) {
        user = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            studioId,
          },
        });
        targetStudioId = studioId;
      }
    }

    // Security Response (User Enumeration engellemek için kullanıcı bulunamasa da aynı mesajı dönüyoruz)
    const genericSuccessResponse = {
      message: 'Eğer e-posta adresi sistemde kayıtlıysa sıfırlama kodu gönderildi.',
    };

    if (!user || !user.isActive) {
      return genericSuccessResponse;
    }

    // 3. 6 Haneli OTP Kodu Üretimi
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Cache İzolasyonu (Global veya Stüdyo Bazlı Cache Key)
    const cacheKey = `otp:${targetStudioId ?? 'GLOBAL'}:${normalizedEmail}`;
    await CacheService.set(cacheKey, otpCode, 600); // 10 Dakika (600 saniye)

    // 5. Asenkron E-posta Gönderim Kuyruğu
    await systemQueue.add('SEND_OTP_EMAIL', {
      email: normalizedEmail,
      otpCode,
      userName: user.name,
      studioId: targetStudioId,
    });

    // 6. Audit Log
    await LoggerService.audit({
      studioId: targetStudioId ?? 'GLOBAL',
      actorId: user.id,
      actorRole: user.role,
      category: 'AUTH',
      action: 'OTP_REQUESTED',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      details: { email: normalizedEmail },
    });

    // 7. Sadece Geliştirme (Dev) Ortamında OTP'yi Yanıta Ekle
    const isDev = process.env.NODE_ENV === 'development';

    return {
      ...genericSuccessResponse,
      ...(isDev ? { localDevOtp: otpCode } : {}),
    };
  }

  // 5. Şifre Sıfırlama (OTP Doğrulama)
  /**
   * OTP kodu ile şifre sıfırlama işlemini gerçekleştirir.
   * @param studioId Hedef stüdyo ID'si (SUPER_ADMIN için null/undefined)
   * @param email E-posta adresi
   * @param otpCode 6 haneli OTP kodu
   * @param newPassword Yeni şifre
   * @param meta İstemci IP ve UserAgent bilgileri
   */
  static async resetPassword(
    studioId: string | null | undefined,
    email: string,
    otpCode: string,
    newPassword: string,
    meta?: Meta
  ) {
    const normalizedEmail = Sanitizer.normalizeEmail(email);

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
    }

    // 1. Kullanıcıyı Bul (Önce SUPER_ADMIN, yoksa Stüdyo Kullanıcısı)
    let user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'SUPER_ADMIN',
        studioId: null,
      },
    });

    let targetStudioId: string | null = null;

    if (!user) {
      if (studioId) {
        user = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            studioId,
          },
        });
        targetStudioId = studioId;
      }
    }

    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }

    // 2. Cache'ten OTP Doğrulaması Kontrolü
    const cacheKey = `otp:${targetStudioId ?? 'GLOBAL'}:${normalizedEmail}`;
    const cachedOtp = await CacheService.get<string>(cacheKey);

    if (!cachedOtp || cachedOtp !== otpCode) {
      await LoggerService.audit({
        studioId: targetStudioId ?? 'GLOBAL',
        actorId: user.id,
        actorRole: user.role,
        category: 'AUTH',
        action: 'PASSWORD_RESET_FAILED',
        severity: 'WARN',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        details: { reason: 'INVALID_OR_EXPIRED_OTP' },
      });

      throw new Error('Geçersiz veya süresi dolmuş doğrulama kodu.');
    }

    // 3. Yeni Şifreyi Hash'leme
    const hashedPassword = await hashPassword(newPassword);

    // 4. Veritabanı Güncellemesi
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 5. Temizlik & Oturum İptalleri
    // OTP kodunu sil
    await CacheService.del(cacheKey);

    // Güvenlik gereği kullanıcının tüm aktif refresh token'larını iptal et (revoked: true)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    // 6. Audit Log
    await LoggerService.audit({
      studioId: targetStudioId ?? 'GLOBAL',
      actorId: user.id,
      actorRole: user.role,
      category: 'AUTH',
      action: 'PASSWORD_RESET_SUCCESS',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
    };
  }

  // 6. Çıkış Yap (Logout)
  /**
   * Refresh Token'ı iptal ederek (revoked: true) oturumu sonlandırır.
   * @param refreshToken İstemciden gelen refresh token string
   * @param meta İstemci IP ve UserAgent bilgileri
   */
  static async logout(refreshToken: string, meta?: Meta) {
    if (refreshToken) {
      // 1. Token DB'de var mı ve kime ait kontrol et (Audit log için)
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        select: {
          id: true,
          userId: true,
          user: {
            select: { studioId: true, role: true },
          },
        },
      });

      if (storedToken) {
        // 2. Refresh Token'ı iptal et
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revoked: true },
        });

        // 3. Audit Log
        await LoggerService.audit({
          studioId: storedToken.user?.studioId ?? 'GLOBAL',
          actorId: storedToken.userId,
          actorRole: storedToken.user?.role,
          category: 'AUTH',
          action: 'LOGOUT_SUCCESS',
          ipAddress: meta?.ip,
          userAgent: meta?.userAgent,
        });
      }
    }

    return { message: 'Çıkış yapıldı.' };
  }
}