// relatorio.js (COMPLETO) — corrigido para não redeclarar "supabase"

const SUPABASE_URL = "https://thcxlfpxjokvegkzcjuh.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY3hsZnB4am9rdmVna3pjanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjc0OTQsImV4cCI6MjA3OTcwMzQ5NH0.rv_qmpcdx-OU01bz1NPw3pGRTntAh389XwSZ3G59xRM";

// ✅ NÃO use "const supabase = ..." (isso costuma conflitar com o CDN / outros scripts)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const urlParams = new URLSearchParams(window.location.search);
const EDIT_ID = urlParams.get("id") ? Number(urlParams.get("id")) : null;

const ESCOLAS = [
    "Unidade Regional De Ensino - Suzano",
    "ALFREDO ROBERTO",
    "ALICE ROMANOS PROFª",
    "ANDERSON DA SILVA SOARES",
    "ANGELA SUELI P DIAS",
    "ANIS FADUL DOUTOR",
    "ANTONIO BRASILIO MENEZES DA FONSECA PROF",
    "ANTONIO GARCIA VEREADOR",
    "ANTONIO JOSE CAMPOS DE MENEZES PROF",
    "ANTONIO RODRIGUES DE ALMEIDA",
    "ANTONIO VALDEMAR GALO VEREADOR",
    "BATISTA RENZI",
    "BENEDITA DE CAMPOS MARCOLONGO PROFª",
    "BRASILIO MACHADO NETO COMENDADOR",
    "CARLINDO REIS",
    "CARLOS MOLTENI PROF",
    "CHOJIRO SEGAWA",
    "DAVID JORGE CURI PROF",
    "EDIR DO COUTO ROSA",
    "ELIANE APARECIDA D DA SILVA",
    "EUCLIDES IGESCA",
    "GERALDO JUSTINIANO DE REZENDE SILVA PROF",
    "GILBERTO DE CARVALHO PROF",
    "GIOVANNI BATTISTA RAFFO PROF DOUTOR",
    "HELENA ZERRENNER",
    "IIJIMA",
    "IGNES CORREA ALLEN",
    "JACQUES YVES COUSTEAU COMANDANTE",
    "JANDYRA COUTINHO PROFª",
    "JARDIM SAO PAULO II",
    "JOSE BENEDITO LEITE BARTHOLOMEI PROF",
    "JOSE CAMILO DE ANDRADE",
    "JOSE PAPAIZ PROF",
    "JOVIANO SATLER DE LIMA PROF",
    "JUSSARA FEITOSA DOMSCHKE PROFª",
    "Justino Marcondes Rangel",
    "Landia dos Santos Batista",
    "LEDA FERNANDES LOPES PROFª",
    "LUCY FRANCO KOWALSKI PROFª",
    "LUIZ BIANCONI",
    "LUIZA HIDAKA PROFª",
    "MANUEL DOS SANTOS PAIVA",
    "MARIA ELISA DE AZEVEDO CINTRA PROFª",
    "Mario Manoel Dantas de Aquino",
    "MARTHA CALIXTO CAZAGRANDE",
    "MASAITI SEKINE PROF",
    "MORATO DE OLIVEIRA DOUTOR",
    "OLAVO LEONEL FERREIRA PROF",
    "OLZANETTI GOMES PROFESSOR",
    "OSWALDO DE OLIVEIRA LIMA",
    "PARQUE DOURADO II",
    "PAULO AMERICO PAGANUCCI",
    "PAULO KOBAYASHI PROF",
    "RAUL BRASIL PROF EE",
    "RAUL BRASIL PROF",
    "ROBERTO BIANCHI",
    "SEBASTIAO PEREIRA VIDAL",
    "TOCHICHICO YOCHICAVA PROF",
    "TOKUZO TERAZAKI",
    "YOLANDA BASSI PROFª",
    "ZELIA GATTAI AMADO",
    "ZEIKICHI FUKUOKA",
];

let registrosPainel = [];

