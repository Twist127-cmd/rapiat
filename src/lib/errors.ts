/**
 * Business error carrying a stable code and a user-facing French message.
 * Service layers throw these; Server Actions catch them and return the message
 * as a typed ActionResult failure.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
