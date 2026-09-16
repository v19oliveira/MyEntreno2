/* ============================================================
   Victor Coach — Sincronización con Google Sheets
   Usa Google Identity Services (OAuth en el navegador, sin backend)
   + la API de Sheets v4. El Client ID y el ID de la hoja los
   introduces tú en Ajustes; nada de esto pasa por ningún servidor
   que no sea el de Google.
   ============================================================ */

const SheetsSync = {
  tokenClient: null,
  accessToken: null,
  gapiReady: false,

  SHEET_TABS: {
    running: { name: "Running", headers: ["Fecha", "Día", "Sesión Garmin", "Ritmo", "FC", "RPE", "Dolor", "Recuperación"] },
    fuerzaA: { name: "FuerzaA", headers: ["Fecha", "Ejercicio", "Serie 1", "Serie 2", "Serie 3", "Notas"] },
    fuerzaB: { name: "FuerzaB", headers: ["Fecha", "Ejercicio", "Serie 1", "Serie 2", "Serie 3", "Notas"] },
    movilidad: { name: "Movilidad", headers: ["Fecha", "Tobillo", "Cadera", "Cadena posterior", "Columna", "Notas"] },
    dieta: { name: "Dieta", headers: ["Fecha", "Cumplida", "Notas"] },
    progreso: { name: "Progreso", headers: ["Fecha", "Peso", "% Grasa", "Cintura", "Cadera", "Pecho", "Brazo", "Muslo", "Notas"] },
  },

  async initGapi() {
    if (this.gapiReady) return;
    await new Promise((resolve) => gapi.load("client", resolve));
    await gapi.client.init({
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    this.gapiReady = true;
  },

  connect(clientId, onStatus) {
    if (!clientId) {
      onStatus("Falta el Client ID. Añádelo primero en Ajustes.", true);
      return;
    }
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: async (resp) => {
        if (resp.error) {
          onStatus("No se pudo conectar: " + resp.error, true);
          return;
        }
        this.accessToken = resp.access_token;
        await this.initGapi();
        gapi.client.setToken({ access_token: this.accessToken });
        onStatus("Conectado a Google. Ya puedes sincronizar.", false);
      },
    });
    this.tokenClient.requestAccessToken();
  },

  async ensureSheetExists(spreadsheetId, tabName) {
    const meta = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const existe = meta.result.sheets.some((s) => s.properties.title === tabName);
    if (!existe) {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: [{ addSheet: { properties: { title: tabName } } }] },
      });
    }
  },

  async writeRows(spreadsheetId, tabName, headers, rows) {
    await this.ensureSheetExists(spreadsheetId, tabName);
    const values = [headers, ...rows];
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      resource: { values },
    });
  },

  rowsRunning() {
    return Store.data.running.map((e) => [e.fecha, e.dia, e.garmin || "", e.ritmo || "", e.fc || "", e.rpe || "", e.dolor || "", e.recuperacion || ""]);
  },

  rowsFuerza(coleccion) {
    const filas = [];
    Store.data[coleccion].forEach((e) => {
      e.ejercicios.forEach((ex) => {
        const s = ex.series.map((x) => (x.reps || x.carga ? `${x.reps || "-"} @ ${x.carga || "-"}` : ""));
        filas.push([e.fecha, ex.nombre, s[0] || "", s[1] || "", s[2] || "", e.notas || ""]);
      });
    });
    return filas;
  },

  rowsMovilidad() {
    return Store.data.movilidad.map((e) => [e.fecha, e.tobillo ? "Sí" : "", e.cadera ? "Sí" : "", e.cadena ? "Sí" : "", e.columna ? "Sí" : "", e.notas || ""]);
  },

  rowsDieta() {
    return Store.data.dieta.map((e) => [e.fecha, e.cumplida || "", e.notas || ""]);
  },

  rowsProgreso() {
    return Store.data.progreso.map((e) => [e.fecha, e.peso || "", e.grasa || "", e.cintura || "", e.cadera || "", e.pecho || "", e.brazo || "", e.muslo || "", e.notas || ""]);
  },

  async syncAll(spreadsheetId, onStatus) {
    if (!this.accessToken) {
      onStatus("Conéctate a Google primero.", true);
      return;
    }
    try {
      onStatus("Sincronizando…", false);
      await this.initGapi();
      gapi.client.setToken({ access_token: this.accessToken });

      await this.writeRows(spreadsheetId, this.SHEET_TABS.running.name, this.SHEET_TABS.running.headers, this.rowsRunning());
      await this.writeRows(spreadsheetId, this.SHEET_TABS.fuerzaA.name, this.SHEET_TABS.fuerzaA.headers, this.rowsFuerza("fuerzaA"));
      await this.writeRows(spreadsheetId, this.SHEET_TABS.fuerzaB.name, this.SHEET_TABS.fuerzaB.headers, this.rowsFuerza("fuerzaB"));
      await this.writeRows(spreadsheetId, this.SHEET_TABS.movilidad.name, this.SHEET_TABS.movilidad.headers, this.rowsMovilidad());
      await this.writeRows(spreadsheetId, this.SHEET_TABS.dieta.name, this.SHEET_TABS.dieta.headers, this.rowsDieta());
      await this.writeRows(spreadsheetId, this.SHEET_TABS.progreso.name, this.SHEET_TABS.progreso.headers, this.rowsProgreso());

      onStatus("Sincronizado · " + new Date().toLocaleTimeString("es-ES"), false);
    } catch (err) {
      console.error(err);
      onStatus("Error al sincronizar: " + (err.result?.error?.message || err.message), true);
    }
  },
};
