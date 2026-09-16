/* ============================================================
   Victor Coach — App
   Inicialización, navegación entre vistas y eventos de formularios.
   ============================================================ */

(function () {
  Store.load();
  UI.pintarTodo();
  hoyEnCamposFecha();
  actualizarEstadoNav();

  // ---------- Navegación ----------
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.getElementById("view-" + btn.dataset.section).classList.add("is-active");
    });
  });

  function hoyEnCamposFecha() {
    const hoy = new Date().toISOString().slice(0, 10);
    ["rFecha", "faFecha", "fbFecha", "mFecha", "dFecha", "pFecha"].forEach((id) => {
      document.getElementById(id).value = hoy;
    });
  }

  // ---------- Inicio: campos editables ----------
  function guardarPerfilCampo(id, campo, parse) {
    document.getElementById(id).addEventListener("change", (e) => {
      Store.data.perfil[campo] = parse ? parse(e.target.value) : e.target.value;
      Store.save();
      UI.pintarInicio();
    });
  }
  guardarPerfilCampo("inPeso", "peso", parseFloat);
  guardarPerfilCampo("inGrasa", "grasa", parseFloat);
  guardarPerfilCampo("inObjetivo", "objetivo");
  guardarPerfilCampo("inRevision", "proximaRevision");

  // ---------- Running ----------
  document.getElementById("formRunning").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.addEntry("running", {
      fecha: val("rFecha"), dia: val("rDia"), garmin: val("rGarmin"),
      ritmo: val("rRitmo"), fc: val("rFc"), rpe: val("rRpe"),
      dolor: val("rDolor"), recuperacion: val("rRecuperacion"),
    });
    e.target.reset();
    hoyEnCamposFecha();
    UI.pintarRunning();
    UI.pintarInicio();
  });

  // ---------- Fuerza A / B ----------
  function wireFuerza(formId, fechaId, bloqueId, lista, coleccion, tituloDefault) {
    document.getElementById(formId).addEventListener("submit", (e) => {
      e.preventDefault();
      const ejercicios = UI.leerExerciseBlock(bloqueId, lista);
      Store.addEntry(coleccion, {
        fecha: val(fechaId), titulo: tituloDefault,
        ejercicios, notas: val(formId === "formFuerzaA" ? "faNotas" : "fbNotas"),
      });
      e.target.reset();
      hoyEnCamposFecha();
      UI.exerciseBlock(bloqueId, lista);
      UI.pintarFuerza(coleccion, coleccion === "fuerzaA" ? "listFuerzaA" : "listFuerzaB");
      UI.pintarInicio();
    });
  }
  wireFuerza("formFuerzaA", "faFecha", "exBlockA", EXERCISES_A, "fuerzaA", "Fuerza A");
  wireFuerza("formFuerzaB", "fbFecha", "exBlockB", EXERCISES_B, "fuerzaB", "Fuerza B");

  // ---------- Movilidad ----------
  document.getElementById("formMovilidad").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.addEntry("movilidad", {
      fecha: val("mFecha"),
      tobillo: chk("mTobillo"), cadera: chk("mCadera"), cadena: chk("mCadena"), columna: chk("mColumna"),
      notas: val("mNotas"),
    });
    e.target.reset();
    hoyEnCamposFecha();
    UI.pintarMovilidad();
    UI.pintarInicio();
  });

  // ---------- Dieta ----------
  document.getElementById("formDieta").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.addEntry("dieta", { fecha: val("dFecha"), cumplida: val("dCumplida"), notas: val("dNotas") });
    e.target.reset();
    hoyEnCamposFecha();
    UI.pintarDietaLog();
  });

  // ---------- Progreso ----------
  document.getElementById("formProgreso").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.addEntry("progreso", {
      fecha: val("pFecha"), peso: val("pPeso"), grasa: val("pGrasa"), cintura: val("pCintura"),
      cadera: val("pCadera"), pecho: val("pPecho"), brazo: val("pBrazo"), muslo: val("pMuslo"), notas: val("pNotas"),
    });
    e.target.reset();
    hoyEnCamposFecha();
    UI.pintarProgreso();
  });

  document.getElementById("btnCopiarIA").addEventListener("click", async () => {
    const ultimos = Store.data.progreso.slice(0, 6);
    const texto = [
      `Resumen de progreso — Victor (${new Date().toLocaleDateString("es-ES")})`,
      `Objetivo actual: ${Store.data.perfil.objetivo}`,
      "",
      ...ultimos.map(
        (e) =>
          `${UI.fmtFecha(e.fecha)}: peso ${e.peso || "-"} kg, grasa ${e.grasa || "-"}%, cintura ${e.cintura || "-"} cm, cadera ${e.cadera || "-"} cm, pecho ${e.pecho || "-"} cm, brazo ${e.brazo || "-"} cm, muslo ${e.muslo || "-"} cm. ${e.notas || ""}`
      ),
      "",
      `Sesiones últimos 7 días — Running: ${Store.resumenSemana().running}/4, Fuerza A: ${Store.resumenSemana().fuerzaA}/1, Fuerza B: ${Store.resumenSemana().fuerzaB}/1, Movilidad: ${Store.resumenSemana().movilidad}/1.`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      flashBoton("btnCopiarIA", "Copiado ✓");
    } catch {
      prompt("Copia el texto manualmente:", texto);
    }
  });

  // ---------- Borrado de entradas (delegado) ----------
  document.querySelectorAll(".log-list").forEach((cont) => {
    cont.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del]");
      if (!btn) return;
      const [coleccion, id] = btn.dataset.del.split(":");
      if (!confirm("¿Eliminar este registro?")) return;
      Store.deleteEntry(coleccion, id);
      UI.pintarTodo();
    });
  });

  // ---------- Ajustes ----------
  document.getElementById("btnGuardarCfg").addEventListener("click", () => {
    Store.data.ajustes.clientId = val("cfgClientId");
    Store.data.ajustes.spreadsheetId = val("cfgSheetId");
    Store.save();
    setSyncStatus("Ajustes guardados.", false);
  });

  document.getElementById("btnConectarGoogle").addEventListener("click", () => {
    SheetsSync.connect(Store.data.ajustes.clientId, (msg, isError) => {
      setSyncStatus(msg, isError);
      if (!isError && msg.startsWith("Conectado")) {
        document.getElementById("btnSyncAll").disabled = false;
        document.getElementById("navSyncState").textContent = "Conectado a Sheets";
      }
    });
  });

  document.getElementById("btnSyncAll").addEventListener("click", () => {
    SheetsSync.syncAll(Store.data.ajustes.spreadsheetId, setSyncStatus);
  });

  document.getElementById("btnSyncProgreso").addEventListener("click", () => {
    if (!Store.data.ajustes.spreadsheetId) {
      alert("Configura primero el ID de la hoja en Ajustes.");
      return;
    }
    SheetsSync.syncAll(Store.data.ajustes.spreadsheetId, setSyncStatus);
  });

  function setSyncStatus(msg, isError) {
    const el = document.getElementById("syncStatus");
    el.textContent = msg;
    el.style.color = isError ? "var(--danger)" : "var(--ink-muted)";
  }

  // ---------- Datos locales ----------
  document.getElementById("btnExportJson").addEventListener("click", () => {
    const blob = new Blob([Store.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `victor-coach-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  document.getElementById("btnImportJson").addEventListener("click", () => document.getElementById("fileImport").click());
  document.getElementById("fileImport").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJSON(reader.result);
        UI.pintarTodo();
        alert("Datos importados.");
      } catch {
        alert("El archivo no es una copia válida.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    if (!confirm("Esto borra todos los datos guardados en este dispositivo. ¿Continuar?")) return;
    Store.reset();
    UI.pintarTodo();
  });

  // ---------- Helpers ----------
  function val(id) { return document.getElementById(id).value; }
  function chk(id) { return document.getElementById(id).checked; }
  function flashBoton(id, texto) {
    const b = document.getElementById(id);
    const original = b.textContent;
    b.textContent = texto;
    setTimeout(() => (b.textContent = original), 1600);
  }
  function actualizarEstadoNav() {
    document.getElementById("navSyncState").textContent = Store.data.ajustes.spreadsheetId ? "Local + Sheets configurado" : "Solo local";
  }

  // ---------- Service worker (offline) ----------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
