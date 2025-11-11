"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
            const res = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `Server error: ${res.status}`);
            }

            const result = await res.json();
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
        <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10 font-[Inter]">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-bold tracking-tight bg-linear-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                        Alumni Retrieval System
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Query the knowledge base using natural language.
                    </p>
                </div>

                <Card className="border-none bg-slate-800/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-100">
                            Query Alumni Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            rows={3}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter your natural language query here..."
                            className="resize-none border-none bg-slate-900/60 text-slate-100 focus:ring-2 focus:ring-emerald-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                            onClick={runRagChain}
                            disabled={loading}
                            className={cn(
                                "w-full sm:w-auto font-semibold py-2 px-6 rounded-lg transition-all duration-200",
                                "bg-linear-to-r from-emerald-600 to-emerald-400 text-white hover:scale-[1.02]"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Executing RAG Chain...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" /> Send Query
                                    to FastAPI
                                </>
                            )}
                        </Button>
                        {error && (
                            <div className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-md p-2">
                                <p className="font-medium">Error:</p>
                                <p>{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-none bg-slate-800/60 backdrop-blur-xl shadow-lg transition-all duration-200 hover:shadow-emerald-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-400 text-lg">
                                <BookOpen className="w-5 h-5" />
                                Retrieved Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[350px] rounded-md border border-slate-700 p-4 bg-slate-900/40">
                                {context.length > 0 ? (
                                    context.map((chunk, i) => (
                                        <div
                                            key={i}
                                            className="mb-3 bg-slate-800/60 p-3 rounded-lg border-l-4 border-emerald-500 text-sm"
                                        >
                                            <p className="font-semibold mb-1 text-emerald-300">
                                                Source {i + 1}
                                            </p>
                                            <pre className="text-slate-300 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                                                {chunk}
                                            </pre>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic">
                                        No context yet or backend error.
                                    </p>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-slate-800/60 backdrop-blur-xl shadow-lg transition-all duration-200 hover:shadow-indigo-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-400 text-lg">
                                <MessageSquare className="w-5 h-5" />
                                Final Answer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[350px] rounded-md border border-slate-700 p-4 bg-slate-900/40">
                                <p className="whitespace-pre-wrap text-slate-100 leading-relaxed text-sm">
                                    {answer}
                                </p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
