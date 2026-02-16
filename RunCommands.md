# CPMS Project Run Commands

## 1. Frontend (React + Vite)
The frontend is a React application built with Vite and TypeScript.

**Setup & Run:**
```powershell
cd Frontend
npm install
npm run dev
```
- **URL:** [http://localhost:5173](http://localhost:5173) (default)

---

## 2. Backend (Node.js + Express)
The backend is a Node.js server using TypeScript and `tsx` for development.

**Setup & Run:**
```powershell
cd Backend
npm install
npm run dev
```
- **Scripts:**
    - `npm run dev`: Starts the server with `tsx watch`
    - `npm run build`: Compiles TypeScript to JavaScript
    - `npm start`: Runs the compiled output from `dist/`

---

## 3. Machine Learning (Python + YOLOv8)
The ML module has two components:
1. **ML Service (Required for Dashboard)**: The API that the Backend uses to get live data.
2. **ML Pipeline (Optional)**: A local monitor window to visualize the detection in real-time.

### ML Service (Fixes "Offline" Status)
**Run:**
```powershell
cd ML
# Option A: Use the helper script
.\start_ml_service.bat

# Option B: Manual
.\venv\Scripts\activate  # If you have a venv
python src/api_bridge.py
```
- **Port:** 5001

### ML Pipeline (Local Monitor)
**Run:**
```powershell
cd ML
python src/main.py
```
