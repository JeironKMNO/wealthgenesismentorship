# Especificación de la estrategia — Indicador TradingView (Pine Script)

Estado: **v0.2** — primera versión SMC funcional. Las secciones marcadas
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

### Modelo A — Manipulación interna → liquidez externa (implementado)
1. Se define el rango con los últimos swings mayores (liquidez externa:
   high y low del rango).
2. Dentro del rango, el precio **manipula liquidez interna**: barre un swing
   menor interno, o tapa un imbalance (FVG) a favor del sesgo.
3. Confirmación actual: cierre de vela a favor tras la manipulación. 🔧 Refinar:
   ¿se exige CHoCH/desplazamiento en el LTF? ¿Entrada al 50% del FVG o al toque?
4. Objetivo: la liquidez **externa** del lado opuesto del rango.

- Los imbalances se tratan como liquidez: zona de entrada cuando el precio
  los tapa a favor del sesgo, y quedan invalidados cuando se rellenan por completo.

## 4. Stop Loss ✅🔧

- Implementado: extremo de la vela de manipulación ± margen configurable
  (0.5 puntos por defecto).
- 🔧 Refinar: ¿bajo el low del barrido, bajo el extremo del FVG, o bajo el
  swing completo?

## 5. Take Profit ✅🔧

- Implementado: la liquidez externa del rango (modo por defecto), con filtro de
  **RR mínimo** (si el objetivo queda demasiado cerca, la señal se descarta).
  Modo alternativo: ratio R fijo.
- 🔧 Refinar: ¿parciales? ¿break-even? ¿TP en FVGs de HTF sin mitigar?

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
