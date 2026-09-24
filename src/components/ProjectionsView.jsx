import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Sliders, 
  Target, 
  Filter, 
  Sparkles, 
  Boxes,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Shuffle,
  Edit3,
  RotateCcw,
  FileSpreadsheet,
  Settings,
  Scale,
  Coins,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  PieChart
} from 'lucide-react';
import { generateRandomSku } from '../utils/skuUtils';
import { 
  calculateUnitsProjection, 
  DEFAULT_REINVESTMENT_PERCENT,
  getProductInventoryInfo
} from '../utils/projectionsUtils';
import { normalizeLeadStage } from '../utils/leadMessages';
import { 
  EXCEL_PLAN_30_DAYS_TEMPLATE, 
  EXCEL_FIXED_COSTS_TEMPLATE, 
  EXCEL_PROJECTED_PRODUCTS_TEMPLATE, 
  EXCEL_INITIAL_INVESTMENT_TEMPLATE,
  DEFAULT_VARIABLE_COSTS_TEMPLATE,
  STOCK_FABRICADO_30_TEMPLATE
} from '../data/initialData';

// Constantes para el Plan de Acción 30 Días
export const DEFAULT_PLAN_WEEK_TITLES = {
  1: 'Semana 1: Oferta & Muestras',
  2: 'Semana 2: Prospección Activa',
  3: 'Semana 3: Demostraciones & Cierres',
  4: 'Semana 4: Escala & Referidos',
  5: 'Semana 5: Crecimiento',
  6: 'Semana 6: Optimización',
  7: 'Semana 7: Expansión',
  8: 'Semana 8: Consolidación'
};

export const COMMON_CHANNELS = [
  'WhatsApp',
  'Presencial',
  'Instagram / DM',
  'Llamada',
  'Terreno',
  'Contenido',
  'Gestión',
  'Ventas',
  'Cierre',
  'Postventa'
];

export const COMMON_RESPONSIBLES = [
  'Luis Romero',
  'Kevin Servat',
  'Luis Romero / Kevin Servat'
];

