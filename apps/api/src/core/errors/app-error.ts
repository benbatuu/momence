import { ErrorCodes, type ErrorCode } from './error-codes';

export interface InvalidParam {
  name: string;
  reason: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly invalidParams?: InvalidParam[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR,
    invalidParams?: InvalidParam[]
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.invalidParams = invalidParams;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code: ErrorCode = ErrorCodes.BAD_REQUEST) {
    return new AppError(message, 400, code);
  }

  static validation(message: string, invalidParams: InvalidParam[]) {
    return new AppError(message, 422, ErrorCodes.VALIDATION_ERROR, invalidParams);
  }

  static unauthorized(message: string = 'Kimlik doğrulaması başarısız', code: ErrorCode = ErrorCodes.UNAUTHORIZED) {
    return new AppError(message, 401, code);
  }

  static forbidden(message: string = 'Bu işlem için yetkiniz yok', code: ErrorCode = ErrorCodes.FORBIDDEN) {
    return new AppError(message, 403, code);
  }

  static notFound(message: string = 'İstenen kaynak bulunamadı', code: ErrorCode = ErrorCodes.NOT_FOUND) {
    return new AppError(message, 404, code);
  }

  static conflict(message: string, code: ErrorCode = ErrorCodes.CONFLICT) {
    return new AppError(message, 409, code);
  }

  static rateLimit(message: string = 'İstek sınırı aşıldı, lütfen bekleyin') {
    return new AppError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  static internal(message: string = 'Sunucu içi bir hata meydana geldi') {
    return new AppError(message, 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
}
