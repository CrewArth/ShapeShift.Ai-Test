# ShapeShift AI

Transform text and images into stunning 3D models using AI.

## Features

- Text to 3D Model Generation
- Image to 3D Model Generation
- Interactive 3D Model Viewer
- User Authentication
- Community Forum
- Model Download in Multiple Formats (GLB)

## Tech Stack

- Frontend: Next.js 14, React, TypeScript
- Styling: Tailwind CSS, Framer Motion
- 3D Rendering: Three.js, React Three Fiber
- Authentication: Clerk
- Database: MongoDB
- API Integration: Fal.ai TripoSR

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API keys and configuration

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `FAL_KEY`: Your Fal.ai API key
- `MONGODB_URI`: MongoDB connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key

## Project Structure

```
src/
├── app/             # Next.js 14 app directory
├── components/      # Reusable React components
├── lib/            # Library code, utilities
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── styles/         # Global styles
```

## License

MIT