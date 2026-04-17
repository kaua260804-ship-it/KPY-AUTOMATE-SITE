// ========== UI DA CURVA ABC ==========

let curvaDadosAtuais = null;
let curvaLojasDisponiveis = [];
let curvaLojasSelecionadas = [];
let curvaFiltroAtivo = false;

function renderizarCurvaABC() {
    const stats = processador.getEstatisticas() || {};
    return `
        <div class="cards-grid">
            <div class="card">
                <div class="card-title">📦 BASE DE PREÇOS</div>
                <div class="card-value">${(stats.totalProdutos || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">📊 STATUS</div>
                <div class="card-value" id="statusUploadCurva">Aguardando arquivo</div>
            </div>
        </div>
        
        <div class="file-area" id="uploadAreaCurva">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Clique ou arraste o arquivo da Curva ABC</p>
            <div class="file-info">Formatos: .xlsx, .xls | Cabecalho na linha 4</div>
            <input type="file" id="fileInputCurva" accept=".xlsx,.xls" style="display: none">
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" id="btnProcessarCurva" disabled>
                <i class="fas fa-cogs"></i> Processar
            </button>
            <button class="btn btn-secondary" id="btnFiltrarCurva" style="display: none;">
                <i class="fas fa-filter"></i> Filtrar Lojas
            </button>
            <button class="btn btn-success" id="btnExportarCurva" style="display: none;">
                <i class="fas fa-download"></i> Exportar XLSX
            </button>
            <button class="btn btn-danger" id="btnLimparCurva" style="display: none;">
                <i class="fas fa-trash"></i> Limpar
            </button>
        </div>
        
        <div id="resultadoAreaCurva" style="display: none;">
            <div id="cardsResultadoCurva" class="cards-grid"></div>
            <div id="resumoLojasCurva" class="preview-area" style="margin-bottom: 15px;"></div>
            <div class="preview-area">
                <div class="preview-header">
                    <h4><i class="fas fa-table"></i> Dados Processados</h4>
                    <span id="filterBadgeCurva" class="filter-badge" style="display: none;"></span>
                </div>
                <div class="preview-content" id="previewContentCurva">
                    <pre></pre>
                </div>
            </div>
        </div>
        
        <div class="preview-area">
            <div class="preview-header">
                <h4><i class="fas fa-info-circle"></i> Instrucoes</h4>
            </div>
            <div class="preview-content">
                <p><strong>📋 Curva ABC por Loja</strong></p>
                <p>Faça upload do arquivo "Curva ABC por Loja" gerado pelo sistema SGE.</p>
                <p><strong>Formato esperado:</strong> Cabecalho na linha 4 com as colunas: Codigo, Produto, Qtd, Total R$</p>
                <p>Apos o processamento, voce podera filtrar por lojas (com macros EMPORIO, MERCEARIA, OUTROS) e exportar os dados.</p>
            </div>
        </div>
    `;
}

