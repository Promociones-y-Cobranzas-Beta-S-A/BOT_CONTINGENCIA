// Code.gs - Backend súper optimizado para búsqueda binaria en datos ya ordenados

// ==================== CONFIGURACIÓN GLOBAL ====================
const CONFIG = {
  FILE_ID: "1rqcGlQyKsDFkmGvniP22222mLJk90Czx", // Tu ID de archivo
  CACHE_DURATION: 60 * 60 * 1000, // 1 hora en millisegundos
  BATCH_SIZE: 5000 // Procesar en lotes grandes para 434K registros
};

// ==================== CACHE GLOBAL OPTIMIZADO ====================
let datosCache = {
  registros: null,
  timestamp: null,
  fileTimestamp: null,
  estadisticas: { 
    totalRegistros: 0, 
    tiempoCarga: 0, 
    tiempoBusqueda: 0,
    busquedasRealizadas: 0
  }
};

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==================== CARGA OPTIMIZADA PARA 434K REGISTROS ====================
function cargarDatosOptimizado(fileId = null) {
  console.time('⏱️ Carga total de datos');
  
  try {
    const idArchivo = fileId || CONFIG.FILE_ID;
    const file = DriveApp.getFileById(idArchivo);
    const fileTimestamp = file.getLastUpdated().getTime();
    
    // Verificar cache válido
    const ahora = Date.now();
    const cacheValido = datosCache.timestamp && 
                       datosCache.fileTimestamp === fileTimestamp &&
                       (ahora - datosCache.timestamp) < CONFIG.CACHE_DURATION;
    
    if (cacheValido && datosCache.registros) {
      console.log('✅ Cache válido - usando datos en memoria');
      console.timeEnd('⏱️ Carga total de datos');
      return {
        success: true,
        fromCache: true,
        stats: datosCache.estadisticas
      };
    }
    
    console.log('📥 Cargando 434K registros desde Drive...');
    
    // Leer archivo completo de una vez (más rápido para archivos grandes)
    const contenido = file.getBlob().getDataAsString("UTF-8");
    
    console.time('🔄 Parsing CSV');
    // Usar Utilities.parseCsv que es más rápido para archivos grandes
    const datos = Utilities.parseCsv(contenido);
    console.timeEnd('🔄 Parsing CSV');
    
    if (datos.length === 0) {
      throw new Error('Archivo CSV vacío');
    }
    
    // Verificar headers
    const headers = datos[0];
    console.log('Headers encontrados:', headers);
    
    const columnasRequeridas = ['NRO_IDENTIFICACION', 'NOMBRE_TITULAR'];
    const columnasFaltantes = columnasRequeridas.filter(col => !headers.includes(col));
    
    if (columnasFaltantes.length > 0) {
      throw new Error(`Columnas faltantes: ${columnasFaltantes.join(', ')}`);
    }
    
    // Procesar registros optimizado (saltando header)
    console.time('📋 Procesamiento de registros');
    const registros = [];
    
    // Procesamiento directo sin conversión a objetos (más rápido)
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (fila && fila.length > 0 && fila[0]) { // Verificar que tenga NRO_IDENTIFICACION
        // Crear objeto solo con datos necesarios
        const registro = {};
        headers.forEach((header, index) => {
          registro[header] = fila[index] || '';
        });
        registros.push(registro);
      }
    }
    
    console.timeEnd('📋 Procesamiento de registros');
    console.log(`✅ Procesados ${registros.length} registros válidos`);
    
    // Verificar que los datos estén ordenados por NRO_IDENTIFICACION
    console.time('🔍 Verificación de orden');
    let estaOrdenado = true;
    for (let i = 1; i < Math.min(1000, registros.length); i++) { // Verificar primeros 1000
      const anterior = registros[i-1].NRO_IDENTIFICACION || '';
      const actual = registros[i].NRO_IDENTIFICACION || '';
      
      if (anterior.localeCompare(actual, undefined, { numeric: true }) > 0) {
        estaOrdenado = false;
        break;
      }
    }
    console.timeEnd('🔍 Verificación de orden');
    
    if (!estaOrdenado) {
      console.warn('⚠️ ADVERTENCIA: Los datos no están ordenados por NRO_IDENTIFICACION');
    } else {
      console.log('✅ Datos confirmados como ordenados');
    }
    
    // Actualizar cache
    datosCache = {
      registros,
      timestamp: ahora,
      fileTimestamp,
      estadisticas: {
        totalRegistros: registros.length,
        tiempoCarga: Date.now() - ahora,
        tiempoBusqueda: 0,
        busquedasRealizadas: 0
      }
    };
    
    console.timeEnd('⏱️ Carga total de datos');
    
    return {
      success: true,
      fromCache: false,
      stats: datosCache.estadisticas
    };
    
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ==================== BÚSQUEDA BINARIA ULTRA OPTIMIZADA ====================
function busquedaBinariaOptimizada(nroIdentificacionBuscado) {
  console.time('🚀 Búsqueda binaria');
  
  const registros = datosCache.registros;
  const target = nroIdentificacionBuscado.toString().trim();
  
  let left = 0;
  let right = registros.length - 1;
  let encontrados = [];
  
  // Fase 1: Encontrar el primer registro que coincida
  let firstMatch = -1;
  let tempLeft = left;
  let tempRight = right;
  
  while (tempLeft <= tempRight) {
    const mid = Math.floor((tempLeft + tempRight) / 2);
    const midValue = (registros[mid] && registros[mid].NRO_IDENTIFICACION)
      ? registros[mid].NRO_IDENTIFICACION.toString().trim()
      : '';
    const comparison = midValue.localeCompare(target, undefined, { numeric: true });
    
    if (comparison === 0) {
      firstMatch = mid;
      tempRight = mid - 1; // Buscar más hacia la izquierda
    } else if (comparison < 0) {
      tempLeft = mid + 1;
    } else {
      tempRight = mid - 1;
    }
  }
  
  // Fase 2: Si encontramos coincidencia, recopilar todos los registros consecutivos
  if (firstMatch !== -1) {
    let i = firstMatch;
    
    // Recopilar hacia la derecha (incluyendo el encontrado)
    while (i < registros.length) {
      const currentId = registros[i].NRO_IDENTIFICACION?.toString().trim() || '';
      
      if (currentId === target) {
        encontrados.push(registros[i]);
        i++;
      } else {
        break;
      }
    }
  }
  
  console.timeEnd('🚀 Búsqueda binaria');
  console.log(`🎯 Encontrados ${encontrados.length} registros para ID: ${target}`);
  
  return encontrados;
}

// ==================== FUNCIÓN PRINCIPAL OPTIMIZADA ====================
function obtenerDatosClientePorId(nroIdentificacion = 36170576, fileId = null) {
  const tiempoInicio = Date.now();
  
  try {
    console.log(`🔍 Buscando ID: ${nroIdentificacion} en ${datosCache.estadisticas?.totalRegistros || 'X'} registros`);
    
    // Asegurar que los datos estén cargados
    const resultadoCarga = cargarDatosOptimizado(fileId);
    if (!resultadoCarga.success) {
      return resultadoCarga;
    }
    
    // Búsqueda binaria O(log n) en vez de O(n)
    const registrosCliente = busquedaBinariaOptimizada(nroIdentificacion);
    
    // Actualizar estadísticas
    datosCache.estadisticas.busquedasRealizadas++;
    
    if (registrosCliente.length === 0) {
      const tiempoTotal = Date.now() - tiempoInicio;
      return {
        success: false,
        message: `No se encontraron registros para la identificación: ${nroIdentificacion}`,
        stats: {
          tiempoBusqueda: tiempoTotal,
          fromCache: resultadoCarga.fromCache,
          totalRegistrosDB: datosCache.estadisticas.totalRegistros,
          busquedasRealizadas: datosCache.estadisticas.busquedasRealizadas
        }
      };
    }
    
    // Procesar datos del cliente (optimizado)
    const primerRegistro = registrosCliente[0];
    const cliente = {
      nro_identificacion: primerRegistro.NRO_IDENTIFICACION || '',
      nombre_titular: primerRegistro.NOMBRE_TITULAR || '',
      recuperador_generico: primerRegistro.NOMBRE_RECUPERADOR_JURIDICO || ''
    };
    
    // Procesar obligaciones (usando map para mejor rendimiento)
    const obligaciones = registrosCliente.map((registro, index) => ({
      id: index + 1,
      nro_producto: registro.NRO_PRODUCTO || '',
      nombre_titular: registro.NOMBRE_TITULAR || '',
      nro_identificacion: registro.NRO_IDENTIFICACION || '',
      recuperador_generico: registro.NOMBRE_RECUPERADOR_JURIDICO || '',
      cant_dias_mora_actual: registro.CANT_DIAS_MORA_ACTUAL || '0',
      monto_pago_facturacion: registro.MONTO_PAGO_FACTURACION || '0',
      monto_pago_minimo_actual: registro.MONTO_PAGO_MINIMO_ACTUAL || '0',
      monto_mora_pesos: registro.MONTO_MORA_PESOS || '0',
      monto_total_cliente: registro.MONTO_TOTAL_CLIENTE || '0',
      fecha_pago_actual: registro.FECHA_PAGO_ACTUAL || ''
    }));
    
    const tiempoTotal = Date.now() - tiempoInicio;
    datosCache.estadisticas.tiempoBusqueda = tiempoTotal;
    
    console.log(`✅ Búsqueda completada en ${tiempoTotal}ms - Eficiencia: O(log ${datosCache.estadisticas.totalRegistros})`);
    
    return {
      success: true,
      cliente,
      obligaciones,
      totalRegistros: registrosCliente.length,
      stats: {
        tiempoBusqueda: tiempoTotal,
        fromCache: resultadoCarga.fromCache,
        totalRegistrosDB: datosCache.estadisticas.totalRegistros,
        busquedasRealizadas: datosCache.estadisticas.busquedasRealizadas,
        eficiencia: `O(log ${datosCache.estadisticas.totalRegistros})`
      }
    };
    
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    return {
      success: false,
      message: 'Error al procesar búsqueda: ' + error.toString(),
      stats: {
        tiempoBusqueda: Date.now() - tiempoInicio
      }
    };
  }
}

// ==================== BÚSQUEDA PREDICTIVA OPTIMIZADA ====================
function busquedaPredictiva(fragmento, limite = 5) {
  try {
    if (!datosCache.registros || fragmento.length < 3) {
      return { success: false, sugerencias: [] };
    }
    
    console.time('🔮 Búsqueda predictiva');
    
    const fragmentoLower = fragmento.toLowerCase().trim();
    const sugerencias = [];
    const registros = datosCache.registros;
    
    // Usar búsqueda binaria para encontrar el rango aproximado
    let left = 0;
    let right = registros.length - 1;
    let startIndex = -1;
    
    // Encontrar primer registro que empiece con el fragmento
    while (left <= right && sugerencias.length < limite) {
      const mid = Math.floor((left + right) / 2);
      const midValue = registros[mid].NRO_IDENTIFICACION?.toString().toLowerCase() || '';
      
      if (midValue.startsWith(fragmentoLower)) {
        startIndex = mid;
        right = mid - 1; // Buscar más hacia la izquierda
      } else if (midValue < fragmentoLower) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    // Si encontramos un punto de inicio, recopilar sugerencias
    if (startIndex !== -1) {
      const idsVistos = new Set();
      
      // Buscar hacia adelante desde el punto encontrado
      for (let i = startIndex; i < registros.length && sugerencias.length < limite; i++) {
        const nroId = registros[i].NRO_IDENTIFICACION?.toString() || '';
        
        if (nroId.toLowerCase().startsWith(fragmentoLower) && !idsVistos.has(nroId)) {
          idsVistos.add(nroId);
          sugerencias.push({
            nro_identificacion: nroId,
            nombre_titular: registros[i].NOMBRE_TITULAR || '',
            recuperador: registros[i].NOMBRE_RECUPERADOR_JURIDICO || ''
          });
        } else if (!nroId.toLowerCase().startsWith(fragmentoLower)) {
          break; // Salir si ya no coinciden
        }
      }
    }
    
    console.timeEnd('🔮 Búsqueda predictiva');
    
    return {
      success: true,
      sugerencias: sugerencias.slice(0, limite)
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==================== FUNCIONES DE MANTENIMIENTO ====================
function obtenerEstadisticasCache() {
  const stats = datosCache.estadisticas || {};
  return {
    cacheActivo: !!datosCache.registros,
    totalRegistros: stats.totalRegistros || 0,
    ultimaActualizacion: datosCache.timestamp ? new Date(datosCache.timestamp) : null,
    tiempoCarga: stats.tiempoCarga || 0,
    tiempoPromedioBusqueda: stats.tiempoBusqueda || 0,
    busquedasRealizadas: stats.busquedasRealizadas || 0,
    memoriaUsada: datosCache.registros ? `~${Math.round(datosCache.registros.length * 0.5 / 1024)} KB` : '0 KB'
  };
}

function limpiarCache() {
  const statsAnteriores = { ...datosCache.estadisticas };
  
  datosCache = {
    registros: null,
    timestamp: null,
    fileTimestamp: null,
    estadisticas: { 
      totalRegistros: 0, 
      tiempoCarga: 0, 
      tiempoBusqueda: 0,
      busquedasRealizadas: 0
    }
  };
  
  // Forzar liberación de memoria
  Utilities.sleep(100);
  
  console.log('🗑️ Cache limpiado - liberados ~' + Math.round(statsAnteriores.totalRegistros * 0.5 / 1024) + ' KB');
  
  return { 
    success: true, 
    message: 'Cache limpiado correctamente',
    registrosLiberados: statsAnteriores.totalRegistros
  };
}

function precalentarCache(fileId = null) {
  console.log('🔥 Precalentando cache para 434K registros...');
  const inicio = Date.now();
  
  const resultado = cargarDatosOptimizado(fileId);
  
  if (resultado.success) {
    const tiempo = Date.now() - inicio;
    console.log(`✅ Cache precalentado en ${tiempo}ms`);
    return {
      success: true,
      message: `Cache precalentado correctamente en ${tiempo}ms`,
      stats: resultado.stats,
      registrosCargados: datosCache.estadisticas.totalRegistros
    };
  } else {
    return resultado;
  }
}

// ==================== DIAGNÓSTICO DE RENDIMIENTO ====================
function diagnosticarRendimiento() {
  const stats = obtenerEstadisticasCache();
  
  const diagnostico = {
    estadisticasCache: stats,
    rendimiento: {
      complejidad: stats.totalRegistros > 0 ? `O(log ${stats.totalRegistros}) ≈ ${Math.ceil(Math.log2(stats.totalRegistros))} comparaciones máx` : 'N/A',
      velocidadEsperada: stats.totalRegistros > 0 ? '< 50ms por búsqueda' : 'N/A',
      memoriaEstimada: stats.memoriaUsada,
      busquedasPorSegundo: stats.tiempoPromedioBusqueda > 0 ? Math.round(1000 / stats.tiempoPromedioBusqueda) : 'N/A'
    },
    recomendaciones: []
  };
  
  // Generar recomendaciones específicas para 434K registros
  if (!stats.cacheActivo) {
    diagnostico.recomendaciones.push("🚨 CRÍTICO: Cache inactivo para 434K registros. Ejecute precalentarCache()");
  }
  
  if (stats.tiempoPromedioBusqueda > 100) {
    diagnostico.recomendaciones.push("🐌 Búsqueda lenta detectada. Verifique que los datos estén ordenados");
  } else if (stats.tiempoPromedioBusqueda < 50) {
    diagnostico.recomendaciones.push("🚀 Rendimiento óptimo para dataset grande");
  }
  
  if (stats.totalRegistros !== 434381) {
    diagnostico.recomendaciones.push(`⚠️ Total de registros (${stats.totalRegistros}) difiere del esperado (434,381)`);
  }
  
  return diagnostico;
}