# Especificación de la estrategia — Indicador TradingView (Pine Script)

Rellena este documento con las reglas exactas de tu estrategia. Cada sección
alimenta directamente una parte del código del indicador (`indicator.pine`).
Cuanto más precisa sea la regla (números, no adjetivos), más fiel será la señal.

---

## 1. Contexto general

- **Instrumento(s):** (ej. NQ / MNQ futuros, CFD US100…)
- **Temporalidad de ejecución:** (ej. 1m, 5m, 15m — la del gráfico donde salen las señales)
- **Temporalidad(es) superior(es) de contexto:** (ej. sesgo en 1H/4H, niveles del diario)
- **Sesiones operables:** (ej. solo Nueva York 9:30–11:00 ET; ¿se opera Londres? ¿Asia?)
- **Días excluidos:** (ej. no operar viernes tarde, días de noticias rojas/FOMC…)

## 2. Sesgo / dirección (filtro)

¿Qué determina si solo se buscan compras, solo ventas, o ambas?

- Regla exacta: (ej. "precio por encima del open diario = solo largos",
  "estructura alcista en 15m = solo largos", "barrido del high/low de Asia define dirección contraria"…)

## 3. Modelos de entrada

Describe **cada modelo por separado**, con condiciones verificables barra a barra.
Ejemplo de formato:

### Modelo A — (nombre, ej. "Barrido + FVG")
1. Condición previa: (ej. se barre un low de sesión / liquidez marcada)
2. Confirmación: (ej. vela de 5m cierra por encima de X / cambio de carácter (CHoCH) / FVG creado)
3. Gatillo de entrada: (ej. retroceso al 50% del FVG, entrada al toque / cierre de vela en la zona)

### Modelo B — …

## 4. Stop Loss

- Regla exacta: (ej. "bajo el low del barrido + 5 ticks", "extremo del FVG",
  "X puntos fijos", "bajo el último swing low")

## 5. Take Profit

- ¿TP fijo por ratio (ej. 1:2, 1:3), por nivel (liquidez opuesta, high/low previo), o parciales?
- Si hay parciales: niveles y porcentajes (ej. 50% en 1:1, resto en 1:3)
- ¿Break-even? ¿Cuándo se mueve el stop?

## 6. Invalidaciones / filtros extra

- ¿Qué cancela una señal ya formada? (ej. si pasan N velas sin ejecutar, si sale noticia…)
- Máximo de operaciones por día / por sesión:

## 7. Alertas deseadas

- [ ] Alerta al formarse la señal (con dirección, entrada, SL, TP en el mensaje)
- [ ] Alerta al tocar TP / SL
- ¿Formato del mensaje? (útil si luego se conecta a Discord/Telegram vía webhook)

---

## Flujo de trabajo acordado

1. **Especificación** — se rellena este documento (reglas exactas, con ejemplos en gráfico si es posible: capturas con fecha/hora ayudan a validar).
2. **Traducción a Pine** — cada modelo se codifica como un módulo dentro de `indicator.pine` (v6).
3. **Validación visual** — se carga en TradingView y se compara contra los ejemplos reales que diste: ¿marca las mismas entradas que tú marcarías?
4. **Versión `strategy()`** — clon del indicador como estrategia para backtest automático (win rate, drawdown, R medio) sin cambiar la lógica.
5. **Iteración** — se ajustan reglas/filtros según lo que muestre el backtest y tu criterio.
