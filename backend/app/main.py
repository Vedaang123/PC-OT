from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import QueryRequest, QueryResponse
from app.rag import rag_chain

app = FastAPI(title="Alumni RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/query", response_model=QueryResponse, summary="Execute RAG Query")
async def execute_query(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # Execute chain
        response = await rag_chain.ainvoke({"input": request.query})

        final_answer = response.get('answer', 'Error: No answer generated.')
        context_docs = [doc.page_content for doc in response.get('context', [])]
        
        return QueryResponse(answer=final_answer, context=context_docs)

    except Exception as e:
        print(f"Execution Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during RAG execution.")