import { calculateFinance } from './financeUtils.js';
import * as XLSX from 'xlsx';

/**
 * Genera y descarga un archivo .xlsx completo con múltiples pestañas organizadas
 * para que Luis Romero y Kevin Servat puedan analizar la información o usar fórmulas avanzadas en Excel.
 */
export function exportLinkeoGesToExcel({
  sales = [],
  expenses = [],
  nfcCards = [],
  inventory = [],
  leads = [],
  plan30Days = [],
  products = [], suppliers = [], calendarEvents = [], projectPhases = [], projectionsData = {}, auditLogs = [], districts = [],
  targets = {}
}) {
  const wb = XLSX.utils.book_new();

  // 1. HOJA: RESUMEN EJECUTIVO Y BALANCES ENTRE SOCIOS
  const finance = calculateFinance(sales, expenses);
  const { totalSalesAmount, totalCost: totalCostSales, totalGrossProfit, totalExpenses, netProfit, paidByKevin: expensesKevin, paidByLuis: expensesLuis, halfExpense, debtLuisToKevin } = finance;

  const summaryData = [
    ['LINKEO - SISTEMA DE CONTROL FINANCIERO Y OPERATIVO (LinkeoGes)'],
    ['Fecha de Generación:', new Date().toLocaleString('es-PE')],
    ['Página Web Oficial:', 'https://linkeocards.com/'],
    [],
    ['INDICADORES CLAVE (KPIs)', 'VALOR', 'META MENSUAL', 'CUMPLIMIENTO %'],
    ['Total Facturado (Ventas)', totalSalesAmount, targets.monthlyRevenueEstimate || 5100, (totalSalesAmount / (targets.monthlyRevenueEstimate || 5100))],
    ['Costo de Ventas (Mercadería)', totalCostSales, '-', '-'],
    ['Margen Bruto de Ventas', totalGrossProfit, '-', '-'],
    ['Gastos Operativos e Importaciones', totalExpenses, 100, '-'],
    ['Utilidad Neta Real', netProfit, targets.monthlyProfitTarget || 4000, (netProfit / (targets.monthlyProfitTarget || 4000))],
    ['Unidades Vendidas', sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0), targets.monthlyUnitsTarget || 75, (sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0) / (targets.monthlyUnitsTarget || 75))],
    [],
    ['BALANCE Y CUENTAS CLARAS ENTRE SOCIOS (50% / 50%)', 'MONTO (S/)', 'OBSERVACIÓN'],
    ['Aporte Total de Kevin Servat en Gastos', expensesKevin, 'Desembolsado de su bolsillo/tarjeta'],
    ['Aporte Total de Luis Romero en Gastos', expensesLuis, 'Desembolsado de su bolsillo/tarjeta'],
    ['Aporte correspondiente por socio (50%)', halfExpense, 'Cada socio debe asumir la mitad'],
    ['Saldo entre socios', debtLuisToKevin > 0 ? `Luis Romero debe a Kevin Servat S/ ${debtLuisToKevin.toFixed(2)}` : `Kevin Servat debe a Luis Romero S/ ${Math.abs(debtLuisToKevin).toFixed(2)}`, 'Balance para cuadre exacto']
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

  // 2. HOJA: VENTAS Y CLIENTES
  const salesHeaders = [
    ['N° Venta', 'Fecha', 'Cliente / Negocio', 'Contacto', 'Teléfono', 'Distrito', 'Producto / Pack', 'Cantidad', 'Precio Unitario (S/)', 'Total Venta (S/)', 'Costo Estimado (S/)', 'Margen (S/)', 'Método Pago', 'Vendido Por', 'Estado', 'IDs Tarjetas NFC']
  ];
  const salesRows = sales.map(s => [
    s.saleNumber || s.id,
    s.date,
    s.clientName,
    s.contactPerson || '',
    s.phone || '',
    s.district || '',
    s.productName,
    s.quantity,
    s.unitPrice,
    s.totalAmount,
    s.cost,
    s.profit,
    s.paymentMethod,
    s.soldBy === 'luis' ? 'Luis Romero' : 'Kevin Servat',
    s.status,
    (s.cardIds || []).join(', ')
  ]);
  const wsSales = XLSX.utils.aoa_to_sheet([...salesHeaders, ...salesRows]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Ventas');

  // 3. HOJA: INGRESOS Y GASTOS (Compatible con fórmulas SUMAR.SI.CONJUNTO)
  const expenseHeaders = [
    ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto (S/)', 'Método de Pago', 'Socio Responsable', 'Mes', 'Notas / Liquidación']
  ];
  const expenseRows = expenses.map(e => [
    e.date,
    e.type,
    e.category,
    e.description,
    e.amount,
    e.paymentMethod,
    e.paidBy === 'luis' ? 'Luis Romero' : 'Kevin Servat',
    e.month || '',
    e.notes || ''
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([...expenseHeaders, ...expenseRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Ingresos y Gastos');

  // 4. HOJA: TRAZABILIDAD CHIPS Y GOOGLE PLACE ID (CORE NFC)
  const nfcHeaders = [
    ['Código Tarjeta', 'UID Chip Físico', 'Modelo', 'Negocio Asignado', 'Rubro', 'Distrito', 'Dirección', 'Contacto', 'Teléfono', 'Google Place ID', 'URL Directa de Reseña', 'Fecha Asignada', 'Vencimiento Anual', 'Estado']
  ];
  const nfcRows = nfcCards.map(c => [
    c.id,
    c.chipUid || '',
    c.model,
    c.businessName,
    c.category || '',
    c.district || '',
    c.address || '',
    c.contactName || '',
    c.contactPhone || '',
    c.placeId || '',
    c.reviewUrl || '',
    c.assignedDate || '',
    c.renewalDate || '',
    c.status
  ]);
  const wsNfc = XLSX.utils.aoa_to_sheet([...nfcHeaders, ...nfcRows]);
  XLSX.utils.book_append_sheet(wb, wsNfc, 'Chips NFC y Place IDs');

  // 5. HOJA: CONTROL DE INVENTARIO Y STOCK
  const invHeaders = [
    ['SKU', 'Nombre de Insumo / Producto', 'Categoría', 'Stock Actual', 'Mínimo de Alerta', 'Costo Unitario (S/)', 'Valor Total en Stock (S/)', 'Proveedor Principal', 'Tiempo Reposición (Días)', 'Estado']
  ];
  const invRows = inventory.map(i => [
    i.sku,
    i.name,
    i.category,
    i.quantity,
    i.minThreshold,
    i.unitCost,
    (i.quantity * i.unitCost).toFixed(2),
    i.supplier,
    i.leadTimeDays,
    i.quantity <= i.minThreshold ? 'ALERTA REPOSICIÓN' : 'ÓPTIMO'
  ]);
  const wsInv = XLSX.utils.aoa_to_sheet([...invHeaders, ...invRows]);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Inventario');

  // 6. HOJA: PIPELINE Y LEADS B2B
  const leadHeaders = [
    ['Negocio', 'Rubro', 'Distrito', 'Dirección', 'Google Maps', 'Contacto', 'Teléfono', 'Email', 'Etapa Pipeline', 'Producto Interés', 'Valor Estimado (S/)', 'Asignado A', 'Próximo Paso', 'Fecha Próximo Paso', 'Notas']
  ];
  const leadRows = leads.map(l => [
    l.businessName,
    l.rubro,
    l.district,
    l.address || '',
    l.googleMapsUrl || '',
    l.contactName,
    l.phone,
    l.email || '',
    l.stage,
    l.interestedProduct,
    l.estimatedValue,
    l.assignedTo === 'luis' ? 'Luis Romero' : 'Kevin Servat',
    l.nextStepNote || '',
    l.nextStepDate || '',
    l.notes || ''
  ]);
  const wsLeads = XLSX.utils.aoa_to_sheet([...leadHeaders, ...leadRows]);
  XLSX.utils.book_append_sheet(wb, wsLeads, 'Pipeline Leads');

  // 7. HOJA: PLAN DE ACCIÓN 30 DÍAS
  const planHeaders = [
    ['Día', 'Semana', 'Acción Principal', 'Meta Medible', 'Canal', 'Responsable', 'Estado', 'Resultado / Aprendizaje']
  ];
  const planRows = plan30Days.map(p => [
    p.day,
    p.week,
    p.action,
    p.target,
    p.channel,
    p.responsible,
    p.completed ? 'Completado' : 'Pendiente',
    p.result || ''
  ]);
  const wsPlan = XLSX.utils.aoa_to_sheet([...planHeaders, ...planRows]);
  XLSX.utils.book_append_sheet(wb, wsPlan, 'Plan 30 Dias');

  // Ajuste automático de anchos de columna para una visualización premium en Excel
  [wsSummary, wsSales, wsExpenses, wsNfc, wsInv, wsLeads, wsPlan].forEach(ws => {
    ws['!cols'] = [
      { wch: 18 }, { wch: 22 }, { wch: 25 }, { wch: 22 }, { wch: 20 },
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
    ];
  });

  for (const [name, rows] of Object.entries({ Catálogo: products, Proveedores: suppliers, Agenda: calendarEvents,
    Auditoría: auditLogs, Distritos: districts.map(name => ({ name })), Fases: projectPhases,
    Proyecciones: [{ configuración: JSON.stringify(projectionsData) }] })) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key, typeof value === 'object' && value !== null ? JSON.stringify(value) : value])))), name);
  }
  const filename = `LinkeoGes_Control_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
