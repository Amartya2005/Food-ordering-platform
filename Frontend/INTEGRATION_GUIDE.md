# Frontend Backend Integration Guide

## 1. Environment

Create `.env` in this frontend folder:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

If your Express server uses another port, change both values.

## 2. Backend CORS

Your Express app must allow the Vite frontend origin:

```js
import cors from 'cors';

app.use(
  cors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    credentials: true
  })
);
```

## 3. JWT Contract

The frontend stores the token from login/register and sends:

```txt
Authorization: Bearer <token>
```

Recommended login/register response:

```json
{
  "success": true,
  "message": "Logged in",
  "data": {
    "token": "jwt_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

Accepted roles are:

```txt
customer
restaurant
admin
```

## 4. Socket.io JWT

The frontend connects like this:

```js
io(SOCKET_URL, {
  auth: {
    token,
    authorization: `Bearer ${token}`
  }
});
```

Backend example:

```js
io.use((socket, next) => {
  const rawToken = socket.handshake.auth?.token;

  if (!rawToken) return next(new Error('Unauthorized'));

  try {
    socket.user = jwt.verify(rawToken, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});
```

Emit these events when orders change:

```js
io.to(customerId).emit('orderStatusChanged', order);
io.to(restaurantOwnerId).emit('newOrder', order);
io.to(restaurantOwnerId).emit('orderUpdated', order);
```

## 5. Upload Fields

This frontend sends restaurant and food uploads as `multipart/form-data` with field name:

```txt
image
```

If your multer route expects another field name, change the form payload key in:

- `src/pages/owner/OwnerRestaurant.jsx`
- `src/pages/owner/OwnerMenu.jsx`
- `src/api/client.js` if you want to normalize upload keys globally

## 6. Endpoint Mapping

Frontend service files map directly to your backend:

- Auth: `src/services/authService.js`
- Restaurants: `src/services/restaurantService.js`
- Menu: `src/services/menuService.js`
- Orders: `src/services/orderService.js`
- Admin: `src/services/adminService.js`

If your backend returns `{ success, message, data }`, no change is needed.

## 7. Run

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5173
```
