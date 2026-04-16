// ========== UI DE PRODUTOS SEM VENDA ==========

let produtosDadosAtuais = null;
let produtosLojasDisponiveis = [];
let produtosLojasSelecionadas = [];
let produtosArquivosSelecionados = [];

function renderizarProdutosSemVenda() {
    const stats = processador.getEstatisticas() || {};
    return `
        <div class="cards-grid">
            <div class="card">
                <div class="card-title">📦 BASE DE PREÇOS</div>
                <div class="card-value">${(stats.totalProdutos || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">📊 STATUS</div>
                <div class="card-value" id="statusUploadProdutos">Aguardando arquivo(s)</div>
            </div>
        </div>
        
        <div class="file-area" id="uploadAreaProdutos">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Clique ou arraste arquivos Excel (até 10)</p>
            <div class="file-info">Formatos: .xlsx, .xls | Relatório Sai23 - Produtos sem Venda</div>
            <input type="file" id="fileInputProdutos" accept=".xlsx,.xls" multiple style="display: none">
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" id="btnProcessarProdutos" disabled>
                <i class="fas fa-cogs"></i> Processar
            </button>
            <button class="btn btn-secondary" id="btnFiltrarProdutos" style="display: none;">
                <i class="fas fa-filter"></i> Filtrar por Loja
            </button>
            <button class="btn btn-success" id="btnExportarProdutos" style="display: none;">
                <i class="fas fa-download"></i> Exportar XLSX
            </button>
            <button class="btn btn-danger" id="btnLimparProdutos" style="display: none;">
                <i class="fas fa-trash"></i> Limpar
            </button>
        </div>
        
        <div id="resultadoAreaProdutos" style="display: none;">
            <div id="cardsResultadoProdutos" class="cards-grid"></div>
            <div id="resumoLojasProdutos" class="preview-area" style="margin-bottom: 15px;"></div>
            <div class="preview-area">
                <div class="preview-header">
                    <h4><i class="fas fa-table"></i> Dados Processados</h4>
                    <span id="filterBadgeProdutos" class="filter-badge" style="display: none;"></span>
                </div>
                <div class="preview-content" id="previewContentProdutos">
                    <pre></pre>
                </div>
            </div>
        </div>
        
        <div class="preview-area">
            <div class="preview-header">
                <h4><i class="fas fa-info-circle"></i> Instruções</h4>
            </div>
            <div class="preview-content">
                <p><strong>📋 Produtos sem Venda (Sai23)</strong></p>
                <p>Faça upload do(s) arquivo(s) "Sai23 - Produtos não vendidos" gerado pelo sistema SGE.</p>
                <p>Você pode selecionar múltiplos arquivos de uma vez.</p>
                <p>O sistema identifica automaticamente as lojas e produtos sem movimento.</p>
            </div>
        </div>
    `;
}

