import { Type } from '@sinclair/typebox';

/**
 * Common error response schemas for API endpoints
 */
const ErrorSchema = {
  /**
   * 400 Bad Request Error Schema
   * Used when the request is malformed or contains invalid data
   */
  BadRequestError: Type.Object(
    {
      statusCode: Type.Literal(400),
      code: Type.Optional(
        Type.String({
          examples: ['FST_ERR_VALIDATION'],
        }),
      ),
      error: Type.Literal('Bad Request'),
      message: Type.String(),
      validationErrors: Type.Optional(
        Type.Record(
          Type.String(),
          Type.Array(Type.String(), {
            description: 'Array of error messages for a specific field',
            examples: [
              ['must be of type string'],
              ['must be at least 8 characters'],
            ],
          }),
          {
            examples: [
              {
                field1: [
                  'must be of type string',
                  'must be at least 8 characters',
                ],
              },
            ],
          },
        ),
      ),
    },
    {
      description:
        'Error returned when the request contains invalid data or is improperly formatted',
    },
  ),

  /**
   * 401 Unauthorized Error Schema
   * Used when authentication is required but failed or not provided
   */
  UnauthorizedError: Type.Object(
    {
      statusCode: Type.Literal(401),
      error: Type.Literal('Unauthorized'),
      message: Type.String({
        example: 'Invalid credentials or access token has expired.',
      }),
    },
    {
      description:
        'Error returned when user authentication fails or is missing',
    },
  ),

  /**
   * 403 Forbidden Error Schema
   * Used when the authenticated user doesn't have sufficient permissions
   */
  ForbiddenError: Type.Object(
    {
      statusCode: Type.Literal(401),
      error: Type.Literal('Forbidden'),
      message: Type.String({
        example: 'You do not have permission to access this resource.',
      }),
    },
    {
      description:
        'Error returned when the user is authenticated but lacks necessary permissions',
    },
  ),

  /**
   * 404 Not Found Error Schema
   * Used when the requested resource cannot be found
   */
  NotFoundError: Type.Object(
    {
      statusCode: Type.Literal(404),
      error: Type.Literal('Not Found'),
      message: Type.String({
        example: 'The requested resource was not found.',
      }),
    },
    {
      description: 'Error returned when the requested resource does not exist',
    },
  ),

  /**
   * 500 Internal Server Error Schema
   * Used when an unexpected error occurs on the server
   */
  InternalServerError: Type.Object(
    {
      statusCode: Type.Literal(500),
      error: Type.Literal('Internal Server Error'),
      message: Type.String({
        example: 'An unexpected error occurred while processing your request.',
      }),
    },
    {
      description: 'Error returned when an unexpected server-side error occurs',
    },
  ),
};

export default ErrorSchema;
