// ========== UI DA CURVA ABC - VERSÃO CORRIGIDA ==========

let curvaDadosAtuais = null;
let curvaLojasDisponiveis = [];
let curvaLojasSelecionadas = [];
let curvaFiltroAtivo = false;

// Macros de lojas
const MACROS_LOJAS = {
    emporio: [
        "PONTA D AREIA", "CALHAU", "PENINSULA PTA AREIA", "COHAMA",
        "EMPORIO FRIBAL TERESINA", "EMPORIO IMPERATRIZ", "TURU"
    ],
    mercearia: [
        "CURVA DO 90", "MERCEARIA SANTA INES", "MERCEARIA MAIOBAO"
    ]
};

function getMacroLoja(loja) {
    const lojaStr = String(loja).toUpperCase().trim();
    if (MACROS_LOJAS.emporio.some(l => l.toUpperCase() === lojaStr)) return 'emporio';
    if (MACROS_LOJAS.mercearia.some(l => l.toUpperCase() === lojaStr)) return 'mercearia';
    return 'outros';
}

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
                <div class="card-value" id="statusUpload">Aguardando arquivo</div>
            </div>
        </div>
        
        <div class="file-area" id="uploadArea">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Clique ou arraste o arquivo da Curva ABC</p>
            <div class="file-info">Formatos: .xlsx, .xls | Cabeçalho na linha 4</div>
            <input type="file" id="fileInput" accept=".xlsx,.xls" style="display: none">
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" id="btnProcessar" disabled>
                <i class="fas fa-cogs"></i> Processar
            </button>
            <button class="btn btn-secondary" id="btnFiltrar" style="display: none;">
                <i class="fas fa-filter"></i> Filtrar Lojas
            </button>
            <button class="btn btn-success" id="btnExportar" style="display: none;">
                <i class="fas fa-download"></i> Exportar XLSX
            </button>
            <button class="btn btn-danger" id="btnLimpar" style="display: none;">
                <i class="fas fa-trash"></i> Limpar
            </button>
        </div>
        
        <div id="resultadoArea" style="display: none;">
            <div id="cardsResultado" class="cards-grid"></div>
            <div id="resumoLojas" class="preview-area" style="margin-bottom: 15px;"></div>
            <div class="preview-area">
                <div class="preview-header">
                    <h4><i class="fas fa-table"></i> Dados Processados</h4>
                    <span id="filterBadge" class="filter-badge" style="display: none;"></span>
                </div>
                <div class="preview-content" id="previewContent">
                    <pre></pre>
                </div>
            </div>
        </div>
        
        <div class="preview-area">
            <div class="preview-header">
                <h4><i class="fas fa-info-circle"></i> Instruções</h4>
            </div>
            <div class="preview-content">
                <p><strong>📋 Curva ABC por Loja</strong></p>
                <p>Faça upload do arquivo "Curva ABC por Loja" gerado pelo sistema SGE.</p>
                <p>Após o processamento, filtre por lojas e exporte para Excel.</p>
            </div>
        </div>
    `;
}

function inicializarCurvaABC() {
    console.log('🚀 inicializarCurvaABC chamado');
    
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const btnProcessar = document.getElementById('btnProcessar');
    const statusSpan = document.getElementById('statusUpload');
    
    if (!uploadArea) {
        console.error('❌ uploadArea não encontrado');
        return;
    }
    
    let arquivoSelecionado = null;
    
    uploadArea.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            arquivoSelecionado = e.target.files[0];
            statusSpan.innerHTML = `📂 ${arquivoSelecionado.name}`;
            statusSpan.style.color = '#4caf50';
            btnProcessar.disabled = false;
            showToast(`Arquivo "${arquivoSelecionado.name}" selecionado!`, 'success');
            console.log('📁 Arquivo selecionado:', arquivoSelecionado.name);
        }
    };
    
    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    };
    uploadArea.ondragleave = () => uploadArea.classList.remove('drag-over');
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            arquivoSelecionado = files[0];
            statusSpan.innerHTML = `📂 ${arquivoSelecionado.name}`;
            statusSpan.style.color = '#4caf50';
            btnProcessar.disabled = false;
            showToast(`Arquivo "${arquivoSelecionado.name}" recebido!`, 'success');
            console.log('📁 Arquivo recebido por drag:', arquivoSelecionado.name);
        }
    };
    
    btnProcessar.onclick = async () => {
        console.log('🔘 Botão Processar clicado');
        
        if (!arquivoSelecionado) {
            showToast('Selecione um arquivo primeiro!', 'error');
            return;
        }
        
        showToast('📊 Processando arquivo...', 'info');
        btnProcessar.disabled = true;
        btnProcessar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processando...';
        
        try {
            const resultado = await curvaProcessor.processarArquivo(arquivoSelecionado, processador.dadosPrecos);
            
            if (!resultado || !resultado.success) {
                throw new Error(resultado?.error || 'Falha no processamento');
            }
            
            const dados = resultado.dados || [];
            const lojas = resultado.lojas || [];
            const estatisticas = resultado.estatisticas || {};
            
            if (dados.length === 0) {
                showToast('⚠️ Nenhum dado encontrado no arquivo.', 'warning');
                return;
            }
            
            curvaDadosAtuais = dados;
            curvaLojasDisponiveis = lojas;
            
            curvaProcessor.dadosProcessados = dados;
            curvaProcessor.lojas = lojas;
            curvaProcessor.estatisticas = estatisticas;
            
            mostrarResultadoCurva({ dados, lojas, estatisticas, success: true });
            showToast(`✅ Processado! ${dados.length} registros, ${lojas.length} lojas`, 'success');
            
            const btnFiltrar = document.getElementById('btnFiltrar');
            const btnExportar = document.getElementById('btnExportar');
            const btnLimpar = document.getElementById('btnLimpar');
            
            if (btnFiltrar) {
                btnFiltrar.style.display = 'block';
                btnFiltrar.onclick = () => abrirFiltroLojas();
            }
            if (btnExportar) {
                btnExportar.style.display = 'block';
                btnExportar.onclick = () => exportarCurvaXLSX();
            }
            if (btnLimpar) {
                btnLimpar.style.display = 'block';
                btnLimpar.onclick = () => limparCurva();
            }
            
        } catch (error) {
            console.error('❌ Erro:', error);
            showToast('❌ Erro ao processar: ' + error.message, 'error');
        } finally {
            btnProcessar.disabled = false;
            btnProcessar.innerHTML = '<i class="fas fa-cogs"></i> Processar';
        }
    };
}

function mostrarResultadoCurva(resultado) {
    const resultadoArea = document.getElementById('resultadoArea');
    const cardsDiv = document.getElementById('cardsResultado');
    const resumoLojasDiv = document.getElementById('resumoLojas');
    const previewContent = document.getElementById('previewContent');
    
    if (resultadoArea) resultadoArea.style.display = 'block';
    
    const stats = resultado.estatisticas || {};
    
    if (cardsDiv) {
        cardsDiv.innerHTML = `
            <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(stats.totalRegistros || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🆔 PRODUTOS ÚNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidade(stats.quantidadeTotal || 0)}</div></div>
            <div class="card"><div class="card-title">💰 FATURAMENTO TOTAL</div><div class="card-value">${formatarMoeda(stats.faturamentoTotal || 0)}</div></div>
            <div class="card"><div class="card-title">💰 COM PREÇO BASE</div><div class="card-value">${(stats.produtosComPreco || 0).toLocaleString()}</div></div>
        `;
    }
    
    if (resumoLojasDiv) {
        resumoLojasDiv.innerHTML = `
            <div class="preview-header"><h4><i class="fas fa-store"></i> Resumo por Loja</h4></div>
            <div class="preview-content"><pre>${formatarResumoLojasComCores(stats.porLoja || {})}</pre></div>
        `;
    }
    
    if (previewContent) {
        previewContent.innerHTML = `<pre>${formatarPreviewCurva((resultado.dados || []).slice(0, 20))}</pre>`;
    }
}

function formatarResumoLojasComCores(porLoja) {
    let output = 'LOJA                                TIPO        QUANTIDADE        FATURAMENTO\n';
    output += '----------------------------------  ----------  --------------  ------------------\n';
    
    const lojasPorTipo = { emporio: [], mercearia: [], outros: [] };
    for (const loja of Object.keys(porLoja)) {
        const tipo = getMacroLoja(loja);
        lojasPorTipo[tipo].push({ nome: loja, dados: porLoja[loja] });
    }
    
    for (const tipo of ['emporio', 'mercearia', 'outros']) {
        lojasPorTipo[tipo].sort((a, b) => (b.dados?.faturamento || 0) - (a.dados?.faturamento || 0));
    }
    
    const formatarLinha = (loja, dados, tipo) => {
        const tipoLabel = tipo === 'emporio' ? 'EMPÓRIO  ' : (tipo === 'mercearia' ? 'MERCEARIA ' : 'OUTROS    ');
        return `${String(loja).slice(0,34).padEnd(34)}  ${tipoLabel}  ${formatarQuantidade(dados?.quantidade || 0).padStart(14)}  ${formatarMoeda(dados?.faturamento || 0).padStart(18)}`;
    };
    
    if (lojasPorTipo.emporio.length) {
        output += `\n🏪 EMPÓRIOS:\n`;
        lojasPorTipo.emporio.forEach(i => output += formatarLinha(i.nome, i.dados, 'emporio') + '\n');
    }
    if (lojasPorTipo.mercearia.length) {
        output += `\n🥩 MERCEARIAS:\n`;
        lojasPorTipo.mercearia.forEach(i => output += formatarLinha(i.nome, i.dados, 'mercearia') + '\n');
    }
    if (lojasPorTipo.outros.length) {
        output += `\n🔮 OUTROS:\n`;
        lojasPorTipo.outros.forEach(i => output += formatarLinha(i.nome, i.dados, 'outros') + '\n');
    }
    
    return output;
}

function formatarPreviewCurva(dados) {
    if (!dados || !dados.length) return 'Nenhum dado';
    let out = 'CÓDIGO    PRODUTO                                    QTD             TOTAL       LOJA\n';
    out += '------    ----------------------------------------  --------------  ----------  ------------------\n';
    dados.forEach(p => {
        out += `${String(p.codigoInt || p.codigo).slice(0,8).padEnd(8)}  ${(p.produto || '').slice(0,40).padEnd(40)}  ${formatarQuantidade(p.qtd).padStart(14)}  ${formatarMoeda(p.total).padStart(10)}  ${String(p.loja).slice(0,18).padEnd(18)}\n`;
    });
    return out;
}

function atualizarPreviewFiltrado() {
    if (!curvaProcessor || !curvaProcessor.dadosProcessados) {
        console.warn('⚠️ curvaProcessor sem dados');
        return;
    }
    
    const resumo = curvaProcessor.getResumoFiltrado(curvaLojasSelecionadas);
    const dadosFiltrados = curvaProcessor.filtrarPorLojas(curvaLojasSelecionadas);
    const previewContent = document.getElementById('previewContent');
    const filterBadge = document.getElementById('filterBadge');
    const cardsDiv = document.getElementById('cardsResultado');
    const resumoLojasDiv = document.getElementById('resumoLojas');
    
    if (!previewContent) return;
    
    if (curvaLojasSelecionadas.length) {
        if (filterBadge) {
            filterBadge.style.display = 'inline-flex';
            filterBadge.innerHTML = `🔽 ${curvaLojasSelecionadas.length} loja(s) selecionada(s)`;
        }
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(resumo.totalRegistros || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS ÚNICOS</div><div class="card-value">${(resumo.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(resumo.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidade(resumo.quantidadeTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 FATURAMENTO TOTAL</div><div class="card-value">${formatarMoeda(resumo.faturamentoTotal || 0)}</div></div>
            `;
        }
        if (resumoLojasDiv) {
            resumoLojasDiv.innerHTML = `
                <div class="preview-header"><h4>Resumo por Loja (Filtrado)</h4></div>
                <div class="preview-content"><pre>${formatarResumoLojasComCores(resumo.porLoja || {})}</pre></div>
            `;
        }
    } else {
        if (filterBadge) filterBadge.style.display = 'none';
        const stats = curvaProcessor.estatisticas || {};
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 REGISTROS</div><div class="card-value">${(stats.totalRegistros || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS ÚNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidade(stats.quantidadeTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 FATURAMENTO TOTAL</div><div class="card-value">${formatarMoeda(stats.faturamentoTotal || 0)}</div></div>
                <div class="card"><div class="card-title">💰 COM PREÇO BASE</div><div class="card-value">${(stats.produtosComPreco || 0).toLocaleString()}</div></div>
            `;
        }
        if (resumoLojasDiv) {
            resumoLojasDiv.innerHTML = `
                <div class="preview-header"><h4>Resumo por Loja</h4></div>
                <div class="preview-content"><pre>${formatarResumoLojasComCores(stats.porLoja || {})}</pre></div>
            `;
        }
    }
    
    if (previewContent) {
        previewContent.innerHTML = `<pre>${formatarPreviewCurva((dadosFiltrados || []).slice(0,20))}</pre>`;
    }
}

function abrirFiltroLojas() {
    console.log('🔍 abrirFiltroLojas chamado, lojas:', curvaLojasDisponiveis);
    
    if (!curvaLojasDisponiveis.length) {
        showToast('Nenhuma loja disponível', 'error');
        return;
    }
    
    const lojasPorTipo = { emporio: [], mercearia: [], outros: [] };
    curvaLojasDisponiveis.forEach(loja => {
        const tipo = getMacroLoja(loja);
        lojasPorTipo[tipo].push(loja);
    });
    ['emporio', 'mercearia', 'outros'].forEach(t => lojasPorTipo[t].sort());
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:550px; max-width:90%; max-height:80vh; display:flex; flex-direction:column;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-filter"></i> Filtrar por Lojas</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow-y:auto; padding:20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button id="macroEmporioBtn" style="flex:1; background:#51cf66; border:none; border-radius:8px; color:white; font-weight:bold; padding:10px; cursor:pointer;">🏪 EMPÓRIO</button>
                    <button id="macroMerceariaBtn" style="flex:1; background:#ffd43b; border:none; border-radius:8px; color:#333; font-weight:bold; padding:10px; cursor:pointer;">🥩 MERCEARIA</button>
                    <button id="macroOutrosBtn" style="flex:1; background:#4dabf7; border:none; border-radius:8px; color:white; font-weight:bold; padding:10px; cursor:pointer;">🔮 OUTROS</button>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="selectAllBtn" class="btn btn-secondary" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Selecionar Todos</button>
                    <button id="clearAllBtn" class="btn btn-secondary" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Limpar Todos</button>
                </div>
                <div id="lojasList" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #404040;">
                <button id="cancelFilterBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Cancelar</button>
                <button id="applyFilterBtn" style="flex:1; background:#8b0000; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Aplicar Filtro</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const lojasDiv = document.getElementById('lojasList');
    
    const renderLojas = () => {
        if (!lojasDiv) return;
        lojasDiv.innerHTML = '';
        for (const tipo of ['emporio', 'mercearia', 'outros']) {
            if (lojasPorTipo[tipo].length) {
                const titulo = tipo === 'emporio' ? '🏪 EMPÓRIOS' : (tipo === 'mercearia' ? '🥩 MERCEARIAS' : '🔮 OUTROS');
                const cor = tipo === 'emporio' ? '#51cf66' : (tipo === 'mercearia' ? '#ffd43b' : '#4dabf7');
                lojasDiv.innerHTML += `<div style="margin-top:10px; padding:5px 0; border-bottom:1px solid #404040;"><span style="color:${cor}; font-weight:bold;">${titulo}</span></div>`;
                lojasPorTipo[tipo].forEach(loja => {
                    const checked = curvaLojasSelecionadas.includes(loja) ? 'checked' : '';
                    lojasDiv.innerHTML += `
                        <label style="display:flex; align-items:center; padding:8px; cursor:pointer; border-radius:8px; margin-bottom:4px; background: rgba(255,255,255,0.03);">
                            <input type="checkbox" value="${loja.replace(/"/g, '&quot;')}" ${checked} style="margin-right:10px; width:18px; height:18px;">
                            <span style="font-size:13px; color:#ffffff;">${loja}</span>
                        </label>
                    `;
                });
            }
        }
    };
    
    renderLojas();
    
    const getCheckboxesByTipo = (tipo) => {
        return Array.from(document.querySelectorAll('#lojasList input[type="checkbox"]')).filter(cb => lojasPorTipo[tipo].includes(cb.value));
    };
    
    const macroEmporio = document.getElementById('macroEmporioBtn');
    const macroMercearia = document.getElementById('macroMerceariaBtn');
    const macroOutros = document.getElementById('macroOutrosBtn');
    const selectAll = document.getElementById('selectAllBtn');
    const clearAll = document.getElementById('clearAllBtn');
    const applyBtn = document.getElementById('applyFilterBtn');
    const cancelBtn = document.getElementById('cancelFilterBtn');
    const closeBtn = modal.querySelector('.modal-close');
    
    const closeModal = () => modal.remove();
    
    if (macroEmporio) {
        macroEmporio.onclick = () => {
            const cbs = getCheckboxesByTipo('emporio');
            const allChecked = cbs.length && cbs.every(c => c.checked);
            cbs.forEach(c => c.checked = !allChecked);
        };
    }
    if (macroMercearia) {
        macroMercearia.onclick = () => {
            const cbs = getCheckboxesByTipo('mercearia');
            const allChecked = cbs.length && cbs.every(c => c.checked);
            cbs.forEach(c => c.checked = !allChecked);
        };
    }
    if (macroOutros) {
        macroOutros.onclick = () => {
            const cbs = getCheckboxesByTipo('outros');
            const allChecked = cbs.length && cbs.every(c => c.checked);
            cbs.forEach(c => c.checked = !allChecked);
        };
    }
    if (selectAll) selectAll.onclick = () => document.querySelectorAll('#lojasList input[type="checkbox"]').forEach(cb => cb.checked = true);
    if (clearAll) clearAll.onclick = () => document.querySelectorAll('#lojasList input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (applyBtn) {
        applyBtn.onclick = () => {
            curvaLojasSelecionadas = Array.from(document.querySelectorAll('#lojasList input[type="checkbox"]:checked')).map(cb => cb.value);
            curvaFiltroAtivo = curvaLojasSelecionadas.length > 0;
            atualizarPreviewFiltrado();
            closeModal();
            showToast(`${curvaLojasSelecionadas.length} loja(s) selecionada(s)`, 'success');
        };
    }
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function exportarCurvaXLSX() {
    console.log('💾 exportarCurvaXLSX chamado');
    
    if (!curvaDadosAtuais || !curvaDadosAtuais.length) {
        showToast('Nenhum dado para exportar', 'error');
        return;
    }
    
    if (typeof XLSX === 'undefined') {
        showToast('Biblioteca XLSX não carregada. Recarregue a página.', 'error');
        return;
    }
    
    try {
        let dados = curvaDadosAtuais;
        if (curvaFiltroAtivo && curvaLojasSelecionadas.length) {
            dados = curvaDadosAtuais.filter(p => curvaLojasSelecionadas.includes(p.loja));
        }
        
        console.log('📊 Exportando', dados.length, 'registros');
        
        const planilhaDados = dados.map(p => ({
            'CÓDIGO': p.codigoInt || p.codigo,
            'PRODUTO': p.produto,
            'QUANTIDADE': p.qtd,
            'TOTAL (R$)': p.total,
            'PREÇO MÉDIO': p.precoMedio || (p.qtd > 0 ? p.total / p.qtd : 0),
            'LOJA': p.loja,
            'PREÇO BASE': p.precoBase || 0,
            'CATEGORIA': p.categoria || '',
            'GRUPO': p.grupo || ''
        }));
        
        const ws = XLSX.utils.json_to_sheet(planilhaDados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Curva_ABC');
        
        ws['!cols'] = [
            { wch: 10 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 25 }, { wch: 25 }
        ];
        
        const nomeArquivo = `Curva_ABC_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
        showToast(`✅ Arquivo "${nomeArquivo}" exportado!`, 'success');
    } catch (error) {
        console.error(error);
        showToast('❌ Erro ao exportar: ' + error.message, 'error');
    }
}

function limparCurva() {
    console.log('🧹 limparCurva chamado');
    
    curvaDadosAtuais = null;
    curvaLojasDisponiveis = [];
    curvaLojasSelecionadas = [];
    curvaFiltroAtivo = false;
    
    const resultadoArea = document.getElementById('resultadoArea');
    if (resultadoArea) resultadoArea.style.display = 'none';
    
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnExportar = document.getElementById('btnExportar');
    const btnLimpar = document.getElementById('btnLimpar');
    
    if (btnFiltrar) btnFiltrar.style.display = 'none';
    if (btnExportar) btnExportar.style.display = 'none';
    if (btnLimpar) btnLimpar.style.display = 'none';
    
    const statusSpan = document.getElementById('statusUpload');
    if (statusSpan) statusSpan.innerHTML = 'Aguardando arquivo';
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    showToast('Dados limpos!', 'info');
}