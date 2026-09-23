import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  PARTNERS, 
  INITIAL_PRODUCTS, 
  INITIAL_EXPENSES, 
  INITIAL_SALES, 
  INITIAL_NFC_CARDS, 
  INITIAL_LEADS, 
  INITIAL_INVENTORY, 
  INITIAL_SUPPLIERS, 
  INITIAL_PLAN_30_DAYS, 
  INITIAL_CALENDAR_EVENTS, 
  FINANCIAL_TARGETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DISTRICTS,
  INITIAL_PROJECT_PHASES,
  INITIAL_PROJECTIONS_DATA
} from './data/initialData';
import { exportLinkeoGesToExcel } from './utils/excelExport';
import { getAccountingMonth, ACCOUNTING_MONTHS } from './utils/dateUtils';
import { Edit3, Package } from 'lucide-react';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import NfcTraceabilityView from './components/NfcTraceabilityView';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import InventoryView from './components/InventoryView';
import FinanceView from './components/FinanceView';
import ProductsCatalogView from './components/ProductsCatalogView';
import ProjectionsView from './components/ProjectionsView';
import AuditView from './components/AuditView';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import LoginModal from './components/LoginModal';
import UserProfileModal from './components/UserProfileModal';
import MasterDataModal from './components/MasterDataModal';
import ProjectLifecycleView from './components/ProjectLifecycleView';
import { dbService, mappers, isSupabaseConfigured, supabase } from './services/supabase';

// Clave de versión de base de datos local para forzar purga de datos mock antiguos (todo vacío desde 0)
const DATA_CLEAN_VERSION = 'v3_production_aesthetic_clean';
if (typeof window !== 'undefined' && localStorage.getItem('linkeoges_clean_version') !== DATA_CLEAN_VERSION) {
  localStorage.removeItem('linkeoges_sales');
  localStorage.removeItem('linkeoges_expenses');
  localStorage.removeItem('linkeoges_nfc_cards');
  localStorage.removeItem('linkeoges_leads');
  localStorage.removeItem('linkeoges_inventory');
  localStorage.removeItem('linkeoges_suppliers');
  localStorage.removeItem('linkeoges_plan_30');
  localStorage.removeItem('linkeoges_events');
  localStorage.removeItem('linkeoges_audit_logs');
  localStorage.removeItem('linkeoges_project_phases');
  localStorage.removeItem('linkeoges_products');
  localStorage.setItem('linkeoges_clean_version', DATA_CLEAN_VERSION);
}

