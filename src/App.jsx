import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import confetti from 'canvas-confetti';
import { PARTNERS, INITIAL_PRODUCTS, INITIAL_EXPENSES, INITIAL_SALES, INITIAL_NFC_CARDS, INITIAL_LEADS, INITIAL_INVENTORY, INITIAL_SUPPLIERS, INITIAL_PLAN_30_DAYS, INITIAL_CALENDAR_EVENTS, FINANCIAL_TARGETS, INITIAL_AUDIT_LOGS, INITIAL_DISTRICTS, INITIAL_PROJECT_PHASES, INITIAL_PROJECTIONS_DATA } from './data/initialData';

import { getAccountingMonth, ACCOUNTING_MONTHS } from './utils/dateUtils';
import { computeDynamicTargets } from './utils/projectionsUtils';
import { Edit3 } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
const NfcTraceabilityView = lazy(() => import('./components/NfcTraceabilityView'));
const KanbanView = lazy(() => import('./components/KanbanView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const InventoryView = lazy(() => import('./components/InventoryView'));
const FinanceView = lazy(() => import('./components/FinanceView'));

const ProjectionsView = lazy(() => import('./components/ProjectionsView'));
const AuditView = lazy(() => import('./components/AuditView'));
import DeleteConfirmModal from './components/DeleteConfirmModal';
import LoginModal from './components/LoginModal';
import UserProfileModal from './components/UserProfileModal';
import MasterDataModal from './components/MasterDataModal';
import DistrictCombobox from './components/DistrictCombobox.jsx';
const ProjectLifecycleView = lazy(() => import('./components/ProjectLifecycleView'));
import ToastNotification from './components/ToastNotification';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { getAuthenticatedPartner } from './services/authService';
import { useCloudData } from './hooks/useCloudData';
import { calculateFinance, isSettlement, isInventoryPurchase } from './utils/financeUtils.js';
import { getStockMovements, applyStockMovements, createSale } from './utils/operations.js';
import { localDate } from './utils/dateUtils';
import { parseDynamicCardRoute, areLeadAndCardLinked } from './utils/dynamicRouter.js';
import NfcRedirectScreen from './components/NfcRedirectScreen.jsx';
import SyncStatus from './components/SyncStatus';
import MobileBottomNav from './components/MobileBottomNav';
export default function App() {
  // Tema (Dark por defecto para look tech profesional)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('linkeoges_theme') || 'dark';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dynamicCardRoute, setDynamicCardRoute] = useState(() => parseDynamicCardRoute());

  useEffect(() => {
    const handleUrlChange = () => {
      setDynamicCardRoute(parseDynamicCardRoute());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const cloud = useCloudData(currentUser);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const user = await getAuthenticatedPartner();
      if (active) {
        setCurrentUser(user);
        setAuthLoading(false);
      }
    };
    refresh();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      setTimeout(refresh, 0);
    });
    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  // Modales de sesión y maestros
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);

  // Sistema de Notificaciones Toast Flotantes & Ergonómicas
  const [toasts, setToasts] = useState([]);
  const pushToast = (message, type = 'success', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };
  const showToast = (message, type = 'success', duration = 3500) => {
    if (type === 'error' || type === 'warning') pushToast(message, type, duration);
    else cloud.engine.afterSaved(() => pushToast(message, type, duration));
  };
  const dismissToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Vista activa
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('linkeoges_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const districts = cloud.data.districts;
  const setDistricts = value => cloud.set('districts', value);
  const projectPhases = cloud.data.projectPhases;
  const setProjectPhases = value => cloud.set('projectPhases', value);
  const sales = cloud.data.sales;
  const setSales = value => cloud.set('sales', value);
  const expenses = cloud.data.expenses;
  const setExpenses = value => cloud.set('expenses', value);
  const nfcCards = cloud.data.nfcCards;
  const setNfcCards = value => cloud.set('nfcCards', value);
  const leads = cloud.data.leads;
  const setLeads = value => cloud.set('leads', value);
  const inventory = cloud.data.inventory;
  const setInventory = value => cloud.set('inventory', value);
  const suppliers = cloud.data.suppliers;
  const setSuppliers = value => cloud.set('suppliers', value);
  const plan30Days = cloud.data.plan30Days;
  const setPlan30Days = value => cloud.set('plan30Days', value);
  const calendarEvents = cloud.data.calendarEvents;
  const setCalendarEvents = value => cloud.set('calendarEvents', value);
  const rawProducts = cloud.data.products;
  const setProducts = value => cloud.set('products', value);

  // Catálogo comercial consolidado: unifica nube, productos oficiales y stock físico de inventario
  const products = useMemo(() => {
    const list = Array.isArray(rawProducts) ? [...rawProducts].filter(p => p && p.name && p.name.trim()) : [];
    const seenSkus = new Set(list.map(p => p.sku).filter(Boolean));
    const seenNames = new Set(list.map(p => p.name?.trim().toLowerCase()).filter(Boolean));
    const seenInvIds = new Set(list.map(p => p.inventoryId).filter(Boolean));

    // 1. Garantizar que todos los productos oficiales base de Linkeo siempre estén en el catálogo
    if (Array.isArray(INITIAL_PRODUCTS)) {
      INITIAL_PRODUCTS.forEach(ip => {
        const norm = ip.name?.trim().toLowerCase();
        if (!seenNames.has(norm) && (!ip.sku || !seenSkus.has(ip.sku))) {
          list.push({ ...ip });
          if (ip.sku) seenSkus.add(ip.sku);
          if (ip.name) seenNames.add(norm);
          if (ip.inventoryId) seenInvIds.add(ip.inventoryId);
        }
      });
    }

    // 2. Traer e incorporar automáticamente todo el inventario físico al Catálogo comercial
    inventory.forEach(item => {
      const normName = item.name?.trim().toLowerCase();
      const existing = list.find(p => 
        (item.sku && p.sku === item.sku) || 
        (item.id && p.inventoryId === item.id) ||
        (normName && p.name?.trim().toLowerCase() === normName)
      );

      if (!existing) {
        const cost = Number(item.unitCost) || 13.00;
        let price = 60.00;
        if (item.sku === 'SKU-LNK-9972' || normName.includes('formato l') || normName.includes(' l esp')) {
          price = 80.00;
        } else if (item.sku === 'SKU-LNK-1367' || item.sku === 'SKU-LNK-6781') {
          price = 60.00;
        } else if (cost > 0) {
          price = Number((cost * 2.5).toFixed(2));
        }

        const margin = Math.max(0, price - cost);
        const marginPct = price > 0 ? Number(((margin / price) * 100).toFixed(1)) : 0;

        list.push({
          id: `prod-inv-${item.id}`,
          inventoryId: item.id,
          name: item.name,
          sku: item.sku || `SKU-${item.id}`,
          category: item.category?.toUpperCase().includes('CHIP') ? 'Individual' : (item.category || 'Individual'),
          type: 'individual',
          price: Number(price.toFixed(2)),
          cost: Number(cost.toFixed(2)),
          margin: Number(margin.toFixed(2)),
          marginPct,
          stock: Number(item.quantity) || 0,
          badge: item.sku === 'SKU-LNK-9972' ? 'Premium' : 'Popular',
          description: item.notes || `Producto oficial configurado con chip NFC para Google Reviews.`,
          bundleItems: []
        });

        if (item.sku) seenSkus.add(item.sku);
        if (item.id) seenInvIds.add(item.id);
        if (normName) seenNames.add(normName);
      } else {
        existing.stock = Number(item.quantity) || 0;
        if (!existing.inventoryId) existing.inventoryId = item.id;
        if (item.unitCost && (!existing.cost || existing.cost === 13)) {
          existing.cost = Number(item.unitCost);
          existing.margin = Math.max(0, Number((existing.price - existing.cost).toFixed(2)));
          existing.marginPct = existing.price > 0 ? Number(((existing.margin / existing.price) * 100).toFixed(1)) : 0;
        }
      }
    });

    // 3. Garantizar cálculo de stock en tiempo real para todos los productos y packs
    list.forEach(p => {
      if (p.bundleItems && Array.isArray(p.bundleItems) && p.bundleItems.length > 0) {
        let minPack = Infinity;
        p.bundleItems.forEach(b => {
          const invItem = inventory.find(i => 
            i.id === b.id || i.sku === b.sku || 
            (i.name && b.name && i.name.toLowerCase() === b.name.toLowerCase())
          );
          const invQty = invItem ? Number(invItem.quantity) || 0 : 0;
          const reqQty = Number(b.quantity) || 1;
          const packs = Math.floor(invQty / reqQty);
          if (packs < minPack) minPack = packs;
        });
        p.stock = minPack === Infinity ? 0 : Math.max(0, minPack);
      } else {
        const invItem = inventory.find(i => 
          (p.inventoryId && i.id === p.inventoryId) || 
          (p.sku && i.sku && i.sku.toLowerCase() === p.sku.toLowerCase()) ||
          (p.name && i.name && i.name.toLowerCase().trim() === p.name.toLowerCase().trim())
        );
        if (invItem) {
          p.stock = Math.max(0, Number(invItem.quantity) || 0);
        } else if (p.stock === undefined) {
          p.stock = 0;
        }
      }
    });

    return list;
  }, [rawProducts, inventory]);

  // Sembrar catálogo en la nube automáticamente cuando la sesión esté lista si aún no existían filas
  useEffect(() => {
    if (cloud.status === 'ready' && rawProducts.length === 0 && products.length > 0) {
      cloud.set('products', products);
    }
  }, [cloud.status, rawProducts.length, products]);

  const auditLogs = cloud.data.auditLogs;
  const setAuditLogs = value => cloud.set('auditLogs', value);
  const projectionsData = cloud.data.projectionsData;
  const setProjectionsData = value => cloud.set('projectionsData', value);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    item: null,
    entityType: ''
  });
  const partnersState = cloud.data.partnersState;
  const setPartnersState = value => cloud.set('partnersState', value);

  // Modales globales
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [selectedCardModal, setSelectedCardModal] = useState(null);

  // Formulario de Nueva Venta Global
  const [newSaleForm, setNewSaleForm] = useState({
    clientName: '',
    contactPerson: '',
    phone: '',
    district: districts[0] || 'Miraflores',
    productId: '',
    quantity: 1,
    paymentMethod: 'Yape',
    soldBy: currentUser?.id || 'luis',
    googlePlaceId: '',
    customUnitPrice: '',
    customUnitCost: '',
    isCustomPricing: false
  });

  // Formulario de Nuevo Gasto Global (con selección de Almacén y costo modificable)
  const initialExpenseDate = localDate();
  const [globalExpenseForm, setGlobalExpenseForm] = useState({
    date: initialExpenseDate,
    type: 'Gasto',
    category: 'Compra de mercadería',
    selectedProductId: '',
    description: '',
    quantity: 1,
    unitCost: '',
    isCustomCost: false,
    amount: '',
    paymentMethod: 'Tarjeta',
    paidBy: currentUser?.id || 'luis',
    month: getAccountingMonth(initialExpenseDate),
    notes: ''
  });
  const handleGlobalProductChange = productId => {
    if (!productId) {
      setGlobalExpenseForm(prev => ({
        ...prev,
        selectedProductId: '',
        unitCost: '',
        isCustomCost: false
      }));
      return;
    }
    const prod = products.find(p => p.id === productId) || inventory.find(i => i.id === productId);
    if (prod) {
      const defaultCost = Number(prod.cost ?? prod.unitCost ?? 0);
      const qty = Number(globalExpenseForm.quantity) || 1;
      const total = (defaultCost * qty).toFixed(2);
      setGlobalExpenseForm(prev => ({
        ...prev,
        selectedProductId: productId,
        description: prod.name,
        category: 'Compra de mercadería',
        unitCost: defaultCost.toString(),
        isCustomCost: false,
        amount: total
      }));
    }
  };
  const isSyncing = cloud.status === 'saving' || cloud.status === 'loading';
  const loadCloudData = () => cloud.engine.refresh();

  // Inactividad: 10 minutos (600,000 ms) sin eventos -> Estado 'Ausente'
  useEffect(() => {
    if (!currentUser) return;
    let timeoutId;
    const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutos

    const handleUserActivity = () => {
      if (timeoutId) clearTimeout(timeoutId);

      // Si estaba ausente, restaurar a disponible automáticamente
      setPartnersState(prev => {
        if (prev[currentUser.id]?.status === 'Ausente') {
          return {
            ...prev,
            [currentUser.id]: {
              ...prev[currentUser.id],
              status: currentUser.id === 'luis' ? 'Disponible' : 'Guardia'
            }
          };
        }
        return prev;
      });
      timeoutId = setTimeout(() => {
        // Poner en estado Ausente
        setPartnersState(prev => ({
          ...prev,
          [currentUser.id]: {
            ...prev[currentUser.id],
            status: 'Ausente'
          }
        }));
      }, INACTIVITY_LIMIT_MS);
    };
    const trackedEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    trackedEvents.forEach(evt => window.addEventListener(evt, handleUserActivity));
    handleUserActivity();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      trackedEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [currentUser]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('linkeoges_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('linkeoges_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Función universal para registrar auditoría
  const logAudit = ({
    actionType = 'Eliminación',
    entityType,
    entityId,
    entityName,
    reason,
    diff,
    snapshot,
    author,
    authorName,
    deletedBy,
    deletedByName
  }) => {
    const activeAuthorId = author || deletedBy || (currentUser ? currentUser.id : 'luis');
    const activeAuthorName = authorName || deletedByName || (currentUser ? currentUser.name : activeAuthorId === 'kevin' ? 'Kevin Servat' : 'Luis Romero');
    const newLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType,
      entityType,
      entityId: entityId || '',
      entityName: entityName || 'Elemento',
      author: activeAuthorId,
      authorName: activeAuthorName,
      deletedBy: activeAuthorId,
      deletedByName: activeAuthorName,
      reason: reason || 'Movimiento operativo registrado en LinkeoGes',
      diff: diff || '',
      snapshot: snapshot || null,
      restorable: ['Creación', 'Eliminación', 'Modificación'].includes(actionType) &&
        ['Venta','Gasto','Tarjeta NFC','Producto','Proveedor','Lead','Insumo','Evento','Plan 30 Días','Inversión Inicial','Gasto Fijo','Mix Producto'].includes(entityType) &&
        (actionType === 'Creación' || Boolean(snapshot)),
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      status: 'pending' // Reciente (pendiente de dar OK)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };
  const partnerBalance = calculateFinance(sales, expenses);

  // Metas financieras dinámicas calculadas reactivamente desde el escenario de Proyecciones
  const dynamicTargets = useMemo(() => {
    return computeDynamicTargets(projectionsData, FINANCIAL_TARGETS);
  }, [projectionsData]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const handleLoginSuccess = user => setCurrentUser(user);
  const handleLogout = async () => {
    if (cloud.status === 'saving' || cloud.engine.request) {
      showToast('Espera la confirmación del guardado o descarga tu borrador antes de salir.', 'warning');
      return;
    }
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  };

  // Reajuste de datos a cero (Modo Limpio) y Cargar Demo sincronizado con Supabase
  const handleResetToZero = async () => {
    const confirmReset = window.confirm('⚠️ ¿Deseas reiniciar todas las operaciones activas a 0 (CERO)?\n\n' + 'Esto dejará ventas (0), gastos (0), prospectos (0), chips activos (0), inventario (0), ' + 'catálogo (0) y proveedores (0) en la nube y en todos tus navegadores y celulares.');
    if (!confirmReset) return;
    setSales([]);
    setExpenses([]);
    setNfcCards([]);
    setLeads([]);
    setCalendarEvents([]);
    setInventory(prev => prev.map(item => ({
      ...item,
      quantity: 0
    })));
    setProducts([]);
    setSuppliers([]);
    logAudit({
      actionType: 'Eliminación',
      entityType: 'Sistema ERP',
      entityId: 'SYS-RESET-0',
      entityName: 'Reinicio a Cero (Base Limpia)',
      reason: 'Los socios reiniciaron los datos operativos a 0 para carga paso a paso.'
    });
    showToast('✓ Datos operativos reiniciados a 0 en la nube y en todos tus dispositivos.', 'success');
  };
  const handleLoadDemoData = async () => {
    if (sales.length || expenses.length || products.length || inventory.length || suppliers.length) {
      showToast('La plantilla solo se puede cargar en una base vacía para no sobrescribir operaciones.', 'warning'); return;
    }
    if (!window.confirm('¿Cargar la plantilla de ejemplo en esta base vacía?')) return;
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setNfcCards(INITIAL_NFC_CARDS);
    setLeads(INITIAL_LEADS);
    setInventory(INITIAL_INVENTORY);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setPlan30Days(INITIAL_PLAN_30_DAYS);
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setProjectionsData(INITIAL_PROJECTIONS_DATA);
    logAudit({
      actionType: 'Creación',
      entityType: 'Sistema ERP',
      entityId: 'SYS-DEMO-DATA',
      entityName: 'Carga de Datos de Demostración',
      reason: 'Restablecimiento de datos de demostración y pruebas.'
    });
    showToast('✓ Datos de demostración cargados exitosamente.', 'success');
  };

  // Helper para abrir modal de Nueva Venta con el primer producto activo preseleccionado
  const handleOpenNewSaleModal = () => {
    const catalogList = products.length > 0 ? products : INITIAL_PRODUCTS;
    const inStockProd = catalogList.find(p => Number(p.stock) > 0) || catalogList[0];
    const initialId = inStockProd?.id || '';
    setNewSaleForm(prev => {
      const activeProd = catalogList.find(p => p.id === prev.productId) || inStockProd;
      const activeStock = activeProd ? Math.max(0, Number(activeProd.stock ?? 0)) : 0;
      const clampedQty = activeStock > 0 ? Math.min(Number(prev.quantity) || 1, activeStock) : 1;
      return {
        ...prev,
        productId: activeProd?.id || initialId,
        quantity: clampedQty,
        isCustomPricing: false,
        customUnitPrice: '',
        customUnitCost: ''
      };
    });
    setIsNewSaleModalOpen(true);
  };

  // Helper para cerrar y limpiar modal de Nueva Venta
  const handleCloseNewSaleModal = () => {
    const catalogList = products.length > 0 ? products : INITIAL_PRODUCTS;
    const firstProd = catalogList.find(p => Number(p.stock) > 0) || catalogList[0];
    setNewSaleForm({
      clientName: '',
      contactPerson: '',
      phone: '',
      district: districts[0] || 'Miraflores',
      productId: firstProd?.id || '',
      quantity: 1,
      paymentMethod: 'Yape',
      soldBy: currentUser?.id || 'luis',
      googlePlaceId: '',
      customUnitPrice: '',
      customUnitCost: '',
      isCustomPricing: false
    });
    setIsNewSaleModalOpen(false);
  };

  // Helper para cerrar y limpiar modal de Nuevo Gasto
  const handleCloseNewExpenseModal = () => {
    const today = localDate();
    setGlobalExpenseForm({
      date: today,
      type: 'Gasto',
      category: 'Compra de mercadería',
      selectedProductId: '',
      description: '',
      quantity: 1,
      unitCost: '',
      isCustomCost: false,
      amount: '',
      paymentMethod: 'Tarjeta',
      paidBy: currentUser?.id || 'luis',
      month: getAccountingMonth(today),
      notes: ''
    });
    setIsNewExpenseModalOpen(false);
  };

  // Handlers para Crear Venta
  const handleAddNewSale = e => {
    e.preventDefault();
    try {
      const catalogList = products.length > 0 ? products : INITIAL_PRODUCTS;
      const selectedId = newSaleForm.productId || (catalogList[0]?.id || '');
      const product = catalogList.find(p => p.id === selectedId) || catalogList[0];
      if (!product) throw new Error('Selecciona un producto del catálogo.');

      const qty = parseInt(newSaleForm.quantity, 10);
      if (isNaN(qty) || qty <= 0) throw new Error('Ingresa una cantidad válida mayor a cero.');
      const maxStock = Number(product.stock ?? 0);
      if (maxStock <= 0) {
        throw new Error(`El producto "${product.name}" no tiene existencias disponibles en almacén.`);
      }
      if (qty > maxStock) {
        throw new Error(`Stock insuficiente: solo queda ${maxStock} unidad${maxStock === 1 ? '' : 'es'} en stock de "${product.name}". No se puede vender ${qty}.`);
      }

      const result = createSale({ form: { ...newSaleForm, productId: product.id, quantity: qty }, product, inventory, userId: currentUser.id });
      setInventory(result.inventory);

      // Al registrar una venta, va directamente a "Entregado y Cobrado" (etapa 5) sin pasar por flujos anteriores
      const clientNorm = (result.sale.clientName || '').trim().toLowerCase();
      const existingLeadIndex = leads.findIndex(l => (l.businessName || '').trim().toLowerCase() === clientNorm);
      let targetLeadId;

      if (existingLeadIndex !== -1) {
        targetLeadId = leads[existingLeadIndex].id;
        setLeads(prev => prev.map((l, idx) => idx === existingLeadIndex ? {
          ...l,
          stage: 'entregado',
          contacted: true,
          estimatedValue: Number(result.sale.totalAmount) || l.estimatedValue,
          notes: `${l.notes ? l.notes + ' | ' : ''}Venta confirmada: S/ ${Number(result.sale.totalAmount).toFixed(2)}`
        } : l));
      } else {
        targetLeadId = `lead-sale-${result.sale.id || Date.now()}`;
        const directSaleLead = {
          id: targetLeadId,
          businessName: result.sale.clientName,
          rubro: 'Tienda / Retail',
          district: result.sale.district || districts[0] || 'Miraflores',
          address: '',
          contactName: result.sale.contactPerson || result.sale.clientName,
          phone: result.sale.phone || '',
          stage: 'entregado',
          contacted: true,
          interestedProduct: product.name,
          estimatedValue: Number(result.sale.totalAmount) || Number(product.price) || 0,
          assignedTo: result.sale.soldBy || currentUser?.id || 'luis',
          notes: `Venta directa registrada (#${result.sale.id || 'VTA'}). Entregado y cobrado.`,
          nextStepNote: 'Post-venta y fidelización',
          nextStepDate: localDate()
        };
        setLeads(prev => [directSaleLead, ...prev]);
      }

      const saleWithLead = { ...result.sale, leadId: targetLeadId };
      setSales(prev => [saleWithLead, ...prev]);
      setNfcCards(prev => [...result.cards.map(c => ({ ...c, leadId: targetLeadId })), ...prev]);

      logAudit({ actionType: 'Creación', entityType: 'Venta', entityId: result.sale.id, entityName: result.sale.clientName, reason: 'Venta y stock registrados conjuntamente. Prospecto directo a Entregado y Cobrado.' });
      cloud.engine.afterSaved(() => { handleCloseNewSaleModal(); pushToast('Venta confirmada en la nube'); });
    } catch (error) { showToast(error.message, 'error'); }
  };

  const handleAddNewExpense = newExp => {
    if (!(Number(newExp.amount) > 0)) { showToast('El monto debe ser mayor que cero.', 'error'); return false; }
    let stockMovements = [];
    if (newExp.selectedProductId && newExp.addToInventory !== false) {
      const product = products.find(p => p.id === newExp.selectedProductId);
      const item = inventory.find(i => i.id === newExp.selectedProductId || i.id === product?.inventoryId || (product?.sku && i.sku === product.sku));
      if (!item) { showToast('Vincula el producto a un insumo antes de registrar la compra.', 'error'); return false; }
      const quantity = Number(newExp.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) { showToast('Cantidad de compra inválida.', 'error'); return false; }
      stockMovements = [{ inventoryId: item.id, quantity }];
      setInventory(applyStockMovements(inventory, stockMovements, 1));
    }
    const expenseWithMonth = {
      ...newExp,
      stockMovements,
      month: newExp.month || getAccountingMonth(newExp.date || localDate())
    };
    setExpenses([expenseWithMonth, ...expenses]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Gasto',
      entityId: expenseWithMonth.id,
      entityName: `${expenseWithMonth.description} - S/ ${Number(expenseWithMonth.amount).toFixed(2)}`,
      reason: `Gasto pagado por ${expenseWithMonth.paidBy === 'luis' ? 'Luis Romero' : 'Kevin Servat'} vía ${expenseWithMonth.paymentMethod} (Mes: ${expenseWithMonth.month}).`
    });
  };
  const handleEditExpense = updatedExp => {
    if (!(Number(updatedExp.amount) > 0)) { showToast('El monto debe ser mayor que cero.', 'error'); return false; }
    const original = expenses.find(e => e.id === updatedExp.id);
    if (original?.stockMovements?.length) {
      const quantity = Number(updatedExp.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || updatedExp.selectedProductId !== original.selectedProductId) {
        showToast('Conserva el insumo de esta compra e ingresa una cantidad válida.', 'error'); return false;
      }
      const movements = original.stockMovements.map(m => ({ ...m, quantity }));
      try {
        const deltas = movements.map(m => ({ ...m, quantity: m.quantity - original.stockMovements.find(o => o.inventoryId === m.inventoryId).quantity }));
        setInventory(applyStockMovements(inventory, deltas, 1));
      } catch (error) { showToast(error.message, 'error'); return false; }
      updatedExp = { ...updatedExp, stockMovements: movements };
    }
    const expenseWithMonth = {
      ...updatedExp,
      month: updatedExp.month || getAccountingMonth(updatedExp.date || localDate())
    };
    const oldExp = expenses.find(e => e.id === updatedExp.id);
    setExpenses(prev => prev.map(e => e.id === updatedExp.id ? expenseWithMonth : e));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Gasto',
      entityId: updatedExp.id,
      entityName: `${expenseWithMonth.description} - S/ ${Number(expenseWithMonth.amount).toFixed(2)}`,
      reason: `Modificación de gasto pagado por ${expenseWithMonth.paidBy === 'luis' ? 'Luis Romero' : 'Kevin Servat'} (Mes: ${expenseWithMonth.month}).`,
      snapshot: oldExp,
      diff: `Antes: S/ ${Number(oldExp?.amount || 0).toFixed(2)} (${oldExp?.description || '—'}) -> Ahora: S/ ${Number(expenseWithMonth.amount).toFixed(2)} (${expenseWithMonth.description})`
    });
  };

  // Handlers para Tarjetas NFC
  const handleAddNewCard = newCard => {
    try {
      if (newCard.chipUid && nfcCards.some(c => c.chipUid === newCard.chipUid)) throw new Error('Este UID ya está registrado.');
      let movements = [];
      if (newCard.discountStock) {
        const product = products.find(p => p.id === newCard.productId || p.name === newCard.model) || inventory.find(i => i.name === newCard.model);
        if (!product) throw new Error('Selecciona un producto vinculado al almacén.');
        movements = getStockMovements(product, 1, inventory);
        setInventory(applyStockMovements(inventory, movements, -1));
      }

      // Sincronización con Kanban: detectar si existe un prospecto con el mismo negocio o leadId
      const matchingLead = (leads || []).find(l => areLeadAndCardLinked(l, newCard));
      const cardToInsert = {
        ...newCard,
        leadId: newCard.leadId || matchingLead?.id || null,
        district: newCard.district || matchingLead?.district || 'Miraflores',
        stockMovements: movements
      };

      setNfcCards(prev => [{ ...cardToInsert, stockMovements: movements }, ...prev]);

      // Si el prospecto en Kanban difiere en distrito, sincronizarlo bidireccionalmente
      if (matchingLead && cardToInsert.district && matchingLead.district !== cardToInsert.district) {
        setLeads(prevLeads => (prevLeads || []).map(l => l.id === matchingLead.id ? { ...l, district: cardToInsert.district } : l));
      }

      logAudit({ actionType: 'Creación', entityType: 'Tarjeta NFC', entityId: cardToInsert.id, entityName: cardToInsert.businessName, reason: 'Alta de tarjeta.' });
      return true;
    } catch (error) { showToast(error.message, 'error'); return false; }
  };

  const handleUpdateCard = updatedCard => {
    const oldCard = nfcCards.find(c => c.id === updatedCard.id);
    setNfcCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));

    // Sincronización bidireccional de localidad/distrito con Kanban:
    // Si la tarjeta NFC cambia de distrito o se edita en soporte técnico, actualizar el prospecto en Kanban
    if (updatedCard.district) {
      setLeads(prevLeads => (prevLeads || []).map(l => {
        const isMatch = areLeadAndCardLinked(l, updatedCard);
        if (isMatch && l.district !== updatedCard.district) {
          return { ...l, district: updatedCard.district };
        }
        return l;
      }));
    }

    logAudit({
      actionType: 'Modificación',
      entityType: 'Tarjeta NFC',
      entityId: updatedCard.id,
      entityName: updatedCard.businessName,
      reason: `Modificación de enlace Place ID / datos de contacto (Distrito: ${updatedCard.district}).`,
      snapshot: oldCard,
      diff: `Antes: Place ID ${oldCard?.placeId || '—'}, Distrito: ${oldCard?.district || '—'} -> Ahora: ${updatedCard.placeId}, Distrito: ${updatedCard.district}`
    });
  };

  const handleRecordCardBip = (cardId, src = 'nfc') => {
    const isNfc = src === 'nfc';
    const timestamp = new Date().toISOString();

    setNfcCards(prev => {
      const cardExists = prev.some(c => c.id === cardId);
      if (!cardExists) return prev;
      return prev.map(c => {
        if (c.id === cardId) {
          const currentTotal = Number(c.readCount || (Number(c.bipsNfc || 0) + Number(c.bipsQr || 0)) || 0);
          return {
            ...c,
            readCount: currentTotal + 1,
            bipsNfc: Number(c.bipsNfc || 0) + (isNfc ? 1 : 0),
            bipsQr: Number(c.bipsQr || 0) + (!isNfc ? 1 : 0),
            lastReadAt: timestamp
          };
        }
        return c;
      });
    });

    // Persistencia inmediata en localStorage
    try {
      const localKey = 'linkeo_nfc_cards';
      const localCards = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = localCards.map(c => {
        if (c.id === cardId) {
          const currentTotal = Number(c.readCount || (Number(c.bipsNfc || 0) + Number(c.bipsQr || 0)) || 0);
          return {
            ...c,
            readCount: currentTotal + 1,
            bipsNfc: Number(c.bipsNfc || 0) + (isNfc ? 1 : 0),
            bipsQr: Number(c.bipsQr || 0) + (!isNfc ? 1 : 0),
            lastReadAt: timestamp
          };
        }
        return c;
      });
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
    } catch (e) {}

    // Persistencia en Supabase
    if (supabase) {
      supabase.from('nfc_cards').select('read_count, bips_nfc, bips_qr').eq('id', cardId).maybeSingle()
        .then(({ data }) => {
          if (data) {
            supabase.from('nfc_cards').update({
              read_count: Number(data.read_count || 0) + 1,
              bips_nfc: Number(data.bips_nfc || 0) + (isNfc ? 1 : 0),
              bips_qr: Number(data.bips_qr || 0) + (!isNfc ? 1 : 0),
              last_read_at: timestamp
            }).eq('id', cardId).then(() => {});
          }
        }).catch(() => {});
    }
  };

  // Handlers para Leads / Pipeline
  const handleAddNewLead = newLead => {
    setLeads(prev => [newLead, ...(Array.isArray(prev) ? prev : leads)]);

    // Si ya existe una tarjeta registrada para este negocio, sincronizar distrito y asociar leadId
    if (newLead.district && newLead.businessName) {
      setNfcCards(prevCards => (prevCards || []).map(c => {
        if (areLeadAndCardLinked(newLead, c)) {
          return {
            ...c,
            leadId: c.leadId || newLead.id,
            district: c.district || newLead.district
          };
        }
        return c;
      }));
    }

    logAudit({
      actionType: 'Creación',
      entityType: 'Lead',
      entityId: newLead.id,
      entityName: newLead.businessName,
      reason: `Nuevo prospecto asignado a ${newLead.assignedTo === 'luis' ? 'Luis Romero' : 'Kevin Servat'}.`
    });
  };

  const handleConvertLeadToSale = lead => {
    try {
      const existingSale = sales.find(s => 
        (s.leadId && s.leadId === lead.id) || 
        (s.clientName && lead.businessName && s.clientName.trim().toLowerCase() === lead.businessName.trim().toLowerCase())
      );
      if (existingSale) {
        showToast(`El prospecto "${lead.businessName}" ya tiene una venta registrada (${existingSale.saleNumber || existingSale.id}).`, 'info');
        return true;
      }
      let product = products.find(p => p.id === lead.interestedProduct || p.name === lead.interestedProduct);
      if (!product) {
        product = products.find(p => Number(p.stock ?? 0) > 0) || products[0];
      }
      if (!product) throw new Error('No hay productos disponibles en el catálogo.');
      if (Number(product.stock ?? 0) < 1) {
        throw new Error(`Stock insuficiente: "${product.name}" no tiene existencias disponibles en almacén.`);
      }
      const form = { 
        clientName: lead.businessName, 
        contactPerson: lead.contactName, 
        phone: lead.phone, 
        email: lead.email || '',
        district: lead.district || 'Miraflores', 
        quantity: 1, 
        soldBy: lead.assignedTo === 'both' ? currentUser?.id || 'luis' : (lead.assignedTo || 'luis'),
        paymentMethod: 'Transferencia', 
        googlePlaceId: lead.placeId || '' 
      };
      const result = createSale({ form, product, inventory, userId: currentUser?.id || 'luis' });
      setInventory(result.inventory);
      setLeads(prev => prev.map(l => l.id === lead.id ? { 
        ...l, 
        stage: 'entregado', 
        contacted: true, 
        interestedProduct: product.name, 
        estimatedValue: Number(product.price) || l.estimatedValue 
      } : l));
      setSales(prev => [{ ...result.sale, leadId: lead.id }, ...prev]);
      setNfcCards(prev => [...result.cards.map(c => ({ ...c, leadId: lead.id })), ...prev]);
      logAudit({ 
        actionType: 'Creación', 
        entityType: 'Venta', 
        entityId: result.sale.id, 
        entityName: lead.businessName, 
        reason: 'Venta generada automáticamente al pasar prospecto a Entregado y Cobrado.' 
      });
      return true;
    } catch (error) { 
      showToast(error.message, 'error'); 
      return false; 
    }
  };

  const handleUpdateLeadStage = (leadId, newStage) => {
    const oldLead = leads.find(l => l.id === leadId);
    if (!oldLead) return;

    if (newStage === 'entregado') {
      const existingSale = sales.find(s => 
        (s.leadId && s.leadId === leadId) || 
        (s.clientName && oldLead.businessName && s.clientName.trim().toLowerCase() === oldLead.businessName.trim().toLowerCase())
      );
      if (!existingSale) {
        const success = handleConvertLeadToSale(oldLead);
        if (success) {
          showToast(`🎉 ¡Venta generada automáticamente! "${oldLead.businessName}" pasó a Entregado y Cobrado`, 'success');
          return;
        }
      }
    }

    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      stage: newStage
    } : l));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Lead',
      entityId: leadId,
      entityName: oldLead?.businessName || leadId,
      reason: `Cambio de fase en embudo comercial.`,
      snapshot: oldLead,
      diff: `Antes: ${oldLead?.stage} -> Ahora: ${newStage}`
    });
  };

  const handleUpdateLead = updatedLead => {
    const oldLead = leads.find(l => l.id === updatedLead.id);

    if (updatedLead.stage === 'entregado' && oldLead?.stage !== 'entregado') {
      const existingSale = sales.find(s => 
        (s.leadId && s.leadId === updatedLead.id) || 
        (s.clientName && updatedLead.businessName && s.clientName.trim().toLowerCase() === updatedLead.businessName.trim().toLowerCase())
      );
      if (!existingSale) {
        const success = handleConvertLeadToSale(updatedLead);
        if (success) {
          showToast(`🎉 ¡Venta generada automáticamente! "${updatedLead.businessName}" pasó a Entregado y Cobrado`, 'success');
          return;
        }
      }
    }

    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));

    // Sincronización bidireccional con Trazabilidad NFC:
    // Si el prospecto en Kanban actualiza su localidad/distrito, reflejarlo inmediatamente en la tarjeta NFC correspondiente
    if (updatedLead.district) {
      setNfcCards(prevCards => (prevCards || []).map(c => {
        const isMatch = areLeadAndCardLinked(updatedLead, c);
        if (isMatch && c.district !== updatedLead.district) {
          return {
            ...c,
            district: updatedLead.district,
            history: [
              ...(c.history || []),
              {
                date: new Date().toLocaleString('es-PE'),
                author: 'Sincronización Kanban',
                action: `Distrito sincronizado desde Kanban: "${updatedLead.district}".`
              }
            ]
          };
        }
        return c;
      }));
    }

    logAudit({
      actionType: 'Modificación',
      entityType: 'Lead',
      entityId: updatedLead.id,
      entityName: updatedLead.businessName,
      reason: `Actualización de datos del prospecto (${updatedLead.businessName}).`,
      snapshot: oldLead,
      diff: `Antes: ${oldLead?.businessName || ''} (${oldLead?.stage || ''}, ${oldLead?.district || ''}) -> Ahora: ${updatedLead.businessName} (${updatedLead.stage}, ${updatedLead.district})`
    });
  };

  const handleAddNewEvent = newEvent => {
    setCalendarEvents([newEvent, ...calendarEvents]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Evento',
      entityId: newEvent.id,
      entityName: newEvent.title,
      reason: `Cita programada para el ${newEvent.date} a las ${newEvent.startTime} (${newEvent.partner}).`
    });
  };
  const handleEditEvent = updatedEvent => {
    setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Evento',
      entityId: updatedEvent.id,
      entityName: updatedEvent.title,
      reason: `Actualización de fecha, hora o asignación de cita.`
    });
  };

  // Handlers para Plan 30 Días (Full CRUD)
  const handleTogglePlanTask = day => {
    const task = plan30Days.find(t => t.day === day);
    const newStatus = !task?.completed;
    setPlan30Days(prev => prev.map(t => t.day === day ? {
      ...t,
      completed: newStatus
    } : t));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Plan 30 Días',
      entityId: `dia-${day}`,
      entityName: `Día ${day}: ${task?.action}`,
      reason: `Hito marcado como ${newStatus ? 'Completado' : 'Pendiente'}.`
    });
  };
  const handleAddPlanTask = newTask => {
    setPlan30Days([...plan30Days, newTask]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Plan 30 Días',
      entityId: `dia-${newTask.day}`,
      entityName: `Día ${newTask.day}: ${newTask.action}`,
      reason: `Nueva tarea agregada a la Semana ${newTask.week} del Plan.`
    });
  };
  const handleEditPlanTask = updatedTask => {
    setPlan30Days(prev => prev.map(t => {
      const match = updatedTask._originalDay !== undefined 
        ? t.day === updatedTask._originalDay 
        : t.day === updatedTask.day;
      if (match) {
        const { _originalDay, ...cleanTask } = updatedTask;
        return cleanTask;
      }
      return t;
    }));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Plan 30 Días',
      entityId: `dia-${updatedTask.day}`,
      entityName: `Día ${updatedTask.day}: ${updatedTask.action}`,
      reason: `Modificación de parámetros o contenido de tarea del plan.`
    });
  };

  // Handlers para Fases del Proyecto ERP
  const handleToggleDeliverable = (phaseId, delId) => {
    setProjectPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        const updatedDels = phase.deliverables.map(d => d.id === delId ? {
          ...d,
          completed: !d.completed
        } : d);
        const compCount = updatedDels.filter(d => d.completed).length;
        const newPct = Math.round(compCount / updatedDels.length * 100);
        return {
          ...phase,
          deliverables: updatedDels,
          progress: newPct,
          status: newPct === 100 ? 'completado' : 'en_proceso'
        };
      }
      return phase;
    }));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Entregable',
      entityId: delId,
      entityName: `Hito de Fase: ${phaseId}`,
      reason: 'Cambio de estado en entregable de fase ERP.'
    });
  };

  const handleSyncActualProgress = () => {
    setProjectPhases(INITIAL_PROJECT_PHASES);
    logAudit({
      actionType: 'Modificación',
      entityType: 'Entregable',
      entityId: 'sync-all-phases',
      entityName: 'Gestión de Proyecto (5 Fases)',
      reason: 'Sincronización masiva de hitos con el avance real auditado del proyecto (74%).'
    });
    if (showToast) {
      showToast('✓ Avance del proyecto sincronizado al 74% (17 hitos completados)', 'success', 2500);
    }
  };
  const handleAddDeliverable = (phaseId, newDel) => {
    setProjectPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        const updated = [...(phase.deliverables || []), newDel];
        const compCount = updated.filter(d => d.completed).length;
        return {
          ...phase,
          deliverables: updated,
          progress: Math.round(compCount / updated.length * 100)
        };
      }
      return phase;
    }));
    logAudit({
      actionType: 'Creación',
      entityType: 'Entregable',
      entityId: newDel.id,
      entityName: newDel.title,
      reason: `Nuevo hito agregado a la fase ${phaseId}.`
    });
  };
  const handleEditDeliverable = (phaseId, updatedDel) => {
    setProjectPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          deliverables: phase.deliverables.map(d => d.id === updatedDel.id ? updatedDel : d)
        };
      }
      return phase;
    }));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Entregable',
      entityId: updatedDel.id,
      entityName: updatedDel.title,
      reason: `Edición de entregable en fase ${phaseId}.`
    });
  };

  // Handlers para Distritos (Maestro Central)
  const handleAddDistrict = async newDist => {
    const trimmed = typeof newDist === 'string' ? newDist.trim() : '';
    if (!trimmed) return;
    if (districts.some(d => d.toLowerCase() === trimmed.toLowerCase())) return;
    setDistricts(prev => [...prev, trimmed]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Distrito',
      entityId: trimmed,
      entityName: `Distrito: ${trimmed}`,
      reason: `Nuevo distrito agregado al maestro de Lima y sincronizado en base de datos.`
    });
  };
  const handleDeleteDistrict = async distToDelete => {
    setDistricts(prev => prev.filter(d => d !== distToDelete));
    logAudit({
      actionType: 'Eliminación',
      entityType: 'Distrito',
      entityId: distToDelete,
      entityName: `Distrito: ${distToDelete}`,
      reason: `Distrito retirado del maestro central y base de datos.`
    });
  };

  // Handlers para Inventario y Productos
  const handleUpdateInventoryStock = (itemId, delta) => {
    const product = cloud.engine.view.data.products.find(p => p.id === itemId);
    const rows = cloud.engine.view.data.inventory;
    const item = rows.find(i => i.id === itemId || i.id === product?.inventoryId || (product?.sku && i.sku === product.sku));
    if (!item || !Number.isInteger(delta) || item.quantity + delta < 0) {
      showToast('No se pudo ajustar el stock: revisa el vínculo al almacén y la cantidad.', 'error'); return false;
    }
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Number(i.quantity) + delta } : i));
    logAudit({ actionType: 'Modificación', entityType: 'Insumo', entityId: item.id, entityName: item.name, snapshot: item, reason: 'Ajuste de stock: ' + delta });
    return true;
  };

  const handleAddNewInventoryItem = newItem => {
    setInventory([...inventory, newItem]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Insumo',
      entityId: newItem.id,
      entityName: newItem.name,
      reason: `Nuevo SKU agregado al almacén con stock inicial de ${newItem.quantity} uds.`
    });
  };
  const handleAddNewProduct = newProd => {
    const existing = inventory.find(i => i.id === newProd.inventoryId || i.sku === newProd.sku);
    const inventoryId = existing?.id || crypto.randomUUID();
    if (!existing && !newProd.bundleItems?.length) setInventory(prev => [...prev, {
      id: inventoryId, sku: newProd.sku, name: newProd.name, category: newProd.category,
      quantity: Number(newProd.stock ?? 0), minThreshold: 5, unitCost: Number(newProd.cost), leadTimeDays: 7
    }]);
    setProducts(prev => {
      const baseList = (prev && prev.length > 0) ? prev : products;
      return [...baseList, { ...newProd, inventoryId: newProd.bundleItems?.length ? undefined : inventoryId }];
    });
    logAudit({
      actionType: 'Creación',
      entityType: 'Producto',
      entityId: newProd.id,
      entityName: newProd.name,
      reason: `Nuevo modelo o pack agregado al catálogo por S/ ${Number(newProd.price).toFixed(2)}.`
    });
  };
  const handleEditProduct = updatedProd => {
    setProducts(prev => {
      const baseList = (prev && prev.length > 0) ? prev : products;
      return baseList.map(p => p.id === updatedProd.id ? updatedProd : p);
    });
    logAudit({
      actionType: 'Modificación',
      entityType: 'Producto',
      entityId: updatedProd.id,
      entityName: updatedProd.name,
      reason: `Producto o pack actualizado. Precio: S/ ${Number(updatedProd.price).toFixed(2)}.`
    });
  };

  // Handlers para Proveedores (Full CRUD & Auditoría)
  const handleAddNewSupplier = newSup => {
    setSuppliers([newSup, ...suppliers]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Proveedor',
      entityId: newSup.id,
      entityName: newSup.name,
      reason: `Nuevo proveedor registrado para suministrar: ${newSup.itemSupplied || 'Insumos varios'}.`
    });
  };
  const handleEditSupplier = updatedSup => {
    setSuppliers(prev => prev.map(s => s.id === updatedSup.id ? updatedSup : s));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Proveedor',
      entityId: updatedSup.id,
      entityName: updatedSup.name,
      reason: `Actualización de logística, contacto o costos del proveedor.`
    });
  };

  // Eliminación Universal & Eliminación Relacional en Cascada
  const handleRequestDelete = (item, entityType) => {
    setDeleteModalConfig({
      isOpen: true,
      item,
      entityType
    });
  };
  const handleConfirmDelete = ({
    item,
    entityType,
    reason,
    deletedBy, deletedByName
  }) => {
    let cascadeDetails = '';
    if (entityType === 'Venta') {
      if (!item.stockMovements) { showToast('Esta venta antigua no tiene movimientos de stock registrados. Ajusta su inventario manualmente después de eliminarla.', 'warning'); }
      else {
        try { setInventory(applyStockMovements(inventory, item.stockMovements, 1)); }
        catch (error) { showToast(error.message, 'error'); return false; }
      }
      setSales(prev => prev.filter(row => row.id !== item.id));
      setNfcCards(prev => prev.filter(c => c.saleId !== item.id && !item.cardIds?.includes(c.id)));
      item = { ...item, relatedCards: nfcCards.filter(c => c.saleId === item.id || item.cardIds?.includes(c.id)) };
      cascadeDetails = ' Venta y tarjetas retiradas; movimientos físicos revertidos.';
    } else if (entityType === 'Gasto') {
      try { if (item.stockMovements?.length) setInventory(applyStockMovements(inventory, item.stockMovements, -1)); }
      catch (error) { showToast(error.message, 'error'); return false; }
      setExpenses(prev => prev.filter(e => e.id !== item.id));
      cascadeDetails += ` [Cascada: Balance 50/50 recalculado automáticamente]`;
    } else if (entityType === 'Lead') {
      setLeads(prev => prev.filter(l => l.id !== item.id));
    } else if (entityType === 'Tarjeta NFC') {
      if (item.saleId && sales.some(s => s.id === item.saleId)) { showToast('Esta tarjeta pertenece a una venta. Revierte la venta completa para mantener la trazabilidad.', 'warning'); return false; }
      try { if (item.stockMovements?.length) setInventory(applyStockMovements(inventory, item.stockMovements, 1)); }
      catch (error) { showToast(error.message, 'error'); return false; }
      setNfcCards(prev => prev.filter(c => c.id !== item.id));
    } else if (entityType === 'Insumo') {
      if (products.some(p => p.inventoryId === item.id || p.sku === item.sku || p.bundleItems?.some(b => b.id === item.id || b.inventoryId === item.id || b.sku === item.sku)) || sales.some(s => s.stockMovements?.some(m => m.inventoryId === item.id))) {
        showToast('El insumo está vinculado a productos o ventas. Conserva su registro y ajusta su stock.', 'warning'); return false;
      }
      setInventory(prev => prev.filter(i => i.id !== item.id));
    } else if (entityType === 'Producto') {
      setProducts(prev => prev.filter(p => p.id !== item.id));
    } else if (entityType === 'Proveedor') {
      setSuppliers(prev => prev.filter(s => s.id !== item.id));
    } else if (entityType === 'Evento') {
      setCalendarEvents(prev => prev.filter(e => e.id !== item.id));
    }
    if (entityType === 'Plan 30 Días') {
      setPlan30Days(prev => prev.filter(t => t.day !== item.day));
    } else if (entityType === 'Inversión Inicial') {
      setProjectionsData(prev => ({
        ...prev,
        initialInvestment: (prev.initialInvestment || []).filter(i => i.id !== item.id)
      }));
    } else if (entityType === 'Gasto Fijo') {
      setProjectionsData(prev => ({
        ...prev,
        fixedCosts: (prev.fixedCosts || []).filter(fc => fc.id !== item.id)
      }));
    } else if (entityType === 'Gasto Variable' || entityType === 'Costo Variable') {
      setProjectionsData(prev => ({
        ...prev,
        variableCosts: (prev.variableCosts || []).filter(vc => vc.id !== item.id)
      }));
    } else if (entityType === 'Mix Producto') {
      setProjectionsData(prev => ({
        ...prev,
        projectedProducts: (prev.projectedProducts || []).filter(p => p.id !== item.id)
      }));
    } else if (entityType === 'Entregable') {
      setProjectPhases(prev => prev.map(phase => ({
        ...phase,
        deliverables: (phase.deliverables || []).filter(d => d.id !== item.id)
      })));
    }

    // Registrar en auditoría
    const finalReason = `${reason}${cascadeDetails}`;
    const authorId = deletedBy || (currentUser ? currentUser.id : 'luis');
    const authorName = deletedByName || (currentUser ? currentUser.name : authorId === 'kevin' ? 'Kevin Servat' : 'Luis Romero');
    logAudit({
      actionType: 'Eliminación',
      entityType,
      entityId: item.id || item.sku || item.saleNumber || item.chipUid || `dia-${item.day}` || '',
      entityName: item.name || item.concept || item.businessName || item.title || item.action || item.description || item.saleNumber || 'Elemento',
      reason: finalReason,
      snapshot: item,
      author: authorId,
      authorName: authorName,
      deletedBy: authorId,
      deletedByName: authorName
    });
    setDeleteModalConfig({
      isOpen: false,
      item: null,
      entityType: ''
    });
    showToast(`🗑️ ${entityType} eliminado(a) y registrado en bitácora de auditoría`, 'info');
    return true;
  };

  // Dar Visto Bueno / OK a Registro de Auditoría
  const handleAcknowledgeLog = logId => {
    const activeUser = currentUser || {
      id: 'luis',
      name: 'Luis Romero'
    };
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setAuditLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          status: 'approved',
          reviewedBy: activeUser.id,
          reviewedByName: activeUser.name,
          reviewedAt: now
        };
      }
      return log;
    }));
    showToast('✓ Visto bueno registrado en auditoría', 'success');
  };

  // Dar Visto Bueno / OK a Todos los Registros Recientes
  const handleAcknowledgeAllLogs = () => {
    const activeUser = currentUser || {
      id: 'luis',
      name: 'Luis Romero'
    };
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setAuditLogs(prev => prev.map(log => {
      if (!log.reviewedBy && !log.restored) {
        return {
          ...log,
          status: 'approved',
          reviewedBy: activeUser.id,
          reviewedByName: activeUser.name,
          reviewedAt: now
        };
      }
      return log;
    }));
    showToast('✓ Todos los registros pendientes han sido aprobados', 'success');
  };

  // Restauración y Reversión de Auditoría (Netamente por el usuario de la cuenta)
  const handleRestoreItem = auditLog => {
    if (!auditLog || auditLog.restored) return;
    const activeUser = currentUser || {
      id: 'luis',
      name: 'Luis Romero'
    };
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const action = auditLog.actionType || 'Eliminación';
    const confirmRestore = window.confirm(`¿Deseas restaurar/revertir el cambio de "${auditLog.entityName}" (${action}) como ${activeUser.name}?`);
    if (!confirmRestore) return;
    if (action === 'Eliminación') {
      if (!auditLog.snapshot) {
        alert('⚠️ Este registro no contiene una copia de seguridad para restaurar automáticamente.');
        return;
      }
      if (auditLog.entityType === 'Producto') {
        setProducts(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Gasto') {
        if (expenses.some(e => e.id === auditLog.snapshot.id)) { showToast('El gasto ya existe.', 'warning'); return; }
        try { if (auditLog.snapshot.stockMovements?.length) setInventory(applyStockMovements(inventory, auditLog.snapshot.stockMovements, 1)); }
        catch (error) { showToast(error.message, 'error'); return; }
        setExpenses(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Venta') {
        if (sales.some(s => s.id === auditLog.snapshot.id)) { showToast('La venta ya existe.', 'warning'); return; }
        if (!auditLog.snapshot.stockMovements) { showToast('Esta venta histórica requiere conciliación manual del inventario.', 'warning'); return; }
        try { setInventory(applyStockMovements(inventory, auditLog.snapshot.stockMovements, -1)); }
        catch (error) { showToast(error.message, 'error'); return; }
        setSales(prev => [auditLog.snapshot, ...prev]);
        setNfcCards(prev => [...(auditLog.snapshot.relatedCards || []), ...prev]);
      } else if (auditLog.entityType === 'Lead') {
        setLeads(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Tarjeta NFC') {
        if (nfcCards.some(c => c.id === auditLog.snapshot.id)) { showToast('La tarjeta ya existe.', 'warning'); return; }
        try { if (auditLog.snapshot.stockMovements?.length) setInventory(applyStockMovements(inventory, auditLog.snapshot.stockMovements, -1)); }
        catch (error) { showToast(error.message, 'error'); return; }
        setNfcCards(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Insumo') {
        setInventory(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Proveedor') {
        setSuppliers(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Evento') {
        setCalendarEvents(prev => [auditLog.snapshot, ...prev]);
      } else if (auditLog.entityType === 'Plan 30 Días') {
        setPlan30Days(prev => [...prev, auditLog.snapshot]);
      } else if (auditLog.entityType === 'Inversión Inicial') {
        setProjectionsData(prev => ({
          ...prev,
          initialInvestment: [...(prev.initialInvestment || []), auditLog.snapshot]
        }));
      } else if (auditLog.entityType === 'Gasto Fijo') {
        setProjectionsData(prev => ({
          ...prev,
          fixedCosts: [...(prev.fixedCosts || []), auditLog.snapshot]
        }));
      } else if (auditLog.entityType === 'Gasto Variable' || auditLog.entityType === 'Costo Variable') {
        setProjectionsData(prev => ({
          ...prev,
          variableCosts: [...(prev.variableCosts || []), auditLog.snapshot]
        }));
      } else if (auditLog.entityType === 'Mix Producto') {
        setProjectionsData(prev => ({
          ...prev,
          projectedProducts: [...(prev.projectedProducts || []), auditLog.snapshot]
        }));
      }
    } else if (action === 'Creación') {
      // Revertir creación = eliminar el elemento creado
      const id = auditLog.entityId;
      if (auditLog.entityType === 'Producto') {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else if (auditLog.entityType === 'Gasto') {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;
        if (handleConfirmDelete({ item: expense, entityType: 'Gasto', reason: 'Reversión auditada', deletedBy: currentUser.id }) === false) return;
      } else if (auditLog.entityType === 'Venta') {
        const sale = sales.find(s => s.id === id || s.saleNumber === id);
        if (!sale) { showToast('La venta ya no existe.', 'warning'); return; }
        if (handleConfirmDelete({ item: sale, entityType: 'Venta', reason: 'Reversión auditada', deletedBy: currentUser.id }) === false) return;
      } else if (auditLog.entityType === 'Lead') {
        setLeads(prev => prev.filter(l => l.id !== id));
      } else if (auditLog.entityType === 'Tarjeta NFC') {
        const card = nfcCards.find(c => c.id === id || c.chipUid === id);
        if (!card || handleConfirmDelete({item:card,entityType:'Tarjeta NFC',reason:'Reversión auditada',deletedBy:currentUser.id}) === false) return;
      } else if (auditLog.entityType === 'Insumo') {
        setInventory(prev => prev.filter(i => i.id !== id && i.sku !== id));
      } else if (auditLog.entityType === 'Proveedor') {
        setSuppliers(prev => prev.filter(s => s.id !== id));
      } else if (auditLog.entityType === 'Evento') {
        setCalendarEvents(prev => prev.filter(e => e.id !== id));
      } else if (auditLog.entityType === 'Plan 30 Días') {
        setPlan30Days(prev => prev.filter(t => `dia-${t.day}` !== id && t.day !== Number(id?.replace('dia-', ''))));
      } else if (auditLog.entityType === 'Inversión Inicial') {
        setProjectionsData(prev => ({
          ...prev,
          initialInvestment: (prev.initialInvestment || []).filter(i => i.id !== id)
        }));
      } else if (auditLog.entityType === 'Gasto Fijo') {
        setProjectionsData(prev => ({
          ...prev,
          fixedCosts: (prev.fixedCosts || []).filter(fc => fc.id !== id)
        }));
      } else if (auditLog.entityType === 'Gasto Variable' || auditLog.entityType === 'Costo Variable') {
        setProjectionsData(prev => ({
          ...prev,
          variableCosts: (prev.variableCosts || []).filter(vc => vc.id !== id)
        }));
      } else if (auditLog.entityType === 'Mix Producto') {
        setProjectionsData(prev => ({
          ...prev,
          projectedProducts: (prev.projectedProducts || []).filter(p => p.id !== id && p.sku !== id)
        }));
      }
    } else if (action === 'Modificación') {
      if (auditLog.snapshot) {
        const id = auditLog.entityId;
        if (auditLog.entityType === 'Insumo') {
          setInventory(prev => prev.map(i => i.id === id || i.sku === id ? auditLog.snapshot : i));
        } else if (auditLog.entityType === 'Producto') {
          setProducts(prev => prev.map(p => p.id === id ? auditLog.snapshot : p));
        } else if (auditLog.entityType === 'Gasto') {
          if (handleEditExpense(auditLog.snapshot) === false) return;
        } else if (auditLog.entityType === 'Lead') {
          setLeads(prev => prev.map(l => l.id === id ? auditLog.snapshot : l));
        } else if (auditLog.entityType === 'Inversión Inicial') {
          setProjectionsData(prev => ({
            ...prev,
            initialInvestment: (prev.initialInvestment || []).map(i => i.id === id ? auditLog.snapshot : i)
          }));
        } else if (auditLog.entityType === 'Gasto Fijo') {
          setProjectionsData(prev => ({
            ...prev,
            fixedCosts: (prev.fixedCosts || []).map(fc => fc.id === id ? auditLog.snapshot : fc)
          }));
        } else if (auditLog.entityType === 'Gasto Variable' || auditLog.entityType === 'Costo Variable') {
          setProjectionsData(prev => ({
            ...prev,
            variableCosts: (prev.variableCosts || []).map(vc => vc.id === id ? auditLog.snapshot : vc)
          }));
        } else if (auditLog.entityType === 'Mix Producto') {
          setProjectionsData(prev => ({
            ...prev,
            projectedProducts: (prev.projectedProducts || []).map(p => p.id === id || p.sku === id ? auditLog.snapshot : p)
          }));
        } else if (auditLog.entityType === 'Plan 30 Días') {
          setPlan30Days(prev => prev.map(t => `dia-${t.day}` === id || t.day === Number(id?.replace('dia-', '')) ? auditLog.snapshot : t));
        } else if (auditLog.entityType === 'Evento') {
          setCalendarEvents(prev => prev.map(e => e.id === id ? auditLog.snapshot : e));
        }
      }
    }

    // Actualizar registro original y generar registro de auditoría que certifique la restauración ("para que quede grabado")
    setAuditLogs(prev => {
      const updated = prev.map(log => log.id === auditLog.id ? {
        ...log,
        restored: true,
        restoredBy: activeUser.id,
        restoredByName: activeUser.name,
        restoredAt: now,
        status: 'restored',
        reason: log.reason
      } : log);
      const restoreAuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now,
        actionType: 'Modificación',
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        entityName: auditLog.entityName,
        author: activeUser.id,
        authorName: activeUser.name,
        deletedBy: activeUser.id,
        deletedByName: activeUser.name,
        reason: `Restauración ejecutada por ${activeUser.name} sobre la acción del ${auditLog.timestamp}.`,
        reviewedBy: activeUser.id,
        reviewedByName: activeUser.name,
        reviewedAt: now,
        status: 'approved'
      };
      return [restoreAuditEntry, ...updated];
    });
    showToast(`✓ Acción restaurada con éxito por ${activeUser.name}.`, 'success');
  };
  const handleSettlePartnerDebt = ({
    amount,
    note,
    fromPartner,
    toPartner
  }) => {
    const value = Number(amount);
    const debt = partnerBalance.debtLuisToKevin;
    if (!(value > 0) || value > Math.abs(debt) + 0.001 || fromPartner !== (debt > 0 ? 'luis' : 'kevin')) {
      showToast('La liquidación debe ser positiva y no superar el saldo pendiente.', 'error'); return false;
    }
    const settleExp = {
      id: `settle-${Date.now()}`,
      date: localDate(),
      type: 'Liquidación',
      category: 'Cuadre entre socios',
      description: `Liquidación de saldo: ${fromPartner === 'luis' ? 'Luis Romero' : 'Kevin Servat'} transfirió a ${toPartner === 'kevin' ? 'Kevin Servat' : 'Luis Romero'}`,
      amount: amount,
      paymentMethod: 'Transferencia BCP / Yape',
      paidBy: fromPartner,
      month: getAccountingMonth(localDate()),
      toPartner,
      notes: note
    };
    setExpenses([settleExp, ...expenses]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Gasto',
      entityId: settleExp.id,
      entityName: `Liquidación 50/50: S/ ${Number(amount).toFixed(2)}`,
      reason: `Cuadre de aportes entre socios. Transferido por ${fromPartner === 'luis' ? 'Luis Romero' : 'Kevin Servat'}.`
    });
  };
  const handleExportExcel = async () => {
    const { exportLinkeoGesToExcel } = await import('./utils/excelExport');
    exportLinkeoGesToExcel({
      products, suppliers, calendarEvents, projectPhases, projectionsData, auditLogs, districts,
      sales,
      expenses,
      nfcCards,
      inventory,
      leads,
      plan30Days,
      targets: dynamicTargets
    });
  };

  // 1. Enrutador Dinámico de Redirección para clientes (Público, no requiere login)
  if (dynamicCardRoute) {
    return (
      <NfcRedirectScreen
        cardId={dynamicCardRoute.cardId}
        src={dynamicCardRoute.src}
        nfcCards={nfcCards}
        onRecordBip={handleRecordCardBip}
      />
    );
  }

  if (authLoading) return <div className="loading-screen">Validando sesión…</div>;
  // Si no hay usuario autenticado, renderizar exclusivamente el Login modal bloqueando el acceso
  if (!currentUser) {
    return <div className={`theme-${theme}`}>
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      </div>;
  }
  return <div className="app-container">
      <SyncStatus cloud={cloud} />
      {/* Modal de Perfil de Usuario */}
      {isProfileModalOpen && <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} currentStatus={partnersState[currentUser?.id]?.status || 'Disponible'} onStatusChange={newStatus => {
      setPartnersState(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          status: newStatus
        }
      }));
      logAudit({
        actionType: 'Modificación',
        entityType: 'Perfil Socio',
        entityId: currentUser?.id,
        entityName: `${currentUser?.name} (Estado: ${newStatus})`,
        reason: `Cambio manual de estado operativo a ${newStatus}.`
      });
    }} onLogout={handleLogout} partnerBalance={partnerBalance} logAudit={logAudit} showToast={showToast} />}

      {/* Modal de Maestro de Distritos */}
      <MasterDataModal isOpen={isMasterDataModalOpen} onClose={() => setIsMasterDataModalOpen(false)} districts={districts} onAddDistrict={handleAddDistrict} onDeleteDistrict={handleDeleteDistrict} />

      {/* Sidebar de Navegación Lateral */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} nfcCardsCount={nfcCards.length} leadsCount={leads.filter(l => l.stage !== 'entregado' && l.stage !== 'postventa').length} inventoryAlertsCount={inventory.filter(i => i.quantity <= i.minThreshold).length} auditLogsCount={auditLogs.length} productsCount={products.length} partnerBalance={partnerBalance} expenses={expenses} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} mobileOpen={mobileMenuOpen} onCloseMobileMenu={() => setMobileMenuOpen(false)} onOpenMasterData={() => setIsMasterDataModalOpen(true)} partnersState={partnersState} currentUser={currentUser} onOpenProfile={() => setIsProfileModalOpen(true)} isCloudReady={isSupabaseConfigured} onOpenNewSale={handleOpenNewSaleModal} onOpenNewExpense={() => setIsNewExpenseModalOpen(true)} onExportExcel={handleExportExcel} />

      {/* Contenido Principal */}
      <div className="main-content">
        <Navbar currentTheme={theme} toggleTheme={toggleTheme} partnersState={partnersState} currentTab={currentTab} setCurrentTab={setCurrentTab} sidebarCollapsed={sidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} onPartnerStatusChange={(pId, status) => {
        setPartnersState(prev => ({
          ...prev,
          [pId]: {
            ...prev[pId],
            status
          }
        }));
      }} onOpenNewSale={handleOpenNewSaleModal} onOpenNewExpense={() => setIsNewExpenseModalOpen(true)} onOpenNewNfc={() => setCurrentTab('nfc-traceability')} onExportExcel={handleExportExcel} toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} currentUser={currentUser} onOpenProfile={() => setIsProfileModalOpen(true)} onOpenMasterData={() => setIsMasterDataModalOpen(true)} onResetToZero={handleResetToZero} onLoadDemoData={handleLoadDemoData} isCloudReady={isSupabaseConfigured} onSyncCloud={() => loadCloudData(true)} isSyncing={isSyncing} />

        <main className="content-body" inert={cloud.status === "loading" || cloud.status === "error" ? true : undefined}>
