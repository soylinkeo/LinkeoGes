/**
 * Utilidades para cálculo dinámico de metas y proyecciones financieras de LinkeoGes.
 */

export const DEFAULT_REINVESTMENT_PERCENT = 20;

/**
 * Calcula proyecciones financieras directas en base a las unidades reales o proyectadas de cada producto (Bottom-Up).
 * Deduce la facturación bruta, fondo de reposición de mercadería, margen bruto, gastos fijos,
 * utilidad neta del negocio, fondo de reinversión para crecimiento y utilidad distribuible para los socios.
 */
export function calculateUnitsProjection({
  projectedProducts = [],
  fixedCosts = [],
  variableCosts = [],
  variableUnitCosts = {},
  businessParams = {}
}) {
  const activeProducts = (projectedProducts || []).filter(p => p && p.included !== false);
  const partnersCount = Math.max(1, Number(businessParams?.partnersCount) || 2);
  const salesDays = Math.max(1, Number(businessParams?.salesDaysPerMonth) || 30);
  const reinvestmentPercent = businessParams?.reinvestmentPercent !== undefined
    ? Math.max(0, Math.min(100, Number(businessParams.reinvestmentPercent) || 0))
    : DEFAULT_REINVESTMENT_PERCENT;

  // Total gastos fijos
  const totalFixedCosts = (fixedCosts || []).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

  // Costos variables adicionales (comisión y fijos por unidad)
  let commonVariable = 0;
  let totalVariablePercent = 0;

  if (Array.isArray(variableCosts)) {
    variableCosts.forEach(item => {
      const amt = Number(item?.amount) || 0;
      if (item?.type === 'percentage') {
        totalVariablePercent += amt;
      } else {
        commonVariable += amt;
      }
    });
  } else {
    commonVariable = 
      (Number(variableUnitCosts?.packagingPerUnit) || 0) +
      (Number(variableUnitCosts?.setupLaborPerUnit) || 0) +
      (Number(variableUnitCosts?.deliveryPerUnit) || 0) +
      (Number(variableUnitCosts?.defectReservePerUnit) || 0);
    totalVariablePercent = Number(variableUnitCosts?.paymentFeePercent) || 0;
  }

  // 1. Calcular unidades totales
  const totalUnits = activeProducts.reduce((sum, p) => sum + (Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0), 0);

  // 2. Desglose detallado por producto
  let grossRevenue = 0;
  let replacementFund = 0; // Costo base de insumos para reponer stock
  let totalVariableCosts = 0; // Costo variable total incluyendo fijos unitarios y pasarela

  const products = activeProducts.map(p => {
    const units = Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0;
    const price = Number(p.price) || 0;
    const baseCost = Number(p.baseCost) || 0;
    const paymentFee = price * (totalVariablePercent / 100);
    const unitVariableCost = baseCost + commonVariable + paymentFee;
    const unitMargin = price - unitVariableCost;
    const marginPct = price > 0 ? (unitMargin / price) * 100 : 0;

    const prodRevenue = units * price;
    const prodReplacementCost = units * baseCost;
    const prodTotalVarCost = units * unitVariableCost;
    const prodMargin = prodRevenue - prodTotalVarCost;

    const mixPercent = totalUnits > 0 ? Math.round((units / totalUnits) * 1000) / 10 : 0;

    grossRevenue += prodRevenue;
    replacementFund += prodReplacementCost;
    totalVariableCosts += prodTotalVarCost;

    return {
      ...p,
      units,
      price,
      baseCost,
      unitVariableCost,
      unitMargin,
      marginPct,
      mixPercent,
      prodRevenue,
      prodReplacementCost,
      prodTotalVarCost,
      prodMargin
    };
  });

  const grossMargin = grossRevenue - totalVariableCosts;
  const netProfit = Math.max(0, Math.round((grossMargin - totalFixedCosts) * 100) / 100);

  // Fondo de reinversión para crecimiento de Linkeo
  const reinvestmentAmount = Math.round((netProfit * (reinvestmentPercent / 100)) * 100) / 100;
  const distributableProfit = Math.max(0, Math.round((netProfit - reinvestmentAmount) * 100) / 100);
  const profitPerPartner = Math.round((distributableProfit / partnersCount) * 100) / 100;
  const grossProfitPerPartner = Math.round((netProfit / partnersCount) * 100) / 100;

  // Ritmo diario
  const unitsPerDay = salesDays > 0 ? Math.round((totalUnits / salesDays) * 100) / 100 : 0;
  const revenuePerDay = salesDays > 0 ? Math.round((grossRevenue / salesDays) * 100) / 100 : 0;

  return {
    totalUnits,
    grossRevenue,
    replacementFund,
    totalVariableCosts,
    grossMargin,
    totalFixedCosts,
    netProfit,
    reinvestmentPercent,
    reinvestmentAmount,
    distributableProfit,
    profitPerPartner,
    grossProfitPerPartner,
    salesDays,
    unitsPerDay,
    revenuePerDay,
    partnersCount,
    products
  };
}

