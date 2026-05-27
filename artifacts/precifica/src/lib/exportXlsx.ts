import * as XLSX from "xlsx";
import type { AdminFinanceiro } from "./adminFetch";

const HEADER_FILL = { patternType: "solid", fgColor: { rgb: "1A3A5C" } };
const HEADER_FONT = { bold: true, color: { rgb: "FFFFFF" }, sz: 11 };
const HEADER_ALIGN = { horizontal: "center", vertical: "center" };

const BOLD = { font: { bold: true, sz: 11 } };
const BOLD_HEADER = { font: HEADER_FONT, fill: HEADER_FILL, alignment: HEADER_ALIGN };

const FMT_CURRENCY = '"R$ "##0.00';
const FMT_DATE = "DD/MM/YYYY";

function setCellStyle(ws: XLSX.WorkSheet, addr: string, style: object) {
  const cell = ws[addr];
  if (cell) (cell as XLSX.CellObject & { s: object }).s = style;
}

function applyStyle(
  ws: XLSX.WorkSheet,
  range: XLSX.Range,
  col: number,
  fmt?: string,
  style?: object
) {
  for (let r = range.s.r; r <= range.e.r; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: col });
    const cell: (XLSX.CellObject & { s?: object }) | undefined = ws[addr];
    if (!cell) continue;
    if (fmt) cell.z = fmt;
    if (style) cell.s = style;
  }
}

export function exportFinanceiroXlsx(data: AdminFinanceiro): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Financeiro ─────────────────────────────────────
  const headers = ["Nome", "E-mail", "Plano", "Valor (R$)", "Data", "Status"];

  const sheetRows = data.historico.map(row => [
    row.nomeCompleto ?? "",
    row.email ?? "",
    row.plano === "premium" ? "Premium" : row.plano === "pro" ? "Pro" : "Grátis",
    row.valor,
    row.createdAt ? new Date(row.createdAt) : "",
    row.status === "ativo" ? "Ativo" : "Cancelado",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sheetRows], { cellDates: true });

  // Header styles
  headers.forEach((_, i) => {
    setCellStyle(ws, XLSX.utils.encode_cell({ r: 0, c: i }), BOLD_HEADER);
  });

  const range = XLSX.utils.decode_range(ws["!ref"]!);
  const dataRange: XLSX.Range = { s: { r: 1, c: 0 }, e: range.e };

  // Valor (R$) — col 3: numeric with currency format
  applyStyle(ws, dataRange, 3, FMT_CURRENCY);
  // Data — col 4: date format
  applyStyle(ws, dataRange, 4, FMT_DATE);

  // Right-align Valor column (header + data)
  for (let r = 0; r <= range.e.r; r++) {
    const cell: (XLSX.CellObject & { s?: object }) | undefined =
      ws[XLSX.utils.encode_cell({ r, c: 3 })];
    if (cell) {
      cell.s = r === 0
        ? { ...BOLD_HEADER, alignment: { horizontal: "right", vertical: "center" } }
        : { alignment: { horizontal: "right" } };
    }
  }

  // Column widths
  ws["!cols"] = [
    { wch: 28 }, // Nome
    { wch: 34 }, // E-mail
    { wch: 10 }, // Plano
    { wch: 14 }, // Valor
    { wch: 12 }, // Data
    { wch: 10 }, // Status
  ];

  // Freeze first row
  (ws as XLSX.WorkSheet & { "!views": object[] })["!views"] = [
    { state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" },
  ];

  // AutoFilter on all header columns
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }) };

  XLSX.utils.book_append_sheet(wb, ws, "Financeiro");

  // ── Sheet 2: Resumo ──────────────────────────────────────────
  const totalAssinantes =
    data.receitaPorPlano.pro.count + data.receitaPorPlano.premium.count;
  const geradoEm = new Date().toLocaleDateString("pt-BR");

  const resumoRows: (string | number)[][] = [
    ["Resumo Financeiro", ""],
    ["Gerado em:", geradoEm],
    ["", ""],
    ["Indicador", "Valor"],
    ["MRR Atual (R$)", data.mrrAtual],
    ["Total de Assinantes Ativos", totalAssinantes],
    ["", ""],
    ["Assinantes Pro", data.receitaPorPlano.pro.count],
    ["Receita Pro / mês (R$)", data.receitaPorPlano.pro.receita],
    ["", ""],
    ["Assinantes Premium", data.receitaPorPlano.premium.count],
    ["Receita Premium / mês (R$)", data.receitaPorPlano.premium.receita],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);

  // Title
  setCellStyle(wsResumo, "A1", { font: { bold: true, sz: 14 } });
  // Section header row
  setCellStyle(wsResumo, "A4", BOLD);
  setCellStyle(wsResumo, "B4", BOLD);

  // Currency cells
  (["B5", "B9", "B12"] as const).forEach(addr => {
    const cell: (XLSX.CellObject & { z?: string }) | undefined = wsResumo[addr];
    if (cell) { cell.t = "n"; cell.z = FMT_CURRENCY; }
  });

  wsResumo["!cols"] = [{ wch: 32 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // ── Download ─────────────────────────────────────────────────
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true }) as ArrayBuffer;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "financeiro-admin.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
