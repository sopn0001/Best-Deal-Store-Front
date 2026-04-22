# Best Deal Store — Store Front

Customer-facing **React** shop (Vite). In production the static build is served by **nginx**, which reverse-proxies API calls to other services: `/categories` and `/products` → Category & Product API, `/orders` → Order API.

## What this service does

This is the **public storefront** shoppers use in the browser. It loads categories and products from the catalog API, lets users filter by category, add line items to a cart, and submit checkout. Checkout sends an order payload to the Order API. The UI only talks to **relative URLs** on the same host (`/categories`, `/products`, `/orders`); nginx forwards those to the correct backend pods or containers so you do not expose internal service DNS or ports to end users.

## Endpoints consumed (this app → APIs)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/categories` | Load category list for filters. |
| GET | `/products` | Load all products; optional query `?category_id=<id>` when a chip is selected. |
| POST | `/orders` | Place order (JSON body: customer, items, total). |
| GET | `/orders` | Load order history (“My Orders”). |

## Stack

- React 18, Vite  
- Docker: multi-stage build → nginx

## Local development

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t best-deal-store-front .
```

