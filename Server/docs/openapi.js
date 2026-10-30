// OpenAPI 3 spec (Swagger UI isi se bante hain). Jaise-jaise endpoints badhein, yahan add karte jao.
const REPORT_TYPES = [
  'waste_dump',
  'no_bin',
  'overflowing_bin',
  'contaminated_water',
  'open_construction',
];

const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'JunkSnap API',
    version: '1.0.0',
    description:
      'Civic waste reporting API. Auth = AWS Cognito **ID token** (Authorize button me sirf token paste karo).\n\n' +
      'Sab responses ka format: `{ success, data }` ya `{ success:false, error:{ code, message, details } }`.',
  },
  servers: [{ url: '/api/v1', description: 'Current server' }],
  tags: [
    { name: 'System' },
    { name: 'Users' },
    { name: 'Uploads' },
    { name: 'Reports' },
    { name: 'Sites' },
    { name: 'Geo' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Cognito ID token (JWT)' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] },
          language: { type: 'string', enum: ['en', 'hi'] },
          theme: { type: 'string', enum: ['light', 'dark', 'system'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateReport: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'sha256', 'lat', 'lng', 'accuracyM', 'capturedAt', 'type'],
        properties: {
          key: {
            type: 'string',
            description: 'Cloudinary public_id jo /uploads/sign ne diya tha',
            example: 'originals/<userId>/<uuid>',
          },
          sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$', description: 'Photo ka SHA-256 (64 hex)' },
          lat: { type: 'number', minimum: -90, maximum: 90, description: 'India ke andar hona chahiye' },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          accuracyM: { type: 'number', minimum: 0, maximum: 500 },
          capturedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO time. Future ka nahi, 10 min se purana nahi.',
          },
          type: { type: 'string', enum: REPORT_TYPES },
          note: { type: 'string', maxLength: 300 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: { 200: { description: 'API aur DB ka status' } },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Mera profile (pehli baar bulane par user DB me ban jata hai)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
                  },
                },
              },
            },
          },
          401: errorResponse('Token missing ya invalid'),
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Language ya theme badlo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  language: { type: 'string', enum: ['en', 'hi'] },
                  theme: { type: 'string', enum: ['light', 'dark', 'system'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated user' },
          401: errorResponse('Token missing ya invalid'),
          422: errorResponse('Validation error'),
        },
      },
    },
    '/uploads/sign': {
      post: {
        tags: ['Uploads'],
        summary: 'Cloudinary private upload ke liye signed params',
        description:
          'Original photo `authenticated` type me jati hai (public nahi). Limit: 40 requests/hour.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'uploadUrl, apiKey, public_id, timestamp, type, allowed_formats, signature' },
          401: errorResponse('Token missing ya invalid'),
          429: errorResponse('Rate limit'),
        },
      },
    },
    '/reports': {
      post: {
        tags: ['Reports'],
        summary: 'Report banao (status = pending, worker background me process karta hai)',
        description:
          'Checks: key user ki hai, time fresh hai, ghante me 20 snaps max, duplicate hash nahi, Cloudinary par file sach me hai.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReport' } } },
        },
        responses: {
          202: {
            description: 'Mil gayi, process ho rahi hai',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        report: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            status: { type: 'string', example: 'pending' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse('Token missing ya invalid'),
          403: errorResponse('FORBIDDEN_KEY: photo aapki nahi hai'),
          409: errorResponse('DUPLICATE_IMAGE'),
          422: errorResponse('VALIDATION_ERROR / BAD_TIME / STALE_PHOTO / UPLOAD_NOT_FOUND / FILE_TOO_LARGE / BAD_FORMAT'),
          429: errorResponse('RATE_LIMIT'),
        },
      },
    },
    '/sites': {
      get: {
        tags: ['Sites'],
        summary: 'Map box (bbox) ki sites',
        parameters: [
          {
            name: 'bbox',
            in: 'query',
            required: true,
            description: 'minLng,minLat,maxLng,maxLat (box 5 degree se chhota)',
            schema: { type: 'string', example: '76.2,22.3,76.5,22.6' },
          },
          { name: 'type', in: 'query', schema: { type: 'string', enum: REPORT_TYPES } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['unverified', 'verified', 'cleaned'] },
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 500 } },
        ],
        responses: {
          200: { description: '{ data: { sites: [...] }, meta: { count } }' },
          422: errorResponse('bbox galat ya bahut bada'),
        },
      },
    },
    '/geo/resolve': {
      get: {
        tags: ['Geo'],
        summary: 'lat/lng se state, district, assembly, Lok Sabha...',
        description: 'Bahar (Nominatim) call karta hai, isliye limit 30 requests/min.',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number', example: 22.5917 } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number', example: 76.9 } },
        ],
        responses: {
          200: { description: 'Resolved location' },
          422: errorResponse('India ke bahar ya galat values'),
          429: errorResponse('Rate limit'),
        },
      },
    },
    '/admin/ping': {
      get: {
        tags: ['Admin'],
        summary: 'Admin access check',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Admin access OK' },
          401: errorResponse('Token missing ya invalid'),
          403: errorResponse('Admin nahi ho'),
        },
      },
    },
  },
};
