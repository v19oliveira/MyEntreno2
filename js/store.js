/* ============================================================
   Victor Coach — Store
   Toda la persistencia vive en localStorage bajo una única clave.
   Nada de esto viaja a ningún sitio salvo que pulses "Sincronizar".
   ============================================================ */

const STORAGE_KEY = "victorCoachData_v1";

const EXERCISES_A = [
  { id: "sentadilla", nombre: "Sentadilla", objetivo: "3×10–15" },
  { id: "splitSquat", nombre: "Split squat", objetivo: "3×8–12 / pierna" },
  { id: "puenteGluteos", nombre: "Puente de glúteos", objetivo: "3×12–15" },
  { id: "gemelos", nombre: "Gemelos", objetivo: "3×15–20" },
  { id: "tibialis", nombre: "Tibialis raises", objetivo: "3×15–20" },
  { id: "deadBug", nombre: "Dead bug", objetivo: "3×8–10 / lado" },
];

const EXERCISES_B = [
  { id: "reverseLunge", nombre: "Reverse lunge", objetivo: "3×8–12 / pierna" },
  { id: "stepUp", nombre: "Step-up", objetivo: "3×8–12 / pierna" },
  { id: "singleGlute", nombre: "Single-leg glute bridge", objetivo: "3×10 / pierna" },
  { id: "gemeloUni", nombre: "Gemelo unilateral", objetivo: "3×12–15 / pierna" },
  { id: "equilibrio", nombre: "Equilibrio monopodal", objetivo: "2×30–45 s / pierna" },
  { id: "coreSinBrazo", nombre: "Core sin cargar brazo izquierdo", objetivo: "3 series" },
];

const MEALS = [
  { titulo: "Desayuno", detalle: "2 huevos + 1–2 tostadas integrales (60 g) + jamón de pavo (50 g) + AOVE (10 ml)." },
  { titulo: "Media mañana", detalle: "Yogur proteico (250 g, ≈20 g prot.) + 1 pieza de fruta." },
  { titulo: "Comida", detalle: "Pollo 150–180 g + patata o arroz 200–250 g cocido + verdura + AOVE." },
  { titulo: "Merienda", detalle: "Yogur proteico o tostadas de arroz (2–3) + jamón de pavo 40 g." },
  { titulo: "Cena", detalle: "Tortilla francesa (3 huevos) + verdura salteada. Día de entreno fuerte: añade fruta o 50 g de arroz." },
];

const CARB_SWAPS = [
  ["Patata cocida — 250 g", "Ración base"],
  ["Arroz blanco cocido — 200 g", "Equivalente en carbohidrato"],
  ["Boniato asado — 220 g", "Equivalente en carbohidrato"],
  ["Pasta cocida — 200 g", "Equivalente en carbohidrato"],
  ["Quinoa cocida — 200 g", "Equivalente en carbohidrato, más proteína"],
];

const WEEK_PLAN = [
  { dia: "Lun", tag: "Running", rest: false },
  { dia: "Mar", tag: "Fuerza A", rest: false },
  { dia: "Mié", tag: "Running", rest: false },
  { dia: "Jue", tag: "Fuerza B", rest: false },
  { dia: "Vie", tag: "Running", rest: false },
  { dia: "Sáb", tag: "Suave / Movilidad", rest: true },
  { dia: "Dom", tag: "Running", rest: false },
];

function defaultData() {
  return {
    perfil: {
      peso: 84,
      grasa: null,
      objetivo: "≈2.200 kcal · 180 g proteína · definición manteniendo masa muscular",
      proximaRevision: null,
    },
    running: [],
    fuerzaA: [],
    fuerzaB: [],
    movilidad: [],
    dieta: [],
    progreso: [],
    ajustes: { clientId: "", spreadsheetId: "" },
  };
}

const Store = {
  data: null,

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.data = defaultData();
      this.save();
      return this.data;
    }
    try {
      const parsed = JSON.parse(raw);
      this.data = Object.assign(defaultData(), parsed);
    } catch (e) {
      console.error("No se pudo leer el almacenamiento local, se reinicia.", e);
      this.data = defaultData();
    }
    return this.data;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  addEntry(coleccion, entry) {
    entry.id = entry.id || (Date.now() + "-" + Math.random().toString(36).slice(2, 7));
    this.data[coleccion].unshift(entry);
    this.data[coleccion].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    this.save();
    return entry;
  },

  deleteEntry(coleccion, id) {
    this.data[coleccion] = this.data[coleccion].filter((e) => e.id !== id);
    this.save();
  },

  ultimoEntrenamiento() {
    const todas = []
      .concat(this.data.running.map((e) => ({ fecha: e.fecha, texto: `Running — ${e.dia}` })))
      .concat(this.data.fuerzaA.map((e) => ({ fecha: e.fecha, texto: "Fuerza A" })))
      .concat(this.data.fuerzaB.map((e) => ({ fecha: e.fecha, texto: "Fuerza B" })))
      .concat(this.data.movilidad.map((e) => ({ fecha: e.fecha, texto: "Movilidad" })));
    if (!todas.length) return null;
    todas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    return todas[0];
  },

  resumenSemana() {
    const inicio = new Date();
    const dow = (inicio.getDay() + 6) % 7; // lunes = 0
    inicio.setDate(inicio.getDate() - dow);
    inicio.setHours(0, 0, 0, 0);
    const enEstaSemana = (fecha) => new Date(fecha) >= inicio;

    return {
      running: this.data.running.filter((e) => enEstaSemana(e.fecha)).length,
      fuerzaA: this.data.fuerzaA.filter((e) => enEstaSemana(e.fecha)).length,
      fuerzaB: this.data.fuerzaB.filter((e) => enEstaSemana(e.fecha)).length,
      movilidad: this.data.movilidad.filter((e) => enEstaSemana(e.fecha)).length,
    };
  },

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  },

  importJSON(text) {
    const parsed = JSON.parse(text);
    this.data = Object.assign(defaultData(), parsed);
    this.save();
  },

  reset() {
    this.data = defaultData();
    this.save();
  },
};
