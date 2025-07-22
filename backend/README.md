# Hospital Behavior Tracking API

Backend API for tracking user behavior and storing data in MongoDB for ML anomaly detection.

## Architecture

- **ES6 Modules** with import/export syntax
- **Mongoose ODM** for MongoDB interaction
- **Modular Routes** with Express Router
- **JWT Authentication** middleware
- **Structured Models** with schema validation

## Features

- User behavior tracking and analytics
- MongoDB integration with Mongoose ODM
- JWT token authentication (Keycloak ready)
- RESTful API endpoints with proper validation
- Real-time behavior data storage
- Advanced analytics with aggregation pipelines
- Modular, maintainable codebase

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://vqh04092004:admin%40@cluster0.nnhndae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_DATABASE=hospital_analytics
NODE_ENV=development
```

### 3. Start the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Behavior Tracking
- `POST /api/behavior-tracking` - Store user behavior data
- `GET /api/behavior-tracking` - Retrieve behavior data with filtering
- `GET /api/behavior-tracking/analytics` - Get analytics summary
- `GET /api/behavior-tracking/stats` - Get quick statistics
- `DELETE /api/behavior-tracking?confirm=true` - Clear behavior data

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── server.js              # Main server with ES6 modules
├── models/
│   └── Behavior.js        # Mongoose schema for behavior data
├── routes/
│   └── behavior.js        # Behavior tracking routes
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── package.json          # Dependencies with ES6 support
└── .env                  # Environment configuration
```

## Database Schema

The API stores user behavior data with the following structure:

```json
{
  "username": "string",
  "userId": "string",
  "email": "string",
  "roles": ["string"],
  "ipAddress": "string",
  "userAgent": "string",
  "timestamp": "Date",
  "action": "string",
  "sessionId": "string",
  "sessionPeriod": "number",
  "riskLevel": "string",
  "riskScore": "number",
  "metadata": {
    "realm": "string",
    "clientId": "string",
    "tokenType": "string"
  }
}
```

## Authentication

All API endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Development

For development, use nodemon for auto-restart on file changes:

```bash
npm run dev
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM with schema validation
- **cors**: CORS middleware
- **dotenv**: Environment variable management
- **nodemon**: Development auto-restart (dev dependency)

## Key Features

### ES6 Modules
- Uses `import/export` syntax throughout
- Modern JavaScript with async/await
- Modular architecture

### Mongoose Integration
- Schema validation and indexing
- Automatic timestamps (createdAt, updatedAt)
- Advanced querying and aggregation

### Enhanced API
- Better error handling and validation
- Pagination support
- Advanced filtering options
- Comprehensive analytics endpoints

### Security
- JWT token validation middleware
- Input validation and sanitization
- Proper error responses 