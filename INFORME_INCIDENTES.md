# Informe de incidencias · Gestor de tareas

**Estudiante:** [Completar con tu Nombre y Apellido]  
**Fecha:** 25/11/2026  
**Proyecto / rama Git:** gestor-tareas-debugging (`main`)  
**Entorno (Expo SDK, Android, dispositivo):** Expo SDK 57 (`~57.0.0`), React Native `0.86.3`, React `19.2.3`, TypeScript `6.0.3`, Android (EAS Preview Build / Emulador)  

## Resumen ejecutivo
Se realizó una auditoría técnica integral sobre la aplicación **Gestor de tareas** mediante inspección estática de código, pruebas de caja negra en interfaz móvil y ejecución de pruebas automatizadas con Jest. Se detectaron y resolvieron **6 defectos** (4 críticos/de interfaz en `app/index.tsx` y 2 de lógica pura en `src/utils/`), logrando que el 100 % de las suites de prueba (`3/3`) y el chequeo estático de tipos (`tsc --noEmit`) finalicen sin errores.

## Incidencia 1
- **Título de incidencia:** Búsqueda insensible a mayúsculas/minúsculas, espacios y actualización en tiempo real
- **Pasos para reproducir:**
  1. Abrir la pantalla principal del Gestor de tareas.
  2. Escribir `"VALIDAR"` o `"  login  "` en el campo `Buscar por nombre...`.
- **Esperado / observado:**
  - *Esperado:* La lista se filtra en tiempo real mostrando la tarea `"Validar login"`.
  - *Observado:* La lista no reacciona al escribir en el input; además, la función `filterTasks` devuelve un array vacío `[]` cuando la consulta contiene mayúsculas o espacios en los extremos.
- **Herramienta usada (DevTools / consola / test):** Jest (`npm test` -> `__tests__/taskFilters.test.ts`) e inspección de hooks en `app/index.tsx`.
- **Hipótesis y evidencia:**
  - En consola Jest se obtuvo: `Expected length: 1, Received length: 0, Received array: []` para `filterTasks(demo, 'VALIDAR', 'todas')`.
  - En `app/index.tsx`, el hook `useMemo` omitía `query` en su arreglo de dependencias.
- **Archivo y función involucrada:** `src/utils/taskFilters.ts` (`filterTasks`) y `app/index.tsx` (`visibleTasks`).
- **Causa raíz:** `filterTasks` realizaba una comparación estricta (`task.title.includes(query)`) sin normalizar mayúsculas/minúsculas ni recortar espacios; paralelamente, `useMemo(() => filterTasks(tasks, query, status), [tasks, status])` no recalculaba al cambiar `query`.
- **Corrección aplicada:** Se normalizó la consulta con `const normalizedQuery = query.trim().toLowerCase()` comparando contra `task.title.toLowerCase()`, y se agregó `query` al array de dependencias `[tasks, query, status]` en `useMemo`.
- **Prueba de regresión:** Ejecución de `npx jest __tests__/taskFilters.test.ts` (4/4 tests aprobados) y prueba manual escribiendo en el buscador.
- **Estado:** Corregido

## Incidencia 2
- **Título de incidencia:** Validación defectuosa permite crear tareas compuestas únicamente por espacios en blanco
- **Pasos para reproducir:**
  1. En el campo `NUEVA TAREA`, ingresar tres espacios (`"   "`).
  2. Presionar el botón `Agregar`.
- **Esperado / observado:**
  - *Esperado:* El sistema rechaza la entrada, muestra el mensaje `"Ingresá un nombre válido para continuar."` y no crea la tarea.
  - *Observado:* Se crea una tarea visualmente vacía en el tablero y se incrementa el contador `TAREAS`.
- **Herramienta usada (DevTools / consola / test):** Jest (`npm test` -> `__tests__/taskValidation.test.ts`).
- **Hipótesis y evidencia:** El test `isValidTaskTitle › rechaza un título compuesto solo de espacios` falló con: `Expected: false, Received: true`.
- **Archivo y función involucrada:** `src/utils/taskValidation.ts` (`isValidTaskTitle`) y `app/index.tsx` (`addTask`).
- **Causa raíz:** `isValidTaskTitle` evaluaba únicamente `title.length > 0`, considerando válidos los caracteres de espacio en blanco.
- **Corrección aplicada:** Se reemplazó la condición por `return title.trim().length > 0;` y se aplicó `newTitle.trim()` al instanciar el objeto `Task` en `addTask`.
- **Prueba de regresión:** Ejecución de `npx jest __tests__/taskValidation.test.ts` (3/3 tests aprobados).
- **Estado:** Corregido

## Incidencia 3
- **Título de incidencia:** Mutación directa de estado impide actualizar visualmente tarjetas y contadores al completar tareas
- **Pasos para reproducir:**
  1. Tocar el checkbox de cualquier tarea pendiente (ej. `"Validar login"`).
- **Esperado / observado:**
  - *Esperado:* La tarjeta cambia a estilo tachado con estado `"Completada"` y se actualizan los contadores `COMPLETADAS` y `PENDIENTES`.
  - *Observado:* La interfaz no muestra cambios visuales tras presionar el checkbox.
