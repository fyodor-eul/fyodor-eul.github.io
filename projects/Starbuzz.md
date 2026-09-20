title: StarBuzz — Cloud-Native Café Ordering System
image: images/projects/Starbuzz/cover.png
description: StarBuzz is a serverless microservices café ordering platform on AWS, letting customers browse, order, and track purchases while staff manage the menu and fulfil orders in real time.

## 1. Overview

StarBuzz is a cloud-native café ordering system built as coursework for CADV (CIT2C24 – Cloud Application Development) at Temasek Polytechnic. The system allows customers to browse a menu, place orders for dine-in or takeaway, and track order history, while café staff manage the menu and fulfil incoming orders in real time.

The project was built from the ground up: architecture design, data dictionaries, API documentation, and a formal proposal preceded implementation. The backend is a set of independently deployable AWS Lambda microservices, and the frontend is a static multi-page site consuming those services over HTTPS.

### 1.1 Objectives

- Design and implement a microservices-based backend on AWS, replacing a monolithic approach with independently deployable services.
- Provide secure, role-based access for two distinct user types: customers and staff.
- Support the full order lifecycle: menu browsing, cart management, order placement, and order fulfilment tracking.
- Demonstrate serverless, pay-per-use infrastructure suitable for a small café's traffic profile.

### 1.2 Scope

In scope: customer-facing ordering flows (browse, cart, checkout, order history, account management) and staff-facing operational flows (menu management, order fulfilment board).
Out of scope: payment processing, delivery logistics, and multi-branch/franchise support.

---

## 2. System Architecture

StarBuzz follows a serverless microservices architecture on AWS. Each backend capability (User, Menu, Order) is implemented as an independent Lambda-backed service behind a shared API Gateway, with Cognito handling authentication centrally. This keeps services independently deployable and testable, and avoids a single point of failure in the backend compute layer.

### 2.1 AWS Services Used

| Service | Role in StarBuzz |
|---|---|
| API Gateway (HTTP API) | Single entry point for all client requests; routes to the relevant Lambda function |
| AWS Lambda | Runs each microservice's business logic (Node.js runtime) |
| Amazon Cognito | User Pools for authentication; issues JWTs; Post Confirmation trigger for user provisioning |
| Amazon DynamoDB | Stores data suited to key-value/document access patterns |
| Amazon RDS (MySQL) | Stores relational data requiring joins/transactions |
| Amazon S3 | Hosts the static frontend and stores uploaded menu item images |
| Amazon CloudFront | CDN in front of the S3-hosted frontend |
| Amazon SES | Sends transactional emails (e.g. order/account notifications) |

### 2.2 High-Level Request Flow

```
Browser (CloudFront/S3 static site)
   |
   |  Authorization: Bearer <id_token>
   v
API Gateway (HTTP API)
   |
   +--> User Service (Lambda)  --> Cognito / RDS
   +--> Menu Service (Lambda)  --> DynamoDB / S3 (images)
   +--> Order Service (Lambda) --> DynamoDB / RDS

Auth: Cognito User Pool (OAuth2 Authorization Code flow, no client secret)
```

### 2.3 Why Microservices

The system is split into three services — User, Menu, and Order — each owning its own data access and business logic. This separation mirrors the natural domain boundaries of the application and lets each service be deployed, tested, and scaled independently. An earlier proposal included a fourth Review service; this was dropped before implementation and never built.

### 2.4 Architecture Diagram

The diagram below shows the full request/data flow: client authentication against the Cognito User Pool, routing through the API Gateway ("starbuzz"), and the three backend microservices, plus the presigned-upload path for menu item images and the SES email path from the Order service.

![StarBuzz system architecture](images/projects/Starbuzz/00-architecture-diagram.png)
*End-to-end StarBuzz system design: client, Cognito, API Gateway, the three microservices, presigned S3 uploads, and SES email delivery.*

### 2.5 Named Resources

| Resource | Type | Role |
|---|---|---|
| `starbuzz-cloudfront` | CloudFront distribution | Serves the static frontend to the client |
| `starbuzz-frontend` | S3 bucket | Origin bucket for the static frontend site |
| `starbuzz` (API Gateway) | API Gateway HTTP API | Single routed entry point to all three microservices |
| `User pool - c2m-u` | Cognito User Pool | Issues the UUID authorization code and JWT during login |
| `starbuzz-user-postconfirmation` | Lambda | Post Confirmation trigger; stores user info into the `users` table on sign-up |
| `users_crud` / `users` | Lambda / DynamoDB | User Service — CRUD operations on user records |
| `menu_crud` / `menu_items` | Lambda / DynamoDB | Menu Service — CRUD operations on menu items |
| `orders_crud` / `starbuzz_orders` | Lambda / DynamoDB | Order Service — CRUD operations on orders |
| `upload_service` | Lambda | Issues presigned URLs for menu item image uploads |
| `starbuzz-menu-items` | S3 bucket | Stores uploaded menu item images, accessed via presigned URL |
| `fyodortestmail@gmail.com` (SES) | SES identity | Sends order/account notification emails to the client, triggered by `orders_crud` |

