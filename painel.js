console.log("painel.js carregado – Painel Dirigente Equipamentos");
const SUPABASE_URL = "https://aifreazongolahcnvhrp.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZnJlYXpvbmdvbGFoY252aHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDY0NjIsImV4cCI6MjA4MDk4MjQ2Mn0.QbSVAONBBKFQY51RkIy5iOasdUoX0xyrz3iqFpgrGjs";
const TABLE_NAME = "escola_equipamentos";
const ESCOLA_FIELD = "escola_nome";
const COLS = {
    notebookPositivo: "notebook_positivo",
    notebookLenovo: "notebook_lenovo",
    notebookChromebook: "notebook_chromebook",
    desktop: "desktop",
    tablet: "tablet",
    celular: "celular",
};
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
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
    setLoading(true, "Carregando escolas...");

    const select = document.getElementById("school-filter");
    if (!select) return;

    // Reseta com opção padrão
    select.innerHTML = '<option value="todas">Todas as escolas</option>';

    const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .select(ESCOLA_FIELD);

    if (error) {
        console.error("Erro ao carregar escolas:", error);
        setStatus("Erro ao carregar escolas. Verifique o console.");
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
    setLoading(true, "Carregando equipamentos...");

    let query = supabaseClient
        .from(TABLE_NAME)
        .select(
            `${ESCOLA_FIELD}, ${COLS.notebookPositivo}, ${COLS.notebookLenovo}, ${COLS.notebookChromebook}, ${COLS.desktop}, ${COLS.tablet}, ${COLS.celular}`
        );

    if (state.currentFilter && state.currentFilter !== "todas") {
        query = query.eq(ESCOLA_FIELD, state.currentFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao carregar dados:", error);
        setStatus("Erro ao carregar dados. Verifique o console.");
        setLoading(false);
        return;
    }

    const registros = data || [];

    const totais = {
        tablet: 0,
        celular: 0,
        lenovo: 0,
        chromebook: 0,
        desktop: 0,
        positivo: 0,
    };

    const getNum = (row, colName) => Number(row[colName] ?? 0);

    for (const row of registros) {
        totais.tablet += getNum(row, COLS.tablet);
        totais.celular += getNum(row, COLS.celular);
        totais.lenovo += getNum(row, COLS.notebookLenovo);
        totais.chromebook += getNum(row, COLS.notebookChromebook);
        totais.desktop += getNum(row, COLS.desktop);
        totais.positivo += getNum(row, COLS.notebookPositivo);
    }

    const totalGeral =
        totais.tablet +
        totais.celular +
        totais.lenovo +
        totais.chromebook +
        totais.desktop +
        totais.positivo; 

    atualizarValorCard("total-count", totalGeral);
    atualizarValorCard("tablet-count", totais.tablet);
    atualizarValorCard("celular-count", totais.celular);
    atualizarValorCard("lenovo-count", totais.lenovo);
    atualizarValorCard("chromebook-count", totais.chromebook);
    atualizarValorCard("desktop-count", totais.desktop);
    
    const filtroTexto =
        state.currentFilter === "todas"
            ? "todas as escolas"
            : state.currentFilter;

    if (registros.length === 0) {
        setStatus(`Nenhum registro encontrado para ${filtroTexto}.`);
    } else {
        setStatus(
            `Exibindo ${totalGeral} equipamentos cadastrados para ${filtroTexto}.`
        );
    }

    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) {
        const agora = new Date();
        lastUpdated.textContent = agora.toLocaleString("pt-BR");
    }

    setLoading(false);
}

function atualizarValorCard(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = valor;
}

function setLoading(isLoading, mensagemSeCarregando) {
    state.loading = isLoading;
    const loader = document.getElementById("loader");
    const statusEl = document.getElementById("status-text");

    if (loader) {
        loader.style.display = isLoading ? "inline-block" : "none";
    }

    if (statusEl && isLoading && mensagemSeCarregando) {
        statusEl.textContent = mensagemSeCarregando;
    }
}

function setStatus(mensagem) {
    const statusEl = document.getElementById("status-text");
    if (!statusEl) return;
    statusEl.textContent = mensagem;
}