/**
 * Calcula las metas dinámicas mensuales en base a los parámetros configurados.
 */
export function computeDynamicTargets(projectionsData, fallbackTargets = {}) {
  const fallback = {
    monthlyProfitTarget: Number(fallbackTargets.monthlyProfitTarget) || 4000.00,
    monthlyUnitsTarget: Number(fallbackTargets.monthlyUnitsTarget) || 75,
    targetPerPartner: Number(fallbackTargets.targetPerPartner) || 2000.00,
    monthlyRevenueEstimate: Number(fallbackTargets.monthlyRevenueEstimate) || 5100.00
  };

  if (!projectionsData) return fallback;

  const businessParams = projectionsData.businessParams || {};
  const fixedCosts = projectionsData.fixedCosts || [];
  const variableUnitCosts = projectionsData.variableUnitCosts || {};
  const projectedProducts = (projectionsData.projectedProducts || []).filter(p => p.included !== false);

  const customProfitTarget = Number(businessParams.customProfitTarget) || 0;
  const customRevenueTarget = Number(businessParams.customRevenueTarget) || 0;
  const targetProfit = customProfitTarget > 0 ? customProfitTarget : fallback.monthlyProfitTarget;
  const partnersCount = Number(businessParams.partnersCount) || 2;
  const targetPerPartner = partnersCount > 0 ? targetProfit / partnersCount : targetProfit / 2;

  const reinvestmentPercent = businessParams.reinvestmentPercent !== undefined
    ? Number(businessParams.reinvestmentPercent)
    : DEFAULT_REINVESTMENT_PERCENT;
  const reinvestmentAmount = targetProfit > 0 && reinvestmentPercent > 0
    ? Math.round(targetProfit * (reinvestmentPercent / 100) * 100) / 100
    : 0;
  const distributableProfit = Math.max(0, targetProfit - reinvestmentAmount);
  const cleanProfitPerPartner = partnersCount > 0 ? distributableProfit / partnersCount : distributableProfit / 2;

  if (projectedProducts.length === 0) {
    return {
      monthlyProfitTarget: targetProfit,
      monthlyUnitsTarget: fallback.monthlyUnitsTarget,
      targetPerPartner,
      cleanProfitPerPartner,
      reinvestmentPercent,
      reinvestmentAmount,
      distributableProfit,
      monthlyRevenueEstimate: customRevenueTarget > 0 ? customRevenueTarget : fallback.monthlyRevenueEstimate,
      isCustom: customProfitTarget > 0 || customRevenueTarget > 0
    };
  }

  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  let commonVariable = 0;
  let totalVariablePercent = 0;

  if (Array.isArray(projectionsData.variableCosts)) {
    projectionsData.variableCosts.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'percentage') {
        totalVariablePercent += amt;
      } else {
        commonVariable += amt;
      }
    });
  } else {
    commonVariable = 
      (Number(variableUnitCosts.packagingPerUnit) || 0) +
      (Number(variableUnitCosts.setupLaborPerUnit) || 0) +
      (Number(variableUnitCosts.deliveryPerUnit) || 0) +
      (Number(variableUnitCosts.defectReservePerUnit) || 0);
    totalVariablePercent = Number(variableUnitCosts.paymentFeePercent) || 0;
  }

  const totalMix = projectedProducts.reduce((sum, p) => sum + (Number(p.mixPercent) || 0), 0) || 100;

  let weightedPrice = 0;
  let weightedMargin = 0;

  projectedProducts.forEach(p => {
    const price = Number(p.price) || 0;
    const baseCost = Number(p.baseCost) || 0;
    const paymentFee = price * (totalVariablePercent / 100);
    const unitVarCost = baseCost + commonVariable + paymentFee;
    const margin = price - unitVarCost;
    const mix = (Number(p.mixPercent) || 0) / totalMix;

    weightedPrice += price * mix;
    weightedMargin += margin * mix;
  });

  const hasBottomUpUnits = projectedProducts.some(p => Number(p.targetUnits) > 0);
  const unitsProj = hasBottomUpUnits ? calculateUnitsProjection(projectionsData) : null;
  const bottomUpGrossRevenue = unitsProj ? unitsProj.grossRevenue : 0;

  let requiredUnits = 0;
  if (weightedMargin > 0) {
    const raw = (totalFixedCosts + targetProfit) / weightedMargin;
    const normalized = Math.round(raw * 10000) / 10000;
    requiredUnits = Math.ceil(normalized);
  }

  const grossRevenue = customRevenueTarget > 0 
    ? customRevenueTarget 
    : (bottomUpGrossRevenue > 0 ? bottomUpGrossRevenue : (requiredUnits * weightedPrice));

  return {
    monthlyProfitTarget: (hasBottomUpUnits && customProfitTarget <= 0 && unitsProj?.netProfit !== undefined) ? unitsProj.netProfit : targetProfit,
    monthlyUnitsTarget: (hasBottomUpUnits && unitsProj?.totalUnits > 0) ? unitsProj.totalUnits : requiredUnits,
    isFeasible: weightedMargin > 0,
    warning: weightedMargin <= 0 ? "La mezcla de productos no genera margen positivo: la meta no es alcanzable." : "",
    targetPerPartner: (hasBottomUpUnits && customProfitTarget <= 0 && unitsProj?.profitPerPartner !== undefined) ? unitsProj.profitPerPartner : targetPerPartner,
    cleanProfitPerPartner: (hasBottomUpUnits && customProfitTarget <= 0 && unitsProj?.profitPerPartner !== undefined) ? unitsProj.profitPerPartner : cleanProfitPerPartner,
    reinvestmentPercent,
    reinvestmentAmount: (hasBottomUpUnits && customProfitTarget <= 0 && unitsProj?.reinvestmentAmount !== undefined) ? unitsProj.reinvestmentAmount : reinvestmentAmount,
    distributableProfit: (hasBottomUpUnits && customProfitTarget <= 0 && unitsProj?.distributableProfit !== undefined) ? unitsProj.distributableProfit : distributableProfit,
    monthlyRevenueEstimate: grossRevenue,
    totalFixedCosts,
    weightedPrice,
    weightedMargin,
    isCustom: true
  };
}

