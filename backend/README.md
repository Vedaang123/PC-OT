## Getting Started
### 1. create a virtual environment in the project directory and run:
```bash
python -m venv venv
```

Activate the environment:
- Windows:
```bash
venv\Scripts\Activate.ps1
```
- macOS/Linux:
```bash
source venv/bin/activate
```
### 2. Set Up Gemini API key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new **Gemini API key**
3. In the project root directory, create a `.env` file and add:
```bash
GEMINI_API_KEY="your_key_here"
```

### 3. Install Dependencies
Ensure the virtual environment is active, then install all required packages:
```bash
pip install -r requirements.txt
```

### 4. Run the Backend Server
Start the FastAPI backend using:
```bash
uvicorn rag_api:app --reload
```
This launches the server at [http://127.0.0.1:8000](http://127.0.0.1:8000)
