// Utilidades de formato de fechas y meses contables para LinkeoGes

export const ACCOUNTING_MONTHS = [
  'Enero 2026',
  'Febrero 2026',
  'Marzo 2026',
  'Abril 2026',
  'Mayo 2026',
  'Junio 2026',
  'Julio 2026',
  'Agosto 2026',
  'Septiembre 2026',
  'Octubre 2026',
  'Noviembre 2026',
  'Diciembre 2026'
];

/**
 * Obtiene el mes contable en formato legible en español a partir de una fecha YYYY-MM-DD
 * Sin desfases de zona horaria UTC.
 */
export const getAccountingMonth = (dateStr) => {
  if (!dateStr) return 'Septiembre 2026';
  try {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${year}`;
      }
    }
  } catch (e) {}
  return 'Septiembre 2026';
};