function inicializarProdutos() {
    console.log('🚀 inicializarProdutos chamado');
    
    const uploadArea = document.getElementById('uploadAreaProdutos');
    const fileInput = document.getElementById('fileInputProdutos');
    const btnProcessar = document.getElementById('btnProcessarProdutos');
    const statusSpan = document.getElementById('statusUploadProdutos');
    
    if (!uploadArea) {
        console.error('❌ uploadAreaProdutos não encontrado');
        return;
    }
    
    let arquivosSelecionados = [];
    
    function atualizarStatus() {
        if (arquivosSelecionados.length === 0) {
            statusSpan.innerHTML = 'Aguardando arquivo(s)';
            statusSpan.style.color = '';
            btnProcessar.disabled = true;
        } else {
            statusSpan.innerHTML = `📂 ${arquivosSelecionados.length} arquivo(s) selecionado(s)`;
            statusSpan.style.color = '#4caf50';
            btnProcessar.disabled = false;
        }
    }
    
    uploadArea.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            arquivosSelecionados = Array.from(e.target.files);
            produtosArquivosSelecionados = arquivosSelecionados;
            atualizarStatus();
            showToast(`${arquivosSelecionados.length} arquivo(s) selecionado(s)!`, 'success');
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
            arquivosSelecionados = files;
            produtosArquivosSelecionados = arquivosSelecionados;
            atualizarStatus();
            showToast(`${arquivosSelecionados.length} arquivo(s) recebido(s)!`, 'success');
        }
    };
    
    btnProcessar.onclick = async () => {
        if (arquivosSelecionados.length === 0) {
            showToast('Selecione pelo menos um arquivo!', 'error');
            return;
        }
        
        showToast('📊 Processando arquivos...', 'info');
        btnProcessar.disabled = true;
        btnProcessar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processando...';
        
        try {
            const resultado = await produtosProcessor.processarArquivos(arquivosSelecionados, processador.dadosPrecos);
            
            if (!resultado || !resultado.success) {
                throw new Error(resultado?.error || 'Falha no processamento');
            }
            
            produtosDadosAtuais = resultado.dados;
            produtosLojasDisponiveis = resultado.lojas || [];
            
            mostrarResultadoProdutos(resultado);
            showToast(`✅ Processado! ${resultado.dados.length} registros, ${resultado.lojas.length} lojas`, 'success');
            
            const btnFiltrar = document.getElementById('btnFiltrarProdutos');
            const btnExportar = document.getElementById('btnExportarProdutos');
            const btnLimpar = document.getElementById('btnLimparProdutos');
            
            if (btnFiltrar) {
                btnFiltrar.style.display = 'block';
                btnFiltrar.onclick = () => abrirFiltroLojasProdutos();
            }
            if (btnExportar) {
                btnExportar.style.display = 'block';
                btnExportar.onclick = () => exportarProdutosXLSX();
            }
            if (btnLimpar) {
                btnLimpar.style.display = 'block';
                btnLimpar.onclick = () => limparProdutos();
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

function formatarNumeroBR(valor, decimais = 2) {
    if (valor === undefined || valor === null || isNaN(valor)) return '0,00';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

function formatarQuantidadeBR(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return '0';
    if (Number.isInteger(valor)) return valor.toLocaleString('pt-BR');
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function formatarDataBR(data) {
    if (!data) return '';
    const str = String(data);
    if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) return str;
    if (str.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
        const partes = str.split('/');
        return `${partes[0]}/${partes[1]}/20${partes[2]}`;
    }
    return str;
}

function mostrarResultadoProdutos(resultado) {
    console.log('📊 mostrarResultadoProdutos chamado');
    
    const resultadoArea = document.getElementById('resultadoAreaProdutos');
    const cardsDiv = document.getElementById('cardsResultadoProdutos');
    const resumoLojasDiv = document.getElementById('resumoLojasProdutos');
    const previewContent = document.getElementById('previewContentProdutos');
    
    if (resultadoArea) resultadoArea.style.display = 'block';
    
    const stats = resultado.estatisticas || {};
    
    if (cardsDiv) {
        cardsDiv.innerHTML = `
            <div class="card"><div class="card-title">📦 PRODUTOS</div><div class="card-value">${(stats.totalProdutos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🆔 PRODUTOS ÚNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">✅ C/ESTOQUE</div><div class="card-value">${(stats.produtosComEstoque || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">📦 S/ESTOQUE</div><div class="card-value">${(stats.produtosSemEstoque || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">⚠️ PRODUTOS NC</div><div class="card-value">${(stats.produtosNC || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.valorTotal || 0)}</div></div>
            <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(stats.quantidadeTotal || 0)}</div></div>
        `;
    }
    
    // Resumo por Loja
    if (resumoLojasDiv && stats.porLoja) {
        let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Resumo por Loja</h4></div><div class="preview-content"><pre>';
        html += 'LOJA                                PRODUTOS    C/ESTOQUE   S/ESTOQUE   QUANTIDADE        VALOR\n';
        html += '----------------------------------  ----------  ----------  ----------  --------------  ------------------\n';
        
        const lojasOrdenadas = Object.entries(stats.porLoja).sort((a, b) => b[1].valor - a[1].valor);
        for (const [loja, dados] of lojasOrdenadas) {
            const nome = String(loja).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const comEstoque = String(dados.produtosComEstoque || 0).padStart(10);
            const semEstoque = String(dados.produtosSemEstoque || 0).padStart(10);
            const qtd = formatarQuantidadeBR(dados.quantidade || 0).padStart(14);
            const valor = ('R$ ' + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += `${nome}  ${produtos}  ${comEstoque}  ${semEstoque}  ${qtd}  ${valor}\n`;
        }
        html += '</pre></div>';
        resumoLojasDiv.innerHTML = html;
    }
    
    if (previewContent) {
        previewContent.innerHTML = `<pre>${formatarPreviewProdutos((resultado.dados || []).slice(0, 20))}</pre>`;
    }
}

function formatarPreviewProdutos(dados) {
    if (!dados || !dados.length) return 'Nenhum dado';
    let out = 'CÓDIGO    PRODUTO                                    ESTOQUE     PREÇO       DIAS    LOJA\n';
    out += '------    ----------------------------------------  --------  ----------  -----  ------------------\n';
    dados.forEach(p => {
        const codigo = String(p.codigoInt || p.codigo).slice(0, 8).padEnd(8);
        const produto = (p.produto || '').slice(0, 40).padEnd(40);
        const estoque = formatarQuantidadeBR(p.estoque).padStart(8);
        const preco = formatarNumeroBR(p.preco).padStart(10);
        const dias = String(p.dias || 0).padStart(5);
        const loja = (p.loja || '').slice(0, 18).padEnd(18);
        out += `${codigo}  ${produto}  ${estoque}  ${preco}  ${dias}  ${loja}\n`;
    });
    return out;
}

function atualizarPreviewProdutosFiltrado() {
    if (!produtosProcessor || !produtosProcessor.dadosProcessados) return;
    
    const resumo = produtosProcessor.getResumoFiltrado(produtosLojasSelecionadas);
    let dadosFiltrados = produtosDadosAtuais;
    
    if (produtosLojasSelecionadas.length) {
        dadosFiltrados = dadosFiltrados.filter(p => produtosLojasSelecionadas.includes(p.loja));
    }
    
    const previewContent = document.getElementById('previewContentProdutos');
    const filterBadge = document.getElementById('filterBadgeProdutos');
    const cardsDiv = document.getElementById('cardsResultadoProdutos');
    const resumoLojasDiv = document.getElementById('resumoLojasProdutos');
    
    if (!previewContent) return;
    
    if (produtosLojasSelecionadas.length) {
        if (filterBadge) {
            filterBadge.style.display = 'inline-flex';
            filterBadge.innerHTML = `🔽 ${produtosLojasSelecionadas.length} loja(s) selecionada(s)`;
        }
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 PRODUTOS</div><div class="card-value">${(resumo.totalProdutos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS ÚNICOS</div><div class="card-value">${(resumo.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(resumo.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">✅ C/ESTOQUE</div><div class="card-value">${(resumo.produtosComEstoque || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📦 S/ESTOQUE</div><div class="card-value">${(resumo.produtosSemEstoque || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">⚠️ PRODUTOS NC</div><div class="card-value">${(resumo.produtosNC || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(resumo.valorTotal || 0)}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(resumo.quantidadeTotal || 0)}</div></div>
            `;
        }
    } else {
        if (filterBadge) filterBadge.style.display = 'none';
        const stats = produtosProcessor.estatisticas || {};
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 PRODUTOS</div><div class="card-value">${(stats.totalProdutos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🆔 PRODUTOS ÚNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">✅ C/ESTOQUE</div><div class="card-value">${(stats.produtosComEstoque || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📦 S/ESTOQUE</div><div class="card-value">${(stats.produtosSemEstoque || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">⚠️ PRODUTOS NC</div><div class="card-value">${(stats.produtosNC || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.valorTotal || 0)}</div></div>
                <div class="card"><div class="card-title">📊 QUANTIDADE TOTAL</div><div class="card-value">${formatarQuantidadeBR(stats.quantidadeTotal || 0)}</div></div>
            `;
        }
    }
    
    if (previewContent) {
        previewContent.innerHTML = `<pre>${formatarPreviewProdutos((dadosFiltrados || []).slice(0, 20))}</pre>`;
    }
    
    // Atualizar resumo de lojas
    if (resumoLojasDiv && resumo.porLoja) {
        let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Resumo por Loja</h4></div><div class="preview-content"><pre>';
        html += 'LOJA                                PRODUTOS    C/ESTOQUE   S/ESTOQUE   QUANTIDADE        VALOR\n';
        html += '----------------------------------  ----------  ----------  ----------  --------------  ------------------\n';
        
        const lojasOrdenadas = Object.entries(resumo.porLoja).sort((a, b) => b[1].valor - a[1].valor);
        for (const [loja, dados] of lojasOrdenadas) {
            const nome = String(loja).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const comEstoque = String(dados.produtosComEstoque || 0).padStart(10);
            const semEstoque = String(dados.produtosSemEstoque || 0).padStart(10);
            const qtd = formatarQuantidadeBR(dados.quantidade || 0).padStart(14);
            const valor = ('R$ ' + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += `${nome}  ${produtos}  ${comEstoque}  ${semEstoque}  ${qtd}  ${valor}\n`;
        }
        html += '</pre></div>';
        resumoLojasDiv.innerHTML = html;
    }
}

function abrirFiltroLojasProdutos() {
    if (!produtosLojasDisponiveis.length) {
        showToast('Nenhuma loja disponível', 'error');
        return;
    }
    
    const lojasOrdenadas = [...produtosLojasDisponiveis].sort();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:500px; max-width:90%; max-height:80vh; display:flex; flex-direction:column;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-filter"></i> Filtrar por Lojas</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow-y:auto; padding:20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="selectAllLojas" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Selecionar Todos</button>
                    <button id="clearAllLojas" style="flex:1; background:#3d3d3d; border:none; border-radius:8px; color:white; padding:10px; cursor:pointer;">Limpar Todos</button>
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
    
    const lojasDiv = document.getElementById('lojasList');
    lojasDiv.innerHTML = '';
    lojasOrdenadas.forEach(loja => {
        const checked = produtosLojasSelecionadas.includes(loja) ? 'checked' : '';
        lojasDiv.innerHTML += `
            <label style="display:flex; align-items:center; padding:8px; cursor:pointer; border-radius:8px; margin-bottom:4px; background: rgba(255,255,255,0.03);">
                <input type="checkbox" value="${loja.replace(/"/g, '&quot;')}" ${checked} style="margin-right:10px; width:18px; height:18px;">
                <span style="font-size:13px; color:#ffffff;">${loja}</span>
            </label>
        `;
    });
    
    document.getElementById('selectAllLojas').onclick = () => document.querySelectorAll('#lojasList input[type="checkbox"]').forEach(cb => cb.checked = true);
    document.getElementById('clearAllLojas').onclick = () => document.querySelectorAll('#lojasList input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('applyLojasBtn').onclick = () => {
        produtosLojasSelecionadas = Array.from(document.querySelectorAll('#lojasList input[type="checkbox"]:checked')).map(cb => cb.value);
        atualizarPreviewProdutosFiltrado();
        modal.remove();
        showToast(`${produtosLojasSelecionadas.length} loja(s) selecionada(s)`, 'success');
    };
    document.getElementById('cancelLojasBtn').onclick = () => modal.remove();
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function exportarProdutosXLSX() {
    if (!produtosDadosAtuais || !produtosDadosAtuais.length) {
        showToast('Nenhum dado para exportar', 'error');
        return;
    }
    
    if (typeof XLSX === 'undefined') {
        showToast('Biblioteca XLSX não carregada.', 'error');
        return;
    }
    
    try {
        let dados = produtosDadosAtuais;
        if (produtosLojasSelecionadas.length) {
            dados = dados.filter(p => produtosLojasSelecionadas.includes(p.loja));
        }
        
        // Colunas no formato correto
        const planilhaDados = dados.map(p => ({
            'CÓDIGO': p.codigoInt,
            'PRODUTO': p.produto,
            'UNID': p.unidade || '',
            'ESTOQUE': p.estoque,
            'PREÇO': p.preco,
            'TOTAL': p.total,
            'ENTRADA': p.entrada || '',
            'SAIDA': p.saida || '',
            'DIAS': p.dias,
            'LOJA': p.loja,
            'PREÇO VAREJO': p.precoBase,
            'CATEGORIA': p.categoria,
            'GRUPO': p.grupo,
            'SUBGRUPO': p.subgrupo
        }));
        
        const ws = XLSX.utils.json_to_sheet(planilhaDados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produtos_Sem_Venda');
        
        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 10 },  // CÓDIGO
            { wch: 50 },  // PRODUTO
            { wch: 6 },   // UNID
            { wch: 12 },  // ESTOQUE
            { wch: 12 },  // PREÇO
            { wch: 15 },  // TOTAL
            { wch: 12 },  // ENTRADA
            { wch: 12 },  // SAIDA
            { wch: 8 },   // DIAS
            { wch: 30 },  // LOJA
            { wch: 12 },  // PREÇO VAREJO
            { wch: 25 },  // CATEGORIA
            { wch: 25 },  // GRUPO
            { wch: 25 }   // SUBGRUPO
        ];
        
        const nomeArquivo = `Produtos_Sem_Venda_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
        showToast(`✅ Arquivo exportado!`, 'success');
    } catch (error) {
        console.error(error);
        showToast('❌ Erro ao exportar: ' + error.message, 'error');
    }
}

function limparProdutos() {
    produtosDadosAtuais = null;
    produtosLojasDisponiveis = [];
    produtosLojasSelecionadas = [];
    produtosArquivosSelecionados = [];
    
    const resultadoArea = document.getElementById('resultadoAreaProdutos');
    if (resultadoArea) resultadoArea.style.display = 'none';
    
    const btnFiltrar = document.getElementById('btnFiltrarProdutos');
    const btnExportar = document.getElementById('btnExportarProdutos');
    const btnLimpar = document.getElementById('btnLimparProdutos');
    
    if (btnFiltrar) btnFiltrar.style.display = 'none';
    if (btnExportar) btnExportar.style.display = 'none';
    if (btnLimpar) btnLimpar.style.display = 'none';
    
    const statusSpan = document.getElementById('statusUploadProdutos');
    if (statusSpan) statusSpan.innerHTML = 'Aguardando arquivo(s)';
    
    const fileInput = document.getElementById('fileInputProdutos');
    if (fileInput) fileInput.value = '';
    
    showToast('Dados limpos!', 'info');
}