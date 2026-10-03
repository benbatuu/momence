import type { ErrorCode } from './error-codes';
import type { InvalidParam } from './app-error';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: ErrorCode;
  requestId?: string;
  invalidParams?: InvalidParam[];
  timestamp: string;
}

const titles: Record<number, string> = {
  400: 'Geçersiz İstek',
  401: 'Yetkisiz Erişim',
  403: 'Erişim Engellendi',
  404: 'Kaynak Bulunamadı',
  409: 'Çakışma Tespit Edildi',
  422: 'İşlenemeyen Varlık (Doğrulama Hatası)',
  429: 'Çok Fazla İstek Yapıldı',
  500: 'Sunucu İçi Hata',
  503: 'Hizmet Kullanılamıyor',
};

export function createProblemDetails(options: {
  status: number;
  code: ErrorCode;
  detail: string;
  instance: string;
  requestId?: string;
  invalidParams?: InvalidParam[];
}): ProblemDetails {
  return {
    type: `https://api.studio-os.local/errors/${options.code}`,
    title: titles[options.status] || 'Hata',
    status: options.status,
    detail: options.detail,
    instance: options.instance,
    code: options.code,
    requestId: options.requestId,
    invalidParams: options.invalidParams,
    timestamp: new Date().toISOString(),
  };
}
