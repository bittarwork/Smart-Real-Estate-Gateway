# Real Estate Company Website - Comprehensive Project Documentation

## 📋 Project Overview

### Project Name

**Smart Real Estate Gateway**

### Description

A comprehensive real estate company website serving two main user groups:

- **Clients**: Browse, search, and inquire about properties
- **Administrators**: Manage properties, content, and inquiries

---

## 🎯 Goals and Features

### For Clients (Customers)

- ✅ Interactive property browsing
- ✅ Advanced search and filtering
- ✅ Property details with images and maps
- ✅ Favorites system and property comparison
- ✅ Viewing requests and inquiries
- ✅ Mortgage calculator
- ✅ Rating and review system
- ✅ Social media property sharing

### For Administrators

- ✅ Comprehensive dashboard with statistics
- ✅ Property management (add/edit/delete)
- ✅ Inquiry and response management
- ✅ Website content and blog management
- ✅ Detailed performance reports

---

## 🛠 Technologies Used

### Frontend

- **React.js 18** - User interface library
- **React Router** - Page navigation
- **Axios** - HTTP requests
- **Bootstrap 5** - UI framework
- **React Icons** - Icon library
- **Chart.js** - Data visualization
- **Google Maps API** - Map integration

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication and security
- **Multer** - File upload handling
- **Nodemailer** - Email sending
- **bcrypt** - Password encryption

### Development Tools

- **VS Code** - Code editor
- **Postman** - API testing
- **Git/GitHub** - Version control
- **npm** - Package manager

---

## 🏗 Project Structure

### Frontend Structure

```
client/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js
│   │   │   ├── Footer.js
│   │   │   ├── Loading.js
│   │   │   └── Pagination.js
│   │   ├── property/
│   │   │   ├── PropertyCard.js
│   │   │   ├── PropertyList.js
│   │   │   ├── PropertyDetails.js
│   │   │   ├── PropertyGallery.js
│   │   │   ├── PropertySearch.js
│   │   │   └── PropertyFilter.js
│   │   ├── forms/
│   │   │   ├── ContactForm.js
│   │   │   ├── InquiryForm.js
│   │   │   └── ViewingRequest.js
│   │   └── admin/
│   │       ├── AdminLayout.js
│   │       ├── PropertyForm.js
│   │       └── Dashboard.js
│   ├── pages/
│   │   ├── client/
│   │   │   ├── Home.js
│   │   │   ├── Properties.js
│   │   │   ├── PropertyDetail.js
│   │   │   ├── About.js
│   │   │   └── Contact.js
│   │   └── admin/
│   │       ├── AdminDashboard.js
│   │       ├── ManageProperties.js
│   │       └── ManageInquiries.js
│   ├── utils/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── helpers.js
│   ├── styles/
│   │   └── main.css
│   └── App.js
└── package.json
```

### Backend Structure

```
server/
├── models/
│   ├── Property.js
│   ├── Inquiry.js
│   ├── User.js
│   └── Review.js
├── routes/
│   ├── auth.js
│   ├── properties.js
│   ├── inquiries.js
│   └── admin.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── controllers/
│   ├── propertyController.js
│   └── inquiryController.js
├── utils/
│   ├── email.js
│   └── validation.js
├── config/
│   └── database.js
├── uploads/
└── server.js
```

---

## 💾 Database Design

### Property Schema

```javascript
{
  title: String,              // Property title
  description: String,        // Detailed description
  price: Number,             // Price
  location: String,          // Location
  coordinates: {             // Map coordinates
    lat: Number,
    lng: Number
  },
  type: String,              // Property type (apartment, villa, office)
  category: String,          // For sale or rent
  bedrooms: Number,          // Number of bedrooms
  bathrooms: Number,         // Number of bathrooms
  area: Number,              // Area in square meters
  images: [String],          // Image paths
  features: [String],        // Features (pool, garden...)
  isFeatured: Boolean,       // Featured property
  isAvailable: Boolean,      // Available for display
  views: Number,             // View count
  averageRating: Number,     // Average rating
  ratingsCount: Number,      // Number of ratings
  createdAt: Date,
  updatedAt: Date
}
```

### Inquiry Schema

```javascript
{
  name: String,              // Inquirer name
  email: String,             // Email address
  phone: String,             // Phone number
  message: String,           // Inquiry message
  propertyId: ObjectId,      // Property ID
  type: String,              // Inquiry type
  status: String,            // Inquiry status
  adminReply: String,        // Admin response
  createdAt: Date
}
```

### User Schema (Admin)

```javascript
{
  username: String,
  email: String,
  password: String,          // Encrypted
  role: String,              // admin
  createdAt: Date
}
```

### Review Schema

```javascript
{
  propertyId: ObjectId,
  rating: Number,            // 1-5 stars
  comment: String,
  reviewerName: String,
  reviewerEmail: String,
  createdAt: Date
}
```

---

## 🔗 Application Programming Interfaces (APIs)

### Property APIs

```javascript
GET    /api/properties           // Get all properties
GET    /api/properties/:id       // Get specific property
POST   /api/properties           // Add new property (Admin)
PUT    /api/properties/:id       // Update property (Admin)
DELETE /api/properties/:id       // Delete property (Admin)
GET    /api/properties/search    // Search and filter
GET    /api/properties/featured  // Featured properties
```

