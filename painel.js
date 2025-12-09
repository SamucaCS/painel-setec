const SUPABASE_URL = "https://thcxlfpxjokvegkzcjuh.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY3hsZnB4am9rdmVna3pjanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjc0OTQsImV4cCI6MjA3OTcwMzQ5NH0.rv_qmpcdx-OU01bz1NPw3pGRTntAh389XwSZ3G59xRM";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado em memória
let escolas = [];

// Elementos de UI
const schoolSelect = document.getElementById("schoolSelect");
const viewModeLabel = document.getElementById("viewModeLabel");

const totalEquipEl = document.getElementById("totalEquip");
const totalPositivoEl = document.getElementById("totalPositivo");
const totalLenovoEl = document.getElementById("totalLenovo");
const totalDesktopEl = document.getElementById("totalDesktop");
const totalTabletEl = document.getElementById("totalTablet");
const totalCelularEl = document.getElementById("totalCelular");

let equipmentChart = null;

// ========== CARREGAR DADOS DO BANCO ==========

async function carregarEscolasDoBanco() {
    // busca todos os registros da tabela
    const { data, error } = await supabase
        .from("equipamentos_escola")
        .select("*")
        .order("escola_nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar escolas:", error);
        schoolSelect.innerHTML = `<option value="all">Erro ao carregar: veja o console</option>`;
        return;
    }

    escolas = data || [];
    preencherSelectEscolas();
    atualizarCardsResumo("all");
    inicializarGrafico();
    atualizarPillViewLabel("all");
}

// ========== FUNÇÕES DE UI ==========

function preencherSelectEscolas() {
    schoolSelect.innerHTML = "";

    const optionAll = document.createElement("option");
    optionAll.value = "all";
    optionAll.textContent = "Todas as escolas";
    schoolSelect.appendChild(optionAll);

    escolas.forEach((esc) => {
        const opt = document.createElement("option");
        opt.value = String(esc.id);
        opt.textContent = esc.escola_nome;
        schoolSelect.appendChild(opt);
    });
}

function calcularTotais(idEscola = "all") {
    let notebook_positivo = 0;
    let notebook_lenovo = 0;
    let desktop = 0;
    let tablet = 0;
    let celular = 0;

    if (idEscola === "all") {
        escolas.forEach((esc) => {
            notebook_positivo += esc.notebook_positivo || 0;
            notebook_lenovo += esc.notebook_lenovo || 0;
            desktop += esc.desktop || 0;
            tablet += esc.tablet || 0;
            celular += esc.celular || 0;
        });
    } else {
        const escola = escolas.find((e) => String(e.id) === String(idEscola));
        if (escola) {
            notebook_positivo = escola.notebook_positivo || 0;
            notebook_lenovo = escola.notebook_lenovo || 0;
            desktop = escola.desktop || 0;
            tablet = escola.tablet || 0;
            celular = escola.celular || 0;
        }
    }

    const total = notebook_positivo + notebook_lenovo + desktop + tablet + celular;

    return {
        total,
        notebook_positivo,
        notebook_lenovo,
        desktop,
        tablet,
        celular,
    };
}

function atualizarCardsResumo(idEscola) {
    const t = calcularTotais(idEscola);

    totalEquipEl.textContent = t.total;
    totalPositivoEl.textContent = t.notebook_positivo;
    totalLenovoEl.textContent = t.notebook_lenovo;
    totalDesktopEl.textContent = t.desktop;
    totalTabletEl.textContent = t.tablet;
    totalCelularEl.textContent = t.celular;
}

// ========== GRÁFICO ==========

function inicializarGrafico() {
    const canvas = document.getElementById("equipmentChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const t = calcularTotais("all");

    equipmentChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "Notebook Positivo",
                "Notebook Lenovo",
                "Desktop",
                "Tablet",
                "Celular",
            ],
            datasets: [
                {
                    label: "Quantidade de equipamentos",
                    data: [
                        t.notebook_positivo,
                        t.notebook_lenovo,
                        t.desktop,
                        t.tablet,
                        t.celular,
                    ],
                    borderWidth: 1,
                    borderRadius: 10,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "rgba(148, 163, 184, 0.25)" },
                },
                x: {
                    grid: { display: false },
                },
            },
            plugins: {
                legend: {
                    labels: { font: { size: 11 } },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.parsed.y} equipamentos`,
                    },
                },
            },
        },
    });
}

function atualizarGrafico(idEscola) {
    if (!equipmentChart) return;

    const t = calcularTotais(idEscola);

    equipmentChart.data.datasets[0].data = [
        t.notebook_positivo,
        t.notebook_lenovo,
        t.desktop,
        t.tablet,
        t.celular,
    ];
    equipmentChart.update();
}

// ========== LABEL DO MODO DE VISUALIZAÇÃO ==========

function atualizarPillViewLabel(idEscola) {
    if (idEscola === "all") {
        viewModeLabel.textContent = "Visão geral – Todas as escolas";
    } else {
        const escola = escolas.find((e) => String(e.id) === String(idEscola));
        viewModeLabel.textContent = escola
            ? `Visão detalhada – ${escola.escola_nome}`
            : "Visão detalhada";
    }
}

// ========== EVENTOS ==========

schoolSelect.addEventListener("change", () => {
    const idEscola = schoolSelect.value;

    atualizarCardsResumo(idEscola);
    atualizarGrafico(idEscola);
    atualizarPillViewLabel(idEscola);
});

// ========== INICIALIZAÇÃO ==========

async function inicializarRelatorios() {
    if (!document.getElementById("equipmentChart")) return;

    await carregarEscolasDoBanco();
}

document.addEventListener("DOMContentLoaded", inicializarRelatorios);
