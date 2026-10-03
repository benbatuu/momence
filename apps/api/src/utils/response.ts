import type { Context } from 'hono';

export function successResponse(c: Context, data: any, message?: string, status: number = 200) {
  return c.json(
    {
      success: true,
      message: message || 'İşlem başarılı',
      data,
    },
    status as any
  );
}

export function errorResponse(c: Context, message: string, status: number = 400, errors?: any) {
  return c.json(
    {
      success: false,
      message,
      errors: errors || null,
    },
    status as any
  );
}