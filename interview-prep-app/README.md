# Interview Prep Application

An application for practicing technical interviews with AI assistance and tracking your progress.

## Features

- AI-powered mock interviews
- Real-time code editor
- Live feedback and assessment
- Interview history tracking
- Performance analytics dashboard

## Technical Overview

### Feedback Data Storage

The application stores interview feedback data to allow users to review their performance over time. The feedback storage system works as follows:

1. **During the Interview**:
   - The application tracks various metrics like:
     - Number of hints requested
     - Communication quality
     - Problem-solving approach
     - Time spent on the problem

2. **After Submission**:
   - When a user submits their solution, the system:
     - Analyzes their code quality
     - Combines metrics from the interview
     - Generates a comprehensive feedback report
     - Assigns a unique ID to the feedback
     - Stores it in the database

3. **Feedback Persistence**:
   - Feedback is stored in two places:
     - Session storage for immediate access
     - Backend database for long-term persistence
   - This ensures feedback remains available even after page refreshes or returning to the app later

4. **Dashboard Integration**:
   - The user dashboard fetches all feedback records
   - Displays a history of past interviews
   - Shows performance trends over time
   - Allows users to revisit detailed feedback

### Data Flow

```
Interview Process → Metrics Collection → Solution Submission → Feedback Generation → Database Storage → Dashboard Display
```

## Implementation Details

- The application uses a combination of client-side and server-side storage
- In development, feedback is stored using a simulated persistent storage
- In production, this would be replaced with a proper database like PostgreSQL
- The API endpoints in `/api/feedback` handle both saving and retrieving feedback

## Future Improvements

- Add user authentication to associate feedback with specific user accounts
- Implement advanced analytics for tracking improvement over time
- Add feedback export functionality (PDF, CSV, etc.)
- Integrate with external learning resources based on identified areas for improvement

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcryptjs
- **Email**: Nodemailer
- **Form Validation**: Zod, React Hook Form

## Project Structure

```
├── src/
│   ├── app/                  # App router pages
│   │   ├── api/              # API routes
│   │   ├── (auth)/           # Authentication routes
│   │   └── (dashboard)/      # Protected routes
│   ├── components/           # React components
│   ├── controllers/          # Business logic controllers
│   ├── lib/                  # Library functions (DB, etc.)
│   ├── middleware/           # Authentication middleware
│   ├── models/               # Database models
│   ├── services/             # Service layer (email, etc.)
│   └── utils/                # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB (local or Atlas)
- SMTP server for email verification

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/interview-prep

# JWT Secret
JWT_SECRET=your-secret-key-here

# Email Service Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@interviewprep.com
EMAIL_SECURE=false

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Deployment

This application can be easily deployed on Vercel:

```bash
npm run build
```

## License

MIT