- **Herramienta usada (DevTools / consola / test):** Inspección de estado React en `app/index.tsx`.
- **Hipótesis y evidencia:** Al inspeccionar `toggleTask`, se observó que modificaba la propiedad `found.completed = !found.completed` directamente sobre el objeto dentro del array existente y pasaba la misma referencia a `setTasks(tasks)`.
- **Archivo y función involucrada:** `app/index.tsx` (`toggleTask`).
- **Causa raíz:** React compara referencias de estado por igualdad superficial (`Object.is`). Al pasar el mismo array mutado a `setTasks`, React descarta el re-renderizado.
- **Corrección aplicada:** Se reemplazó la mutación por una actualización inmutable utilizando `setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))`.
- **Prueba de regresión:** Verificación interactiva marcando y desmarcando tareas y comprobando la actualización inmediata en los 3 contadores superiores.
- **Estado:** Corregido

## Incidencia 4
- **Título de incidencia:** Indicador de carga (`ActivityIndicator`) queda bloqueado indefinidamente ante error del servicio API
- **Pasos para reproducir:**
  1. Presionar el botón `⚠ Simular error API` en la pantalla principal.
  2. Esperar los 700 ms de latencia del servicio simulado.
- **Esperado / observado:**
  - *Esperado:* Aparece la alerta roja `"No pudimos cargar las tareas. Probá otra vez."` y desaparece el spinner `Consultando tareas…`.
  - *Observado:* Se muestra el mensaje de error en consola (`HTTP 503: servidor temporalmente indisponible (simulado)`), pero el spinner queda girando indefinidamente ocultando la lista.
- **Herramienta usada (DevTools / consola / test):** Log de consola Metro/DevTools (`[taskService] No se cargaron las tareas`) e inspección de flujo `try/catch` en `app/index.tsx`.
- **Hipótesis y evidencia:** La sentencia `setLoading(false)` estaba ubicada exclusivamente al final del bloque `try`, por lo que al lanzarse la excepción hacia el bloque `catch`, nunca se ejecutaba.
- **Archivo y función involucrada:** `app/index.tsx` (`loadTasks`).
- **Causa raíz:** Ausencia de un bloque `finally` para garantizar la limpieza del estado `loading` independientemente del resultado de la promesa `fetchTasks`.
- **Corrección aplicada:** Se movió `setLoading(false)` a un bloque `finally { setLoading(false); }` después del `catch`.
- **Prueba de regresión:** Pulsación reiterada de `⚠ Simular error API` seguida de `↻ Recargar datos`, confirmando que el spinner desaparece tanto en fallo como en éxito.
- **Estado:** Corregido

## Otras incidencias (opcional)
- **Incidencia 5 — Desfase del detalle expandido al filtrar la lista (`app/index.tsx`):**
  - *Causa raíz:* El componente `FlatList` utilizaba `keyExtractor={(_item, index) => String(index)}` en lugar de un identificador único por tarea, provocando que al cambiar de pestaña (`Todas` -> `Pendientes`), el estado local `expanded` de `TaskCard` quedara asociado a la posición visual en lugar de la tarea.
  - *Corrección aplicada:* Se actualizó `keyExtractor={(item) => item.id}`.

## Pruebas

| Prueba | Antes | Después | Evidencia |
|---|---|---|---|
| Búsqueda | Falla (`0` resultados con mayúsculas/espacios y sin reacción al tipear) | Pasa (filtra en tiempo real sin importar mayúsculas ni espacios) | `PASS __tests__/taskFilters.test.ts` (4/4 tests) |
| Validación | Falla (`isValidTaskTitle('   ')` devolvía `true`) | Pasa (`isValidTaskTitle('   ')` devuelve `false` y bloquea alta) | `PASS __tests__/taskValidation.test.ts` (3/3 tests) |
| Actualización de estado | Falla (mutación directa impedía re-renderizar tarjeta y contadores) | Pasa (actualización inmutable con `.map()` refleja cambios al instante) | Verificación manual en emulador/APK + `PASS __tests__/TaskCard.test.tsx` |
| Error de servicio | Falla (`loading` quedaba en `true` tras capturar error HTTP 503) | Pasa (`finally` apaga `ActivityIndicator` y muestra alerta de error) | Consola sin bloqueo tras pulsar `⚠ Simular error API` |

## Conclusión y control de cambios
- **Commit final (hash):** `[Ejecutar git rev-parse --short HEAD tras el commit y pegar aquí]`
- **Mensaje del commit:** `fix: corregir validación de títulos, filtrado, estado inmutable, carga y keys de lista`
- **Qué aprendí y cómo lo aplicaría a mi app final:** Comprendí la diferencia entre el síntoma visible en la interfaz y su causa raíz en el ciclo de renderizado de React (inmutabilidad de estado, dependencias de `useMemo`, claves estables en listas virtuales y manejo seguro de bloques `finally` en llamadas asíncronas). En mis próximos proyectos aplicaré pruebas unitarias automatizadas antes de modificar lógica crítica y mantendré commits atómicos respaldados por historias de usuario y criterios de aceptación claros.
