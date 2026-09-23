// Datos maestros iniciales de LinkeoGes
// Extraídos directamente de Control de Gastos NFC.xlsx, linkeocards.com y los flyers oficiales

export const PARTNERS = {
  luis: {
    id: 'luis',
    name: 'Luis Romero',
    role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
    email: 'luis@linkeocards.com',
    avatar: '👨‍💼',
    status: 'Disponible'
  },
  kevin: {
    id: 'kevin',
    name: 'Kevin Servat',
    role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
    email: 'kevin@linkeocards.com',
    avatar: '🚀',
    status: 'Disponible'
  }
};

export const INITIAL_EXPENSES = [];
export const INITIAL_SALES = [];
export const INITIAL_NFC_CARDS = [];
export const INITIAL_LEADS = [];

export const INITIAL_INVENTORY = [
  {
    id: 'inv-1',
    sku: 'SKU-LNK-1367',
    name: 'Tarjeta Google NFC Cuadrado ING',
    category: 'CHIPS / INSUMOS',
    quantity: 1,
    minThreshold: 10,
    unitCost: 60.00,
    supplier: 'HACHANI_UN Official Store',
    leadTimeDays: 13,
    status: 'bajo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo de tarjeta cuadrada con chip NTAG215 versión inglés.'
  },
  {
    id: 'inv-2',
    sku: 'SKU-LNK-6781',
    name: 'Tarjeta Google NFC Cuadrado ESP',
    category: 'CHIPS / INSUMOS',
    quantity: 2,
    minThreshold: 10,
    unitCost: 60.00,
    supplier: 'NFC Marketing',
    leadTimeDays: 13,
    status: 'bajo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo de tarjeta cuadrada con chip NTAG215 versión español.'
  },
  {
    id: 'inv-3',
    sku: 'SKU-LNK-9972',
    name: 'Tarjeta Google NFC L ESP',
    category: 'CHIPS / INSUMOS',
    quantity: 2,
    minThreshold: 10,
    unitCost: 80.00,
    supplier: 'NFC Marketing',
    leadTimeDays: 13,
    status: 'bajo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo formato vertical L para mostrador y mesa con chip NTAG215.'
  },
  {
    id: 'inv-4',
    sku: 'SKU-LNK-BASE',
    name: 'Base Acrílica Display de Mesa',
    category: 'DISPLAY / SOPORTE',
    quantity: 15,
    minThreshold: 5,
    unitCost: 10.00,
    supplier: 'Acrílicos Lima Centro',
    leadTimeDays: 2,
    status: 'optimo',
    reorderUrl: '',
    notes: 'Soporte transparente para exhibición de tarjetas en barras y recepción.'
  },
  {
    id: 'inv-5',
    sku: 'SKU-LNK-PKGK',
    name: 'Kit de Packaging & Sobres Premium',
    category: 'PACKAGING / EMPAQUE',
    quantity: 40,
    minThreshold: 10,
    unitCost: 3.00,
    supplier: 'Empaques Express Lima',
    leadTimeDays: 1,
    status: 'optimo',
    reorderUrl: '',
    notes: 'Sobre negro mate con sticker holográfico oficial Linkeo.'
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-ind-1',
    name: 'Tarjeta Google NFC Cuadrado ESP',
    sku: 'SKU-LNK-6781',
    category: 'Modelos Individuales',
    type: 'individual',
    price: 60.00,
    cost: 13.00,
    margin: 47.00,
    marginPct: 78.33,
    badge: 'Popular',
    description: 'Tarjeta inteligente con chip NTAG215 para reseñas de Google en español. Diseñada para mostrador y barras de restaurantes.',
    bundleItems: []
  },
  {
    id: 'prod-ind-2',
    name: 'Tarjeta Google NFC Formato L ESP',
    sku: 'SKU-LNK-9972',
    category: 'Modelos Individuales',
    type: 'individual',
    price: 80.00,
    cost: 13.00,
    margin: 67.00,
    marginPct: 83.75,
    badge: 'Premium',
    description: 'Display vertical en ángulo L de alto impacto visual para caja y recepción con reseña directa de Google Maps.',
    bundleItems: []
  },
  {
    id: 'prod-pack-1',
    name: 'Pack Restaurante Dúo (2 Tarjetas NFC)',
    sku: 'SKU-PACK-DUO',
    category: 'Packs Promocionales',
    type: 'pack',
    price: 100.00,
    cost: 26.00,
    margin: 74.00,
    marginPct: 74.00,
    badge: 'Ahorro S/ 20',
    description: 'Promoción especial para locales con dos puntos de contacto (Caja + Barra). Incluye 2 tarjetas inteligentes configuradas.',
    bundleItems: [
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 2 }
    ]
  },
  {
    id: 'prod-pack-2',
    name: 'Combo Corporativo Trío (3 Tarjetas + Display)',
    sku: 'SKU-PACK-TRIO',
    category: 'Packs Promocionales',
    type: 'pack',
    price: 160.00,
    cost: 49.00,
    margin: 111.00,
    marginPct: 69.38,
    badge: 'Más Vendido',
    description: 'Combo empresarial: 2 Tarjetas Cuadradas + 1 Tarjeta Formato L + 1 Base acrílica para locales gastronómicos o retail.',
    bundleItems: [
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 2 },
      { id: 'inv-3', sku: 'SKU-LNK-9972', name: 'Tarjeta Google NFC L ESP', quantity: 1 },
      { id: 'inv-4', sku: 'SKU-LNK-BASE', name: 'Base Acrílica Display de Mesa', quantity: 1 }
    ]
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'supp-1',
    name: 'HACHANI_UN Official Store',
    category: 'Importador AliExpress (China)',
    contactPerson: 'AliExpress Direct',
    phone: '+86 138 0000 0000',
    email: 'support@aliexpress.com',
    country: 'China',
    leadTimeDays: 13,
    minOrderQty: 10,
    status: 'Activo',
    paymentTerms: 'Tarjeta de Crédito / PayPal',
    notes: 'Chips NTAG215 vírgenes y acrílicos grabados por lote.'
  },
  {
    id: 'supp-2',
    name: 'NFC Marketing',
    category: 'Distribuidor Especializado NFC',
    contactPerson: 'Ventas Lima',
    phone: '+51 987 654 321',
    email: 'ventas@nfcmarketing.pe',
    country: 'Perú',
    leadTimeDays: 2,
    minOrderQty: 5,
    status: 'Activo',
    paymentTerms: 'Transferencia BCP / Yape',
    notes: 'Insumos de entrega rápida local en Lima.'
  },
  {
    id: 'supp-3',
    name: 'Acrílicos Lima Centro',
    category: 'Fabricante de Bases y Displays',
    contactPerson: 'Taller San Juan',
    phone: '+51 999 111 222',
    email: 'pedidos@acrilicoslima.pe',
    country: 'Perú',
    leadTimeDays: 2,
    minOrderQty: 10,
    status: 'Activo',
    paymentTerms: 'Contado 50% adelanto',
    notes: 'Corte láser y doblado en caliente de acrílico cristal 3mm.'
  }
];

