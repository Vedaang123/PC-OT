# PC-OT

Steps to test the app :
1) Create a virtual environment in the project directory on your PC
2) Create an API key for the Gemini LLM by visiting Google AI Studio. Insert the key in the .env file of the project directory(as GEMINI_API_KEY = "your_key_here")
3) Install all requirements using : pip install -r requirements.txt
4) uvicorn rag_api:app --reload : Starts the backend
5) Click on index.html to launch the frontend. Type in the query about the alumni which you want to retrieve. See the results.
