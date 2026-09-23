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
  Shuffle
} from 'lucide-react';
import { generateRandomSku } from '../utils/skuUtils';

export default function ProjectionsView({
  projectionsData,
  onUpdateProjectionsData,
  products = [],
  inventory = [],
  plan30Days = [],
  onTogglePlanTask,
  setCurrentTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('goals'); // 'goals', 'products', 'costs', 'funnel', 'plan30'
  const [selectedScenario, setSelectedScenario] = useState('business'); // 'breakeven', 'business', 'partner', 'custom'

  // Modales
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isImportProductModalOpen, setIsImportProductModalOpen] = useState(false);
  const [isNewFixedCostModalOpen, setIsNewFixedCostModalOpen] = useState(false);

  // Formulario para nuevo producto hipotético / proyectado
  const [newProjectedProductForm, setNewProjectedProductForm] = useState({
    name: '',
    sku: generateRandomSku('LNK-PROD'),
    price: 65.00,
    baseCost: 14.00,
    mixPercent: 20,
    isCustom: true
  });

  // Formulario para nuevo gasto fijo
  const [newFixedCostForm, setNewFixedCostForm] = useState({
    concept: '',
    amount: '',
    note: ''
  });

  // Datos desestructurados con valores por defecto seguros
  const businessParams = projectionsData?.businessParams || {
    salesDaysPerMonth: 24,
    partnersCount: 2,
    businessProfitTarget: 4000,
    partnerProfitTarget: 4000,
    customProfitTarget: 4000
  };

  const fixedCosts = projectionsData?.fixedCosts || [];
  const variableUnitCosts = projectionsData?.variableUnitCosts || {
    packagingPerUnit: 2.00,
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

  // --- CÁLCULOS MATEMÁTICOS DE ECONOMÍA UNITARIA Y MEZCLA ---

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
        weightedPrice: 68.00,
        weightedVariableCost: 15.00,
        weightedMargin: 53.00,
        weightedMarginPct: 77.9
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
      weightedMargin: Math.max(1, weightedMargin),
      weightedMarginPct
    };
  }, [productsWithEconomics]);

  // --- CÁLCULO DE ESCENARIOS DE METAS ---

  // Meta de utilidad según el escenario activo
  const targetProfit = useMemo(() => {
    switch (selectedScenario) {
      case 'breakeven':
        return 0;
      case 'business':
        return Number(businessParams.businessProfitTarget) || 4000;
      case 'partner':
        return (Number(businessParams.partnerProfitTarget) || 4000) * (businessParams.partnersCount || 2);
      case 'custom':
      default:
        return Number(businessParams.customProfitTarget) || 4000;
    }
  }, [selectedScenario, businessParams]);

  // Unidades requeridas para cubrir gastos fijos + meta
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
    return Math.ceil(totalFixedCosts / margin);
  }, [totalFixedCosts, weightedAverages.weightedMargin]);

  // Proyecciones mensuales completas del escenario seleccionado
  const simulationResults = useMemo(() => {
    const units = unitsRequired;
    const grossRevenue = units * weightedAverages.weightedPrice;
    const totalVariableCosts = units * weightedAverages.weightedVariableCost;
    const totalMargin = grossRevenue - totalVariableCosts;
    const netProfit = totalMargin - totalFixedCosts;
    const profitPerPartner = (businessParams.partnersCount || 2) > 0 
      ? netProfit / (businessParams.partnersCount || 2) 
      : netProfit;
    
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

  // --- EMBUDO DE CONVERSIÓN COMERCIAL ---
  const funnelResults = useMemo(() => {
    const units = simulationResults.units;
    const unitsPerCust = Number(funnelRatios.unitsPerCustomer) || 1.29;
    const buyersRequired = Math.ceil(units / unitsPerCust);
    const demosRequired = Math.ceil(buyersRequired / (funnelRatios.demoToCustomer || 0.40));
    const responsesRequired = Math.ceil(demosRequired / (funnelRatios.responseToDemo || 0.70));
    const contactsRequired = Math.ceil(responsesRequired / (funnelRatios.contactToResponse || 0.35));

    const salesDays = simulationResults.salesDays;
    const contactsPerDay = salesDays > 0 ? Number((contactsRequired / salesDays).toFixed(1)) : 0;
    const contactsPerPartnerPerDay = salesDays > 0 ? Number((contactsRequired / salesDays / 2).toFixed(1)) : 0;

    return {
      contactsRequired,
      responsesRequired,
      demosRequired,
      buyersRequired,
      units,
      contactsPerDay,
      contactsPerPartnerPerDay
    };
  }, [simulationResults.units, simulationResults.salesDays, funnelRatios]);

  // Total de inversión inicial requerida
  const totalInitialInvestment = useMemo(() => {
    return initialInvestment.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  }, [initialInvestment]);

  // --- ACCIONES DE ESTADO ---

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
      name: newProjectedProductForm.name || 'Nuevo Producto Linkeo',
      sku: newProjectedProductForm.sku || generateRandomSku('LNK-PROD'),
      price: Number(newProjectedProductForm.price) || 60,
      baseCost: Number(newProjectedProductForm.baseCost) || 13,
      mixPercent: Number(newProjectedProductForm.mixPercent) || 20,
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
      price: 65.00,
      baseCost: 14.00,
      mixPercent: 20,
      isCustom: true
    });
  };

  const handleImportProductFromCatalog = (product) => {
    // Si ya está importado, evitar duplicar
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
      mixPercent: 20,
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
      note: newFixedCostForm.note.trim() || 'Gasto fijo mensual'
    };

    onUpdateProjectionsData({
      ...projectionsData,
      fixedCosts: [...fixedCosts, newCost]
    });

    setIsNewFixedCostModalOpen(false);
    setNewFixedCostForm({ concept: '', amount: '', note: '' });
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
              Proyecciones Financieras, Costos & Metas (Simulador Excel)
            </h2>
            <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Modelo Oficial 50/50
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '850px' }}>
            Simula escenarios financieros interactivos en base a gastos fijos, costos variables unitarios y mezcla de productos (tanto del inventario actual como de innovaciones futuras). Calcula el punto de equilibrio y la distribución neta exacta entre Luis Romero y Kevin Servat.
          </p>
        </div>

        {/* Resumen Superior Rápido */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '10px 16px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Punto de Equilibrio
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-orange)' }}>
              {breakevenUnits} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>uds/mes</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-subtle)' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Gastos Fijos Total
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              S/ {totalFixedCosts.toFixed(2)}
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-subtle)' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Margen Ponderado
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
              {weightedAverages.weightedMarginPct.toFixed(1)}%
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
          <span>🎯 Metas & Simulador 50/50</span>
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
          <span>💼 Gastos Fijos & Variables</span>
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
          <span>📅 Plan de Acción 30 Días ({plan30Days.filter(t => t.completed).length}/{plan30Days.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 1: SIMULADOR DE METAS Y DISTRIBUCIÓN 50/50                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'goals' && (
        <div>
          {/* Selector de Escenarios Base */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Selecciona un Escenario de Proyección Financiera:
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {/* Escenario 1: Validación / Break-even */}
              <div 
                onClick={() => setSelectedScenario('breakeven')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: selectedScenario === 'breakeven' ? 'rgba(0, 102, 255, 0.12)' : 'var(--bg-card)',
                  border: selectedScenario === 'breakeven' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESCENARIO 1</span>
                  {selectedScenario === 'breakeven' && <span className="badge badge-blue">Activo</span>}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>
                  Punto de Equilibrio
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Cubrir 100% de los gastos fijos mensuales (Utilidad = S/ 0).
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Meta mensual:</span>
                  <strong style={{ color: 'var(--accent-orange)' }}>{breakevenUnits} unidades</strong>
                </div>
              </div>

              {/* Escenario 2: Meta S/ 4,000 Negocio */}
              <div 
                onClick={() => setSelectedScenario('business')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: selectedScenario === 'business' ? 'rgba(0, 102, 255, 0.12)' : 'var(--bg-card)',
                  border: selectedScenario === 'business' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESCENARIO 2 (EXCEL)</span>
                  {selectedScenario === 'business' && <span className="badge badge-blue">Activo</span>}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>
                  S/ 4,000 para el Negocio
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Ganancia libre para Linkeo tras pagar insumos y gastos fijos.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Meta mensual:</span>
                  <strong style={{ color: '#10b981' }}>75 unidades</strong>
                </div>
              </div>

              {/* Escenario 3: Meta S/ 4,000 por Socio (S/ 8,000) */}
              <div 
                onClick={() => setSelectedScenario('partner')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: selectedScenario === 'partner' ? 'rgba(0, 102, 255, 0.12)' : 'var(--bg-card)',
                  border: selectedScenario === 'partner' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESCENARIO 3 (ESCALA)</span>
                  {selectedScenario === 'partner' && <span className="badge badge-blue">Activo</span>}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>
                  S/ 4,000 para Cada Socio
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  S/ 4K netos para Luis y S/ 4K netos para Kevin (S/ 8,000 total).
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Meta mensual:</span>
                  <strong style={{ color: 'var(--primary-600)' }}>148 unidades</strong>
                </div>
              </div>

              {/* Escenario 4: Personalizado / Sliders */}
              <div 
                onClick={() => setSelectedScenario('custom')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: selectedScenario === 'custom' ? 'rgba(0, 102, 255, 0.12)' : 'var(--bg-card)',
                  border: selectedScenario === 'custom' ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESCENARIO 4</span>
                  {selectedScenario === 'custom' && <span className="badge badge-blue">Activo</span>}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>
                  Simulador Libre
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Ajusta la ganancia meta con controles en tiempo real.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>Ganancia fijada:</span>
                  <strong style={{ color: '#8b5cf6' }}>S/ {businessParams.customProfitTarget?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Controles Interactivos (visible siempre, especialmente interactivo en Custom) */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sliders size={18} color="var(--primary-600)" />
                <span>Parámetros Operativos del Negocio</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Edita los valores para recalcular automáticamente todas las proyecciones
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Meta de Utilidad Neta Deseada */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Meta Neta del Negocio (S/):
                </label>
                <input 
                  type="number" 
                  step="100"
                  className="form-control"
                  value={selectedScenario === 'custom' ? businessParams.customProfitTarget : targetProfit}
                  disabled={selectedScenario !== 'custom'}
                  onChange={(e) => handleUpdateParam('customProfitTarget', e.target.value)}
                  style={{ fontWeight: 700, fontSize: '1.05rem', color: selectedScenario === 'custom' ? 'var(--primary-600)' : 'var(--text-main)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  {selectedScenario === 'custom' ? 'Desliza o escribe cualquier monto' : 'Fijado por el escenario activo'}
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
                  Lunes a sábado aprox. (defecto: 24 días)
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
                  División igualitaria 50/50 (Luis & Kevin)
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
                  ✏️ Ver o editar desglose de fijos
                </button>
              </div>
            </div>
          </div>

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

            {/* Facturación Mensual Estimada */}
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

            {/* Margen Bruto Libre */}
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
                Combina productos actuales del Almacén con nuevos productos futuros que puedan incorporarse a Linkeo para calcular los márgenes reales.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
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

          {/* Tabla de Productos Proyectados */}
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
                            className="form-control"
                            style={{ padding: '3px 8px', fontSize: '0.82rem', width: '60px', textAlign: 'center' }}
                            value={prod.mixPercent}
                            onChange={(e) => handleUpdateProductMix(prod.id, e.target.value)}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>%</span>
                        </div>
                      </td>
                      <td>
                        <strong>{prodUnits}</strong> uds
                      </td>
                      <td>
                        S/ {prodRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button"
                          className="btn-icon"
                          style={{ color: '#ef4444', padding: '4px' }}
                          onClick={() => handleDeleteProjectedProduct(prod.id)}
                          title="Eliminar de la simulación"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Fila Resumen de Promedios Ponderados */}
                <tr style={{ background: 'rgba(0, 102, 255, 0.08)', fontWeight: 800 }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>
                    PROMEDIO PONDERADO SEGÚN MEZCLA:
                  </td>
                  <td>S/ {weightedAverages.weightedPrice.toFixed(2)}</td>
                  <td>S/ {weightedAverages.weightedVariableCost.toFixed(2)}</td>
                  <td style={{ color: '#10b981' }}>S/ {weightedAverages.weightedMargin.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-blue">
                      {weightedAverages.weightedMarginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td>100%</td>
                  <td>{simulationResults.units} uds</td>
                  <td>S/ {simulationResults.grossRevenue.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 3: GASTOS FIJOS Y VARIABLES                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'costs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Bloque 1: Gastos Fijos Mensuales */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="var(--primary-600)" />
                  <span>Gastos Fijos Mensuales</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                  Costos que se pagan todos los meses sin importar cuántas unidades se vendan
                </span>
              </div>

              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsNewFixedCostModalOpen(true)}
              >
                <Plus size={14} />
                <span>Agregar Gasto Fijo</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th style={{ width: '110px' }}>Monto (S/)</th>
                    <th>Nota / Detalle</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {fixedCosts.map(fc => (
                    <tr key={fc.id}>
                      <td>
                        <strong>{fc.concept}</strong>
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="5"
                          min="0"
                          className="form-control"
                          style={{ padding: '4px 8px', fontSize: '0.85rem', fontWeight: 700 }}
                          value={fc.amount}
                          onChange={(e) => handleUpdateFixedCost(fc.id, e.target.value)}
                        />
                      </td>
                      <td style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>
                        {fc.note}
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="btn-icon" 
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteFixedCost(fc.id)}
                          title="Eliminar concepto fijo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(0, 102, 255, 0.06)', fontWeight: 800 }}>
                    <td>TOTAL GASTOS FIJOS:</td>
                    <td style={{ color: 'var(--primary-600)', fontSize: '0.95rem' }}>
                      S/ {totalFixedCosts.toFixed(2)}
                    </td>
                    <td colSpan="2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Requerido cada mes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque 2: Costos Variables Unitarios Adicionales */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#10b981" />
                <span>Costos Variables Unitarios (Por Tarjeta / Display)</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                Costos proporcionales a cada unidad comercializada (del Excel Costos y Metas)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Empaque por unidad */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Empaque por Unidad</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Bolsa Kraft, estuche o caja protectora con sticker</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem' }}>S/</span>
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

              {/* Configuración y prueba */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Mano de Obra / Configuración NDEF</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Tiempo invertido en grabación y pruebas con smartphone</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem' }}>S/</span>
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

              {/* Comisión de cobro */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Comisión de Cobro (% Venta)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>0% si es Yape/Plin, ~4% si es POS tarjeta</div>
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
                  <span style={{ fontSize: '0.85rem' }}>%</span>
                </div>
              </div>

              {/* Delivery asumido */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Delivery Asumido por Linkeo</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>S/ 0 si el cliente recoge o asume el envío</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem' }}>S/</span>
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

              {/* Reserva por fallas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Reserva por Defectos / Garantía</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Fondo para reposición inmediata al cliente</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem' }}>S/</span>
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
                    {(funnelResults.responsesRequired / simulationResults.salesDays).toFixed(1)} por día
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
                    {(funnelResults.demosRequired / simulationResults.salesDays).toFixed(1)} por día
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
                    {(funnelResults.buyersRequired / simulationResults.salesDays).toFixed(1)} clientes/día
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

          {/* Bloque 2: Inversión Inicial Sugerida de Lanzamiento */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="badge badge-yellow" style={{ marginBottom: '6px', display: 'inline-block' }}>
                Hoja Costos & Metas
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#f59e0b" />
                <span>Inversión Inicial Sugerida de Lanzamiento</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                Presupuesto base de equipamiento y puesta en marcha antes de escalar publicidad.
              </p>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Cant.</th>
                    <th>Costo Unit.</th>
                    <th style={{ textAlign: 'right' }}>Total (S/)</th>
                  </tr>
                </thead>
                <tbody>
                  {initialInvestment.map(item => (
                    <tr key={item.id}>
                      <td>{item.concept}</td>
                      <td>{item.quantity}</td>
                      <td>S/ {Number(item.unitCost).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        S/ {Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(245, 158, 11, 0.1)', fontWeight: 800 }}>
                    <td colSpan="3">INVERSIÓN TOTAL REQUERIDA:</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b', fontSize: '1rem' }}>
                      S/ {totalInitialInvestment.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              * Aporte equitativo sugerido: S/ {(totalInitialInvestment / 2).toFixed(2)} por socio.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 5: PLAN DE ACCIÓN 30 DÍAS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'plan30' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '4px', display: 'inline-block' }}>
                Plan Operativo de Validación
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Plan de Acción de 30 Días (4 Semanas de Ejecución)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                Objetivo táctico: Validar demanda comercial, vender las primeras 20 unidades y generar pruebas sociales de reseña.
              </p>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentTab('calendar')}
            >
              <Calendar size={14} />
              <span>Ver en Agenda & Calendario</span>
            </button>
          </div>

          {/* Tabla de tareas del Plan 30 Días */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Estado</th>
                  <th>Día</th>
                  <th>Semana</th>
                  <th>Acción Principal</th>
                  <th>Meta Medible</th>
                  <th>Canal</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {plan30Days.map(task => (
                  <tr key={task.day} style={{ opacity: task.completed ? 0.6 : 1 }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onTogglePlanTask && onTogglePlanTask(task.day)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                        Día {task.day}
                      </span>
                    </td>
                    <td>Semana {task.week}</td>
                    <td style={{ fontWeight: task.completed ? 'normal' : 600, textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.action}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{task.target}</td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                        {task.channel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                      {task.responsible}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    placeholder="Ej: 20"
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
                    step="0.01"
                    className="form-control"
                    placeholder="Ej: 69.00"
                    value={newProjectedProductForm.price}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Base Unitario (S/):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control"
                    placeholder="Ej: 14.00"
                    value={newProjectedProductForm.baseCost}
                    onChange={(e) => setNewProjectedProductForm({ ...newProjectedProductForm, baseCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ℹ️ Al agregar este producto nuevo, podrás simular su impacto en el margen global y la facturación mensual del negocio sin necesidad de haberlo comprado aún.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewProductModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar a Proyecciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORTAR PRODUCTO DEL ALMACÉN O INVENTARIO                         */}
      {/* ========================================================================= */}
      {isImportProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="var(--primary-600)" />
                <span>Importar Producto de Almacén a Proyecciones</span>
              </h3>
              <button className="close-btn" onClick={() => setIsImportProductModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Selecciona cualquier producto del Almacén Oficial o del Inventario para incorporarlo al simulador financiero:
            </p>

            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {products.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No hay productos registrados en el Almacén aún. Puedes registrar uno en el catálogo o usar el botón "+ Proyectar Nuevo Producto".
                </div>
              )}

              {products.map(prod => {
                const isAlreadyAdded = projectedProducts.some(p => p.catalogId === prod.id || p.name === prod.name);
                return (
                  <div 
                    key={prod.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--bg-card-hover)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        SKU: {prod.sku} • Precio: S/ {Number(prod.price).toFixed(2)} • Costo: S/ {Number(prod.cost).toFixed(2)}
                      </div>
                    </div>

                    <button 
                      className={`btn btn-sm ${isAlreadyAdded ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={isAlreadyAdded}
                      onClick={() => handleImportProductFromCatalog(prod)}
                    >
                      {isAlreadyAdded ? 'Ya Incluido' : '+ Importar'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsImportProductModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO GASTO FIJO MENSUAL                                           */}
      {/* ========================================================================= */}
      {isNewFixedCostModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewFixedCostModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nuevo Concepto de Gasto Fijo</h3>
              <button className="close-btn" onClick={() => setIsNewFixedCostModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddFixedCost}>
              <div className="form-group">
                <label className="form-label">Concepto del Gasto Fijo:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Suscripción Canva / Figma, Asesor contable..."
                  value={newFixedCostForm.concept}
                  onChange={(e) => setNewFixedCostForm({ ...newFixedCostForm, concept: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monto Mensual (S/):</label>
                <input 
                  type="number" 
                  step="1"
                  min="0"
                  className="form-control"
                  placeholder="Ej: 50.00"
                  value={newFixedCostForm.amount}
                  onChange={(e) => setNewFixedCostForm({ ...newFixedCostForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nota / Detalle (Opcional):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Mensualidad recurrente"
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
    </div>
  );
}
