import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  TrendingUp,
  Award,
  Database,
  BarChart3,
  Calendar,
  Layers,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { ColumnInfo, SummaryStats, VisualChartConfig } from "../types";

interface DashboardProps {
  datasetName: string;
  rows: any[];
  columns: ColumnInfo[];
  stats: SummaryStats;
  charts: VisualChartConfig[];
}

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#fecdd3", "#38bdf8", "#8b5cf6", "#ec4899"];

export default function Dashboard({ datasetName, rows, columns, stats, charts }: DashboardProps) {
  const [previewRowsCount, setPreviewRowsCount] = useState(10);
  const [activeChartIndex, setActiveChartIndex] = useState(0);

  // Pick top numeric stats to display as primary KPI cards
  const numericKeys = Object.keys(stats.numericStats);
  const categoricalKeys = Object.keys(stats.categoricalStats);

  return (
    <div className="space-y-8" id="dashboard-section">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 uppercase tracking-widest px-2.5 py-1 rounded-full">
            Dataset Activated
          </span>
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600 h-6 w-6" />
            {datasetName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics and automatically detected schemas for your upload.
          </p>
        </div>

        {/* Global summary badge */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex gap-6 shrink-0 shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Rows</span>
            <span className="text-lg font-bold text-slate-800">{stats.rowCount.toLocaleString()}</span>
          </div>
          <div className="border-l border-slate-100" />
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Columns</span>
            <span className="text-lg font-bold text-slate-800">{stats.colCount}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Row Count KPI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Records Loaded</span>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-sans font-bold text-slate-900">{stats.rowCount.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Processed from spreadsheet first sheet</p>
          </div>
        </div>

        {/* Dynamic Card 2: Sales/Sum KPI */}
        {numericKeys.length > 0 ? (
          (() => {
            const topNumKey = numericKeys.find(k => k.toLowerCase().includes("sale") || k.toLowerCase().includes("rev") || k.toLowerCase().includes("total")) || numericKeys[0];
            const topNumData = stats.numericStats[topNumKey];
            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total {topNumKey}</span>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-sans font-bold text-slate-900">
                    {topNumData.sum >= 1000 ? `$${topNumData.sum.toLocaleString()}` : topNumData.sum.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Avg: {topNumData.avg.toLocaleString()}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Metrics</span>
              <div className="p-2 bg-slate-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-sans font-bold text-slate-900">0</h3>
              <p className="text-xs text-slate-500 mt-1">No numeric attributes found</p>
            </div>
          </div>
        )}

        {/* Dynamic Card 3: Average KPI */}
        {numericKeys.length > 0 ? (
          (() => {
            const secondNumKey = numericKeys[1] || numericKeys[0];
            const secNumData = stats.numericStats[secondNumKey];
            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Mean {secondNumKey}</span>
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-sans font-bold text-slate-900">
                    {secNumData.avg >= 1000 ? `$${secNumData.avg.toLocaleString()}` : secNumData.avg.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Min: {secNumData.min} / Max: {secNumData.max}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Average Metrics</span>
              <div className="p-2 bg-slate-50 rounded-xl">
                <Award className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-sans font-bold text-slate-900">N/A</h3>
              <p className="text-xs text-slate-500 mt-1">No secondary metric found</p>
            </div>
          </div>
        )}

        {/* Dynamic Card 4: Top Categorical KPI */}
        {categoricalKeys.length > 0 ? (
          (() => {
            const firstCatKey = categoricalKeys[0];
            const catData = stats.categoricalStats[firstCatKey];
            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Top {firstCatKey}</span>
                  <div className="p-2 bg-violet-50 rounded-xl">
                    <Layers className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-sans font-bold text-slate-900 truncate" title={catData.topValue}>
                    {catData.topValue}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Occurs {catData.topCount} times ({catData.distinctCount} distinct options)
                  </p>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Top Class</span>
              <div className="p-2 bg-slate-50 rounded-xl">
                <Layers className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-sans font-bold text-slate-900">None</h3>
              <p className="text-xs text-slate-500 mt-1">Flat list schema</p>
            </div>
          </div>
        )}
      </div>

      {/* Schema Badge layout */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Database className="h-4.5 w-4.5 text-indigo-500" />
          Detected Attributes Schema and Data Types
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {columns.map((col, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block truncate" title={col.name}>
                  {col.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  Unique: {col.distinctCount} values
                </span>
              </div>
              <div className="mt-3">
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    col.type === "number"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : col.type === "date"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : col.type === "boolean"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {col.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Charts section */}
      {charts.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div>
              <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Dynamic Statistical Charts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch between auto-generated visual widgets configured for your data types.
              </p>
            </div>

            {/* Custom chart pills switcher */}
            <div className="flex flex-wrap gap-1.5">
              {charts.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChartIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeChartIndex === idx
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
                  }`}
                >
                  {c.title.split("grouped by")[0].split("Metric Over")[0].substring(0, 30)}
                </button>
              ))}
            </div>
          </div>

          {/* Active Chart stage */}
          <div className="h-[320px] w-full" id={`active-chart-${activeChartIndex}`}>
            {(() => {
              const activeChart = charts[activeChartIndex];
              if (!activeChart) return null;

              return (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChart.type === "bar" ? (
                    <BarChart data={activeChart.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name={activeChart.yAxis || "Records"} fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : activeChart.type === "line" ? (
                    <LineChart data={activeChart.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="value" name={activeChart.yAxis || "Value"} stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  ) : activeChart.type === "pie" ? (
                    <PieChart>
                      <Pie
                        data={activeChart.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {activeChart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="xValue" name={activeChart.xAxis} stroke="#94a3b8" fontSize={11} />
                      <YAxis type="number" dataKey="yValue" name={activeChart.yAxis} stroke="#94a3b8" fontSize={11} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Legend />
                      <Scatter name="Data Rows" data={activeChart.data} fill="#8b5cf6" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      ) : null}

      {/* Grid preview data table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-sans font-bold text-slate-900">Tabular Dataset Explorer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reviewing parsed records from your source sheet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Preview Size:</span>
            <select
              value={previewRowsCount}
              onChange={(e) => setPreviewRowsCount(Number(e.target.value))}
              className="text-xs rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5 Rows</option>
              <option value={10}>10 Rows</option>
              <option value={25}>25 Rows</option>
              <option value={50}>50 Rows</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-600">
                <th className="p-3 w-12 text-center">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-3 font-semibold truncate max-w-[150px]">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, previewRowsCount).map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-200/60 last:border-b-0 hover:bg-slate-50/30 text-slate-700">
                  <td className="p-3 text-center text-slate-400 border-r border-slate-100">{rIdx + 1}</td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-3 truncate max-w-[150px]" title={row[col.name]}>
                      {row[col.name] !== undefined && row[col.name] !== null
                        ? String(row[col.name])
                        : <span className="text-slate-300 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length > previewRowsCount && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
            Showing first {previewRowsCount} of {rows.length.toLocaleString()} total rows.
          </div>
        )}
      </div>
    </div>
  );
}
