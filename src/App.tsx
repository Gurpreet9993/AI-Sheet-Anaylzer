import React, { useState, useEffect } from "react";
import { BarChart3, MessageSquare, Lightbulb, Trash2, Database, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ColumnInfo, SummaryStats, VisualChartConfig, AnalyticalInsights } from "./types";
import UploadLanding from "./components/UploadLanding";
import Dashboard from "./components/Dashboard";
import AIChat from "./components/AIChat";
import Insights from "./components/Insights";

export default function App() {
  const [activeSection, setActiveSection] = useState<"dashboard" | "chat" | "insights" | "upload">("upload");
  
  const [dataset, setDataset] = useState<{
    name: string;
    rows: any[];
    columns: ColumnInfo[];
    stats: SummaryStats;
    charts: VisualChartConfig[];
  } | null>(null);

  const [insights, setInsights] = useState<AnalyticalInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Background fetch of analytical insights once dataset is uploaded
  const handleDatasetLoaded = (data: {
    name: string;
    rows: any[];
    columns: ColumnInfo[];
    stats: SummaryStats;
    charts: VisualChartConfig[];
  }) => {
    setDataset(data);
    setInsights(null); // Reset older insights
    setActiveSection("dashboard");
    
    // Proactively fetch insights in the background for ultra-responsive tab transitions
    prefetchInsights(data);
  };

  const prefetchInsights = async (loadedData: typeof dataset) => {
    if (!loadedData) return;
    setInsightsLoading(true);
    try {
      // Package a representative sample rows (first 20 rows) + overall counts and stats
      const sampleRows = loadedData.rows.slice(0, 20);

      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datasetName: loadedData.name,
          columns: loadedData.columns,
          summaryStats: loadedData.stats,
          sampleRows,
          rowCount: loadedData.rows.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to prefetch insights");
      }

      const resData = await response.json();
      setInsights(resData);
    } catch (err) {
      console.warn("Background insights prefetch failed or timed out: ", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleRegenerateInsights = () => {
    if (dataset) {
      prefetchInsights(dataset);
    }
  };

  const handleClearDataset = () => {
    if (window.confirm("Are you sure you want to unload the current dataset? This will clear active chats and charts.")) {
      setDataset(null);
      setInsights(null);
      setActiveSection("upload");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" id="applet-container">
      {/* 1. Left Sidebar: Dark themed */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300 shrink-0 select-none z-10" id="left-sidebar">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-sans font-black shadow-md shadow-indigo-600/30">
              S
            </div>
            <div>
              <h1 className="text-base font-sans font-extrabold text-white tracking-tight">
                SheetSense <span className="text-indigo-400">AI</span>
              </h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase block mt-0.5">
                Cognitive Analytics
              </span>
            </div>
          </div>

          {/* Dataset active status badge card */}
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/20">
            {dataset ? (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block">Connected</span>
                    <span className="text-xs font-bold text-white block truncate mt-0.5" title={dataset.name}>
                      {dataset.name}
                    </span>
                  </div>
                  <button
                    onClick={handleClearDataset}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition shrink-0 cursor-pointer"
                    title="Unload dataset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                  <Database className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span>{dataset.rows.toLocaleString()} records cached</span>
                </div>
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-500 italic">Please connect a dataset</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1" id="sidebar-nav">
            <button
              disabled={!dataset}
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeSection === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : dataset
                  ? "hover:bg-slate-800 hover:text-white"
                  : "opacity-42 cursor-not-allowed text-slate-600 hover:bg-transparent"
              }`}
              id="nav-dashboard"
            >
              <BarChart3 className="h-4.5 w-4.5 shrink-0" />
              Dashboard
            </button>

            <button
              disabled={!dataset}
              onClick={() => setActiveSection("chat")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeSection === "chat"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : dataset
                  ? "hover:bg-slate-800 hover:text-white"
                  : "opacity-42 cursor-not-allowed text-slate-600 hover:bg-transparent"
              }`}
              id="nav-chat"
            >
              <MessageSquare className="h-4.5 w-4.5 shrink-0" />
              AI Chat Assistant
            </button>

            <button
              disabled={!dataset}
              onClick={() => setActiveSection("insights")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeSection === "insights"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : dataset
                  ? "hover:bg-slate-800 hover:text-white"
                  : "opacity-42 cursor-not-allowed text-slate-600 hover:bg-transparent"
              }`}
              id="nav-insights"
            >
              <Lightbulb className="h-4.5 w-4.5 shrink-0" />
              AI Insights
            </button>
          </nav>
        </div>

        {/* Workspace details banner */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/10 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>Secure Enterprise VM</span>
          </div>
        </div>
      </aside>

      {/* 2. Main content area: Light gray background */}
      <main className="flex-1 overflow-y-auto" id="main-content-panel">
        <div className="h-full max-w-7xl mx-auto py-8 px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {!dataset ? (
              <motion.div
                key="upload-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <UploadLanding onDatasetLoaded={handleDatasetLoaded} />
              </motion.div>
            ) : activeSection === "dashboard" ? (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard
                  datasetName={dataset.name}
                  rows={dataset.rows}
                  columns={dataset.columns}
                  stats={dataset.stats}
                  charts={dataset.charts}
                />
              </motion.div>
            ) : activeSection === "chat" ? (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AIChat
                  datasetName={dataset.name}
                  rows={dataset.rows}
                  columns={dataset.columns}
                  stats={dataset.stats}
                />
              </motion.div>
            ) : activeSection === "insights" ? (
              <motion.div
                key="insights-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Insights
                  insights={insights}
                  loading={insightsLoading}
                  onRegenerate={handleRegenerateInsights}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
