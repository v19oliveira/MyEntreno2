/* ============================================================
   Victor Coach — UI
   Funciones puras de renderizado. No leen eventos, solo pintan
   el estado actual de Store en el DOM.
   ============================================================ */

const POSE_ICONS = {
  squat: `<circle cx="20" cy="7" r="3"/><path d="M20 10v8"/><path d="M20 18l-6 4v9"/><path d="M20 18l6 4v9"/><path d="M14 22l-3-1"/><path d="M26 22l3-1"/>`,
  lunge: `<circle cx="15" cy="7" r="3"/><path d="M15 10v7"/><path d="M15 17l-6 5v9"/><path d="M15 17l9 3 4 11"/><path d="M9 22l-3 2"/>`,
  bridge: `<circle cx="8" cy="21" r="3"/><path d="M11 22h9"/><path d="M20 22l6-8"/><path d="M26 14l4 6"/><path d="M30 20l1 6"/><path d="M4 33h32" stroke-dasharray="2 4"/>`,
  calf: `<circle cx="20" cy="7" r="3"/><path d="M20 10v9"/><path d="M20 19l-5 6v8"/><path d="M20 19l5 6-1 8"/><path d="M15 33l3-2"/><path d="M24 33l-1-2"/><path d="M27 24l3-5" marker-end="url(#arrow)"/>`,
  raise: `<circle cx="12" cy="26" r="3"/><path d="M12 29l10-2"/><path d="M22 27l6 1"/><path d="M28 28l4-9"/><path d="M32 19l3 2"/><path d="M32 19l1 4"/>`,
  balance: `<circle cx="20" cy="7" r="3"/><path d="M20 10v9"/><path d="M20 12l-7-2"/><path d="M20 12l7 3"/><path d="M20 19l0 8"/><path d="M20 27l-4 6"/><path d="M20 21l6 3 2 8"/>`,
  step: `<rect x="24" y="26" width="10" height="7"/><circle cx="16" cy="7" r="3"/><path d="M16 10v8"/><path d="M16 18l-6 4v9"/><path d="M16 18l9 4v4"/><path d="M25 26l0-4"/>`,
  core: `<circle cx="9" cy="15" r="3"/><path d="M12 16l9 1"/><path d="M21 17l7-5"/><path d="M21 17l6 6"/><path d="M21 17v9"/><path d="M21 26l-5 5"/><path d="M21 26l6 3"/>`,
};

const POSE_BY_EXERCISE = {
  sentadilla: "squat", splitSquat: "lunge", puenteGluteos: "bridge", gemelos: "calf",
  tibialis: "raise", deadBug: "core", reverseLunge: "lunge", stepUp: "step",
  singleGlute: "bridge", gemeloUni: "calf", equilibrio: "balance", coreSinBrazo: "core",
};

function poseSvg(exId) {
  const pose = POSE_BY_EXERCISE[exId] || "squat";
  return `<svg class="ex-pose" viewBox="0 0 40 40" aria-hidden="true">${POSE_ICONS[pose]}</svg>`;
}

