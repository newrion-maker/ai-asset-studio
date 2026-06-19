import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const isConfigError = message.includes('OPENAI_API_KEY');
  const status = isConfigError ? 500 : 502;

  console.error('[AI Asset Studio API Error]', message);

  res.status(status).json({
    error: isConfigError ? 'config_error' : 'api_error',
    message,
  });
};
