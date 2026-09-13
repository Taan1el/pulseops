/**
 * An error with a specific HTTP status code attached. Route handlers throw
 * this for expected failures (not found, conflict, validation) so the error
 * middleware can send that exact status and a safe, user-facing message.
 * Any other thrown error is treated as unexpected and never reaches the
 * client with its own message, to avoid leaking internal details.
 */
export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}
