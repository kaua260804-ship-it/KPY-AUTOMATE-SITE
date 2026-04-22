// ========== UI DE ENTRADAS POR GRUPO ==========

let entradasDadosAtuais = null;
let entradasGruposDisponiveis = [];
let entradasCompradoresDisponiveis = [];
let entradasGruposSelecionados = [];
let entradasCompradoresSelecionados = [];

function renderizarEntradas() {
    const stats = processador.getEstatisticas() || {};
    return `
        <div class="cards-grid">
            <div class="card">
                <div class="card-title">📦 BASE DE PREÇOS</div>
                <div class="card-value">${(stats.totalProdutos || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">📊 STATUS</div>
                <div class="card-value" id="statusUploadEntradas">Aguardando arquivo</div>
            </div>
        </div>
        
        <div class="file-area" id="uploadAreaEntradas">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Clique ou arraste o arquivo de Entradas</p>
            <div class="file-info">Formatos: .xlsx, .xls | Relatorio "Entradas Produtos por Grupo"</div>
            <input type="file" id="fileInputEntradas" accept=".xlsx,.xls" style="display: none">
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" id="btnProcessarEntradas" disabled>
                <i class="fas fa-cogs"></i> Processar
            </button>
            <button class="btn btn-secondary" id="btnFiltrarGrupoEntradas" style="display: none;">
                <i class="fas fa-filter"></i> Filtrar por Grupo
            </button>
            <button class="btn btn-secondary" id="btnFiltrarCompradorEntradas" style="display: none;">
                <i class="fas fa-user"></i> Filtrar por Comprador
            </button>
            <button class="btn btn-success" id="btnExportarEntradas" style="display: none;">
                <i class="fas fa-download"></i> Exportar XLSX
            </button>
            <button class="btn btn-danger" id="btnLimparEntradas" style="display: none;">
                <i class="fas fa-trash"></i> Limpar
            </button>
        </div>
        
        <div id="resultadoAreaEntradas" style="display: none;">
            <div id="cardsResultadoEntradas" class="cards-grid"></div>
            <div id="resumoGruposEntradas" class="preview-area" style="margin-bottom: 15px;"></div>
            <div id="resumoCompradoresEntradas" class="preview-area" style="margin-bottom: 15px;"></div>
            <div class="preview-area">
                <div class="preview-header">
                    <h4><i class="fas fa-table"></i> Dados Processados</h4>
                    <span id="filterBadgeEntradas" class="filter-badge" style="display: none;"></span>
                </div>
                <div class="preview-content" id="previewContentEntradas">
                    <pre></pre>
                </div>
            </div>
        </div>
        
        <div class="preview-area">
            <div class="preview-header">
                <h4><i class="fas fa-info-circle"></i> Instrucoes</h4>
            </div>
            <div class="preview-content">
                <p><strong>📋 Entradas por Grupo</strong></p>
                <p>Faça upload do arquivo "Entradas Produtos por Grupo" gerado pelo sistema SGE.</p>
                <p>O sistema identifica automaticamente categorias, grupos e compradores.</p>
                <p>Apos o processamento, filtre por grupo ou comprador e exporte para Excel.</p>
            </div>
        </div>
    `;
}

