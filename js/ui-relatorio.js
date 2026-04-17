// ========== UI DO RELATÓRIO DE RUPTURA ==========

let relatorioDadosAtuais = null;
let relatorioLojasDisponiveis = [];
let relatorioCategoriasDisponiveis = [];
let relatorioCompradoresDisponiveis = [];
let relatorioLojasSelecionadas = [];
let relatorioCategoriasSelecionadas = [];
let relatorioCompradoresSelecionados = [];
let relatorioArquivoEstoque = null;
let relatorioArquivoCurva = null;
let relatorioProcessado = false;

function renderizarRelatorio() {
    const stats = processador.getEstatisticas() || {};
    return `
        <div class="cards-grid">
            <div class="card">
                <div class="card-title">📦 BASE DE PREÇOS</div>
                <div class="card-value">${(stats.totalProdutos || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">📊 STATUS</div>
                <div class="card-value" id="statusRelatorio">Aguardando arquivos</div>
            </div>
        </div>
        
        <div class="file-area" id="uploadAreaEstoque">
            <i class="fas fa-boxes"></i>
            <p>Clique ou arraste o arquivo de ESTOQUE</p>
            <div class="file-info">Formatos: .xlsx, .xls | Relatorio de Estoque</div>
            <input type="file" id="fileInputEstoque" accept=".xlsx,.xls" style="display: none">
            <div id="nomeArquivoEstoque" style="margin-top: 8px; font-size: 11px; color: #4caf50;"></div>
        </div>
        
        <div class="file-area" id="uploadAreaCurva">
            <i class="fas fa-chart-bar"></i>
            <p>Clique ou arraste o arquivo da CURVA ABC</p>
            <div class="file-info">Formatos: .xlsx, .xls | Curva ABC por Loja</div>
            <input type="file" id="fileInputCurva" accept=".xlsx,.xls" style="display: none">
            <div id="nomeArquivoCurva" style="margin-top: 8px; font-size: 11px; color: #4caf50;"></div>
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" id="btnProcessarRelatorio" disabled>
                <i class="fas fa-cogs"></i> Gerar Relatorio
            </button>
            <button class="btn btn-secondary" id="btnFiltrarRelatorio" style="display: none;">
                <i class="fas fa-filter"></i> Filtrar
            </button>
            <button class="btn btn-danger" id="btnVarrerRelatorio" style="display: none;">
                <i class="fas fa-broom"></i> Varrer
            </button>
            <button class="btn btn-success" id="btnExportarRelatorio" style="display: none;">
                <i class="fas fa-download"></i> Exportar XLSX
            </button>
            <button class="btn btn-danger" id="btnLimparRelatorio" style="display: none;">
                <i class="fas fa-trash"></i> Limpar
            </button>
        </div>
        
        <div id="resultadoAreaRelatorio" style="display: none;">
            <div id="cardsResultadoRelatorio" class="cards-grid"></div>
            <div id="resumoLojasRelatorio" class="preview-area" style="margin-bottom: 15px;"></div>
            <div id="resumoCategoriasRelatorio" class="preview-area" style="margin-bottom: 15px;"></div>
            <div id="resumoCompradoresRelatorio" class="preview-area" style="margin-bottom: 15px;"></div>
            <div class="preview-area">
                <div class="preview-header">
                    <h4><i class="fas fa-table"></i> Relatorio de Ruptura</h4>
                    <span id="filterBadgeRelatorio" class="filter-badge" style="display: none;"></span>
                </div>
                <div class="preview-content" id="previewContentRelatorio">
                    <pre></pre>
                </div>
            </div>
        </div>
        
        <div class="preview-area">
            <div class="preview-header">
                <h4><i class="fas fa-info-circle"></i> Instrucoes</h4>
            </div>
            <div class="preview-content">
                <p><strong>📋 Relatorio de Ruptura</strong></p>
                <p>Este relatorio combina 3 fontes de dados:</p>
                <ol>
                    <li><strong>Estoque</strong> - Arquivo de estoque (obrigatorio)</li>
                    <li><strong>Curva ABC</strong> - Arquivo de vendas (obrigatorio)</li>
                    <li><strong>Media de Vendas</strong> - Arquivo fixo (media_vendas.xlsx)</li>
                </ol>
                <p>O relatorio identifica produtos em RUPTURA (com venda mas sem estoque).</p>
                <p><strong>Funcionalidades:</strong> Filtrar por loja, categoria, comprador, Varrer (remover matriz, NC e zerados), Exportar para Excel.</p>
                <p><strong>Observação:</strong> Os cards mostram PRODUTOS ÚNICOS (códigos distintos), não registros repetidos.</p>
            </div>
        </div>
    `;
}