---

## 3. Authentication & Authorization

Authentication is centralized through a single Amazon Cognito User Pool, shared by both customer and staff users. Role distinction (customer vs staff) is carried inside the JWT and enforced at the API layer.

### 3.1 Flow

- Cognito App Client is configured with no client secret, using the OAuth2 Authorization Code flow suitable for public (browser-based) clients.
- `http://localhost:8000` is registered as an allowed callback URL for local development, matching the port the frontend is served on.
- After login, the resulting `id_token` is used as the Bearer token on all authenticated API calls.
- A Cognito Post Confirmation Lambda trigger provisions a corresponding application-level user record at sign-up.

### 3.2 Authorization Rules

| Endpoint type | Authentication requirement |
|---|---|
| `GET /menu` | Public — no JWT required |
| All other endpoints | Require a valid Cognito `id_token` |
| Staff-only actions (menu management, order fulfilment) | `id_token` must carry the staff role claim |

### 3.3 Password & Profile Changes

Password changes are sent directly from the browser to Cognito's `ChangePassword` operation and never pass through the StarBuzz API. Profile updates (name, contact details) go through the User service via `PUT /users/{id}`.

---

## 4. Backend Services

All three services are implemented as Node.js Lambda functions behind an API Gateway HTTP API.

### 4.1 User Service

- Manages user profile data (name, contact details) in addition to Cognito-managed identity.
- Exposes `PUT /users/{id}` for profile updates.
- Backed by the Cognito Post Confirmation trigger for initial user record creation.

### 4.2 Menu Service

- Exposes `GET /menu` publicly for browsing (no authentication required).
- Provides staff-only endpoints for menu item management (add/edit/remove items, categories).
- Menu search and category filtering are implemented client-side rather than via query parameters, since the full menu is small enough to fetch and filter in the browser.
- A dedicated uploads Lambda issues presigned S3 PUT URLs so the frontend can upload menu item images directly to S3 without routing image bytes through API Gateway/Lambda.
- Images are stored in the `starbuzz-menu-items` S3 bucket (`ap-southeast-1` region), under the `menu/` prefix.

### 4.3 Order Service

- Handles order creation, retrieval (customer order history), and updates.
- Customers can update `order_type` and `table_number` after order creation via a patch to the orders Lambda.
- Exposes `GET /orders/board` for staff — a dedicated endpoint added specifically to resolve a performance issue (see §8.2).
- The staff order board originally polled this endpoint on an interval; polling was removed in favour of a manual Refresh button to reduce unnecessary load and cost.

### 4.4 Cross-Cutting Backend Concerns

- Inter-service communication: the Order service calls the Menu Service API (rather than duplicating menu data) to validate items and prices at order time.
- All Lambda functions are written in Node.js; API Gateway is configured as an HTTP API (not REST API) for lower cost and latency.
- SES is integrated for transactional email sending tied to account/order events.

---

## 5. Data Storage

StarBuzz uses a polyglot persistence approach: DynamoDB for access patterns that favour key-value lookups (e.g. menu items), and RDS MySQL where relational integrity and joins are more natural (e.g. orders and users).

### 5.1 Notable Schema Decision — `table_number`

The `table_number` column is deliberately overloaded: for dine-in orders it stores the physical table number, and for takeaway orders it stores the buzzer number handed to the customer. The column is required for both order types rather than being split into two nullable columns, keeping the order schema simpler at the cost of the field's name being slightly misleading outside this context.

---

## 6. Frontend

The frontend is a multi-page static site built with plain HTML, CSS, and JavaScript — deliberately without a framework — and is hosted on S3 behind CloudFront. During development it is served locally on port 8000.

### 6.1 Pages

| Page | Purpose |
|---|---|
| `index.html` | Login / Cognito OAuth callback handling |
| `menu.html` | Browse menu items, client-side search/filter by category |
| `item.html` | View a single menu item's details |
| `cart.html` | Review cart contents before checkout |
| `orders.html` | Customer order history |
| `account.html` | Customer account/profile management |
| `manage_orders.html` | Staff order fulfilment board |
| `manage_menu.html` | Staff menu management (list/overview) |
| `manage_menu_details.html` | Staff — add/edit a single menu item, including image upload |

Shared JavaScript modules handle configuration, authentication (token storage and attachment to API calls), and cart logic, so each page doesn't duplicate that logic.

### 6.2 Client-Side State

- The cart is stored in the browser's `localStorage` as an array of objects: `[{ item_id, quantity }]`, persisting across page loads without a server round-trip.
- Menu search and category filtering are performed client-side against the already-fetched menu list, rather than issuing new filtered requests to the API.

---

## 7. Key Design Decisions & Deviations

