export class Sanitizer {
  // E-posta adreslerini standartlaştır (Lowercasing & Trim)
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  // XSS Script enjeksiyonlarını temizleme
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}