console.log("painel.js carregado – Painel Dirigente Equipamentos");
const SUPABASE_URL = "https://aifreazongolahcnvhrp.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZnJlYXpvbmdvbGFoY252aHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDY0NjIsImV4cCI6MjA4MDk4MjQ2Mn0.QbSVAONBBKFQY51RkIy5iOasdUoX0xyrz3iqFpgrGjs";
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
const TABLE_NAME = "escola_equipamentos";
const ESCOLA_FIELD = "escola_nome";

const COLS = {
    notebookPositivo: "notebook_positivo",
    notebookLenovo: "notebook_lenovo",
    notebookChromebook: "notebook_chromebook",
    notebookMultilaser: "notebook_multilaser",
    desktop: "desktop",
    tablet: "tablet",
    celular: "celular",
};

const state = {
    currentFilter: "todas",
    loading: false,
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarPainel();
});

async function inicializarPainel() {
    configurarListeners();
    await carregarEscolas();
    await atualizarPainel();
}

function configurarListeners() {
    const schoolSelect = document.getElementById("school-filter");
    if (!schoolSelect) return;

    schoolSelect.addEventListener("change", async (event) => {
        state.currentFilter = event.target.value;
        await atualizarPainel();
    });
}

async function carregarEscolas() {
    setLoading(true);

    const select = document.getElementById("school-filter");
    if (!select) return;

    select.innerHTML = '<option value="todas">Todas as escolas</option>';

    const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .select(ESCOLA_FIELD);

    if (error) {
        console.error("Erro ao carregar escolas:", error);
        setLoading(false);
        return;
    }

    const nomes = Array.from(
        new Set(
            (data || [])
                .map((item) => item[ESCOLA_FIELD])
                .filter((nome) => !!nome)
        )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    for (const escola of nomes) {
        const opt = document.createElement("option");
        opt.value = escola;
        opt.textContent = escola;
        select.appendChild(opt);
    }

    setLoading(false);
}

async function atualizarPainel() {
    setLoading(true);

    let query = supabaseClient
        .from(TABLE_NAME)
        .select(
            `${ESCOLA_FIELD}, ${COLS.notebookPositivo}, ${COLS.notebookLenovo}, ${COLS.notebookChromebook}, ${COLS.notebookMultilaser}, ${COLS.desktop}, ${COLS.tablet}, ${COLS.celular}`
        );

    if (state.currentFilter && state.currentFilter !== "todas") {
        query = query.eq(ESCOLA_FIELD, state.currentFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao carregar dados:", error);
        setLoading(false);
        return;
    }

    const registros = data || [];
    const getNum = (row, col) => Number(row[col] ?? 0);

    const contagem = {
        positivo: 0,
        lenovo: 0,
        chromebook: 0,
        multilaser: 0,
        desktop: 0,
        tablet: 0,
        celular: 0,
    };

    for (const row of registros) {
        contagem.positivo += getNum(row, COLS.notebookPositivo);
        contagem.lenovo += getNum(row, COLS.notebookLenovo);
        contagem.chromebook += getNum(row, COLS.notebookChromebook);
        contagem.multilaser += getNum(row, COLS.notebookMultilaser);
        contagem.desktop += getNum(row, COLS.desktop);
        contagem.tablet += getNum(row, COLS.tablet);
        contagem.celular += getNum(row, COLS.celular);
    }

    const totalGeral =
        contagem.positivo +
        contagem.lenovo +
        contagem.chromebook +
        contagem.multilaser +
        contagem.desktop +
        contagem.tablet +
        contagem.celular;

    atualizarValorCard("total-count", totalGeral);
    atualizarValorCard("positivo-count", contagem.positivo);
    atualizarValorCard("tablet-count", contagem.tablet);
    atualizarValorCard("celular-count", contagem.celular);
    atualizarValorCard("lenovo-count", contagem.lenovo);
    atualizarValorCard("chromebook-count", contagem.chromebook);
    atualizarValorCard("multilaser-count", contagem.multilaser);
    atualizarValorCard("desktop-count", contagem.desktop);

    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleString("pt-BR");
    }

    setLoading(false);
}

function atualizarValorCard(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = valor;
}

function setLoading(isLoading) {
    state.loading = isLoading;
}
