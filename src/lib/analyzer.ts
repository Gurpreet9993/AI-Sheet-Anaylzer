import { ColumnInfo, SummaryStats, VisualChartConfig, NumericStat, CategoricalStat } from "../types";

export function analyzeColumns(data: any[]): ColumnInfo[] {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  const columns: ColumnInfo[] = [];

  for (const key of keys) {
    const values = data.map((d) => d[key]).filter((val) => val !== undefined && val !== null && val !== "");
    const totalCount = values.length;
    if (totalCount === 0) {
      columns.push({ name: key, type: "string", sampleValues: [], distinctCount: 0 });
      continue;
    }

    // Check types
    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;

    for (const val of values) {
      if (typeof val === "number") {
        numberCount++;
      } else if (typeof val === "boolean") {
        booleanCount++;
      } else if (typeof val === "string") {
        const valClean = val.trim();
        if (valClean === "true" || valClean === "false") {
          booleanCount++;
        } else if (!isNaN(Number(valClean)) && valClean !== "") {
          numberCount++;
        } else {
          const dateParsed = Date.parse(valClean);
          // Simple validation to ensure it looks like a date: contains slash, hyphen, or a typical month layout
          if (!isNaN(dateParsed) && (valClean.includes("-") || valClean.includes("/") || valClean.includes(","))) {
            dateCount++;
          }
        }
      }
    }

    let detectedType: "number" | "date" | "string" | "boolean" = "string";
    if (numberCount / totalCount > 0.6) {
      detectedType = "number";
    } else if (dateCount / totalCount > 0.6) {
      detectedType = "date";
    } else if (booleanCount / totalCount > 0.6) {
      detectedType = "boolean";
    }

    const distinct = new Set(values);

    columns.push({
      name: key,
      type: detectedType,
      sampleValues: values.slice(0, 5),
      distinctCount: distinct.size,
    });
  }

  return columns;
}

export function computeSummaryStatistics(data: any[], columns: ColumnInfo[]): SummaryStats {
  const numericStats: { [key: string]: NumericStat } = {};
  const categoricalStats: { [key: string]: CategoricalStat } = {};

  for (const col of columns) {
    const rawValues = data.map((d) => d[col.name]);
    const values = rawValues.filter((val) => val !== undefined && val !== null && val !== "");

    if (col.type === "number") {
      const numValues = values.map((val) => Number(val)).filter((n) => !isNaN(n));
      if (numValues.length > 0) {
        const sum = numValues.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / numValues.length;
        const min = Math.min(...numValues);
        const max = Math.max(...numValues);
        numericStats[col.name] = {
          sum: Number(sum.toFixed(2)),
          avg: Number(avg.toFixed(2)),
          min: Number(min.toFixed(2)),
          max: Number(max.toFixed(2)),
        };
      }
    } else {
      const stringValues = values.map((val) => String(val));
      const freqMap: { [key: string]: number } = {};
      stringValues.forEach((v) => {
        freqMap[v] = (freqMap[v] || 0) + 1;
      });

      let topValue = "None";
      let topCount = 0;
      Object.entries(freqMap).forEach(([k, count]) => {
        if (count > topCount) {
          topCount = count;
          topValue = k;
        }
      });

      categoricalStats[col.name] = {
        topValue,
        topCount,
        distinctCount: col.distinctCount,
      };
    }
  }

  return {
    rowCount: data.length,
    colCount: columns.length,
    numericStats,
    categoricalStats,
  };
}

