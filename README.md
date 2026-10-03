# Campus Trade Backend

REST API powering Campus Trade, a full-stack marketplace designed for students to buy and sell products within a campus community.

## Overview

Campus Trade provides a backend service for managing users, products, authentication, and marketplace interactions.

The backend follows a modular architecture separating routing, controllers, services, models, middleware, and configuration.

## Features

* JWT-based authentication
* User registration and login
* Protected API routes
* Product creation and management
* Product ownership and authorization
* Marketplace data management
* MongoDB persistence
* RESTful API architecture
* Middleware-based request processing
* Real-time communication
* Automated tests
* Deployment configuration

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* JavaScript
* Socket.IO
* Jest
* GitHub
* Render

## Architecture

The application separates responsibilities across controllers, services, models, routes, middleware, and utilities.

```text
Client
   |
   v
Express API
   |
   +---- Middleware
   |
   +---- Controllers
   |
   +---- Services
   |
   v
MongoDB
```

Real-time functionality is handled separately through the socket layer.

## Project Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── socket/
├── utils/
└── ...
```

## Getting Started

### Prerequisites

* Node.js
* npm
* MongoDB

### Installation

```bash
git clone https://github.com/nunu-e/campus-trade-backend.git
cd campus-trade-backend
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`.

```env
PORT=
MONGO_URI=
JWT_SECRET=
```

Never commit real credentials or secrets.

### Run Locally

```bash
npm run dev
```

## API

The API provides endpoints for authentication, users, products, and marketplace functionality.

Refer to the source routes and API documentation for the complete endpoint list.

## Testing

Run the test suite with:

```bash
npm test
```

## Deployment

The backend includes deployment configuration for hosting as a Node.js service.

## Engineering Notes

The backend uses separation of concerns between HTTP handling, business logic, persistence, and supporting services.

Authentication and authorization are implemented through middleware and JWT-based access control.

## Future Improvements

* Expand automated test coverage
* Improve API documentation
* Add additional observability and logging
* Introduce more comprehensive integration testing

## License

This project is for educational and portfolio purposes.
