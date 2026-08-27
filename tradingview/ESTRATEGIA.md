# Especificación de la estrategia — Indicador TradingView (Pine Script)

Estado: **v1.7** — arquitectura de dos capas (zona en temporalidad mayor,
confirmación en temporalidad menor), SMC + Fibonacci, gráfico limpio.
Las secciones marcadas ✅ están implementadas en `indicator.pine`;
las marcadas 🔧 son aproximaciones que hay que refinar con el mentor.

---

## Métricas automáticas (v1.4)

El indicador lleva su propio registro. Todo se mide en **R** (múltiplos del
riesgo inicial), que es la única unidad comparable entre operaciones de
distinto tamaño.

**Cómo se calcula la R de una operación con varios TPs:** la posición se reparte
en partes iguales entre los TPs configurados. Cada TP alcanzado suma la R de su
fracción; si después salta el SL, la fracción que seguía abierta pierde −1R.
Ejemplo con 2 TPs: TP1 a 1.5R y TP2 a 3R → si ambos se alcanzan, +2.25R; si tras
TP1 salta el SL, 0.5×1.5 − 0.5×1 = **+0.25R**.

**Panel de rendimiento** (esquina configurable):

| Métrica | Qué dice |
|---|---|
| Ops / Aciertos | Nº de operaciones cerradas y % de ganadoras |
| R neta / R media | Rentabilidad total y por operación |
| Profit factor | Ganancia bruta ÷ pérdida bruta. <1 pierde, 1–1.5 frágil, >1.5 sólido |
| Racha adversa | Peor caída desde el pico de R (drawdown) |
| Desglose por modelo | Las mismas cifras para M1, M2 y M3 por separado |

**Bitácora**: las últimas 12 operaciones con fecha, dirección, **modelo que la
produjo**, cómo cerró (TP completo / SL / SL tras TP1) y su R.

**Alertas de cierre**: cada operación cerrada emite
`📊 CIERRE VENTA [M1+M2] XAUUSD | TP2 completo | R: 2.25`, lista para webhook a
Discord/Telegram y para volcar a una hoja de cálculo.

> Las cifras son de las señales visibles en el histórico del gráfico: al cambiar
> de temporalidad o de rango de fechas se recalculan. Para estadísticas sobre
> períodos largos, usa `strategy.pine` en el Probador de estrategias.

**Cómo usar esto para mejorar**: si M2 tiene 60% de aciertos y M1 40%, se opera
M2 o se endurece M1. Si el profit factor es alto pero la racha adversa duele,
el problema es el tamaño de posición, no la estrategia. Si muchas cierran como
"SL tras TP1", conviene mover a break-even tras el primer parcial.

---

## Registro de operaciones (validación en vivo)

Casos reales usados para calibrar el indicador. Sirven de referencia didáctica
y de control de calidad: cada versión debe seguir marcando los ✅.

| Fecha | Activo / TF | Modelo | Resultado | Qué enseñó |
|---|---|---|---|---|
| 25-ago-2026 | XAUUSD 5m | Entrada en 71% del fib | ✘ SL | Entrada prematura: quedaba liquidez (highs iguales) por manipular arriba. → v0.6 añade EQH/EQL |
| 25-ago-2026 | XAUUSD 1m | Zona 78–88% + manipulación + imbalance contrario | Señal NO marcada | El rango se calculaba en la TF del gráfico. → v0.7 rango en TF mayor |
| 25-ago-2026 | XAUUSD 5m | Manipulación → confirmación en zona fib | ✅ 1:3 corriendo | Modelo correcto; SL demasiado ajustado. → v0.8 SL al extremo de la manipulación |
| 25-ago-2026 | XAUUSD 5m | TPs desplazados respecto al fib manual | Niveles incorrectos | Rango tomado de pivotes no consecutivos. → v1.0 tramo real (dos pivotes seguidos) |
| **26-ago-2026** | **XAUUSD 5m** | **Venta en premium del tramo bajista → expansión completa** | **✅ TP1 + TP2** | **Trade modelo: entrada en zona fib, salida en 0% y −14.6%. Cumplió todo lo requerido.** |
| 26-ago-2026 | XAUUSD 1m (Asia) | Compra: giro alcista sobre 4600, retroceso al 61.8% + iFVG | Señal NO marcada | El tramo de 1H seguía marcado bajista: los pivotes tardan 5 velas en confirmarse (5 h en 1H). → v1.5 gira el tramo al **quiebre de estructura con desplazamiento** |

---

## Diagnóstico — por qué no sale una señal (v1.7)

El panel de diagnóstico (centro derecha, activado) muestra cada compuerta para
compras y ventas. **La primera ✗ de una columna es lo que bloquea esa dirección.**