export function generateAutoCharts(data: any[], columns: ColumnInfo[]): VisualChartConfig[] {
  const charts: VisualChartConfig[] = [];
  const numCols = columns.filter((c) => c.type === "number");
  const catCols = columns.filter((c) => c.type === "string" || c.type === "boolean");
  const dateCols = columns.filter((c) => c.type === "date");

  if (data.length === 0) return [];

  // Chart 1: Group First/Main Categorical Column by a Numeric Column (Bar Chart)
  if (catCols.length > 0 && numCols.length > 0) {
    // Pick cat cols with distinctCount between 2 and 15 to avoid clutter, else fallback to first
    const targetCat = catCols.find((c) => c.distinctCount >= 2 && c.distinctCount <= 15) || catCols[0];
    // Find numeric column related to sales, revenue, totals or just take first
    const targetNum = numCols.find((c) => {
      const l = c.name.toLowerCase();
      return l.includes("sale") || l.includes("revenue") || l.includes("total") || l.includes("price") || l.includes("amount");
    }) || numCols[0];

    // Compute sums grouped by targetCat
    const groupMap: { [key: string]: number } = {};
    data.forEach((row) => {
      const catVal = String(row[targetCat.name] !== undefined ? row[targetCat.name] : "N/A");
      const numVal = Number(row[targetNum.name]) || 0;
      groupMap[catVal] = (groupMap[catVal] || 0) + numVal;
    });

    const chartData = Object.entries(groupMap)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Look premium and clean

    charts.push({
      id: "group-bar",
      title: `Accumulated ${targetNum.name} grouped by ${targetCat.name}`,
      type: "bar",
      xAxis: targetCat.name,
      yAxis: targetNum.name,
      data: chartData,
    });
  }

  // Chart 2: Time Series / Line Trend if chronological columns exist
  if (dateCols.length > 0 && numCols.length > 0) {
    const targetDate = dateCols[0];
    const targetNum = numCols.find((c) => {
      const l = c.name.toLowerCase();
      return l.includes("sale") || l.includes("revenue") || l.includes("total") || l.includes("count") || l.includes("amount");
    }) || numCols[0];

    // Sort chronologically
    const sortedData = [...data].sort((a, b) => {
      const d1 = Date.parse(String(a[targetDate.name]));
      const d2 = Date.parse(String(b[targetDate.name]));
      return isNaN(d1) || isNaN(d2) ? 0 : d1 - d2;
    });

    const dateGroupMap: { [key: string]: number } = {};
    sortedData.forEach((row) => {
      let dateVal = String(row[targetDate.name] || "").split("T")[0];
      // Clean up common Excel serial numbers or dates with times
      if (dateVal.includes(" ")) {
        dateVal = dateVal.split(" ")[0];
      }
      if (dateVal) {
        const numVal = Number(row[targetNum.name]) || 0;
        dateGroupMap[dateVal] = (dateGroupMap[dateVal] || 0) + numVal;
      }
    });

    const chartData = Object.entries(dateGroupMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    })).slice(0, 20); // max 20 points

    charts.push({
      id: "trend-line",
      title: `${targetNum.name} Metric Over Time (${targetDate.name})`,
      type: "line",
      xAxis: targetDate.name,
      yAxis: targetNum.name,
      data: chartData,
    });
  } else if (numCols.length > 0) {
    // Sequence line chart of a numeric column
    const targetNum = numCols[0];
    const chartData = data.slice(0, 25).map((row, idx) => ({
      name: `Pt ${idx + 1}`,
      value: Number(row[targetNum.name]) || 0,
    }));

    charts.push({
      id: "trend-line-seq",
      title: `${targetNum.name} Series Value (First 25 Indexes)`,
      type: "line",
      xAxis: "Row Placement",
      yAxis: targetNum.name,
      data: chartData,
    });
  }

  // Chart 3: Class Distribution Share (Pie Chart)
  if (catCols.length > 0) {
    const pieCat = catCols.find((c) => c.distinctCount >= 2 && c.distinctCount <= 6) || catCols.find((c) => c.distinctCount >= 2 && c.distinctCount <= 12);
    if (pieCat) {
      const countMap: { [key: string]: number } = {};
      data.forEach((row) => {
        const catVal = String(row[pieCat.name] || "Other");
        countMap[catVal] = (countMap[catVal] || 0) + 1;
      });

      const chartData = Object.entries(countMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      charts.push({
        id: "dist-pie",
        title: `Record Shares distribution by ${pieCat.name}`,
        type: "pie",
        xAxis: pieCat.name,
        data: chartData,
      });
    }
  }

  // Chart 4: Scatter Correlation
  if (numCols.length >= 2) {
    const colX = numCols[0];
    const colY = numCols[1] || numCols[0];

    const chartData = data.slice(0, 40).map((row, idx) => ({
      name: `R-${idx + 1}`,
      xValue: Number(row[colX.name]) || 0,
      yValue: Number(row[colY.name]) || 0,
    }));

    charts.push({
      id: "scatter-corr",
      title: `${colX.name} vs ${colY.name} Scatter Relationship`,
      type: "scatter",
      xAxis: colX.name,
      yAxis: colY.name,
      data: chartData as any,
    });
  }

  // Chart 5: Category Counts densities (Bar Chart)
  if (catCols.length > 1) {
    const densityCat = catCols[1] || catCols[0];
    if (densityCat.distinctCount >= 2) {
      const countMap: { [key: string]: number } = {};
      data.forEach((row) => {
        const catVal = String(row[densityCat.name] || "N/A");
        countMap[catVal] = (countMap[catVal] || 0) + 1;
      });

      const chartData = Object.entries(countMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      charts.push({
        id: "density-bar",
        title: `Volume Density of ${densityCat.name}`,
        type: "bar",
        xAxis: densityCat.name,
        yAxis: "Logs Volume",
        data: chartData,
      });
    }
  }

  return charts.filter((c) => c.data && c.data.length > 0).slice(0, 4);
}
