import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { HttpError } from '../utils/http-error.js'

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('[PulseOps Server Error]:', err)

  // HttpError is thrown deliberately by route handlers for expected failures
  // (not found, conflict, validation), so its message is safe to return.
  // Anything else is an unexpected failure (a database or programming error)
  // and its message or stack must never reach the client.
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, error: err.message })
    return
  }

  // express.json() rejects a malformed body with a SyntaxError (status 400).
  // That is a client mistake, not a server failure, so report it as one.
  if (err instanceof SyntaxError && (err as { status?: number }).status === 400) {
    res.status(400).json({ success: false, error: 'Invalid JSON in request body' })
    return
  }

  res.status(500).json({ success: false, error: 'Internal Server Error' })
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  })
}
