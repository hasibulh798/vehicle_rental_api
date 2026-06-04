# 🚗 Vehicle Rental Management System

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg?style=flat-square)](https://nodejs.org/)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-v5-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Express.js Version](https://img.shields.io/badge/Express.js-v5-lightgrey.svg?style=flat-square)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-blue.svg?style=flat-square)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A complete, production-ready backend API for managing a **Vehicle Rental Service** built with Node.js, TypeScript, and raw PostgreSQL. This system provides secure JWT authentication, role-based authorization, vehicle inventory control, and booking lifecycle automation with dynamic price calculation.

### 🔗 Live API Endpoint
The backend service is configured and deployed to Vercel:
* **Production Live URL:** `https://vehicle-rental-system-kis4o1frl.vercel.app`
* **Base Endpoint Path:** `https://vehicle-rental-system-kis4o1frl.vercel.app/api/v1`

---

## 📌 Overview

This project implements a **modular, service-oriented backend architecture** designed with a clear Separation of Concerns. The app flows seamlessly through the following layers:
$$\text{HTTP Request} \rightarrow \text{Express Router} \rightarrow \text{Authentication/Validation Middlewares} \rightarrow \text{Controller Layer} \rightarrow \text{Service Layer} \rightarrow \text{PostgreSQL Database}$$

### 🔥 Key Features
- 🔐 **Secure Authentication:** Password hashing using `bcrypt` and session authorization via `jsonwebtoken` (JWT).
- 👥 **Role-Based Access Control:** Separate access restrictions for `admin` and `customer` roles.
- 🚘 **Vehicle Inventory CRUD:** Management of rental vehicles with validation constraints on types, prices, and status.
- 📅 **Dynamic Booking Flow:** Automatic calculation of booking fees based on rental duration and vehicle daily rates. Includes real-time status checking (making vehicles unavailable when booked and restoring availability upon return or cancellation).
- 🛡️ **Relational Integrity Protection:** Users and vehicles cannot be deleted if active bookings are tied to them.
- ⚡ **Optimized Queries:** All list endpoints use clean PostgreSQL `JOIN` operations to minimize database roundtrips.

---

## 🛠️ Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/) (v5.x)
- **Web Framework:** [Express.js](https://expressjs.com/) (v5.x)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Hosted on Neon Tech)
- **Database Driver:** [pg (node-postgres)](https://node-postgres.com/)
- **Encryption & Tokens:** [bcrypt](https://github.com/kelektiv/node.bcrypt.js) & [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- **Development Tooling:** [tsx](https://github.com/privatenumber/tsx) (TypeScript Execute), [typescript compiler (tsc)](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

---

## 📁 Project Structure

The project follows a **modular structure by domain features**, making it highly maintainable and scalable.

```filepath
src/
├── config/
│   └── index.ts                 # Environment configurations
├── database/
│   └── db.ts                    # PostgreSQL Pool & Schema Initializer
├── middleware/
│   └── auth.ts                  # JWT authentication & authorization middleware
├── module/
│   ├── auth/                    # Sign-up & Sign-in endpoints
│   │   ├── auth.controller.ts
│   │   ├── auth.route.ts
│   │   └── auth.service.ts
│   ├── bookings/                # Renting, returning & cancellation lifecycle
│   │   ├── booking.controller.ts
│   │   ├── booking.route.ts
│   │   └── booking.service.ts
│   ├── users/                   # Profile updates, list & deletion
│   │   ├── user.controller.ts
│   │   ├── user.route.ts
│   │   └── user.service.ts
│   └── vehicles/                # Inventory management
│       ├── vehicle.controller.ts
│       ├── vehicle.route.ts
│       └── vehicle.service.ts
├── types/
│   └── express/
│       └── index.d.ts           # Type extensions for Express Request object
└── server.ts                    # Application entrypoint
```

---

## 🗄️ Database Schema

The database relies on three relational tables initialized on startup:

### 1. `users` Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL CHECK (email = LOWER(email)),
    password TEXT NOT NULL CHECK (LENGTH(password) >= 6),
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'customer'))
);
```

### 2. `vehicles` Table
```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('car', 'bike', 'van', 'SUV')),
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    daily_rent_price INT NOT NULL CHECK (daily_rent_price > 0),
    availability_status VARCHAR(20) NOT NULL CHECK (availability_status IN ('available', 'booked'))
);
```

### 3. `bookings` Table
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    rent_start_date DATE NOT NULL,
    rent_end_date DATE NOT NULL CHECK (rent_end_date > rent_start_date),
    total_price INT NOT NULL CHECK (total_price > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'returned'))
);
```

