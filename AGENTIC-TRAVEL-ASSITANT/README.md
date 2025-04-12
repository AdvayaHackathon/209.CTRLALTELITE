# AI Travel Planner

An interactive travel planning tool powered by Google's Gemini AI that helps users plan their next adventure by providing detailed information about travel options, accommodations, and attractions.

## Features

- **Travel Options**: Compare flights, trains, and buses with real-time pricing and availability
- **Lodging Choices**: Find hotels, apartments, and hostels that match your budget and preferences
- **Local Attractions**: Discover top attractions and points of interest at your destination

## Tech Stack

- Next.js
- TypeScript
- React 
- TailwindCSS
- Google Gemini AI API
- Zustand for state management
- React Icons

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your environment variables in `.env.local`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

The application requires a Gemini API key, which should be stored in a `.env.local` file:

```
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```
