# Campus Trade (Backend)

## Overview
Backend API for Campus Trade marketplace platform. Handles authentication, users, and product management.

## Features
- User authentication (JWT)
- CRUD operations for products
- Secure API routes
- User management
- Image upload support (if used)

## Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT

## Setup Instructions
git clone https://github.com/nunu-e/campus-trade-backend.git  
cd campus-trade-backend  
npm install  
npm run dev  


## Environment Variables

Create a `.env` file in the root directory and add:

MONGO_URI=your_mongodb_connection_string  
PORT=5000  
JWT_SECRET=your_secret_key 

## API Endpoints
- POST /api/auth/register  
- POST /api/auth/login  
- GET /api/products  
- POST /api/products  
- DELETE /api/products/:id  

## Future Improvements
- Real-time chat
- Advanced filtering
- Payment integration
