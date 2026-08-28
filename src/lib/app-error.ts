export type AppErrorCode = "database" | "not_found" | "validation" | "unexpected";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallbackMessage;
}

export function toAppError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) return error;
  const detail = errorMessage(error, "");
  const message = detail && detail !== fallbackMessage ? `${fallbackMessage} ${detail}` : fallbackMessage;
  return new AppError("database", message, error);
}
