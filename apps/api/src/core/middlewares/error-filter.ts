import type { Context } from 'hono';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';
import { createProblemDetails } from '../errors/problem-details';
import { logger } from '../logger';
import { env } from '../../config/env';

export async function rfc7807ErrorFilter(err: Error, c: Context) {
  const requestId = c.get('requestId') || c.req.header('x-request-id') || crypto.randomUUID();
  const instance = c.req.path;

  // 1. Zod Doğrulama Hatası
  if (err instanceof ZodError) {
    const invalidParams = err.errors.map((e) => ({
      name: e.path.join('.'),
      reason: e.message,
    }));

    const problem = createProblemDetails({
      status: 422,
      code: ErrorCodes.VALIDATION_ERROR,
      detail: 'İstek gövdesi veya parametreler doğrulanamadı',
      instance,
      requestId,
      invalidParams,
    });

    logger.warn({ requestId, instance, invalidParams }, 'İstek doğrulama hatası (422)');
    c.header('Content-Type', 'application/problem+json');
    return c.json(problem, 422);
  }

  // 2. Uygulama İçi AppError Hatası
  if (err instanceof AppError) {
    const problem = createProblemDetails({
      status: err.statusCode,
      code: err.code,
      detail: err.message,
      instance,
      requestId,
      invalidParams: err.invalidParams,
    });

    if (err.statusCode >= 500) {
      logger.error({ err, requestId, instance }, 'Sunucu içi AppError hatası');
    } else {
      logger.warn({ code: err.code, status: err.statusCode, requestId, instance }, err.message);
    }

    c.header('Content-Type', 'application/problem+json');
    return c.json(problem, err.statusCode as any);
  }

  // 3. Beklenmeyen Genel Hatalar (500)
  logger.error({ err, requestId, instance }, 'Beklenmeyen sunucu hatası');

  const detail =
    env.NODE_ENV === 'production'
      ? 'Sunucu içi bir hata meydana geldi. Lütfen daha sonra tekrar deneyiniz.'
      : err.message || 'Bilinmeyen bir hata oluştu.';

  const problem = createProblemDetails({
    status: 500,
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    detail,
    instance,
    requestId,
  });

  c.header('Content-Type', 'application/problem+json');
  return c.json(problem, 500);
}
