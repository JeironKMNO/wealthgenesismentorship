# Especificación de la estrategia — Indicador TradingView (Pine Script)

Estado: **v0.9** — arquitectura de dos capas (zona en temporalidad mayor,
confirmación en temporalidad menor), SMC + Fibonacci, gráfico limpio.
Las secciones marcadas ✅ están implementadas en `indicator.pine`;
las marcadas 🔧 son aproximaciones que hay que refinar con el mentor.

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
1. Se define el rango con los últimos swings mayores de la **temporalidad del
   rango** (1H por defecto, configurable a 4H), independiente de la temporalidad
   del gráfico: el fib se tira sobre la estructura de 1H aunque se ejecute en
   1m/5m/15m. (Corregido tras la señal perdida del 25-ago: antes el rango se
   calculaba con pivotes del propio gráfico y en 1m no representaba la
   estructura real.)
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
