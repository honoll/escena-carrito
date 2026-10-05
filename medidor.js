/*
 * Medidor de fluidez para comparar versiones en un teléfono real. Solo aparece con
 * ?medir en la dirección. No sabe nada de la escena: cuenta los cuadros que el navegador
 * de verdad pinta mientras se hace scroll, que es lo que el ojo nota como "lento".
 *
 * - "cuadros por segundo": el promedio de los últimos 60 cuadros con el dedo moviéndose.
 * - "cuadros lentos": cuántos tardaron más de 25 ms (menos de 40 por segundo) desde que
 *   se abrió la página. Es lo que se siente como tirón.
 */
(() => {
  if (!new URLSearchParams(location.search).has('medir')) return;
  const caja = document.createElement('div');
  Object.assign(caja.style, {
    position: 'fixed', top: '8px', right: '8px', zIndex: '99', pointerEvents: 'none',
    background: 'rgba(35,39,65,.94)', color: '#FBF7F0', padding: '8px 10px', borderRadius: '3px',
    font: '600 13px/1.35 ui-monospace, Menlo, Consolas, monospace', whiteSpace: 'pre', minWidth: '170px',
  });
  document.body.appendChild(caja);

  const ultimos = [];
  let anterior = 0, total = 0, lentos = 0, moviendo = 0, corriendo = false;
  const mostrar = () => {
    if (!ultimos.length) { caja.textContent = 'Baja con el dedo…'; return; }
    const promedio = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
    caja.textContent = `${Math.round(1000 / promedio)} cuadros/seg\n`
      + `${Math.round((100 * lentos) / Math.max(1, total))} % cuadros lentos\n`
      + `${total} cuadros medidos`;
  };
  const cuadro = (t) => {
    if (anterior) {
      const d = t - anterior;
      if (d < 300) {                       // una pausa del dedo no cuenta como cuadro lento
        ultimos.push(d); if (ultimos.length > 60) ultimos.shift();
        total++; if (d > 25) lentos++;
      }
    }
    anterior = t;
    mostrar();
    if (performance.now() - moviendo < 300) requestAnimationFrame(cuadro);
    else { corriendo = false; anterior = 0; }
  };
  addEventListener('scroll', () => {
    moviendo = performance.now();
    if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); }
  }, { passive: true });
  mostrar();
})();
