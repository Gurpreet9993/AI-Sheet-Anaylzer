export interface ColumnInfo {
  name: string;
  type: "number" | "date" | "string" | "boolean";
  sampleValues: any[];
  distinctCount: number;
}

export interface NumericStat {
  sum: number;
  avg: number;
  min: number;
  max: number;
}

export interface CategoricalStat {
  topValue: string;
  topCount: number;
  distinctCount: number;
}

export interface SummaryStats {
  rowCount: number;
  colCount: number;
  numericStats: { [key: string]: NumericStat };
  categoricalStats: { [key: string]: CategoricalStat };
}

export interface AnalyticalInsights {
  executiveSummary: string;
  trends: string[];
  anomalies: string[];
  topPerformers: string[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface VisualChartConfig {
  id: string;
  title: string;
  type: "bar" | "line" | "pie" | "scatter";
  xAxis: string;
  yAxis?: string;
  data: { name: string; value: number; [key: string]: any }[];
}
