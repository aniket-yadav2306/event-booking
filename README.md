Event Booking System
A backend API project built as part of a selection test for a Junior Node.js Developer role. The system allows users to browse events, book tickets, and check in using a unique confirmation code.

Built with Node.js, Express, and MySQL.

Why I Built It This Way
I kept the structure simple but production-minded. Controllers handle business logic, routes handle HTTP concerns, and middleware handles validation and errors — nothing bleeds into each other.

For the booking flow, I used a MySQL transaction with SELECT ... FOR UPDATE to lock the event row before checking ticket availability. This prevents two users from booking the last ticket at the same time. I've seen this issue cause real problems in production systems, so I wanted to handle it properly from the start.

Each booking gets a UUID v4 as a confirmation code — simple, unique, and easy to validate at check-in.

Tech Used
Node.js + Express — API server
MySQL 8 via mysql2 (promise-based, connection pooling)
express-validator — request validation
uuid — confirmation code generation
swagger-ui-express + YAML — API documentation
Docker + Docker Compose — containerized setup
Project Structure
event-booking/ ├── src/ │ ├── app.js # Entry point │ ├── config/ │ │ └── db.js # MySQL connection pool │ ├── controllers/ │ │ ├── eventController.js │ │ ├── bookingController.js │ │ └── attendanceController.js │ ├── routes/ │ │ ├── eventRoutes.js │ │ ├── bookingRoutes.js │ │ └── userRoutes.js │ └── middleware/ │ ├── errorHandler.js │ └── validate.js ├── docs/ │ └── swagger.yaml # OpenAPI 3.0 spec ├── schema.sql ├── postman_collection.json ├── Dockerfile ├── docker-compose.yml ├── .env.example └── README.md

Setup
Option 1 — Docker (easiest)
Make sure Docker Desktop is running, then:

bash git clone cd event-booking docker compose up --build

That's it. MySQL and the API both start automatically.

API → http://localhost:3000
Swagger → http://localhost:3000/api-docs
To stop: bash docker compose down

Option 2 — Run Locally
Requirements: Node.js 18+, MySQL 8

1. Install packages bash npm install

2. Create your .env file bash cp .env.example .env

Fill in your MySQL credentials in .env:

PORT=3000 DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD=your_password DB_NAME=event_booking

3. Set up the database

On Linux/Mac: bash mysql -u root -p < schema.sql

On Windows (PowerShell): powershell Get-Content schema.sql | mysql -u root -p

This creates the database, all 4 tables, and inserts sample data.

4. Start the server bash npm start

You should see:

Server running on http://localhost:3000 Swagger docs at http://localhost:3000/api-docs

API Endpoints
Method  Endpoint  Description
GET  /events  List upcoming events
POST  /events  Create a new event
POST  /bookings  Book a ticket
GET  /users/:id/bookings  Get a user's bookings
POST  /events/:id/attendance  Check in with confirmation code
GET  /health  Health check
Full interactive docs at http://localhost:3000/api-docs

How the Booking Flow Works
1. GET /events              → pick an event id
2. POST /bookings           → book a ticket, get confirmation_code
3. GET /users/1/bookings    → verify the booking exists
4. POST /events/1/attendance → check in using the confirmation_code
Race Condition Handling
The booking endpoint wraps everything in a transaction:

BEGIN
  SELECT * FROM events WHERE id = ? FOR UPDATE  -- locks the row
  UPDATE events SET remaining_tickets = remaining_tickets - ?
  INSERT INTO bookings ...
COMMIT
This means even if 100 requests hit at the same time, only the correct number of tickets will be booked.

Testing with Postman
Import postman_collection.json into Postman. The collection is set up so the confirmation code from the booking request is automatically saved and used in the check-in request.

Submission Checklist
 GitHub repository
 README with setup instructions
 schema.sql with seed data
 docs/swagger.yaml — OpenAPI 3.0
 postman_collection.json
 Docker support (bonus)
