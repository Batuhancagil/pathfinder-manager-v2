# Pathfinder Manager

A comprehensive Pathfinder character management and session management application.

## Features

### ✅ Completed
- **User Authentication**: JWT-based authentication with admin/player roles
- **Character Management**: Create, edit, delete, and view Pathfinder characters
- **PDF Integration**: View and interact with character sheet PDFs
- **Form-based Editing**: Comprehensive character creation and editing forms
- **Responsive UI**: Modern, mobile-friendly interface

### 🚧 In Progress
- **Session Management**: Create and join D&D sessions
- **Real-time Chat**: Live chat during sessions
- **Dice Rolling**: Real-time dice rolling system
- **Initiative Tracking**: Combat initiative management

## Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **MongoDB** + **Mongoose**
- **Socket.io** (for real-time features)
- **JWT** authentication
- **Multer** (file uploads)

### Frontend
- **Next.js 14** + **TypeScript**
- **Tailwind CSS** (styling)
- **PDF.js** (PDF viewing)
- **Zustand** (state management)
- **Socket.io-client** (real-time communication)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pathfinder-manager
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Backend (create `backend/.env`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pathfinder-manager
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   ```
   
   Frontend (create `frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Usage

### First Time Setup
1. Register a new account
2. Create your first character using the character form
3. View and edit your character sheet

### Character Management
- Create new characters with detailed stats
- Edit existing characters
- View character sheets as PDFs
- Manage equipment and spells

### Admin Features
- Admin users can create new player accounts
- User management capabilities

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Characters
- `GET /api/characters` - Get user's characters
- `POST /api/characters` - Create new character
- `GET /api/characters/:id` - Get specific character
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character

## Project Structure

```
pathfinder-manager/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   └── package.json
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   ├── store/         # State management
│   │   └── types/         # TypeScript types
│   └── package.json
├── shared/                 # Shared resources
│   └── template.pdf       # Character sheet template
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] Session management system
- [ ] Real-time chat
- [ ] Dice rolling system
- [ ] Initiative tracking
- [ ] Mobile app
- [ ] Character import/export
- [ ] Campaign management
- [ ] Spell database integration