function escapeHTML(str = "") {
    return String(str).replace(/[&<>"']/g, (m) => {
        switch (m) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return m;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const successAlert = document.getElementById("successAlert");
    const formCadastro = document.getElementById("formCadastro");
    const radiosResolvido = document.querySelectorAll('input[name="resolvido"]');
    const campoMotivo = document.getElementById("campoMotivo");
    const inputMotivo = document.getElementById("motivo_nao_resolvido");
    const tabelaContainer = document.getElementById("tabela-container");
    const filtroEscola = document.getElementById("filtro-escola");
    const filtroStatus = document.getElementById("filtro-status");
    const filtroDataInicio = document.getElementById("filtro-data-inicio");
    const filtroDataFim = document.getElementById("filtro-data-fim");
    const tabelaUltimosBody = document.querySelector("#tabela-ultimos tbody");
    const infoQtdPorEscola = document.getElementById("info-qtd-por-escola");

    function mostrarSucesso(msg) {
        if (!successAlert) return;
        successAlert.textContent = msg;
        successAlert.style.display = "flex";
        successAlert.style.opacity = "1";

        setTimeout(() => {
            successAlert.style.opacity = "0";
            setTimeout(() => {
                successAlert.style.display = "none";
            }, 400);
        }, 3000);
    }

    function atualizarVisibilidadeMotivo() {
        if (!campoMotivo || !radiosResolvido.length) return;
        const selecionado = document.querySelector('input[name="resolvido"]:checked');
        if (!selecionado) return;

        if (selecionado.value === "nao") {
            campoMotivo.style.display = "block";
        } else {
            campoMotivo.style.display = "none";
            if (inputMotivo) inputMotivo.value = "";
        }
    }

    if (radiosResolvido.length && campoMotivo) {
        radiosResolvido.forEach((radio) => {
            radio.addEventListener("change", atualizarVisibilidadeMotivo);
        });
        atualizarVisibilidadeMotivo();
    }

    async function carregarRegistroParaEdicao(id) {
        if (!formCadastro) return;

        try {
            const { data, error } = await sb
                .from("cadastros_equipamentos")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Erro ao carregar registro para edição:", error);
                alert("Erro ao carregar registro para edição.");
                return;
            }

            if (!data) return;

            const campoEscola = document.getElementById("escola");
            const campoTipo = document.getElementById("tipo_equipamento");
            const campoData = document.getElementById("data_ocorrencia");
            const campoDesc = document.getElementById("descricao_problema");
            const campoNumeroSerie = document.getElementById("numero_serie");

            if (campoEscola) campoEscola.value = data.escola_nome || "";
            if (campoTipo) campoTipo.value = data.tipo_equipamento || "";

            if (campoData && data.data_ocorrencia) {
                const dt = new Date(data.data_ocorrencia);
                campoData.value = dt.toISOString().slice(0, 10);
            }

            if (campoDesc) campoDesc.value = data.descricao_problema || "";
            if (campoNumeroSerie) campoNumeroSerie.value = data.numero_serie || "";

            const valorResolvido = data.resolvido_boolean ? "sim" : "nao";
            const radio = document.querySelector(
                `input[name="resolvido"][value="${valorResolvido}"]`
            );
            if (radio) radio.checked = true;

            if (inputMotivo) {
                inputMotivo.value = data.motivo_nao_resolvido || "";
            }

            atualizarVisibilidadeMotivo();

            const botao = formCadastro.querySelector("button[type='submit']");
            if (botao) botao.textContent = "Salvar alterações";
        } catch (err) {
            console.error("Erro inesperado ao preencher edição:", err);
            alert("Erro inesperado ao preencher edição.");
        }
    }

    async function handleSubmitCadastro(event) {
        event.preventDefault();

        const escola = document.getElementById("escola")?.value.trim();
        const tipo = document.getElementById("tipo_equipamento")?.value.trim();
        const data = document.getElementById("data_ocorrencia")?.value;
        const descricao = document.getElementById("descricao_problema")?.value.trim();
        const numeroSerie = document.getElementById("numero_serie")?.value.trim();

        const motivo = inputMotivo ? inputMotivo.value.trim() : "";

        const resolvidoSelecionado = document.querySelector('input[name="resolvido"]:checked');
        const resolvidoValue = resolvidoSelecionado ? resolvidoSelecionado.value : "sim";
        const resolvido_boolean = resolvidoValue === "sim";

        if (!escola || !tipo) {
            alert("Selecione a escola e o tipo de equipamento.");
            return;
        }

        const payload = {
            escola_nome: escola,
            tipo_equipamento: tipo,
            data_ocorrencia: data || null,
            descricao_problema: descricao || null,
            resolvido_boolean,
            motivo_nao_resolvido: resolvido_boolean ? null : motivo !== "" ? motivo : null,
            numero_serie: numeroSerie || null,
        };

        try {
            if (EDIT_ID) {
                const { error } = await sb
                    .from("cadastros_equipamentos")
                    .update(payload)
                    .eq("id", EDIT_ID);

                if (error) {
                    console.error("Erro ao atualizar registro:", error);
                    alert("Erro ao atualizar registro: " + error.message);
                    return;
                }

                mostrarSucesso("Registro atualizado com sucesso ✅");

                setTimeout(() => {
                    window.location.href = "lista.html";
                }, 800);
            } else {
                const { error } = await sb
                    .from("cadastros_equipamentos")
                    .insert(payload);

                if (error) {
                    console.error("Erro ao salvar no Supabase:", error);
                    alert("Erro ao salvar no Supabase: " + error.message);
                    return;
                }

                formCadastro.reset();
                atualizarVisibilidadeMotivo();
                mostrarSucesso("Registro salvo com sucesso ✅");
            }
        } catch (err) {
            console.error("Erro inesperado ao salvar:", err);
            alert("Erro inesperado ao salvar registro.");
        }
    }

    if (formCadastro) {
        formCadastro.addEventListener("submit", handleSubmitCadastro);

        if (EDIT_ID) {
            carregarRegistroParaEdicao(EDIT_ID);
        }
    }

    async function carregarTabela() {
        if (!tabelaContainer) return;

        tabelaContainer.innerHTML = '<div class="empty-state">Carregando registros...</div>';

        const { data, error } = await sb
            .from("cadastros_equipamentos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar registros:", error);
            tabelaContainer.innerHTML =
                '<div class="empty-state">Erro ao carregar registros: ' +
                escapeHTML(error.message) +
                "</div>";
            return;
        }

        if (!data || data.length === 0) {
            tabelaContainer.innerHTML = '<div class="empty-state">Nenhum registro encontrado.</div>';
            return;
        }

        const linhas = data
            .map((item) => {
                const dataBr = item.data_ocorrencia
                    ? new Date(item.data_ocorrencia).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                    : "-";

                const statusClasse = item.resolvido_boolean ? "table-status-sim" : "table-status-nao";
                const statusTexto = item.resolvido_boolean ? "Resolvido" : "Não resolvido";

                return `
          <tr data-id="${item.id}">
            <td data-label="Data">${dataBr}</td>
            <td data-label="Escola">${escapeHTML(item.escola_nome)}</td>
            <td data-label="Patrimônio">${escapeHTML(item.numero_serie || "")}</td>
            <td data-label="Equip.">${escapeHTML(item.tipo_equipamento)}</td>
            <td data-label="Descrição do problema">${escapeHTML(item.descricao_problema || "")}</td>
            <td data-label="Status" class="${statusClasse}">${statusTexto}</td>
            <td data-label="Motivo">${escapeHTML(item.motivo_nao_resolvido || "")}</td>
            <td data-label="Ações" class="table-actions">
              <button class="btn-table btn-table--edit" data-id="${item.id}">Editar</button>
              <button class="btn-table btn-table--danger" data-id="${item.id}">Excluir</button>
            </td>
          </tr>
        `;
            })
            .join("");

        tabelaContainer.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Escola</th>
            <th>Patrimônio</th>
            <th>Equip.</th>
            <th>Descrição do problema</th>
            <th>Status</th>
            <th>Motivo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    `;

        inicializarAcoesTabela();
    }

    function inicializarAcoesTabela() {
        const botoesEditar = document.querySelectorAll(".btn-table--edit");
        const botoesExcluir = document.querySelectorAll(".btn-table--danger");

        botoesEditar.forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(btn.getAttribute("data-id"));
                if (!id) return;
                window.location.href = `cadastro.html?id=${id}`;
            });
        });

        botoesExcluir.forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.getAttribute("data-id"));
                if (!id) return;

                const ok = confirm("Tem certeza que deseja excluir este registro?");
                if (!ok) return;

                const { error } = await sb
                    .from("cadastros_equipamentos")
                    .delete()
                    .eq("id", id);

                if (error) {
                    console.error("Erro ao excluir registro:", error);
                    alert("Erro ao excluir registro: " + error.message);
                    return;
                }

                carregarTabela();
            });
        });
    }

    if (tabelaContainer) {
        carregarTabela();
    }

    const navLinks = document.querySelectorAll(".nav-links a");
    if (navLinks.length) {
        navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            if (href && window.location.pathname.endsWith(href)) {
                link.classList.add("active");
            }
        });
    }

    /* ========= PAINEL DO DIRIGENTE (relatorio.html) ========= */

    if (document.body && document.body.dataset.page === "relatorio") {
        carregarResumoPainel();
    }

    let chartTipoEquipamento = null;
    let chartPorEscola = null;

    function popularFiltroEscola() {
        if (!filtroEscola) return;
        filtroEscola.innerHTML = "";

        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "Todas as escolas";
        filtroEscola.appendChild(optAll);

        ESCOLAS.forEach((nome) => {
            const opt = document.createElement("option");
            opt.value = nome;
            opt.textContent = nome;
            filtroEscola.appendChild(opt);
        });
    }

    async function carregarResumoPainel() {
        const msg = document.getElementById("mensagem-painel");
        if (msg) msg.textContent = "Carregando dados...";

        const { data, error } = await sb
            .from("cadastros_equipamentos")
            .select("*");

        if (error) {
            console.error("Erro ao carregar dados do painel:", error);
            if (msg) msg.textContent = "Erro ao carregar dados do painel.";
            atualizarKPIsPainel([]);
            destruirGraficosPainel();
            if (tabelaUltimosBody) {
                tabelaUltimosBody.innerHTML =
                    '<tr><td colspan="5" class="table-empty">Erro ao carregar registros.</td></tr>';
            }
            return;
        }

        registrosPainel = data || [];
        popularFiltroEscola();
        atualizarTudoComFiltros();
    }

    function aplicarFiltrosBasicos() {
        if (!registrosPainel.length) return [];

        let filtrados = [...registrosPainel];

        // escola
        const escolaSelecionada = filtroEscola ? filtroEscola.value : "all";
        if (escolaSelecionada && escolaSelecionada !== "all") {
            filtrados = filtrados.filter(
                (r) => (r.escola_nome || "").trim() === escolaSelecionada.trim()
            );
        }

        // status
        const status = filtroStatus ? filtroStatus.value : "todos";
        if (status === "resolvido") {
            filtrados = filtrados.filter((r) => r.resolvido_boolean === true);
        } else if (status === "nao_resolvido") {
            filtrados = filtrados.filter((r) => r.resolvido_boolean === false);
        }

        // datas
        const inicio = filtroDataInicio && filtroDataInicio.value;
        const fim = filtroDataFim && filtroDataFim.value;

        if (inicio) {
            const di = new Date(inicio);
            filtrados = filtrados.filter((r) => {
                if (!r.data_ocorrencia) return false;
                return new Date(r.data_ocorrencia) >= di;
            });
        }

        if (fim) {
            const df = new Date(fim);
            filtrados = filtrados.filter((r) => {
                if (!r.data_ocorrencia) return false;
                return new Date(r.data_ocorrencia) <= df;
            });
        }

        return filtrados;
    }

    function atualizarMensagemPainel(registrosFiltrados) {
        const msg = document.getElementById("mensagem-painel");
        if (!msg) return;

        const totalGeral = registrosPainel.length;
        const escolaSelecionada = filtroEscola ? filtroEscola.value : "all";

        if (escolaSelecionada && escolaSelecionada !== "all") {
            msg.textContent = `Painel filtrado para a escola "${escolaSelecionada}", com ${registrosFiltrados.length} registros de manutenção (de um total de ${totalGeral}).`;
        } else {
            msg.textContent = `Painel atualizado com base em ${totalGeral} registros cadastrados.`;
        }

        if (infoQtdPorEscola) {
            if (escolaSelecionada && escolaSelecionada !== "all") {
                const qtd = registrosPainel.filter(
                    (r) => (r.escola_nome || "").trim() === escolaSelecionada.trim()
                ).length;
                infoQtdPorEscola.textContent = "Chamados de manutenção desta escola: " + qtd;
            } else {
                infoQtdPorEscola.textContent = "Total de chamados de manutenção na rede: " + totalGeral;
            }
        }
    }

    function atualizarTudoComFiltros() {
        if (!registrosPainel.length) {
            atualizarKPIsPainel([]);
            destruirGraficosPainel();
            renderizarUltimosRegistros([]);
            atualizarMensagemPainel([]);
            return;
        }

        const registrosFiltrados = aplicarFiltrosBasicos();

        atualizarKPIsPainel(registrosFiltrados);
        montarGraficosPainel(registrosFiltrados);
        renderizarUltimosRegistros(registrosFiltrados);
        atualizarMensagemPainel(registrosFiltrados);
    }

    function atualizarKPIsPainel(registros) {
        const total = registros.length;
        const resolvidos = registros.filter((r) => r.resolvido_boolean === true).length;
        const naoResolvidos = total - resolvidos;

        const escolasSet = new Set(
            registros
                .map((r) => r.escola_nome)
                .filter((nome) => typeof nome === "string" && nome.trim() !== "")
        );
        const escolas = escolasSet.size;

        const elTotal = document.getElementById("kpi-total");
        const elRes = document.getElementById("kpi-resolvido");
        const elNao = document.getElementById("kpi-nao-resolvido");
        const elEsc = document.getElementById("kpi-escolas");

        if (elTotal) elTotal.textContent = total;
        if (elRes) elRes.textContent = resolvidos;
        if (elNao) elNao.textContent = naoResolvidos;
        if (elEsc) elEsc.textContent = escolas;
    }

    function montarGraficosPainel(registros) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js não carregado.");
            return;
        }

        const canvasTipo = document.getElementById("chartTipoEquipamento");
        const canvasEscola = document.getElementById("chartPorEscola");
        if (!canvasTipo || !canvasEscola) return;

        // --- Cadastros por tipo de equipamento ---
        const contagemPorTipo = registros.reduce((acc, r) => {
            const tipo = (r.tipo_equipamento || "Não informado").trim();
            acc[tipo] = (acc[tipo] || 0) + 1;
            return acc;
        }, {});

        const labelsTipo = Object.keys(contagemPorTipo);
        const valoresTipo = Object.values(contagemPorTipo);

        const ctxTipo = canvasTipo.getContext("2d");
        if (chartTipoEquipamento) chartTipoEquipamento.destroy();

        chartTipoEquipamento = new Chart(ctxTipo, {
            type: "bar",
            data: {
                labels: labelsTipo,
                datasets: [
                    {
                        label: "Quantidade de cadastros",
                        data: valoresTipo,
                        borderWidth: 1,
                        borderRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, display: false },
                        grid: { color: "rgba(148,163,184,0.18)" },
                    },
                    x: {
                        ticks: { display: false },
                        grid: { display: false },
                    },
                },
            },
        });

        // --- Cadastros por escola ---
        const contagemPorEscola = registros.reduce((acc, r) => {
            const escola = (r.escola_nome || "Não informada").trim();
            acc[escola] = (acc[escola] || 0) + 1;
            return acc;
        }, {});

        const escolasOrdenadas = Object.entries(contagemPorEscola).sort((a, b) => b[1] - a[1]);
        const labelsEscola = escolasOrdenadas.map(([nome]) => nome);
        const valoresEscola = escolasOrdenadas.map(([, qtd]) => qtd);

        const ctxEscola = canvasEscola.getContext("2d");
        if (chartPorEscola) chartPorEscola.destroy();

        chartPorEscola = new Chart(ctxEscola, {
            type: "bar",
            data: {
                labels: labelsEscola,
                datasets: [
                    {
                        label: "Cadastros",
                        data: valoresEscola,
                        borderWidth: 1,
                        borderRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, display: false },
                        grid: { color: "rgba(148,163,184,0.18)" },
                    },
                    y: {
                        ticks: { font: { size: 11 }, color: "#cbd5f5" },
                        grid: { display: false },
                    },
                },
            },
        });
    }

    function destruirGraficosPainel() {
        if (chartTipoEquipamento) {
            chartTipoEquipamento.destroy();
            chartTipoEquipamento = null;
        }
        if (chartPorEscola) {
            chartPorEscola.destroy();
            chartPorEscola = null;
        }
    }

    function renderizarUltimosRegistros(registros) {
        const tabelaUltimosBodyLocal = document.querySelector("#tabela-ultimos tbody");
        if (!tabelaUltimosBodyLocal) return;

        if (!registros || !registros.length) {
            tabelaUltimosBodyLocal.innerHTML =
                '<tr><td colspan="5" class="table-empty">Nenhum registro encontrado com os filtros atuais.</td></tr>';
            return;
        }

        const ordenados = [...registros].sort((a, b) => {
            const da = a.data_ocorrencia ? new Date(a.data_ocorrencia) : a.created_at ? new Date(a.created_at) : 0;
            const db = b.data_ocorrencia ? new Date(b.data_ocorrencia) : b.created_at ? new Date(b.created_at) : 0;
            return db - da;
        });

        const linhas = ordenados
            .map((reg) => {
                const dataBr = reg.data_ocorrencia
                    ? new Date(reg.data_ocorrencia).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                    : "-";

                const tema = reg.tipo_equipamento ? escapeHTML(reg.tipo_equipamento) : "Chamado de manutenção";
                const escola = reg.escola_nome ? escapeHTML(reg.escola_nome) : "-";
                const desc = reg.descricao_problema ? escapeHTML(reg.descricao_problema) : "-";

                const statusResolvido = reg.resolvido_boolean === true;
                const statusTexto = statusResolvido ? "Resolvido" : "manutenção pela escola";
                const statusClasse = statusResolvido
                    ? "status-badge status-badge--ok"
                    : "status-badge status-badge--warn";

                return `
          <tr>
            <td>${tema}</td>
            <td>${escola}</td>
            <td class="col-descricao">${desc}</td>
            <td><span class="${statusClasse}">${statusTexto}</span></td>
            <td>${dataBr}</td>
          </tr>
        `;
            })
            .join("");

        tabelaUltimosBodyLocal.innerHTML = linhas;
    }

    if (filtroEscola) filtroEscola.addEventListener("change", atualizarTudoComFiltros);
    if (filtroStatus) filtroStatus.addEventListener("change", atualizarTudoComFiltros);
    if (filtroDataInicio) filtroDataInicio.addEventListener("change", atualizarTudoComFiltros);
    if (filtroDataFim) filtroDataFim.addEventListener("change", atualizarTudoComFiltros);
});