| Compuerta | Si sale ✗ |
|---|---|
| Sesión operable | Fuera de NY/Asia. Ajusta horarios o desactiva el filtro. |
| Dirección del tramo | El tramo va al revés. Compara con tu lectura; si discrepa, ajusta `Fuerza swings EXTERNOS` o la TF del rango. |
| Sesgo (si se exige) | Filtro extra; **apagado por defecto desde v1.7**. |
| Contexto (modelos) | Ningún modelo activo se cumple. Muestra cuáles sí cuando pasa. |
| Zona fib del tramo | El precio no está en el 61.8–88.6%. |
| Manipulación reciente | No hubo barrido de liquidez en las últimas N velas. |
| Confirmación | En la TF menor no apareció envolvente / CHoCH / imbalance / iFVG. |
| Cupo diario | Se agotaron las señales del día. |
| Sin operación abierta | Ya hay un setup vivo; solo uno a la vez. |

### Dos causas de bloqueo corregidas en v1.7

1. **Sesgo duplicado.** Había dos definiciones de dirección compitiendo: el
   `htfBias` (rotura de swing, criterio crudo) y el tramo estructural de M1.
   Cuando discrepaban, la señal moría sin motivo real. El filtro de sesgo pasa
   a estar **apagado por defecto**: la dirección la define el tramo.
2. **El BOS giraba con el retroceso.** La v1.5 giraba el tramo al romper
   *cualquier* pivote menor — pero el retroceso hacia la zona de entrada rompe
   pivotes menores todo el tiempo. Resultado: el tramo se daba la vuelta justo
   cuando íbamos a entrar, y la señal desaparecía. Ahora solo cuenta romper el
   **swing protegido** (el high que sostiene el impulso bajista, o el low que
   sostiene el alcista), que es el quiebre de estructura de verdad.

---

## 0. Principio rector — las dos capas

> **Una zona de interés NO es una entrada.**

- **Capa alta (4H / 1H / 15m) — dónde y hacia dónde.** Define la dirección del
  precio y el rango estructural. Sobre ese rango se tira el Fibonacci: la zona
  de premium/descuento (61.8%–88.6%) señala **dónde puede reaccionar el
  precio**. Es una referencia, no una orden.
- **Capa baja (5m / 2m / 1m) — si se entra o no.** Dentro de la zona tiene que
  aparecer el modelo completo: manipulación (barrido de liquidez), imbalance, y
  el cambio de dirección que **invalida los imbalances del bando contrario**.
- **Si la temporalidad menor no confirma, no hay operación** — por buena que
  parezca la zona. Este es el filtro que separa las entradas prematuras
  (las que fallaron el 25-ago en el 61.8/71%) de las válidas.

Ejemplo registrado (25-ago-2026, XAUUSD): zona de interés = premium 78–88% del
rango bajista de 1H, con imbalance de 15m. En 1m se vio manipulación al alza
dejando imbalance alcista, luego vela envolvente bajista, retroceso, e imbalance
bajista que invalidó el alcista → **ahí** estaba la entrada.

---

## 0b. Fractalidad y modelos de contexto

> **Un tramo pequeño no vale por sí solo. Vale si está anidado dentro de una
> estructura mayor que apunta al mismo sitio.**

Caso de referencia (XAUUSD, 25–26 ago 2026 — ver capturas de 1H):

1. **Diario — manipulación de liquidez.** El precio venía en estructura alcista
   y perfora con fuerza el **alto del día anterior**. Eso barre liquidez, pero
   por sí solo no dice nada todavía.
2. **1H — la manipulación se revela.** El precio vuelve rápido dejando un
   **imbalance bajista** que **invalida los imbalances alcistas**. Ese impulso
   por encima del alto anterior era manipulación, no expansión real.
3. **1H — quiebre de estructura.** La estructura pasa de alcista a bajista.
   Se tira el fib del **high de la manipulación (100%)** al **low que creó el
   rango bajista (0%)**. El imbalance de 1H que quedó arriba **confluye con el
   71% de premium**.
4. **15m — dentro de esa zona**, nuevo quiebre de estructura. **Ese** es el
   tramo que se usa para la venta.

Por eso el rango de 15m era válido: no era un tramo cualquiera, era el tramo
que aparece dentro del premium de una estructura de 1H que nació de una
manipulación diaria.

### Modelos de contexto (v1.6)

> Los modelos son **maneras de leer el mercado**, no requisitos acumulativos.
> La manipulación del alto del día anterior ocurre a menudo, pero es uno más.

