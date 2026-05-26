import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { ReporteCategoriasResponse, ReporteDashboardResponse } from './reporte.service';

@Injectable({
  providedIn: 'root'
})
export class ReportePdfService {
  generarDashboardExcel(data: ReporteDashboardResponse, filename = 'reporte-estadisticas.xlsx'): void {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'STOQ';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Dashboard', {
      views: [{ state: 'frozen', ySplit: 6 }]
    });

    sheet.columns = [
      { width: 4 },
      { width: 28 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 }
    ];

    sheet.mergeCells('B1:F1');
    sheet.getCell('B1').value = 'Reporte estadístico';
    this.styleTitleCell(sheet.getCell('B1'));

    sheet.mergeCells('B2:F2');
    sheet.getCell('B2').value = 'Vista ejecutiva del inventario';
    this.styleSubtitleCell(sheet.getCell('B2'));

    this.writeInfoBlock(sheet, 4, [
      ['Empresa', data.empresa || 'Sin empresa'],
      ['Rango', `${data.inicio} → ${data.fin}`],
      ['Generado', new Date().toLocaleString('es-ES')]
    ]);

    this.writeSectionHeader(sheet, 8, 'Resumen ejecutivo');
    this.writeMetricCards(sheet, 9, [
      ['Total productos', data.totalProductos],
      ['Bajo stock', data.productosBajoStock],
      ['Categorías', data.totalCategorias],
      ['Movimientos', data.movimientosTotales],
      ['Entradas', data.entradasMovimientos],
      ['Salidas', data.salidasMovimientos]
    ]);

    this.writeSectionHeader(sheet, 15, 'Top categorías');
    this.writeTable(sheet, 16, ['#', 'Categoría', 'Movimientos', 'Stock', 'Cantidad'], data.categorias.slice(0, 8).map((item, index) => [
      index + 1,
      item.categoriaNombre,
      item.movimientosTotales,
      item.stockActualTotal,
      item.cantidadMovidaTotal
    ]));

    void this.saveWorkbook(workbook, filename);
  }

  generarCategoriasExcel(data: ReporteCategoriasResponse, filename = 'reporte-categorias.xlsx'): void {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'STOQ';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Categorias', {
      views: [{ state: 'frozen', ySplit: 6 }]
    });

    sheet.columns = [
      { width: 4 },
      { width: 28 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 }
    ];

    sheet.mergeCells('B1:F1');
    sheet.getCell('B1').value = 'Reporte por categorías';
    this.styleTitleCell(sheet.getCell('B1'));

    sheet.mergeCells('B2:F2');
    sheet.getCell('B2').value = 'Resumen operativo del inventario';
    this.styleSubtitleCell(sheet.getCell('B2'));

    this.writeInfoBlock(sheet, 4, [
      ['Empresa', data.empresa || 'Sin empresa'],
      ['Rango', `${data.inicio} → ${data.fin}`],
      ['Generado', new Date().toLocaleString('es-ES')]
    ]);

    this.writeSectionHeader(sheet, 8, 'Indicadores');
    this.writeMetricCards(sheet, 9, [
      ['Categorías', data.totalCategorias],
      ['Productos activos', data.productosActivos],
      ['Stock total', data.stockActualTotal],
      ['Movimientos', data.movimientosTotales]
    ]);

    this.writeSectionHeader(sheet, 15, 'Detalle por categoría');
    this.writeTable(sheet, 16, ['#', 'Categoría', 'Productos', 'Stock', 'Movimientos', 'Cantidad'], data.categorias.slice(0, 12).map((item, index) => [
      index + 1,
      item.categoriaNombre,
      item.productosActivos,
      item.stockActualTotal,
      item.movimientosTotales,
      item.cantidadMovidaTotal
    ]));

    void this.saveWorkbook(workbook, filename);
  }

  generarDashboardPdf(data: ReporteDashboardResponse, filename = 'reporte-estadisticas.pdf'): void {
    const doc = this.createBaseDocument('Reporte estadístico', 'Vista ejecutiva del inventario');
    let y = 56;

    y = this.addMetaBlock(doc, y, [
      ['Empresa', data.empresa || 'Sin empresa'],
      ['Rango', `${data.inicio} → ${data.fin}`],
      ['Generado', new Date().toLocaleString('es-ES')]
    ]);

    y += 4;
    y = this.addSectionTitle(doc, y, 'Resumen ejecutivo');
    y = this.addStatsGrid(doc, y, [
      { label: 'Total productos', value: data.totalProductos },
      { label: 'Bajo stock', value: data.productosBajoStock },
      { label: 'Categorías', value: data.totalCategorias },
      { label: 'Movimientos', value: data.movimientosTotales },
      { label: 'Entradas', value: data.entradasMovimientos },
      { label: 'Salidas', value: data.salidasMovimientos }
    ]);

    y += 4;
    y = this.addSectionTitle(doc, y, 'Top categorías');
    y = this.addCategoryTable(doc, y, data.categorias.slice(0, 8).map((item, index) => ({
      index: index + 1,
      name: item.categoriaNombre,
      movimientos: item.movimientosTotales,
      stock: item.stockActualTotal,
      cantidad: item.cantidadMovidaTotal
    })));

    this.finalizeDocument(doc, filename);
  }

  generarCategoriasPdf(data: ReporteCategoriasResponse, filename = 'reporte-categorias.pdf'): void {
    const doc = this.createBaseDocument('Reporte por categorías', 'Resumen operativo del inventario');
    let y = 56;

    y = this.addMetaBlock(doc, y, [
      ['Empresa', data.empresa || 'Sin empresa'],
      ['Rango', `${data.inicio} → ${data.fin}`],
      ['Generado', new Date().toLocaleString('es-ES')]
    ]);

    y += 4;
    y = this.addSectionTitle(doc, y, 'Indicadores');
    y = this.addStatsGrid(doc, y, [
      { label: 'Categorías', value: data.totalCategorias },
      { label: 'Productos activos', value: data.productosActivos },
      { label: 'Stock total', value: data.stockActualTotal },
      { label: 'Movimientos', value: data.movimientosTotales }
    ]);

    y += 4;
    y = this.addSectionTitle(doc, y, 'Detalle por categoría');
    y = this.addCategoryTable(doc, y, data.categorias.slice(0, 12).map((item, index) => ({
      index: index + 1,
      name: item.categoriaNombre,
      movimientos: item.movimientosTotales,
      stock: item.stockActualTotal,
      cantidad: item.cantidadMovidaTotal
    })));

    this.finalizeDocument(doc, filename);
  }

  private async saveWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    this.downloadBlob(blob, filename);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private styleTitleCell(cell: ExcelJS.Cell): void {
    cell.font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  }

  private styleSubtitleCell(cell: ExcelJS.Cell): void {
    cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  }

  private writeInfoBlock(sheet: ExcelJS.Worksheet, row: number, rows: Array<[string, string]>): void {
    const startCol = 2;
    const endCol = 6;

    rows.forEach(([label, value], index) => {
      const currentRow = sheet.getRow(row + index);
      currentRow.height = 20;

      const labelCell = currentRow.getCell(startCol);
      labelCell.value = label;
      labelCell.font = { bold: true, color: { argb: 'FF475467' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      labelCell.border = this.softBorder();

      const valueCell = currentRow.getCell(startCol + 1);
      valueCell.value = value;
      valueCell.font = { color: { argb: 'FF0F172A' }, bold: true };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      valueCell.border = this.softBorder();

      for (let col = startCol + 2; col <= endCol; col++) {
        currentRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  }

  private writeSectionHeader(sheet: ExcelJS.Worksheet, row: number, title: string): void {
    const currentRow = sheet.getRow(row);
    currentRow.height = 20;
    const cell = currentRow.getCell(2);
    cell.value = title;
    cell.font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.border = this.softBorder();
  }

  private writeMetricCards(sheet: ExcelJS.Worksheet, row: number, metrics: Array<[string, number]>): void {
    let currentRowIndex = row;
    let currentCol = 2;

    metrics.forEach((metric, index) => {
      const cell = sheet.getRow(currentRowIndex).getCell(currentCol);
      cell.value = `${metric[0]}\n${metric[1]}`;
      cell.alignment = { wrapText: true, horizontal: 'left', vertical: 'middle' };
      cell.font = { bold: true, size: 11, color: { argb: index % 2 === 0 ? 'FF0EA5E9' : 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.border = this.softBorder();
      sheet.getRow(currentRowIndex).height = 30;

      currentCol += 2;
      if (currentCol > 5) {
        currentCol = 2;
        currentRowIndex += 1;
      }
    });
  }

  private writeTable(sheet: ExcelJS.Worksheet, row: number, headers: string[], rows: Array<Array<string | number>>): void {
    const headerRow = sheet.getRow(row);
    headerRow.height = 20;
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 2);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = this.softBorder();
    });

    rows.forEach((values, index) => {
      const currentRow = sheet.getRow(row + index + 1);
      currentRow.height = 18;
      values.forEach((value, cellIndex) => {
        const cell = currentRow.getCell(cellIndex + 2);
        cell.value = value;
        cell.border = this.softBorder();
        cell.alignment = { horizontal: cellIndex === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' }
        };
        cell.font = { color: { argb: 'FF0F172A' } };
      });
    });
  }

  private softBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  }

  private createBaseDocument(title: string, subtitle: string): jsPDF {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(title, 16, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtitle, 16, 24);

    doc.setTextColor(15, 23, 42);
    return doc;
  }

  private addMetaBlock(doc: jsPDF, startY: number, rows: Array<[string, string]>): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxX = 16;
    const boxY = startY;
    const boxW = pageWidth - 32;
    const boxH = 24 + rows.length * 7;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    let y = boxY + 8;
    rows.forEach(([label, value]) => {
      doc.text(`${label}:`, boxX + 8, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(value, boxX + 42, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      y += 7;
    });

    doc.setTextColor(15, 23, 42);
    return boxY + boxH + 8;
  }

  private addSectionTitle(doc: jsPDF, startY: number, title: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineY = startY + 2;

    doc.setFillColor(30, 64, 175);
    doc.roundedRect(16, startY - 1, 6, 6, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 25, lineY + 2);

    doc.setDrawColor(226, 232, 240);
    doc.line(16, startY + 7, pageWidth - 16, startY + 7);
    return startY + 12;
  }

  private addStatsGrid(
    doc: jsPDF,
    startY: number,
    items: Array<{ label: string; value: number }>
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const columnWidth = (pageWidth - 40) / 2;
    const cardHeight = 18;
    let x = 16;
    let y = startY;

    items.forEach((item, index) => {
      if (index % 2 === 0 && index > 0) {
        x = 16;
        y += cardHeight + 6;
      }

      const accent = index % 2 === 0 ? [14, 165, 233] : [15, 23, 42];
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, columnWidth, cardHeight, 4, 4, 'FD');

      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.roundedRect(x + 4, y + 4, 5, 5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, x + 14, y + 9);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.value), x + 14, y + 15);

      x += columnWidth + 8;
    });

    const rows = Math.ceil(items.length / 2);
    return y + cardHeight + 6;
  }

  private addCategoryTable(
    doc: jsPDF,
    startY: number,
    rows: Array<{ index: number; name: string; movimientos: number; stock: number; cantidad: number }>
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const colX = [16, 26, 98, 135, 168];
    let y = startY;

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(16, y, pageWidth - 32, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('#', colX[0], y + 6.5);
    doc.text('Categoría', colX[1], y + 6.5);
    doc.text('Movimientos', colX[2], y + 6.5);
    doc.text('Stock', colX[3], y + 6.5);
    doc.text('Cantidad', colX[4], y + 6.5);

    y += 14;
    doc.setTextColor(15, 23, 42);

    rows.forEach((row, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(16, y - 4, pageWidth - 32, 10, 2, 2, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(String(row.index), colX[0], y);

      doc.setFont('helvetica', 'normal');
      doc.text(this.truncate(row.name, 36), colX[1], y);
      doc.text(String(row.movimientos), colX[2], y);
      doc.text(String(row.stock), colX[3], y);
      doc.text(String(row.cantidad), colX[4], y);

      y += 8;
    });

    return y;
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }

  private finalizeDocument(doc: jsPDF, filename: string): void {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado por STOQ · ${new Date().toLocaleString('es-ES')}`, 16, 284);
    doc.save(filename);
  }
}