/**
 * Obtiene la información real de stock físico y costo unitario desde el inventario del almacén
 */
export function getProductInventoryInfo(prod, inventoryList = [], productsList = []) {
  if (!prod) return { stock: null, cost: 0, invItem: null };

  // 1. Enlace directo mediante catalogId -> producto catálogo -> inventoryId
  const catalogProd = productsList.find(p => 
    p.id === prod.catalogId || 
    p.id === prod.id || 
    (p.sku && prod.sku && p.sku.trim().toLowerCase() === prod.sku.trim().toLowerCase())
  );
  
  let match = null;
  if (catalogProd?.inventoryId) {
    match = inventoryList.find(i => i.id === catalogProd.inventoryId);
  }

  // 2. Coincidencia exacta por SKU
  if (!match && prod.sku) {
    const cleanSku = String(prod.sku).trim().toLowerCase();
    match = inventoryList.find(i => i.sku && String(i.sku).trim().toLowerCase() === cleanSku);
  }

  // 3. Coincidencia exacta por nombre normalizado
  if (!match && prod.name) {
    const cleanName = String(prod.name).trim().toLowerCase();
    match = inventoryList.find(i => String(i.name || '').trim().toLowerCase() === cleanName);
  }

  // 4. Desambiguación semántica por modelo Linkeo (Cuadrado ESP vs Formato L ESP vs Cuadrado ING)
  if (!match && prod.name) {
    const pName = String(prod.name).toLowerCase();
    const isCuadrado = pName.includes('cuadrado');
    const isL = pName.includes('formato l') || pName.includes(' l ') || pName.endsWith(' l') || pName.includes('l esp');
    const isEsp = pName.includes('esp') || pName.includes('español');
    const isIng = pName.includes('ing') || pName.includes('inglés');

    match = inventoryList.find(i => {
      const iName = String(i.name || '').toLowerCase();
      if (isCuadrado && iName.includes('cuadrado')) {
        if (isEsp && (iName.includes('esp') || iName.includes('español'))) return true;
        if (isIng && (iName.includes('ing') || iName.includes('inglés'))) return true;
        if (!isEsp && !isIng) return true;
      }
      if (isL && (iName.includes('formato l') || iName.includes(' l') || iName.includes('l esp'))) {
        if (isEsp && (iName.includes('esp') || iName.includes('español'))) return true;
        return true;
      }
      return false;
    });
  }

  const stock = match ? (Number(match.quantity) || 0) : null;
  const cost = match && match.unitCost !== undefined && Number(match.unitCost) > 0 
    ? Number(match.unitCost) 
    : (Number(prod.baseCost || prod.cost) || 0);

  return { stock, cost, invItem: match };
}

