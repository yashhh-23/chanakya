import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiResponse {
  /**
   * 200 OK / 201 Created Success Response
   */
  static success<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status })
  }

  /**
   * 400 Bad Request / Validation Error Response
   */
  static validationError(error: ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }))
    return NextResponse.json(
      {
        success: false,
        error: 'Validation Error',
        details: formattedErrors
      },
      { status: 400 }
    )
  }

  /**
   * 409 Conflict Response (e.g., duplicate registration number)
   */
  static conflict(message: string) {
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 409 }
    )
  }

  /**
   * 404 Not Found Response
   */
  static notFound(message = 'Resource not found') {
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 404 }
    )
  }

  /**
   * 500 Internal Server Error & Defensive Prisma Error Handling
   */
  static serverError(error: unknown) {
    console.error('API Server Error:', error)

    // Handle Prisma Unique Constraint Violation (P2002) & Record Not Found (P2025)
    if (error && typeof error === 'object' && 'code' in error) {
      const err = error as { code: string; meta?: { target?: unknown } }
      if (err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(', ')
          : 'unique field'
        return ApiResponse.conflict(`Conflict: A record with this ${target} already exists. Registration number must be unique.`)
      }
      if (err.code === 'P2025') {
        return ApiResponse.notFound('Record not found or already deleted.')
      }
    }

    if (error instanceof ZodError) {
      return ApiResponse.validationError(error)
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    )
  }
}
