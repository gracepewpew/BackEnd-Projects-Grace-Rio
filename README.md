# Amoxicillin - Smart Health Management System


Course: Pengembangan Web Back-End
Theme: Smart Health  
Team Members:
- Rio Frederich - 211112075
- Grace Putri Wijaya - 211110121

Installation & Setup

Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Git

Installation Steps

1. Clone the repository:
   ```bash
   git clone [your-github-repo-url]
   cd Amoxicillin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup MySQL Database:
   - Install MySQL Server on your system
   - Create a database named `amoxicillin_health`
   - Update database credentials in `config/database.js` if needed

4. Start the server:
   ```bash
   npm start
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - API Base URL: http://localhost:3000

 🏗️ Project Structure

```
Amoxicillin/
├── config/
│   └── database.js          # Database configuration
├── models/
│   └── HealthModel.js       # Health data model
├── routes/
│   ├── authroutes.js        # Authentication routes
│   ├── healthroutes.js      # Health records routes
│   ├── inquiryroutes.js     # Patient inquiries routes
│   ├── kunjunganroutes.js   # Visit/appointment routes
│   ├── medicinesroutes.js   # Medicine management routes
│   └── adjustroutes.js      # Medicine adjustment routes
├── FrontEnd/
│   ├── *.html               # Frontend pages
│   ├── *.css                # Stylesheets
│   └── *.js                 # Frontend scripts
├── data/                    # Legacy JSON data (for migration)
├── images/                  # Static images
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md               # This file
```

Test Accounts

Admin/Doctor Accounts
- Email: dadas@gmail.com | Password: terserah | Role: doctor
- Email: dummy1@gmail.com | Password: helloworld | Role: doctor

Patient Accounts
- Email: Emily@gmail.com | Password: whatever | Role: patient

API Documentation

Authentication Endpoints

 POST /auth/register
Register a new user.

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "role": "patient",
  "password": "password123",
  "ktp": "1234567890123456"
}
```

Response (201):
```json
{
  "message": "Registrasi berhasil",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

 POST /auth/login
Login user.

Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "patient"
}
```

Response (200):
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

 GET /auth/profile
Get user profile (requires authentication).

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "phone": "08123456789",
    "ktp": "1234567890123456",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Health Records Endpoints

 GET /health
Get all health records with pagination and filtering.

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by BMI category (Kurus, Normal, Gemuk, Obesitas)
- `minAge` (number): Minimum age filter
- `maxAge` (number): Maximum age filter
- `userId` (number): Filter by user ID

Example: `/health?page=1&limit=5&category=Normal`

Response (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 30,
      "height": 170.0,
      "weight": 70.0,
      "bmi": "24.22",
      "category": "Normal",
      "userId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

 POST /health
Create new health record.

Request Body:
```json
{
  "name": "John Doe",
  "age": 30,
  "height": 170.0,
  "weight": 70.0,
  "userId": 1
}
```

 GET /health/:id
Get specific health record.

 PUT /health/:id
Update health record.

 DELETE /health/:id
Delete health record.

Error Response Format

Validation Error (400):
```json
{
  "message": "Semua field wajib diisi"
}
```

Not Found (404):
```json
{
  "message": "Data tidak ditemukan"
}
```

Server Error (500):
```json
{
  "message": "Terjadi kesalahan server"
}
```

Technologies Used

- Backend: Node.js, Express.js
- Database: MySQL
- Frontend: HTML, CSS, JavaScript
- Architecture: RESTful API with MVC pattern

Key Features

- ✅ User Authentication & Authorization
- ✅ Health Records Management (BMI Calculator)
- ✅ Patient-Doctor Communication
- ✅ Medicine Inventory Management
- ✅ Appointment Scheduling
- ✅ Pagination & Filtering
- ✅ Responsive Frontend
- ✅ Error Handling & Validation

Development Notes

- Database automatically initializes on first run
- Password hashing should be implemented in production
- JWT tokens are simplified for demonstration
- All routes include proper error handling
- Frontend uses vanilla JavaScript for simplicity

Demo Video
https://drive.google.com/file/d/1sFvU4JkggA2ynHDqK-_xWJf86equeVqr/view?usp=sharing