function inicializarCurvaABC() {
    console.log("inicializarCurvaABC chamado");
    
    const uploadArea = document.getElementById("uploadAreaCurva");
    const fileInput = document.getElementById("fileInputCurva");
    const btnProcessar = document.getElementById("btnProcessarCurva");
    const statusSpan = document.getElementById("statusUploadCurva");
    
    if (!uploadArea) return;
    
    let arquivoSelecionado = null;
    
    uploadArea.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            arquivoSelecionado = e.target.files[0];
            statusSpan.innerHTML = "📂 " + arquivoSelecionado.name;
            statusSpan.style.color = "#4caf50";
            btnProcessar.disabled = false;
            showToast("Arquivo \"" + arquivoSelecionado.name + "\" selecionado!", "success");
        }
    };
    
    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.classList.add("drag-over");
    };
    uploadArea.ondragleave = () => uploadArea.classList.remove("drag-over");
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.classList.remove("drag-over");
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            arquivoSelecionado = files[0];
            statusSpan.innerHTML = "📂 " + arquivoSelecionado.name;
            statusSpan.style.color = "#4caf50";
            btnProcessar.disabled = false;
            showToast("Arquivo \"" + arquivoSelecionado.name + "\" recebido!", "success");
        }
    };
    
    btnProcessar.onclick = async () => {
        if (!arquivoSelecionado) {
            showToast("Selecione um arquivo primeiro!", "error");
            return;
        }
        
        showToast("📊 Processando arquivo...", "info");
        btnProcessar.disabled = true;
        btnProcessar.innerHTML = "<i class=\"fas fa-spinner fa-pulse\"></i> Processando...";
        
        try {
            const resultado = await curvaProcessor.processarArquivo(arquivoSelecionado, processador.dadosPrecos);
            
            if (!resultado || !resultado.success) {
                throw new Error(resultado?.error || "Falha no processamento");
            }
            
            const dados = resultado.dados || [];
            const lojas = resultado.lojas || [];
            const estatisticas = resultado.estatisticas || {};
            
            if (dados.length === 0) {
                showToast("Nenhum dado encontrado no arquivo.", "warning");
                return;
            }
            
            curvaDadosAtuais = dados;
            curvaLojasDisponiveis = lojas;
            
            curvaProcessor.dadosProcessados = dados;
            curvaProcessor.lojas = lojas;
            curvaProcessor.estatisticas = estatisticas;
            
            mostrarResultadoCurva({ dados, lojas, estatisticas, success: true });
            showToast("✅ Processado! " + dados.length + " registros, " + lojas.length + " lojas", "success");
            
            const btnFiltrar = document.getElementById("btnFiltrarCurva");
            const btnExportar = document.getElementById("btnExportarCurva");
            const btnLimpar = document.getElementById("btnLimparCurva");
            
            if (btnFiltrar) {
                btnFiltrar.style.display = "block";
                btnFiltrar.onclick = () => abrirFiltroLojasCurva();
            }
            if (btnExportar) {
                btnExportar.style.display = "block";
                btnExportar.onclick = () => exportarCurvaXLSX();
            }
            if (btnLimpar) {
                btnLimpar.style.display = "block";
                btnLimpar.onclick = () => limparCurva();
            }
            
        } catch (error) {
            console.error("Erro:", error);
            showToast("❌ Erro ao processar: " + error.message, "error");
        } finally {
            btnProcessar.disabled = false;
            btnProcessar.innerHTML = "<i class=\"fas fa-cogs\"></i> Processar";
        }
    };
}

