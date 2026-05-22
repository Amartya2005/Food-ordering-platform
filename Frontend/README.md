# Online Food Ordering Frontend

React frontend for the Express, PocketBase, JWT, Socket.io food ordering backend.

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Update `.env` if your backend is not running on port `5000`.

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Backend requirements

- Enable CORS for the frontend origin, usually `http://127.0.0.1:5173`.
- Auth endpoints should return a JWT as `data.token`, `token`, `data.jwt`, or `jwt`.
- Protected endpoints must accept `Authorization: Bearer <token>`.
- Socket.io should read the token from `socket.handshake.auth.token`.
- Image upload endpoints must accept `multipart/form-data` fields named `image` or `images`.

## Main pages

- Customer: `/`, `/restaurants`, `/restaurants/:id`, `/cart`, `/checkout`, `/orders/:id`, `/profile`
- Restaurant owner: `/owner`, `/owner/restaurant`, `/owner/menu`, `/owner/orders`
- Admin: `/admin`, `/admin/users`, `/admin/restaurants`, `/admin/analytics`
