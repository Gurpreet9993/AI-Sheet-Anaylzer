import React, { useState, useRef } from "react";
import { UploadCloud, Link, FileSpreadsheet, Play, AlertCircle, FileText, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { ColumnInfo } from "../types";
import { analyzeColumns, computeSummaryStatistics, generateAutoCharts } from "../lib/analyzer";

interface UploadLandingProps {
  onDatasetLoaded: (data: {
    name: string;
    rows: any[];
    columns: ColumnInfo[];
    stats: any;
    charts: any[];
  }) => void;
}

export default function UploadLanding({ onDatasetLoaded }: UploadLandingProps) {
  const [dragActive, setDragActive] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      setError("Supported file extensions are .xlsx, .xls, and .csv");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error("The selected spreadsheet sheet contains no records.");
        }

        const cols = analyzeColumns(rawJson);
        const statistics = computeSummaryStatistics(rawJson, cols);
        const charts = generateAutoCharts(rawJson, cols);

        onDatasetLoaded({
          name: file.name,
          rows: rawJson,
          columns: cols,
          stats: statistics,
          charts: charts,
        });
      } catch (err: any) {
        setError(err?.message || "Failed to process the spreadsheet data correctly.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("An error occurred reading this spreadsheet file.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleGoogleSheetsLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sheetUrl.trim()) return;

    // Regex to extract unique Spreadsheet ID
    const match = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setError("Invalid Google Sheets URL format. Example: https://docs.google.com/spreadsheets/d/SpreadsheetID/edit");
      return;
    }

    const sheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    setLoading(true);
    try {
      // Fetch public sheet export
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(
          "Ensure the Google Sheet is published or shared with 'Anyone with the link can view' settings."
        );
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet);

      if (!rawJson || rawJson.length === 0) {
        throw new Error("No data records found in Google Sheet.");
      }

      const cols = analyzeColumns(rawJson);
      const statistics = computeSummaryStatistics(rawJson, cols);
      const charts = generateAutoCharts(rawJson, cols);

      onDatasetLoaded({
        name: "Google Sheet Connection",
        rows: rawJson,
        columns: cols,
        stats: statistics,
        charts: charts,
      });
    } catch (err: any) {
      setError(
         `Google Sheets access error: ${err.message}. Alternatively, you can save the file locally as .xlsx and upload it direct, or paste cells as CSV below.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePastedDataLoad = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pastedText.trim()) return;

    setLoading(true);
    try {
      // Parse CSV/TSV manually or using sheetjs
      const workbook = XLSX.read(pastedText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet);

      if (!rawJson || rawJson.length === 0) {
        throw new Error("No valid data rows found in pasted text.");
      }

      const cols = analyzeColumns(rawJson);
      const statistics = computeSummaryStatistics(rawJson, cols);
      const charts = generateAutoCharts(rawJson, cols);

      onDatasetLoaded({
        name: "Pasted Data Snippet",
        rows: rawJson,
        columns: cols,
        stats: statistics,
        charts: charts,
      });
    } catch (err: any) {
      setError(`Failed to parse pasted data: ${err.message}. Try copy-pasting an aligned Excel grid structure directly.`);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    setLoading(true);
    try {
      // Generate highly stylized sales/revenue data
      const dates = [
        "2026-01-05", "2026-01-12", "2026-01-19", "2026-01-26",
        "2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23",
        "2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23",
        "2026-03-30", "2026-04-06", "2026-04-13", "2026-04-20",
        "2026-04-27", "2026-05-04", "2026-05-11", "2026-05-18"
      ];
      const regions = ["North America", "Europe", "Asia-Pacific", "Latin America"];
      const products = ["SaaS Starter", "Enterprise Suite", "API Key Credits", "AI Custom Agent"];

      const demoDataset = [];
      for (let i = 0; i < 60; i++) {
        const product = products[i % products.length];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const date = dates[i % dates.length];
        const units = Math.floor(Math.random() * 80) + 12;
        const price = product === "SaaS Starter" ? 49 : product === "API Key Credits" ? 199 : product === "Enterprise Suite" ? 899 : 1499;
        const revenue = units * price;
        const satisfactionMatch = (Math.random() * 1.5 + 3.5).toFixed(1);
        const supportQueryVolume = Math.floor(Math.random() * 25) + 2;

        demoDataset.push({
          "Date": date,
          "Product": product,
          "Region": region,
          "Units Sold": units,
          "Price ($)": price,
          "Revenue ($)": revenue,
          "Satisfaction Score": Number(satisfactionMatch),
          "Support Queries": supportQueryVolume
        });
      }

      const cols = analyzeColumns(demoDataset);
      const statistics = computeSummaryStatistics(demoDataset, cols);
      const charts = generateAutoCharts(demoDataset, cols);

      onDatasetLoaded({
        name: "Sample SaaS Premium Sales Dataset.xlsx",
        rows: demoDataset,
        columns: cols,
        stats: statistics,
        charts: charts,
      });
    } catch (err: any) {
      setError("Failed to initialize simulated records.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8" id="upload-landing">
      {/* Hero Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-sans font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Understand Your Data in <span className="text-indigo-600">Seconds</span>
        </h1>
        <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
          Upload any Excel sheet or link your Google Sheets. SheetSense AI instantly constructs interactive dashboard statistics and provides a server-side Gemini AI interface.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Direct File upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2 mb-4">
              <FileSpreadsheet className="text-indigo-500 h-5 w-5" />
              Upload Local Excel or CSV
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Select or drop any standard Excel workbook (.xlsx, .xls) or comma-separated values (.csv) spreadsheet file.
            </p>

            <form
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition duration-200 ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx,.xls,.csv"
              />
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-700">
                Drag and drop your spreadsheet, or
              </p>
              <p className="text-xs text-indigo-600 font-semibold mt-1">
                Browse file directory
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block">
                Excel worksheets, single CSV formats up to 40MB.
              </span>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={loadDemoData}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 text-indigo-700 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 transition"
              id="demo-dataset-btn"
            >
              <Play className="h-4.5 w-4.5" />
              Or Start Instant with SaaS Sales Demo Data
            </button>
          </div>
        </div>

        {/* Right Column: Google Sheets & Raw Paste */}
        <div className="space-y-6">
          {/* Google Sheets URL form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Link className="text-indigo-500 h-5 w-5" />
              Connect Google Sheets URL
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter any publicly accessible spreadsheet URL. The link should have viewing rights.
            </p>

            <form onSubmit={handleGoogleSheetsLoad} className="space-y-3">
              <div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !sheetUrl}
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                Fetch & Analyze Sheet
              </button>
            </form>
          </div>

          {/* Paste Grid cell values */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="text-indigo-500 h-5 w-5" />
              Copy-Paste Cell Grid (TSV/CSV)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Select cells in Excel or Sheets, press <kbd className="font-mono bg-slate-100 p-0.5 rounded text-slate-600">Ctrl+C</kbd> and paste inside this console:
            </p>

            <form onSubmit={handlePastedDataLoad} className="space-y-3">
              <div>
                <textarea
                  rows={3}
                  placeholder="ID&#9;Product&#9;Price&#10;1&#9;SaaS&#9;49&#10;2&#9;API Suite&#9;899"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700 bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !pastedText.trim()}
                className="w-full py-2 px-4 rounded-lg bg-slate-800 text-white font-medium text-sm hover:bg-slate-900 disabled:opacity-50 transition"
              >
                Parse Pasted Matrix
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Loading overlay / spinner */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-xl p-8 max-w-sm text-center shadow-2xl flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-sans font-bold text-slate-900">Parsing & Indexing Dataset...</p>
            <p className="text-xs text-slate-400 mt-2">Setting up dashboards, counting metrics, and analyzing labels.</p>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Upload or configuration error</h3>
            <p className="text-xs text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