function formatarNumeroBR(valor, decimais = 2) {
    if (valor === undefined || valor === null || isNaN(valor)) return "0,00";
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

function formatarQuantidadeBR(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return "0";
    if (Number.isInteger(valor)) return valor.toLocaleString("pt-BR");
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function mostrarResultadoCurva(resultado) {
    const resultadoArea = document.getElementById("resultadoAreaCurva");
    const cardsDiv = document.getElementById("cardsResultadoCurva");
    const resumoLojasDiv = document.getElementById("resumoLojasCurva");
    const previewContent = document.getElementById("previewContentCurva");
    
    if (resultadoArea) resultadoArea.style.display = "block";
    
    const stats = resultado.estatisticas || {};
    
    if (cardsDiv) {
        cardsDiv.innerHTML = `
            <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(stats.totalRegistros || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🆔 PRODUTOS UNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(stats.quantidadeTotal || 0)}</div></div>
            <div class="card"><div class="card-title">💰 FATURAMENTO TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.faturamentoTotal || 0)}</div></div>
            <div class="card"><div class="card-title">💰 COM PRECO BASE</div><div class="card-value">${(stats.produtosComPreco || 0).toLocaleString()}</div></div>
        `;
    }
    
    // Resumo por loja usando as macros do macros.js
    if (resumoLojasDiv && stats.porLoja) {
        let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Resumo por Loja</h4></div><div class="preview-content"><pre>';
        html += "LOJA                                TIPO        QUANTIDADE        FATURAMENTO\n";
        html += "----------------------------------  ----------  --------------  ------------------\n";
        
        // Separar lojas por tipo usando getMacroLoja do macros.js
        const lojasPorTipo = { emporio: [], mercearia: [], outros: [] };
        for (const loja of Object.keys(stats.porLoja)) {
            const tipo = getMacroLoja(loja);
            lojasPorTipo[tipo].push({ nome: loja, dados: stats.porLoja[loja] });
        }
        
        // Ordenar cada grupo
        for (const tipo of ["emporio", "mercearia", "outros"]) {
            lojasPorTipo[tipo].sort((a, b) => b.dados.faturamento - a.dados.faturamento);
        }
        
        const formatarLinha = (loja, dados, tipo) => {
            const tipoLabel = tipo === "emporio" ? "EMPORIO  " : (tipo === "mercearia" ? "MERCEARIA " : "OUTROS    ");
            return String(loja).slice(0, 34).padEnd(34) + "  " + tipoLabel + "  " + formatarQuantidadeBR(dados.quantidade).padStart(14) + "  " + ("R$ " + formatarNumeroBR(dados.faturamento)).padStart(18);
        };
        
        if (lojasPorTipo.emporio.length) {
            html += "\n🏪 EMPORIOS:\n";
            lojasPorTipo.emporio.forEach(i => html += formatarLinha(i.nome, i.dados, "emporio") + "\n");
        }
        if (lojasPorTipo.mercearia.length) {
            html += "\n🥩 MERCEARIAS:\n";
            lojasPorTipo.mercearia.forEach(i => html += formatarLinha(i.nome, i.dados, "mercearia") + "\n");
        }
        if (lojasPorTipo.outros.length) {
            html += "\n🔮 OUTROS:\n";
            lojasPorTipo.outros.forEach(i => html += formatarLinha(i.nome, i.dados, "outros") + "\n");
        }
        
        html += "</pre></div>";
        resumoLojasDiv.innerHTML = html;
    }
    
    if (previewContent) {
        previewContent.innerHTML = "<pre>" + formatarPreviewCurva((resultado.dados || []).slice(0, 20)) + "</pre>";
    }
}

function formatarPreviewCurva(dados) {
    if (!dados || !dados.length) return "Nenhum dado";
    let out = "CODIGO    PRODUTO                                    QTD             TOTAL       LOJA\n";
    out += "------    ----------------------------------------  --------------  ----------  ------------------\n";
    dados.forEach(p => {
        const codigo = String(p.codigoInt || p.codigo).slice(0, 8).padEnd(8);
        const produto = (p.produto || "").slice(0, 40).padEnd(40);
        const qtd = formatarQuantidadeBR(p.qtd).padStart(14);
        const total = ("R$ " + formatarNumeroBR(p.total)).padStart(10);
        const loja = (p.loja || "").slice(0, 18).padEnd(18);
        out += codigo + "  " + produto + "  " + qtd + "  " + total + "  " + loja + "\n";
    });
    return out;
}

function atualizarPreviewCurvaFiltrado() {
    if (!curvaProcessor || !curvaProcessor.dadosProcessados) return;
    
    const resumo = curvaProcessor.getResumoFiltrado(curvaLojasSelecionadas);
    let dadosFiltrados = curvaDadosAtuais;
    
    if (curvaLojasSelecionadas.length) {
        dadosFiltrados = dadosFiltrados.filter(p => curvaLojasSelecionadas.includes(p.loja));
    }
    
    const previewContent = document.getElementById("previewContentCurva");
    const filterBadge = document.getElementById("filterBadgeCurva");
    const cardsDiv = document.getElementById("cardsResultadoCurva");
    const resumoLojasDiv = document.getElementById("resumoLojasCurva");
    
    if (curvaLojasSelecionadas.length) {
        if (filterBadge) {
            filterBadge.style.display = "inline-flex";
            filterBadge.innerHTML = "🔽 " + curvaLojasSelecionadas.length + " loja(s) selecionada(s)";
        }
        
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(resumo.totalRegistros || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS UNICOS</div><div class="card-value">${(resumo.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(resumo.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(resumo.quantidadeTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 FATURAMENTO TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(resumo.faturamentoTotal || 0)}</div></div>
            `;
        }
        
        if (resumoLojasDiv && resumo.porLoja) {
            let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Resumo por Loja (Filtrado)</h4></div><div class="preview-content"><pre>';
            html += "LOJA                                TIPO        QUANTIDADE        FATURAMENTO\n";
            html += "----------------------------------  ----------  --------------  ------------------\n";
            
            const lojasPorTipo = { emporio: [], mercearia: [], outros: [] };
            for (const loja of Object.keys(resumo.porLoja)) {
                const tipo = getMacroLoja(loja);
                lojasPorTipo[tipo].push({ nome: loja, dados: resumo.porLoja[loja] });
            }
            
            for (const tipo of ["emporio", "mercearia", "outros"]) {
                lojasPorTipo[tipo].sort((a, b) => b.dados.faturamento - a.dados.faturamento);
            }
            
            const formatarLinha = (loja, dados, tipo) => {
                const tipoLabel = tipo === "emporio" ? "EMPORIO  " : (tipo === "mercearia" ? "MERCEARIA " : "OUTROS    ");
                return String(loja).slice(0, 34).padEnd(34) + "  " + tipoLabel + "  " + formatarQuantidadeBR(dados.quantidade).padStart(14) + "  " + ("R$ " + formatarNumeroBR(dados.faturamento)).padStart(18);
            };
            
            if (lojasPorTipo.emporio.length) {
                html += "\n🏪 EMPORIOS:\n";
                lojasPorTipo.emporio.forEach(i => html += formatarLinha(i.nome, i.dados, "emporio") + "\n");
            }
            if (lojasPorTipo.mercearia.length) {
                html += "\n🥩 MERCEARIAS:\n";
                lojasPorTipo.mercearia.forEach(i => html += formatarLinha(i.nome, i.dados, "mercearia") + "\n");
            }
            if (lojasPorTipo.outros.length) {
                html += "\n🔮 OUTROS:\n";
                lojasPorTipo.outros.forEach(i => html += formatarLinha(i.nome, i.dados, "outros") + "\n");
            }
            
            html += "</pre></div>";
            resumoLojasDiv.innerHTML = html;
        }
    } else {
        if (filterBadge) filterBadge.style.display = "none";
        const stats = curvaProcessor.estatisticas || {};
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(stats.totalRegistros || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS UNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(stats.quantidadeTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 FATURAMENTO TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.faturamentoTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 COM PRECO BASE</div><div class="card-value">${(stats.produtosComPreco || 0).toLocaleString()}</div></div>
            `;
        }
        
        if (resumoLojasDiv && stats.porLoja) {
            let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Resumo por Loja</h4></div><div class="preview-content"><pre>';
            html += "LOJA                                TIPO        QUANTIDADE        FATURAMENTO\n";
            html += "----------------------------------  ----------  --------------  ------------------\n";
            
            const lojasPorTipo = { emporio: [], mercearia: [], outros: [] };
            for (const loja of Object.keys(stats.porLoja)) {
                const tipo = getMacroLoja(loja);
                lojasPorTipo[tipo].push({ nome: loja, dados: stats.porLoja[loja] });
            }
            
            for (const tipo of ["emporio", "mercearia", "outros"]) {
                lojasPorTipo[tipo].sort((a, b) => b.dados.faturamento - a.dados.faturamento);
            }
            
            const formatarLinha = (loja, dados, tipo) => {
                const tipoLabel = tipo === "emporio" ? "EMPORIO  " : (tipo === "mercearia" ? "MERCEARIA " : "OUTROS    ");
                return String(loja).slice(0, 34).padEnd(34) + "  " + tipoLabel + "  " + formatarQuantidadeBR(dados.quantidade).padStart(14) + "  " + ("R$ " + formatarNumeroBR(dados.faturamento)).padStart(18);
            };
            
            if (lojasPorTipo.emporio.length) {
                html += "\n🏪 EMPORIOS:\n";
                lojasPorTipo.emporio.forEach(i => html += formatarLinha(i.nome, i.dados, "emporio") + "\n");
            }
            if (lojasPorTipo.mercearia.length) {
                html += "\n🥩 MERCEARIAS:\n";
                lojasPorTipo.mercearia.forEach(i => html += formatarLinha(i.nome, i.dados, "mercearia") + "\n");
            }
            if (lojasPorTipo.outros.length) {
                html += "\n🔮 OUTROS:\n";
                lojasPorTipo.outros.forEach(i => html += formatarLinha(i.nome, i.dados, "outros") + "\n");
            }
            
            html += "</pre></div>";
            resumoLojasDiv.innerHTML = html;
        }
    }
    
    if (previewContent) {
        previewContent.innerHTML = "<pre>" + formatarPreviewCurva((dadosFiltrados || []).slice(0, 20)) + "</pre>";
    }
}

function abrirFiltroLojasCurva() {
    if (!curvaLojasDisponiveis.length) {
        showToast("Nenhuma loja disponivel", "error");
        return;
    }
    
    // Separar lojas por tipo usando getMacroLoja do macros.js
    const lojasPorTipo = { emporio: [], mercearia: [], outros: [] };
    for (const loja of curvaLojasDisponiveis) {
        const tipo = getMacroLoja(loja);
        lojasPorTipo[tipo].push(loja);
    }
    for (const tipo of ["emporio", "mercearia", "outros"]) {
        lojasPorTipo[tipo].sort();
    }
    
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;";
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:550px; max-width:90%; max-height:80vh; display:flex; flex-direction:column;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-filter"></i> Filtrar por Lojas</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow-y:auto; padding:20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="macroEmporioBtn" style="flex:1; background:#51cf66; border:none; border-radius:8px; color:white; font-weight:bold; padding:10px; cursor:pointer;">🏪 EMPORIO</button>
                    <button id="macroMerceariaBtn" style="flex:1; background:#ffd43b; border:none; border-radius:8px; color:#333; font-weight:bold; padding:10px; cursor:pointer;">🥩 MERCEARIA</button>
                    <button id="macroOutrosBtn" style="flex:1; background:#4dabf7; border:none; border-radius:8px; color:white; font-weight:bold; padding:10px; cursor:pointer;">🔮 OUTROS</button>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="selectAllLojas" class="btn btn-secondary" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Selecionar Todos</button>
                    <button id="clearAllLojas" class="btn btn-secondary" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Limpar Todos</button>
                </div>
                <div id="lojasList" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #404040;">
                <button id="cancelLojasBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Cancelar</button>
                <button id="applyLojasBtn" style="flex:1; background:#8b0000; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const lojasDiv = document.getElementById("lojasList");
    const renderLojas = () => {
        lojasDiv.innerHTML = "";
        for (const tipo of ["emporio", "mercearia", "outros"]) {
            if (lojasPorTipo[tipo].length) {
                const titulo = tipo === "emporio" ? "🏪 EMPORIOS" : (tipo === "mercearia" ? "🥩 MERCEARIAS" : "🔮 OUTROS");
                const cor = tipo === "emporio" ? "#51cf66" : (tipo === "mercearia" ? "#ffd43b" : "#4dabf7");
                lojasDiv.innerHTML += "<div style=\"margin-top:10px; padding:5px 0; border-bottom:1px solid #404040;\"><span style=\"color:" + cor + "; font-weight:bold;\">" + titulo + "</span></div>";
                lojasPorTipo[tipo].forEach(loja => {
                    const checked = curvaLojasSelecionadas.includes(loja) ? "checked" : "";
                    lojasDiv.innerHTML += `
                        <label style="display:flex; align-items:center; padding:8px; cursor:pointer; border-radius:8px; margin-bottom:4px; background: rgba(255,255,255,0.03);">
                            <input type="checkbox" value="${loja.replace(/"/g, "&quot;")}" ${checked} style="margin-right:10px; width:18px; height:18px;">
                            <span style="font-size:13px; color:#ffffff;">${loja}</span>
                        </label>
                    `;
                });
            }
        }
    };
    renderLojas();
    
    const getCheckboxesByTipo = (tipo) => Array.from(document.querySelectorAll("#lojasList input[type=\"checkbox\"]")).filter(cb => lojasPorTipo[tipo].includes(cb.value));
    
    document.getElementById("macroEmporioBtn").onclick = () => {
        const cbs = getCheckboxesByTipo("emporio");
        const allChecked = cbs.length && cbs.every(c => c.checked);
        cbs.forEach(c => c.checked = !allChecked);
    };
    document.getElementById("macroMerceariaBtn").onclick = () => {
        const cbs = getCheckboxesByTipo("mercearia");
        const allChecked = cbs.length && cbs.every(c => c.checked);
        cbs.forEach(c => c.checked = !allChecked);
    };
    document.getElementById("macroOutrosBtn").onclick = () => {
        const cbs = getCheckboxesByTipo("outros");
        const allChecked = cbs.length && cbs.every(c => c.checked);
        cbs.forEach(c => c.checked = !allChecked);
    };
    document.getElementById("selectAllLojas").onclick = () => document.querySelectorAll("#lojasList input[type=\"checkbox\"]").forEach(cb => cb.checked = true);
    document.getElementById("clearAllLojas").onclick = () => document.querySelectorAll("#lojasList input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
    document.getElementById("applyLojasBtn").onclick = () => {
        curvaLojasSelecionadas = Array.from(document.querySelectorAll("#lojasList input[type=\"checkbox\"]:checked")).map(cb => cb.value);
        curvaFiltroAtivo = curvaLojasSelecionadas.length > 0;
        atualizarPreviewCurvaFiltrado();
        modal.remove();
        showToast(curvaLojasSelecionadas.length + " loja(s) selecionada(s)", "success");
    };
    document.getElementById("cancelLojasBtn").onclick = () => modal.remove();
    modal.querySelector(".modal-close").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function exportarCurvaXLSX() {
    if (!curvaDadosAtuais || !curvaDadosAtuais.length) {
        showToast("Nenhum dado para exportar", "error");
        return;
    }
    
    if (typeof XLSX === "undefined") {
        showToast("Biblioteca XLSX nao carregada.", "error");
        return;
    }
    
    try {
        let dados = curvaDadosAtuais;
        if (curvaFiltroAtivo && curvaLojasSelecionadas.length) {
            dados = dados.filter(p => curvaLojasSelecionadas.includes(p.loja));
        }
        
        const planilhaDados = dados.map(p => ({
            "CODIGO": p.codigoInt,
            "PRODUTO": p.produto,
            "QUANTIDADE": p.qtd,
            "TOTAL (R$)": p.total,
            "PRECO MEDIO": p.precoMedio || (p.qtd > 0 ? p.total / p.qtd : 0),
            "LOJA": p.loja,
            "PRECO BASE": p.precoBase || 0,
            "CATEGORIA": p.categoria || "",
            "GRUPO": p.grupo || ""
        }));
        
        const ws = XLSX.utils.json_to_sheet(planilhaDados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Curva_ABC");
        
        ws["!cols"] = [
            { wch: 10 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 25 }, { wch: 25 }
        ];
        
        const nomeArquivo = "Curva_ABC_" + new Date().toISOString().slice(0,19).replace(/:/g, "-") + ".xlsx";
        XLSX.writeFile(wb, nomeArquivo);
        showToast("✅ Arquivo exportado!", "success");
    } catch (error) {
        console.error(error);
        showToast("❌ Erro ao exportar: " + error.message, "error");
    }
}

function limparCurva() {
    curvaDadosAtuais = null;
    curvaLojasDisponiveis = [];
    curvaLojasSelecionadas = [];
    curvaFiltroAtivo = false;
    
    const resultadoArea = document.getElementById("resultadoAreaCurva");
    if (resultadoArea) resultadoArea.style.display = "none";
    
    const btnFiltrar = document.getElementById("btnFiltrarCurva");
    const btnExportar = document.getElementById("btnExportarCurva");
    const btnLimpar = document.getElementById("btnLimparCurva");
    
    if (btnFiltrar) btnFiltrar.style.display = "none";
    if (btnExportar) btnExportar.style.display = "none";
    if (btnLimpar) btnLimpar.style.display = "none";
    
    const statusSpan = document.getElementById("statusUploadCurva");
    if (statusSpan) statusSpan.innerHTML = "Aguardando arquivo";
    
    const fileInput = document.getElementById("fileInputCurva");
    if (fileInput) fileInput.value = "";
    
    showToast("Dados limpos!", "info");
}