import os
import time
import re 
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# --- Pydantic Imports ---
# NOTE: Using standard pydantic imports to fix the squiggly line issue
from pydantic import BaseModel, Field 

# LangChain Imports
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter 
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain 
from langchain_classic.chains import create_retrieval_chain
from langchain_community.document_loaders import CSVLoader

# Tool Calling Imports
from langchain_core.tools import tool

# --- 0. Setup and Configuration ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
# IMPORTANT: You must create an alumni_data.csv file for this to work.
CSV_FILE = "alumni_data.csv" 
CHUNK_SIZE = 512
K_RETRIEVAL = 3 

if not GEMINI_API_KEY:
    # Raise an exception if the key is missing
    print("FATAL ERROR: GEMINI_API_KEY not found. Please set it in your .env file.")
    exit(1)

# --- 1. Define Tool for Calculations ---

class CalculateAverage(BaseModel):
    """Calculate the average of a list of numbers."""
    numbers: List[float] = Field(..., description="A list of numerical values extracted from the context that need to be averaged.")

@tool(args_schema=CalculateAverage)
def calculate_average_experience(numbers: List[float]) -> str:
    """Calculates the average experience from a list of years. Returns the result formatted as a string."""
    if not numbers:
        return "Tool Error: No numerical data was provided to calculate the average. Please extract the years of experience from the context first."
    
    # Filter out non-finite numbers just in case
    valid_numbers = [n for n in numbers if isinstance(n, (int, float))]
    
    if not valid_numbers:
        return "Tool Error: The input list did not contain valid numbers."
        
    avg = sum(valid_numbers) / len(valid_numbers)
    # Return a clean string for the LLM to integrate into the final answer
    return f"The accurate calculated average is {avg:.2f} years, based on {len(valid_numbers)} data points: {valid_numbers}"

# --- 2. Initialization (Run Once on Server Startup) ---
print("--- Initializing RAG components (One-time setup) ---")

try:
    # 1. Initialize LLM and Embeddings
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1,
        api_key=GEMINI_API_KEY,
        client_options={"api_key": GEMINI_API_KEY}
    )

    # **Tool Binding:** Bind the calculation tool to the LLM
    llm_with_tools = llm.bind_tools(tools=[calculate_average_experience])

    embeddings = GoogleGenerativeAIEmbeddings(
        model="text-embedding-004", 
        api_key=GEMINI_API_KEY,
        client_options={"api_key": GEMINI_API_KEY}
    )

    # 2. Data Loading and Chunking
    loader = CSVLoader(file_path=CSV_FILE)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=20)
    splits = text_splitter.split_documents(documents)
    print(f" -> Documents split into {len(splits)} chunks.")

    # 3. Vector Store Creation (In-memory Chroma)
    start_time = time.time()
    vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": K_RETRIEVAL})
    print(f" -> Embeddings stored in {round(time.time() - start_time, 2)} seconds.")

    # 4. RAG Chain Construction
    template = """
You are an expert alumni data assistant. Your goal is to provide accurate and helpful answers.
Use the following pieces of retrieved alumni data (context) to formulate your answer.

1. Calculation (Tool Use): If the user's question explicitly asks for a **calculation** (like average, total, or sum), you MUST first extract the relevant numerical values (e.g., 'years of experience', 'graduation year') from the 'Retrieved Alumni Data'. Then, call the provided tool(s) to perform the computation accurately. DO NOT perform the math yourself.
2. Factual Answer: For all other questions (e.g., 'Who knows Python?', 'List all 2023 graduates'), answer directly from the 'Retrieved Alumni Data'.
3. Missing Information: If the necessary information (data for calculation or facts) is not present in the context, politely state that you cannot find the answer in the alumni database.

Retrieved Alumni Data:
{context}

Question: {input}
"""
    prompt = ChatPromptTemplate.from_template(template)
    
    # Use the LLM with the bound tools in the document chain
    document_chain = create_stuff_documents_chain(llm_with_tools, prompt)
    rag_chain = create_retrieval_chain(retriever, document_chain)
    print(" -> RAG Chain constructed successfully with Tool Calling enabled.")

except FileNotFoundError:
    print(f"FATAL ERROR: The file '{CSV_FILE}' was not found. Please create it with alumni data.")
    exit(1)
except Exception as e:
    print(f"An error occurred during RAG initialization: {e}")
    exit(1)

# --- 3. FastAPI Application Setup ---
app = FastAPI(title="Alumni RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for the request body
class QueryRequest(BaseModel):
    query: str

# Pydantic model for the response body
class QueryResponse(BaseModel):
    answer: str
    context: list[str]

@app.post("/query", response_model=QueryResponse, summary="Execute RAG Query against Alumni Data")
async def execute_query(request: QueryRequest):
    """
    Executes the user query through the pre-initialized RAG chain, supporting tool calls for calculations.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # Run the RAG chain. The LLM handles the tool call automatically within the chain.
        # Note: Using .ainvoke for async compatibility with FastAPI
        response = await rag_chain.ainvoke({"input": request.query})

        # Extract answer and format context for the JSON response
        final_answer = response.get('answer', 'Error: No answer generated.')
        context_docs = [doc.page_content for doc in response.get('context', [])]
        
        return QueryResponse(answer=final_answer, context=context_docs)

    except Exception as e:
        print(f"Error during chain execution: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during RAG chain execution.")

print("--- RAG API is ready to serve queries ---")