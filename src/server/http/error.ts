export class AppError extends Error {
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly status: number;

  constructor(
    message: string,
    code: string,
    status = 400,
    fields?: Record<string, string>
  ) {
    super(message);
    this.code = code;
    this.status = status;

    if (fields) {
      this.fields = fields;
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