// Plantilla de referencia con las 27 tareas estratégicas del Excel Control de Gastos NFC.xlsx
export const EXCEL_PLAN_30_DAYS_TEMPLATE = [
  { day: 1, week: 1, action: 'Definir oferta, precios y condiciones', target: 'Oferta final escrita', channel: 'Gestión', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 2, week: 1, action: 'Configurar 2 muestras con negocios de prueba', target: '2 muestras funcionando', channel: 'Producto', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 3, week: 1, action: 'Grabar video demostrativo vertical', target: '1 video de 10–15 s', channel: 'Contenido', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 4, week: 1, action: 'Tomar fotos claras de ambos modelos', target: '5 fotos utilizables', channel: 'Contenido', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 5, week: 1, action: 'Crear catálogo de WhatsApp y perfiles', target: 'Catálogo publicado', channel: 'Digital', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 6, week: 1, action: 'Preparar guion de venta y respuestas', target: '1 guion + 8 objeciones', channel: 'Ventas', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 7, week: 1, action: 'Construir lista de prospectos', target: '50 negocios', channel: 'Prospección', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 8, week: 2, action: 'Contactar negocios por Instagram/WhatsApp', target: '15 contactos', channel: 'Mensajes', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 9, week: 2, action: 'Visitar negocios cercanos con muestra', target: '5 visitas', channel: 'Presencial', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 10, week: 2, action: 'Dar seguimiento a interesados', target: '10 seguimientos', channel: 'Mensajes', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 11, week: 2, action: 'Contactar nuevos prospectos', target: '15 contactos', channel: 'Mensajes', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 12, week: 2, action: 'Visitar segunda zona comercial', target: '5 visitas', channel: 'Presencial', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 13, week: 2, action: 'Publicar demostración y caso de uso', target: '1 publicación', channel: 'Contenido', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 14, week: 2, action: 'Revisar conversiones y objeciones', target: 'Resumen semanal', channel: 'Gestión', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 15, week: 3, action: 'Contactar nuevos prospectos', target: '20 contactos', channel: 'Mensajes', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 16, week: 3, action: 'Realizar demostraciones', target: '3 demostraciones', channel: 'Ventas', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 17, week: 3, action: 'Cerrar e instalar primeras ventas', target: '2 ventas', channel: 'Cierre', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 18, week: 3, action: 'Pedir foto y testimonio', target: '1 testimonio', channel: 'Postventa', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 19, week: 3, action: 'Ofrecer pack a negocios con 2 cajas', target: '5 propuestas', channel: 'Ventas', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 20, week: 3, action: 'Visitar negocios referidos', target: '5 visitas', channel: 'Presencial', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 21, week: 3, action: 'Revisar precio y canal ganador', target: 'Decisión documentada', channel: 'Gestión', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 22, week: 4, action: 'Duplicar prospección en rubro ganador', target: '20 contactos', channel: 'Prospección', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 23, week: 4, action: 'Publicar instalación real', target: '1 caso real', channel: 'Contenido', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 24, week: 4, action: 'Solicitar referidos a compradores', target: '5 solicitudes', channel: 'Postventa', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 25, week: 4, action: 'Realizar seguimiento de 7 días', target: '15 seguimientos', channel: 'Mensajes', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 26, week: 4, action: 'Cerrar ventas pendientes', target: '3 cierres', channel: 'Cierre', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' },
  { day: 27, week: 4, action: 'Calcular costo de conseguir cliente', target: 'Métrica actualizada', channel: 'Gestión', responsible: 'Luis Romero / Kevin Servat', completed: false, result: '' }
];

// Inicia vacío para escenario libre y registro manual progresivo
export const INITIAL_PLAN_30_DAYS = [];

export const INITIAL_CALENDAR_EVENTS = [];

export const FINANCIAL_TARGETS = {
  monthlyProfitTarget: 4000.00, // S/ 4,000 meta neta del negocio
  monthlyUnitsTarget: 75,       // 75 unidades
  targetPerPartner: 2012.50,    // S/ 2,012.50 por socio
  monthlyRevenueEstimate: 5100.00
};

export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_DISTRICTS = [
  'Miraflores',
  'San Isidro',
  'Barranco',
  'Surco',
  'San Borja',
  'Magdalena',
  'Jesús María',
  'Lince',
  'San Miguel',
  'Pueblo Libre',
  'La Molina',
  'Surquillo',
  'Lima Cercado',
  'La Victoria'
];

export const INITIAL_PROJECT_PHASES = [
  {
    id: 'fase-1',
    phaseNumber: 1,
    key: 'inicio',
    name: '1. Inicio & Definición de Negocio (Kickoff)',
    description: 'Establecimiento del modelo de negocio de tarjetas NFC para Google Reviews, reglas societarias y propuesta de valor.',
    progress: 0,
    status: 'pendiente',
    leader: 'both',
    deliverables: [
      { id: 'del-1-1', title: 'Definición de propuesta de valor: Tarjetas y displays inteligentes para reseñas Google 5 estrellas', completed: false, assignedTo: 'luis' },
      { id: 'del-1-2', title: 'Acuerdo societario 50/50: Desembolsos compartidos equitativamente y distribución neta igualitaria', completed: false, assignedTo: 'both' },
      { id: 'del-1-3', title: 'Identidad de marca y dominio linkeocards.com activo', completed: false, assignedTo: 'kevin' },
      { id: 'del-1-4', title: 'Acuerdo societario y liderazgo compartido: Luis Romero & Kevin Servat (Co-Fundadores & Co-CEOs al 50/50)', completed: false, assignedTo: 'both' }
    ]
  },
  {
    id: 'fase-2',
    phaseNumber: 2,
    key: 'planificacion',
    name: '2. Planificación Operativa & Financiera',
    description: 'Estructuración de costos, metas mensuales (S/ 5,100 / 75 uds), cadena de suministros y protocolos de agenda.',
    progress: 0,
    status: 'pendiente',
    leader: 'both',
    deliverables: [
      { id: 'del-2-1', title: 'Estructura oficial de precios: Displays S/ 60, Horizontal S/ 80, Vertical S/ 40 y Packs promocionales', completed: false, assignedTo: 'luis' },
      { id: 'del-2-2', title: 'Meta financiera: 75 unidades mensuales para alcanzar S/ 4,000 de utilidad neta libre', completed: false, assignedTo: 'both' },
      { id: 'del-2-3', title: 'Homologación de proveedores de chips NTAG215 (AliExpress) y acrílicos en Lima', completed: false, assignedTo: 'kevin' },
      { id: 'del-2-4', title: 'Protocolo de coordinación y cobertura operativa 50/50 entre Co-CEOs', completed: false, assignedTo: 'both' },
      { id: 'del-2-5', title: 'Checklist maestro de 30 días para ejecución comercial sistemática', completed: false, assignedTo: 'luis' }
    ]
  },
  {
    id: 'fase-3',
    phaseNumber: 3,
    key: 'implementacion',
    name: '3. Implementación Comercial & Técnica',
    description: 'Producción inicial, pruebas de lectura NFC en Android/iOS, pipeline B2B y despliegue del software LinkeoGes.',
    progress: 0,
    status: 'pendiente',
    leader: 'kevin',
    deliverables: [
      { id: 'del-3-1', title: 'Validación técnica de payloads NDEF para enlace directo de reseñas Google', completed: false, assignedTo: 'kevin' },
      { id: 'del-3-2', title: 'Adquisición de primer lote de prueba (15 tarjetas NTAG215 vírgenes)', completed: false, assignedTo: 'kevin' },
      { id: 'del-3-3', title: 'Construcción y despliegue del ERP/CRM LinkeoGes para control integral', completed: false, assignedTo: 'luis' },
      { id: 'del-3-4', title: 'Rutas presenciales de prospección en distritos clave (Miraflores, San Isidro, Barranco)', completed: false, assignedTo: 'both' },
      { id: 'del-3-5', title: 'Kit de empaque premium con sobres y stickers corporativos Linkeo', completed: false, assignedTo: 'kevin' }
    ]
  },
  {
    id: 'fase-4',
    phaseNumber: 4,
    key: 'monitoreo',
    name: '4. Monitoreo, Control & Auditoría',
    description: 'Conciliación periódica de cuentas 50/50, seguimiento de stock crítico, registro de auditoría y feedback de clientes.',
    progress: 0,
    status: 'pendiente',
    leader: 'both',
    deliverables: [
      { id: 'del-4-1', title: 'Algoritmo de balance y liquidación automática 50/50 en tiempo real', completed: false, assignedTo: 'luis' },
      { id: 'del-4-2', title: 'Sistema de alertas por quiebre de stock (< 20 unidades) considerando 18 días de envío', completed: false, assignedTo: 'kevin' },
      { id: 'del-4-3', title: 'Bitácora universal de auditoría con registro de bajas, ediciones y creadores', completed: false, assignedTo: 'both' },
      { id: 'del-4-4', title: 'Métricas de conversión y velocidad de ciclo de ventas en Kanban', completed: false, assignedTo: 'luis' }
    ]
  },
  {
    id: 'fase-5',
    phaseNumber: 5,
    key: 'finalizacion',
    name: '5. Cierre de Fase & Escalamiento a Nuevas Líneas',
    description: 'Consolidación del modelo en Lima, cierre contable mensual y apertura de innovaciones (menús QR, vCard, Supabase).',
    progress: 0,
    status: 'pendiente',
    leader: 'both',
    deliverables: [
      { id: 'del-5-1', title: 'Evaluación del primer mes de operación y distribución de utilidades', completed: false, assignedTo: 'both' },
      { id: 'del-5-2', title: 'Migración a base de datos persistente en nube (Supabase + Vercel con cuenta oficial Linkeo)', completed: false, assignedTo: 'both' },
      { id: 'del-5-3', title: 'Desarrollo de línea de Menús Digitales QR para restaurantes y cafeterías', completed: false, assignedTo: 'kevin' },
      { id: 'del-5-4', title: 'Desarrollo de línea de Tarjetas Personales Ejecutivas vCard NFC', completed: false, assignedTo: 'luis' },
      { id: 'del-5-5', title: 'Expansión de ventas a distritos de Lima Norte y provincias', completed: false, assignedTo: 'both' }
    ]
  }
];

// Plantillas de referencia extraídas de Control de Gastos NFC.xlsx
export const EXCEL_FIXED_COSTS_TEMPLATE = [
  { id: 'fc-1', concept: 'Publicidad (Ads Meta/TikTok)', amount: 0, note: 'Presupuesto de prueba digital' },
  { id: 'fc-2', concept: 'Movilidad para visitas presenciales', amount: 0, note: 'Prospección en distritos de Lima' },
  { id: 'fc-3', concept: 'Teléfono / Datos móviles', amount: 100, note: 'Parte atribuible al negocio' },
  { id: 'fc-4', concept: 'Dominio web / Sistemas', amount: 0, note: 'Equivalente mensual inicial' },
  { id: 'fc-5', concept: 'Material de muestra física', amount: 0, note: 'Se considera en inversión inicial' },
  { id: 'fc-6', concept: 'Otros imprevistos', amount: 0, note: 'Fondo de contingencia operativo' }
];

export const EXCEL_PROJECTED_PRODUCTS_TEMPLATE = [
  {
    id: 'proj-estandar',
    name: 'Tarjeta NFC Estándar (Reseñas Google)',
    sku: 'SKU-LNK-ESTD',
    price: 60.00,
    baseCost: 13.00,
    mixPercent: 60,
    targetUnits: 45,
    isCustom: false,
    included: true
  },
  {
    id: 'proj-premium',
    name: 'Display Acrílico / Pack Premium',
    sku: 'SKU-LNK-PREM',
    price: 80.00,
    baseCost: 13.00,
    mixPercent: 40,
    targetUnits: 30,
    isCustom: false,
    included: true
  }
];

export const EXCEL_INITIAL_INVESTMENT_TEMPLATE = [
  { id: 'inv-1', concept: 'Inventario Estándar inicial', quantity: 25, unitCost: 13.00, total: 325.00 },
  { id: 'inv-2', concept: 'Inventario Premium inicial', quantity: 25, unitCost: 13.00, total: 325.00 },
  { id: 'inv-3', concept: 'Empaques y packaging', quantity: 50, unitCost: 2.00, total: 100.00 },
  { id: 'inv-4', concept: 'Unidades de muestra operativas', quantity: 2, unitCost: 13.00, total: 26.00 },
  { id: 'inv-5', concept: 'Dominio anual linkeocards.com', quantity: 1, unitCost: 110.00, total: 110.00 },
  { id: 'inv-6', concept: 'Publicidad de lanzamiento', quantity: 1, unitCost: 300.00, total: 300.00 },
  { id: 'inv-7', concept: 'Movilidad de prospección inicial', quantity: 1, unitCost: 200.00, total: 200.00 },
  { id: 'inv-8', concept: 'Fondo de imprevistos', quantity: 1, unitCost: 100.00, total: 100.00 }
];

// Configuración base de Proyecciones: Escenario Libre con valores limpios para registro manual
export const INITIAL_PROJECTIONS_DATA = {
  // Parámetros generales del negocio (Escenario Libre)
  businessParams: {
    salesDaysPerMonth: 24,       // Lunes a sábado aprox.
    partnersCount: 2,           // Luis Romero y Kevin Servat (50/50)
    businessProfitTarget: 0,
    partnerProfitTarget: 0,
    customProfitTarget: 0       // Valor inicial en 0 para escenario libre
  },

  // Gastos Fijos Mensuales (inicia vacío)
  fixedCosts: [],

  // Costos Variables Unitarios Adicionales (inicia en 0)
  variableUnitCosts: {
    packagingPerUnit: 0.00,
    setupLaborPerUnit: 0.00,
    paymentFeePercent: 0.0,
    deliveryPerUnit: 0.00,
    defectReservePerUnit: 0.00
  },

  // Productos Proyectados Iniciales (inicia vacío)
  projectedProducts: [],

  // Inversión Inicial (inicia vacío)
  initialInvestment: [],

  // Ratios de Conversión del Embudo de Ventas
  funnelRatios: {
    contactToResponse: 0.35,  // 35% responden al contacto inicial
    responseToDemo: 0.70,     // 70% de los que responden aceptan demo/video
    demoToCustomer: 0.40,     // 40% de demos se convierten en clientes compradores
    unitsPerCustomer: 1.29    // Promedio de unidades por cliente
  }
};

