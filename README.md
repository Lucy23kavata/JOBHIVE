# JobHive - Kenyan Youth Job Portal

JobHive is a web-based job portal specifically designed for Kenyan youth, focusing on entry-level positions, internships, part-time work, and freelancing opportunities.

## Features

- **Job Listings**: Companies can post job openings, internships, and freelance opportunities
- **Resume Builder**: Professional CV/Resume creation tool for job seekers
- **Advanced Search**: Filter jobs by location, type, salary range, and educational qualifications
- **Job Alerts**: Personalized notifications based on user preferences
- **User Profiles**: Separate profiles for job seekers and employers

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js
- **Database**: Firebase
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/jobhive.git
cd jobhive
```

2. Install dependencies:

```bash
npm install
```

3. Set up Firebase:

- Create a new Firebase project
- Copy your Firebase configuration
- Create a `.env` file in the root directory and add your Firebase config

4. Start the development server:

```bash
npm start
```

## Project Structure

```
jobhive/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API and Firebase services
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── assets/        # Static assets
├── public/            # Public assets
└── package.json       # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
