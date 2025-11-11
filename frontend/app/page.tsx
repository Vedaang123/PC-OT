"use client";
import { useState } from "react";

export default function Home() {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;
  const [query, setQuery] = useState(
    "Find the names of all alumni with 'Python' and 'Machine Learning' in their skills, and what is their average experience in years?"
  );
  const [context, setContext] = useState<string[]>([]);
  const [answer, setAnswer] = useState(
    "The final grounded answer from the Gemini LLM will be displayed here."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runRagChain = async () => {
    if (!query.trim()) {
      setError("Please enter a query before running the RAG chain.");
      return;
    }

    setLoading(true);
    setError("");
    setContext([
      "Sending query to backend... awaiting retrieval and generation.",
    ]);
    setAnswer("Generating final answer...");

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        let errorDetail = `Server responded with status ${response.status}.`;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorDetail;
        } catch {}
        throw new Error(`FastAPI Error: ${errorDetail}`);
      }

      const result = await response.json();
      setAnswer(result.answer || "No answer returned.");
      setContext(result.context || []);
    } catch {
      setContext([]);
      setAnswer("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-8">
      <header className="text-center mb-10 p-6 bg-gray-700 rounded-xl shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          FastAPI RAG Client
        </h1>
        <p className="text-gray-400">
          Client communicating with Python FastAPI backend at{" "}
          <code className="text-green-400 font-mono">
            http://localhost:8000/query
          </code>
        </p>
      </header>

      <div className="p-6 rounded-xl mb-8 bg-gray-700 border border-gray-600 shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-600 pb-2">
          Query Alumni Data
        </h2>

        <textarea
          className="w-full p-4 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150 text-white bg-gray-800 resize-none"
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          onClick={runRagChain}
          disabled={loading}
          className={`mt-4 px-8 py-3 rounded-lg font-bold flex items-center justify-center transition duration-200 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-linear-to-r from-emerald-600 to-emerald-400 hover:shadow-lg hover:shadow-green-500/50"
          }`}
        >
          {loading ? (
            <>
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-5 w-5 mr-2 border-t-green-400 animate-spin"></div>
              Executing RAG Chain...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              Send Query to FastAPI
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 p-4 mb-6 rounded-lg">
          <p className="font-semibold">Connection Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Context Section */}
        <div className="p-6 rounded-xl border-t-4 border-emerald-500 bg-gray-700 border shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.8 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.8 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.2 18 16.5 18s-3.332.477-4.5 1.253"
              ></path>
            </svg>
            Retrieved Context (Sources)
          </h2>

          <div className="max-h-[350px] overflow-y-auto bg-gray-800 p-4 rounded-lg space-y-3">
            {context.length > 0 ? (
              context.map((chunk, i) => (
                <div
                  key={i}
                  className="bg-gray-900 p-3 rounded-lg border-l-4 border-emerald-500"
                >
                  <p className="font-semibold text-gray-300 mb-1">
                    Source {i + 1}:
                  </p>
                  <pre className="text-gray-400 whitespace-pre-wrap font-mono text-xs">
                    {chunk}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">
                No context available or check backend logs.
              </p>
            )}
          </div>
        </div>

        {/* Answer Section */}
        <div className="p-6 rounded-xl border-t-4 border-indigo-500 bg-gray-700 border shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              ></path>
            </svg>
            Final Answer (from LLM)
          </h2>

          <div className="max-h-[350px] overflow-y-auto bg-indigo-900/30 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