---

## ⚙️ Setup & Installation

### **1. Clone the Repository**
```bash
git clone https://github.com/hasibulh798/Vehicle_Rental_System_API.git
cd Vehicle_Rental_System
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file in the root directory:
```env
PORT=5000
CONNECTION_STRING=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=your_jwt_secret_key
```

### **4. Start the Application**
* **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```
* **Production Build & Run:**
  ```bash
  npm run build
  npm start
  ```

---

## 🔒 Authentication Header Format

All protected endpoints require the client to supply the JWT token inside the HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 📖 API Reference Specification

### 🔐 Authentication

#### 1. User Registration
* **Endpoint:** `POST /api/v1/auth/signup`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "phone": "01712345678",
    "role": "customer"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "01712345678",
      "role": "customer"
    }
  }
  ```

#### 2. User Login
* **Endpoint:** `POST /api/v1/auth/signin`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "role": "customer"
      }
    }
  }
  ```

---

### 🚗 Vehicle Inventory Management

#### 3. Create Vehicle
* **Endpoint:** `POST /api/v1/vehicles`
* **Access:** Admin only
* **Request Body:**
  ```json
  {
    "vehicle_name": "Toyota Camry 2024",
    "type": "car",
    "registration_number": "ABC-1234",
    "daily_rent_price": 50,
    "availability_status": "available"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Vehicle created successfully",
    "data": {
      "id": 1,
      "vehicle_name": "Toyota Camry 2024",
      "type": "car",
      "registration_number": "ABC-1234",
      "daily_rent_price": 50,
      "availability_status": "available"
    }
  }
  ```

#### 4. Get All Vehicles
* **Endpoint:** `GET /api/v1/vehicles`
* **Access:** Public
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vehicles retrieved successfully",
    "data": [
      {
        "id": 1,
        "vehicle_name": "Toyota Camry 2024",
        "type": "car",
        "registration_number": "ABC-1234",
        "daily_rent_price": 50,
        "availability_status": "available"
      }
    ]
  }
  ```

#### 5. Get Vehicle by ID
* **Endpoint:** `GET /api/v1/vehicles/:vehicleId`
* **Access:** Public
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vehicle retrieved successfully",
    "data": {
      "id": 2,
      "vehicle_name": "Honda Civic 2023",
      "type": "car",
      "registration_number": "XYZ-5678",
      "daily_rent_price": 45,
      "availability_status": "available"
    }
  }
  ```

#### 6. Update Vehicle
* **Endpoint:** `PUT /api/v1/vehicles/:vehicleId`
* **Access:** Admin only
* **Request Body (All fields optional):**
  ```json
  {
    "daily_rent_price": 55,
    "vehicle_name": "Toyota Camry 2024 Premium"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vehicle updated successfully",
    "data": {
      "id": 1,
      "vehicle_name": "Toyota Camry 2024 Premium",
      "type": "car",
      "registration_number": "ABC-1234",
      "daily_rent_price": 55,
      "availability_status": "available"
    }
  }
  ```

#### 7. Delete Vehicle
* **Endpoint:** `DELETE /api/v1/vehicles/:vehicleId`
* **Access:** Admin only (permitted only if no active bookings exist)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vehicle deleted successfully"
  }
  ```

---

### 👥 User Administration

#### 8. Get All Users
* **Endpoint:** `GET /api/v1/users`
* **Access:** Admin only
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "role": "customer"
      }
    ]
  }
  ```

#### 9. Update User
* **Endpoint:** `PUT /api/v1/users/:userId`
* **Access:** Admin or Account Owner (Customers can only edit their own profile details and cannot alter their role status)
* **Request Body (All fields optional):**
  ```json
  {
    "name": "John Doe Updated",
    "phone": "+1234567899"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "id": 1,
      "name": "John Doe Updated",
      "email": "john.doe@example.com",
      "phone": "+1234567899",
      "role": "customer"
    }
  }
  ```

