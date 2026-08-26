# Especificación de la estrategia — Indicador TradingView (Pine Script)

Estado: **v0.3** — SMC + Fibonacci, gráfico limpio (solo entrada/SL/TPs), confirmación por envolvente/CHoCH/imbalance, hasta 3 take profits. Las secciones marcadas
✅ están implementadas en `indicator.pine`; las marcadas 🔧 son
aproximaciones que hay que refinar con el mentor.

---

## 1. Contexto general ✅

- **Instrumento:** Oro (XAUUSD / GC). El indicador funciona en cualquier símbolo,
  pero los valores por defecto (márgenes en puntos) están pensados para oro.
- **Temporalidad de ejecución:** 15m / 5m / 1m (la del gráfico).
- **Temporalidad de contexto:** 1H por defecto, configurable a 4H (input "Temporalidad del sesgo").
- **Sesiones operables:** Nueva York (08:30–11:30 NY) y Asia (19:00–23:00 NY),
  ambas configurables y activables por separado. 🔧 Confirmar horarios exactos.

## 2. Sesgo / dirección ✅🔧

- Implementado: estructura en la temporalidad mayor. Si el cierre HTF rompe el
  último swing high → sesgo alcista (solo compras); si rompe el último swing
  low → bajista (solo ventas). Se muestra en la esquina superior derecha.
- 🔧 Refinar: ¿el sesgo se define solo por rotura de estructura o también por
  premium/discount, open diario/semanal, o FVGs de HTF sin mitigar?

## 3. Modelos de entrada ✅🔧

### Modelo A — Fib premium/descuento + manipulación + confirmación (implementado)
1. Se define el rango con los últimos swings mayores (liquidez externa:
   high y low del rango).
2. **Fibonacci sobre el rango**: rango alcista → fib de low a high, se busca
   entrada en la zona de descuento 61.8%–88.6% (mínimo y máximo configurables:
   61.8 / 70.5 / 78.6 / 88.6). Rango bajista → espejo en premium.
3. En esa zona, **manipulación**: barrido de un swing interno o tap de un
   imbalance a favor (los FVG se calculan internamente; confluyen con la zona fib).
4. **Confirmación** (en las N velas siguientes a la manipulación, N=5 por defecto):
   vela envolvente a favor, cambio de estructura (CHoCH) o un nuevo imbalance
   a favor de la dirección. Cada confirmación se puede activar/desactivar.
5. Objetivo: la liquidez **externa** del lado opuesto del rango.

- Los imbalances se tratan como liquidez: zona de entrada cuando el precio
  los tapa a favor del sesgo, y quedan invalidados cuando se rellenan por completo.
- 🔧 Refinar: ¿la manipulación debe verse en una temporalidad menor a la del
  gráfico (ej. señal en 15m con confirmación en 5m/1m)? Hoy todo ocurre en la
  temporalidad del gráfico.

## 4. Stop Loss ✅🔧

- Implementado: extremo de la vela de manipulación ± margen configurable
  (0.5 puntos por defecto).
- 🔧 Refinar: ¿bajo el low del barrido, bajo el extremo del FVG, o bajo el
  swing completo?

## 5. Take Profit ✅🔧

- Implementado: hasta **3 take profits** (número configurable, 2 por defecto).
  Modo "Liquidez externa": TP1 = equilibrio del rango (50%), TP2 = extremo
  opuesto del rango, TP3 = extensión del 25% del rango. Modo alternativo:
  múltiplos de R (1R / 2R / 3R configurables).
- Filtro de **RR mínimo** hasta la liquidez externa (si queda muy cerca, se descarta).
- 🔧 Refinar: porcentajes de cierre en cada TP, break-even, ¿TP en FVGs de HTF?

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
