/**
 * Generador de códigos SKU aleatorios para LinkeoGes
 * Formato por defecto: SKU-LNK-XXXX o LNK-PROD-XXXX (donde XXXX es un número aleatorio de 4 dígitos)
 */
export const generateRandomSku = (prefix = 'SKU-LNK') => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};