#### 10. Delete User
* **Endpoint:** `DELETE /api/v1/users/:userId`
* **Access:** Admin only (permitted only if the user has no active bookings)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```

---

### 📅 Booking Lifecycle

#### 11. Create Booking
* **Endpoint:** `POST /api/v1/bookings`
* **Access:** Customer or Admin
* **Request Body:**
  ```json
  {
    "customer_id": 1,
    "vehicle_id": 2,
    "rent_start_date": "2024-01-15",
    "rent_end_date": "2024-01-20"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": {
      "id": 1,
      "customer_id": 1,
      "vehicle_id": 2,
      "rent_start_date": "2024-01-15",
      "rent_end_date": "2024-01-20",
      "total_price": 250,
      "status": "active",
      "vehicle": {
        "vehicle_name": "Honda Civic 2023",
        "daily_rent_price": 45
      }
    }
  }
  ```

#### 12. Get All Bookings
* **Endpoint:** `GET /api/v1/bookings`
* **Access:** Authenticated (Role-based filters applied automatically)
* **Response (200 OK - Admin View):**
  ```json
  {
    "success": true,
    "message": "Bookings retrieved successfully",
    "data": [
      {
        "id": 1,
        "customer_id": 1,
        "vehicle_id": 2,
        "rent_start_date": "2024-01-15",
        "rent_end_date": "2024-01-20",
        "total_price": 250,
        "status": "active",
        "customer": {
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "vehicle": {
          "vehicle_name": "Honda Civic 2023",
          "registration_number": "XYZ-5678"
        }
      }
    ]
  }
  ```
* **Response (200 OK - Customer View):**
  ```json
  {
    "success": true,
    "message": "Your bookings retrieved successfully",
    "data": [
      {
        "id": 1,
        "vehicle_id": 2,
        "rent_start_date": "2024-01-15",
        "rent_end_date": "2024-01-20",
        "total_price": 250,
        "status": "active",
        "vehicle": {
          "vehicle_name": "Honda Civic 2023",
          "registration_number": "XYZ-5678",
          "type": "car"
        }
      }
    ]
  }
  ```

#### 13. Update Booking Status (Cancel/Return)
* **Endpoint:** `PUT /api/v1/bookings/:bookingId`
* **Access:** Authenticated (Customers can cancel own active bookings; Admins mark active bookings as returned)
* **Request Body (Customer Cancellation):**
  ```json
  {
    "status": "cancelled"
  }
  ```
* **Response (200 OK - Cancelled):**
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully",
    "data": {
      "id": 1,
      "customer_id": 1,
      "vehicle_id": 2,
      "rent_start_date": "2024-01-15",
      "rent_end_date": "2024-01-20",
      "total_price": 250,
      "status": "cancelled"
    }
  }
  ```
* **Request Body (Admin Mark as Returned):**
  ```json
  {
    "status": "returned"
  }
  ```
* **Response (200 OK - Returned):**
  ```json
  {
    "success": true,
    "message": "Booking marked as returned. Vehicle is now available",
    "data": {
      "id": 1,
      "customer_id": 1,
      "vehicle_id": 2,
      "rent_start_date": "2024-01-15",
      "rent_end_date": "2024-01-20",
      "total_price": 250,
      "status": "returned",
      "vehicle": {
        "availability_status": "available"
      }
    }
  }
  ```

---

## 🚫 Standard Error Handling Response

When an error occurs, the server responds with a clear representation containing both `message` and `errors` descriptions matching the response structure below:

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error description"
}
```

### HTTP Status Code Usage:
| HTTP Status | Meaning | Usage Scenario |
|---|---|---|
| **200** | OK | Successful `GET`, `PUT`, `DELETE` operations |
| **210** | Created | Successful `POST` operations (Resource created) |
| **400** | Bad Request | Validation errors, invalid format, constraint violation |
| **401** | Unauthorized | Missing or invalid authentication token |
| **403** | Forbidden | Valid token, but account has insufficient role permissions |
| **404** | Not Found | Target resource does not exist |
| **500** | Server Error | Internal Server Error |

---

## 🚀 Deployment (Vercel)

The project includes a `vercel.json` file configuring build routing to deploy the backend serverless function. To deploy it:

1. **Install Vercel CLI:** `npm i -g vercel`
2. **Log In:** `vercel login`
3. **Deploy:** `vercel --prod`
4. Add environment variables (`CONNECTION_STRING`, `JWT_SECRET`, `PORT`) in the Vercel Dashboard project settings.

---

## 🤝 Contributing

1. Fork the Repository.
2. Create your Feature Branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the Branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
