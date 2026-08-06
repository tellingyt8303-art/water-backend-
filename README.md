# Water Delivery Backend

Complete backend server for a water selling/delivery platform — auth, product & inventory management, orders, subscriptions, and payments (COD + Razorpay).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Create a PostgreSQL database matching `DB_NAME` in `.env`.

4. Run the server:
   ```bash
   npm run dev    # development (nodemon, auto-restart)
   npm start      # production
   ```

On first run, Sequelize will auto-create all tables (`sequelize.sync`).

## API Overview

### Auth — `/api/auth`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/signup` | Register (name, phone, email, password, address, pincode) | Public |
| POST | `/login` | Login with phone + password | Public |
| POST | `/forgot-password` | Send reset link to email | Public |
| POST | `/reset-password/:token` | Reset password using emailed token | Public |
| POST | `/change-password` | Change password (old + new) | Logged in |
| GET | `/me` | Get logged-in profile | Logged in |

### Products — `/api/products`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | List active products | Public |
| GET | `/:id` | Product details | Public |
| POST | `/` | Create product | Admin |
| PUT | `/:id` | Update product | Admin |
| DELETE | `/:id` | Delete product | Admin |

### Orders — `/api/orders`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Place order (COD or online) | Logged in |
| POST | `/verify-payment` | Verify Razorpay payment signature | Logged in |
| GET | `/my-orders` | Get own order history | Logged in |
| GET | `/:id` | Get order details | Logged in |
| PUT | `/:id/status` | Update order/payment status | Admin/Delivery |

### Subscriptions — `/api/subscriptions`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create subscription (daily/weekly/monthly) | Logged in |
| GET | `/my-subscriptions` | List own subscriptions | Logged in |
| PUT | `/:id/pause` | Pause | Logged in |
| PUT | `/:id/resume` | Resume | Logged in |
| DELETE | `/:id` | Cancel | Logged in |

### Admin — `/api/admin` (all routes admin-only)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/inventory/stock-in` | Add stock |
| POST | `/inventory/stock-out` | Reduce/adjust stock |
| GET | `/inventory/low-stock?threshold=10` | Low-stock products |
| GET | `/inventory/logs/:productId` | Stock change history |
| GET | `/orders?status=placed` | All orders (filterable) |
| GET | `/dashboard-stats` | Orders/users/revenue summary |

## Notes

- **Auth**: JWT-based. Send token as `Authorization: Bearer <token>` header.
- **Payments**: COD marked `pending` until delivery partner collects cash → admin updates via `/orders/:id/status`. Online payments use Razorpay checkout + signature verification.
- **Subscriptions**: Currently creates the subscription record with a computed `nextDeliveryDate`. For true auto-recurring billing, integrate Razorpay Subscriptions API (`razorpaySubscriptionId` field is already in the model) and add a cron job to generate orders on `nextDeliveryDate`.
- **First admin user**: no signup role selection is exposed on purpose (security). Create the first admin manually in the DB, or add a protected seed script.