| Modelo | Por defecto | Qué reconoce |
|---|---|---|
| **M1 · Estructura anidada** | ✅ ON | El precio está en premium/descuento del tramo de la TF estructural (1H) **y** esa estructura va en la misma dirección. Modelo base. |
| **M2 · Manipulación diaria** | ⬜ OFF | Se barrió el alto del día anterior → contexto bajista; el bajo → alcista. |
| **M3 · Imbalance estructural** | ⬜ OFF | El precio está dentro de un imbalance de 1H sin mitigar (el naranja del ejemplo). |
| **M4 · Imbalance diario alcanzado** | ✅ ON | La expansión se agota: el precio llega a un imbalance de temporalidad superior (diaria) sin mitigar. Ahí se busca el **giro**, no la continuación. |
| **M5 · Nivel psicológico** | ✅ ON | El precio consolida contra un número redondo (4600), lo rompe **con desplazamiento** creando un rango nuevo, y vuelve a testearlo. El nivel roto cambia de papel. |

**Caso 26-ago (sesión de Asia, compra)** — los tres modelos nuevos en secuencia:
1. El precio completó la expansión bajista, hizo nuevo bajo en 4H y 1H y
   aterrizó en un **imbalance diario** → M4: la expansión se agotó.
2. Consolidó bajo **4600** (nivel psicológico) y lo rompió al alza con fuerza,
   dejando un imbalance y creando un rango alcista de 1H → M5.
3. Retrocedió a ese imbalance barriendo la liquidez interna del nuevo rango y
   llegando al **61.8% de descuento** → M1 (una vez el tramo gira, v1.5).
4. En 1m: manipulación a la baja, barrido de liquidez, e **iFVG** (invalidación
   de los imbalances bajistas) → confirmación y entrada.
5. SL bajo el low estructural. TPs en −14.6 / −27.2 / −41.4%, con los **altos
   iguales** de Nueva York confluyendo sobre el −14.6%.

**Cómo combinarlos** (input "Cómo combinar los modelos"):
- *Basta con uno* (por defecto): cualquier modelo activo que se cumpla da
  contexto válido. Más señales, cada una etiquetada con el modelo que la produjo.
- *Exigir todos*: confluencia máxima, muchas menos señales. El caso del 26-ago
  cumplía M1+M2+M3 a la vez — por eso era un escenario A+.

Cada señal (flecha y alerta) lleva la etiqueta del modelo: `🔴 VENTA [M1+M2]`.
Así, al registrar operaciones, se puede medir **qué modelo funciona mejor**.

**Para añadir un modelo nuevo** basta con definir `mNLong` / `mNShort`, su input
`useMN`, y sumarlo a las tres líneas de combinación. El resto del indicador
(fib, manipulación, confirmación, gestión, dibujo) no se toca.

El panel del gráfico muestra la cadena completa de arriba abajo:
**modelos cumplidos → estructura (1H) → tramo de ejecución (15m) → estado operativo**.

---

## 1. Contexto general ✅

- **Instrumento:** Oro (XAUUSD / GC). El indicador funciona en cualquier símbolo,
  pero los valores por defecto (márgenes en puntos) están pensados para oro.
- **Temporalidad de ejecución:** 15m / 5m / 1m (la del gráfico).
- **Temporalidad de contexto:** 1H por defecto, configurable a 4H (input "Temporalidad del sesgo").
- **Sesiones operables:** Nueva York (08:30–11:30 NY) y Asia (19:00–00:00 NY),
  ambas configurables y activables por separado. 🔧 Confirmar horarios exactos.

## 2. Sesgo / dirección ✅🔧

- Implementado: estructura en la temporalidad mayor. Si el cierre HTF rompe el
  último swing high → sesgo alcista (solo compras); si rompe el último swing
  low → bajista (solo ventas). Se muestra en la esquina superior derecha.
- 🔧 Refinar: ¿el sesgo se define solo por rotura de estructura o también por
  premium/discount, open diario/semanal, o FVGs de HTF sin mitigar?

## 3. Modelos de entrada ✅🔧

### Modelo A — Fib premium/descuento + manipulación + confirmación (implementado)
1. Se define el **tramo** (impulso) en la temporalidad del rango: los DOS
   últimos pivotes consecutivos — high→low (tramo bajista) o low→high (tramo
   alcista). Es exactamente lo que se marca al tirar el fib a mano. Por defecto
   15m, configurable a 1H/4H, independiente de la temporalidad del gráfico.
   - Corregido el 25-ago (v0.7): antes el rango se calculaba con pivotes del
     propio gráfico y en 1m no representaba la estructura real.
   - Corregido de nuevo (v1.0): se tomaban "el último high" y "el último low"
     por separado, que pueden ser de momentos distintos y no forman ningún
     tramo — eso desplazaba el 0% y con él todos los TPs.
   - Filtro añadido: solo se opera **a favor del tramo** (tramo bajista → solo
     ventas en premium; tramo alcista → solo compras en descuento).
