CAREER COMPASS - JOB FIT ANALYZER

OVERVIEW
Career Compass is an AI-powered tool that helps job seekers understand how well their resume matches a job description. It provides a detailed analysis, highlighting strengths, gaps, and personalized recommendations.

GETTING STARTED

BACKEND SETUP
1. Navigate to the backend directory
2. Create a virtual environment: python -m venv venv
3. Activate the virtual environment:
   - Windows: .\venv\Scripts\activate
   - Mac/Linux: source venv/bin/activate
4. Install dependencies: pip install -r requirements.txt
5. Create a .env file and add your API key
6. Start the server: py main.py

FRONTEND SETUP
1. Navigate to the frontend directory
2. Install dependencies: npm install
3. Start the development server: npm run dev
4. The application will open in your default browser at http://localhost:5173

APPLICATION FLOW

1. UPLOAD DOCUMENTS
   - Upload your resume in PDF, DOCX, or TXT format
   - Upload the job description in any of the supported formats

2. ANALYSIS
   - The system processes both documents
   - It extracts skills, experience, and key information
   - Performs hybrid analysis using multiple AI models

3. VIEW RESULTS
   - See your match score out of 10
   - View detailed breakdown by category
   - Check skill matches and gaps
   - Get personalized recommendations

4. CHAT WITH AI ADVISOR
   - Ask questions about your analysis
   - Get career advice
   - Request specific recommendations
   - Capable of answering follow-up questions

TECH STACK
- Backend: Python, FastAPI
- Frontend: React + Vite, Tailwind CSS
- AI Models: Sentence Tranformer (all-MiniLM-L6-v2), R1-LLM (Deepseek)
- Database: In-memory (can be configured to use external DB)

TROUBLESHOOTING
- Ensure all required ports are available
- Check that all environment variables are set
- Verify that all dependencies are installed
- Check the console for any error messages
