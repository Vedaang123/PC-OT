import sys
import time
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import CSVLoader

from app.config import settings
from app.tools import calculate_average_experience

def build_rag_chain():
    print("--- Initializing RAG components ---")
    try:

        llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            temperature=0.1,
            api_key=settings.GEMINI_API_KEY
        )
        llm_with_tools = llm.bind_tools(tools=[calculate_average_experience])

        embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.GEMINI_API_KEY
        )

        loader = CSVLoader(file_path=settings.CSV_FILE)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE, 
            chunk_overlap=20
        )
        splits = text_splitter.split_documents(documents)
        print(f" -> Documents split into {len(splits)} chunks.")

        start_time = time.time()
        vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
        retriever = vectorstore.as_retriever(search_kwargs={"k": settings.K_RETRIEVAL})
        print(f" -> Embeddings stored in {round(time.time() - start_time, 2)} seconds.")

        template = """
        You are an expert alumni data assistant.
        1. Calculation (Tool Use): Extract numerical values and use tools for math.
        2. Factual Answer: Answer directly from 'Retrieved Alumni Data'.
        3. Missing Information: State if answer is not found.

        Retrieved Alumni Data:
        {context}

        Question: {input}
        """
        prompt = ChatPromptTemplate.from_template(template)
        
        document_chain = create_stuff_documents_chain(llm_with_tools, prompt)
        rag_chain = create_retrieval_chain(retriever, document_chain)
        
        print(" -> RAG Chain constructed successfully.")
        return rag_chain

    except Exception as e:
        print(f"RAG Initialization Error: {e}")
        sys.exit(1)

rag_chain = build_rag_chain()