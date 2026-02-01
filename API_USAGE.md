# Rev Winner API Documentation

## Overview

Rev Winner provides a RESTful API that allows you to integrate your sales data and tools with external systems. All API endpoints require authentication via API keys.

## Base URL

```
http://localhost:5000/api/v1
```

Production:
```
https://your-domain.com/api/v1
```

## Authentication

All API requests must include your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  http://localhost:5000/api/v1/test
```

### Rate Limiting

API keys have rate limits based on your configuration:
- Default: 1000 requests per hour
- Headers include rate limit information:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

## Endpoints

### 1. Test Connection

**GET** `/api/v1/test`

Test if your API key is valid and working.

**Request:**
```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  http://localhost:5000/api/v1/test
```

**Response:**
```json
{
  "success": true,
  "message": "API key is valid and working!",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "apiKey": {
    "name": "Production API Key",
    "scopes": ["read"],
    "rateLimit": "1000/hour"
  }
}
```

---

### 2. Get User Profile

**GET** `/api/v1/user/profile`

Retrieve the profile information for the user associated with the API key.

**Request:**
```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  http://localhost:5000/api/v1/user/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Get AI Token Usage

**GET** `/api/v1/usage/ai-tokens`

Get AI token usage statistics for your account.

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2026-01-01")
- `endDate` (optional): ISO date string (e.g., "2026-01-31")
- `provider` (optional): Filter by provider (deepseek, gemini, claude, chatgpt, grok, kimi)

**Request:**
```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  "http://localhost:5000/api/v1/usage/ai-tokens?startDate=2026-01-01&endDate=2026-01-31"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": [
      {
        "id": "tk_123",
        "provider": "deepseek",
        "promptTokens": 1500,
        "completionTokens": 800,
        "totalTokens": 2300,
        "feature": "conversation_analysis",
        "occurredAt": "2026-01-30T15:45:00.000Z"
      }
    ],
    "summary": {
      "totalTokens": 125000,
      "promptTokens": 75000,
      "completionTokens": 50000,
      "requestCount": 45
    }
  }
}
```

---

### 4. Get Session Usage

**GET** `/api/v1/usage/sessions`

Get session usage for the last 30 days.

**Request:**
```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  http://localhost:5000/api/v1/usage/sessions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 15,
    "sessions": [
      {
        "id": "ses_123",
        "sessionType": "real_time",
        "startedAt": "2026-01-30T10:00:00.000Z",
        "endedAt": "2026-01-30T10:45:00.000Z",
        "createdAt": "2026-01-30T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 5. Get Conversations

**GET** `/api/v1/conversations`

Retrieve your conversation history.

**Query Parameters:**
- `limit` (optional): Number of conversations to return (default: 10, max: 100)

**Request:**
```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  "http://localhost:5000/api/v1/conversations?limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "conversations": [
      {
        "id": "conv_123",
        "title": "Q4 Sales Review with Client",
        "conversationDate": "2026-01-30",
        "summary": "Discussed Q4 performance and 2026 goals...",
        "sentiment": "positive",
        "outcomeType": "won",
        "createdAt": "2026-01-30T15:30:00.000Z"
      }
    ]
  }
}
```

---

### 6. Get Call Recordings

**GET** `/api/v1/recordings`

Retrieve your call recordings.

**Query Parameters:**
- `limit` (optional): Number of recordings to return (default: 10, max: 100)

**Request:**
```bash
curl -H "X-API-Key: rw_your_api_key_here" \
  "http://localhost:5000/api/v1/recordings?limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "recordings": [
      {
        "id": "rec_123",
        "title": "Client Discovery Call",
        "duration": 2745,
        "recordingDate": "2026-01-30",
        "transcriptionStatus": "completed",
        "createdAt": "2026-01-30T14:20:00.000Z"
      }
    ]
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "API key required",
  "code": "API_KEY_MISSING"
}
```

### 403 Forbidden
```json
{
  "error": "IP not whitelisted",
  "code": "IP_NOT_ALLOWED"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "success": false
}
```

---

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const apiKey = 'rw_your_api_key_here';
const baseURL = 'http://localhost:5000/api/v1';

async function testAPI() {
  try {
    const response = await axios.get(`${baseURL}/test`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
```

### Python

```python
import requests

api_key = 'rw_your_api_key_here'
base_url = 'http://localhost:5000/api/v1'

def test_api():
    headers = {'X-API-Key': api_key}
    response = requests.get(f'{base_url}/test', headers=headers)
    
    if response.status_code == 200:
        print('Success:', response.json())
    else:
        print('Error:', response.json())

test_api()
```

### cURL

```bash
# Test connection
curl -H "X-API-Key: rw_your_api_key_here" \
  http://localhost:5000/api/v1/test

# Get user profile
curl -H "X-API-Key: rw_your_api_key_here" \
  http://localhost:5000/api/v1/user/profile

# Get conversations with limit
curl -H "X-API-Key: rw_your_api_key_here" \
  "http://localhost:5000/api/v1/conversations?limit=5"
```

---

## Best Practices

1. **Keep API Keys Secret**: Never commit API keys to version control or expose them in client-side code.

2. **Use Environment Variables**: Store API keys in environment variables:
   ```bash
   export REV_WINNER_API_KEY="rw_your_api_key_here"
   ```

3. **Handle Rate Limits**: Check `X-RateLimit-Remaining` header and implement exponential backoff.

4. **Error Handling**: Always handle errors gracefully and check response status codes.

5. **Use HTTPS**: In production, always use HTTPS to secure your API communications.

6. **IP Whitelisting**: Configure IP whitelisting in your API key settings for added security.

7. **Rotate Keys**: Regularly rotate API keys and revoke unused ones.

---

## Support

For API support, contact:
- Email: support@revwinner.com
- Documentation: https://docs.revwinner.com
- Status: https://status.revwinner.com