2. **Fibonacci sobre el rango**: rango alcista → fib de low a high, se busca
   entrada en la zona de descuento 61.8%–88.6% (mínimo y máximo configurables:
   61.8 / 70.5 / 78.6 / 88.6). Rango bajista → espejo en premium.
3. En esa zona, **manipulación**: barrido de un swing interno, barrido de
   **highs/lows iguales** (EQH/EQL — dos swings al mismo nivel son una bolsa
   de liquidez que se manipula antes del movimiento real; tolerancia
   configurable, 1.5 puntos por defecto) o tap de un imbalance a favor.
   Nota del mentor (25-ago-2026): el nivel más óptimo es el **78.6% cuando
   confluye con un imbalance grande** — las entradas en el 61.8/71% pueden
   ser prematuras si aún queda liquidez por manipular más arriba/abajo.
4. **Confirmación en TEMPORALIDAD MENOR** (desde v0.9; input "Temporalidad de
   confirmación", 1m por defecto). En las N velas siguientes a la manipulación
   (N=5), el modelo debe aparecer en la temporalidad menor. Cuatro señales,
   cada una activable por separado:
   - vela envolvente a favor,
   - cambio de estructura (CHoCH),
   - nuevo imbalance a favor,
   - **invalidación de imbalance contrario** — el precio cierra atravesando un
     FVG del bando opuesto: el otro lado perdió el control.
   Si la temporalidad de confirmación no es menor que la del gráfico, el modelo
   se busca en el propio gráfico (comportamiento anterior).
5. Objetivo: la liquidez **externa** del lado opuesto del rango.

- Los imbalances se tratan como liquidez: zona de entrada cuando el precio
  los tapa a favor del sesgo, y quedan invalidados cuando se rellenan por completo.

## 3b. Liquidez como objetivo — altos/bajos iguales ✅

> **Altos iguales o bajos iguales = liquidez.** Cuando esa liquidez coincide con
> un nivel de expansión del fib, ese es el punto de salida óptimo.

Caso 26-ago (Asia→NY): los altos iguales creados en la sesión de Nueva York
caían justo sobre el **−14.60%**. Doble razón para salir ahí: nivel de expansión
+ bolsa de liquidez que el precio va a buscar y donde suele reaccionar.

**Implementado (v1.5)** — "Ajustar TPs a la liquidez cercana" (activado):
si hay altos/bajos iguales dentro de la distancia configurada (3 puntos por
defecto) de un nivel de expansión, el TP se mueve a **justo antes** de esa
liquidez (margen de 0.3 puntos). Se sale antes que la multitud, no dentro de
la bolsa.

---

## 4. Stop Loss ✅🔧

- Implementado con 3 modos (input "Colocación del stop loss"):
  1. **Extremo de la manipulación** (por defecto desde v0.8): el high/low más
     extremo del tramo manipulación→señal — cubre toda la mecha del barrido.
     (Cambiado tras feedback del 25-ago: el SL en la vela de señal quedaba
     demasiado ajustado.)
  2. Extremo de la vela de señal (el modo original, más agresivo).
  3. Retroceso máximo del fib (detrás del 88.6%, el más conservador).
- Margen extra configurable (0.5 puntos por defecto).

## 5. Take Profit ✅🔧

- Implementado según el fib del mentor (captura XAUUSD 15m, 25-ago-2026):
  hasta **4 take profits**. TP1 = liquidez externa del rango (0% del fib);
  TP2/TP3/TP4 = extensiones **-14.6% / -27.2% / -41.4%** del rango (la zona de
  expansión), porcentajes configurables. Modo alternativo: múltiplos de R.
- Filtro de **RR mínimo** hasta la liquidez externa (si queda muy cerca, se descarta).
- 🔧 Refinar: porcentajes de cierre en cada TP, break-even, papel del 38.2%.

## 6. Invalidaciones / filtros extra ✅🔧

- Implementado: máximo de señales por día (4 por defecto), un solo setup activo
  a la vez, señal solo al cierre de vela confirmada.
- 🔧 Refinar: días/noticias excluidos, caducidad de una zona de entrada.

## 7. Alertas ✅

- Al formarse la señal: dirección + entrada + SL + TP (formato listo para
  webhook a Discord/Telegram).
- Al resolverse: ✔ TP alcanzado / ✘ SL tocado.

---

## Flujo de trabajo

1. **Especificación** — este documento (reglas exactas; capturas con fecha/hora ayudan a validar).
2. **Traducción a Pine** — cada modelo como módulo dentro de `indicator.pine` (v6).
3. **Validación visual** — cargar en TradingView sobre oro y comparar contra entradas reales del mentor: ¿marca las mismas?
4. **Versión `strategy()`** — clon para backtest (win rate, drawdown, R medio).
5. **Iteración** — refinar los puntos 🔧 uno a uno.
