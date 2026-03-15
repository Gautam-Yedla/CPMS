# CPMS - Car Parking Management System

An integrated university-scale solution for automated parking operations, security oversight, and real-time monitoring.

## Project Structure

- `Frontend/`: React 19 + TypeScript (Vite)
- `Backend/`: Node.js + Express.js 5 + TypeScript
- `Supabase/`: PostgreSQL Database, Auth, and Security Rules
- `ML/`: AI Pipeline (YOLOv8 + Advanced LMM)
- `Docs/`: Comprehensive technical and user documentation

## Deployment & GitHub Preparation

### 1. GitHub Pushing
The project is configured with detailed `.gitignore` files to ensure sensitive data (like `.env`) and heavy dependencies (`node_modules`, `venv`, ML models) are not pushed.

```bash
git add .
git commit -m "Initial commit for CPMS"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel Deployment (Frontend)
The frontend is pre-configured for Vercel deployment:
1. Connect your GitHub repository to Vercel.
2. Set the `Framework Preset` to **Vite**.
3. Set the `Root Directory` to `Frontend`.
4. Add the following **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
   - `VITE_API_BASE_URL`: The URL where your backend is deployed.

### 3. Backend Deployment
The backend can be deployed to platforms like Render, Heroku, or Azure. Ensure you configure the following:
- Environment variables corresponding to your Supabase credentials.
- CORS settings to allow your Vercel frontend domain.

## Getting Started Locally

### Prerequisites
- Node.js 20+
- Python 3.10+
- FFmpeg (for video processing)

### Setup
Please refer to the individual component documentation in the `Docs/` folder for detailed setup instructions.