const UI = {
  fmtFecha(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  },

  pintarInicio() {
    const p = Store.data.perfil;
    document.getElementById("fechaHoy").textContent = new Date().toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
    document.getElementById("inPeso").value = p.peso ?? "";
    document.getElementById("inGrasa").value = p.grasa ?? "";
    document.getElementById("inObjetivo").value = p.objetivo ?? "";
    document.getElementById("inRevision").value = p.proximaRevision ?? "";

    const ultimo = Store.ultimoEntrenamiento();
    document.getElementById("ultimoEntreno").textContent = ultimo
      ? `${ultimo.texto} · ${this.fmtFecha(ultimo.fecha)}`
      : "Sin registros todavía";

    const strip = document.getElementById("weekStrip");
    strip.innerHTML = WEEK_PLAN.map(
      (d) => `<div class="week-day ${d.rest ? "is-rest" : ""}">
                <span class="week-day-name">${d.dia}</span>
                <span class="week-day-tag">${d.tag}</span>
              </div>`
    ).join("");

    const r = Store.resumenSemana();
    const sum = document.getElementById("weeklySummary");
    sum.innerHTML = `
      <div class="summary-pill"><strong>${r.running}/4</strong><span>Running</span></div>
      <div class="summary-pill"><strong>${r.fuerzaA}/1</strong><span>Fuerza A</span></div>
      <div class="summary-pill"><strong>${r.fuerzaB}/1</strong><span>Fuerza B</span></div>
      <div class="summary-pill"><strong>${r.movilidad}/1</strong><span>Movilidad</span></div>`;
  },

  entradaGenerica(coleccion, id, titulo, detalles) {
    return `<div class="log-entry" data-col="${coleccion}" data-id="${id}">
      <div class="log-entry-main">
        <div class="log-entry-date">${this.fmtFecha(this.dataFechaDe(coleccion, id))}</div>
        <div class="log-entry-title">${titulo}</div>
        ${detalles.map((d) => `<div class="log-entry-detail">${d}</div>`).join("")}
      </div>
      <button class="log-entry-del" title="Eliminar" data-del="${coleccion}:${id}">×</button>
    </div>`;
  },

  dataFechaDe(coleccion, id) {
    const e = Store.data[coleccion].find((x) => x.id === id);
    return e ? e.fecha : "";
  },

  pintarLista(coleccion, contenedorId, builder) {
    const cont = document.getElementById(contenedorId);
    const items = Store.data[coleccion];
    if (!items.length) {
      cont.innerHTML = `<p class="empty-state">Todavía no hay registros.</p>`;
      return;
    }
    cont.innerHTML = items.map((e) => builder(e)).join("");
  },

  pintarRunning() {
    this.pintarLista("running", "listRunning", (e) =>
      this.entradaGenerica("running", e.id, `Running — ${e.dia}`, [
        e.garmin ? `Sesión: ${e.garmin}` : null,
        [e.ritmo && `Ritmo ${e.ritmo}`, e.fc && `FC ${e.fc} ppm`, e.rpe && `RPE ${e.rpe}`].filter(Boolean).join(" · "),
        e.dolor ? `Molestias: ${e.dolor}` : null,
        e.recuperacion ? `Recuperación: ${e.recuperacion}` : null,
      ].filter(Boolean))
    );
  },

  exerciseBlock(contenedorId, lista) {
    const cont = document.getElementById(contenedorId);
    cont.innerHTML = lista
      .map(
        (ex) => `<div class="exercise-card" data-ex="${ex.id}">
          <div class="exercise-card-head">
            ${poseSvg(ex.id)}
            <span class="exercise-name">${ex.nombre}</span>
            <span class="exercise-target">${ex.objetivo}</span>
          </div>
          ${[1, 2, 3]
            .map(
              (n) => `<div class="set-row">
                <span class="set-idx">S${n}</span>
                <input type="text" placeholder="reps" data-field="reps" data-set="${n}">
                <input type="text" placeholder="carga / nota" data-field="carga" data-set="${n}">
              </div>`
            )
            .join("")}
        </div>`
      )
      .join("");
  },

  leerExerciseBlock(contenedorId, lista) {
    const cont = document.getElementById(contenedorId);
    return lista.map((ex) => {
      const card = cont.querySelector(`[data-ex="${ex.id}"]`);
      const series = [1, 2, 3].map((n) => ({
        reps: card.querySelector(`[data-set="${n}"][data-field="reps"]`).value,
        carga: card.querySelector(`[data-set="${n}"][data-field="carga"]`).value,
      }));
      return { id: ex.id, nombre: ex.nombre, series };
    });
  },

  pintarFuerza(coleccion, contenedorId) {
    this.pintarLista(coleccion, contenedorId, (e) => {
      const resumen = e.ejercicios
        .filter((ex) => ex.series.some((s) => s.reps || s.carga))
        .map((ex) => {
          const partes = ex.series.filter((s) => s.reps || s.carga).map((s) => `${s.reps || "–"}${s.carga ? " @ " + s.carga : ""}`);
          return `${ex.nombre}: ${partes.join(", ")}`;
        });
      return this.entradaGenerica(coleccion, e.id, e.titulo || "Sesión de fuerza", [
        ...resumen,
        e.notas ? `Notas: ${e.notas}` : null,
      ].filter(Boolean));
    });
  },

  pintarMovilidad() {
    this.pintarLista("movilidad", "listMovilidad", (e) => {
      const hechos = [
        e.tobillo && "Tobillo", e.cadera && "Cadera", e.cadena && "Cadena posterior", e.columna && "Columna",
      ].filter(Boolean);
      return this.entradaGenerica("movilidad", e.id, "Sesión de movilidad", [
        hechos.length ? hechos.join(" · ") : "Sin bloques marcados",
        e.notas || null,
      ].filter(Boolean));
    });
  },

  pintarDietaEstatica() {
    document.getElementById("mealGrid").innerHTML = MEALS.map(
      (m) => `<div class="meal-card"><h3>${m.titulo}</h3><p>${m.detalle}</p></div>`
    ).join("");
    document.getElementById("swapTable").innerHTML = CARB_SWAPS.map(
      ([nombre, nota]) => `<div class="swap-row"><strong>${nombre}</strong><span>${nota}</span></div>`
    ).join("");
  },

  pintarDietaLog() {
    this.pintarLista("dieta", "listDieta", (e) =>
      this.entradaGenerica("dieta", e.id, e.cumplida || "Registro", [e.notas || null].filter(Boolean))
    );
  },

  pintarProgreso() {
    this.pintarLista("progreso", "listProgreso", (e) => {
      const medidas = [
        e.peso && `Peso ${e.peso} kg`, e.grasa && `Grasa ${e.grasa}%`, e.cintura && `Cintura ${e.cintura} cm`,
        e.cadera && `Cadera ${e.cadera} cm`, e.pecho && `Pecho ${e.pecho} cm`, e.brazo && `Brazo ${e.brazo} cm`,
        e.muslo && `Muslo ${e.muslo} cm`,
      ].filter(Boolean);
      return this.entradaGenerica("progreso", e.id, "Medición", [medidas.join(" · "), e.notas || null].filter(Boolean));
    });
  },

  pintarAjustes() {
    document.getElementById("cfgClientId").value = Store.data.ajustes.clientId || "";
    document.getElementById("cfgSheetId").value = Store.data.ajustes.spreadsheetId || "";
  },

  pintarTodo() {
    this.pintarInicio();
    this.pintarRunning();
    this.exerciseBlock("exBlockA", EXERCISES_A);
    this.exerciseBlock("exBlockB", EXERCISES_B);
    this.pintarFuerza("fuerzaA", "listFuerzaA");
    this.pintarFuerza("fuerzaB", "listFuerzaB");
    this.pintarMovilidad();
    this.pintarDietaEstatica();
    this.pintarDietaLog();
    this.pintarProgreso();
    this.pintarAjustes();
  },
};