| Decision | Rationale |
|---|---|
| Client-side filtering instead of server-side query params | Menu size is small enough that fetching once and filtering locally is simpler and reduces API calls |
| `table_number` dual-purpose field | Avoids two mutually-exclusive nullable columns for dine-in table vs takeaway buzzer number |
| Manual Refresh instead of polling on the staff order board | Polling caused unnecessary load; a dedicated `/orders/board` endpoint plus manual refresh was simpler and cheaper than adding WebSockets |
| Presigned S3 URLs for image upload | Avoids routing binary image data through API Gateway/Lambda |
| No client secret on the Cognito App Client | Required for a browser-based public client using the Authorization Code flow |
| Review service dropped | Was proposed early on but never implemented — final scope is User, Menu, and Order only |

A full account of deviations from the original proposal is maintained separately in the project's deviations report, produced for academic submission alongside this documentation.

---

## 8. Challenges & Debugging

### 8.1 IAM Policy Issues

Lambda execution roles required careful scoping to DynamoDB, RDS, S3, and SES actions. Overly broad or missing permissions surfaced as opaque `AccessDenied` errors during integration testing and had to be traced back to the specific IAM policy statement missing the required action or resource ARN.

### 8.2 N+1 Request Bottleneck (Staff Order Board)

The staff order board initially issued a separate request per order to resolve related data, producing an N+1 query pattern that degraded under load. This was resolved by introducing a dedicated `GET /orders/board` endpoint that returns the aggregated data the board needs in a single call, and by replacing interval polling with a manual Refresh button.

### 8.3 GTID Import Errors

Importing data into RDS MySQL hit GTID (Global Transaction Identifier)-related errors during migration/import, which had to be worked around to get a clean baseline dataset into the relational store.

### 8.4 UUID / String Key Mismatches

Inconsistent handling of UUID values as native UUIDs versus plain strings across services caused key-matching failures between DynamoDB and RDS records; resolving this required standardising on a single representation across the codebase.

### 8.5 Inter-Service Communication

Coordinating calls from the Order service to the Menu service's API (for item/price validation) required handling latency and failure cases gracefully rather than assuming the downstream call always succeeds.

---

## 9. Testing

A dedicated testing guide was produced for academic submission, covering functional test cases for both customer and staff flows. At a high level, testing covers:

- Customer flows: browsing the public menu, adding/removing cart items, placing dine-in and takeaway orders, viewing order history, updating account details and password.
- Staff flows: adding/editing/removing menu items (including image upload), viewing the order board, updating order status, and updating a customer's table/buzzer number or order type on their behalf.
- Authorization checks: confirming staff-only endpoints reject customer-role tokens, and that `GET /menu` remains accessible without a token.
- Edge cases arising from the debugging history above: UUID/string key handling, IAM permission boundaries, and order board data consistency after the `/orders/board` endpoint was introduced.

---

## 10. Deployment & Setup

### 10.1 Backend

- Deploy each service's Lambda function (User, Menu, Order, plus the uploads and Post Confirmation trigger Lambdas).
- Configure API Gateway HTTP API routes to point to the corresponding Lambda integrations.
- Provision the Cognito User Pool and App Client (no client secret), and register the required callback URL(s).
- Provision DynamoDB tables and the RDS MySQL instance, and apply the schema/data dictionary.
- Create the `starbuzz-menu-items` S3 bucket in `ap-southeast-1` with the `menu/` prefix for images, and configure SES for outbound email.

### 10.2 Frontend

- For local development, serve the frontend directory on port 8000 and ensure `http://localhost:8000` is a registered Cognito callback URL.
- For production, upload the static site to the S3 hosting bucket and serve it through CloudFront.
- Update the shared frontend config module with the deployed API Gateway base URL and Cognito App Client details.

---

## 11. Screenshots — UI Walkthrough

The following screenshots show the deployed application (served via CloudFront/S3, with Cognito-hosted authentication).

### 11.1 Authentication

![Sign in](images/projects/Starbuzz/01-signin.png)
*Cognito-hosted sign-in page, customized with StarBuzz branding.*

![Sign up](images/projects/Starbuzz/02-signup.png)
*Cognito-hosted sign-up page for creating a new customer account.*

### 11.2 Customer Flows

![Menu](images/projects/Starbuzz/03-menu.png)
*`menu.html` — customers browse menu items by category and add them to the cart.*

![Cart](images/projects/Starbuzz/04-cart.png)
*`cart.html` — order summary with quantity adjustment and dine-in/takeaway selection before placing an order.*

![My Orders — edit](images/projects/Starbuzz/05-my-orders-edit.png)
*`orders.html` — customer editing the items of a still-pending order.*

![My Orders — history](images/projects/Starbuzz/06-my-orders-history.png)
*`orders.html` — full customer order history with status, type, and edit/cancel actions.*

### 11.3 Staff Flows

![Staff order board](images/projects/Starbuzz/07-staff-order-board.png)
*`manage_orders.html` — staff order board showing active orders with a Mark as Pending action.*

![Staff menu management](images/projects/Starbuzz/08-staff-menu-management.png)
*`manage_menu.html` — staff menu management with search, category filters, and edit/delete actions.*

---

## 12. Future Considerations

- Real-time order board updates (e.g. WebSockets/API Gateway WebSocket API) instead of manual refresh, if load justifies it.
- Payment processing integration, currently out of scope.
- Automated test coverage beyond the manual testing guide produced for this submission.