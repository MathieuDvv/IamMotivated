# I am Motivated - Motivation Letter Generator

A powerful web application that helps users generate personalized motivation letters for jobs, schools, and internships using AI technology.

## Features

- Multi-language support (English & French)
- AI-powered letter generation using Claude and Deepseek
- Customizable letter content and tone
- Sentence-by-sentence editing
- Export options (copy to clipboard, PDF)

## Tech Stack

- Frontend: Vue.js 3
- Backend: Node.js with Express
- AI: Claude and Deepseek APIs
- Styling: Tailwind CSS

## Project Structure

```
.
├── client/          # Vue.js frontend
├── server/          # Node.js backend
└── README.md
```

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Claude API key (Optional if there is the other)
- Deepseek API key (Optional if there is the other)

### Installation

1. Clone the repository
2. Set up the backend:
   ```bash
   cd server
   npm install
   cp .env.example .env  # Add your API keys
   npm run dev
   ```

3. Set up the frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Environment Variables

Create a `.env` file in the server directory with:

```
CLAUDE_API_KEY=your_claude_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## License

MIT 