### Inquiry APIs

```javascript
GET    /api/inquiries            // Get inquiries (Admin)
POST   /api/inquiries            // Send inquiry
PUT    /api/inquiries/:id        // Update inquiry status (Admin)
DELETE /api/inquiries/:id        // Delete inquiry (Admin)
```

### Auth APIs

```javascript
POST / api / auth / login; // Admin login
POST / api / auth / logout; // Logout
GET / api / auth / verify; // Verify session
```

### Review APIs

```javascript
GET    /api/reviews/:propertyId  // Get property reviews
POST   /api/reviews              // Add review
```

---

## ⚙️ System Workflow

### 1. Property Display for Clients

```
User enters website
↓
Load homepage
↓
Display featured properties from database
↓
Search and filter functionality
↓
Display results with pagination
```

### 2. Property Details

```
User clicks on property
↓
Fetch property details from database
↓
Display images, information, and map
↓
Update view count
↓
Show similar properties
```

### 3. Property Management (Admin)

```
Admin logs in
↓
Verify JWT Token
↓
Display dashboard
↓
Add/edit/delete properties
↓
Upload images to server
↓
Save data to database
```

### 4. Inquiry System

```
Client fills inquiry form
↓
Send data to server
↓
Save to database
↓
Send notification to admin (email)
↓
Admin responds to inquiry
↓
Send response to client (email)
```

---

## 📊 Advanced Features

### 1. Search and Filter System

- Text search in title and description
- Filter by type (apartment, villa...)
- Filter by category (sale, rent)
- Filter by price range
- Filter by area
- Sort results (price, date, area)

### 2. Mortgage Calculator

```javascript
// Example monthly payment calculation
const calculateMonthlyPayment = (principal, rate, years) => {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = years * 12;
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  return monthlyPayment;
};
```

### 3. Favorites System

- Save favorite properties in Local Storage
- Add/remove from favorites
- Display favorites list
- Share favorites list

### 4. Property Comparison

- Select up to 3 properties for comparison
- Display comparison in table format
- Compare price, area, specifications

---

## 🔒 Security and Protection

### 1. Password Encryption

```javascript
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Encrypt password
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. JWT Authentication

```javascript
const jwt = require("jsonwebtoken");

// Create Token
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// Verify Token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 3. XSS and SQL Injection Protection

- Input sanitization
- Using Mongoose ODM
- Sensitive data encryption

---

## 📅 Development Timeline (10 Weeks)

### Phase 1: Foundation (3 weeks)

**Week 1:**

- Development environment setup
- Create React and Express projects
- Database design

**Week 2:**

- Basic interface development
- Create Header/Footer components
- Homepage design

**Week 3:**

- Connect Frontend to Backend
- Create basic APIs
- Test database connection

### Phase 2: Property Functions (3 weeks)

**Week 4:**

- Property list display
- Develop PropertyCard and PropertyList
- Add pagination

**Week 5:**

- Property details page
- Image gallery
- Google Maps integration

**Week 6:**

- Search and filter system
- Favorites system
- Property comparison

### Phase 3: Admin Panel (2 weeks)

**Week 7:**

- Admin login system
- Main dashboard
- Property management (CRUD)

**Week 8:**

- Inquiry management
- Image upload system
- Statistics and reports

### Phase 4: Advanced Features (1 week)

**Week 9:**

- Mortgage calculator
- Review system
- Social media integration
- Email messaging system

### Phase 5: Testing and Deployment (1 week)

**Week 10:**

- Comprehensive system testing
- Bug fixes
- Performance optimization
- Server deployment

---

## 🚀 Deployment and Hosting

### Deployment Options

1. **Heroku** - Easy and free for small projects
2. **Vercel** - Excellent for React Applications
3. **AWS** - Advanced and flexible option
4. **DigitalOcean** - VPS with full control

### Deployment Requirements

- MongoDB Atlas (cloud database)
- Cloudinary or AWS S3 (image storage)
- Domain name
- SSL Certificate

---

## 📈 Future Enhancements

### Phase Two (Optional)

- React Native mobile app
- Referral and commission system
- CRM system integration
- Live chat customer service
- Appointment management system
- Advanced financial reports

---

## 📞 Support and Maintenance

### Developer Documentation

- Commented and organized code
- User manual
- Admin manual
- Deployment and maintenance guide

### Backup Strategy

- Daily database backups
- Image and file backups
- Emergency recovery plan

---

## 🚫 Excluded Features

- ❌ Virtual 360° tours
- ❌ Panoramic images
- ❌ Automatic notification system
- ❌ Online payment processing

---

## ✅ Confirmed Features

- ✅ Property display and management
- ✅ Advanced search and filtering
- ✅ Favorites and comparison system
- ✅ Comprehensive admin dashboard
- ✅ Inquiry and review system
- ✅ Mortgage calculator
- ✅ Maps and social media integration

---

_This document was prepared as a comprehensive guide for the real estate company website project_
_For updates and inquiries, please contact the development team_