function inicializarRelatorio() {
    console.log("inicializarRelatorio chamado");
    
    const uploadAreaEstoque = document.getElementById("uploadAreaEstoque");
    const fileInputEstoque = document.getElementById("fileInputEstoque");
    const uploadAreaCurva = document.getElementById("uploadAreaCurva");
    const fileInputCurva = document.getElementById("fileInputCurva");
    const btnProcessar = document.getElementById("btnProcessarRelatorio");
    const nomeEstoqueSpan = document.getElementById("nomeArquivoEstoque");
    const nomeCurvaSpan = document.getElementById("nomeArquivoCurva");
    const statusSpan = document.getElementById("statusRelatorio");
    
    function verificarPronto() {
        const pronto = relatorioArquivoEstoque && relatorioArquivoCurva;
        btnProcessar.disabled = !pronto;
        if (pronto) {
            statusSpan.innerHTML = "✅ Arquivos selecionados. Clique em Gerar Relatorio!";
            statusSpan.style.color = "#4caf50";
        } else {
            statusSpan.innerHTML = "⚠️ Selecione os dois arquivos (Estoque e Curva ABC)";
            statusSpan.style.color = "#ffd43b";
        }
    }
    
    if (uploadAreaEstoque) {
        uploadAreaEstoque.onclick = () => fileInputEstoque.click();
    }
    if (fileInputEstoque) {
        fileInputEstoque.onchange = (e) => {
            if (e.target.files.length > 0) {
                relatorioArquivoEstoque = e.target.files[0];
                nomeEstoqueSpan.innerHTML = "📂 " + relatorioArquivoEstoque.name;
                showToast("Arquivo de Estoque selecionado: " + relatorioArquivoEstoque.name, "success");
                verificarPronto();
            }
        };
    }
    if (uploadAreaEstoque) {
        uploadAreaEstoque.ondragover = (e) => { e.preventDefault(); uploadAreaEstoque.classList.add("drag-over"); };
        uploadAreaEstoque.ondragleave = () => uploadAreaEstoque.classList.remove("drag-over");
        uploadAreaEstoque.ondrop = (e) => {
            e.preventDefault();
            uploadAreaEstoque.classList.remove("drag-over");
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                relatorioArquivoEstoque = files[0];
                nomeEstoqueSpan.innerHTML = "📂 " + relatorioArquivoEstoque.name;
                showToast("Arquivo de Estoque recebido: " + relatorioArquivoEstoque.name, "success");
                verificarPronto();
            }
        };
    }
    
    if (uploadAreaCurva) {
        uploadAreaCurva.onclick = () => fileInputCurva.click();
    }
    if (fileInputCurva) {
        fileInputCurva.onchange = (e) => {
            if (e.target.files.length > 0) {
                relatorioArquivoCurva = e.target.files[0];
                nomeCurvaSpan.innerHTML = "📂 " + relatorioArquivoCurva.name;
                showToast("Arquivo de Curva ABC selecionado: " + relatorioArquivoCurva.name, "success");
                verificarPronto();
            }
        };
    }
    if (uploadAreaCurva) {
        uploadAreaCurva.ondragover = (e) => { e.preventDefault(); uploadAreaCurva.classList.add("drag-over"); };
        uploadAreaCurva.ondragleave = () => uploadAreaCurva.classList.remove("drag-over");
        uploadAreaCurva.ondrop = (e) => {
            e.preventDefault();
            uploadAreaCurva.classList.remove("drag-over");
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                relatorioArquivoCurva = files[0];
                nomeCurvaSpan.innerHTML = "📂 " + relatorioArquivoCurva.name;
                showToast("Arquivo de Curva ABC recebido: " + relatorioArquivoCurva.name, "success");
                verificarPronto();
            }
        };
    }
    
    if (btnProcessar) {
        btnProcessar.onclick = async () => {
            if (!relatorioArquivoEstoque || !relatorioArquivoCurva) {
                showToast("Selecione os dois arquivos!", "error");
                return;
            }
            
            showToast("📊 Gerando relatorio de ruptura...", "info");
            btnProcessar.disabled = true;
            btnProcessar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Gerando...';
            
            try {
                const resultado = await relatorioProcessor.processarRelatorio(
                    relatorioArquivoEstoque,
                    relatorioArquivoCurva,
                    processador.dadosPrecos
                );
                
                if (!resultado || !resultado.success) {
                    throw new Error(resultado?.error || "Falha no processamento");
                }
                
                relatorioDadosAtuais = resultado.dados;
                relatorioLojasDisponiveis = resultado.lojas || [];
                relatorioCategoriasDisponiveis = resultado.categorias || [];
                relatorioCompradoresDisponiveis = resultado.compradores || [];
                relatorioProcessado = true;
                
                mostrarResultadoRelatorio(resultado);
                showToast("✅ Relatorio gerado! " + resultado.estatisticas.totalProdutosUnicos + " produtos unicos, " + resultado.lojas.length + " lojas", "success");
                
                const btnFiltrar = document.getElementById("btnFiltrarRelatorio");
                const btnVarrer = document.getElementById("btnVarrerRelatorio");
                const btnExportar = document.getElementById("btnExportarRelatorio");
                const btnLimpar = document.getElementById("btnLimparRelatorio");
                
                if (btnFiltrar) {
                    btnFiltrar.style.display = "block";
                    btnFiltrar.onclick = () => abrirFiltroRelatorio();
                }
                if (btnVarrer) {
                    btnVarrer.style.display = "block";
                    btnVarrer.onclick = () => confirmarVarredura();
                }
                if (btnExportar) {
                    btnExportar.style.display = "block";
                    btnExportar.onclick = () => exportarRelatorio();
                }
                if (btnLimpar) {
                    btnLimpar.style.display = "block";
                    btnLimpar.onclick = () => limparRelatorio();
                }
                
            } catch (error) {
                console.error("Erro:", error);
                showToast("❌ Erro ao gerar relatorio: " + error.message, "error");
            } finally {
                btnProcessar.disabled = false;
                btnProcessar.innerHTML = '<i class="fas fa-cogs"></i> Gerar Relatorio';
            }
        };
    }
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