function inicializarEntradas() {
    console.log("inicializarEntradas chamado");
    
    const uploadArea = document.getElementById("uploadAreaEntradas");
    const fileInput = document.getElementById("fileInputEntradas");
    const btnProcessar = document.getElementById("btnProcessarEntradas");
    const statusSpan = document.getElementById("statusUploadEntradas");
    
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
        
        showToast("📊 Processando arquivo de Entradas...", "info");
        btnProcessar.disabled = true;
        btnProcessar.innerHTML = "<i class=\"fas fa-spinner fa-pulse\"></i> Processando...";
        
        try {
            const resultado = await entradasProcessor.processarArquivo(arquivoSelecionado, processador.dadosPrecos);
            
            if (!resultado || !resultado.success) {
                throw new Error(resultado?.error || "Falha no processamento");
            }
            
            entradasDadosAtuais = resultado.dados;
            entradasGruposDisponiveis = resultado.grupos || [];
            entradasCompradoresDisponiveis = resultado.compradores || [];
            
            mostrarResultadoEntradas(resultado);
            showToast("✅ Processado! " + resultado.dados.length + " registros, " + resultado.grupos.length + " grupos", "success");
            
            const btnFiltrarGrupo = document.getElementById("btnFiltrarGrupoEntradas");
            const btnFiltrarComprador = document.getElementById("btnFiltrarCompradorEntradas");
            const btnExportar = document.getElementById("btnExportarEntradas");
            const btnLimpar = document.getElementById("btnLimparEntradas");
            
            if (btnFiltrarGrupo) {
                btnFiltrarGrupo.style.display = "block";
                btnFiltrarGrupo.onclick = () => abrirFiltroGrupos();
            }
            if (btnFiltrarComprador) {
                btnFiltrarComprador.style.display = "block";
                btnFiltrarComprador.onclick = () => abrirFiltroCompradores();
            }
            if (btnExportar) {
                btnExportar.style.display = "block";
                btnExportar.onclick = () => exportarEntradasXLSX();
            }
            if (btnLimpar) {
                btnLimpar.style.display = "block";
                btnLimpar.onclick = () => limparEntradas();
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
    const num = parseFloat(valor);
    if (isNaN(num)) return "0,00";
    return num.toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

function formatarQuantidadeBR(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return "0";
    const num = parseFloat(valor);
    if (isNaN(num)) return "0";
    if (Number.isInteger(num)) return num.toLocaleString("pt-BR");
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function formatarDataBR(data) {
    if (!data) return "";
    const str = String(data);
    if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) return str;
    if (str.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
        const partes = str.split("/");
        return partes[0] + "/" + partes[1] + "/20" + partes[2];
    }
    return str;
}

function mostrarResultadoEntradas(resultado) {
    const resultadoArea = document.getElementById("resultadoAreaEntradas");
    const cardsDiv = document.getElementById("cardsResultadoEntradas");
    const resumoGruposDiv = document.getElementById("resumoGruposEntradas");
    const resumoCompradoresDiv = document.getElementById("resumoCompradoresEntradas");
    const previewContent = document.getElementById("previewContentEntradas");
    
    if (resultadoArea) resultadoArea.style.display = "block";
    
    const stats = resultado.estatisticas || {};
    
    if (cardsDiv) {
        cardsDiv.innerHTML = `
            <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(stats.totalRegistros || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🆔 PRODUTOS UNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">📂 GRUPOS</div><div class="card-value">${(stats.totalGrupos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">👥 COMPRADORES</div><div class="card-value">${(stats.totalCompradores || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(stats.quantidadeTotal || 0)}</div></div>
            <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.valorTotal || 0)}</div></div>
        `;
    }
    
    if (resumoGruposDiv && stats.porGrupo) {
        let html = '<div class="preview-header"><h4><i class="fas fa-folder"></i> Resumo por Grupo</h4></div><div class="preview-content"><pre>';
        html += "GRUPO                                QUANTIDADE        VALOR\n";
        html += "----------------------------------  --------------  ------------------\n";
        
        const gruposOrdenados = Object.entries(stats.porGrupo).sort((a, b) => b[1].valor - a[1].valor);
        for (const [grupo, dados] of gruposOrdenados) {
            const nome = String(grupo).slice(0, 34).padEnd(34);
            const qtd = formatarQuantidadeBR(dados.quantidade || 0).padStart(14);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + qtd + "  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoGruposDiv.innerHTML = html;
    }
    
    if (resumoCompradoresDiv && stats.porComprador) {
        let html = '<div class="preview-header"><h4><i class="fas fa-users"></i> Resumo por Comprador</h4></div><div class="preview-content"><pre>';
        html += "COMPRADOR                          QUANTIDADE        VALOR       GRUPOS\n";
        html += "----------------------------------  --------------  ------------------  -----\n";
        
        const compradoresOrdenados = Object.entries(stats.porComprador).sort((a, b) => b[1].valor - a[1].valor);
        for (const [comprador, dados] of compradoresOrdenados) {
            const nome = String(comprador).slice(0, 34).padEnd(34);
            const qtd = formatarQuantidadeBR(dados.quantidade || 0).padStart(14);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            const grupos = dados.grupos?.length || 0;
            html += nome + "  " + qtd + "  " + valor + "  " + String(grupos).padStart(5) + "\n";
        }
        html += "</pre></div>";
        resumoCompradoresDiv.innerHTML = html;
    }
    
    if (previewContent) {
        previewContent.innerHTML = "<pre>" + formatarPreviewEntradas((resultado.dados || []).slice(0, 20)) + "</pre>";
    }
}

function formatarPreviewEntradas(dados) {
    if (!dados || !dados.length) return "Nenhum dado";
    let out = "CODIGO    PRODUTO                                    CATEGORIA            GRUPO               COMPRADOR           QTD       TOTAL\n";
    out += "------    ----------------------------------------  -------------------  ------------------  ------------------  -------  ----------\n";
    dados.slice(0, 20).forEach(p => {
        const codigo = String(p.codigoInt || p.codigo).slice(0, 8).padEnd(8);
        const produto = (p.produto || "").slice(0, 40).padEnd(40);
        const categoria = (p.categoria || "").slice(0, 19).padEnd(19);
        const grupo = (p.grupo || "").slice(0, 18).padEnd(18);
        const comprador = (p.comprador || "").slice(0, 18).padEnd(18);
        const qtd = formatarQuantidadeBR(p.qtd).padStart(7);
        const total = ("R$ " + formatarNumeroBR(p.total)).padStart(10);
        out += codigo + "  " + produto + "  " + categoria + "  " + grupo + "  " + comprador + "  " + qtd + "  " + total + "\n";
    });
    return out;
}

function atualizarPreviewEntradasFiltrado() {
    if (!entradasProcessor || !entradasProcessor.dadosProcessados) return;
    
    const resumo = entradasProcessor.getResumoFiltrado(entradasGruposSelecionados, entradasCompradoresSelecionados);
    let dadosFiltrados = entradasDadosAtuais;
    
    if (entradasGruposSelecionados.length) {
        dadosFiltrados = dadosFiltrados.filter(p => entradasGruposSelecionados.includes(p.grupo));
    }
    if (entradasCompradoresSelecionados.length) {
        dadosFiltrados = dadosFiltrados.filter(p => entradasCompradoresSelecionados.includes(p.comprador));
    }
    
    const previewContent = document.getElementById("previewContentEntradas");
    const filterBadge = document.getElementById("filterBadgeEntradas");
    const cardsDiv = document.getElementById("cardsResultadoEntradas");
    const resumoGruposDiv = document.getElementById("resumoGruposEntradas");
    const resumoCompradoresDiv = document.getElementById("resumoCompradoresEntradas");
    
    if (entradasGruposSelecionados.length || entradasCompradoresSelecionados.length) {
        if (filterBadge) {
            filterBadge.style.display = "inline-flex";
            const filtros = [];
            if (entradasGruposSelecionados.length) filtros.push(entradasGruposSelecionados.length + " grupo(s)");
            if (entradasCompradoresSelecionados.length) filtros.push(entradasCompradoresSelecionados.length + " comprador(es)");
            filterBadge.innerHTML = "🔽 " + filtros.join(", ");
        }
        
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(resumo.totalRegistros || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS UNICOS</div><div class="card-value">${(resumo.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📂 GRUPOS</div><div class="card-value">${(resumo.totalGrupos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">👥 COMPRADORES</div><div class="card-value">${(resumo.totalCompradores || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(resumo.quantidadeTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(resumo.valorTotal || 0)}</div></div>
            `;
        }
    } else {
        if (filterBadge) filterBadge.style.display = "none";
        const stats = entradasProcessor.estatisticas || {};
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(stats.totalRegistros || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS UNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📂 GRUPOS</div><div class="card-value">${(stats.totalGrupos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">👥 COMPRADORES</div><div class="card-value">${(stats.totalCompradores || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(stats.quantidadeTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.valorTotal || 0)}</div></div>
            `;
        }
    }
    
    if (previewContent) {
        previewContent.innerHTML = "<pre>" + formatarPreviewEntradas((dadosFiltrados || []).slice(0, 20)) + "</pre>";
    }
    
    // Atualizar resumo de grupos filtrado
    if (resumoGruposDiv && resumo.porGrupo) {
        let html = '<div class="preview-header"><h4><i class="fas fa-folder"></i> Resumo por Grupo</h4></div><div class="preview-content"><pre>';
        html += "GRUPO                                QUANTIDADE        VALOR\n";
        html += "----------------------------------  --------------  ------------------\n";
        
        const gruposOrdenados = Object.entries(resumo.porGrupo).sort((a, b) => b[1].valor - a[1].valor);
        for (const [grupo, dados] of gruposOrdenados) {
            const nome = String(grupo).slice(0, 34).padEnd(34);
            const qtd = formatarQuantidadeBR(dados.quantidade || 0).padStart(14);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + qtd + "  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoGruposDiv.innerHTML = html;
    }
    
    // Atualizar resumo de compradores filtrado
    if (resumoCompradoresDiv && resumo.porComprador) {
        let html = '<div class="preview-header"><h4><i class="fas fa-users"></i> Resumo por Comprador</h4></div><div class="preview-content"><pre>';
        html += "COMPRADOR                          QUANTIDADE        VALOR       GRUPOS\n";
        html += "----------------------------------  --------------  ------------------  -----\n";
        
        const compradoresOrdenados = Object.entries(resumo.porComprador).sort((a, b) => b[1].valor - a[1].valor);
        for (const [comprador, dados] of compradoresOrdenados) {
            const nome = String(comprador).slice(0, 34).padEnd(34);
            const qtd = formatarQuantidadeBR(dados.quantidade || 0).padStart(14);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            const grupos = dados.grupos?.length || 0;
            html += nome + "  " + qtd + "  " + valor + "  " + String(grupos).padStart(5) + "\n";
        }
        html += "</pre></div>";
        resumoCompradoresDiv.innerHTML = html;
    }
}

function abrirFiltroGrupos() {
    if (!entradasGruposDisponiveis.length) {
        showToast("Nenhum grupo disponivel", "error");
        return;
    }
    
    const gruposOrdenados = [...entradasGruposDisponiveis].sort();
    
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;";
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:500px; max-width:90%; max-height:80vh; display:flex; flex-direction:column;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-filter"></i> Filtrar por Grupos</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow-y:auto; padding:20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="selectAllGrupos" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Selecionar Todos</button>
                    <button id="clearAllGrupos" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Limpar Todos</button>
                </div>
                <div id="gruposList" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #404040;">
                <button id="cancelGruposBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Cancelar</button>
                <button id="applyGruposBtn" style="flex:1; background:#8b0000; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const gruposDiv = document.getElementById("gruposList");
    gruposOrdenados.forEach(grupo => {
        const checked = entradasGruposSelecionados.includes(grupo) ? "checked" : "";
        gruposDiv.innerHTML += `
            <label style="display:flex; align-items:center; padding:8px; cursor:pointer; border-radius:8px; margin-bottom:4px; background: rgba(255,255,255,0.03);">
                <input type="checkbox" value="${grupo.replace(/"/g, "&quot;")}" ${checked} style="margin-right:10px; width:18px; height:18px;">
                <span style="font-size:13px; color:#ffffff;">${grupo}</span>
            </label>
        `;
    });
    
    document.getElementById("selectAllGrupos").onclick = () => document.querySelectorAll("#gruposList input[type=\"checkbox\"]").forEach(cb => cb.checked = true);
    document.getElementById("clearAllGrupos").onclick = () => document.querySelectorAll("#gruposList input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
    document.getElementById("applyGruposBtn").onclick = () => {
        entradasGruposSelecionados = Array.from(document.querySelectorAll("#gruposList input[type=\"checkbox\"]:checked")).map(cb => cb.value);
        atualizarPreviewEntradasFiltrado();
        modal.remove();
        showToast(entradasGruposSelecionados.length + " grupo(s) selecionado(s)", "success");
    };
    document.getElementById("cancelGruposBtn").onclick = () => modal.remove();
    modal.querySelector(".modal-close").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function abrirFiltroCompradores() {
    if (!entradasCompradoresDisponiveis.length) {
        showToast("Nenhum comprador disponivel", "error");
        return;
    }
    
    const compradoresOrdenados = [...entradasCompradoresDisponiveis].sort();
    
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;";
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:500px; max-width:90%; max-height:80vh; display:flex; flex-direction:column;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-filter"></i> Filtrar por Compradores</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow-y:auto; padding:20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="selectAllCompradores" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Selecionar Todos</button>
                    <button id="clearAllCompradores" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Limpar Todos</button>
                </div>
                <div id="compradoresList" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #404040;">
                <button id="cancelCompradoresBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Cancelar</button>
                <button id="applyCompradoresBtn" style="flex:1; background:#8b0000; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const compradoresDiv = document.getElementById("compradoresList");
    compradoresOrdenados.forEach(comprador => {
        const checked = entradasCompradoresSelecionados.includes(comprador) ? "checked" : "";
        compradoresDiv.innerHTML += `
            <label style="display:flex; align-items:center; padding:8px; cursor:pointer; border-radius:8px; margin-bottom:4px; background: rgba(255,255,255,0.03);">
                <input type="checkbox" value="${comprador.replace(/"/g, "&quot;")}" ${checked} style="margin-right:10px; width:18px; height:18px;">
                <span style="font-size:13px; color:#ffffff;">${comprador}</span>
            </label>
        `;
    });
    
    document.getElementById("selectAllCompradores").onclick = () => document.querySelectorAll("#compradoresList input[type=\"checkbox\"]").forEach(cb => cb.checked = true);
    document.getElementById("clearAllCompradores").onclick = () => document.querySelectorAll("#compradoresList input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
    document.getElementById("applyCompradoresBtn").onclick = () => {
        entradasCompradoresSelecionados = Array.from(document.querySelectorAll("#compradoresList input[type=\"checkbox\"]:checked")).map(cb => cb.value);
        atualizarPreviewEntradasFiltrado();
        modal.remove();
        showToast(entradasCompradoresSelecionados.length + " comprador(es) selecionado(s)", "success");
    };
    document.getElementById("cancelCompradoresBtn").onclick = () => modal.remove();
    modal.querySelector(".modal-close").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function exportarEntradasXLSX() {
    if (!entradasDadosAtuais || !entradasDadosAtuais.length) {
        showToast("Nenhum dado para exportar", "error");
        return;
    }
    
    if (typeof XLSX === "undefined") {
        showToast("Biblioteca XLSX nao carregada.", "error");
        return;
    }
    
    try {
        let dados = entradasDadosAtuais;
        if (entradasGruposSelecionados.length) {
            dados = dados.filter(p => entradasGruposSelecionados.includes(p.grupo));
        }
        if (entradasCompradoresSelecionados.length) {
            dados = dados.filter(p => entradasCompradoresSelecionados.includes(p.comprador));
        }
        
        // Funcoes de formatacao para exportacao
        function formatarNumeroExportacao(valor) {
            if (valor === undefined || valor === null || isNaN(valor)) return "0,00";
            const num = parseFloat(valor);
            if (isNaN(num)) return "0,00";
            return num.toFixed(2).replace(".", ",");
        }
        
        function formatarQuantidadeExportacao(valor) {
            if (valor === undefined || valor === null || isNaN(valor)) return "0";
            const num = parseFloat(valor);
            if (isNaN(num)) return "0";
            if (Number.isInteger(num)) return num.toString();
            return num.toFixed(3).replace(".", ",");
        }
        
        const planilhaDados = dados.map(p => ({
            "Codigo": p.codigoInt,
            "Produto": p.produto,
            "Categoria": p.categoria,
            "Grupo": p.grupo,
            "Comprador": p.comprador,
            "Qtd": formatarQuantidadeExportacao(p.qtd),
            "Unid": p.unid || "",
            "Custo Md": formatarNumeroExportacao(p.custoMd),
            "Total": formatarNumeroExportacao(p.total),
            "Pr. Vda": formatarNumeroExportacao(p.prVda),
            "Markup": formatarNumeroExportacao(p.markup),
            "Margem": formatarNumeroExportacao(p.margem),
            "Ult.Ent.": formatarDataBR(p.ultEnt),
            "Peças": formatarQuantidadeExportacao(p.pecas)
        }));
        
        const ws = XLSX.utils.json_to_sheet(planilhaDados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Entradas");
        
        ws["!cols"] = [
            { wch: 10 }, { wch: 50 }, { wch: 25 }, { wch: 30 },
            { wch: 20 }, { wch: 12 }, { wch: 6 }, { wch: 12 },
            { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
            { wch: 12 }, { wch: 10 }
        ];
        
        const nomeArquivo = "Entradas_" + new Date().toISOString().slice(0,19).replace(/:/g, "-") + ".xlsx";
        XLSX.writeFile(wb, nomeArquivo);
        showToast("✅ Arquivo exportado!", "success");
    }
