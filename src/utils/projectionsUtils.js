/**
 * Utilidades para cálculo dinámico de metas a partir de las proyecciones financieras de LinkeoGes.
 */

/**
 * Calcula las metas dinámicas mensuales (facturación, unidades, utilidad neta)
 * en base a los parámetros y productos configurados en Proyecciones.
 * Si las proyecciones no tienen productos activos o valores definidos, utiliza el fallback financiero.
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

  // Meta de utilidad y facturación personalizada elegida por los socios (o fallback si es 0)
  const customProfitTarget = Number(businessParams.customProfitTarget) || 0;
  const customRevenueTarget = Number(businessParams.customRevenueTarget) || 0;
  const targetProfit = customProfitTarget > 0 ? customProfitTarget : fallback.monthlyProfitTarget;
  const partnersCount = Number(businessParams.partnersCount) || 2;
  const targetPerPartner = partnersCount > 0 ? targetProfit / partnersCount : targetProfit / 2;

  // Si no hay productos proyectados configurados aún en el escenario libre
  if (projectedProducts.length === 0) {
    return {
      monthlyProfitTarget: targetProfit,
      monthlyUnitsTarget: fallback.monthlyUnitsTarget,
      targetPerPartner,
      monthlyRevenueEstimate: customRevenueTarget > 0 ? customRevenueTarget : fallback.monthlyRevenueEstimate,
      isCustom: customProfitTarget > 0 || customRevenueTarget > 0
    };
  }

  // Total de gastos fijos mensuales
  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Costo variable unitario común adicional y comisión porcentual
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

  // Suma de porcentajes de mezcla para normalizar
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

  // Unidades requeridas para cubrir fijos + meta de utilidad
  let requiredUnits = 0;
  if (weightedMargin > 0) {
    const raw = (totalFixedCosts + targetProfit) / weightedMargin;
    const normalized = Math.round(raw * 10000) / 10000;
    requiredUnits = Math.ceil(normalized);
  }



  const grossRevenue = customRevenueTarget > 0 ? customRevenueTarget : (requiredUnits * weightedPrice);

  return {
    monthlyProfitTarget: targetProfit,
    monthlyUnitsTarget: requiredUnits,
    isFeasible: weightedMargin > 0,
    warning: weightedMargin <= 0 ? "La mezcla de productos no genera margen positivo: la meta no es alcanzable." : "",
    targetPerPartner,
    monthlyRevenueEstimate: grossRevenue,
    totalFixedCosts,
    weightedPrice,
    weightedMargin,
    isCustom: true
  };
}
