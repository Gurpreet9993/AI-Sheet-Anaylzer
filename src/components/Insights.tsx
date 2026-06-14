import React from "react";
import { TrendingUp, Award, CheckCircle, AlertOctagon, Lightbulb, RefreshCw, FileText, Loader2 } from "lucide-react";
import { AnalyticalInsights } from "../types";

interface InsightsProps {
  insights: AnalyticalInsights | null;
  loading: boolean;
  onRegenerate: () => void;
}

export default function Insights({ insights, loading, onRegenerate }: InsightsProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-lg font-sans font-extrabold text-slate-900">Synthesizing Dataset Semantics...</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Gemini is cross-referencing your sheet headers, compiling counts, scanning for outliers, and formulating strategic recommendations.
        </p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <AlertOctagon className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-md font-sans font-bold text-slate-800">No Insights Synthesized</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Please upload or load a valid dataset first to query the model.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="insights-section">
      {/* Tab Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 uppercase tracking-widest px-2.5 py-1 rounded-full">
            AI Summary Generated
          </span>
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Lightbulb className="text-indigo-600 h-6 w-6" />
            Strategic Insights Summary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated cognitive analysis of your spreadsheet records using Gemini 1.5 Flash.
          </p>
        </div>

        <button
          onClick={onRegenerate}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm cursor-pointer transition shrink-0"
          id="regenerate-insights-btn"
        >
          <RefreshCw className="h-4 w-4" />
          Re-Analyze Dataset
        </button>
      </div>

      {/* Grid Layout of Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary Card (Full row of columns in grid if possible, or left span) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 lg:col-span-3">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-md font-sans font-black text-slate-900">Executive Summary</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium">
            {insights.executiveSummary}
          </p>
        </div>

        {/* Column 1: Key Trends */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-md font-sans font-black text-slate-900">Identified Trends</h3>
          </div>
          <ul className="space-y-3">
            {insights.trends.map((trend, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed">
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] p-2 font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{trend}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Top Performers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-md font-sans font-black text-slate-900">Top Performers</h3>
          </div>
          <ul className="space-y-3">
            {insights.topPerformers.map((perf, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed">
                <span className="h-5 w-5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] p-2 font-bold shrink-0 mt-0.5">
                  ★
                </span>
                <span>{perf}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Anomalies & Noise */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <h3 className="text-md font-sans font-black text-slate-900">Outliers & Anomalies</h3>
          </div>
          <ul className="space-y-3">
            {insights.anomalies.length > 0 ? (
              insights.anomalies.map((anom, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                  <span>{anom}</span>
                </li>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No outlying record noises noticed.</p>
            )}
          </ul>
        </div>

        {/* Full width 4th bottom: Corporate recommendations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 lg:col-span-3 bg-gradient-to-br from-indigo-50/20 via-white to-transparent">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="text-md font-sans font-black text-slate-900">Actionable Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="border border-slate-150 p-4 rounded-xl bg-white flex gap-3 shadow-xs">
                <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
