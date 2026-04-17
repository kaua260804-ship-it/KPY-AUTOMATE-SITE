// ========== PROCESSADOR DA CURVA ABC - VERSÃO DE DEPURAÇÃO ==========

class CurvaABCProcessor {
    constructor() {
        this.dadosProcessados = null;
        this.lojas = [];
        this.estatisticas = {};
        console.log('🔧 CurvaABCProcessor inicializado');
    }

    async processarArquivo(file, basePrecos) {
        console.log('📊 processarArquivo iniciado para:', file.name);
        console.log('📊 basePrecos:', basePrecos?.length || 0, 'registros');
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    console.log('📖 Arquivo lido, tamanho:', e.target.result.byteLength);
                    const data = new Uint8Array(e.target.result);
                    const fileName = file.name.toLowerCase();
                    
                    let workbook;
                    if (fileName.endsWith('.xls')) {
                        workbook = XLSX.read(data, { type: 'array', bookType: 'xls' });
                    } else {
                        workbook = XLSX.read(data, { type: 'array' });
                    }
                    
                    console.log('📚 Workbook lido, sheets:', workbook.SheetNames);
                    const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
                    const dadosRaw = XLSX.utils.sheet_to_json(primeiraPlanilha, { header: 1, defval: "" });
                    
                    console.log('📊 Planilha carregada:', dadosRaw.length, 'linhas');
                    console.log('Primeiras 5 linhas:', dadosRaw.slice(0, 5));
                    
                    // Processar dados
                    const resultado = this.processarDados(dadosRaw, basePrecos);
                    console.log('✅ processarDados concluído, resultado:', {
                        success: resultado.success,
                        dadosLength: resultado.dados?.length,
                        lojasLength: resultado.lojas?.length
                    });
                    
                    resolve(resultado);
                } catch (error) {
                    console.error('❌ Erro no processamento:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                console.error('❌ Erro na leitura do arquivo');
                reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    processarDados(dadosRaw, basePrecos) {
        console.log('📊 processarDados iniciado');
        
        // Encontrar cabeçalho
        let linhaCabecalho = -1;
        let colunas = { codigo: -1, produto: -1, qtd: -1, total: -1, loja: -1 };
        
        for (let i = 0; i < Math.min(30, dadosRaw.length); i++) {
            const linha = dadosRaw[i];
            if (!linha || !Array.isArray(linha)) continue;
            
            for (let j = 0; j < linha.length; j++) {
                const celula = String(linha[j] || '').toLowerCase().trim();
                if (celula === 'código' || celula === 'codigo') {
                    linhaCabecalho = i;
                    colunas.codigo = j;
                    console.log(`  → Coluna "Código" na posição ${j}, linha ${i}`);
                }
                if (celula === 'produto' || celula === 'descrição') {
                    colunas.produto = j;
                    console.log(`  → Coluna "Produto" na posição ${j}`);
                }
                if (celula === 'qtd' || celula === 'quantidade') {
                    colunas.qtd = j;
                    console.log(`  → Coluna "Qtd" na posição ${j}`);
                }
                if (celula === 'total r$' || celula === 'total') {
                    colunas.total = j;
                    console.log(`  → Coluna "Total" na posição ${j}`);
                }
            }
            
            if (linhaCabecalho !== -1 && colunas.codigo !== -1) {
                console.log(`✅ Cabeçalho encontrado na linha ${linhaCabecalho}`);
                break;
            }
        }
        
        // Fallback para linha 4
        if (linhaCabecalho === -1) {
            linhaCabecalho = 4;
            colunas = { codigo: 0, produto: 1, qtd: 4, total: 5, loja: -1 };
            console.log(`⚠️ Usando cabeçalho padrão na linha ${linhaCabecalho}`);
        }
        
        // Extrair dados
        const produtos = [];
        let lojaAtual = '';
        
        for (let i = linhaCabecalho + 1; i < dadosRaw.length; i++) {
            const linha = dadosRaw[i];
            if (!linha || !Array.isArray(linha) || linha.length === 0) continue;
            
            const primeiraCelula = String(linha[0] || '').trim();
            
            // Detectar loja
            if (primeiraCelula.toLowerCase().includes('loja:')) {
                lojaAtual = linha[1] ? linha[1].toString().trim() : '';
                if (linha[2]) lojaAtual = linha[2].toString().trim();
                console.log(`  🏪 Loja: ${lojaAtual}`);
                continue;
            }
            
            // Obter código
            let codigo = '';
            if (colunas.codigo !== -1 && linha[colunas.codigo]) {
                codigo = this.limparCodigo(linha[colunas.codigo]);
            } else if (linha[0]) {
                codigo = this.limparCodigo(linha[0]);
            }
            
            if (!codigo || isNaN(parseInt(codigo))) continue;
            
            // Obter produto
            let produto = '';
            if (colunas.produto !== -1 && linha[colunas.produto]) {
                produto = linha[colunas.produto].toString().trim();
            } else if (linha[1]) {
                produto = linha[1].toString().trim();
            }
            
            // Obter quantidade
            let qtd = 0;
            if (colunas.qtd !== -1 && linha[colunas.qtd]) {
                qtd = this.converterNumero(linha[colunas.qtd]);
            }
            
            // Obter total
            let total = 0;
            if (colunas.total !== -1 && linha[colunas.total]) {
                total = this.converterNumero(linha[colunas.total]);
            } else if (colunas.qtd !== -1 && colunas.qtd + 1 < linha.length) {
                total = this.converterNumero(linha[colunas.qtd + 1]);
            }
            
            if (qtd === 0 && total === 0) continue;
            
            // Buscar na base
            const baseInfo = this.buscarNaBase(codigo, basePrecos);
            
            produtos.push({
                codigo: codigo,
                codigoInt: parseInt(codigo),
                produto: produto.substring(0, 100),
                qtd: qtd,
                total: total,
                loja: lojaAtual || 'LOJA NÃO IDENTIFICADA',
                precoBase: baseInfo.preco,
                categoria: baseInfo.categoria,
                grupo: baseInfo.grupo,
                precoMedio: qtd > 0 ? total / qtd : 0
            });
        }
        
        console.log(`📦 Total de produtos extraídos: ${produtos.length}`);
        
        if (produtos.length === 0) {
            console.error('❌ Nenhum produto encontrado');
            return { success: false, error: 'Nenhum produto encontrado', dados: [], lojas: [], estatisticas: {} };
        }
        
        this.dadosProcessados = produtos;
        this.lojas = [...new Set(produtos.map(p => p.loja))];
        
        const quantidadeTotal = produtos.reduce((s, p) => s + p.qtd, 0);
        const faturamentoTotal = produtos.reduce((s, p) => s + p.total, 0);
        const produtosComPreco = produtos.filter(p => p.precoBase > 0).length;
        
        const porLoja = {};
        for (const loja of this.lojas) {
            const pl = produtos.filter(p => p.loja === loja);
            porLoja[loja] = {
                quantidade: pl.reduce((s, p) => s + p.qtd, 0),
                faturamento: pl.reduce((s, p) => s + p.total, 0),
                produtos: pl.length
            };
        }
        
        this.estatisticas = {
            totalRegistros: produtos.length,
            totalProdutosUnicos: [...new Set(produtos.map(p => p.codigo))].length,
            totalLojas: this.lojas.length,
            quantidadeTotal: quantidadeTotal,
            faturamentoTotal: faturamentoTotal,
            produtosComPreco: produtosComPreco,
            produtosSemPreco: produtos.length - produtosComPreco,
            porLoja: porLoja
        };
        
        console.log(`✅ Processado: ${produtos.length} registros, ${this.lojas.length} lojas`);
        console.log('📊 Estatísticas:', this.estatisticas);
        
        return {
            success: true,
            dados: produtos,
            estatisticas: this.estatisticas,
            lojas: this.lojas
        };
    }

    limparCodigo(valor) {
        if (!valor) return '';
        let codigo = String(valor).trim();
        codigo = codigo.replace(/^0+/, '');
        const match = codigo.match(/^\d+/);
        return match ? match[0] : '';
    }

    converterNumero(valor) {
        if (valor === undefined || valor === null) return 0;
        if (typeof valor === 'number') return valor;
        let str = String(valor).trim();
        str = str.replace(/\./g, '').replace(',', '.');
        str = str.replace(/[^0-9.-]/g, '');
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    buscarNaBase(codigo, basePrecos) {
        if (!basePrecos || basePrecos.length === 0) {
            return { preco: 0, categoria: 'NÃO MAPEADO', grupo: 'NÃO MAPEADO' };
        }
        const encontrado = basePrecos.find(p => p.codigo === codigo || p.codigoInt === parseInt(codigo));
        if (encontrado) {
            return {
                preco: encontrado.preco || 0,
                categoria: encontrado.categoria || 'NÃO MAPEADO',
                grupo: encontrado.grupo || 'NÃO MAPEADO'
            };
        }
        return { preco: 0, categoria: 'NÃO MAPEADO', grupo: 'NÃO MAPEADO' };
    }

    filtrarPorLojas(lojasSelecionadas) {
        if (!this.dadosProcessados) return [];
        if (!lojasSelecionadas || lojasSelecionadas.length === 0) return this.dadosProcessados;
        return this.dadosProcessados.filter(p => lojasSelecionadas.includes(p.loja));
    }

    getResumoFiltrado(lojasSelecionadas) {
        const dadosFiltrados = this.filtrarPorLojas(lojasSelecionadas);
        const lojas = [...new Set(dadosFiltrados.map(p => p.loja))];
        const porLoja = {};
        for (const loja of lojas) {
            const pl = dadosFiltrados.filter(p => p.loja === loja);
            porLoja[loja] = {
                quantidade: pl.reduce((s, p) => s + p.qtd, 0),
                faturamento: pl.reduce((s, p) => s + p.total, 0),
                produtos: pl.length
            };
        }
        return {
            totalRegistros: dadosFiltrados.length,
            totalProdutosUnicos: [...new Set(dadosFiltrados.map(p => p.codigo))].length,
            totalLojas: lojas.length,
            quantidadeTotal: dadosFiltrados.reduce((s, p) => s + p.qtd, 0),
            faturamentoTotal: dadosFiltrados.reduce((s, p) => s + p.total, 0),
            porLoja: porLoja
        };
    }
}

const curvaProcessor = new CurvaABCProcessor();
console.log('✅ CurvaABCProcessor carregado e instanciado');