<Suspense fallback={<p>Cargando módulo…</p>}>
          {/* MÓDULO 1: Dashboard General */}
          {currentTab === 'dashboard' && <DashboardView sales={sales} expenses={expenses} nfcCards={nfcCards} inventory={inventory} leads={leads} targets={dynamicTargets} partnerBalance={partnerBalance} setCurrentTab={setCurrentTab} onOpenCardDetails={card => {
          setSelectedCardModal(card);
          setCurrentTab('nfc-traceability');
        }} onOpenNewSale={handleOpenNewSaleModal} onOpenNewExpense={() => setIsNewExpenseModalOpen(true)} onRequestDelete={handleRequestDelete} projectionsData={projectionsData} onUpdateProjectionsData={setProjectionsData} showToast={showToast} />}

          {/* MÓDULO 2: Gestión de Proyecto (5 Fases ERP) */}
          {currentTab === 'lifecycle' && <ProjectLifecycleView projectPhases={projectPhases} onToggleDeliverable={handleToggleDeliverable} onAddDeliverable={handleAddDeliverable} onEditDeliverable={handleEditDeliverable} onDeleteDeliverable={(phaseId, del) => handleRequestDelete(del, 'Entregable')} currentUser={currentUser} onSyncActualProgress={handleSyncActualProgress} />}

          {/* MÓDULO 3: Trazabilidad Chips NFC */}
          {currentTab === 'nfc-traceability' && (
            <NfcTraceabilityView 
              nfcCards={nfcCards} 
              products={products} 
              inventory={inventory} 
              leads={leads}
              onUpdateLead={handleUpdateLead}
              districts={districts}
              onUpdateCard={handleUpdateCard} 
              onAddNewCard={handleAddNewCard} 
              onRecordBip={handleRecordCardBip} 
              selectedCardModal={selectedCardModal} 
              setSelectedCardModal={setSelectedCardModal} 
              onRequestDelete={handleRequestDelete} 
              onUpdateInventoryStock={handleUpdateInventoryStock} 
              showToast={showToast} 
            />
          )}

          {/* MÓDULO 4: Pipeline B2B (Kanban) */}
          {currentTab === 'pipeline' && <KanbanView products={products} leads={leads} sales={sales} districts={districts} onUpdateLeadStage={handleUpdateLeadStage} onUpdateLead={handleUpdateLead} onAddNewLead={handleAddNewLead} onConvertLeadToSale={handleConvertLeadToSale} onRequestDelete={handleRequestDelete} showToast={showToast} />}

          {/* MÓDULO 5: Agenda & Coordinación de Visitas */}
          {currentTab === 'calendar' && <CalendarView events={calendarEvents} onAddNewEvent={handleAddNewEvent} onEditEvent={handleEditEvent} nfcCards={nfcCards} onRequestDelete={handleRequestDelete} districts={districts} showToast={showToast} />}

          {/* MÓDULO 6: Almacén & Inventario Integral (Catálogo, Packs Promocionales, Insumos Físicos y Proveedores) */}
          {(currentTab === 'inventory' || currentTab === 'products') && <InventoryView inventory={inventory} products={products} suppliers={suppliers} onUpdateInventoryStock={handleUpdateInventoryStock} onAddNewInventoryItem={handleAddNewInventoryItem} onAddNewProduct={handleAddNewProduct} onAddNewSupplier={handleAddNewSupplier} onEditSupplier={handleEditSupplier} onOpenNewExpense={() => setIsNewExpenseModalOpen(true)} onRequestDelete={handleRequestDelete} initialSubTab={currentTab === 'products' ? 'catalog' : 'catalog'} showToast={showToast} />}

          {/* MÓDULO 7: Finanzas & Balances 50/50 */}
          {currentTab === 'finances' && <FinanceView sales={sales} expenses={expenses} products={products} inventory={inventory} onAddNewExpense={handleAddNewExpense} onEditExpense={handleEditExpense} onAddNewSale={handleOpenNewSaleModal} onExportExcel={handleExportExcel} partnerBalance={partnerBalance} onSettlePartnerDebt={handleSettlePartnerDebt} targets={dynamicTargets} onRequestDelete={handleRequestDelete} onAddNewProduct={handleAddNewProduct} onUpdateInventoryStock={handleUpdateInventoryStock} showToast={showToast} />}

          {/* MÓDULO 8: Proyecciones, Costos & Metas (Escenario Libre & Plan 30 Días) */}
          {currentTab === 'projections' && <ProjectionsView projectionsData={projectionsData} onUpdateProjectionsData={setProjectionsData} products={products} inventory={inventory} leads={leads} sales={sales} plan30Days={plan30Days} setPlan30Days={setPlan30Days} onTogglePlanTask={handleTogglePlanTask} onAddPlanTask={handleAddPlanTask} onEditPlanTask={handleEditPlanTask} onRequestDelete={handleRequestDelete} logAudit={logAudit} currentUser={currentUser} setCurrentTab={setCurrentTab} showToast={showToast} />}

          {/* MÓDULO 9: Bitácora de Auditoría */}
          {currentTab === 'audit' && <AuditView auditLogs={auditLogs} currentUser={currentUser} onAcknowledgeLog={handleAcknowledgeLog} onAcknowledgeAllLogs={handleAcknowledgeAllLogs} onRestoreItem={handleRestoreItem} />}
        </Suspense></main>

        <MobileBottomNav 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenNewSale={handleOpenNewSaleModal}
          onOpenNewExpense={() => setIsNewExpenseModalOpen(true)}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          nfcCardsCount={nfcCards.length}
          leadsCount={leads.filter(l => l.stage !== 'entregado' && l.stage !== 'postventa').length}
        />
      </div>

      {/* MODAL GLOBAL: Nueva Venta */}
      {isNewSaleModalOpen && (() => {
        const catalogList = products.length > 0 ? products : INITIAL_PRODUCTS;
        const selectedProdId = newSaleForm.productId || (catalogList[0]?.id || '');
        const currentProd = catalogList.find(p => p.id === selectedProdId) || catalogList[0];
        const availableStock = Number(currentProd?.stock ?? 0);
        const isOutOfStock = availableStock <= 0;
        const defaultPrice = currentProd ? Number(currentProd.price || 0) : 0;
        const defaultCost = currentProd ? Number(currentProd.cost || 0) : 0;
        const currentUnitPrice = newSaleForm.isCustomPricing && newSaleForm.customUnitPrice !== '' ? Number(newSaleForm.customUnitPrice) : defaultPrice;
        const currentUnitCost = newSaleForm.isCustomPricing && newSaleForm.customUnitCost !== '' ? Number(newSaleForm.customUnitCost) : defaultCost;
        const qty = Number(newSaleForm.quantity) || 1;
        const currentTotal = (currentUnitPrice * qty).toFixed(2);
        const currentProfit = ((currentUnitPrice - currentUnitCost) * qty).toFixed(2);

        return (
          <div className="modal-overlay">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Registrar Nueva Venta | LinkeoGes</h3>
                <button className="close-btn" onClick={handleCloseNewSaleModal}>✕</button>
              </div>

              <form onSubmit={handleAddNewSale}>
                <div className="form-group">
                  <label className="form-label">Nombre del Negocio / Cliente:</label>
                  <input type="text" className="form-control" placeholder="Ej: Barbería Don Tito, Pollería Roky's..." value={newSaleForm.clientName} onChange={e => setNewSaleForm({
                    ...newSaleForm,
                    clientName: e.target.value
                  })} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Producto o Pack:</label>
                    <select 
                      className="form-control" 
                      value={selectedProdId} 
                      onChange={e => {
                        const nextId = e.target.value;
                        const nextProd = catalogList.find(p => p.id === nextId) || catalogList[0];
                        const nextStock = Number(nextProd?.stock ?? 0);
                        const curQty = parseInt(newSaleForm.quantity, 10) || 1;
                        const clampedQty = nextStock > 0 ? Math.min(Math.max(1, curQty), nextStock) : 1;
                        setNewSaleForm({
                          ...newSaleForm,
                          productId: nextId,
                          quantity: clampedQty
                        });
                      }} 
                      required
                    >
                      {catalogList.map(p => {
                        const pStock = Number(p.stock ?? 0);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} — S/ {Number(p.price || 0).toFixed(2)} ({pStock > 0 ? `${pStock} en stock` : 'Sin stock'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Cantidad:</label>
                      {isOutOfStock ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                          ❌ Agotado (0 en stock)
                        </span>
                      ) : availableStock === 1 ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                          ⚠️ Solo queda 1 disponible
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
                          📦 {availableStock} disponibles
                        </span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      max={Math.max(1, availableStock)}
                      disabled={isOutOfStock}
                      className="form-control" 
                      value={newSaleForm.quantity} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setNewSaleForm({ ...newSaleForm, quantity: '' });
                          return;
                        }
                        let num = parseInt(raw, 10);
                        if (isNaN(num)) return;
                        if (availableStock > 0 && num > availableStock) {
                          showToast(`Stock insuficiente: solo queda ${availableStock} unidad${availableStock === 1 ? '' : 'es'} de "${currentProd?.name || 'este producto'}".`, 'warning');
                          num = availableStock;
                        } else if (num < 1) {
                          num = 1;
                        }
                        setNewSaleForm({
                          ...newSaleForm,
                          quantity: num
                        });
                      }}
                      onBlur={() => {
                        const num = parseInt(newSaleForm.quantity, 10);
                        if (isNaN(num) || num < 1) {
                          setNewSaleForm(prev => ({ ...prev, quantity: availableStock > 0 ? 1 : 1 }));
                        } else if (availableStock > 0 && num > availableStock) {
                          setNewSaleForm(prev => ({ ...prev, quantity: availableStock }));
                        }
                      }}
                      required 
                    />
                  </div>
                </div>

                {/* Panel de Precios de Almacén y Opción de Modificar Costo / Precio */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(0, 102, 255, 0.06)',
                  border: '1px solid rgba(0, 102, 255, 0.22)',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🏷️ Catálogo Oficial: Venta S/ {defaultPrice.toFixed(2)} | Insumo S/ {defaultCost.toFixed(2)}
                    </span>
                    <button type="button" className="btn btn-secondary btn-sm" style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }} onClick={() => {
                      setNewSaleForm(prev => ({
                        ...prev,
                        isCustomPricing: !prev.isCustomPricing,
                        customUnitPrice: !prev.isCustomPricing ? defaultPrice.toString() : '',
                        customUnitCost: !prev.isCustomPricing ? defaultCost.toString() : ''
                      }));
                    }}>
                      <Edit3 size={13} />
                      <span>{newSaleForm.isCustomPricing ? 'Restablecer precios por defecto' : 'Modificar costo / precio'}</span>
                    </button>
                  </div>

                  {newSaleForm.isCustomPricing && <div className="form-row" style={{
                    marginTop: '10px'
                  }}>
                    <div className="form-group" style={{
                      marginBottom: 0
                    }}>
                      <label className="form-label" style={{
                        fontSize: '0.76rem'
                      }}>Precio Unitario de Venta Modificado (S/):</label>
                      <input type="number" step="0.01" className="form-control" value={newSaleForm.customUnitPrice} onChange={e => setNewSaleForm({
                        ...newSaleForm,
                        customUnitPrice: e.target.value
                      })} required />
                    </div>
                    <div className="form-group" style={{
                      marginBottom: 0
                    }}>
                      <label className="form-label" style={{
                        fontSize: '0.76rem'
                      }}>Costo Unitario Insumo Modificado (S/):</label>
                      <input type="number" step="0.01" className="form-control" value={newSaleForm.customUnitCost} onChange={e => setNewSaleForm({
                        ...newSaleForm,
                        customUnitCost: e.target.value
                      })} required />
                    </div>
                  </div>}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      Total Cobro ({qty} uds): <strong style={{
                        color: '#10b981',
                        fontSize: '0.95rem'
                      }}>S/ {currentTotal}</strong>
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      Margen Bruto Linkeo: <strong style={{
                        color: '#38bdf8',
                        fontSize: '0.95rem'
                      }}>S/ {currentProfit}</strong>
                    </span>
                  </div>

                  {newSaleForm.isCustomPricing && <div style={{
                    fontSize: '0.73rem',
                    color: '#38bdf8',
                    marginTop: '6px'
                  }}>
                    ✏️ Precio y costo personalizados para esta transacción. El catálogo maestro no se altera.
                  </div>}
                </div>

                {isOutOfStock && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span>
                    <span><strong>Producto sin stock:</strong> No hay existencias disponibles en almacén para vender este producto. Selecciona otro o ingresa stock en Inventario.</span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Distrito de Lima (Maestro Central):</label>
                    <DistrictCombobox 
                      value={newSaleForm.district}
                      onChange={dist => setNewSaleForm({ ...newSaleForm, district: dist })}
                      districts={districts}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Método de Pago:</label>
                    <select className="form-control" value={newSaleForm.paymentMethod} onChange={e => setNewSaleForm({
                      ...newSaleForm,
                      paymentMethod: e.target.value
                    })}>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia BCP">Transferencia BCP</option>
                      <option value="Transferencia BBVA">Transferencia BBVA</option>
                      <option value="Efectivo">Efectivo contraentrega</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Google Place ID (Generará la URL directa de 5 estrellas):</label>
                  <input type="text" className="form-control code-mono" placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4" value={newSaleForm.googlePlaceId} onChange={e => setNewSaleForm({
                    ...newSaleForm,
                    googlePlaceId: e.target.value
                  })} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Contacto (WhatsApp):</label>
                      <span style={{ fontSize: '0.72rem', color: newSaleForm.phone?.length === 9 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                        {newSaleForm.phone?.length || 0}/9 dígitos
                      </span>
                    </div>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="987654321" 
                      maxLength={9}
                      value={newSaleForm.phone} 
                      onChange={e => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setNewSaleForm({
                          ...newSaleForm,
                          phone: clean
                        });
                      }} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vendedor / Socio Responsable:</label>
                    <select className="form-control" value={newSaleForm.soldBy} onChange={e => setNewSaleForm({
                      ...newSaleForm,
                      soldBy: e.target.value
                    })}>
                      <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                      <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px'
                }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseNewSaleModal}>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isOutOfStock}
                    title={isOutOfStock ? "No se puede registrar la venta: producto sin existencias" : ""}
                    style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Registrar Venta & Chip
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL GLOBAL: Nuevo Gasto */}
      {isNewExpenseModalOpen && <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Gasto Operativo</h3>
              <button className="close-btn" onClick={handleCloseNewExpenseModal}>✕</button>
            </div>

            <form onSubmit={e => {
          e.preventDefault();
          const finalAmount = Number(globalExpenseForm.amount) || 0;
          const saved = handleAddNewExpense({
            id: `exp-${Date.now()}`,
            date: globalExpenseForm.date,
            type: globalExpenseForm.type,
            category: globalExpenseForm.category,
            description: globalExpenseForm.description,
            amount: finalAmount,
            paymentMethod: globalExpenseForm.paymentMethod,
            paidBy: globalExpenseForm.paidBy,
            month: globalExpenseForm.month || getAccountingMonth(globalExpenseForm.date),
            notes: globalExpenseForm.notes,
            selectedProductId: globalExpenseForm.selectedProductId || null,
            unitCost: globalExpenseForm.unitCost ? Number(globalExpenseForm.unitCost) : null,
            quantity: Number(globalExpenseForm.quantity) || 1,
            isCustomCost: globalExpenseForm.isCustomCost
          });
          if (saved === false) return;
          showToast(`✅ Gasto de S/ ${finalAmount.toFixed(2)} registrado exitosamente`, 'success');
          handleCloseNewExpenseModal();
        }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha del Desembolso:</label>
                  <input type="date" className="form-control" value={globalExpenseForm.date} onChange={e => {
                const newDate = e.target.value;
                setGlobalExpenseForm({
                  ...globalExpenseForm,
                  date: newDate,
                  month: getAccountingMonth(newDate)
                });
              }} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría:</label>
                  <select className="form-control" value={globalExpenseForm.category} onChange={e => setGlobalExpenseForm({
                ...globalExpenseForm,
                category: e.target.value
              })}>
                    <option value="Compra de mercadería">Compra de mercadería (Chips / Acrílicos)</option>
                    <option value="Publicidad">Publicidad y Pauta Digital</option>
                    <option value="Movilidad">Movilidad / Visitas Comerciales</option>
                    <option value="Teléfono/datos">Teléfono / Datos / Línea</option>
                    <option value="Dominio/sistema">Dominio / Hosting / Software</option>
                    <option value="Empaques y bolsas">Empaques, cajas y stickers</option>
                    <option value="Otro">Otro gasto operativo</option>
                  </select>
                </div>
              </div>

              {/* Selector de Producto de Almacén para cargar costo por default */}
              <div className="form-group">
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
                  <label className="form-label" style={{
                marginBottom: 0
              }}>
                    📦 Cargar Producto / Insumo de Almacén (Opcional):
                  </label>
                  <span style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)'
              }}>
                    {products.length} productos en catálogo
                  </span>
                </div>
                <select className="form-control" value={globalExpenseForm.selectedProductId} onChange={e => handleGlobalProductChange(e.target.value)}>
                  <option value="">— Escribir gasto libre o seleccionar producto de Almacén —</option>
                  {products.map(p => <option key={p.id} value={p.id}>
                      📦 {p.name} — Costo por default: S/ {Number(p.cost).toFixed(2)} | Venta: S/ {Number(p.price).toFixed(2)}
                    </option>)}
                  {inventory.filter(i => !products.some(p => p.name === i.name)).map(i => <option key={i.id} value={i.id}>
                      🏷️ {i.name} — Costo unitario: S/ {Number(i.unitCost).toFixed(2)}
                    </option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción del Gasto:</label>
                <input type="text" className="form-control" placeholder="Ej: Tarjeta Google NFC Cuadrado, Displays de Acrílico..." value={globalExpenseForm.description} onChange={e => setGlobalExpenseForm({
              ...globalExpenseForm,
              description: e.target.value
            })} required />
              </div>

              {/* Panel de Costo Unitario y Opción de Modificar Costo */}
              {globalExpenseForm.selectedProductId ? <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(0, 102, 255, 0.06)',
            border: '1px solid rgba(0, 102, 255, 0.22)',
            marginBottom: '16px'
          }}>
                  <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
                    <span style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                      🏷️ Costo por Defecto de Almacén: S/ {Number(globalExpenseForm.unitCost || 0).toFixed(2)}
                    </span>
                    <button type="button" className="btn btn-secondary btn-sm" style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }} onClick={() => setGlobalExpenseForm(prev => ({
                ...prev,
                isCustomCost: !prev.isCustomCost
              }))}>
                      <Edit3 size={13} />
                      <span>{globalExpenseForm.isCustomCost ? 'Restablecer costo por defecto' : 'Modificar costo'}</span>
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{
                marginBottom: 0
              }}>
                      <label className="form-label" style={{
                  fontSize: '0.78rem'
                }}>Cantidad de Unidades:</label>
                      <input type="number" min="1" className="form-control" value={globalExpenseForm.quantity} onChange={e => {
                  const qty = Math.max(1, parseInt(e.target.value) || 1);
                  const unit = Number(globalExpenseForm.unitCost) || 0;
                  setGlobalExpenseForm({
                    ...globalExpenseForm,
                    quantity: qty,
                    amount: (qty * unit).toFixed(2)
                  });
                }} required />
                    </div>

                    <div className="form-group" style={{
                marginBottom: 0
              }}>
                      <label className="form-label" style={{
                  fontSize: '0.78rem'
                }}>
                        {globalExpenseForm.isCustomCost ? 'Costo Unitario Modificado (S/):' : 'Costo Unitario Aplicado (S/):'}
                      </label>
                      <input type="number" step="0.01" className="form-control" value={globalExpenseForm.unitCost} readOnly={!globalExpenseForm.isCustomCost} style={{
                  backgroundColor: globalExpenseForm.isCustomCost ? 'var(--bg-input)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: globalExpenseForm.isCustomCost ? 'var(--primary-600)' : 'var(--border-subtle)',
                  fontWeight: 700
                }} onChange={e => {
                  const unit = e.target.value;
                  const qty = Number(globalExpenseForm.quantity) || 1;
                  setGlobalExpenseForm({
                    ...globalExpenseForm,
                    unitCost: unit,
                    amount: (Number(unit) * qty).toFixed(2)
                  });
                }} required />
                    </div>
                  </div>

                  <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
                    <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}>
                      Total del desembolso ({globalExpenseForm.quantity} uds × S/ {Number(globalExpenseForm.unitCost || 0).toFixed(2)}):
                    </span>
                    <strong style={{
                fontSize: '1.05rem',
                color: '#ef4444'
              }}>
                      S/ {globalExpenseForm.amount}
                    </strong>
                  </div>

                  {globalExpenseForm.isCustomCost && <div style={{
              fontSize: '0.74rem',
              color: '#38bdf8',
              marginTop: '6px'
            }}>
                      ✏️ Costo modificado exclusivamente para este registro de compra sin alterar el catálogo maestro.
                    </div>}
                </div> : <div className="form-group">
                  <label className="form-label">Monto del Desembolso (Soles S/):</label>
                  <input type="number" step="0.01" className="form-control" placeholder="0.00" value={globalExpenseForm.amount} onChange={e => setGlobalExpenseForm({
              ...globalExpenseForm,
              amount: e.target.value
            })} required />
                </div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">¿Quién pagó el gasto?:</label>
                  <select className="form-control" value={globalExpenseForm.paidBy} onChange={e => setGlobalExpenseForm({
                ...globalExpenseForm,
                paidBy: e.target.value
              })}>
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Método de Pago:</label>
                  <select className="form-control" value={globalExpenseForm.paymentMethod} onChange={e => setGlobalExpenseForm({
                ...globalExpenseForm,
                paymentMethod: e.target.value
              })}>
                    <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Transferencia BCP">Transferencia BCP</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              {/* Mes Contable Dinámico - Sincronizado automáticamente y nunca vacío */}
              <div className="form-group">
                <label className="form-label">Mes Contable:</label>
                <select className="form-control" value={globalExpenseForm.month} onChange={e => setGlobalExpenseForm({
              ...globalExpenseForm,
              month: e.target.value
            })} required>
                  {ACCOUNTING_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <span style={{
              fontSize: '0.74rem',
              color: 'var(--text-subtle)',
              marginTop: '4px',
              display: 'block'
            }}>
                  ✓ Sincronizado automáticamente con la fecha de desembolso ({globalExpenseForm.date}).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Notas / Detalle de Cuadre:</label>
                <textarea className="form-control" rows="2" placeholder="Detalles de liquidación, factura o comprobante..." value={globalExpenseForm.notes} onChange={e => setGlobalExpenseForm({
              ...globalExpenseForm,
              notes: e.target.value
            })}></textarea>
              </div>

              <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '16px'
          }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewExpenseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>}

      {/* MODAL GLOBAL: Confirmación y Justificación de Auditoría para Eliminaciones */}
      <DeleteConfirmModal isOpen={deleteModalConfig.isOpen} item={deleteModalConfig.item} entityType={deleteModalConfig.entityType} onConfirm={handleConfirmDelete} onClose={() => setDeleteModalConfig({
      isOpen: false,
      item: null,
      entityType: ''
    })} currentUser={currentUser} />

      {/* NOTIFICACIONES TOAST GLOBALES */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>;
}