export default function ProjectionsView({
  projectionsData,
  onUpdateProjectionsData,
  products = [],
  inventory = [],
  leads = [],
  sales = [],
  plan30Days = [],
  setPlan30Days,
  onTogglePlanTask,
  onAddPlanTask,
  onEditPlanTask,
  onRequestDelete,
  logAudit,
  currentUser,
  setCurrentTab,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('goals'); // 'goals', 'products', 'costs', 'funnel', 'plan30'

  // Modales de Creación y Edición
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isImportProductModalOpen, setIsImportProductModalOpen] = useState(false);

  const [isNewFixedCostModalOpen, setIsNewFixedCostModalOpen] = useState(false);
  const [isEditFixedCostModalOpen, setIsEditFixedCostModalOpen] = useState(false);

  const [isNewVariableCostModalOpen, setIsNewVariableCostModalOpen] = useState(false);
  const [isEditVariableCostModalOpen, setIsEditVariableCostModalOpen] = useState(false);

  const [isNewInvestmentModalOpen, setIsNewInvestmentModalOpen] = useState(false);
  const [isEditInvestmentModalOpen, setIsEditInvestmentModalOpen] = useState(false);

  const [isEditFunnelModalOpen, setIsEditFunnelModalOpen] = useState(false);

  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);

  const handleCloseNewProductModal = () => {
    setNewProjectedProductForm({
      name: '',
      sku: generateRandomSku('LNK-PROD'),
      price: 60.00,
      baseCost: 13.00,
      mixPercent: 50,
      targetUnits: 10,
      isCustom: true
    });
    setIsNewProductModalOpen(false);
  };

  const handleCloseNewFixedCostModal = () => {
    setNewFixedCostForm({ concept: '', amount: '', note: '' });
    setIsNewFixedCostModalOpen(false);
  };

  const handleCloseNewVariableCostModal = () => {
    setNewVariableCostForm({ concept: '', type: 'unit_amount', amount: '', note: '' });
    setIsNewVariableCostModalOpen(false);
  };

  const handleCloseNewInvestmentModal = () => {
    setNewInvestmentForm({ concept: '', quantity: 1, unitCost: '' });
    setIsNewInvestmentModalOpen(false);
  };

  // Filtro semanal del Plan 30 Días
  const [planFilterWeek, setPlanFilterWeek] = useState('all');

  // Formulario para nuevo producto hipotético / proyectado
  const [newProjectedProductForm, setNewProjectedProductForm] = useState({
    name: '',
    sku: generateRandomSku('LNK-PROD'),
    price: 60.00,
    baseCost: 13.00,
    mixPercent: 50,
    targetUnits: 10,
    isCustom: true
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // Formulario para gasto fijo
  const [newFixedCostForm, setNewFixedCostForm] = useState({
    concept: '',
    amount: '',
    note: ''
  });
  const [editingFixedCost, setEditingFixedCost] = useState(null);

  // Formulario para gasto variable
  const [newVariableCostForm, setNewVariableCostForm] = useState({
    concept: '',
    type: 'unit_amount',
    amount: '',
    note: ''
  });
  const [editingVariableCost, setEditingVariableCost] = useState(null);

  // Formulario para ítem de inversión inicial
  const [newInvestmentForm, setNewInvestmentForm] = useState({
    concept: '',
    quantity: 1,
    unitCost: ''
  });
  const [editingInvestmentItem, setEditingInvestmentItem] = useState(null);

  // Formulario para ratios del embudo comercial
  const [funnelForm, setFunnelForm] = useState({
    contactToResponse: 35,
    responseToDemo: 70,
    demoToCustomer: 40,
    unitsPerCustomer: 1.29
  });

  // Formulario para nueva tarea del Plan 30 Días
  const [planTaskForm, setPlanTaskForm] = useState({
    day: (plan30Days.length > 0 ? Math.max(...plan30Days.map(t => t.day || 0)) + 1 : 1),
    week: 1,
    action: '',
    target: '',
    channel: 'WhatsApp / Presencial',
    responsible: 'Luis Romero / Kevin Servat',
    result: ''
  });
  const [editingPlanTask, setEditingPlanTask] = useState(null);
  const [isInlinePlanEdit, setIsInlinePlanEdit] = useState(true);
  const [isEditWeekTitlesModalOpen, setIsEditWeekTitlesModalOpen] = useState(false);

  // Nombres personalizados de semanas o fases
  const weekTitles = useMemo(() => {
    return {
      ...DEFAULT_PLAN_WEEK_TITLES,
      ...(projectionsData?.planWeekTitles || {})
    };
  }, [projectionsData?.planWeekTitles]);

  // Parámetros desestructurados con fallback seguro a 0 (Escenario Libre)
  const businessParams = projectionsData?.businessParams || {
    salesDaysPerMonth: 24,
    partnersCount: 2,
    businessProfitTarget: 0,
    partnerProfitTarget: 0,
    customProfitTarget: 0
  };

  const fixedCosts = projectionsData?.fixedCosts || [];
  const variableUnitCosts = projectionsData?.variableUnitCosts || {
    packagingPerUnit: 0.00,
    setupLaborPerUnit: 0.00,
    paymentFeePercent: 0.0,
    deliveryPerUnit: 0.00,
    defectReservePerUnit: 0.00
  };

  // Lista dinámica de Gastos y Costos Variables
  const variableCosts = useMemo(() => {
    if (Array.isArray(projectionsData?.variableCosts)) {
      return projectionsData.variableCosts;
    }
    // Fallback inicial migrado de variableUnitCosts
    const vuc = projectionsData?.variableUnitCosts || {};
    return [
      { id: 'vc-packaging', concept: 'Empaque por Unidad', type: 'unit_amount', amount: Number(vuc.packagingPerUnit) || 0, note: 'Bolsa Kraft, estuche o caja protectora con sticker' },
      { id: 'vc-labor', concept: 'Mano de Obra / Configuración NDEF', type: 'unit_amount', amount: Number(vuc.setupLaborPerUnit) || 0, note: 'Tiempo invertido en grabación y pruebas con smartphone' },
      { id: 'vc-gateway', concept: 'Comisión de Cobro (% Venta)', type: 'percentage', amount: Number(vuc.paymentFeePercent) || 0, note: '0% si es Yape/Plin, ~4% si es POS tarjeta' },
      { id: 'vc-delivery', concept: 'Delivery Asumido por Linkeo', type: 'unit_amount', amount: Number(vuc.deliveryPerUnit) || 0, note: 'S/ 0 si el cliente recoge o asume el envío' },
      { id: 'vc-warranty', concept: 'Reserva por Defectos / Garantía', type: 'unit_amount', amount: Number(vuc.defectReservePerUnit) || 0, note: 'Fondo para reposición inmediata al cliente' }
    ];
  }, [projectionsData?.variableCosts, projectionsData?.variableUnitCosts]);

  const projectedProducts = projectionsData?.projectedProducts || [];

  // Productos disponibles para importar desde el catálogo (excluyendo los que ya están en projectedProducts para evitar duplicados)
  const availableProductsToImport = useMemo(() => {
    return products.filter(prod => {
      const alreadyInProjection = projectedProducts.some(p => {
        if (p.catalogId && p.catalogId === prod.id) return true;
        if (p.sku && prod.sku && p.sku.trim().toLowerCase() === prod.sku.trim().toLowerCase()) return true;
        if (p.name && prod.name && p.name.trim().toLowerCase() === prod.name.trim().toLowerCase()) return true;
        return false;
      });
      return !alreadyInProjection;
    });
  }, [products, projectedProducts]);

  const initialInvestment = projectionsData?.initialInvestment || [];
  const funnelRatios = projectionsData?.funnelRatios || {
    contactToResponse: 0.35,
    responseToDemo: 0.70,
    demoToCustomer: 0.40,
    unitsPerCustomer: 1.29
  };

  // --- CÁLCULOS MATEMÁTICOS DEL MODELO DE ESCENARIO LIBRE ---

  // Total de gastos fijos mensuales
  const totalFixedCosts = useMemo(() => {
    return fixedCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [fixedCosts]);

  // Costo variable unitario fijo común (suma de todos los costos con type !== 'percentage')
  const commonVariablePerUnit = useMemo(() => {
    return variableCosts
      .filter(item => item.type !== 'percentage')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [variableCosts]);

  // Porcentaje variable total sobre la venta (suma de todos los costos con type === 'percentage')
  const totalVariablePercent = useMemo(() => {
    return variableCosts
      .filter(item => item.type === 'percentage')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [variableCosts]);

  // Productos activos en la proyección
  const activeProducts = useMemo(() => {
    return projectedProducts.filter(p => p.included !== false);
  }, [projectedProducts]);

  // Suma total de porcentajes de mezcla para normalizar si no da 100%
  const totalMixPercent = useMemo(() => {
    const sum = activeProducts.reduce((acc, p) => acc + (Number(p.mixPercent) || 0), 0);
    return sum > 0 ? sum : 100;
  }, [activeProducts]);

  // Economía calculada por producto
  const productsWithEconomics = useMemo(() => {
    return activeProducts.map(p => {
      const price = Number(p.price) || 0;
      const baseCost = Number(p.baseCost) || 0;
      const paymentFee = price * (totalVariablePercent / 100);
      const totalUnitVariableCost = baseCost + commonVariablePerUnit + paymentFee;
      const unitMargin = price - totalUnitVariableCost;
      const marginPct = price > 0 ? (unitMargin / price) * 100 : 0;
      const normalizedMix = (Number(p.mixPercent) || 0) / totalMixPercent;

      return {
        ...p,
        price,
        baseCost,
        paymentFee,
        totalUnitVariableCost,
        unitMargin,
        marginPct,
        normalizedMix
      };
    });
  }, [activeProducts, commonVariablePerUnit, totalVariablePercent, totalMixPercent]);

  // Promedios ponderados según la mezcla de ventas
  const weightedAverages = useMemo(() => {
    if (productsWithEconomics.length === 0) {
      return {
        weightedPrice: 0,
        weightedVariableCost: 0,
        weightedMargin: 0,
        weightedMarginPct: 0
      };
    }

    let weightedPrice = 0;
    let weightedVariableCost = 0;
    let weightedMargin = 0;

    productsWithEconomics.forEach(p => {
      weightedPrice += p.price * p.normalizedMix;
      weightedVariableCost += p.totalUnitVariableCost * p.normalizedMix;
      weightedMargin += p.unitMargin * p.normalizedMix;
    });

    const weightedMarginPct = weightedPrice > 0 ? (weightedMargin / weightedPrice) * 100 : 0;

    return {
      weightedPrice,
      weightedVariableCost,
      weightedMargin: Math.max(0, weightedMargin),
      weightedMarginPct
    };
  }, [productsWithEconomics]);

  // Meta de utilidad neta elegida libremente por los socios
  const targetProfit = Number(businessParams.customProfitTarget) || 0;

  // Unidades requeridas para cubrir fijos + meta
  const unitsRequired = useMemo(() => {
    const margin = weightedAverages.weightedMargin;
    if (margin <= 0) return 0;
    const raw = (totalFixedCosts + targetProfit) / margin;
    const normalized = Math.round(raw * 10000) / 10000;
    return Math.ceil(normalized);
  }, [totalFixedCosts, targetProfit, weightedAverages.weightedMargin]);

  // Punto de equilibrio en unidades (solo para cubrir gastos fijos)
  const breakevenUnits = useMemo(() => {
    const margin = weightedAverages.weightedMargin;
    if (margin <= 0) return 0;
    if (totalFixedCosts <= 0) return 0;
    const raw = totalFixedCosts / margin;
    const normalized = Math.round(raw * 10000) / 10000;
    return Math.ceil(normalized);
  }, [totalFixedCosts, weightedAverages.weightedMargin]);

  // Porcentaje de reinversión para crecimiento de Linkeo (por defecto 20% recomendado)
  const reinvestmentPercent = useMemo(() => {
    return businessParams.reinvestmentPercent !== undefined
      ? Number(businessParams.reinvestmentPercent)
      : DEFAULT_REINVESTMENT_PERCENT;
  }, [businessParams.reinvestmentPercent]);

  // Proyección dinámica Bottom-Up a partir de las unidades reales de cada producto
  const unitsProjection = useMemo(() => {
    return calculateUnitsProjection({
      projectedProducts,
      fixedCosts,
      variableCosts,
      variableUnitCosts: projectionsData?.variableUnitCosts,
      businessParams: {
        ...businessParams,
        reinvestmentPercent
      }
    });
  }, [projectedProducts, fixedCosts, variableCosts, projectionsData?.variableUnitCosts, businessParams, reinvestmentPercent]);

  // Resultados de la simulación del Escenario Libre
  const simulationResults = useMemo(() => {
    const hasUnits = unitsProjection.totalUnits > 0;
    const units = hasUnits ? unitsProjection.totalUnits : unitsRequired;
    const grossRevenue = hasUnits ? unitsProjection.grossRevenue : (units * weightedAverages.weightedPrice);
    const totalVariableCosts = hasUnits ? unitsProjection.totalVariableCosts : (units * weightedAverages.weightedVariableCost);
    const replacementFund = hasUnits ? unitsProjection.replacementFund : (units * weightedAverages.weightedVariableCost);
    const totalMargin = grossRevenue - totalVariableCosts;
    const netProfit = hasUnits ? unitsProjection.netProfit : (totalMargin - totalFixedCosts);
    const partners = Number(businessParams.partnersCount) || 2;

    const reinvestmentAmount = netProfit > 0 && reinvestmentPercent > 0
      ? Math.round(netProfit * (reinvestmentPercent / 100) * 100) / 100
      : 0;
    const distributableProfit = Math.max(0, Math.round((netProfit - reinvestmentAmount) * 100) / 100);
    const profitPerPartner = partners > 0 ? Math.round((distributableProfit / partners) * 100) / 100 : distributableProfit;
    const grossProfitPerPartner = partners > 0 ? Math.round((netProfit / partners) * 100) / 100 : netProfit;

    const salesDays = Number(businessParams.salesDaysPerMonth) || 30;
    const unitsPerDay = salesDays > 0 ? Number((units / salesDays).toFixed(2)) : 0;
    const revenuePerDay = salesDays > 0 ? Number((grossRevenue / salesDays).toFixed(2)) : 0;

    return {
      units,
      grossRevenue,
      totalVariableCosts,
      replacementFund,
      totalFixedCosts,
      totalMargin,
      netProfit,
      reinvestmentPercent,
      reinvestmentAmount,
      distributableProfit,
      profitPerPartner,
      grossProfitPerPartner,
      unitsPerDay,
      revenuePerDay,
      salesDays
    };
  }, [unitsProjection, unitsRequired, weightedAverages, totalFixedCosts, businessParams, reinvestmentPercent]);

  // Unidades efectivas a simular en el embudo (permite variar libremente o usar la meta mensual)
  const effectiveFunnelUnits = useMemo(() => {
    if (projectionsData?.funnelRatios?.customUnits !== undefined && projectionsData.funnelRatios.customUnits !== '') {
      return projectionsData.funnelRatios.customUnits;
    }
    if (simulationResults.units > 0) {
      return simulationResults.units;
    }
    return 50; // Fallback interactivo por defecto para poder modelar y variar
  }, [projectionsData?.funnelRatios?.customUnits, simulationResults.units]);

  // Embudo de ventas proporcional y reactivo
  const funnelResults = useMemo(() => {
    const units = Number(effectiveFunnelUnits) || 0;
    if (units <= 0) {
      return {
        contactsRequired: 0,
        responsesRequired: 0,
        demosRequired: 0,
        buyersRequired: 0,
        units: 0,
        contactsPerDay: 0,
        responsesPerDay: 0,
        demosPerDay: 0,
        buyersPerDay: 0,
        contactsPerPartnerPerDay: 0
      };
    }
    const unitsPerCust = Math.max(0.1, Number(funnelRatios.unitsPerCustomer) || 1.29);
    const c2r = Math.max(0.01, Number(funnelRatios.contactToResponse) || 0.35);
    const r2d = Math.max(0.01, Number(funnelRatios.responseToDemo) || 0.70);
    const d2c = Math.max(0.01, Number(funnelRatios.demoToCustomer) || 0.40);

    const buyersRequired = Math.ceil(units / unitsPerCust);
    const demosRequired = Math.ceil(buyersRequired / d2c);
    const responsesRequired = Math.ceil(demosRequired / r2d);
    const contactsRequired = Math.ceil(responsesRequired / c2r);

    const salesDays = Math.max(1, Number(businessParams.salesDaysPerMonth) || 24);
    const contactsPerDay = Number((contactsRequired / salesDays).toFixed(1));
    const responsesPerDay = Number((responsesRequired / salesDays).toFixed(1));
    const demosPerDay = Number((demosRequired / salesDays).toFixed(1));
    const buyersPerDay = Number((buyersRequired / salesDays).toFixed(1));

    const partners = Math.max(1, Number(businessParams.partnersCount) || 2);
    const contactsPerPartnerPerDay = Number((contactsRequired / salesDays / partners).toFixed(1));

    return {
      contactsRequired,
      responsesRequired,
      demosRequired,
      buyersRequired,
      units,
      contactsPerDay,
      responsesPerDay,
      demosPerDay,
      buyersPerDay,
      contactsPerPartnerPerDay
    };
  }, [effectiveFunnelUnits, funnelRatios, businessParams.salesDaysPerMonth, businessParams.partnersCount]);

  // Métricas reales del CRM Pipeline B2B
  const crmMetrics = useMemo(() => {
    const totalLeads = leads.length;
    const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);
    
    const prospectos = leads.filter(l => normalizeLeadStage(l.stage) === 'prospecto');
    const visitados = leads.filter(l => normalizeLeadStage(l.stage) === 'visitado');
    const negociaciones = leads.filter(l => normalizeLeadStage(l.stage) === 'negociacion');
    const configurando = leads.filter(l => normalizeLeadStage(l.stage) === 'configurando');
    const entregados = leads.filter(l => normalizeLeadStage(l.stage) === 'entregado');
    const postventas = leads.filter(l => normalizeLeadStage(l.stage) === 'postventa');

    const buyersRequired = funnelResults.buyersRequired || 0;
    const closedCount = entregados.length;
    const progressPct = buyersRequired > 0 ? Math.min(100, Math.round((closedCount / buyersRequired) * 100)) : 0;
    const remainingToClose = Math.max(0, buyersRequired - closedCount);

    return {
      totalLeads,
      totalPipelineValue,
      prospectos,
      visitados,
      negociaciones,
      configurando,
      entregados,
      postventas,
      closedCount,
      progressPct,
      remainingToClose
    };
  }, [leads, funnelResults.buyersRequired]);

  // Total de inversión inicial
  const totalInitialInvestment = useMemo(() => {
    return initialInvestment.reduce((acc, item) => acc + (Number(item.total) || (Number(item.quantity || 1) * Number(item.unitCost || 0))), 0);
  }, [initialInvestment]);

  // Tareas completadas del Plan de 30 días
  const completedTasksCount = plan30Days.filter(t => t.completed).length;
  const planProgressPct = plan30Days.length > 0 
    ? Math.round((completedTasksCount / plan30Days.length) * 100) 
    : 0;

  const filteredPlanTasks = plan30Days.filter(task => {
    if (planFilterWeek === 'all') return true;
    return task.week?.toString() === planFilterWeek;
  });

  // Detección del escenario calibrado al stock físico fabricado (15 Cuadrado + 15 Formato L)
  const isStockScenarioActive = useMemo(() => {
    return simulationResults.units === 30 &&
           activeProducts.length === 2 &&
           activeProducts.every(p => (Number(p.targetUnits) || 0) === 15);
  }, [simulationResults.units, activeProducts]);

  // Ya no bloqueamos con advertencias de desajuste rígido: el modelo es 100% libre por unidades
  const hasSpecificStockMismatch = false;

  // --- ACCIONES Y HANDLERS TOTALMENTE AUDITADOS ---

  const handleUpdateParam = (key, value) => {
    const numVal = Number(value) || 0;
    onUpdateProjectionsData({
      ...projectionsData,
      businessParams: {
        ...businessParams,
        [key]: numVal
      }
    });

    if (logAudit) {
      const paramNames = {
        customProfitTarget: 'Meta Neta Deseada (S/)',
        salesDaysPerMonth: 'Días de Venta al Mes',
        partnersCount: 'Número de Socios (50/50)'
      };
      logAudit({
        actionType: 'Modificación',
        entityType: 'Parámetros Proyección',
        entityId: 'PROJ-PARAMS',
        entityName: paramNames[key] || key,
        reason: `Ajuste en ${paramNames[key] || key}: Nuevo valor ${numVal}.`
      });
    }
  };

  const handleUpdateVariableCost = (key, value) => {
    const numVal = Number(value) || 0;
    onUpdateProjectionsData({
      ...projectionsData,
      variableUnitCosts: {
        ...variableUnitCosts,
        [key]: numVal
      }
    });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Costos Variables',
        entityId: `VC-${key}`,
        entityName: `Costo Variable: ${key}`,
        reason: `Costo variable unitario actualizado a ${numVal}.`
      });
    }
  };

  const handleToggleProductInclusion = (productId) => {
    const targetProd = projectedProducts.find(p => p.id === productId);
    const newIncludedState = targetProd ? !(targetProd.included !== false) : true;

    const updated = projectedProducts.map(p => {
      if (p.id === productId) {
        return { ...p, included: newIncludedState };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });

    if (logAudit && targetProd) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Mix Producto',
        entityId: targetProd.sku || targetProd.id,
        entityName: targetProd.name,
        reason: `Producto ${newIncludedState ? 'incluido en' : 'excluido de'} la proyección financiera.`
      });
    }
  };

  const handleUpdateProductUnits = (productId, newUnits) => {
    const numUnits = Math.max(0, parseInt(newUnits, 10) || 0);
    const targetProd = projectedProducts.find(p => p.id === productId);

    const updated = projectedProducts.map(p => {
      if (p.id === productId) {
        return { ...p, targetUnits: numUnits };
      }
      return p;
    });

    const activeUpdated = updated.filter(p => p.included !== false);
    const newTotalUnits = activeUpdated.reduce((sum, p) => sum + (Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0), 0);

    const synchronized = updated.map(p => {
      if (p.included === false) return p;
      const u = Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0;
      const pct = newTotalUnits > 0 ? Math.round((u / newTotalUnits) * 1000) / 10 : 0;
      return { ...p, mixPercent: pct };
    });

    onUpdateProjectionsData({
      ...projectionsData,
      projectedProducts: synchronized
    });

    if (logAudit && targetProd) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Mix Producto',
        entityId: targetProd.sku || targetProd.id,
        entityName: targetProd.name,
        reason: `Unidades proyectadas ajustadas a ${numUnits} uds.`
      });
    }
  };

  const handleUpdateReinvestmentPercent = (newPct) => {
    const cleanPct = Math.max(0, Math.min(100, Number(newPct) || 0));
    onUpdateProjectionsData({
      ...projectionsData,
      businessParams: {
        ...businessParams,
        reinvestmentPercent: cleanPct
      }
    });

    if (logAudit) {
      logAudit({
        actionType: 'Configuración',
        entityType: 'Parámetros Financieros',
        entityId: 'reinvestment-percent',
        entityName: 'Fondo de Reinversión',
        reason: `Porcentaje de reinversión ajustado a ${cleanPct}%.`
      });
    }
  };

  const handleUpdateProductMix = (productId, newMix) => {
    const numMix = Math.max(0, Number(newMix) || 0);
    const targetProd = projectedProducts.find(p => p.id === productId);

    const updated = projectedProducts.map(p => {
      if (p.id === productId) {
        return { ...p, mixPercent: numMix };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });

    if (logAudit && targetProd) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Mix Producto',
        entityId: targetProd.sku || targetProd.id,
        entityName: targetProd.name,
        reason: `Participación de ventas ajustada a ${numMix}%.`
      });
    }
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct({ 
      ...prod,
      targetUnits: prod.targetUnits !== undefined ? prod.targetUnits : 0
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveEditProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const numUnits = Number(editingProduct.targetUnits !== undefined ? editingProduct.targetUnits : 0) || 0;
    const updated = projectedProducts.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...editingProduct,
          price: Number(editingProduct.price) || 0,
          baseCost: Number(editingProduct.baseCost) || 0,
          mixPercent: Number(editingProduct.mixPercent) || 0,
          targetUnits: numUnits
        };
      }
      return p;
    });

    const activeUpdated = updated.filter(p => p.included !== false);
    const newTotalUnits = activeUpdated.reduce((sum, p) => sum + (Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0), 0);

    const synchronized = updated.map(p => {
      if (p.included === false) return p;
      const u = Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0;
      const pct = newTotalUnits > 0 ? Math.round((u / newTotalUnits) * 1000) / 10 : (p.mixPercent || 0);
      return { ...p, mixPercent: pct };
    });

    onUpdateProjectionsData({ ...projectionsData, projectedProducts: synchronized });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Mix Producto',
        entityId: editingProduct.sku || editingProduct.id,
        entityName: editingProduct.name,
        reason: `Edición de producto: Cantidad ${numUnits} uds, Precio S/ ${editingProduct.price}, Costo Base S/ ${editingProduct.baseCost}.`
      });
    }

    setIsEditProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProjectedProduct = (prod) => {
    if (onRequestDelete) {
      onRequestDelete(prod, 'Mix Producto');
    } else {
      const updated = projectedProducts.filter(p => p.id !== prod.id);
      onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
      if (logAudit) {
        logAudit({
          actionType: 'Eliminación',
          entityType: 'Mix Producto',
          entityId: prod.sku || prod.id,
          entityName: prod.name,
          reason: `Producto retirado de la proyección financiera.`
        });
      }
    }
  };

  const handleCreateNewProjectedProduct = (e) => {
    e.preventDefault();
    const targetUnits = Number(newProjectedProductForm.targetUnits !== undefined ? newProjectedProductForm.targetUnits : 10) || 0;
    const newProd = {
      id: `proj-${Date.now()}`,
      name: newProjectedProductForm.name || 'Nuevo Modelo Linkeo',
      sku: newProjectedProductForm.sku || generateRandomSku('LNK-PROD'),
      price: Number(newProjectedProductForm.price) || 60,
      baseCost: Number(newProjectedProductForm.baseCost) || 13,
      mixPercent: Number(newProjectedProductForm.mixPercent) || 50,
      targetUnits: targetUnits,
      isCustom: true,
      included: true
    };

    const nextProducts = [...projectedProducts, newProd];
    const activeNext = nextProducts.filter(p => p.included !== false);
    const newTotalUnits = activeNext.reduce((sum, p) => sum + (Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0), 0);

    const synchronized = nextProducts.map(p => {
      if (p.included === false) return p;
      const u = Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0;
      const pct = newTotalUnits > 0 ? Math.round((u / newTotalUnits) * 1000) / 10 : (p.mixPercent || 0);
      return { ...p, mixPercent: pct };
    });

    onUpdateProjectionsData({
      ...projectionsData,
      projectedProducts: synchronized
    });

    if (logAudit) {
      logAudit({
        actionType: 'Creación',
        entityType: 'Mix Producto',
        entityId: newProd.sku,
        entityName: newProd.name,
        reason: `Nuevo producto proyectado: Cantidad ${targetUnits} uds, Precio S/ ${newProd.price}, Costo S/ ${newProd.baseCost}.`
      });
    }

    if (showToast) {
      showToast(`✅ Modelo proyectado "${newProd.name}" (${targetUnits} uds) agregado`, 'success');
    }
    handleCloseNewProductModal();
  };

  const handleImportProductFromCatalog = (product) => {
    if (projectedProducts.some(p => p.catalogId === product.id || (p.sku && product.sku && p.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()) || p.name === product.name)) {
      if (showToast) {
        showToast('⚠️ Este producto ya forma parte del modelado de proyecciones.', 'warning');
      } else {
        alert('Este producto ya forma parte del modelado de proyecciones.');
      }
      return;
    }

    const invInfo = getProductInventoryInfo(product, inventory, products);
    const initialUnits = invInfo.stock !== null && invInfo.stock > 0 ? invInfo.stock : 10;
    const initialCost = invInfo.cost > 0 ? invInfo.cost : (Number(product.cost) || 12.93);

    const imported = {
      id: `proj-imp-${Date.now()}`,
      catalogId: product.id,
      name: product.name,
      sku: product.sku || generateRandomSku('LNK-PROD'),
      price: Number(product.price) || 60,
      baseCost: initialCost,
      mixPercent: 50,
      targetUnits: initialUnits,
      isCustom: false,
      included: true
    };

    const nextProducts = [...projectedProducts, imported];
    const activeNext = nextProducts.filter(p => p.included !== false);
    const newTotalUnits = activeNext.reduce((sum, p) => sum + (Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0), 0);

    const synchronized = nextProducts.map(p => {
      if (p.included === false) return p;
      const u = Number(p.targetUnits !== undefined ? p.targetUnits : 0) || 0;
      const pct = newTotalUnits > 0 ? Math.round((u / newTotalUnits) * 1000) / 10 : (p.mixPercent || 0);
      return { ...p, mixPercent: pct };
    });

    onUpdateProjectionsData({
      ...projectionsData,
      projectedProducts: synchronized
    });

    if (logAudit) {
      logAudit({
        actionType: 'Creación',
        entityType: 'Mix Producto',
        entityId: imported.sku,
        entityName: imported.name,
        reason: `Producto importado del catálogo al modelo de proyecciones (Stock: ${invInfo.stock ?? 'N/A'}, Costo: S/ ${initialCost.toFixed(2)}).`
      });
    }

    if (showToast) {
      showToast(`✅ "${product.name}" importado (${initialUnits} uds)`, 'success');
    }
  };

  // Handlers para Gastos Fijos
  const handleOpenEditFixedCost = (fc) => {
    setEditingFixedCost({ ...fc });
    setIsEditFixedCostModalOpen(true);
  };

  const handleSaveEditFixedCost = (e) => {
    e.preventDefault();
    if (!editingFixedCost) return;

    const numAmount = Number(editingFixedCost.amount) || 0;
    const updated = fixedCosts.map(fc => {
      if (fc.id === editingFixedCost.id) {
        return {
          ...fc,
          concept: editingFixedCost.concept.trim(),
          amount: numAmount,
          note: (editingFixedCost.note || '').trim()
        };
      }
      return fc;
    });
    onUpdateProjectionsData({ ...projectionsData, fixedCosts: updated });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Gasto Fijo',
        entityId: editingFixedCost.id,
        entityName: editingFixedCost.concept,
        reason: `Gasto fijo modificado a S/ ${numAmount.toFixed(2)}. Nota: ${editingFixedCost.note}`
      });
    }

    setIsEditFixedCostModalOpen(false);
    setEditingFixedCost(null);
  };

  const handleUpdateFixedCost = (id, newAmount) => {
    const numAmount = Number(newAmount) || 0;
    const targetFc = fixedCosts.find(fc => fc.id === id);
    const updated = fixedCosts.map(fc => {
      if (fc.id === id) {
        return { ...fc, amount: numAmount };
      }
      return fc;
    });
    onUpdateProjectionsData({ ...projectionsData, fixedCosts: updated });

    if (logAudit && targetFc) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Gasto Fijo',
        entityId: targetFc.id,
        entityName: targetFc.concept,
        reason: `Monto mensual actualizado a S/ ${numAmount.toFixed(2)}.`
      });
    }
  };

  const handleDeleteFixedCost = (fc) => {
    if (onRequestDelete) {
      onRequestDelete(fc, 'Gasto Fijo');
    } else {
      const updated = fixedCosts.filter(item => item.id !== fc.id);
      onUpdateProjectionsData({ ...projectionsData, fixedCosts: updated });
      if (logAudit) {
        logAudit({
          actionType: 'Eliminación',
          entityType: 'Gasto Fijo',
          entityId: fc.id,
          entityName: fc.concept,
          reason: `Gasto fijo eliminado de la proyección.`
        });
      }
    }
  };

  const handleAddFixedCost = (e) => {
    e.preventDefault();
    if (!newFixedCostForm.concept.trim()) return;

    const numAmount = Number(newFixedCostForm.amount) || 0;
    const newCost = {
      id: `fc-${Date.now()}`,
      concept: newFixedCostForm.concept.trim(),
      amount: numAmount,
      note: newFixedCostForm.note.trim() || 'Gasto fijo recurrente'
    };

    onUpdateProjectionsData({
      ...projectionsData,
      fixedCosts: [...fixedCosts, newCost]
    });

    if (logAudit) {
      logAudit({
        actionType: 'Creación',
        entityType: 'Gasto Fijo',
        entityId: newCost.id,
        entityName: newCost.concept,
        reason: `Gasto fijo agregado por S/ ${numAmount.toFixed(2)} mensuales.`
      });
    }

    if (showToast) {
      showToast(`✅ Gasto fijo "${newCost.concept}" agregado`, 'success');
    }
    handleCloseNewFixedCostModal();
  };

  // --- Handlers para Gastos y Costos Variables ---
  const updateVariableCostsList = (updatedList, auditEntry = null) => {
    const pkg = updatedList.find(c => c.id === 'vc-packaging' || c.concept.toLowerCase().includes('empaque'))?.amount || 0;
    const lbr = updatedList.find(c => c.id === 'vc-labor' || c.concept.toLowerCase().includes('mano'))?.amount || 0;
    const dlv = updatedList.find(c => c.id === 'vc-delivery' || c.concept.toLowerCase().includes('delivery'))?.amount || 0;
    const wrn = updatedList.find(c => c.id === 'vc-warranty' || c.concept.toLowerCase().includes('garant'))?.amount || 0;
    const feePct = updatedList.filter(c => c.type === 'percentage').reduce((s, c) => s + (Number(c.amount) || 0), 0);

    onUpdateProjectionsData({
      ...projectionsData,
      variableCosts: updatedList,
      variableUnitCosts: {
        packagingPerUnit: Number(pkg) || 0,
        setupLaborPerUnit: Number(lbr) || 0,
        paymentFeePercent: Number(feePct) || 0,
        deliveryPerUnit: Number(dlv) || 0,
        defectReservePerUnit: Number(wrn) || 0
      }
    });

    if (logAudit && auditEntry) {
      logAudit(auditEntry);
    }
  };

  const handleAddVariableCost = (e) => {
    e.preventDefault();
    if (!newVariableCostForm.concept.trim()) return;

    const numAmount = Math.max(0, Number(newVariableCostForm.amount) || 0);
    const newCost = {
      id: `vc-${Date.now()}`,
      concept: newVariableCostForm.concept.trim(),
      type: newVariableCostForm.type === 'percentage' ? 'percentage' : 'unit_amount',
      amount: numAmount,
      note: newVariableCostForm.note.trim() || (newVariableCostForm.type === 'percentage' ? 'Comisión porcentual por venta' : 'Costo variable por unidad vendida')
    };

    updateVariableCostsList([...variableCosts, newCost], {
      actionType: 'Creación',
      entityType: 'Gasto Variable',
      entityId: newCost.id,
      entityName: newCost.concept,
      reason: `Nuevo costo variable: ${newCost.type === 'percentage' ? `${numAmount}% sobre venta` : `S/ ${numAmount.toFixed(2)} por unidad`}.`
    });

    if (showToast) {
      showToast(`✅ Gasto variable "${newCost.concept}" registrado`, 'success');
    }
    handleCloseNewVariableCostModal();
  };

  const handleOpenEditVariableCost = (vc) => {
    setEditingVariableCost({ ...vc, type: vc.type || 'unit_amount' });
    setIsEditVariableCostModalOpen(true);
  };

  const handleSaveEditVariableCost = (e) => {
    e.preventDefault();
    if (!editingVariableCost) return;

    const numAmount = Math.max(0, Number(editingVariableCost.amount) || 0);
    const updated = variableCosts.map(vc => {
      if (vc.id === editingVariableCost.id) {
        return {
          ...vc,
          concept: editingVariableCost.concept.trim(),
          type: editingVariableCost.type === 'percentage' ? 'percentage' : 'unit_amount',
          amount: numAmount,
          note: (editingVariableCost.note || '').trim()
        };
      }
      return vc;
    });

    updateVariableCostsList(updated, {
      actionType: 'Modificación',
      entityType: 'Gasto Variable',
      entityId: editingVariableCost.id,
      entityName: editingVariableCost.concept,
      reason: `Gasto variable modificado a ${editingVariableCost.type === 'percentage' ? `${numAmount}%` : `S/ ${numAmount.toFixed(2)}`}.`
    });

    if (showToast) {
      showToast(`✓ Gasto variable "${editingVariableCost.concept}" actualizado`, 'success');
    }
    setIsEditVariableCostModalOpen(false);
    setEditingVariableCost(null);
  };

  const handleUpdateVariableCostAmount = (id, newAmount) => {
    const numAmount = Math.max(0, Number(newAmount) || 0);
    const target = variableCosts.find(vc => vc.id === id);
    const updated = variableCosts.map(vc => {
      if (vc.id === id) {
        return { ...vc, amount: numAmount };
      }
      return vc;
    });
    updateVariableCostsList(updated, target ? {
      actionType: 'Modificación',
      entityType: 'Gasto Variable',
      entityId: target.id,
      entityName: target.concept,
      reason: `Monto ajustado a ${target.type === 'percentage' ? `${numAmount}%` : `S/ ${numAmount.toFixed(2)}`}.`
    } : null);
  };

  const handleDeleteVariableCost = (vc) => {
    if (onRequestDelete) {
      onRequestDelete(vc, 'Gasto Variable');
    } else {
      const updated = variableCosts.filter(item => item.id !== vc.id);
      updateVariableCostsList(updated, {
        actionType: 'Eliminación',
        entityType: 'Gasto Variable',
        entityId: vc.id,
        entityName: vc.concept,
        reason: 'Gasto variable eliminado de las proyecciones.'
      });
      if (showToast) {
        showToast(`🗑️ Gasto variable "${vc.concept}" eliminado`, 'info');
      }
    }
  };

  const handleLoadSuggestedVariableCosts = () => {
    updateVariableCostsList(DEFAULT_VARIABLE_COSTS_TEMPLATE, {
      actionType: 'Creación',
      entityType: 'Gasto Variable',
      entityId: 'SYS-VAR-SUGGESTED',
      entityName: 'Plantilla de Costos Variables Linkeo',
      reason: 'Carga de plantilla sugerida de costos variables operativos.'
    });
    if (showToast) {
      showToast('✓ Costos variables sugeridos de Linkeo cargados', 'success');
    }
  };

  // Handlers para Inversión Inicial
  const handleOpenEditInvestment = (item) => {
    setEditingInvestmentItem({ ...item });
    setIsEditInvestmentModalOpen(true);
  };

  const handleSaveEditInvestment = (e) => {
    e.preventDefault();
    if (!editingInvestmentItem) return;

    const qty = Number(editingInvestmentItem.quantity) || 1;
    const unit = Number(editingInvestmentItem.unitCost) || 0;
    const total = qty * unit;

    const updated = initialInvestment.map(item => {
      if (item.id === editingInvestmentItem.id) {
        return {
          ...item,
          concept: editingInvestmentItem.concept.trim(),
          quantity: qty,
          unitCost: unit,
          total: total
        };
      }
      return item;
    });
    onUpdateProjectionsData({ ...projectionsData, initialInvestment: updated });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Inversión Inicial',
        entityId: editingInvestmentItem.id,
        entityName: editingInvestmentItem.concept,
        reason: `Ítem de inversión modificado: ${qty} uds a S/ ${unit.toFixed(2)} (Total S/ ${total.toFixed(2)}).`
      });
    }

    setIsEditInvestmentModalOpen(false);
    setEditingInvestmentItem(null);
  };

  const handleAddInvestmentItem = (e) => {
    e.preventDefault();
    if (!newInvestmentForm.concept.trim()) return;

    const qty = Number(newInvestmentForm.quantity) || 1;
    const unit = Number(newInvestmentForm.unitCost) || 0;
    const total = qty * unit;
    const newItem = {
      id: `inv-${Date.now()}`,
      concept: newInvestmentForm.concept.trim(),
      quantity: qty,
      unitCost: unit,
      total: total
    };

    onUpdateProjectionsData({
      ...projectionsData,
      initialInvestment: [...initialInvestment, newItem]
    });

    if (logAudit) {
      logAudit({
        actionType: 'Creación',
        entityType: 'Inversión Inicial',
        entityId: newItem.id,
        entityName: newItem.concept,
        reason: `Nuevo ítem agregado a Inversión Inicial: ${qty} uds a S/ ${unit.toFixed(2)} (Total S/ ${total.toFixed(2)}).`
      });
    }

    if (showToast) {
      showToast(`✅ Ítem de inversión "${newItem.concept}" agregado`, 'success');
    }
    handleCloseNewInvestmentModal();
  };

  const handleDeleteInvestmentItem = (item) => {
    if (onRequestDelete) {
      onRequestDelete(item, 'Inversión Inicial');
    } else {
      const updated = initialInvestment.filter(i => i.id !== item.id);
      onUpdateProjectionsData({ ...projectionsData, initialInvestment: updated });
      if (logAudit) {
        logAudit({
          actionType: 'Eliminación',
          entityType: 'Inversión Inicial',
          entityId: item.id,
          entityName: item.concept,
          reason: `Ítem eliminado de la Inversión Inicial.`
        });
      }
    }
  };

  // Handlers para Ratios del Embudo
  const handleOpenEditFunnel = () => {
    setFunnelForm({
      contactToResponse: Math.round((funnelRatios.contactToResponse || 0.35) * 100),
      responseToDemo: Math.round((funnelRatios.responseToDemo || 0.70) * 100),
      demoToCustomer: Math.round((funnelRatios.demoToCustomer || 0.40) * 100),
      unitsPerCustomer: Number(funnelRatios.unitsPerCustomer) || 1.29
    });
    setIsEditFunnelModalOpen(true);
  };

  const handleSaveEditFunnel = (e) => {
    e.preventDefault();
    const updatedRatios = {
      contactToResponse: (Number(funnelForm.contactToResponse) || 35) / 100,
      responseToDemo: (Number(funnelForm.responseToDemo) || 70) / 100,
      demoToCustomer: (Number(funnelForm.demoToCustomer) || 40) / 100,
      unitsPerCustomer: Number(funnelForm.unitsPerCustomer) || 1.29
    };

    onUpdateProjectionsData({
      ...projectionsData,
      funnelRatios: updatedRatios
    });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Embudo de Ventas',
        entityId: 'FUNNEL-RATIOS',
        entityName: 'Ratios de Conversión del Embudo',
        reason: `Ratios actualizados: Respuestas ${funnelForm.contactToResponse}%, Demos ${funnelForm.responseToDemo}%, Clientes ${funnelForm.demoToCustomer}%, ${funnelForm.unitsPerCustomer} uds/cliente.`
      });
    }

    setIsEditFunnelModalOpen(false);
  };

  const handleUpdateRatio = (ratioKey, value) => {
    const updated = {
      ...funnelRatios,
      [ratioKey]: value
    };
    onUpdateProjectionsData({
      ...projectionsData,
      funnelRatios: updated
    });
  };

  const handleUpdateFunnelUnits = (value) => {
    onUpdateProjectionsData({
      ...projectionsData,
      funnelRatios: {
        ...funnelRatios,
        customUnits: value === '' ? '' : Math.max(0, Number(value))
      }
    });
  };

  const handleUpdateInvestmentConcept = (id, newConcept) => {
    const updated = initialInvestment.map(item => {
      if (item.id === id) {
        return { ...item, concept: newConcept };
      }
      return item;
    });
    onUpdateProjectionsData({ ...projectionsData, initialInvestment: updated });
  };

  const handleUpdateInvestmentQuantity = (id, newQty) => {
    const updated = initialInvestment.map(item => {
      if (item.id === id) {
        const qty = newQty === '' ? '' : Math.max(0, Number(newQty));
        const unit = Number(item.unitCost) || 0;
        return { ...item, quantity: qty, total: (Number(qty) || 0) * unit };
      }
      return item;
    });
    onUpdateProjectionsData({ ...projectionsData, initialInvestment: updated });
  };

  const handleUpdateInvestmentUnitCost = (id, newCost) => {
    const updated = initialInvestment.map(item => {
      if (item.id === id) {
        const unit = newCost === '' ? '' : Math.max(0, Number(newCost));
        const qty = Number(item.quantity) || 1;
        return { ...item, unitCost: unit, total: qty * (Number(unit) || 0) };
      }
      return item;
    });
    onUpdateProjectionsData({ ...projectionsData, initialInvestment: updated });
  };

  // Handlers de Plan 30 Días
  const handleOpenAddPlan = () => {
    const nextDay = plan30Days.length > 0 ? Math.max(...plan30Days.map(t => Number(t.day) || 0)) + 1 : 1;
    const computedWeek = Math.min(8, Math.max(1, Math.ceil(nextDay / 7))) || 1;
    setPlanTaskForm({
      day: nextDay,
      week: computedWeek,
      action: '',
      target: '',
      channel: 'WhatsApp / Presencial',
      responsible: 'Luis Romero / Kevin Servat',
      result: ''
    });
    setIsAddPlanModalOpen(true);
  };

  const handleSaveAddPlan = (e) => {
    e.preventDefault();
    if (!planTaskForm.action.trim()) return;

    const dayNum = Number(planTaskForm.day) || 1;
    const weekNum = Number(planTaskForm.week) || Math.min(8, Math.ceil(dayNum / 7)) || 1;

    const newTask = {
      day: dayNum,
      week: weekNum,
      action: planTaskForm.action.trim(),
      target: planTaskForm.target.trim() || 'Ejecución clave',
      channel: (planTaskForm.channel || '').trim() || 'WhatsApp / Presencial',
      responsible: planTaskForm.responsible || 'Luis Romero / Kevin Servat',
      completed: false,
      result: (planTaskForm.result || '').trim()
    };

    if (onAddPlanTask) {
      onAddPlanTask(newTask);
    } else if (setPlan30Days) {
      setPlan30Days([...plan30Days, newTask]);
    }

    if (logAudit) {
      logAudit({
        actionType: 'Creación',
        entityType: 'Plan 30 Días',
        entityId: `dia-${newTask.day}`,
        entityName: `Día ${newTask.day}: ${newTask.action}`,
        reason: `Nueva tarea agregada a la Semana ${newTask.week} del Plan.`
      });
    }

    if (showToast) {
      showToast(`✓ Tarea Día ${newTask.day} agregada`, 'success');
    }

    setIsAddPlanModalOpen(false);
  };

  const handleOpenEditPlan = (task) => {
    setEditingPlanTask({ 
      ...task, 
      _originalDay: task.day,
      channel: task.channel || 'WhatsApp / Presencial',
      responsible: task.responsible || 'Luis Romero / Kevin Servat'
    });
    setIsEditPlanModalOpen(true);
  };

  const handleSaveEditPlan = (e) => {
    e.preventDefault();
    if (!editingPlanTask) return;

    const updatedTask = {
      ...editingPlanTask,
      day: Number(editingPlanTask.day) || 1,
      week: Number(editingPlanTask.week) || 1,
      action: editingPlanTask.action.trim(),
      target: editingPlanTask.target.trim() || 'Ejecución clave',
      channel: (editingPlanTask.channel || '').trim() || 'WhatsApp / Presencial',
      responsible: editingPlanTask.responsible || 'Luis Romero / Kevin Servat',
      result: (editingPlanTask.result || '').trim(),
      completed: Boolean(editingPlanTask.completed)
    };

    if (onEditPlanTask) {
      onEditPlanTask(updatedTask);
    } else if (setPlan30Days) {
      setPlan30Days(plan30Days.map(t => {
        const match = updatedTask._originalDay !== undefined ? t.day === updatedTask._originalDay : t.day === updatedTask.day;
        if (match) {
          const { _originalDay, ...clean } = updatedTask;
          return clean;
        }
        return t;
      }));
    }

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Plan 30 Días',
        entityId: `dia-${updatedTask.day}`,
        entityName: `Día ${updatedTask.day}: ${updatedTask.action}`,
        reason: `Modificación de meta, canal, responsable o aprendizajes.`
      });
    }

    if (showToast) {
      showToast(`✓ Tarea Día ${updatedTask.day} actualizada`, 'success');
    }

    setIsEditPlanModalOpen(false);
    setEditingPlanTask(null);
  };

  // Handler para agregar una fila rápida directamente a la tabla
  const handleAddQuickRow = () => {
    const nextDay = plan30Days.length > 0 ? Math.max(...plan30Days.map(t => Number(t.day) || 0)) + 1 : 1;
    const computedWeek = planFilterWeek !== 'all' 
      ? Number(planFilterWeek) 
      : Math.min(8, Math.max(1, Math.ceil(nextDay / 7))) || 1;

    const newTask = {
      day: nextDay,
      week: computedWeek,
      action: 'Nueva acción comercial',
      target: '1 meta medible',
      channel: 'WhatsApp / Presencial',
      responsible: 'Luis Romero / Kevin Servat',
      completed: false,
      result: ''
    };

    if (onAddPlanTask) {
      onAddPlanTask(newTask);
    } else if (setPlan30Days) {
      setPlan30Days([...plan30Days, newTask]);
    }

    if (showToast) {
      showToast(`✓ Fila rápida agregada para el Día ${nextDay}`, 'success');
    }
  };

  // Handler para actualizar campos directamente en la tabla (Inline spreadsheet)
  const handleUpdatePlanTaskField = (day, field, value) => {
    const updated = plan30Days.map(task => {
      if (task.day === day) {
        return {
          ...task,
          [field]: field === 'day' || field === 'week' ? (value === '' ? '' : Number(value)) : value
        };
      }
      return task;
    });
    if (setPlan30Days) {
      setPlan30Days(updated);
    }
  };

  // Handler para guardar nombres personalizados de semanas
  const handleSaveWeekTitles = (newTitles) => {
    onUpdateProjectionsData({
      ...projectionsData,
      planWeekTitles: newTitles
    });
    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Plan 30 Días',
        entityId: 'PLAN-WEEKS',
        entityName: 'Nombres de Semanas',
        reason: 'Personalización de nombres y fases del Plan de 30 Días.'
      });
    }
  };

  // Funciones para Limpiar o Cargar Plantillas con Auditoría
  const handleResetToClean = () => {
    if (window.confirm('¿Deseas vaciar todas las proyecciones para dejarlas en escenario libre en blanco (valores en 0)? Esta acción se registrará en la auditoría.')) {
      onUpdateProjectionsData({
        businessParams: {
          salesDaysPerMonth: 24,
          partnersCount: 2,
          businessProfitTarget: 0,
          partnerProfitTarget: 0,
          customProfitTarget: 0
        },
        fixedCosts: [],
        variableCosts: [],
        variableUnitCosts: {
          packagingPerUnit: 0.00,
          setupLaborPerUnit: 0.00,
          paymentFeePercent: 0.0,
          deliveryPerUnit: 0.00,
          defectReservePerUnit: 0.00
        },
        projectedProducts: [],
        initialInvestment: [],
        funnelRatios: {
          contactToResponse: 0.35,
          responseToDemo: 0.70,
          demoToCustomer: 0.40,
          unitsPerCustomer: 1.29
        }
      });

      if (logAudit) {
        logAudit({
          actionType: 'Modificación',
          entityType: 'Parámetros Proyección',
          entityId: 'SYS-PROJ-RESET',
          entityName: 'Reinicio de Proyecciones a Escenario Libre',
          reason: `Vaciado de todos los valores predeterminados para inicio manual desde cero.`
        });
      }
    }
  };

  const handleLoadExcelTemplates = () => {
    if (window.confirm('¿Deseas cargar la plantilla referencial del Excel Control de Gastos NFC (productos, fijos e inversión)?')) {
      onUpdateProjectionsData({
        businessParams: {
          salesDaysPerMonth: 24,
          partnersCount: 2,
          businessProfitTarget: 4000,
          partnerProfitTarget: 4000,
          customProfitTarget: 4000
        },
        fixedCosts: EXCEL_FIXED_COSTS_TEMPLATE,
        variableCosts: DEFAULT_VARIABLE_COSTS_TEMPLATE,
        variableUnitCosts: {
          packagingPerUnit: 2.00,
          setupLaborPerUnit: 0.00,
          paymentFeePercent: 0.0,
          deliveryPerUnit: 0.00,
          defectReservePerUnit: 0.00
        },
        projectedProducts: EXCEL_PROJECTED_PRODUCTS_TEMPLATE,
        initialInvestment: EXCEL_INITIAL_INVESTMENT_TEMPLATE,
        funnelRatios: {
          contactToResponse: 0.35,
          responseToDemo: 0.70,
          demoToCustomer: 0.40,
          unitsPerCustomer: 1.29
        }
      });

      if (logAudit) {
        logAudit({
          actionType: 'Modificación',
          entityType: 'Parámetros Proyección',
          entityId: 'SYS-PROJ-EXCEL-TEMPLATE',
          entityName: 'Carga de Plantilla de Referencia del Excel',
          reason: `Carga de productos estándar/premium, gastos fijos e inversión del Excel Control de Gastos NFC.`
        });
      }
    }
  };

  const handleLoadPlanTemplate = () => {
    if (window.confirm('¿Deseas cargar las 27 tareas estratégicas del Plan de 30 Días del Excel?')) {
      if (setPlan30Days) {
        setPlan30Days(EXCEL_PLAN_30_DAYS_TEMPLATE);
      }
      if (logAudit) {
        logAudit({
          actionType: 'Creación',
          entityType: 'Plan 30 Días',
          entityId: 'SYS-PLAN-TEMPLATE',
          entityName: 'Carga de 27 Tareas del Plan 30 Días',
          reason: `Carga en lote de los 27 hitos operativos del Excel Control de Gastos NFC.`
        });
      }
    }
  };

  const handleCalibrateStock30 = () => {
    onUpdateProjectionsData({
      ...projectionsData,
      ...STOCK_FABRICADO_30_TEMPLATE
    });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Parámetros Proyección',
        entityId: 'SYS-PROJ-STOCK-30',
        entityName: 'Calibración a Stock Físico Fabricado (30 uds)',
        reason: 'Calibración oficial a 30 tarjetas fabricadas (15 Cuadrado + 15 Formato L, costo S/ 12.93, fijos S/ 50.00 movilidad, Meta S/ 1,662.10, utilidad S/ 831.05 c/u).'
      });
    }

    if (showToast) {
      showToast('⚡ Simulación calibrada al stock fabricado (30 uds: 15 Cuadrado + 15 Formato L). Utilidad neta: S/ 1,662.10 (S/ 831.05 c/u)', 'success');
    }
  };

  const handleQuickFixMixAndTarget = () => {
    const share = activeProducts.length > 0 ? Math.round((100 / activeProducts.length) * 10) / 10 : 50;
    const updatedProducts = projectedProducts.map(p => {
      if (p.included !== false) {
        return {
          ...p,
          mixPercent: share,
          baseCost: Number(p.baseCost) === 13 || Number(p.baseCost) === 60 || Number(p.baseCost) === 80 ? 12.93 : Number(p.baseCost)
        };
      }
      return p;
    });

    let updatedFixed = fixedCosts;
    if (fixedCosts.length === 0) {
      updatedFixed = [{ id: 'fc-movilidad', concept: 'Movilidad mensual (visitas presenciales)', amount: 50.00, note: 'Prospección y entrega en distritos de Lima' }];
    }

    onUpdateProjectionsData({
      ...projectionsData,
      businessParams: {
        ...businessParams,
        customProfitTarget: 1662.10,
        salesDaysPerMonth: businessParams.salesDaysPerMonth || 30
      },
      fixedCosts: updatedFixed,
      projectedProducts: updatedProducts,
      funnelRatios: {
        ...(projectionsData?.funnelRatios || {
          contactToResponse: 0.35,
          responseToDemo: 0.70,
          demoToCustomer: 0.40,
          unitsPerCustomer: 1.29
        }),
        customUnits: 30
      }
    });

    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Parámetros Proyección',
        entityId: 'SYS-PROJ-QUICK-FIX',
        entityName: 'Ajuste de Mix 50/50 y Meta Neta S/ 1,662.10',
        reason: 'Ajuste automático para calibrar las 30 tarjetas físicas fabricadas (Mix 50/50, costo S/ 12.93, Meta S/ 1,662.10).'
      });
    }

    if (showToast) {
      showToast('✓ Mix calibrado a 50/50 y Meta Neta fijada en S/ 1,662.10 (30 uds exactas)', 'success');
    }
  };

  const handleEqualizeMix = () => {
    if (activeProducts.length === 0) return;
    const equalShare = Math.round((100 / activeProducts.length) * 10) / 10;
    const updated = projectedProducts.map(p => {
      if (p.included !== false) {
        return { ...p, mixPercent: equalShare };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
    if (logAudit) {
      logAudit({
        actionType: 'Modificación',
        entityType: 'Mix Producto',
        entityId: 'MIX-EQUITY',
        entityName: 'Equilibrio de Mix de Ventas',
        reason: `Participación redistribuida a partes iguales (${equalShare}% por producto).`
      });
    }
    if (showToast) {
      showToast(`✓ Mix equilibrado a partes iguales (${equalShare}% c/u)`, 'success');
    }
  };

  const handleNormalizeMix = () => {
    if (activeProducts.length === 0 || totalMixPercent <= 0) return;
    const updated = projectedProducts.map(p => {
      if (p.included !== false) {
        const norm = Math.round(((Number(p.mixPercent) || 0) / totalMixPercent) * 100);
        return { ...p, mixPercent: norm };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
    if (showToast) {
      showToast('✓ Mix normalizado proporcionalmente al 100%', 'success');
    }
  };

  const handleSyncMixFromStock = () => {
    if (activeProducts.length === 0) return;
    const stocks = activeProducts.map(p => {
      const invItem = inventory.find(i => 
        (p.sku && i.sku && i.sku.toLowerCase() === p.sku.toLowerCase()) ||
        (i.name && p.name && (i.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 12)) || p.name.toLowerCase().includes(i.name.toLowerCase().slice(0, 12))))
      );
      const qty = invItem ? Number(invItem.quantity) || 0 : (p.name.includes('Cuadrado') || p.name.includes('L') ? 15 : 0);
      return { id: p.id, qty };
    });
    const totalStock = stocks.reduce((sum, s) => sum + s.qty, 0);
    if (totalStock === 0) {
      handleEqualizeMix();
      return;
    }
    const updated = projectedProducts.map(p => {
      const s = stocks.find(st => st.id === p.id);
      if (s) {
        const share = Math.round((s.qty / totalStock) * 100);
        return { ...p, mixPercent: share };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
    if (showToast) {
      showToast(`✓ Mix sincronizado según stock físico de almacén (${totalStock} uds)`, 'success');
    }
  };

  const handleCalculateTargetFromUnits = (unitsToCalculate) => {
    const u = Number(unitsToCalculate) || 0;
    if (u <= 0 || weightedAverages.weightedMargin <= 0) return;
    const calculatedTarget = Math.max(0, Number(((u * weightedAverages.weightedMargin) - totalFixedCosts).toFixed(2)));
    handleUpdateParam('customProfitTarget', calculatedTarget);
    if (showToast) {
      showToast(`✓ Meta Neta ajustada a S/ ${calculatedTarget.toFixed(2)} para ${u} unidades`, 'success');
    }
  };

  return (
    <div className="projections-view" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {activeProducts.length > 0 && weightedAverages.weightedMargin <= 0 && <p role="alert">La meta no es alcanzable con este margen. Corrige precios, costos o mezcla de productos.</p>}
      {/* Header Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)' }}>
              <TrendingUp size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Proyecciones Financieras, Costos & Metas
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Escenario Libre & Auditado
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '850px' }}>
            Modela escenarios en tiempo real definiendo tu meta neta deseada, agregando tus productos y gastos fijos para calcular el punto de equilibrio y la distribución neta 50/50 entre Luis Romero y Kevin Servat.
          </p>
        </div>

        {/* Acciones de Cabecera y Resumen Rápido */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Botón para ver bitácora de auditoría */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentTab && setCurrentTab('audit')}
            title="Ver bitácora de auditoría y trazabilidad histórica de cambios"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldCheck size={14} color="#10b981" />
            <span>Ver Auditoría</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleResetToClean}
            title="Vaciar todos los valores para empezar un escenario limpio desde cero"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>Vaciar a Escenario Libre</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleLoadExcelTemplates}
            title="Cargar valores de referencia del Excel Control de Gastos NFC"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={14} />
            <span>Cargar Plantilla Excel</span>
          </button>

          {/* Resumen Rápido */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '8px 14px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                Punto de Equilibrio
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-orange)' }}>
                {breakevenUnits} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>uds/mes</span>
              </div>
            </div>
            <div style={{ width: '1px', height: '26px', backgroundColor: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                Gastos Fijos Total
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                S/ {totalFixedCosts.toFixed(2)}
              </div>
            </div>
            <div style={{ width: '1px', height: '26px', backgroundColor: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                Margen Ponderado
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                {weightedAverages.weightedMarginPct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BANNER DINÁMICO: PROYECCIÓN POR UNIDADES REALES Y FUTURAS */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(0, 102, 255, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0066ff, #10b981)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Proyección Dinámica: {simulationResults.units} Unidades Totales en el Mix</span>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                Modelo por Cantidades
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Venta bruta proyectada de <strong>S/ {simulationResults.grossRevenue.toFixed(2)}</strong>. Se protege el <strong>fondo de reposición (S/ {simulationResults.replacementFund.toFixed(2)})</strong> para reponer insumos y los fijos de <strong>S/ {totalFixedCosts.toFixed(2)}</strong>, dejando una utilidad neta de <strong>S/ {simulationResults.netProfit.toFixed(2)}</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveSubTab('products')}
            style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Edit3 size={12} />
            <span>Editar Cantidades en Mix</span>
          </button>
        </div>
      </div>

      {/* Navegación por Sub-Pestañas Touch-Friendly */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          borderBottom: '1px solid var(--border-subtle)', 
          marginBottom: '20px', 
          overflowX: 'auto', 
          whiteSpace: 'nowrap',
          paddingBottom: '6px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button
          className={`btn btn-sm ${activeSubTab === 'goals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('goals')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <Target size={15} />
          <span>🎯 Metas & Simulador Libre</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <ShoppingBag size={15} />
          <span>🛍️ Mix de Productos ({projectedProducts.length})</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'costs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('costs')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <DollarSign size={15} />
          <span>💼 Gastos Fijos & Variables ({fixedCosts.length})</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'funnel' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('funnel')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <Filter size={15} />
          <span>🚀 Embudo de Ventas & Pipeline CRM</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'plan30' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('plan30')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <Calendar size={15} />
          <span>📅 Plan de Acción 30 Días ({completedTasksCount}/{plan30Days.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 1: SIMULADOR LIBRE DE METAS Y DISTRIBUCIÓN 50/50              */}
      {/* ========================================================================= */}
      {activeSubTab === 'goals' && (
        <div>
          {/* Panel de Controles del Escenario Libre */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Sliders size={18} color="var(--primary-600)" />
                  <span>Parámetros Operativos del Escenario (Bottom-Up)</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Las unidades y la venta bruta se reflejan automáticamente desde el Mix. Ajusta los días y socios para proyectar la operación.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className="badge badge-blue">100% Interactivo & Auditado</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {/* 1. Unidades a Vender (Reflejo del Mix - No editable) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>
                    Unidades a Vender:
                  </label>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                    Reflejo del Mix
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '1.15rem', color: '#38bdf8', justifyContent: 'space-between' }}>
                  <span>{simulationResults.units} uds</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {activeProducts.length} productos
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => setActiveSubTab('products')}
                    style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                  >
                    ✏️ Ir al Mix de Productos
                  </button>
                </div>
              </div>

              {/* 2. Venta Bruta a Facturar (Reflejo del Mix - No editable) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>
                    Venta Bruta a Facturar:
                  </label>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                    Reflejo del Mix
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 800, fontSize: '1.15rem', color: '#10b981', justifyContent: 'space-between' }}>
                  <span>S/ {simulationResults.grossRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Sin gastos
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '6px', display: 'block', lineHeight: 1.3 }}>
                  Total que se busca vender sin descontar costos ni gastos
                </span>
              </div>

              {/* 3. Días de Venta al Mes (Editable) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>
                    Días de Venta al Mes:
                  </label>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Editable
                  </span>
                </div>
                <input 
                  type="number" 
                  min="1"
                  max="31"
                  className="form-control"
                  value={businessParams.salesDaysPerMonth}
                  onChange={(e) => handleUpdateParam('salesDaysPerMonth', e.target.value)}
                  style={{ fontWeight: 800, fontSize: '1.1rem', height: '40px' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '6px', display: 'block' }}>
                  Ritmo: <strong>{simulationResults.unitsPerDay} uds/día</strong> (S/ {simulationResults.revenuePerDay}/día)
                </span>
              </div>

              {/* 4. Número de Socios (Editable) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>
                    Número de Socios:
                  </label>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Editable
                  </span>
                </div>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  className="form-control"
                  value={businessParams.partnersCount}
                  onChange={(e) => handleUpdateParam('partnersCount', e.target.value)}
                  style={{ fontWeight: 800, fontSize: '1.1rem', height: '40px' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '6px', display: 'block' }}>
                  {Number(businessParams.partnersCount) === 2 ? 'División 50/50 (Luis Romero & Kevin Servat)' : `División equitativa entre ${businessParams.partnersCount} socios`}
                </span>
              </div>

              {/* 5. Gastos Fijos Mensuales (No editable) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700 }}>
                    Gastos Fijos Mensuales:
                  </label>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 700 }}>
                    No editable
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 800, fontSize: '1.15rem', color: '#f87171', justifyContent: 'space-between' }}>
                  <span>S/ {totalFixedCosts.toFixed(2)}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {fixedCosts.length} fijos
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveSubTab('costs')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginTop: '6px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  ✏️ Ver o agregar gastos fijos ({fixedCosts.length})
                </button>
              </div>
            </div>
          </div>

          {/* Aviso si no hay productos agregados en el modelo */}
          {projectedProducts.length === 0 && (
            <div 
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(0, 102, 255, 0.06)',
                border: '1px dashed rgba(0, 102, 255, 0.35)',
                marginBottom: '24px',
                textAlign: 'center'
              }}
            >
              <ShoppingBag size={32} color="var(--primary-600)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                Tu Escenario Libre está listo para recibir productos
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '600px', margin: '0 auto 16px auto' }}>
                Para calcular las proyecciones exactas de facturación, agrega los productos que planeas comercializar o impórtalos directamente de tu Almacén.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsImportProductModalOpen(true)}
                >
                  <Boxes size={14} />
                  <span>Importar del Almacén</span>
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewProductModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>+ Proyectar Nuevo Producto</span>
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onUpdateProjectionsData({
                      ...projectionsData,
                      projectedProducts: EXCEL_PROJECTED_PRODUCTS_TEMPLATE
                    });
                  }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Cargar 2 Modelos Base del Excel</span>
                </button>
              </div>
            </div>
          )}

          {/* TARJETAS DE RESULTADOS FINANCIEROS CLAVE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* Meta de Unidades */}
            <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-600)' }}>
              <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Unidades a Vender</span>
                <Package size={16} color="var(--primary-600)" />
              </div>
              <div className="kpi-value" style={{ color: 'var(--primary-600)', fontSize: '1.8rem' }}>
                {simulationResults.units}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                  unidades
                </span>
              </div>
              <div className="kpi-subtext" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>Ritmo diario: <strong>{simulationResults.unitsPerDay} uds/día</strong> ({businessParams.salesDaysPerMonth} días)</div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  Meta total calculada según el mix de productos
                </span>
              </div>
            </div>

            {/* Facturación Mensual Bruta */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Venta Mensual Bruta</span>
                <DollarSign size={16} color="#10b981" />
              </div>
              <div className="kpi-value" style={{ color: '#10b981', fontSize: '1.8rem' }}>
                S/ {simulationResults.grossRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-subtext">
                Fondo reposición: <strong>S/ {simulationResults.replacementFund.toFixed(2)}</strong> reservado para insumos
              </div>
            </div>

            {/* Utilidad Neta del Negocio */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #06b6d4' }}>
              <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Utilidad Neta Negocio</span>
                <ShieldCheck size={16} color="#06b6d4" />
              </div>
              <div className="kpi-value" style={{ color: '#06b6d4', fontSize: '1.8rem' }}>
                S/ {simulationResults.netProfit.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-subtext">
                Tras pagar insumos (S/ {simulationResults.replacementFund.toFixed(2)}) y fijos (S/ {totalFixedCosts.toFixed(2)})
              </div>
            </div>

            {/* Utilidad Limpia Distribuible */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #a855f7' }}>
              <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Utilidad Distribuible</span>
                <Coins size={16} color="#a855f7" />
              </div>
              <div className="kpi-value" style={{ color: '#a855f7', fontSize: '1.8rem' }}>
                S/ {simulationResults.distributableProfit.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-subtext">
                Tras fondo de reinversión del {simulationResults.reinvestmentPercent}% (S/ {simulationResults.reinvestmentAmount.toFixed(2)})
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MÓDULO INTERACTIVO: FONDO DE REINVERSIÓN DE LO GENERADO                     */}
          {/* ========================================================================= */}
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(37, 99, 235, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 'var(--radius-xl)',
              padding: '22px 24px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={20} color="#a855f7" />
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0 }}>
                    Fondo de Reinversión de lo Generado ({simulationResults.reinvestmentPercent}%)
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Determina qué porcentaje de la ganancia neta generada se guarda para el crecimiento de Linkeo antes del reparto entre socios.
                </p>
              </div>

              <span className="badge badge-purple" style={{ fontSize: '0.76rem', padding: '4px 10px', fontWeight: 700 }}>
                ⭐ Recomendación Linkeo: 20% a 30%
              </span>
            </div>

            {/* Caja de Recomendación Financiera Profesional */}
            <div 
              style={{
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.28)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <Sparkles size={22} color="#a855f7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.83rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                <strong>¿Cuánto reinvertir de lo generado? Nuestra recomendación estratégica:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
                  En etapas de lanzamiento comercial, destinar entre un <strong>20% y 30%</strong> de la utilidad neta mensual permite a Linkeo formar un fondo de tesorería propio para <strong>comprar lotes más grandes de chips NFC a menor costo por volumen, encargar displays acrílicos nuevos y correr campañas publicitarias</strong> sin descapitalizar a los socios.
                  El <strong>70% a 80%</strong> restante se retira 100% limpio como dividendo 50/50 entre Luis y Kevin. ¡Y ten la total tranquilidad de que el dinero para reponer los productos vendidos (<strong>S/ {simulationResults.replacementFund.toFixed(2)}</strong>) ya fue apartado antes de calcular esta ganancia!
                </p>
              </div>
            </div>

            {/* Controles Interactivos del Fondo de Reinversión */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'center' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Porcentaje a Reinvertir del Negocio:</span>
                  <strong style={{ color: '#a855f7', fontSize: '0.95rem' }}>{simulationResults.reinvestmentPercent}%</strong>
                </label>

                {/* Slider interactivo */}
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simulationResults.reinvestmentPercent}
                  onChange={(e) => handleUpdateReinvestmentPercent(e.target.value)}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#a855f7', height: '6px' }}
                />

                {/* Botones de selección rápida */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {[
                    { pct: 0, label: '0% (Todo a Socios)' },
                    { pct: 15, label: '15% (Prudente)' },
                    { pct: 20, label: '20% (Recomendado ⭐)' },
                    { pct: 30, label: '30% (Escala Rápida)' },
                    { pct: 50, label: '50% (Inversión Fuerte)' }
                  ].map(item => (
                    <button
                      key={item.pct}
                      type="button"
                      className="btn btn-xs"
                      onClick={() => handleUpdateReinvestmentPercent(item.pct)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        background: simulationResults.reinvestmentPercent === item.pct ? '#a855f7' : 'var(--bg-card)',
                        border: '1px solid ' + (simulationResults.reinvestmentPercent === item.pct ? '#a855f7' : 'var(--border-subtle)'),
                        color: simulationResults.reinvestmentPercent === item.pct ? '#fff' : 'var(--text-main)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: simulationResults.reinvestmentPercent === item.pct ? 700 : 500
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarjetas de Resumen en Tiempo Real */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Utilidad Neta Generada:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#06b6d4', marginTop: '2px' }}>
                    S/ {simulationResults.netProfit.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700 }}>
                    Fondo Reinversión ({simulationResults.reinvestmentPercent}%):
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#a855f7', marginTop: '2px' }}>
                    S/ {simulationResults.reinvestmentAmount.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                    Limpio para Socios:
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                    S/ {simulationResults.distributableProfit.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BANNER DESTACADO: REPARTO SOCIETARIO 50/50 (LUIS & KEVIN) */}
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
              border: '1px solid rgba(0, 102, 255, 0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  Acuerdo Societario Oficial 50/50
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} color="var(--primary-600)" />
                  <span>Distribución Neta Proyectada por Socio (Tras Reinversión)</span>
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cada socio recibe limpio:</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>
                  S/ {simulationResults.profitPerPartner.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {simulationResults.reinvestmentPercent > 0 && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    (Sin reinversión sería S/ {simulationResults.grossProfitPerPartner.toFixed(2)} c/u)
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Socio 1: Luis Romero */}
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    <strong style={{ fontSize: '1rem' }}>Luis Romero</strong>
                  </div>
                  <span className="badge badge-green">50% Co-CEO</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Desembolsos compartidos equitativamente & gestión comercial.
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
                  S/ {simulationResults.profitPerPartner.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {simulationResults.reinvestmentPercent > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                    + S/ {(simulationResults.reinvestmentAmount / 2).toFixed(2)} aportados a la caja de Linkeo
                  </div>
                )}
              </div>

              {/* Socio 2: Kevin Servat */}
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></span>
                    <strong style={{ fontSize: '1rem' }}>Kevin Servat</strong>
                  </div>
                  <span className="badge badge-blue">50% Co-CEO</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Desembolsos compartidos equitativamente & compras de mercadería.
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
                  S/ {simulationResults.profitPerPartner.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {simulationResults.reinvestmentPercent > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                    + S/ {(simulationResults.reinvestmentAmount / 2).toFixed(2)} aportados a la caja de Linkeo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CASCADA DE REPOSICIÓN Y DISTRIBUCIÓN FINANCIERA (7 PASOS TRANSPARENTES)     */}
          {/* ========================================================================= */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <TrendingUp size={18} color="var(--primary-600)" />
              <span>Cascada Financiera: De la Venta al Bolsillo de los Socios</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Paso 1: Venta Bruta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>💰</span>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>1. Venta Mensual Bruta</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Ingreso total por comercializar {simulationResults.units} unidades del Mix
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>
                  S/ {simulationResults.grossRevenue.toFixed(2)}
                </div>
              </div>

              {/* Paso 2: Fondo de Reposición */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>📦</span>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#ef4444' }}>2. (-) Fondo de Reposición de Mercadería (Insumos)</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Costo base para volver a comprar y fabricar las {simulationResults.units} tarjetas vendidas (¡Intocable para no descapitalizarse!)
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ef4444' }}>
                  - S/ {simulationResults.replacementFund.toFixed(2)}
                </div>
              </div>

              {/* Paso 3: Gastos Fijos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🚗</span>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#f59e0b' }}>3. (-) Gastos Fijos Mensuales</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Movilidad de prospección presencial en distritos de Lima
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f59e0b' }}>
                  - S/ {totalFixedCosts.toFixed(2)}
                </div>
              </div>

              {/* Paso 4: Utilidad Neta del Negocio */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏁</span>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#06b6d4' }}>4. (=) Utilidad Neta del Negocio Linkeo</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Ganancia real producida por el negocio tras reponer stock y cubrir fijos
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#06b6d4' }}>
                  S/ {simulationResults.netProfit.toFixed(2)}
                </div>
              </div>

              {/* Paso 5: Fondo de Reinversión */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(168, 85, 247, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏦</span>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#a855f7' }}>5. (-) Fondo de Reinversión para Crecimiento ({simulationResults.reinvestmentPercent}%)</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Se reserva en la caja del negocio para compras por volumen, displays y anuncios
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#a855f7' }}>
                  - S/ {simulationResults.reinvestmentAmount.toFixed(2)}
                </div>
              </div>

              {/* Paso 6: Utilidad Distribuible a Socios */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🤝</span>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>6. (=) Utilidad Limpia para los Socios (50/50)</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Lo que Luis Romero y Kevin Servat se llevan al bolsillo: <strong>S/ {simulationResults.profitPerPartner.toFixed(2)}</strong> cada uno
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#10b981' }}>
                  S/ {simulationResults.distributableProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 2: MIX DE PRODUCTOS (EDITABLE Y AUDITADO)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Economía por Producto y Cantidades a Vender (Sales Mix)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Ingresa directamente cuántas unidades tienes o planeas vender de cada modelo. Puedes proyectar modelos futuros que aún no tienes en stock.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setIsImportProductModalOpen(true)}
                style={{ fontSize: '0.85rem' }}
              >
                <Boxes size={15} />
                <span>Importar del Almacén</span>
              </button>

              <button 
                className="btn btn-primary"
                onClick={() => setIsNewProductModalOpen(true)}
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={15} />
                <span>+ Proyectar Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Estado Vacío - solo cuando no hay productos */}
          {projectedProducts.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <ShoppingBag size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0' }}>
                No hay productos en el modelo de proyección
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto 20px auto' }}>
                Agrega modelos existentes o futuros para definir las cantidades a vender, costos de reposición y ganancias proyectadas.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button className="btn btn-primary" onClick={() => setIsNewProductModalOpen(true)}>
                  <Plus size={16} />
                  <span>+ Proyectar Nuevo Producto</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setIsImportProductModalOpen(true)}>
                  <Boxes size={16} />
                  <span>Importar del Almacén</span>
                </button>
              </div>
            </div>
          ) : (
          <div style={{ marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <table style={{
              width: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
            }}>
              <colgroup>
                <col style={{ width: '32px' }} />   {/* ✓ */}
                <col style={{ width: '22%' }} />    {/* Producto */}
                <col style={{ width: '72px' }} />   {/* Stock */}
                <col style={{ width: '80px' }} />   {/* P.Venta */}
                <col style={{ width: '100px' }} />  {/* Uds */}
                <col style={{ width: '88px' }} />   {/* Ingresos */}
                <col style={{ width: '100px' }} />  {/* Costo + Fdo */}
                <col style={{ width: '100px' }} />  {/* Margen */}
                <col style={{ width: '52px' }} />   {/* %Mix */}
                <col style={{ width: '56px' }} />   {/* Acciones */}
              </colgroup>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-subtle)' }}>
                  <th style={{ padding: '9px 6px', textAlign: 'center', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem' }}>✓</th>
                  <th style={{ padding: '9px 10px', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Producto / Modelo</th>
                  <th style={{ padding: '9px 6px', textAlign: 'center', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stock</th>
                  <th style={{ padding: '9px 8px', textAlign: 'right', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>P. Venta</th>
                  <th style={{ padding: '9px 8px', textAlign: 'center', background: 'rgba(99,102,241,0.07)', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Uds. a Vender</th>
                  <th style={{ padding: '9px 8px', textAlign: 'right', color: '#10b981', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ingresos</th>
                  <th style={{ padding: '9px 8px', textAlign: 'right', color: '#ef4444', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Costo / Fdo. Rep.</th>
                  <th style={{ padding: '9px 8px', textAlign: 'right', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margen</th>
                  <th style={{ padding: '9px 4px', textAlign: 'center', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mix</th>
                  <th style={{ padding: '9px 4px', textAlign: 'center', color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.72rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {projectedProducts.map((prod, idx) => {
                  const isActive = prod.included !== false;

                  const price = Number(prod.price) || 0;
                  const baseCost = Number(prod.baseCost) || 0;
                  const paymentFee = price * (totalVariablePercent / 100);
                  const totalUnitVarCost = baseCost + commonVariablePerUnit + paymentFee;
                  const prodUnits = isActive ? (Number(prod.targetUnits !== undefined ? prod.targetUnits : 0) || 0) : 0;
                  const prodRevenue = prodUnits * price;
                  const prodReplacement = prodUnits * baseCost;
                  const prodTotalVarCost = prodUnits * totalUnitVarCost;
                  const prodMargin = prodRevenue - prodTotalVarCost;
                  const marginPct = price > 0 ? ((price - totalUnitVarCost) / price) * 100 : 0;

                  const invInfo = getProductInventoryInfo(prod, inventory, products);
                  const realStock = invInfo.stock;

                  const rowBg = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-input)';

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        background: rowBg,
                        opacity: isActive ? 1 : 0.4,
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* ✓ Checkbox */}
                      <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleToggleProductInclusion(prod.id)}
                          title="Incluir / Excluir de la proyección"
                          style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--primary-600)' }}
                        />
                      </td>

                      {/* Producto */}
                      <td style={{ padding: '7px 10px', overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span className="code-mono" style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', background: 'var(--bg-subtle)', padding: '0px 4px', borderRadius: '3px', border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px', display: 'inline-block' }}>
                            {prod.sku}
                          </span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-subtle)', flexShrink: 0 }}>
                            {prod.isCustom ? '✨' : '📦'}
                          </span>
                        </div>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                        {realStock !== null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                            <span
                              className={`badge ${realStock > 0 ? 'badge-green' : 'badge-yellow'}`}
                              style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px' }}
                            >
                              {realStock}
                            </span>
                            {isActive && prod.targetUnits !== realStock && realStock > 0 && (
                              <button
                                type="button"
                                onClick={() => handleUpdateProductUnits(prod.id, realStock)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.6rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', lineHeight: 1.2 }}
                                title="Alinear con stock real"
                              >
                                ↑ usar
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>—</span>
                        )}
                      </td>

                      {/* Precio */}
                      <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8rem' }}>S/{price.toFixed(0)}</span>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-subtle)' }}>.{(price % 1).toFixed(2).slice(2)}</div>
                      </td>

                      {/* Unidades */}
                      <td style={{ padding: '5px 6px', textAlign: 'center', background: isActive ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                        {isActive ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <input
                              type="number"
                              min="0"
                              max="10000"
                              value={prod.targetUnits !== undefined ? prod.targetUnits : 0}
                              onChange={(e) => handleUpdateProductUnits(prod.id, e.target.value)}
                              style={{
                                width: '56px',
                                padding: '4px 4px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                color: 'var(--primary-600)',
                                border: '1.5px solid rgba(99,102,241,0.4)',
                                borderRadius: '6px',
                                background: 'var(--bg-card)',
                                outline: 'none',
                              }}
                            />
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-subtle)' }}>u</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>excluido</span>
                        )}
                      </td>

                      {/* Ingresos */}
                      <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                        {isActive ? (
                          <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.8rem' }}>
                            S/{prodRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                      </td>

                      {/* Costo unit. / Fondo total (merged) */}
                      <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>S/{baseCost.toFixed(2)}<span style={{ fontSize: '0.6rem', color: 'var(--text-subtle)' }}>/u</span></div>
                        {isActive ? (
                          <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                            -{prodReplacement.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total
                          </div>
                        ) : <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>—</div>}
                      </td>

                      {/* Margen */}
                      <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                        {isActive ? (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: prodMargin > 0 ? '#10b981' : '#ef4444' }}>
                              S/{prodMargin.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: marginPct > 30 ? '#10b981' : marginPct > 10 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                              {marginPct.toFixed(1)}% margen
                            </div>
                          </>
                        ) : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                      </td>

                      {/* % Mix */}
                      <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                        {isActive ? (
                          <span style={{
                            display: 'inline-block',
                            background: 'rgba(99,102,241,0.15)',
                            color: 'var(--primary-600)',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: '10px',
                            border: '1px solid rgba(99,102,241,0.25)',
                          }}>
                            {prod.mixPercent}%
                          </span>
                        ) : <span style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>—</span>}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditProduct(prod)}
                            title="Editar"
                            style={{ padding: '4px' }}
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: '#ef4444', padding: '4px' }}
                            onClick={() => handleDeleteProjectedProduct(prod)}
                            title="Eliminar"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totales */}
              <tfoot>
                <tr style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.06))', borderTop: '2px solid var(--border-subtle)' }}>
                  <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Totales:
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      background: 'rgba(99,102,241,0.15)',
                      color: 'var(--primary-600)',
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      padding: '3px 8px',
                      borderRadius: '20px',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}>
                      {simulationResults.units} uds
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#10b981', fontWeight: 900, fontSize: '0.88rem' }}>
                    S/{simulationResults.grossRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444', fontWeight: 800, fontSize: '0.82rem' }}>
                    -{simulationResults.replacementFund.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8b5cf6', fontWeight: 900, fontSize: '0.88rem' }}>
                    S/{simulationResults.totalMargin.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>100%</span>
                  </td>
                  <td></td>
                </tr>

                {/* Fila resumen financiero */}
                <tr style={{ background: 'rgba(99,102,241,0.04)', borderTop: '1px dashed var(--border-subtle)' }}>
                  <td colSpan={10} style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span>Gastos Fijos: <strong style={{ color: '#f59e0b' }}>-S/{totalFixedCosts.toFixed(2)}</strong></span>
                        <span style={{ color: 'var(--border-subtle)' }}>|</span>
                        <span>Utilidad Neta: <strong style={{ color: '#06b6d4' }}>S/{simulationResults.netProfit.toFixed(2)}</strong></span>
                        <span style={{ color: 'var(--border-subtle)' }}>|</span>
                        <span>Reinversión ({simulationResults.reinvestmentPercent}%): <strong style={{ color: '#a855f7' }}>-S/{simulationResults.reinvestmentAmount.toFixed(2)}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Reparto por Socio (50/50):</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#10b981' }}>
                          S/{simulationResults.profitPerPartner.toFixed(2)} c/u
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 3: GASTOS FIJOS Y VARIABLES (EDITABLES Y AUDITADOS)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'costs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Columna 1: Gastos Fijos Mensuales */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="var(--primary-600)" />
                  <span>Gastos Fijos Mensuales</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Costos que se pagan todos los meses sin importar cuántas unidades se vendan.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {fixedCosts.length === 0 && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onUpdateProjectionsData({
                        ...projectionsData,
                        fixedCosts: EXCEL_FIXED_COSTS_TEMPLATE
                      });
                    }}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Cargar Fijos Excel</span>
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewFixedCostModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>Agregar Gasto Fijo</span>
                </button>
              </div>
            </div>

            {fixedCosts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <p style={{ margin: '0 0 14px 0' }}>
                  No hay gastos fijos registrados. Agrega tus gastos recurrentes mensuales para modelar el punto de equilibrio.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsNewFixedCostModalOpen(true)}
                  >
                    <Plus size={14} />
                    <span>Agregar Gasto Fijo</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onUpdateProjectionsData({
                        ...projectionsData,
                        fixedCosts: EXCEL_FIXED_COSTS_TEMPLATE
                      });
                    }}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Cargar Fijos Excel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th style={{ width: '110px' }}>Monto (S/)</th>
                      <th>Nota / Detalle</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixedCosts.map(fc => (
                      <tr key={fc.id}>
                        <td style={{ fontWeight: 600 }}>{fc.concept}</td>
                        <td>
                          <input 
                            type="number"
                            min="0"
                            step="10"
                            className="form-control"
                            style={{ width: '90px', padding: '4px 8px', fontWeight: 700 }}
                            value={fc.amount}
                            onChange={(e) => handleUpdateFixedCost(fc.id, e.target.value)}
                          />
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{fc.note}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => handleOpenEditFixedCost(fc)}
                              title="Editar detalle del gasto fijo"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              className="btn-icon" 
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDeleteFixedCost(fc)}
                              title="Eliminar gasto fijo (con auditoría)"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-input)', fontWeight: 800 }}>
                      <td>TOTAL GASTOS FIJOS:</td>
                      <td style={{ color: 'var(--primary-600)', fontSize: '1rem' }}>
                        S/ {totalFixedCosts.toFixed(2)}
                      </td>
                      <td colSpan="2" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Requerido cada mes
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Columna 2: Gastos y Costos Variables (Dinámico con CRUD Completo) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Boxes size={18} color="#10b981" />
                  <span>Gastos y Costos Variables</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Costos proporcionales a cada unidad comercializada o porcentaje por venta (empaque, cobro, delivery).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {variableCosts.length === 0 && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleLoadSuggestedVariableCosts}
                    title="Cargar los 5 costos variables sugeridos de Linkeo"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Cargar Variables Sugeridos</span>
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewVariableCostModalOpen(true)}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }}
                >
                  <Plus size={14} />
                  <span>Agregar Gasto Variable</span>
                </button>
              </div>
            </div>

            {variableCosts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <p style={{ margin: '0 0 14px 0' }}>
                  No hay gastos o costos variables registrados. Agrega costos unitarios o comisiones de cobro para afinar el margen.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsNewVariableCostModalOpen(true)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }}
                  >
                    <Plus size={14} />
                    <span>Agregar Gasto Variable</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleLoadSuggestedVariableCosts}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Cargar Sugeridos</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Concepto / Tipo</th>
                      <th style={{ width: '130px' }}>Monto / Tasa</th>
                      <th>Nota / Detalle</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variableCosts.map(vc => (
                      <tr key={vc.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{vc.concept}</div>
                          <span className={`badge ${vc.type === 'percentage' ? 'badge-purple' : 'badge-green'}`} style={{ fontSize: '0.68rem', marginTop: '2px', display: 'inline-block' }}>
                            {vc.type === 'percentage' ? '% sobre Venta' : 'S/ por Unidad'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {vc.type !== 'percentage' && <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>S/</span>}
                            <input 
                              type="number"
                              min="0"
                              step={vc.type === 'percentage' ? '0.1' : '0.5'}
                              className="form-control"
                              style={{ width: '85px', padding: '4px 6px', fontWeight: 700, textAlign: 'center' }}
                              value={vc.amount}
                              onChange={(e) => handleUpdateVariableCostAmount(vc.id, e.target.value)}
                            />
                            {vc.type === 'percentage' && <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>%</span>}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{vc.note}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => handleOpenEditVariableCost(vc)}
                              title="Editar detalle del gasto variable"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              className="btn-icon" 
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDeleteVariableCost(vc)}
                              title="Eliminar gasto variable (con auditoría)"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-input)', fontWeight: 800 }}>
                      <td>TOTALES VARIABLES:</td>
                      <td style={{ color: '#10b981', fontSize: '0.95rem' }}>
                        <div>S/ {commonVariablePerUnit.toFixed(2)} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ unid</span></div>
                        {totalVariablePercent > 0 && (
                          <div style={{ fontSize: '0.78rem', color: '#8b5cf6' }}>+ {totalVariablePercent.toFixed(1)}% venta</div>
                        )}
                      </td>
                      <td colSpan="2" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Se descuenta por cada tarjeta vendida
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 4: EMBUDO COMERCIAL & INVERSIÓN INICIAL (EDITABLE & AUDITADO) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 4: EMBUDO COMERCIAL & PIPELINE CRM (100% EDITABLE & EN VIVO)  */}
      {/* ========================================================================= */}
      {activeSubTab === 'funnel' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px' }}>
          {/* Bloque 1: Embudo Comercial para Alcanzar la Meta (100% Interactivo y Editable) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  Pipeline de Conversión Comercial
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={18} color="#8b5cf6" />
                  <span>Embudo Comercial & Ritmo de Visitas ({effectiveFunnelUnits} uds)</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Ajusta las unidades y los porcentajes de conversión para calcular el esfuerzo comercial diario.
                </p>
              </div>

              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleOpenEditFunnel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Editar ratios en ventana modal"
              >
                <Settings size={14} />
                <span>Ajustar Ratios</span>
              </button>
            </div>

            {/* Barra de Control de Unidades a Simular (100% Dinámica, sin botones de lote forzado) */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px 14px', 
              background: 'var(--bg-input)', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} color="#8b5cf6" />
                <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>Meta de Unidades a Simular:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="number" 
                  min="1" 
                  max="5000"
                  className="form-control"
                  style={{ width: '80px', padding: '4px 8px', textAlign: 'center', fontWeight: 900, fontSize: '0.95rem', color: '#8b5cf6' }}
                  value={effectiveFunnelUnits}
                  onChange={(e) => handleUpdateFunnelUnits(e.target.value)}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>uds</span>
                {simulationResults.units > 0 && effectiveFunnelUnits !== simulationResults.units && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => handleUpdateFunnelUnits(simulationResults.units)}
                    title={`Restablecer a meta del mix (${simulationResults.units} uds)`}
                  >
                    Usar meta del Mix ({simulationResults.units})
                  </button>
                )}
              </div>
            </div>

            {/* Embudo Visual Interactivo con Inputs Editables al Vuelo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Etapa 1: Prospectos Contactados */}
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.12)', 
                borderLeft: '4px solid #3b82f6', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>1. Prospectos a Contactar / Mapear</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Locales y comercios a visitar o escribir</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#3b82f6' }}>
                    {funnelResults.contactsRequired}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    ~{funnelResults.contactsPerDay} por día
                  </div>
                </div>
              </div>

              {/* Etapa 2: Respuestas Obtenidas */}
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.12)', 
                borderLeft: '4px solid #8b5cf6', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>2. Respuestas / Atención:</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        className="form-control"
                        style={{ width: '56px', padding: '2px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem' }}
                        value={funnelRatios.contactToResponse !== undefined && funnelRatios.contactToResponse !== '' ? Math.round(Number(funnelRatios.contactToResponse) * 100) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateRatio('contactToResponse', val === '' ? '' : (Number(val) / 100));
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Negocios que atienden en puerta o responden WhatsApp
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#8b5cf6' }}>
                    {funnelResults.responsesRequired}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    ~{funnelResults.responsesPerDay} por día
                  </div>
                </div>
              </div>

              {/* Etapa 3: Demos Realizadas */}
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.12)', 
                borderLeft: '4px solid #f59e0b', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>3. Demostraciones Presentadas:</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        className="form-control"
                        style={{ width: '56px', padding: '2px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem' }}
                        value={funnelRatios.responseToDemo !== undefined && funnelRatios.responseToDemo !== '' ? Math.round(Number(funnelRatios.responseToDemo) * 100) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateRatio('responseToDemo', val === '' ? '' : (Number(val) / 100));
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Muestra física de tarjeta NFC funcionando al toque con smartphone
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f59e0b' }}>
                    {funnelResults.demosRequired}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    ~{funnelResults.demosPerDay} por día
                  </div>
                </div>
              </div>

              {/* Etapa 4: Negocios Compradores */}
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.12)', 
                borderLeft: '4px solid #10b981', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>4. Negocios Compradores (Cierres):</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        className="form-control"
                        style={{ width: '56px', padding: '2px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem' }}
                        value={funnelRatios.demoToCustomer !== undefined && funnelRatios.demoToCustomer !== '' ? Math.round(Number(funnelRatios.demoToCustomer) * 100) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateRatio('demoToCustomer', val === '' ? '' : (Number(val) / 100));
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Cierres efectivos a</span>
                    <input 
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="10"
                      className="form-control"
                      style={{ width: '54px', padding: '1px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.76rem' }}
                      value={funnelRatios.unitsPerCustomer !== undefined ? funnelRatios.unitsPerCustomer : 1.29}
                      onChange={(e) => handleUpdateRatio('unitsPerCustomer', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <span>uds / cliente</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>
                    {funnelResults.buyersRequired}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    ~{funnelResults.buyersPerDay} clientes/día
                  </div>
                </div>
              </div>
            </div>

            {/* Parámetros Operativos (Días hábiles y Socios) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px 0 4px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Días de venta al mes:</span>
                <input 
                  type="number"
                  min="1"
                  max="31"
                  className="form-control"
                  style={{ width: '55px', padding: '2px 4px', textAlign: 'center', fontWeight: 700 }}
                  value={businessParams.salesDaysPerMonth || 24}
                  onChange={(e) => handleUpdateParam('salesDaysPerMonth', e.target.value)}
                />
                <span>días</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Socios Co-CEOs:</span>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  className="form-control"
                  style={{ width: '45px', padding: '2px 4px', textAlign: 'center', fontWeight: 700 }}
                  value={businessParams.partnersCount || 2}
                  onChange={(e) => handleUpdateParam('partnersCount', e.target.value)}
                />
                <span>(50/50)</span>
              </div>
            </div>

            {/* Asignación Diaria por Socio Destacada */}
            <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.22)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                🎯 Cuota Diaria Recomendada por Co-CEO (Para {effectiveFunnelUnits} unidades):
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>👨‍💼 Luis Romero:</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary-600)' }}>
                    {funnelResults.contactsPerPartnerPerDay} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>contactos o visitas/día</span>
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>🚀 Kevin Servat:</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#8b5cf6' }}>
                    {funnelResults.contactsPerPartnerPerDay} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>contactos o visitas/día</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Pipeline B2B en Tiempo Real (Sincronizado con CRM Kanban) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  Sincronizado en Tiempo Real con CRM Kanban
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#10b981" />
                  <span>Pipeline B2B & Avance Real de Ventas</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Estado de tus prospectos reales en Lima para alcanzar las {effectiveFunnelUnits} unidades.
                </p>
              </div>

              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentTab && setCurrentTab('leads')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Ir al tablero Kanban de prospectos"
              >
                <span>Ver en Kanban</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Métricas Resumidas del Pipeline */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Leads Registrados</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#3b82f6' }}>{crmMetrics.totalLeads}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>comercios en Lima</div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ventas Concretadas</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>{crmMetrics.closedCount}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>clientes cobrados</div>
              </div>

              <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Valor en Pipeline</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#8b5cf6', marginTop: '2px' }}>S/ {crmMetrics.totalPipelineValue.toFixed(0)}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>en negociación</div>
              </div>
            </div>

            {/* Barra de Avance Real vs Meta */}
            <div style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Progreso hacia la Meta ({effectiveFunnelUnits} uds):
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: crmMetrics.progressPct >= 100 ? '#10b981' : '#38bdf8' }}>
                  {crmMetrics.closedCount} de {funnelResults.buyersRequired} clientes ({crmMetrics.progressPct}%)
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${crmMetrics.progressPct}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '6px' }}>
                {crmMetrics.remainingToClose > 0 
                  ? `Faltan ${crmMetrics.remainingToClose} clientes compradores para completar la meta de ${effectiveFunnelUnits} unidades.`
                  : `🎉 ¡Meta de clientes alcanzada para las ${effectiveFunnelUnits} unidades!`
                }
              </div>
            </div>

            {/* Desglose por Etapas Activas del CRM */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
                DISTRIBUCIÓN DE LEADS POR ETAPAS DEL CRM:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                <div style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>1. Prospectos</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6' }}>{crmMetrics.prospectos.length} leads</div>
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(139, 92, 246, 0.1)', borderLeft: '3px solid #8b5cf6', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>2. Visitados</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#8b5cf6' }}>{crmMetrics.visitados.length} leads</div>
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>3. Negociación</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>{crmMetrics.negociaciones.length} leads</div>
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>5. Entregados</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>{crmMetrics.entregados.length} ventas</div>
                </div>
              </div>
            </div>

            {/* Lista de Leads en Seguimiento Activo */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PROSPECTOS ACTIVOS EN SEGUIMIENTO ({leads.slice(0, 4).length} de {leads.length}):
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentTab && setCurrentTab('leads')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                >
                  Ver todos los {leads.length} leads →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {leads.slice(0, 4).map(lead => {
                  const stage = normalizeLeadStage(lead.stage);
                  const stageColors = {
                    prospecto: '#3b82f6',
                    visitado: '#8b5cf6',
                    negociacion: '#f59e0b',
                    configurando: '#06b6d4',
                    entregado: '#10b981',
                    postventa: '#ec4899'
                  };
                  const stageLabels = {
                    prospecto: 'Prospecto',
                    visitado: 'Visitado',
                    negociacion: 'Negociación',
                    configurando: 'Configurando',
                    entregado: 'Entregado y Cobrado',
                    postventa: 'Post-Venta'
                  };
                  return (
                    <div 
                      key={lead.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {lead.businessName}
                        </span>
                        <span style={{
                          fontSize: '0.66rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: `${stageColors[stage] || '#3b82f6'}22`,
                          color: stageColors[stage] || '#3b82f6',
                          fontWeight: 700
                        }}>
                          {stageLabels[stage] || lead.stage}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {lead.assignedPartner ? lead.assignedPartner.split(' ')[0] : 'Por asignar'}
                        </span>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>
                          S/ {Number(lead.estimatedValue || 60).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accesos rápidos */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentTab && setCurrentTab('leads')}
                style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center' }}
              >
                <Users size={14} />
                <span>Gestionar Pipeline en Kanban</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentTab && setCurrentTab('calendar')}
                style={{ fontSize: '0.78rem' }}
              >
                <Calendar size={14} />
                <span>Ver Citas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 5: PLAN DE ACCIÓN 30 DÍAS (FULL CRUD INTEGRADO & AUDITADO)     */}
      {/* ========================================================================= */}
      {activeSubTab === 'plan30' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '4px', display: 'inline-block' }}>
                Plan Operativo de Validación
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Plan de Acción de 30 Días (4 Semanas de Ejecución)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                Agrega tus metas diarias de validación comercial, registra resultados y haz seguimiento continuo.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                value={planFilterWeek}
                onChange={(e) => setPlanFilterWeek(e.target.value)}
              >
                <option value="all">Todas las Semanas</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                  <option key={w} value={w}>
                    {weekTitles[w] || `Semana ${w}`}
                  </option>
                ))}
              </select>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditWeekTitlesModalOpen(true)}
                title="Personalizar nombres de las semanas"
              >
                <Settings size={14} />
                <span>Nombres Semanas</span>
              </button>

              <button
                className={`btn btn-sm ${isInlinePlanEdit ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsInlinePlanEdit(!isInlinePlanEdit)}
                title={isInlinePlanEdit ? 'Cambiar a vista compacta' : 'Activar modo edición directa en tabla'}
              >
                <Sliders size={14} />
                <span>{isInlinePlanEdit ? '⚡ Modo Tabla Editable' : '👁️ Vista Compacta'}</span>
              </button>

              {plan30Days.length === 0 && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleLoadPlanTemplate}
                >
                  <FileSpreadsheet size={14} />
                  <span>Cargar 27 Tareas del Excel</span>
                </button>
              )}

              <button 
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddPlan}
              >
                <Plus size={14} />
                <span>+ Agregar Tarea al Plan</span>
              </button>
            </div>
          </div>

          {/* Datalist para autocompletado de canales en la tabla */}
          <datalist id="plan-channels-list">
            {COMMON_CHANNELS.map(ch => (
              <option key={ch} value={ch} />
            ))}
          </datalist>

          {/* Barra de Progreso del Plan */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progreso de Validación:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}>
              {completedTasksCount} / {plan30Days.length} ({planProgressPct}%)
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: '8px', marginBottom: '20px' }}>
            <div className="progress-bar-fill" style={{ width: `${planProgressPct}%` }}></div>
          </div>

          {/* Tabla o Estado Vacío de Tareas */}
          {plan30Days.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={36} color="var(--primary-600)" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' }}>
                El Plan de Acción está libre para registrar tareas
              </h4>
              <p style={{ fontSize: '0.82rem', maxWidth: '500px', margin: '0 auto 16px auto' }}>
                Comienza agregando las acciones clave de los primeros días o carga la estructura de 27 días proveniente del Excel.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddPlan}>
                  <Plus size={14} />
                  <span>+ Agregar Primera Tarea</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleLoadPlanTemplate}>
                  <FileSpreadsheet size={14} />
                  <span>Cargar 27 Tareas del Excel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center' }}>OK</th>
                    <th style={{ width: '65px' }}>Día</th>
                    <th style={{ width: '80px' }}>Semana</th>
                    <th style={{ minWidth: '220px' }}>Acción Principal</th>
                    <th style={{ width: '130px' }}>Meta Medible</th>
                    <th style={{ width: '120px' }}>Canal</th>
                    <th style={{ width: '145px' }}>Responsable</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                    <th style={{ minWidth: '160px' }}>Resultado / Aprendizaje</th>
                    <th style={{ width: '65px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlanTasks.map(task => (
                    <tr 
                      key={task.day}
                      style={{
                        opacity: task.completed ? 0.78 : 1,
                        backgroundColor: task.completed ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => onTogglePlanTask && onTogglePlanTask(task.day)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>

                      {isInlinePlanEdit ? (
                        <>
                          <td>
                            <input 
                              type="number"
                              min="1"
                              max="60"
                              className="form-control"
                              style={{ width: '54px', padding: '2px 4px', textAlign: 'center', fontWeight: 800 }}
                              value={task.day}
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'day', e.target.value)}
                            />
                          </td>
                          <td>
                            <select 
                              className="form-control"
                              style={{ width: '75px', padding: '2px 4px', fontSize: '0.78rem', fontWeight: 700 }}
                              value={task.week}
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'week', e.target.value)}
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                                <option key={w} value={w}>Sem {w}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ width: '100%', padding: '3px 6px', fontWeight: 600, fontSize: '0.82rem' }}
                              value={task.action}
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'action', e.target.value)}
                              placeholder="Acción principal..."
                            />
                          </td>
                          <td>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ width: '100%', padding: '3px 6px', fontSize: '0.8rem' }}
                              value={task.target}
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'target', e.target.value)}
                              placeholder="Meta..."
                            />
                          </td>
                          <td>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ width: '100%', padding: '3px 6px', fontSize: '0.8rem' }}
                              value={task.channel}
                              list="plan-channels-list"
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'channel', e.target.value)}
                              placeholder="Canal..."
                            />
                          </td>
                          <td>
                            <select 
                              className="form-control"
                              style={{ width: '100%', padding: '3px 6px', fontSize: '0.78rem' }}
                              value={task.responsible}
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'responsible', e.target.value)}
                            >
                              <option value="Luis Romero">👨‍💼 Luis Romero</option>
                              <option value="Kevin Servat">🚀 Kevin Servat</option>
                              <option value="Luis Romero / Kevin Servat">🤝 Ambos (50/50)</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={`badge ${task.completed ? 'badge-green' : 'badge-yellow'}`}
                              style={{ cursor: 'pointer', border: 'none', padding: '4px 8px' }}
                              onClick={() => onTogglePlanTask && onTogglePlanTask(task.day)}
                              title="Clic para cambiar estado"
                            >
                              {task.completed ? '✓ Completado' : '⏳ Pendiente'}
                            </button>
                          </td>
                          <td>
                            <input 
                              type="text"
                              className="form-control"
                              style={{ width: '100%', padding: '3px 6px', fontSize: '0.78rem' }}
                              placeholder="Anotar resultado o aprendizaje..."
                              value={task.result || ''}
                              onChange={(e) => handleUpdatePlanTaskField(task.day, 'result', e.target.value)}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td><strong>Día {task.day}</strong></td>
                          <td>Semana {task.week}</td>
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                              {task.action}
                            </span>
                          </td>
                          <td><span className="badge badge-blue">{task.target}</span></td>
                          <td>{task.channel}</td>
                          <td>{task.responsible}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${task.completed ? 'badge-green' : 'badge-yellow'}`}>
                              {task.completed ? 'Completado' : 'Pendiente'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {task.result || '—'}
                          </td>
                        </>
                      )}

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button 
                            className="btn-icon" 
                            style={{ width: '26px', height: '26px' }}
                            onClick={() => handleOpenEditPlan(task)}
                            title="Editar en ventana detallada"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ width: '26px', height: '26px', color: '#ef4444' }}
                            onClick={() => onRequestDelete && onRequestDelete(task, 'Plan 30 Días')}
                            title="Eliminar tarea del plan (con auditoría)"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Botón inferior de agregar fila rápida */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddQuickRow}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} />
                  <span>+ Agregar Fila Rápida al Plan</span>
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                  * En modo tabla editable puedes modificar cualquier celda y los datos se actualizan en tiempo real.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROYECTAR NUEVO PRODUCTO HIPOTÉTICO / FUTURO                       */}
      {/* ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary-600)" />
                <span>Proyectar Nuevo Producto al Modelo</span>
              </h3>
              <button className="close-btn" onClick={handleCloseNewProductModal}>✕</button>
            </div>

            <form onSubmit={handleCreateNewProjectedProduct}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto Proyectado:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Display Acrílico Doble Cara A5, Sticker Epoxi..."
                  value={newProjectedProductForm.name}
                  onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Código SKU:</label>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setNewProjectedProductForm(prev => ({ ...prev, sku: generateRandomSku('LNK-PROD') }))}
                    >
                      <Shuffle size={12} />
                      <span>🎲 Aleatorio</span>
                    </button>
                  </div>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={newProjectedProductForm.sku}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unidades a Vender:</label>
                  <input 
                    type="number" 
                    min="0"
                    max="10000"
                    className="form-control"
                    placeholder="Ej: 10"
                    value={newProjectedProductForm.targetUnits !== undefined ? newProjectedProductForm.targetUnits : 10}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, targetUnits: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio Estimado de Venta (S/):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-control"
                    placeholder="Ej: 60.00"
                    value={newProjectedProductForm.price}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Base Unitario (S/):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-control"
                    placeholder="Ej: 13.00"
                    value={newProjectedProductForm.baseCost}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, baseCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewProductModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar a Proyección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR PRODUCTO PROYECTADO                                         */}
      {/* ========================================================================= */}
      {isEditProductModalOpen && editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Producto Proyectado</h3>
              <button className="close-btn" onClick={() => setIsEditProductModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código SKU:</label>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unidades a Vender:</label>
                  <input 
                    type="number" 
                    min="0"
                    max="10000"
                    className="form-control"
                    value={editingProduct.targetUnits !== undefined ? editingProduct.targetUnits : 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, targetUnits: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio Estimado (S/):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-control"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Base Unitario (S/):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-control"
                    value={editingProduct.baseCost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, baseCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditProductModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORTAR PRODUCTO DEL ALMACÉN / CATÁLOGO                           */}
      {/* ========================================================================= */}
      {isImportProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="var(--primary-600)" />
                <span>Importar Producto o Insumo del Almacén</span>
              </h3>
              <button className="close-btn" onClick={() => setIsImportProductModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Selecciona un producto existente de tu Catálogo para incorporarlo al modelo financiero (los ya agregados se excluyen automáticamente para evitar duplicados):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
              {availableProductsToImport.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                  <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                    {products.length === 0 
                      ? 'No tienes productos registrados en el Catálogo' 
                      : '¡Todos los productos del Catálogo ya están agregados!'}
                  </div>
                  <p style={{ fontSize: '0.82rem', maxWidth: '440px', margin: '0 auto 16px auto', color: 'var(--text-muted)' }}>
                    {products.length === 0 
                      ? 'Registra productos en la pestaña de Catálogo o Almacén para poder importarlos al modelo.' 
                      : 'Todos tus modelos del catálogo ya forman parte de la tabla sin duplicados. Puedes proyectar nuevos productos futuros o ajustar las unidades de los existentes.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setIsImportProductModalOpen(false);
                        setIsNewProductModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      <span>+ Proyectar Nuevo Producto</span>
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsImportProductModalOpen(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                availableProductsToImport.map(prod => {
                  const invInfo = getProductInventoryInfo(prod, inventory, products);
                  const displayStock = invInfo.stock;
                  const displayCost = invInfo.cost > 0 ? invInfo.cost : (Number(prod.cost) || 0);

                  return (
                    <div 
                      key={prod.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {prod.name}
                          </span>
                          {displayStock !== null ? (
                            <span 
                              className={`badge ${displayStock > 0 ? 'badge-green' : 'badge-yellow'}`}
                              style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                            >
                              Stock actual: {displayStock} uds
                            </span>
                          ) : (
                            <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              Catálogo
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span className="code-mono">{prod.sku}</span>
                          <span>Precio: <strong style={{ color: 'var(--text-main)' }}>S/ {Number(prod.price).toFixed(2)}</strong></span>
                          <span>Costo reposición: <strong style={{ color: '#ef4444' }}>S/ {displayCost.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleImportProductFromCatalog(prod)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Importar
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR GASTO FIJO MENSUAL                                         */}
      {/* ========================================================================= */}
      {isNewFixedCostModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Gasto Fijo Mensual</h3>
              <button className="close-btn" onClick={handleCloseNewFixedCostModal}>✕</button>
            </div>

            <form onSubmit={handleAddFixedCost}>
              <div className="form-group">
                <label className="form-label">Concepto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Internet / Servidores, Alquiler, etc."
                  value={newFixedCostForm.concept}
                  onChange={(e) => setNewFixedCostForm({ ...newFixedCostForm, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monto Mensual (S/):</label>
                <input 
                  type="number" 
                  step="10"
                  min="0"
                  className="form-control"
                  placeholder="Ej: 150.00"
                  value={newFixedCostForm.amount}
                  onChange={(e) => setNewFixedCostForm({ ...newFixedCostForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nota / Detalle:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Plan compartido mensual"
                  value={newFixedCostForm.note}
                  onChange={(e) => setNewFixedCostForm({ ...newFixedCostForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewFixedCostModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Gasto Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR GASTO FIJO                                                  */}
      {/* ========================================================================= */}
      {isEditFixedCostModalOpen && editingFixedCost && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Gasto Fijo</h3>
              <button className="close-btn" onClick={() => setIsEditFixedCostModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditFixedCost}>
              <div className="form-group">
                <label className="form-label">Concepto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingFixedCost.concept}
                  onChange={(e) => setEditingFixedCost({ ...editingFixedCost, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monto Mensual (S/):</label>
                <input 
                  type="number" 
                  step="10"
                  min="0"
                  className="form-control"
                  value={editingFixedCost.amount}
                  onChange={(e) => setEditingFixedCost({ ...editingFixedCost, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nota / Detalle:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingFixedCost.note || ''}
                  onChange={(e) => setEditingFixedCost({ ...editingFixedCost, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditFixedCostModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR GASTO VARIABLE                                             */}
      {/* ========================================================================= */}
      {isNewVariableCostModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="#10b981" />
                <span>Agregar Gasto Variable</span>
              </h3>
              <button className="close-btn" onClick={handleCloseNewVariableCostModal}>✕</button>
            </div>

            <form onSubmit={handleAddVariableCost}>
              <div className="form-group">
                <label className="form-label">Concepto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Empaque Kraft, Comisión POS Niubiz, Delivery..."
                  value={newVariableCostForm.concept}
                  onChange={(e) => setNewVariableCostForm({ ...newVariableCostForm, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Costo Variable:</label>
                <select 
                  className="form-control"
                  value={newVariableCostForm.type}
                  onChange={(e) => setNewVariableCostForm({ ...newVariableCostForm, type: e.target.value })}
                >
                  <option value="unit_amount">Monto Fijo por Unidad (S/ por tarjeta o display)</option>
                  <option value="percentage">Porcentaje sobre Precio de Venta (% de comisión)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {newVariableCostForm.type === 'percentage' ? 'Porcentaje sobre la Venta (%):' : 'Monto Unitario (S/):'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {newVariableCostForm.type === 'percentage' ? '%' : 'S/'}
                  </span>
                  <input 
                    type="number" 
                    step={newVariableCostForm.type === 'percentage' ? '0.1' : '0.5'}
                    min="0"
                    className="form-control"
                    placeholder={newVariableCostForm.type === 'percentage' ? 'Ej: 4.0' : 'Ej: 2.50'}
                    value={newVariableCostForm.amount}
                    onChange={(e) => setNewVariableCostForm({ ...newVariableCostForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nota / Detalle:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Aplica por cada unidad física entregada"
                  value={newVariableCostForm.note}
                  onChange={(e) => setNewVariableCostForm({ ...newVariableCostForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewVariableCostModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }}>
                  Guardar Gasto Variable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR GASTO VARIABLE                                              */}
      {/* ========================================================================= */}
      {isEditVariableCostModalOpen && editingVariableCost && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="#10b981" />
                <span>Editar Gasto Variable</span>
              </h3>
              <button className="close-btn" onClick={() => setIsEditVariableCostModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditVariableCost}>
              <div className="form-group">
                <label className="form-label">Concepto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingVariableCost.concept}
                  onChange={(e) => setEditingVariableCost({ ...editingVariableCost, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Costo Variable:</label>
                <select 
                  className="form-control"
                  value={editingVariableCost.type || 'unit_amount'}
                  onChange={(e) => setEditingVariableCost({ ...editingVariableCost, type: e.target.value })}
                >
                  <option value="unit_amount">Monto Fijo por Unidad (S/ por tarjeta o display)</option>
                  <option value="percentage">Porcentaje sobre Precio de Venta (% de comisión)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingVariableCost.type === 'percentage' ? 'Porcentaje sobre la Venta (%):' : 'Monto Unitario (S/):'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {editingVariableCost.type === 'percentage' ? '%' : 'S/'}
                  </span>
                  <input 
                    type="number" 
                    step={editingVariableCost.type === 'percentage' ? '0.1' : '0.5'}
                    min="0"
                    className="form-control"
                    value={editingVariableCost.amount}
                    onChange={(e) => setEditingVariableCost({ ...editingVariableCost, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nota / Detalle:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingVariableCost.note || ''}
                  onChange={(e) => setEditingVariableCost({ ...editingVariableCost, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditVariableCostModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR ÍTEM DE INVERSIÓN INICIAL                                  */}
      {/* ========================================================================= */}
      {isNewInvestmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Ítem a Inversión Inicial</h3>
              <button className="close-btn" onClick={handleCloseNewInvestmentModal}>✕</button>
            </div>

            <form onSubmit={handleAddInvestmentItem}>
              <div className="form-group">
                <label className="form-label">Concepto del Activo / Compra:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Lote 50 chips NFC, Dominio linkeocards.com..."
                  value={newInvestmentForm.concept}
                  onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cantidad:</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-control"
                    value={newInvestmentForm.quantity}
                    onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Unitario (S/):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    className="form-control"
                    placeholder="Ej: 13.00"
                    value={newInvestmentForm.unitCost}
                    onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, unitCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewInvestmentModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Inversión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ÍTEM DE INVERSIÓN INICIAL                                   */}
      {/* ========================================================================= */}
      {isEditInvestmentModalOpen && editingInvestmentItem && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Ítem de Inversión Inicial</h3>
              <button className="close-btn" onClick={() => setIsEditInvestmentModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditInvestment}>
              <div className="form-group">
                <label className="form-label">Concepto del Activo / Compra:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingInvestmentItem.concept}
                  onChange={(e) => setEditingInvestmentItem({ ...editingInvestmentItem, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cantidad:</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-control"
                    value={editingInvestmentItem.quantity}
                    onChange={(e) => setEditingInvestmentItem({ ...editingInvestmentItem, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Unitario (S/):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    className="form-control"
                    value={editingInvestmentItem.unitCost}
                    onChange={(e) => setEditingInvestmentItem({ ...editingInvestmentItem, unitCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Total Calculado:</span>
                  <strong>S/ {((Number(editingInvestmentItem.quantity) || 1) * (Number(editingInvestmentItem.unitCost) || 0)).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.78rem' }}>
                  <span>Aporte 50/50 por socio:</span>
                  <span>S/ {(((Number(editingInvestmentItem.quantity) || 1) * (Number(editingInvestmentItem.unitCost) || 0)) / 2).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditInvestmentModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUSTAR RATIOS DE CONVERSIÓN DEL EMBUDO                            */}
      {/* ========================================================================= */}
      {isEditFunnelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#8b5cf6" />
                <span>Ajustar Ratios de Conversión del Embudo</span>
              </h3>
              <button className="close-btn" onClick={() => setIsEditFunnelModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditFunnel}>
              <div className="form-group">
                <label className="form-label">Tasa de Respuesta al Contacto (%):</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  className="form-control"
                  value={funnelForm.contactToResponse}
                  onChange={(e) => setFunnelForm({ ...funnelForm, contactToResponse: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Porcentaje de prospectos que responden positivamente al primer contacto.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Tasa de Aceptación de Demostraciones (%):</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  className="form-control"
                  value={funnelForm.responseToDemo}
                  onChange={(e) => setFunnelForm({ ...funnelForm, responseToDemo: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Porcentaje de los que responden que aceptan ver video o demo presencial.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Tasa de Cierre / Conversión a Clientes (%):</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  className="form-control"
                  value={funnelForm.demoToCustomer}
                  onChange={(e) => setFunnelForm({ ...funnelForm, demoToCustomer: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Porcentaje de demostraciones que concluyen en una venta efectiva.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Unidades Promedio por Cliente:</label>
                <input 
                  type="number" 
                  step="0.05"
                  min="1"
                  max="20"
                  className="form-control"
                  value={funnelForm.unitsPerCustomer}
                  onChange={(e) => setFunnelForm({ ...funnelForm, unitsPerCustomer: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Cantidad de tarjetas/displays comprados en promedio por cada cliente.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditFunnelModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Ratios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR TAREA PLAN 30 DÍAS                                         */}
      {/* ========================================================================= */}
      {isAddPlanModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--primary-600)" />
                <span>Agregar Nueva Tarea al Plan 30 Días</span>
              </h3>
              <button className="close-btn" onClick={() => setIsAddPlanModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAddPlan}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Día (1 - 60):</label>
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    className="form-control"
                    value={planTaskForm.day}
                    onChange={(e) => {
                      const newDay = e.target.value;
                      const num = Number(newDay);
                      const autoW = num > 0 ? Math.min(8, Math.max(1, Math.ceil(num / 7))) : 1;
                      setPlanTaskForm({ 
                        ...planTaskForm, 
                        day: newDay,
                        week: autoW
                      });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Semana (1 - 8):</label>
                  <select 
                    className="form-control"
                    value={planTaskForm.week}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, week: Number(e.target.value) || 1 })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                      <option key={w} value={w}>
                        {weekTitles[w] || `Semana ${w}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Acción Principal:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Visitar 5 cafeterías en Av. Larco con displays de prueba..."
                  value={planTaskForm.action}
                  onChange={(e) => setPlanTaskForm({ ...planTaskForm, action: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meta Medible:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: 3 demos presenciales"
                    value={planTaskForm.target}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, target: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['3 demos', '15 contactos', '5 visitas', '2 ventas', '1 caso real'].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={() => setPlanTaskForm({ ...planTaskForm, target: sug })}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Canal:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: Presencial / WhatsApp"
                    value={planTaskForm.channel}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, channel: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {COMMON_CHANNELS.slice(0, 5).map(chan => (
                      <button
                        key={chan}
                        type="button"
                        style={{ fontSize: '0.7rem', padding: '2px 6px', background: planTaskForm.channel.includes(chan) ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-main)' }}
                        onClick={() => setPlanTaskForm({ ...planTaskForm, channel: chan })}
                      >
                        {chan}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsable:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {COMMON_RESPONSIBLES.map(resp => (
                    <button
                      key={resp}
                      type="button"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: planTaskForm.responsible === resp ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                        background: planTaskForm.responsible === resp ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                        color: planTaskForm.responsible === resp ? 'var(--primary-600)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setPlanTaskForm({ ...planTaskForm, responsible: resp })}
                    >
                      {resp === 'Luis Romero' ? '👨‍💼 Luis Romero' : resp === 'Kevin Servat' ? '🚀 Kevin Servat' : '🤝 Ambos (50/50)'}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="O escribe un responsable personalizado..."
                  value={planTaskForm.responsible}
                  onChange={(e) => setPlanTaskForm({ ...planTaskForm, responsible: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddPlanModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR TAREA PLAN 30 DÍAS                                          */}
      {/* ========================================================================= */}
      {isEditPlanModalOpen && editingPlanTask && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="var(--primary-600)" />
                <span>Editar Tarea del Plan (Día {editingPlanTask.day})</span>
              </h3>
              <button className="close-btn" onClick={() => setIsEditPlanModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditPlan}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Día (1 - 60):</label>
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    className="form-control"
                    value={editingPlanTask.day}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, day: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Semana (1 - 8):</label>
                  <select 
                    className="form-control"
                    value={editingPlanTask.week}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, week: Number(e.target.value) || 1 })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                      <option key={w} value={w}>
                        {weekTitles[w] || `Semana ${w}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Acción Principal:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingPlanTask.action}
                  onChange={(e) => setEditingPlanTask({ ...editingPlanTask, action: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meta Medible:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editingPlanTask.target}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, target: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['3 demos', '15 contactos', '5 visitas', '2 ventas', '1 caso real'].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={() => setEditingPlanTask({ ...editingPlanTask, target: sug })}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Canal:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editingPlanTask.channel || ''}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, channel: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {COMMON_CHANNELS.slice(0, 5).map(chan => (
                      <button
                        key={chan}
                        type="button"
                        style={{ fontSize: '0.7rem', padding: '2px 6px', background: (editingPlanTask.channel || '').includes(chan) ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-main)' }}
                        onClick={() => setEditingPlanTask({ ...editingPlanTask, channel: chan })}
                      >
                        {chan}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsable:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {COMMON_RESPONSIBLES.map(resp => (
                    <button
                      key={resp}
                      type="button"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: editingPlanTask.responsible === resp ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                        background: editingPlanTask.responsible === resp ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                        color: editingPlanTask.responsible === resp ? 'var(--primary-600)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setEditingPlanTask({ ...editingPlanTask, responsible: resp })}
                    >
                      {resp === 'Luis Romero' ? '👨‍💼 Luis Romero' : resp === 'Kevin Servat' ? '🚀 Kevin Servat' : '🤝 Ambos (50/50)'}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingPlanTask.responsible || ''}
                  onChange={(e) => setEditingPlanTask({ ...editingPlanTask, responsible: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado de la Tarea:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${!editingPlanTask.completed ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setEditingPlanTask({ ...editingPlanTask, completed: false })}
                  >
                    ⏳ Pendiente
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${editingPlanTask.completed ? 'btn-success' : 'btn-secondary'}`}
                    style={editingPlanTask.completed ? { background: '#10b981', color: '#fff', borderColor: '#10b981' } : {}}
                    onClick={() => setEditingPlanTask({ ...editingPlanTask, completed: true })}
                  >
                    ✅ Completado
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resultado / Aprendizaje Obtenido:</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={editingPlanTask.result || ''}
                  onChange={(e) => setEditingPlanTask({ ...editingPlanTask, result: e.target.value })}
                  placeholder="Anotar resultados o aprendizajes de la ejecución..."
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditPlanModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PERSONALIZAR NOMBRES DE SEMANAS                                    */}
      {/* ========================================================================= */}
      {isEditWeekTitlesModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--primary-600)" />
                <span>Personalizar Nombres de Semanas y Fases</span>
              </h3>
              <button className="close-btn" onClick={() => setIsEditWeekTitlesModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Define los nombres de cada fase o semana del plan de validación comercial según tu estrategia.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3, 4, 5, 6].map(w => (
                <div key={w} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                    Semana {w}:
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={weekTitles[w] || ''}
                    onChange={(e) => {
                      const updatedTitles = {
                        ...weekTitles,
                        [w]: e.target.value
                      };
                      handleSaveWeekTitles(updatedTitles);
                    }}
                    placeholder={`Nombre para Semana ${w}...`}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-primary" onClick={() => setIsEditWeekTitlesModalOpen(false)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