function mostrarResultadoRelatorio(resultado) {
    const resultadoArea = document.getElementById("resultadoAreaRelatorio");
    const cardsDiv = document.getElementById("cardsResultadoRelatorio");
    const resumoLojasDiv = document.getElementById("resumoLojasRelatorio");
    const resumoCategoriasDiv = document.getElementById("resumoCategoriasRelatorio");
    const resumoCompradoresDiv = document.getElementById("resumoCompradoresRelatorio");
    const previewContent = document.getElementById("previewContentRelatorio");
    
    if (resultadoArea) resultadoArea.style.display = "block";
    
    const stats = resultado.estatisticas || {};
    
    if (cardsDiv) {
        cardsDiv.innerHTML = `
            <div class="card"><div class="card-title">📦 PRODUTOS UNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">⚠️ % RUPTURA</div><div class="card-value">${(stats.percentualRuptura || 0).toFixed(1)}%</div></div>
            <div class="card"><div class="card-title">⚠️ EM RUPTURA</div><div class="card-value">${(stats.totalRuptura || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">✅ COM ESTOQUE</div><div class="card-value">${(stats.totalComEstoque || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">📦 SEM ESTOQUE</div><div class="card-value">${(stats.totalSemEstoque || 0).toLocaleString()}</div></div>
            <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.valorTotal || 0)}</div></div>
        `;
    }
    
    // Resumo por Loja
    if (resumoLojasDiv && stats.porLoja) {
        let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Ruptura por Loja</h4></div><div class="preview-content"><pre>';
        html += "LOJA                                PRODUTOS    RUPTURA     %       VALOR ESTOQUE\n";
        html += "----------------------------------  ----------  ----------  -----  ------------------\n";
        
        const lojasOrdenadas = Object.entries(stats.porLoja).sort((a, b) => b[1].valor - a[1].valor);
        for (const [loja, dados] of lojasOrdenadas) {
            const nome = String(loja).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const ruptura = String(dados.ruptura || 0).padStart(10);
            const percentual = (dados.percentualRuptura || 0).toFixed(1);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + produtos + "  " + ruptura + "  " + String(percentual).padStart(5) + "%  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoLojasDiv.innerHTML = html;
    }
    
    // Resumo por Categoria
    if (resumoCategoriasDiv && stats.porCategoria) {
        let html = '<div class="preview-header"><h4><i class="fas fa-folder"></i> Ruptura por Categoria</h4></div><div class="preview-content"><pre>';
        html += "CATEGORIA                            PRODUTOS    RUPTURA     %       VALOR ESTOQUE\n";
        html += "----------------------------------  ----------  ----------  -----  ------------------\n";
        
        const categoriasOrdenadas = Object.entries(stats.porCategoria).sort((a, b) => b[1].valor - a[1].valor);
        for (const [categoria, dados] of categoriasOrdenadas) {
            const nome = String(categoria).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const ruptura = String(dados.ruptura || 0).padStart(10);
            const percentual = (dados.percentualRuptura || 0).toFixed(1);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + produtos + "  " + ruptura + "  " + String(percentual).padStart(5) + "%  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoCategoriasDiv.innerHTML = html;
    }
    
    // Resumo por Comprador
    if (resumoCompradoresDiv && stats.porComprador) {
        let html = '<div class="preview-header"><h4><i class="fas fa-users"></i> Ruptura por Comprador</h4></div><div class="preview-content"><pre>';
        html += "COMPRADOR                          PRODUTOS    RUPTURA     %       VALOR ESTOQUE\n";
        html += "----------------------------------  ----------  ----------  -----  ------------------\n";
        
        const compradoresOrdenados = Object.entries(stats.porComprador).sort((a, b) => b[1].valor - a[1].valor);
        for (const [comprador, dados] of compradoresOrdenados) {
            const nome = String(comprador).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const ruptura = String(dados.ruptura || 0).padStart(10);
            const percentual = (dados.percentualRuptura || 0).toFixed(1);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + produtos + "  " + ruptura + "  " + String(percentual).padStart(5) + "%  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoCompradoresDiv.innerHTML = html;
    }
    
    if (previewContent) {
        previewContent.innerHTML = "<pre>" + formatarPreviewRelatorio((resultado.dados || []).slice(0, 20)) + "</pre>";
    }
}

function formatarPreviewRelatorio(dados) {
    if (!dados || !dados.length) return "Nenhum dado";
    let out = "CODIGO    PRODUTO                                    ESTQ      RUPTURA     LOJA                COMPRADOR\n";
    out += "------    ----------------------------------------  --------  ----------  ------------------  -----------------\n";
    dados.slice(0, 20).forEach(p => {
        const codigo = String(p.codigo).slice(0, 8).padEnd(8);
        const produto = (p.produto || "").slice(0, 40).padEnd(40);
        const estq = formatarQuantidadeBR(p.estqLoja).padStart(8);
        const ruptura = (p.ruptura || "OK").padEnd(10);
        const loja = (p.loja || "").slice(0, 18).padEnd(18);
        const comprador = (p.comprador || "").slice(0, 16).padEnd(16);
        out += codigo + "  " + produto + "  " + estq + "  " + ruptura + "  " + loja + "  " + comprador + "\n";
    });
    return out;
}

function atualizarPreviewRelatorioFiltrado() {
    if (!relatorioProcessor || !relatorioProcessor.dadosProcessados) return;
    
    const resumo = relatorioProcessor.getResumoFiltrado(
        relatorioLojasSelecionadas,
        relatorioCategoriasSelecionadas,
        relatorioCompradoresSelecionados
    );
    
    let dadosFiltrados = relatorioDadosAtuais;
    if (relatorioLojasSelecionadas.length) {
        dadosFiltrados = dadosFiltrados.filter(p => relatorioLojasSelecionadas.includes(p.loja));
    }
    if (relatorioCategoriasSelecionadas.length) {
        dadosFiltrados = dadosFiltrados.filter(p => relatorioCategoriasSelecionadas.includes(p.categoria));
    }
    if (relatorioCompradoresSelecionados.length) {
        dadosFiltrados = dadosFiltrados.filter(p => relatorioCompradoresSelecionados.includes(p.comprador));
    }
    
    const previewContent = document.getElementById("previewContentRelatorio");
    const filterBadge = document.getElementById("filterBadgeRelatorio");
    const cardsDiv = document.getElementById("cardsResultadoRelatorio");
    const resumoLojasDiv = document.getElementById("resumoLojasRelatorio");
    const resumoCategoriasDiv = document.getElementById("resumoCategoriasRelatorio");
    const resumoCompradoresDiv = document.getElementById("resumoCompradoresRelatorio");
    
    const temFiltros = relatorioLojasSelecionadas.length > 0 || relatorioCategoriasSelecionadas.length > 0 || relatorioCompradoresSelecionados.length > 0;
    
    if (temFiltros) {
        if (filterBadge) {
            filterBadge.style.display = "inline-flex";
            const filtros = [];
            if (relatorioLojasSelecionadas.length) filtros.push(relatorioLojasSelecionadas.length + " loja(s)");
            if (relatorioCategoriasSelecionadas.length) filtros.push(relatorioCategoriasSelecionadas.length + " categoria(s)");
            if (relatorioCompradoresSelecionados.length) filtros.push(relatorioCompradoresSelecionados.length + " comprador(es)");
            filterBadge.innerHTML = "🔽 " + filtros.join(", ");
        }
        
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 PRODUTOS UNICOS</div><div class="card-value">${(resumo.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(resumo.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">⚠️ % RUPTURA</div><div class="card-value">${(resumo.totalProdutosUnicos > 0 ? ((resumo.totalRuptura / resumo.totalProdutosUnicos) * 100).toFixed(1) : 0)}%</div></div>
                <div class="card"><div class="card-title">⚠️ EM RUPTURA</div><div class="card-value">${(resumo.totalRuptura || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(resumo.valorTotal || 0)}</div></div>
            `;
        }
    } else {
        if (filterBadge) filterBadge.style.display = "none";
        const stats = relatorioProcessor.estatisticas || {};
        if (cardsDiv) {
            cardsDiv.innerHTML = `
                <div class="card"><div class="card-title">📦 PRODUTOS UNICOS</div><div class="card-value">${(stats.totalProdutosUnicos || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">🏪 LOJAS</div><div class="card-value">${(stats.totalLojas || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">⚠️ % RUPTURA</div><div class="card-value">${(stats.percentualRuptura || 0).toFixed(1)}%</div></div>
                <div class="card"><div class="card-title">⚠️ EM RUPTURA</div><div class="card-value">${(stats.totalRuptura || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">✅ COM ESTOQUE</div><div class="card-value">${(stats.totalComEstoque || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">📦 SEM ESTOQUE</div><div class="card-value">${(stats.totalSemEstoque || 0).toLocaleString()}</div></div>
                <div class="card"><div class="card-title">💰 VALOR TOTAL</div><div class="card-value">R$ ${formatarNumeroBR(stats.valorTotal || 0)}</div></div>
            `;
        }
    }
    
    if (previewContent) {
        previewContent.innerHTML = "<pre>" + formatarPreviewRelatorio((dadosFiltrados || []).slice(0, 20)) + "</pre>";
    }
    
    // Atualizar resumo de lojas
    if (resumoLojasDiv && resumo.porLoja) {
        let html = '<div class="preview-header"><h4><i class="fas fa-store"></i> Ruptura por Loja</h4></div><div class="preview-content"><pre>';
        html += "LOJA                                PRODUTOS    RUPTURA     %       VALOR ESTOQUE\n";
        html += "----------------------------------  ----------  ----------  -----  ------------------\n";
        
        const lojasOrdenadas = Object.entries(resumo.porLoja).sort((a, b) => b[1].valor - a[1].valor);
        for (const [loja, dados] of lojasOrdenadas) {
            const nome = String(loja).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const ruptura = String(dados.ruptura || 0).padStart(10);
            const percentual = (dados.percentualRuptura || 0).toFixed(1);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + produtos + "  " + ruptura + "  " + String(percentual).padStart(5) + "%  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoLojasDiv.innerHTML = html;
    }
    
    // Atualizar resumo de categorias
    if (resumoCategoriasDiv && resumo.porCategoria) {
        let html = '<div class="preview-header"><h4><i class="fas fa-folder"></i> Ruptura por Categoria</h4></div><div class="preview-content"><pre>';
        html += "CATEGORIA                            PRODUTOS    RUPTURA     %       VALOR ESTOQUE\n";
        html += "----------------------------------  ----------  ----------  -----  ------------------\n";
        
        const categoriasOrdenadas = Object.entries(resumo.porCategoria).sort((a, b) => b[1].valor - a[1].valor);
        for (const [categoria, dados] of categoriasOrdenadas) {
            const nome = String(categoria).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const ruptura = String(dados.ruptura || 0).padStart(10);
            const percentual = (dados.percentualRuptura || 0).toFixed(1);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + produtos + "  " + ruptura + "  " + String(percentual).padStart(5) + "%  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoCategoriasDiv.innerHTML = html;
    }
    
    // Atualizar resumo de compradores
    if (resumoCompradoresDiv && resumo.porComprador) {
        let html = '<div class="preview-header"><h4><i class="fas fa-users"></i> Ruptura por Comprador</h4></div><div class="preview-content"><pre>';
        html += "COMPRADOR                          PRODUTOS    RUPTURA     %       VALOR ESTOQUE\n";
        html += "----------------------------------  ----------  ----------  -----  ------------------\n";
        
        const compradoresOrdenadas = Object.entries(resumo.porComprador).sort((a, b) => b[1].valor - a[1].valor);
        for (const [comprador, dados] of compradoresOrdenadas) {
            const nome = String(comprador).slice(0, 34).padEnd(34);
            const produtos = String(dados.produtos || 0).padStart(10);
            const ruptura = String(dados.ruptura || 0).padStart(10);
            const percentual = (dados.percentualRuptura || 0).toFixed(1);
            const valor = ("R$ " + formatarNumeroBR(dados.valor || 0)).padStart(18);
            html += nome + "  " + produtos + "  " + ruptura + "  " + String(percentual).padStart(5) + "%  " + valor + "\n";
        }
        html += "</pre></div>";
        resumoCompradoresDiv.innerHTML = html;
    }
}

function abrirFiltroRelatorio() {
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;";
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:600px; max-width:90%; max-height:85vh; display:flex; flex-direction:column;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-filter"></i> Filtrar Relatorio</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="flex:1; overflow-y:auto; padding:20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="color:#ffd43b; margin-bottom: 10px;">🏪 LOJAS</h4>
                    <div id="filtroLojasList" style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px;"></div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="color:#ffd43b; margin-bottom: 10px;">📁 CATEGORIAS</h4>
                    <div id="filtroCategoriasList" style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px;"></div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4 style="color:#ffd43b; margin-bottom: 10px;">👥 COMPRADORES</h4>
                    <div id="filtroCompradoresList" style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px;"></div>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #404040;">
                <button id="limparFiltrosBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Limpar Filtros</button>
                <button id="cancelFiltroBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Cancelar</button>
                <button id="aplicarFiltroBtn" style="flex:1; background:#8b0000; border:none; border-radius:8px; color:white; font-weight:bold; padding:12px; cursor:pointer;">Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Preencher lojas
    const lojasDiv = document.getElementById("filtroLojasList");
    relatorioLojasDisponiveis.sort().forEach(loja => {
        const checked = relatorioLojasSelecionadas.includes(loja) ? "checked" : "";
        lojasDiv.innerHTML += `
            <label style="display:flex; align-items:center; padding:6px; cursor:pointer; border-radius:6px; margin-bottom:2px;">
                <input type="checkbox" value="${loja.replace(/"/g, "&quot;")}" ${checked} style="margin-right:10px;">
                <span style="font-size:12px;">${loja}</span>
            </label>
        `;
    });
    
    // Preencher categorias
    const categoriasDiv = document.getElementById("filtroCategoriasList");
    relatorioCategoriasDisponiveis.sort().forEach(categoria => {
        const checked = relatorioCategoriasSelecionadas.includes(categoria) ? "checked" : "";
        categoriasDiv.innerHTML += `
            <label style="display:flex; align-items:center; padding:6px; cursor:pointer; border-radius:6px; margin-bottom:2px;">
                <input type="checkbox" value="${categoria.replace(/"/g, "&quot;")}" ${checked} style="margin-right:10px;">
                <span style="font-size:12px;">${categoria}</span>
            </label>
        `;
    });
    
    // Preencher compradores
    const compradoresDiv = document.getElementById("filtroCompradoresList");
    relatorioCompradoresDisponiveis.sort().forEach(comprador => {
        const checked = relatorioCompradoresSelecionados.includes(comprador) ? "checked" : "";
        compradoresDiv.innerHTML += `
            <label style="display:flex; align-items:center; padding:6px; cursor:pointer; border-radius:6px; margin-bottom:2px;">
                <input type="checkbox" value="${comprador.replace(/"/g, "&quot;")}" ${checked} style="margin-right:10px;">
                <span style="font-size:12px;">${comprador}</span>
            </label>
        `;
    });
    
    const closeModal = () => modal.remove();
    modal.querySelector(".modal-close").onclick = closeModal;
    document.getElementById("cancelFiltroBtn").onclick = closeModal;
    
    document.getElementById("limparFiltrosBtn").onclick = () => {
        document.querySelectorAll("#filtroLojasList input, #filtroCategoriasList input, #filtroCompradoresList input").forEach(cb => cb.checked = false);
    };
    
    document.getElementById("aplicarFiltroBtn").onclick = () => {
        relatorioLojasSelecionadas = Array.from(document.querySelectorAll("#filtroLojasList input:checked")).map(cb => cb.value);
        relatorioCategoriasSelecionadas = Array.from(document.querySelectorAll("#filtroCategoriasList input:checked")).map(cb => cb.value);
        relatorioCompradoresSelecionados = Array.from(document.querySelectorAll("#filtroCompradoresList input:checked")).map(cb => cb.value);
        atualizarPreviewRelatorioFiltrado();
        closeModal();
        let msg = "";
        if (relatorioLojasSelecionadas.length) msg += relatorioLojasSelecionadas.length + " loja(s) ";
        if (relatorioCategoriasSelecionadas.length) msg += relatorioCategoriasSelecionadas.length + " categoria(s) ";
        if (relatorioCompradoresSelecionados.length) msg += relatorioCompradoresSelecionados.length + " comprador(es) ";
        showToast("✅ Filtro aplicado: " + msg, "success");
    };
    
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function confirmarVarredura() {
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2000; display:flex; align-items:center; justify-content:center;";
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#2d2d2d; border-radius:16px; width:450px; max-width:90%;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #404040;">
                <h3 style="color:#ffffff; margin:0;"><i class="fas fa-broom"></i> Confirmar Varredura</h3>
                <button class="modal-close" style="background:transparent; border:none; color:#888; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <p>Esta operacao ira remover:</p>
                <ul>
                    <li>Linhas da loja "COMCARNE MATRIZ SAO LUIS"</li>
                    <li>Produtos que comecam com "NC"</li>
                    <li>Produtos com ESTQ LOJA = 0, VENDAS = 0 e MEDIA = 0</li>
                </ul>
                <p><strong>Deseja continuar?</strong></p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="cancelBtn" style="flex:1; background:#666666; border:none; border-radius:8px; color:white; font-weight:bold; padding:10px; cursor:pointer;">Cancelar</button>
                    <button id="confirmBtn" style="flex:1; background:#8b0000; border:none; border-radius:8px; color:white; font-weight:bold; padding:10px; cursor:pointer;">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => modal.remove();
    modal.querySelector(".modal-close").onclick = closeModal;
    document.getElementById("cancelBtn").onclick = closeModal;
    
    document.getElementById("confirmBtn").onclick = () => {
        const dadosVarridos = relatorioProcessor.varrerRelatorio();
        relatorioDadosAtuais = dadosVarridos;
        mostrarResultadoRelatorio({ 
            dados: dadosVarridos, 
            estatisticas: relatorioProcessor.estatisticas, 
            lojas: relatorioProcessor.lojas 
        });
        closeModal();
        showToast("✅ Varredura concluida!", "success");
    };
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function exportarRelatorio() {
    if (!relatorioDadosAtuais || !relatorioDadosAtuais.length) {
        showToast("Nenhum dado para exportar", "error");
        return;
    }
    
    if (typeof XLSX === "undefined") {
        showToast("Biblioteca XLSX nao carregada.", "error");
        return;
    }
    
    try {
        const workbook = relatorioProcessor.exportarParaExcel(
            relatorioLojasSelecionadas.length ? relatorioLojasSelecionadas : null,
            relatorioCategoriasSelecionadas.length ? relatorioCategoriasSelecionadas : null,
            relatorioCompradoresSelecionados.length ? relatorioCompradoresSelecionados : null
        );
        const nomeArquivo = "Relatorio_Ruptura_" + new Date().toISOString().slice(0,19).replace(/:/g, "-") + ".xlsx";
        XLSX.writeFile(workbook, nomeArquivo);
        showToast("✅ Arquivo exportado!", "success");
    } catch (error) {
        console.error(error);
        showToast("❌ Erro ao exportar: " + error.message, "error");
    }
}

function limparRelatorio() {
    relatorioDadosAtuais = null;
    relatorioLojasDisponiveis = [];
    relatorioCategoriasDisponiveis = [];
    relatorioCompradoresDisponiveis = [];
    relatorioLojasSelecionadas = [];
    relatorioCategoriasSelecionadas = [];
    relatorioCompradoresSelecionados = [];
    relatorioArquivoEstoque = null;
    relatorioArquivoCurva = null;
    relatorioProcessado = false;
    
    const resultadoArea = document.getElementById("resultadoAreaRelatorio");
    if (resultadoArea) resultadoArea.style.display = "none";
    
    const btnFiltrar = document.getElementById("btnFiltrarRelatorio");
    const btnVarrer = document.getElementById("btnVarrerRelatorio");
    const btnExportar = document.getElementById("btnExportarRelatorio");
    const btnLimpar = document.getElementById("btnLimparRelatorio");
    
    if (btnFiltrar) btnFiltrar.style.display = "none";
    if (btnVarrer) btnVarrer.style.display = "none";
    if (btnExportar) btnExportar.style.display = "none";
    if (btnLimpar) btnLimpar.style.display = "none";
    
    const nomeEstoqueSpan = document.getElementById("nomeArquivoEstoque");
    const nomeCurvaSpan = document.getElementById("nomeArquivoCurva");
    const statusSpan = document.getElementById("statusRelatorio");
    
    if (nomeEstoqueSpan) nomeEstoqueSpan.innerHTML = "";
    if (nomeCurvaSpan) nomeCurvaSpan.innerHTML = "";
    if (statusSpan) {
        statusSpan.innerHTML = "Aguardando arquivos";
        statusSpan.style.color = "";
    }
    
    const fileInputEstoque = document.getElementById("fileInputEstoque");
    const fileInputCurva = document.getElementById("fileInputCurva");
    if (fileInputEstoque) fileInputEstoque.value = "";
    if (fileInputCurva) fileInputCurva.value = "";
    
    showToast("Dados limpos!", "info");
}
