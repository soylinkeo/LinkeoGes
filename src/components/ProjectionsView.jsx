import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Layers, 
  Users, 
  Calendar, 
  CheckCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  Target, 
  PieChart, 
  Filter, 
  Sparkles, 
  ArrowUpRight, 
  ArrowRight,
  Boxes,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  Shuffle,
  Edit3,
  Check,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { generateRandomSku } from '../utils/skuUtils';
import { 
  EXCEL_PLAN_30_DAYS_TEMPLATE, 
  EXCEL_FIXED_COSTS_TEMPLATE, 
  EXCEL_PROJECTED_PRODUCTS_TEMPLATE, 
  EXCEL_INITIAL_INVESTMENT_TEMPLATE,
  INITIAL_PROJECTIONS_DATA
} from '../data/initialData';

export default function ProjectionsView({
  projectionsData,
  onUpdateProjectionsData,
  products = [],
  inventory = [],
  plan30Days = [],
  setPlan30Days,
  onTogglePlanTask,
  onAddPlanTask,
  onEditPlanTask,
  onRequestDelete,
  setCurrentTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('goals'); // 'goals', 'products', 'costs', 'funnel', 'plan30'

  // Modales
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isImportProductModalOpen, setIsImportProductModalOpen] = useState(false);
  const [isNewFixedCostModalOpen, setIsNewFixedCostModalOpen] = useState(false);
  const [isNewInvestmentModalOpen, setIsNewInvestmentModalOpen] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);

  // Filtro semanal del Plan 30 Días
  const [planFilterWeek, setPlanFilterWeek] = useState('all');

  // Formulario para nuevo producto hipotético / proyectado
  const [newProjectedProductForm, setNewProjectedProductForm] = useState({
    name: '',
    sku: generateRandomSku('LNK-PROD'),
    price: 60.00,
    baseCost: 13.00,
    mixPercent: 50,
    isCustom: true
  });

  // Formulario para nuevo gasto fijo
  const [newFixedCostForm, setNewFixedCostForm] = useState({
    concept: '',
    amount: '',
    note: ''
  });

  // Formulario para nuevo ítem de inversión inicial
  const [newInvestmentForm, setNewInvestmentForm] = useState({
    concept: '',
    quantity: 1,
    unitCost: ''
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

  const projectedProducts = projectionsData?.projectedProducts || [];
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

  // Costo variable unitario adicional común
  const commonVariablePerUnit = useMemo(() => {
    return (
      (Number(variableUnitCosts.packagingPerUnit) || 0) +
      (Number(variableUnitCosts.setupLaborPerUnit) || 0) +
      (Number(variableUnitCosts.deliveryPerUnit) || 0) +
      (Number(variableUnitCosts.defectReservePerUnit) || 0)
    );
  }, [variableUnitCosts]);

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
      const paymentFee = price * ((Number(variableUnitCosts.paymentFeePercent) || 0) / 100);
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
  }, [activeProducts, commonVariablePerUnit, variableUnitCosts.paymentFeePercent, totalMixPercent]);

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
    const required = (totalFixedCosts + targetProfit) / margin;
    return Math.ceil(required);
  }, [totalFixedCosts, targetProfit, weightedAverages.weightedMargin]);

  // Punto de equilibrio en unidades (solo para cubrir gastos fijos)
  const breakevenUnits = useMemo(() => {
    const margin = weightedAverages.weightedMargin;
    if (margin <= 0) return 0;
    if (totalFixedCosts <= 0) return 0;
    return Math.ceil(totalFixedCosts / margin);
  }, [totalFixedCosts, weightedAverages.weightedMargin]);

  // Resultados de la simulación del Escenario Libre
  const simulationResults = useMemo(() => {
    const units = unitsRequired;
    const grossRevenue = units * weightedAverages.weightedPrice;
    const totalVariableCosts = units * weightedAverages.weightedVariableCost;
    const totalMargin = grossRevenue - totalVariableCosts;
    const netProfit = totalMargin - totalFixedCosts;
    const partners = Number(businessParams.partnersCount) || 2;
    const profitPerPartner = partners > 0 ? netProfit / partners : netProfit;
    
    const salesDays = Number(businessParams.salesDaysPerMonth) || 24;
    const unitsPerDay = salesDays > 0 ? Number((units / salesDays).toFixed(2)) : 0;

    return {
      units,
      grossRevenue,
      totalVariableCosts,
      totalFixedCosts,
      totalMargin,
      netProfit,
      profitPerPartner,
      unitsPerDay,
      salesDays
    };
  }, [unitsRequired, weightedAverages, totalFixedCosts, businessParams]);

  // Embudo de ventas proporcional
  const funnelResults = useMemo(() => {
    const units = simulationResults.units;
    if (units === 0) {
      return {
        contactsRequired: 0,
        responsesRequired: 0,
        demosRequired: 0,
        buyersRequired: 0,
        units: 0,
        contactsPerDay: 0,
        contactsPerPartnerPerDay: 0
      };
    }
    const unitsPerCust = Number(funnelRatios.unitsPerCustomer) || 1.29;
    const buyersRequired = Math.ceil(units / unitsPerCust);
    const demosRequired = Math.ceil(buyersRequired / (funnelRatios.demoToCustomer || 0.40));
    const responsesRequired = Math.ceil(demosRequired / (funnelRatios.responseToDemo || 0.70));
    const contactsRequired = Math.ceil(responsesRequired / (funnelRatios.contactToResponse || 0.35));

    const salesDays = simulationResults.salesDays || 24;
    const contactsPerDay = salesDays > 0 ? Number((contactsRequired / salesDays).toFixed(1)) : 0;
    const partners = Number(businessParams.partnersCount) || 2;
    const contactsPerPartnerPerDay = salesDays > 0 ? Number((contactsRequired / salesDays / partners).toFixed(1)) : 0;

    return {
      contactsRequired,
      responsesRequired,
      demosRequired,
      buyersRequired,
      units,
      contactsPerDay,
      contactsPerPartnerPerDay
    };
  }, [simulationResults.units, simulationResults.salesDays, funnelRatios, businessParams.partnersCount]);

  // Total de inversión inicial
  const totalInitialInvestment = useMemo(() => {
    return initialInvestment.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
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

  // --- ACCIONES Y HANDLERS ---

  const handleUpdateParam = (key, value) => {
    onUpdateProjectionsData({
      ...projectionsData,
      businessParams: {
        ...businessParams,
        [key]: Number(value)
      }
    });
  };

  const handleUpdateVariableCost = (key, value) => {
    onUpdateProjectionsData({
      ...projectionsData,
      variableUnitCosts: {
        ...variableUnitCosts,
        [key]: Number(value)
      }
    });
  };

  const handleToggleProductInclusion = (productId) => {
    const updated = projectedProducts.map(p => {
      if (p.id === productId) {
        return { ...p, included: p.included === false ? true : false };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
  };

  const handleUpdateProductMix = (productId, newMix) => {
    const updated = projectedProducts.map(p => {
      if (p.id === productId) {
        return { ...p, mixPercent: Math.max(0, Number(newMix) || 0) };
      }
      return p;
    });
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
  };

  const handleDeleteProjectedProduct = (productId) => {
    const updated = projectedProducts.filter(p => p.id !== productId);
    onUpdateProjectionsData({ ...projectionsData, projectedProducts: updated });
  };

  const handleCreateNewProjectedProduct = (e) => {
    e.preventDefault();
    const newProd = {
      id: `proj-${Date.now()}`,
      name: newProjectedProductForm.name || 'Nuevo Modelo Linkeo',
      sku: newProjectedProductForm.sku || generateRandomSku('LNK-PROD'),
      price: Number(newProjectedProductForm.price) || 60,
      baseCost: Number(newProjectedProductForm.baseCost) || 13,
      mixPercent: Number(newProjectedProductForm.mixPercent) || 50,
      isCustom: true,
      included: true
    };

    onUpdateProjectionsData({
      ...projectionsData,
      projectedProducts: [...projectedProducts, newProd]
    });

    setIsNewProductModalOpen(false);
    setNewProjectedProductForm({
      name: '',
      sku: generateRandomSku('LNK-PROD'),
      price: 60.00,
      baseCost: 13.00,
      mixPercent: 50,
      isCustom: true
    });
  };

  const handleImportProductFromCatalog = (product) => {
    if (projectedProducts.some(p => p.catalogId === product.id || p.name === product.name)) {
      alert('Este producto ya forma parte del modelado de proyecciones.');
      return;
    }

    const imported = {
      id: `proj-imp-${Date.now()}`,
      catalogId: product.id,
      name: product.name,
      sku: product.sku || generateRandomSku('LNK-PROD'),
      price: Number(product.price) || 60,
      baseCost: Number(product.cost) || 13,
      mixPercent: 50,
      isCustom: false,
      included: true
    };

    onUpdateProjectionsData({
      ...projectionsData,
      projectedProducts: [...projectedProducts, imported]
    });

    setIsImportProductModalOpen(false);
  };

  const handleUpdateFixedCost = (id, newAmount) => {
    const updated = fixedCosts.map(fc => {
      if (fc.id === id) {
        return { ...fc, amount: Number(newAmount) || 0 };
      }
      return fc;
    });
    onUpdateProjectionsData({ ...projectionsData, fixedCosts: updated });
  };

  const handleDeleteFixedCost = (id) => {
    const updated = fixedCosts.filter(fc => fc.id !== id);
    onUpdateProjectionsData({ ...projectionsData, fixedCosts: updated });
  };

  const handleAddFixedCost = (e) => {
    e.preventDefault();
    if (!newFixedCostForm.concept.trim()) return;

    const newCost = {
      id: `fc-${Date.now()}`,
      concept: newFixedCostForm.concept.trim(),
      amount: Number(newFixedCostForm.amount) || 0,
      note: newFixedCostForm.note.trim() || 'Gasto fijo recurrente'
    };

    onUpdateProjectionsData({
      ...projectionsData,
      fixedCosts: [...fixedCosts, newCost]
    });

    setIsNewFixedCostModalOpen(false);
    setNewFixedCostForm({ concept: '', amount: '', note: '' });
  };

  // Inversión Inicial
  const handleAddInvestmentItem = (e) => {
    e.preventDefault();
    if (!newInvestmentForm.concept.trim()) return;

    const qty = Number(newInvestmentForm.quantity) || 1;
    const unit = Number(newInvestmentForm.unitCost) || 0;
    const newItem = {
      id: `inv-${Date.now()}`,
      concept: newInvestmentForm.concept.trim(),
      quantity: qty,
      unitCost: unit,
      total: qty * unit
    };

    onUpdateProjectionsData({
      ...projectionsData,
      initialInvestment: [...initialInvestment, newItem]
    });

    setIsNewInvestmentModalOpen(false);
    setNewInvestmentForm({ concept: '', quantity: 1, unitCost: '' });
  };

  const handleDeleteInvestmentItem = (id) => {
    const updated = initialInvestment.filter(item => item.id !== id);
    onUpdateProjectionsData({ ...projectionsData, initialInvestment: updated });
  };

  // Handlers de Plan 30 Días
  const handleOpenAddPlan = () => {
    const nextDay = plan30Days.length > 0 ? Math.max(...plan30Days.map(t => t.day || 0)) + 1 : 1;
    const computedWeek = Math.min(4, Math.ceil(nextDay / 7)) || 1;
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

    const newTask = {
      day: Number(planTaskForm.day) || 1,
      week: Number(planTaskForm.week) || 1,
      action: planTaskForm.action.trim(),
      target: planTaskForm.target.trim() || 'Ejecución clave',
      channel: planTaskForm.channel,
      responsible: planTaskForm.responsible,
      completed: false,
      result: planTaskForm.result.trim() || ''
    };

    if (onAddPlanTask) {
      onAddPlanTask(newTask);
    } else if (setPlan30Days) {
      setPlan30Days([...plan30Days, newTask]);
    }
    setIsAddPlanModalOpen(false);
  };

  const handleOpenEditPlan = (task) => {
    setEditingPlanTask({ ...task });
    setIsEditPlanModalOpen(true);
  };

  const handleSaveEditPlan = (e) => {
    e.preventDefault();
    if (!editingPlanTask) return;

    if (onEditPlanTask) {
      onEditPlanTask(editingPlanTask);
    } else if (setPlan30Days) {
      setPlan30Days(plan30Days.map(t => t.day === editingPlanTask.day ? editingPlanTask : t));
    }
    setIsEditPlanModalOpen(false);
    setEditingPlanTask(null);
  };

  // Funciones para Limpiar o Cargar Plantillas
  const handleResetToClean = () => {
    if (window.confirm('¿Deseas vaciar todas las proyecciones para dejarlas en escenario libre en blanco (valores en 0)?')) {
      onUpdateProjectionsData({
        businessParams: {
          salesDaysPerMonth: 24,
          partnersCount: 2,
          businessProfitTarget: 0,
          partnerProfitTarget: 0,
          customProfitTarget: 0
        },
        fixedCosts: [],
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
    }
  };

  const handleLoadExcelTemplates = () => {
    if (window.confirm('¿Deseas cargar la plantilla referencial completa del Excel Control de Gastos NFC (productos, fijos e inversión)?')) {
      onUpdateProjectionsData({
        businessParams: {
          salesDaysPerMonth: 24,
          partnersCount: 2,
          businessProfitTarget: 4000,
          partnerProfitTarget: 4000,
          customProfitTarget: 4000
        },
        fixedCosts: EXCEL_FIXED_COSTS_TEMPLATE,
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
    }
  };

  const handleLoadPlanTemplate = () => {
    if (window.confirm('¿Deseas cargar las 27 tareas estratégicas del Plan de 30 Días del Excel?')) {
      if (setPlan30Days) {
        setPlan30Days(EXCEL_PLAN_30_DAYS_TEMPLATE);
      }
    }
  };

  return (
    <div className="projections-view" style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
              Escenario Libre & Editable
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '850px' }}>
            Modela escenarios en tiempo real definiendo tu meta neta deseada, agregando tus productos y gastos fijos para calcular el punto de equilibrio y la distribución neta 50/50 entre Luis Romero y Kevin Servat.
          </p>
        </div>

        {/* Acciones de Cabecera y Resumen Rápido */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

      {/* Navegación por Sub-Pestañas */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          className={`btn btn-sm ${activeSubTab === 'goals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('goals')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <Target size={15} />
          <span>🎯 Metas & Simulador Libre</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <ShoppingBag size={15} />
          <span>🛍️ Mix de Productos ({projectedProducts.length})</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'costs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('costs')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <DollarSign size={15} />
          <span>💼 Gastos Fijos & Variables ({fixedCosts.length})</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'funnel' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('funnel')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
        >
          <Filter size={15} />
          <span>🚀 Embudo de Ventas & Inversión</span>
        </button>

        <button
          className={`btn btn-sm ${activeSubTab === 'plan30' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('plan30')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
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
                  <span>Parámetros Operativos del Escenario Libre</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Define tus números meta en tiempo real. Todas las proyecciones y asignaciones 50/50 se recalculan instantáneamente.
                </p>
              </div>
              <span className="badge badge-blue">100% Interactivo</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Meta de Utilidad Neta Deseada */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Meta Neta del Negocio (S/):
                </label>
                <input 
                  type="number" 
                  step="50"
                  min="0"
                  className="form-control"
                  placeholder="Ej: 4000"
                  value={businessParams.customProfitTarget}
                  onChange={(e) => handleUpdateParam('customProfitTarget', e.target.value)}
                  style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-600)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Escribe cualquier ganancia neta deseada (o 0 para solo cubrir fijos)
                </span>
              </div>

              {/* Días de venta al mes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Días de Venta al Mes:
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="31"
                  className="form-control"
                  value={businessParams.salesDaysPerMonth}
                  onChange={(e) => handleUpdateParam('salesDaysPerMonth', e.target.value)}
                  style={{ fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Días laborales activos (defecto: 24 días)
                </span>
              </div>

              {/* Número de Socios (Linkeo 50/50) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Número de Socios:
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  className="form-control"
                  value={businessParams.partnersCount}
                  onChange={(e) => handleUpdateParam('partnersCount', e.target.value)}
                  style={{ fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  División igualitaria 50/50 (Luis Romero & Kevin Servat)
                </span>
              </div>

              {/* Gastos Fijos Totales */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Gastos Fijos Mensuales:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: '38px', padding: '0 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 800 }}>
                  S/ {totalFixedCosts.toFixed(2)}
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveSubTab('costs')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginTop: '4px', textAlign: 'left' }}
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
                Para calcular las unidades mensuales requeridas y las proyecciones exactas de facturación, agrega los productos que planeas comercializar o impórtalos directamente de tu Almacén.
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
                <span>Unidades Requeridas</span>
                <Package size={16} color="var(--primary-600)" />
              </div>
              <div className="kpi-value" style={{ color: 'var(--primary-600)', fontSize: '1.8rem' }}>
                {simulationResults.units}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                  unidades
                </span>
              </div>
              <div className="kpi-subtext">
                Ritmo diario necesario: <strong>{simulationResults.unitsPerDay} uds/día</strong>
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
                Ticket promedio ponderado: S/ {weightedAverages.weightedPrice.toFixed(2)}
              </div>
            </div>

            {/* Margen Bruto Total */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Margen Bruto Total</span>
                <TrendingUp size={16} color="#8b5cf6" />
              </div>
              <div className="kpi-value" style={{ color: '#8b5cf6', fontSize: '1.8rem' }}>
                S/ {simulationResults.totalMargin.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-subtext">
                Margen promedio: <strong>{weightedAverages.weightedMarginPct.toFixed(1)}%</strong>
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
                Tras pagar insumos y gastos fijos
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
                  <span>Distribución Neta Proyectada por Socio</span>
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Utilidad por Socio Estimada:</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>
                  S/ {simulationResults.profitPerPartner.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 2: MIX DE PRODUCTOS (INVENTARIO ACTUAL + NUEVOS PRODUCTOS)    */}
      {/* ========================================================================= */}
      {activeSubTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Economía por Producto y Mezcla de Ventas (Sales Mix)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Modela tus productos para proyectar márgenes y unidades mensuales. Puedes agregar productos futuros o importar los existentes de tu catálogo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {projectedProducts.length === 0 && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    onUpdateProjectionsData({
                      ...projectionsData,
                      projectedProducts: EXCEL_PROJECTED_PRODUCTS_TEMPLATE
                    });
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Cargar Plantilla Excel</span>
                </button>
              )}

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

          {/* Tabla o Estado Vacío de Productos Proyectados */}
          {projectedProducts.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <ShoppingBag size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0' }}>
                No hay productos en el modelo de proyección
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto 20px auto' }}>
                Agrega manualmente cualquier modelo o importa insumos de tu inventario para definir los precios, costos y porcentaje de ventas.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button className="btn btn-primary" onClick={() => setIsNewProductModalOpen(true)}>
                  <Plus size={16} />
                  <span>+ Agregar Primer Producto</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setIsImportProductModalOpen(true)}>
                  <Boxes size={16} />
                  <span>Importar del Almacén</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive" style={{ marginBottom: '24px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Activo</th>
                    <th>SKU</th>
                    <th>Producto / Insumo</th>
                    <th>Precio Venta</th>
                    <th>Costo Variable Tot.</th>
                    <th>Margen S/</th>
                    <th>Margen %</th>
                    <th style={{ width: '130px' }}>Mix Ventas (%)</th>
                    <th>Unidades Meta</th>
                    <th>Venta Estimada</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productsWithEconomics.map(prod => {
                    const prodUnits = Math.round(simulationResults.units * prod.normalizedMix);
                    const prodRevenue = prodUnits * prod.price;

                    return (
                      <tr key={prod.id} style={{ opacity: prod.included === false ? 0.45 : 1 }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={prod.included !== false}
                            onChange={() => handleToggleProductInclusion(prod.id)}
                            title="Incluir / Excluir de la proyección"
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <span className="code-mono" style={{ fontSize: '0.78rem' }}>{prod.sku}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{prod.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                            {prod.isCustom ? '✨ Producto Proyectado Nuevo' : '📦 Producto del Catálogo'}
                          </div>
                        </td>
                        <td>
                          <strong>S/ {prod.price.toFixed(2)}</strong>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)' }}>S/ {prod.totalUnitVariableCost.toFixed(2)}</span>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                            (Base: {prod.baseCost} + Emp: {variableUnitCosts.packagingPerUnit})
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: prod.unitMargin > 0 ? '#10b981' : '#ef4444' }}>
                            S/ {prod.unitMargin.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                            {prod.marginPct.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={prod.mixPercent}
                              onChange={(e) => handleUpdateProductMix(prod.id, e.target.value)}
                              className="form-control"
                              style={{ width: '70px', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>%</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                            {prodUnits} uds
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          S/ {prodRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-icon"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteProjectedProduct(prod.id)}
                            title="Eliminar de la proyección"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 3: GASTOS FIJOS Y VARIABLES UNITARIOS                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'costs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
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
                  <span>+ Agregar Gasto Fijo</span>
                </button>
              </div>
            </div>

            {fixedCosts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay gastos fijos registrados. Haz clic en <strong>+ Agregar Gasto Fijo</strong> para modelar el punto de equilibrio.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th style={{ width: '110px' }}>Monto (S/)</th>
                      <th>Nota / Detalle</th>
                      <th style={{ width: '40px', textAlign: 'center' }}></th>
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
                          <button 
                            className="btn-icon" 
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteFixedCost(fc.id)}
                            title="Eliminar gasto fijo"
                          >
                            <Trash2 size={13} />
                          </button>
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

          {/* Columna 2: Costos Variables Unitarios Adicionales */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="#10b981" />
                <span>Costos Variables Unitarios (Por Tarjeta / Display)</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                Costos proporcionales a cada unidad comercializada (empaques, delivery, reservas).
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Empaque */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Empaque por Unidad</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Bolsa Kraft, estuche o caja protectora con sticker</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>S/</span>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-control"
                    style={{ width: '80px', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}
                    value={variableUnitCosts.packagingPerUnit}
                    onChange={(e) => handleUpdateVariableCost('packagingPerUnit', e.target.value)}
                  />
                </div>
              </div>

              {/* Mano de Obra / Configuración */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Mano de Obra / Configuración NDEF</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tiempo invertido en grabación y pruebas con smartphone</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>S/</span>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-control"
                    style={{ width: '80px', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}
                    value={variableUnitCosts.setupLaborPerUnit}
                    onChange={(e) => handleUpdateVariableCost('setupLaborPerUnit', e.target.value)}
                  />
                </div>
              </div>

              {/* Comisión de Cobro */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Comisión de Cobro (% Venta)</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>0% si es Yape/Plin, ~4% si es POS tarjeta</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    className="form-control"
                    style={{ width: '80px', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}
                    value={variableUnitCosts.paymentFeePercent}
                    onChange={(e) => handleUpdateVariableCost('paymentFeePercent', e.target.value)}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>%</span>
                </div>
              </div>

              {/* Delivery Asumido */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Delivery Asumido por Linkeo</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>S/ 0 si el cliente recoge o asume el envío</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>S/</span>
                  <input 
                    type="number"
                    step="1"
                    min="0"
                    className="form-control"
                    style={{ width: '80px', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}
                    value={variableUnitCosts.deliveryPerUnit}
                    onChange={(e) => handleUpdateVariableCost('deliveryPerUnit', e.target.value)}
                  />
                </div>
              </div>

              {/* Reserva por Defectos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Reserva por Defectos / Garantía</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Fondo para reposición inmediata al cliente</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>S/</span>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-control"
                    style={{ width: '80px', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}
                    value={variableUnitCosts.defectReservePerUnit}
                    onChange={(e) => handleUpdateVariableCost('defectReservePerUnit', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 4: EMBUDO COMERCIAL & INVERSIÓN INICIAL                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'funnel' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Bloque 1: Embudo Comercial para Alcanzar la Meta */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="badge badge-purple" style={{ marginBottom: '6px', display: 'inline-block' }}>
                Pipeline de Conversión Requerido
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} color="#8b5cf6" />
                <span>Embudo de Ventas (Para {simulationResults.units} Unidades)</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                Cantidad de contactos y cierres necesarios para cumplir el objetivo del mes en {simulationResults.salesDays} días hábiles.
              </p>
            </div>

            {/* Embudo Visual */}
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
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>1. Prospectos a Contactar</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>DM Instagram, WhatsApp y visitas en terreno</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6' }}>
                    {funnelResults.contactsRequired}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    ~{funnelResults.contactsPerDay} por día
                  </div>
                </div>
              </div>

              {/* Etapa 2: Respuestas */}
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
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>2. Respuestas Obtenidas (~35%)</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Interesados que contestan en menos de 10 min</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#8b5cf6' }}>
                    {funnelResults.responsesRequired}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {(funnelResults.responsesRequired / (simulationResults.salesDays || 24)).toFixed(1)} por día
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
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>3. Demostraciones Presentadas (~70%)</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Video explicativo o muestra presencial</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>
                    {funnelResults.demosRequired}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {(funnelResults.demosRequired / (simulationResults.salesDays || 24)).toFixed(1)} por día
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
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>4. Negocios Compradores / Clientes (~40%)</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cierres efectivos con linkeo activo</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>
                    {funnelResults.buyersRequired}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {(funnelResults.buyersRequired / (simulationResults.salesDays || 24)).toFixed(1)} clientes/día
                  </div>
                </div>
              </div>
            </div>

            {/* Asignación Diaria por Socio */}
            <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <strong>🎯 Cuota Diaria Recomendada por Co-CEO:</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: 'var(--text-muted)' }}>
                <span>• Luis Romero: <strong>{funnelResults.contactsPerPartnerPerDay} contactos/día</strong></span>
                <span>• Kevin Servat: <strong>{funnelResults.contactsPerPartnerPerDay} contactos/día</strong></span>
              </div>
            </div>
          </div>

          {/* Bloque 2: Inversión Inicial Editable */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-yellow" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  Inversión de Puesta en Marcha
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color="#f59e0b" />
                  <span>Inversión Inicial Requerida</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Presupuesto base de equipamiento y puesta en marcha antes de escalar.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {initialInvestment.length === 0 && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onUpdateProjectionsData({
                        ...projectionsData,
                        initialInvestment: EXCEL_INITIAL_INVESTMENT_TEMPLATE
                      });
                    }}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Cargar del Excel</span>
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewInvestmentModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>+ Agregar Ítem</span>
                </button>
              </div>
            </div>

            {initialInvestment.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay ítems de inversión registrados. Agrega tus compras iniciales (muestras, dominios, insumos) para calcular el aporte 50/50.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Cant.</th>
                      <th>Costo Unit.</th>
                      <th style={{ textAlign: 'right' }}>Total (S/)</th>
                      <th style={{ width: '36px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialInvestment.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.concept}</td>
                        <td>{item.quantity}</td>
                        <td>S/ {Number(item.unitCost).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          S/ {Number(item.total).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn-icon" 
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteInvestmentItem(item.id)}
                            title="Eliminar ítem"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(245, 158, 11, 0.1)', fontWeight: 800 }}>
                      <td colSpan="3">INVERSIÓN TOTAL REQUERIDA:</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '1rem' }}>
                        S/ {totalInitialInvestment.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              * Aporte equitativo sugerido: <strong>S/ {(totalInitialInvestment / (businessParams.partnersCount || 2)).toFixed(2)}</strong> por socio (50/50).
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 5: PLAN DE ACCIÓN 30 DÍAS (FULL CRUD INTEGRADO)               */}
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
                <option value="1">Semana 1: Oferta & Muestras</option>
                <option value="2">Semana 2: Prospección Activa</option>
                <option value="3">Semana 3: Demostraciones & Cierres</option>
                <option value="4">Semana 4: Escala & Referidos</option>
              </select>

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
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>OK</th>
                    <th>Día</th>
                    <th>Semana</th>
                    <th>Acción Principal</th>
                    <th>Meta Medible</th>
                    <th>Canal</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Resultado / Aprendizaje</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlanTasks.map(task => (
                    <tr 
                      key={task.day}
                      style={{
                        opacity: task.completed ? 0.75 : 1,
                        backgroundColor: task.completed ? 'rgba(16, 185, 129, 0.03)' : 'transparent'
                      }}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => onTogglePlanTask && onTogglePlanTask(task.day)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
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
                      <td>
                        <span className={`badge ${task.completed ? 'badge-green' : 'badge-yellow'}`}>
                          {task.completed ? 'Completado' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {task.result || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button 
                            className="btn-icon" 
                            style={{ width: '26px', height: '26px' }}
                            onClick={() => handleOpenEditPlan(task)}
                            title="Editar tarea del plan"
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROYECTAR NUEVO PRODUCTO HIPOTÉTICO / FUTURO                       */}
      {/* ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary-600)" />
                <span>Proyectar Nuevo Producto al Modelo</span>
              </h3>
              <button className="close-btn" onClick={() => setIsNewProductModalOpen(false)}>✕</button>
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
                  <label className="form-label">Participación en Mezcla (% Mix):</label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    className="form-control"
                    placeholder="Ej: 50"
                    value={newProjectedProductForm.mixPercent}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, mixPercent: e.target.value })}
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewProductModalOpen(false)}>
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
      {/* MODAL: IMPORTAR PRODUCTO DEL ALMACÉN / CATÁLOGO                           */}
      {/* ========================================================================= */}
      {isImportProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="var(--primary-600)" />
                <span>Importar Producto o Insumo del Almacén</span>
              </h3>
              <button className="close-btn" onClick={() => setIsImportProductModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Selecciona un producto existente de tu Catálogo para incorporarlo al modelo financiero interactivo:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {products.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tienes productos registrados aún en el Catálogo.
                  <div style={{ marginTop: '10px' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setIsImportProductModalOpen(false);
                        setCurrentTab('products');
                      }}
                    >
                      Ir a Catálogo de Productos
                    </button>
                  </div>
                </div>
              ) : (
                products.map(prod => (
                  <div 
                    key={prod.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                        <span className="code-mono">{prod.sku}</span>
                        <span>Precio: <strong>S/ {Number(prod.price).toFixed(2)}</strong></span>
                        <span>Costo: S/ {Number(prod.cost || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleImportProductFromCatalog(prod)}
                    >
                      Importar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR GASTO FIJO MENSUAL                                         */}
      {/* ========================================================================= */}
      {isNewFixedCostModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewFixedCostModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Gasto Fijo Mensual</h3>
              <button className="close-btn" onClick={() => setIsNewFixedCostModalOpen(false)}>✕</button>
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewFixedCostModalOpen(false)}>
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
      {/* MODAL: AGREGAR ÍTEM DE INVERSIÓN INICIAL                                  */}
      {/* ========================================================================= */}
      {isNewInvestmentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewInvestmentModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Ítem a Inversión Inicial</h3>
              <button className="close-btn" onClick={() => setIsNewInvestmentModalOpen(false)}>✕</button>
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewInvestmentModalOpen(false)}>
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
      {/* MODAL: AGREGAR TAREA PLAN 30 DÍAS                                         */}
      {/* ========================================================================= */}
      {isAddPlanModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPlanModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nueva Tarea al Plan 30 Días</h3>
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
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, day: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Semana (1 - 4):</label>
                  <select 
                    className="form-control"
                    value={planTaskForm.week}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, week: e.target.value })}
                  >
                    <option value="1">Semana 1: Oferta & Muestras</option>
                    <option value="2">Semana 2: Prospección Activa</option>
                    <option value="3">Semana 3: Demostraciones & Cierres</option>
                    <option value="4">Semana 4: Escala & Referidos</option>
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
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsable:</label>
                <select 
                  className="form-control"
                  value={planTaskForm.responsible}
                  onChange={(e) => setPlanTaskForm({ ...planTaskForm, responsible: e.target.value })}
                >
                  <option value="Luis Romero">Luis Romero (Co-CEO)</option>
                  <option value="Kevin Servat">Kevin Servat (Co-CEO)</option>
                  <option value="Luis Romero / Kevin Servat">Luis Romero / Kevin Servat</option>
                </select>
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
        <div className="modal-overlay" onClick={() => setIsEditPlanModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Tarea del Plan 30 Días</h3>
              <button className="close-btn" onClick={() => setIsEditPlanModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditPlan}>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Canal:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editingPlanTask.channel || ''}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, channel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsable:</label>
                <select 
                  className="form-control"
                  value={editingPlanTask.responsible}
                  onChange={(e) => setEditingPlanTask({ ...editingPlanTask, responsible: e.target.value })}
                >
                  <option value="Luis Romero">Luis Romero (Co-CEO)</option>
                  <option value="Kevin Servat">Kevin Servat (Co-CEO)</option>
                  <option value="Luis Romero / Kevin Servat">Luis Romero / Kevin Servat</option>
                </select>
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
    </div>
  );
}
