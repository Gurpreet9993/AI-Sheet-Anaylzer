import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Database, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { ColumnInfo, SummaryStats, ChatMessage } from "../types";

interface AIChatProps {
  datasetName: string;
  rows: any[];
  columns: ColumnInfo[];
  stats: SummaryStats;
}

export default function AIChat({ datasetName, rows, columns, stats }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom on new replies
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Set up helpful initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: `Hi there! I am **SheetSense AI**, your personalized spreadsheet analyst companion. 
          
I have analyzed **"${datasetName}"** with **${stats.rowCount.toLocaleString()} records** and **${stats.colCount} columns**.

You can ask me questions about this dataset such as:
- *"Which categorical item has the most entries?"*
- *"Can you compute averages or sums for my numeric columns?"*
- *"Highlight any interesting segments or groupings in standard English details."*

What would you like to investigate today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [datasetName, stats]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage("");
    setLoading(true);

    try {
      // Package compact sample of the data (e.g. first 25 rows) + overall stats
      const sampleRows = rows.slice(0, 25);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datasetName,
          columns,
          summaryStats: stats,
          sampleRows,
          rowCount: rows.length,
          messages: updatedHistory.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson?.error || "Server failed to reach Gemini model endpoint");
      }

      const resData = await response.json();
      const botText = resData.text || "I was unable to analyze that. Please check your data structure parameters.";

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-bot`,
          sender: "bot",
          text: botText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Ensure you have activated your Gemini key.");
    } finally {
      setLoading(false);
    }
  };

  // Pre-configured questions chip options
  const numericColumns = columns.filter((col) => col.type === "number");
  const categoricalColumns = columns.filter((col) => col.type === "string");

  const suggestionChips = [
    {
      label: "💡 Give data summary",
      query: "Can you summarize the top business takeaways and main figures in this sheet?",
    },
    ...(numericColumns.length > 0
      ? [
          {
            label: `📈 Identify highest ${numericColumns[0].name}`,
            query: `Identify which rows or categories hold the highest values for the "${numericColumns[0].name}" column, and provide their breakdown.`,
          },
        ]
      : []),
    ...(categoricalColumns.length > 0
      ? [
          {
            label: `🎯 Distribution of ${categoricalColumns[0].name}`,
            query: `Provide a detailed percentage distribution or frequencies for the elements in the "${categoricalColumns[0].name}" column.`,
          },
        ]
      : []),
  ].slice(0, 3);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden" id="ai-chat-section">
      {/* Thread Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-bold text-slate-900">Conversational AI Analyst</h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Database className="h-3 w-3" />
              Dataset context locked and secure
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/20">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3.5 max-w-[85%] ${
              m.sender === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            {/* Avatar block */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                m.sender === "user"
                  ? "bg-slate-800 text-white"
                  : "bg-indigo-600 text-indigo-50"
              }`}
            >
              {m.sender === "user" ? "U" : "AI"}
            </div>

            {/* Bubble body */}
            <div className="space-y-1">
              <div
                className={`py-3 px-4 rounded-2xl shadow-sm text-sm ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                <div className="markdown-body">
                  <Markdown>{m.text}</Markdown>
                </div>
              </div>
              <span className={`text-[10px] text-slate-400 block ${m.sender === "user" ? "text-right" : ""}`}>
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-indigo-50 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="bg-white border border-slate-200 py-3.5 px-5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <Loader2 className="h-4.5 w-4.5 text-indigo-600 animate-spin" />
              <span className="text-sm font-medium text-slate-500">SheetSense is analyzing spreadsheet values...</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-700 font-medium max-w-md mx-auto text-center">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompting chips */}
      {messages.length === 1 && (
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Suggested Questions:</span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.query)}
              className="text-[11px] font-medium bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-400 font-sans px-3 py-1 rounded-full border border-slate-200 shadow-xs cursor-pointer transition"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input controls container */}
      <div className="p-4 border-t border-slate-150 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputMessage);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            required
            disabled={loading}
            placeholder={loading ? "Generating answer..." : "Ask a natural question about sales, products, totals..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/50 disabled:opacity-50 text-slate-800"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-5 flex items-center justify-center shadow-md transition shrink-0 cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