export default function App() {
  // Tema (Dark por defecto para look tech profesional)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('linkeoges_theme') || 'dark';
  });

  // Usuario autenticado (Luis Romero por defecto si ya inició o null para login)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('linkeoges_auth_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.id === 'kevin' && u.name !== 'Kevin Servat') {
          u.name = 'Kevin Servat';
          localStorage.setItem('linkeoges_auth_user', JSON.stringify(u));
        } else if (u.id === 'luis' && u.name !== 'Luis Romero') {
          u.name = 'Luis Romero';
          localStorage.setItem('linkeoges_auth_user', JSON.stringify(u));
        }
        return u;
      } catch (e) {}
    }
    return {
      id: 'luis',
      name: 'Luis Romero',
      role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
      avatar: '👨‍💼',
      badge: 'Co-CEO / Socio 50%'
    };
  });

  // Modales de sesión y maestros
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);

  // Vista activa
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('linkeoges_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Maestro Central de Distritos
  const [districts, setDistricts] = useState(() => {
    const saved = localStorage.getItem('linkeoges_districts');
    return saved ? JSON.parse(saved) : INITIAL_DISTRICTS;
  });

  // Fases del Ciclo de Vida del Proyecto ERP (5 Fases)
  const [projectPhases, setProjectPhases] = useState(() => {
    const saved = localStorage.getItem('linkeoges_project_phases');
    if (saved) {
      try {
        if (saved.toLowerCase().includes('titulaci')) {
          localStorage.setItem('linkeoges_project_phases', JSON.stringify(INITIAL_PROJECT_PHASES));
          return INITIAL_PROJECT_PHASES;
        }
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PROJECT_PHASES;
  });

  // Estados persistentes en LocalStorage con datos iniciales
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('linkeoges_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('linkeoges_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [nfcCards, setNfcCards] = useState(() => {
    const saved = localStorage.getItem('linkeoges_nfc_cards');
    return saved ? JSON.parse(saved) : INITIAL_NFC_CARDS;
  });

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('linkeoges_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('linkeoges_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('linkeoges_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [plan30Days, setPlan30Days] = useState(() => {
    const saved = localStorage.getItem('linkeoges_plan_30');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 27 && parsed[0]?.action?.includes('Definir oferta')) {
          localStorage.setItem('linkeoges_plan_30', JSON.stringify(INITIAL_PLAN_30_DAYS));
          return INITIAL_PLAN_30_DAYS;
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_PLAN_30_DAYS;
  });

  const [calendarEvents, setCalendarEvents] = useState(() => {
    const saved = localStorage.getItem('linkeoges_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(e => {
            const t = (e.title || '').toLowerCase();
            const d = (e.description || '').toLowerCase();
            return !t.includes('titulaci') && !d.includes('titulaci') && e.type !== 'class_block';
          });
          if (cleaned.length !== parsed.length) {
            const result = cleaned.length > 0 ? cleaned : INITIAL_CALENDAR_EVENTS;
            localStorage.setItem('linkeoges_events', JSON.stringify(result));
            return result;
          }
          return cleaned.length > 0 ? cleaned : INITIAL_CALENDAR_EVENTS;
        }
      } catch (err) {}
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('linkeoges_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('linkeoges_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [projectionsData, setProjectionsData] = useState(() => {
    const saved = localStorage.getItem('linkeoges_projections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.projectedProducts?.some(p => p.id === 'proj-estandar') || (parsed?.fixedCosts?.some(fc => fc.id === 'fc-3' && fc.amount === 100) && parsed?.projectedProducts?.length === 2)) {
          localStorage.setItem('linkeoges_projections', JSON.stringify(INITIAL_PROJECTIONS_DATA));
          return INITIAL_PROJECTIONS_DATA;
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_PROJECTIONS_DATA;
  });

  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    item: null,
    entityType: ''
  });

  const [partnersState, setPartnersState] = useState(PARTNERS);

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
    productId: products[0]?.id || '',
    quantity: 1,
    paymentMethod: 'Yape',
    soldBy: currentUser?.id || 'luis',
    googlePlaceId: '',
    customUnitPrice: '',
    customUnitCost: '',
    isCustomPricing: false
  });

  // Formulario de Nuevo Gasto Global (con selección de Almacén y costo modificable)
  const initialExpenseDate = new Date().toISOString().slice(0, 10);
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

  const handleGlobalProductChange = (productId) => {
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

  // Sincronización en la Nube con Supabase (Persistencia multi-dispositivo y en tiempo real)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    const loadCloudData = async () => {
      const data = await dbService.fetchAllInitialData();
      if (!isMounted || !data) return;
      if (data.sales && data.sales.length > 0) setSales(data.sales);
      if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
      if (data.leads && data.leads.length > 0) setLeads(data.leads);
      if (data.nfcCards && data.nfcCards.length > 0) setNfcCards(data.nfcCards);
      if (data.inventory && data.inventory.length > 0) setInventory(data.inventory);
      if (data.suppliers && data.suppliers.length > 0) setSuppliers(data.suppliers);
      if (data.calendarEvents && data.calendarEvents.length > 0) setCalendarEvents(data.calendarEvents);
      if (data.products && data.products.length > 0) setProducts(data.products);
      if (data.districts && data.districts.length > 0) setDistricts(data.districts);
      if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
    };

    loadCloudData();

    // Canal Realtime para recibir cambios instantáneos entre Luis y Kevin
    const channel = supabase.channel('linkeoges-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadCloudData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Purga proactiva de cualquier residuo obsoleto en localStorage
  useEffect(() => {
    try {
      const savedEvts = localStorage.getItem('linkeoges_events');
      if (savedEvts && (savedEvts.toLowerCase().includes('titulaci') || savedEvts.includes('class_block'))) {
        const parsed = JSON.parse(savedEvts);
        const filtered = (parsed || []).filter(e => {
          const t = (e.title || '').toLowerCase();
          const d = (e.description || '').toLowerCase();
          return !t.includes('titulaci') && !d.includes('titulaci') && e.type !== 'class_block';
        });
        const result = filtered.length > 0 ? filtered : INITIAL_CALENDAR_EVENTS;
        localStorage.setItem('linkeoges_events', JSON.stringify(result));
        setCalendarEvents(result);
      }
    } catch (e) {}
  }, []);

  // Persistencia en LocalStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('linkeoges_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('linkeoges_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('linkeoges_districts', JSON.stringify(districts));
  }, [districts]);

  useEffect(() => {
    localStorage.setItem('linkeoges_project_phases', JSON.stringify(projectPhases));
  }, [projectPhases]);

  useEffect(() => {
    localStorage.setItem('linkeoges_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('linkeoges_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('linkeoges_nfc_cards', JSON.stringify(nfcCards));
  }, [nfcCards]);

  useEffect(() => {
    localStorage.setItem('linkeoges_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('linkeoges_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('linkeoges_plan_30', JSON.stringify(plan30Days));
  }, [plan30Days]);

  useEffect(() => {
    localStorage.setItem('linkeoges_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('linkeoges_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('linkeoges_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('linkeoges_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('linkeoges_projections', JSON.stringify(projectionsData));
  }, [projectionsData]);

  // Función universal para registrar auditoría
  const logAudit = ({ actionType = 'Eliminación', entityType, entityId, entityName, reason, diff, snapshot, author, authorName, deletedBy, deletedByName }) => {
    const activeAuthorId = author || deletedBy || (currentUser ? currentUser.id : 'luis');
    const activeAuthorName = authorName || deletedByName || (currentUser ? currentUser.name : (activeAuthorId === 'kevin' ? 'Kevin Servat' : 'Luis Romero'));
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
      restorable: actionType === 'Eliminación'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    if (isSupabaseConfigured) {
      dbService.insert('audit_logs', newLog, mappers.auditLogToDb);
    }
  };

  // Cálculo en vivo del Balance entre Socios (50% / 50%)
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const paidByKevin = expenses.filter(e => e.paidBy === 'kevin').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const paidByLuis = expenses.filter(e => e.paidBy === 'luis').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const halfExpense = totalExpenses / 2;
  const debtLuisToKevin = paidByKevin - halfExpense;

  const partnerBalance = {
    paidByKevin,
    paidByLuis,
    halfExpense,
    debtLuisToKevin
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Login & Logout
  const handleLoginSuccess = (userObj, remember) => {
    setCurrentUser(userObj);
    if (remember) {
      localStorage.setItem('linkeoges_auth_user', JSON.stringify(userObj));
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Sesión',
      entityId: userObj.id,
      entityName: `Inicio de Sesión: ${userObj.name}`,
      reason: `Ingreso autorizado con clave de socio.`
    });
  };

  const handleLogout = () => {
    logAudit({
      actionType: 'Modificación',
      entityType: 'Sesión',
      entityId: currentUser?.id,
      entityName: `Cierre de Sesión: ${currentUser?.name}`,
      reason: 'Socio cerró sesión manualmente.'
    });
    localStorage.removeItem('linkeoges_auth_user');
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  };

  // Reajuste de datos a cero (Modo Limpio) y Cargar Demo
  const handleResetToZero = () => {
    const confirmReset = window.confirm(
      '⚠️ ¿Deseas reiniciar todas las operaciones activas a 0 (CERO)?\n\n' +
      'Esto dejará ventas (0), gastos (0), prospectos (0), chips activos (0), inventario (0), ' +
      'catálogo (0) y proveedores (0) para comenzar a conectar tus registros limpios uno a uno.'
    );
    if (!confirmReset) return;

    setSales([]);
    setExpenses([]);
    setNfcCards([]);
    setLeads([]);
    setCalendarEvents([]);
    setInventory(prev => prev.map(item => ({ ...item, quantity: 0 })));
    setProducts([]);
    setSuppliers([]);

    logAudit({
      actionType: 'Eliminación',
      entityType: 'Sistema ERP',
      entityId: 'SYS-RESET-0',
      entityName: 'Reinicio a Cero (Base Limpia)',
      reason: 'Los socios reiniciaron los datos operativos a 0 para carga paso a paso.'
    });

    alert('✓ Datos operativos reiniciados a 0. ¡Listo para conectar todo desde cero!');
  };

  const handleLoadDemoData = () => {
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

    alert('✓ Datos de demostración cargados exitosamente.');
  };

  // Handlers para Crear Venta
  const handleAddNewSale = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newSaleForm.productId) || products[0];
    if (!prod) {
      alert('⚠️ No hay productos registrados en el Catálogo. Por favor agrega al menos un modelo o pack en la sección "Catálogo" antes de registrar una venta.');
      return;
    }
    const qty = Number(newSaleForm.quantity) || 1;
    const unitPrice = (newSaleForm.isCustomPricing && newSaleForm.customUnitPrice !== '') 
      ? Number(newSaleForm.customUnitPrice) 
      : Number(prod.price || 0);
    const unitCost = (newSaleForm.isCustomPricing && newSaleForm.customUnitCost !== '') 
      ? Number(newSaleForm.customUnitCost) 
      : Number(prod.cost || 0);
    const totalAmount = unitPrice * qty;
    const totalCost = unitCost * qty;
    const profit = totalAmount - totalCost;
    const nextNum = sales.length + 1;
    const saleNum = `VTA-${nextNum < 10 ? '00' : nextNum < 100 ? '0' : ''}${nextNum}`;
    const cardId = `LNK-${nfcCards.length + 101}`;

    const newSale = {
      id: `sale-${Date.now()}`,
      saleNumber: saleNum,
      date: new Date().toISOString().slice(0, 10),
      clientName: newSaleForm.clientName,
      contactPerson: newSaleForm.contactPerson,
      phone: newSaleForm.phone,
      district: newSaleForm.district,
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      cost: totalCost,
      profit: profit,
      paymentMethod: newSaleForm.paymentMethod,
      cardIds: [cardId],
      soldBy: newSaleForm.soldBy || currentUser?.id || 'luis',
      status: 'Cobrado y Entregado',
      deliveredDate: new Date().toISOString().slice(0, 10)
    };

    const newCard = {
      id: cardId,
      chipUid: `04:${Math.random().toString(16).substr(2, 2).toUpperCase()}:B3:C4:D5:E6`,
      model: prod.name,
      businessName: newSaleForm.clientName,
      category: 'Comercio / Restaurante',
      district: newSaleForm.district,
      address: `Distrito de ${newSaleForm.district}, Lima`,
      contactName: newSaleForm.contactPerson,
      contactPhone: newSaleForm.phone,
      placeId: newSaleForm.googlePlaceId.trim() || 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      reviewUrl: newSaleForm.googlePlaceId.trim() 
        ? `https://search.google.com/local/writereview?placeid=${newSaleForm.googlePlaceId.trim()}`
        : 'https://linkeocards.com/',
      fallbackShortUrl: `https://linkeocards.com/r/${newSaleForm.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      assignedDate: new Date().toISOString().slice(0, 10),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Activa',
      saleId: newSale.id,
      history: [
        {
          date: new Date().toLocaleString('es-PE'),
          author: (newSaleForm.soldBy || currentUser?.id) === 'luis' ? 'Luis Romero' : 'Kevin Servat',
          action: 'Venta cerrada y vinculación física de tarjeta con Place ID.'
        }
      ]
    };

    // Descontar inventario de tarjetas vírgenes
    setInventory(prev => prev.map(item => {
      if (item.sku === 'SKU-NTAG215-RAW') {
        return { ...item, quantity: Math.max(0, item.quantity - qty) };
      }
      return item;
    }));

    setSales([newSale, ...sales]);
    setNfcCards([newCard, ...nfcCards]);
    setIsNewSaleModalOpen(false);

    if (isSupabaseConfigured) {
      dbService.insert('sales', newSale, mappers.saleToDb);
      dbService.insert('nfc_cards', newCard, mappers.nfcToDb);
    }

    // Auditoría de Creación
    logAudit({
      actionType: 'Creación',
      entityType: 'Venta',
      entityId: newSale.saleNumber,
      entityName: `${newSale.clientName} (${prod.name})`,
      reason: `Venta registrada por S/ ${totalAmount.toFixed(2)}. Tarjeta vinculada: ${cardId}.`
    });

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    setNewSaleForm({
      clientName: '',
      contactPerson: '',
      phone: '',
      district: districts[0] || 'Miraflores',
      productId: products[0]?.id || '',
      quantity: 1,
      paymentMethod: 'Yape',
      soldBy: currentUser?.id || 'luis',
      googlePlaceId: '',
      customUnitPrice: '',
      customUnitCost: '',
      isCustomPricing: false
    });
  };

  // Handlers para Gastos
  const handleAddNewExpense = (newExp) => {
    const expenseWithMonth = {
      ...newExp,
      month: newExp.month || getAccountingMonth(newExp.date || new Date().toISOString().slice(0, 10))
    };
    setExpenses([expenseWithMonth, ...expenses]);
    if (isSupabaseConfigured) {
      dbService.insert('expenses', expenseWithMonth, mappers.expenseToDb);
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Gasto',
      entityId: expenseWithMonth.id,
      entityName: `${expenseWithMonth.description} - S/ ${Number(expenseWithMonth.amount).toFixed(2)}`,
      reason: `Gasto pagado por ${expenseWithMonth.paidBy === 'luis' ? 'Luis Romero' : 'Kevin Servat'} vía ${expenseWithMonth.paymentMethod} (Mes: ${expenseWithMonth.month}).`
    });
  };

  // Handlers para Tarjetas NFC
  const handleAddNewCard = (newCard) => {
    setNfcCards([newCard, ...nfcCards]);
    if (isSupabaseConfigured) {
      dbService.insert('nfc_cards', newCard, mappers.nfcToDb);
    }

    // Descontar inventario / almacén si la opción de stock está activa
    if (newCard.discountStock) {
      setProducts(prev => prev.map(p => {
        if (p.name === newCard.model || p.id === newCard.productId) {
          const current = p.stock !== undefined ? p.stock : 0;
          return { ...p, stock: Math.max(0, current - 1) };
        }
        return p;
      }));

      setInventory(prev => prev.map(item => {
        if (
          item.name.toLowerCase() === newCard.model?.toLowerCase() || 
          (newCard.productSku && item.sku === newCard.productSku) ||
          (item.name.toLowerCase().includes(newCard.model?.toLowerCase()))
        ) {
          return { ...item, quantity: Math.max(0, item.quantity - 1) };
        }
        if (item.sku === 'SKU-NTAG215-RAW') {
          return { ...item, quantity: Math.max(0, item.quantity - 1) };
        }
        return item;
      }));
    }

    logAudit({
      actionType: 'Creación',
      entityType: 'Tarjeta NFC',
      entityId: newCard.id,
      entityName: `${newCard.businessName} (${newCard.model})`,
      reason: `Chip NFC vinculado con Place ID: ${newCard.placeId}.${newCard.discountStock ? ' Descontada 1 unidad de stock en almacén.' : ''}`
    });
  };

  const handleUpdateCard = (updatedCard) => {
    const oldCard = nfcCards.find(c => c.id === updatedCard.id);
    setNfcCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Tarjeta NFC',
      entityId: updatedCard.id,
      entityName: updatedCard.businessName,
      reason: `Modificación de enlace Place ID / datos de contacto.`,
      diff: `Antes: Place ID ${oldCard?.placeId || '—'} -> Ahora: ${updatedCard.placeId}`
    });
  };

  // Handlers para Leads / Pipeline
  const handleAddNewLead = (newLead) => {
    setLeads([newLead, ...leads]);
    if (isSupabaseConfigured) {
      dbService.insert('leads', newLead, mappers.leadToDb);
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Lead',
      entityId: newLead.id,
      entityName: newLead.businessName,
      reason: `Nuevo prospecto asignado a ${newLead.assignedTo === 'luis' ? 'Luis Romero' : 'Kevin Servat'}.`
    });
  };

  const handleUpdateLeadStage = (leadId, newStage) => {
    const oldLead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    if (isSupabaseConfigured) {
      dbService.update('leads', leadId, { stage: newStage });
    }
    logAudit({
      actionType: 'Modificación',
      entityType: 'Lead',
      entityId: leadId,
      entityName: oldLead?.businessName || leadId,
      reason: `Cambio de fase en embudo comercial.`,
      diff: `Antes: ${oldLead?.stage} -> Ahora: ${newStage}`
    });
  };

  const handleConvertLeadToSale = (lead) => {
    const nextNum = sales.length + 1;
    const saleNum = `VTA-${nextNum < 10 ? '00' : nextNum < 100 ? '0' : ''}${nextNum}`;
    const amount = Number(lead.estimatedValue) || 100;
    const cost = 26;
    const cardId = `LNK-${nfcCards.length + 101}`;

    const newSale = {
      id: `sale-${Date.now()}`,
      saleNumber: saleNum,
      date: new Date().toISOString().slice(0, 10),
      clientName: lead.businessName,
      contactPerson: lead.contactName,
      phone: lead.phone,
      district: lead.district,
      productId: 'pack-2',
      productName: lead.interestedProduct,
      quantity: 1,
      unitPrice: amount,
      totalAmount: amount,
      cost: cost,
      profit: amount - cost,
      paymentMethod: 'Yape / Transferencia',
      cardIds: [cardId],
      soldBy: lead.assignedTo,
      status: 'Cobrado y Entregado',
      deliveredDate: new Date().toISOString().slice(0, 10)
    };

    const newCard = {
      id: cardId,
      chipUid: `04:${Math.random().toString(16).substr(2, 2).toUpperCase()}:C5:D6:E7:F8`,
      model: lead.interestedProduct,
      businessName: lead.businessName,
      category: lead.rubro,
      district: lead.district,
      address: lead.address,
      contactName: lead.contactName,
      contactPhone: lead.phone,
      placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      fallbackShortUrl: `https://linkeocards.com/r/${lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      assignedDate: new Date().toISOString().slice(0, 10),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Activa',
      saleId: newSale.id,
      history: [
        {
          date: new Date().toLocaleString('es-PE'),
          author: lead.assignedTo === 'luis' ? 'Luis Romero' : 'Kevin Servat',
          action: 'Conversión exitosa desde el pipeline B2B.'
        }
      ]
    };

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'entregado' } : l));
    setSales([newSale, ...sales]);
    setNfcCards([newCard, ...nfcCards]);

    setInventory(prev => prev.map(item => {
      if (item.sku === 'SKU-NTAG215-RAW') {
        return { ...item, quantity: Math.max(0, item.quantity - 1) };
      }
      return item;
    }));

    logAudit({
      actionType: 'Creación',
      entityType: 'Venta',
      entityId: newSale.saleNumber,
      entityName: `${lead.businessName} (Lead Convertido)`,
      reason: `Conversión de prospecto B2B a venta cobrada. Tarjeta generada: ${cardId}`
    });
  };

  // Handlers para Agenda y Citas (Full CRUD)
  const handleAddNewEvent = (newEvent) => {
    setCalendarEvents([newEvent, ...calendarEvents]);
    if (isSupabaseConfigured) {
      dbService.insert('calendar_events', newEvent, mappers.eventToDb);
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Evento',
      entityId: newEvent.id,
      entityName: newEvent.title,
      reason: `Cita programada para el ${newEvent.date} a las ${newEvent.startTime} (${newEvent.partner}).`
    });
  };

  const handleEditEvent = (updatedEvent) => {
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
  const handleTogglePlanTask = (day) => {
    const task = plan30Days.find(t => t.day === day);
    const newStatus = !task?.completed;
    setPlan30Days(prev => prev.map(t => t.day === day ? { ...t, completed: newStatus } : t));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Plan 30 Días',
      entityId: `dia-${day}`,
      entityName: `Día ${day}: ${task?.action}`,
      reason: `Hito marcado como ${newStatus ? 'Completado' : 'Pendiente'}.`
    });
  };

  const handleAddPlanTask = (newTask) => {
    setPlan30Days([...plan30Days, newTask]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Plan 30 Días',
      entityId: `dia-${newTask.day}`,
      entityName: `Día ${newTask.day}: ${newTask.action}`,
      reason: `Nueva tarea agregada a la Semana ${newTask.week} del Plan.`
    });
  };

  const handleEditPlanTask = (updatedTask) => {
    setPlan30Days(prev => prev.map(t => t.day === updatedTask.day ? updatedTask : t));
    logAudit({
      actionType: 'Modificación',
      entityType: 'Plan 30 Días',
      entityId: `dia-${updatedTask.day}`,
      entityName: `Día ${updatedTask.day}: ${updatedTask.action}`,
      reason: `Modificación de meta, canal o responsable de tarea del plan.`
    });
  };

  // Handlers para Fases del Proyecto ERP
  const handleToggleDeliverable = (phaseId, delId) => {
    setProjectPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        const updatedDels = phase.deliverables.map(d => d.id === delId ? { ...d, completed: !d.completed } : d);
        const compCount = updatedDels.filter(d => d.completed).length;
        const newPct = Math.round((compCount / updatedDels.length) * 100);
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

  const handleAddDeliverable = (phaseId, newDel) => {
    setProjectPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        const updated = [...(phase.deliverables || []), newDel];
        const compCount = updated.filter(d => d.completed).length;
        return {
          ...phase,
          deliverables: updated,
          progress: Math.round((compCount / updated.length) * 100)
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
  const handleAddDistrict = (newDist) => {
    setDistricts([...districts, newDist]);
    if (isSupabaseConfigured) {
      dbService.insert('districts', { name: newDist });
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Distrito',
      entityId: newDist,
      entityName: `Distrito: ${newDist}`,
      reason: `Nuevo distrito agregado al maestro de Lima.`
    });
  };

  const handleDeleteDistrict = (distToDelete) => {
    setDistricts(districts.filter(d => d !== distToDelete));
    logAudit({
      actionType: 'Eliminación',
      entityType: 'Distrito',
      entityId: distToDelete,
      entityName: `Distrito: ${distToDelete}`,
      reason: `Distrito retirado del maestro central.`
    });
  };

  // Handlers para Inventario y Productos
  const handleUpdateInventoryStock = (itemId, delta) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        logAudit({
          actionType: 'Modificación',
          entityType: 'Insumo',
          entityId: item.sku,
          entityName: item.name,
          reason: `Ajuste manual de stock (${delta > 0 ? '+' : ''}${delta}). Nuevo stock: ${newQty} uds.`
        });
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleAddNewInventoryItem = (newItem) => {
    setInventory([...inventory, newItem]);
    logAudit({
      actionType: 'Creación',
      entityType: 'Insumo',
      entityId: newItem.sku,
      entityName: newItem.name,
      reason: `Nuevo SKU agregado al almacén con stock inicial de ${newItem.quantity} uds.`
    });
  };

  const handleAddNewProduct = (newProd) => {
    setProducts([...products, newProd]);
    if (isSupabaseConfigured) {
      dbService.insert('products', newProd, mappers.productToDb);
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Producto',
      entityId: newProd.id,
      entityName: newProd.name,
      reason: `Nuevo modelo o pack agregado al catálogo por S/ ${Number(newProd.price).toFixed(2)}.`
    });
  };

  // Handlers para Proveedores (Full CRUD & Auditoría)
  const handleAddNewSupplier = (newSup) => {
    setSuppliers([newSup, ...suppliers]);
    if (isSupabaseConfigured) {
      dbService.insert('suppliers', newSup, mappers.supplierToDb);
    }
    logAudit({
      actionType: 'Creación',
      entityType: 'Proveedor',
      entityId: newSup.id,
      entityName: newSup.name,
      reason: `Nuevo proveedor registrado para suministrar: ${newSup.itemSupplied || 'Insumos varios'}.`
    });
  };

  const handleEditSupplier = (updatedSup) => {
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

  const handleConfirmDelete = ({ item, entityType, reason, deletedBy }) => {
    let cascadeDetails = '';

    if (entityType === 'Venta') {
      // 1. Eliminar la venta
      setSales(prev => prev.filter(s => s.id !== item.id));

      // 2. Desvincular / Eliminar tarjeta NFC asociada
      if (item.cardIds && item.cardIds.length > 0) {
        const cardId = item.cardIds[0];
        setNfcCards(prev => prev.filter(c => c.id !== cardId));
        cascadeDetails += ` [Cascada: Tarjeta NFC ${cardId} desvinculada y eliminada]`;
      }

      // 3. Devolver la unidad física al inventario (reversión de stock)
      setInventory(prev => prev.map(inv => {
        if (inv.sku === 'SKU-NTAG215-RAW') {
          return { ...inv, quantity: inv.quantity + (Number(item.quantity) || 1) };
        }
        return inv;
      }));
      cascadeDetails += ` [Cascada: ${item.quantity || 1} tarjeta virgen devuelta al inventario físico]`;

    } else if (entityType === 'Gasto') {
      setExpenses(prev => prev.filter(e => e.id !== item.id));
      cascadeDetails += ` [Cascada: Balance 50/50 recalculado automáticamente]`;

    } else if (entityType === 'Lead') {
      setLeads(prev => prev.filter(l => l.id !== item.id));

    } else if (entityType === 'Tarjeta NFC') {
      setNfcCards(prev => prev.filter(c => c.id !== item.id));

    } else if (entityType === 'Insumo') {
      setInventory(prev => prev.filter(i => i.id !== item.id));

    } else if (entityType === 'Producto') {
      setProducts(prev => prev.filter(p => p.id !== item.id));

    } else if (entityType === 'Proveedor') {
      setSuppliers(prev => prev.filter(s => s.id !== item.id));

    } else if (entityType === 'Evento') {
      setCalendarEvents(prev => prev.filter(e => e.id !== item.id));
    }

    if (isSupabaseConfigured && item?.id) {
      const tableMap = {
        'Venta': 'sales',
        'Gasto': 'expenses',
        'Lead': 'leads',
        'Tarjeta NFC': 'nfc_cards',
        'Insumo': 'inventory',
        'Producto': 'products',
        'Proveedor': 'suppliers',
        'Evento': 'calendar_events'
      };
      if (tableMap[entityType]) {
        dbService.delete(tableMap[entityType], item.id);
      }
    } else if (entityType === 'Plan 30 Días') {
      setPlan30Days(prev => prev.filter(t => t.day !== item.day));

    } else if (entityType === 'Entregable') {
      setProjectPhases(prev => prev.map(phase => ({
        ...phase,
        deliverables: (phase.deliverables || []).filter(d => d.id !== item.id)
      })));
    }

    // Registrar en auditoría
    const finalReason = `${reason}${cascadeDetails}`;
    const authorId = deletedBy || (currentUser ? currentUser.id : 'luis');
    const authorName = deletedByName || (currentUser ? currentUser.name : (authorId === 'kevin' ? 'Kevin Servat' : 'Luis Romero'));

    logAudit({
      actionType: 'Eliminación',
      entityType,
      entityId: item.id || item.sku || item.saleNumber || item.chipUid || `dia-${item.day}` || '',
      entityName: item.name || item.businessName || item.title || item.action || item.description || item.saleNumber || 'Elemento',
      reason: finalReason,
      snapshot: item,
      author: authorId,
      authorName: authorName,
      deletedBy: authorId,
      deletedByName: authorName
    });

    setDeleteModalConfig({ isOpen: false, item: null, entityType: '' });
  };

  // Restauración de Auditoría
  const handleRestoreItem = (auditLog) => {
    if (!auditLog || !auditLog.snapshot) return;

    if (auditLog.entityType === 'Producto') {
      setProducts(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Gasto') {
      setExpenses(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Venta') {
      setSales(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Lead') {
      setLeads(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Tarjeta NFC') {
      setNfcCards(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Insumo') {
      setInventory(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Evento') {
      setCalendarEvents(prev => [auditLog.snapshot, ...prev]);
    } else if (auditLog.entityType === 'Plan 30 Días') {
      setPlan30Days(prev => [...prev, auditLog.snapshot]);
    }

    setAuditLogs(prev => prev.map(log => 
      log.id === auditLog.id ? { ...log, restorable: false, reason: `${log.reason} [RESTAURADO]` } : log
    ));
  };

  const handleSettlePartnerDebt = ({ amount, note, fromPartner, toPartner }) => {
    const settleExp = {
      id: `settle-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Liquidación',
      category: 'Cuadre entre socios',
      description: `Liquidación de saldo: ${fromPartner === 'luis' ? 'Luis Romero' : 'Kevin Servat'} transfirió a ${toPartner === 'kevin' ? 'Kevin Servat' : 'Luis Romero'}`,
      amount: amount,
      paymentMethod: 'Transferencia BCP / Yape',
      paidBy: fromPartner,
      month: 'sep-2026',
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

  const handleExportExcel = () => {
    exportLinkeoGesToExcel({
      sales,
      expenses,
      nfcCards,
      inventory,
      leads,
      plan30Days,
      targets: FINANCIAL_TARGETS
    });
  };

  return (
    <div className="app-container">
      {/* Modal de Login (si no hay sesión) */}
      {!currentUser && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Modal de Perfil de Usuario */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          currentStatus={partnersState[currentUser?.id]?.status || 'Disponible'}
          onStatusChange={(newStatus) => {
            setPartnersState(prev => ({
              ...prev,
              [currentUser.id]: { ...prev[currentUser.id], status: newStatus }
            }));
            logAudit({
              actionType: 'Modificación',
              entityType: 'Perfil Socio',
              entityId: currentUser?.id,
              entityName: `${currentUser?.name} (Estado: ${newStatus})`,
              reason: `Cambio manual de estado operativo a ${newStatus}.`
            });
          }}
          onLogout={handleLogout}
          partnerBalance={partnerBalance}
        />
      )}

      {/* Modal de Maestro de Distritos */}
      <MasterDataModal
        isOpen={isMasterDataModalOpen}
        onClose={() => setIsMasterDataModalOpen(false)}
        districts={districts}
        onAddDistrict={handleAddDistrict}
        onDeleteDistrict={handleDeleteDistrict}
      />

      {/* Sidebar de Navegación Lateral */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab}
        nfcCardsCount={nfcCards.length}
        leadsCount={leads.filter(l => l.stage !== 'entregado' && l.stage !== 'postventa').length}
        inventoryAlertsCount={inventory.filter(i => i.quantity <= i.minThreshold).length}
        auditLogsCount={auditLogs.length}
        productsCount={products.length}
        partnerBalance={partnerBalance}
        expenses={expenses}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onOpenMasterData={() => setIsMasterDataModalOpen(true)}
      />

      {/* Contenido Principal */}
      <div className="main-content">
        <Navbar 
          currentTheme={theme}
          toggleTheme={toggleTheme}
          partnersState={partnersState}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onPartnerStatusChange={(pId, status) => {
            setPartnersState(prev => ({
              ...prev,
              [pId]: { ...prev[pId], status }
            }));
          }}
          onOpenNewSale={() => setIsNewSaleModalOpen(true)}
          onOpenNewExpense={() => setIsNewExpenseModalOpen(true)}
          onOpenNewNfc={() => setCurrentTab('nfc-traceability')}
          onExportExcel={handleExportExcel}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenMasterData={() => setIsMasterDataModalOpen(true)}
          onResetToZero={handleResetToZero}
          onLoadDemoData={handleLoadDemoData}
          isCloudReady={isSupabaseConfigured}
        />

        <main className="content-body">
          {/* MÓDULO 1: Dashboard General */}
          {currentTab === 'dashboard' && (
            <DashboardView 
              sales={sales}
              expenses={expenses}
              nfcCards={nfcCards}
              inventory={inventory}
              leads={leads}
              targets={FINANCIAL_TARGETS}
              partnerBalance={partnerBalance}
              setCurrentTab={setCurrentTab}
              onOpenCardDetails={(card) => {
                setSelectedCardModal(card);
                setCurrentTab('nfc-traceability');
              }}
              onOpenNewSale={() => setIsNewSaleModalOpen(true)}
              onOpenNewExpense={() => setIsNewExpenseModalOpen(true)}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {/* MÓDULO 2: Gestión de Proyecto (5 Fases ERP) */}
          {currentTab === 'lifecycle' && (
            <ProjectLifecycleView 
              projectPhases={projectPhases}
              onToggleDeliverable={handleToggleDeliverable}
              onAddDeliverable={handleAddDeliverable}
              onEditDeliverable={handleEditDeliverable}
              onDeleteDeliverable={(phaseId, del) => handleRequestDelete(del, 'Entregable')}
              currentUser={currentUser}
            />
          )}

          {/* MÓDULO 3: Trazabilidad Chips NFC */}
          {currentTab === 'nfc-traceability' && (
            <NfcTraceabilityView 
              nfcCards={nfcCards}
              products={products}
              inventory={inventory}
              onUpdateCard={handleUpdateCard}
              onAddNewCard={handleAddNewCard}
              selectedCardModal={selectedCardModal}
              setSelectedCardModal={setSelectedCardModal}
              onRequestDelete={handleRequestDelete}
              onUpdateInventoryStock={handleUpdateInventoryStock}
            />
          )}

          {/* MÓDULO 4: Pipeline B2B (Kanban) */}
          {currentTab === 'pipeline' && (
            <KanbanView 
              leads={leads}
              onUpdateLeadStage={handleUpdateLeadStage}
              onAddNewLead={handleAddNewLead}
              onConvertLeadToSale={handleConvertLeadToSale}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {/* MÓDULO 5: Agenda & Coordinación de Visitas */}
          {currentTab === 'calendar' && (
            <CalendarView 
              events={calendarEvents}
              onAddNewEvent={handleAddNewEvent}
              onEditEvent={handleEditEvent}
              nfcCards={nfcCards}
              onRequestDelete={handleRequestDelete}
              districts={districts}
            />
          )}

          {/* MÓDULO 6: Inventario & Proveedores */}
          {currentTab === 'inventory' && (
            <InventoryView 
              inventory={inventory}
              suppliers={suppliers}
              onUpdateInventoryStock={handleUpdateInventoryStock}
              onAddNewInventoryItem={handleAddNewInventoryItem}
              onAddNewSupplier={handleAddNewSupplier}
              onEditSupplier={handleEditSupplier}
              onOpenNewExpense={() => setIsNewExpenseModalOpen(true)}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {/* MÓDULO 7: Finanzas & Balances 50/50 */}
          {currentTab === 'finances' && (
            <FinanceView 
              sales={sales}
              expenses={expenses}
              products={products}
              inventory={inventory}
              onAddNewExpense={handleAddNewExpense}
              onAddNewSale={() => setIsNewSaleModalOpen(true)}
              onExportExcel={handleExportExcel}
              partnerBalance={partnerBalance}
              onSettlePartnerDebt={handleSettlePartnerDebt}
              targets={FINANCIAL_TARGETS}
              onRequestDelete={handleRequestDelete}
              onAddNewProduct={handleAddNewProduct}
              onUpdateInventoryStock={handleUpdateInventoryStock}
            />
          )}

          {/* MÓDULO 8: Proyecciones, Costos & Metas (Escenario Libre & Plan 30 Días) */}
          {currentTab === 'projections' && (
            <ProjectionsView 
              projectionsData={projectionsData}
              onUpdateProjectionsData={setProjectionsData}
              products={products}
              inventory={inventory}
              plan30Days={plan30Days}
              setPlan30Days={setPlan30Days}
              onTogglePlanTask={handleTogglePlanTask}
              onAddPlanTask={handleAddPlanTask}
              onEditPlanTask={handleEditPlanTask}
              onRequestDelete={handleRequestDelete}
              setCurrentTab={setCurrentTab}
            />
          )}

          {/* MÓDULO 9: Catálogo de Productos */}
          {currentTab === 'products' && (
            <ProductsCatalogView 
              products={products}
              onAddNewProduct={handleAddNewProduct}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {/* MÓDULO 9: Bitácora de Auditoría */}
          {currentTab === 'audit' && (
            <AuditView 
              auditLogs={auditLogs}
              onRestoreItem={handleRestoreItem}
            />
          )}
        </main>
      </div>

      {/* MODAL GLOBAL: Nueva Venta */}
      {isNewSaleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewSaleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nueva Venta | LinkeoGes</h3>
              <button className="close-btn" onClick={() => setIsNewSaleModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddNewSale}>
              <div className="form-group">
                <label className="form-label">Nombre del Negocio / Cliente:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Barbería Don Tito, Pollería Roky's..."
                  value={newSaleForm.clientName}
                  onChange={(e) => setNewSaleForm({ ...newSaleForm, clientName: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Producto o Pack:</label>
                  <select 
                    className="form-control"
                    value={newSaleForm.productId}
                    onChange={(e) => setNewSaleForm({ ...newSaleForm, productId: e.target.value })}
                    required
                  >
                    {products.length === 0 ? (
                      <option value="">(Sin productos — Agrega en Catálogo)</option>
                    ) : (
                      products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — S/ {p.price.toFixed(2)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad:</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="form-control"
                    value={newSaleForm.quantity}
                    onChange={(e) => setNewSaleForm({ ...newSaleForm, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Panel de Precios de Almacén y Opción de Modificar Costo / Precio */}
              {(() => {
                const currentProd = products.find(p => p.id === newSaleForm.productId) || products[0];
                const defaultPrice = currentProd ? Number(currentProd.price || 0) : 0;
                const defaultCost = currentProd ? Number(currentProd.cost || 0) : 0;
                const currentUnitPrice = (newSaleForm.isCustomPricing && newSaleForm.customUnitPrice !== '') 
                  ? Number(newSaleForm.customUnitPrice) 
                  : defaultPrice;
                const currentUnitCost = (newSaleForm.isCustomPricing && newSaleForm.customUnitCost !== '') 
                  ? Number(newSaleForm.customUnitCost) 
                  : defaultCost;
                const qty = Number(newSaleForm.quantity) || 1;
                const currentTotal = (currentUnitPrice * qty).toFixed(2);
                const currentProfit = ((currentUnitPrice - currentUnitCost) * qty).toFixed(2);

                return (
                  <div 
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(0, 102, 255, 0.06)',
                      border: '1px solid rgba(0, 102, 255, 0.22)',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🏷️ Catálogo Oficial: Venta S/ {defaultPrice.toFixed(2)} | Insumo S/ {defaultCost.toFixed(2)}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => {
                          setNewSaleForm(prev => ({
                            ...prev,
                            isCustomPricing: !prev.isCustomPricing,
                            customUnitPrice: !prev.isCustomPricing ? defaultPrice.toString() : '',
                            customUnitCost: !prev.isCustomPricing ? defaultCost.toString() : ''
                          }));
                        }}
                      >
                        <Edit3 size={13} />
                        <span>{newSaleForm.isCustomPricing ? 'Restablecer precios por defecto' : 'Modificar costo / precio'}</span>
                      </button>
                    </div>

                    {newSaleForm.isCustomPricing && (
                      <div className="form-row" style={{ marginTop: '10px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.76rem' }}>Precio Unitario de Venta Modificado (S/):</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control"
                            value={newSaleForm.customUnitPrice}
                            onChange={(e) => setNewSaleForm({ ...newSaleForm, customUnitPrice: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.76rem' }}>Costo Unitario Insumo Modificado (S/):</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="form-control"
                            value={newSaleForm.customUnitCost}
                            onChange={(e) => setNewSaleForm({ ...newSaleForm, customUnitCost: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Total Cobro ({qty} uds): <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>S/ {currentTotal}</strong>
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Margen Bruto Linkeo: <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>S/ {currentProfit}</strong>
                      </span>
                    </div>

                    {newSaleForm.isCustomPricing && (
                      <div style={{ fontSize: '0.73rem', color: '#38bdf8', marginTop: '6px' }}>
                        ✏️ Precio y costo personalizados para esta transacción. El catálogo maestro no se altera.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Distrito de Lima (Maestro Central):</label>
                  <select 
                    className="form-control"
                    value={newSaleForm.district}
                    onChange={(e) => setNewSaleForm({ ...newSaleForm, district: e.target.value })}
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago:</label>
                  <select 
                    className="form-control"
                    value={newSaleForm.paymentMethod}
                    onChange={(e) => setNewSaleForm({ ...newSaleForm, paymentMethod: e.target.value })}
                  >
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
                <input 
                  type="text" 
                  className="form-control code-mono"
                  placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                  value={newSaleForm.googlePlaceId}
                  onChange={(e) => setNewSaleForm({ ...newSaleForm, googlePlaceId: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contacto (WhatsApp):</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="+51 987 654 321"
                    value={newSaleForm.phone}
                    onChange={(e) => setNewSaleForm({ ...newSaleForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vendedor / Socio Responsable:</label>
                  <select 
                    className="form-control"
                    value={newSaleForm.soldBy}
                    onChange={(e) => setNewSaleForm({ ...newSaleForm, soldBy: e.target.value })}
                  >
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewSaleModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Venta & Chip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: Nuevo Gasto */}
      {isNewExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewExpenseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Gasto Operativo</h3>
              <button className="close-btn" onClick={() => setIsNewExpenseModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const finalAmount = Number(globalExpenseForm.amount) || 0;
              handleAddNewExpense({
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

              if (globalExpenseForm.selectedProductId && handleUpdateInventoryStock) {
                handleUpdateInventoryStock(globalExpenseForm.selectedProductId, Number(globalExpenseForm.quantity) || 1);
              }

              setIsNewExpenseModalOpen(false);
              const today = new Date().toISOString().slice(0, 10);
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
            }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha del Desembolso:</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={globalExpenseForm.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setGlobalExpenseForm({
                        ...globalExpenseForm,
                        date: newDate,
                        month: getAccountingMonth(newDate)
                      });
                    }}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría:</label>
                  <select 
                    className="form-control"
                    value={globalExpenseForm.category}
                    onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, category: e.target.value })}
                  >
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    📦 Cargar Producto / Insumo de Almacén (Opcional):
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {products.length} productos en catálogo
                  </span>
                </div>
                <select 
                  className="form-control"
                  value={globalExpenseForm.selectedProductId}
                  onChange={(e) => handleGlobalProductChange(e.target.value)}
                >
                  <option value="">— Escribir gasto libre o seleccionar producto de Almacén —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      📦 {p.name} — Costo por default: S/ {Number(p.cost).toFixed(2)} | Venta: S/ {Number(p.price).toFixed(2)}
                    </option>
                  ))}
                  {inventory.filter(i => !products.some(p => p.name === i.name)).map(i => (
                    <option key={i.id} value={i.id}>
                      🏷️ {i.name} — Costo unitario: S/ {Number(i.unitCost).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción del Gasto:</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Tarjeta Google NFC Cuadrado, Displays de Acrílico..."
                  value={globalExpenseForm.description}
                  onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, description: e.target.value })}
                  required 
                />
              </div>

              {/* Panel de Costo Unitario y Opción de Modificar Costo */}
              {globalExpenseForm.selectedProductId ? (
                <div 
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(0, 102, 255, 0.06)',
                    border: '1px solid rgba(0, 102, 255, 0.22)',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🏷️ Costo por Defecto de Almacén: S/ {Number(globalExpenseForm.unitCost || 0).toFixed(2)}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => setGlobalExpenseForm(prev => ({ ...prev, isCustomCost: !prev.isCustomCost }))}
                    >
                      <Edit3 size={13} />
                      <span>{globalExpenseForm.isCustomCost ? 'Restablecer costo por defecto' : 'Modificar costo'}</span>
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Cantidad de Unidades:</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-control"
                        value={globalExpenseForm.quantity}
                        onChange={(e) => {
                          const qty = Math.max(1, parseInt(e.target.value) || 1);
                          const unit = Number(globalExpenseForm.unitCost) || 0;
                          setGlobalExpenseForm({ ...globalExpenseForm, quantity: qty, amount: (qty * unit).toFixed(2) });
                        }}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>
                        {globalExpenseForm.isCustomCost ? 'Costo Unitario Modificado (S/):' : 'Costo Unitario Aplicado (S/):'}
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control"
                        value={globalExpenseForm.unitCost}
                        readOnly={!globalExpenseForm.isCustomCost}
                        style={{
                          backgroundColor: globalExpenseForm.isCustomCost ? 'var(--bg-input)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: globalExpenseForm.isCustomCost ? 'var(--primary-600)' : 'var(--border-subtle)',
                          fontWeight: 700
                        }}
                        onChange={(e) => {
                          const unit = e.target.value;
                          const qty = Number(globalExpenseForm.quantity) || 1;
                          setGlobalExpenseForm({ ...globalExpenseForm, unitCost: unit, amount: (Number(unit) * qty).toFixed(2) });
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total del desembolso ({globalExpenseForm.quantity} uds × S/ {Number(globalExpenseForm.unitCost || 0).toFixed(2)}):
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#ef4444' }}>
                      S/ {globalExpenseForm.amount}
                    </strong>
                  </div>

                  {globalExpenseForm.isCustomCost && (
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                      ✏️ Costo modificado exclusivamente para este registro de compra sin alterar el catálogo maestro.
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Monto del Desembolso (Soles S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    placeholder="0.00" 
                    value={globalExpenseForm.amount}
                    onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, amount: e.target.value })}
                    required 
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">¿Quién pagó el gasto?:</label>
                  <select 
                    className="form-control" 
                    value={globalExpenseForm.paidBy}
                    onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, paidBy: e.target.value })}
                  >
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Método de Pago:</label>
                  <select 
                    className="form-control"
                    value={globalExpenseForm.paymentMethod}
                    onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, paymentMethod: e.target.value })}
                  >
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
                <select 
                  className="form-control"
                  value={globalExpenseForm.month}
                  onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, month: e.target.value })}
                  required
                >
                  {ACCOUNTING_MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  ✓ Sincronizado automáticamente con la fecha de desembolso ({globalExpenseForm.date}).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Notas / Detalle de Cuadre:</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  placeholder="Detalles de liquidación, factura o comprobante..."
                  value={globalExpenseForm.notes}
                  onChange={(e) => setGlobalExpenseForm({ ...globalExpenseForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewExpenseModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: Confirmación y Justificación de Auditoría para Eliminaciones */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        item={deleteModalConfig.item}
        entityType={deleteModalConfig.entityType}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalConfig({ isOpen: false, item: null, entityType: '' })}
        currentUser={currentUser}
      />
    </div>
  );
}