/**
 * Calcula la custodia y cuadre de ventas recaudadas en cuentas personales
 * de los socios (Luis Romero y Kevin Servat) hasta la apertura de cuenta empresarial propia.
 */
export function calculatePartnerCashAccounts(sales = [], partnerCashAccounts = null) {
  const sumSales = (list, partnerKey) => {
    return list
      .filter(s => {
        const seller = String(s.soldBy || '').toLowerCase();
        if (partnerKey === 'luis') {
          return seller === 'luis' || seller.includes('romero');
        }
        if (partnerKey === 'kevin') {
          return seller === 'kevin' || seller.includes('servat');
        }
        return false;
      })
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  };

  const autoLuis = Math.round((sumSales(sales, 'luis') + Number.EPSILON) * 100) / 100;
  const autoKevin = Math.round((sumSales(sales, 'kevin') + Number.EPSILON) * 100) / 100;
  const totalSales = Math.round((sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0) + Number.EPSILON) * 100) / 100;

  const isCustom = !!partnerCashAccounts?.isCustom;
  const luisHeld = isCustom && partnerCashAccounts?.luis !== undefined
    ? Number(partnerCashAccounts.luis)
    : autoLuis;

  const kevinHeld = isCustom && partnerCashAccounts?.kevin !== undefined
    ? Number(partnerCashAccounts.kevin)
    : autoKevin;

  const totalInAccounts = Math.round((luisHeld + kevinHeld + Number.EPSILON) * 100) / 100;
  const pendingToAccount = Math.round((totalSales - totalInAccounts + Number.EPSILON) * 100) / 100;

  // Cuadre 50/50: Si Luis tiene más dinero en su cuenta que Kevin,
  // Luis debe transferirle la mitad de la diferencia a Kevin
  const targetPerPartner = Math.round((totalInAccounts / 2 + Number.EPSILON) * 100) / 100;
  const debtLuisToKevin = Math.round(((luisHeld - kevinHeld) / 2 + Number.EPSILON) * 100) / 100;

  return {
    totalSales,
    totalSalesAmount: totalSales,
    autoLuis,
    autoKevin,
    luisHeld,
    kevinHeld,
    totalInAccounts,
    pendingToAccount,
    targetPerPartner,
    debtLuisToKevin,
    isCustom
  };
}


