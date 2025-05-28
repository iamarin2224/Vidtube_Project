# VidTube - Backend API

VidTube is a YouTube-inspired video-sharing backend built using **Node.js**, **Express**, and **MongoDB**. It supports user authentication, video uploads, tweets, likes, comments, and subscriptions. This backend provides RESTful APIs and is designed to be scalable and modular.

---

## 🚀 Tech Stack

* **Backend Framework:** Node.js with Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **Authentication:** JWT + Cookies
* **File Uploads:** Cloudinary
* **Environment:** dotenv, nodemon for development

---

## 📁 Project Structure

```
src/
├── controllers/        # Logic for each route (videos, users, likes, etc.)
├── db/                 # MongoDB connection setup
├── middlewares/        # Auth and file upload handling
├── models/             # Mongoose schemas (User, Video, Tweet, etc.)
├── routes/             # Express routes for all resources
├── utils/              # Utility functions and helpers (ApiError, asyncHandler)
├── app.js              # Express app configuration
├── constants.js        # Constant values
└── index.js            # Entry point
```

---

## 📦 Installation

```bash
git clone <repo-url>
cd VidTube
npm install
```

---

## 🧪 Running the Server

```bash
npm run dev  # Starts the server using nodemon
```

The server will run on the port specified in your `.env` file (default: 8000).

---

## 🔐 Authentication

* JWT-based auth with access and refresh tokens.
* Auth tokens are stored in HTTP-only cookies.
* Middleware verifies the token and attaches the user to `req.user`.

---

## 📚 API Endpoints Summary

### HealthCheck

* `GET /api/healthcheck` – Check server status

### Users

* Register, login, logout, refresh token
* Update user info, avatar, and cover image
* Watch history and channel info

### Videos

* Upload, view, update, and delete videos
* Fetch details and user-uploaded videos

### Tweets

* Post, edit, and delete tweets

### Comments

* Comment on videos or tweets
* Edit/delete comments, fetch all

### Likes

* Like/unlike videos, tweets, comments
* Get like count or status

### Subscriptions

* Subscribe/unsubscribe to channels

---

## 🌐 Environment Variables

The app uses the following environment variables:

* `PORT`
* `MONGODB_URI`
* `ACCESS_TOKEN_SECRET`
* `REFRESH_TOKEN_SECRET`
* `CLOUDINARY_API_KEY`
* `CLOUDINARY_API_SECRET`
* `CLOUDINARY_CLOUD_NAME`
* `CORS_ORIGIN`

(*Do not commit secrets to version control*)

---

## 📌 Notes

* This is a **pure backend project** with no frontend.
* Built with scalability and clarity in mind for educational/demo purposes.
* Authentication, media upload, and core interactions are complete.

---

## 🛠 Future Improvements

Currently none planned.

---

## 🧑‍💻 Author

**Arin Das**
B.Tech CSE, Jadavpur University
Passionate about full-stack web development.

---

## 📄 License

This project is open-source and free to use.
