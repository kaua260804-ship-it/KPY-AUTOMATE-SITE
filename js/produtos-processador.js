// ========== PROCESSADOR DE PRODUTOS SEM VENDA (SAI23) - BASEADO NO CÓDIGO ORIGINAL ==========

class ProdutosProcessor {
    constructor() {
        this.dadosProcessados = null;
        this.lojas = [];
        this.estatisticas = {};
        console.log('🔧 ProdutosProcessor inicializado');
    }

    async processarArquivos(files, basePrecos) {
        console.log('📊 processarArquivos Produtos:', files.length, 'arquivos');
        
        const todosProdutos = [];
        this.arquivosProcessados = [];
        
        for (let idx = 0; idx < files.length; idx++) {
            const file = files[idx];
            console.log(`📂 Processando arquivo ${idx + 1}: ${file.name}`);
            
            try {
                const dfProcessado = await this.processarArquivo(file, basePrecos);
                if (dfProcessado && dfProcessado.length > 0) {
                    todosProdutos.push(...dfProcessado);
                    this.arquivosProcessados.push(file.name);
                    console.log(`  ✅ Processado: ${dfProcessado.length} linhas`);
                }
            } catch (error) {
                console.error(`  ❌ Erro no arquivo ${file.name}:`, error);
            }
        }
        
        if (todosProdutos.length === 0) {
            return { success: false, error: 'Nenhum arquivo válido processado!', dados: [], lojas: [], estatisticas: {} };
        }
        
        // Ordenar por código e loja
        todosProdutos.sort((a, b) => {
            if (a.loja !== b.loja) return a.loja.localeCompare(b.loja);
            return a.codigoInt - b.codigoInt;
        });
        
        this.dadosProcessados = todosProdutos;
        this.lojas = [...new Set(todosProdutos.map(p => p.loja))];
        
        const estatisticas = this.calcularEstatisticas(todosProdutos);
        
        console.log(`✅ Total combinado: ${todosProdutos.length} linhas`);
        console.log(`🏪 Lojas encontradas: ${this.lojas.length}`);
        
        return {
            success: true,
            dados: todosProdutos,
            estatisticas: estatisticas,
            lojas: this.lojas
        };
    }

    async processarArquivo(file, basePrecos) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const fileName = file.name.toLowerCase();
                    
                    let workbook;
                    if (fileName.endsWith('.xls')) {
                        workbook = XLSX.read(data, { type: 'array', bookType: 'xls' });
                    } else {
                        workbook = XLSX.read(data, { type: 'array' });
                    }
                    
                    const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
                    const dadosRaw = XLSX.utils.sheet_to_json(primeiraPlanilha, { header: 1, defval: "" });
                    
                    const resultado = this.processarDadosArquivo(dadosRaw, basePrecos);
                    resolve(resultado);
                } catch (error) {
                    console.error('❌ Erro:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    processarDadosArquivo(dadosRaw, basePrecos) {
        console.log('📊 Processando arquivo Sai23...');
        
        // ===== EXTRAIR TODAS AS LOJAS =====
        const lojasEncontradas = [];
        
        console.log('  🔍 Buscando lojas no arquivo...');
        for (let i = 0; i < dadosRaw.length; i++) {
            const linha = dadosRaw[i];
            if (!linha || !Array.isArray(linha)) continue;
            
            const primeiraCelula = String(linha[0] || '').trim();
            
            // Procurar padrão "EMPRESA: XXX - NOME DA LOJA"
            const match = primeiraCelula.match(/EMPRESA:\s*\d+\s*-\s*(.+)/i);
            if (match) {
                const loja = match[1].trim();
                lojasEncontradas.push({ linha: i, nome: loja });
                console.log(`    ✅ Loja encontrada na linha ${i}: '${loja}'`);
            }
        }
        
        if (lojasEncontradas.length === 0) {
            console.log('  ❌ Nenhuma loja encontrada no arquivo!');
            return [];
        }
        
        console.log(`  📊 Total de lojas encontradas: ${lojasEncontradas.length}`);
        
        // ===== ENCONTRAR CABEÇALHO =====
        let linhaCabecalho = -1;
        for (let i = 0; i < Math.min(20, dadosRaw.length); i++) {
            const linha = dadosRaw[i];
            if (!linha || !Array.isArray(linha)) continue;
            
            let linhaTexto = '';
            for (let j = 0; j < Math.min(8, linha.length); j++) {
                linhaTexto += String(linha[j] || '') + ' ';
            }
            
            if (linhaTexto.includes('Código') && linhaTexto.includes('Produto') && linhaTexto.includes('Estoque')) {
                linhaCabecalho = i;
                console.log(`  📋 Cabeçalho encontrado na linha ${i}`);
                break;
            }
        }
        
        if (linhaCabecalho === -1) {
            console.log('  ❌ Cabeçalho não encontrado');
            return [];
        }
        
        // ===== PROCESSAR CADA BLOCO DE LOJA =====
        const todosDados = [];
        
        for (let idx = 0; idx < lojasEncontradas.length; idx++) {
            const { linha: linhaLoja, nome: nomeLojaAtual } = lojasEncontradas[idx];
            console.log(`\n  📦 Processando loja: ${nomeLojaAtual}`);
            
            // Determinar onde começa e termina esta loja
            const inicioBloco = Math.max(linhaLoja, linhaCabecalho);
            let fimBloco = dadosRaw.length;
            
            if (idx < lojasEncontradas.length - 1) {
                fimBloco = lojasEncontradas[idx + 1].linha;
            }
            
            // Encontrar o cabeçalho mais próximo após a loja
            let cabecalhoBloco = linhaCabecalho;
            for (let i = inicioBloco; i < Math.min(inicioBloco + 10, fimBloco); i++) {
                const linha = dadosRaw[i];
                if (!linha || !Array.isArray(linha)) continue;
                
                let linhaTexto = '';
                for (let j = 0; j < Math.min(8, linha.length); j++) {
                    linhaTexto += String(linha[j] || '') + ' ';
                }
                
                if (linhaTexto.includes('Código') && linhaTexto.includes('Produto')) {
                    cabecalhoBloco = i;
                    break;
                }
            }
            
            // Extrair dados deste bloco
            const dadosBloco = [];
            
            for (let i = cabecalhoBloco + 1; i < fimBloco; i++) {
                const linha = dadosRaw[i];
                if (!linha || !Array.isArray(linha)) continue;
                
                // Verificar se tem "Itens:" (fim da tabela)
                const primeiraColuna = String(linha[0] || '').trim();
                if (primeiraColuna.toLowerCase().includes('itens:')) {
                    break;
                }
                
                // Verificar se tem código numérico
                let codigoVal = null;
                for (const col of [0, 1]) {
                    if (col < linha.length && linha[col] !== undefined && linha[col] !== '') {
                        const val = String(linha[col]).trim();
                        if (val && val[0] >= '0' && val[0] <= '9') {
                            codigoVal = val;
                            break;
                        }
                    }
                }
                
                if (!codigoVal) continue;
                
                // Extrair valores
                const linhaDados = [];
                
                // Código (remover zeros à esquerda)
                const codigo = codigoVal.replace(/^0+/, '');
                linhaDados.push(codigo);
                
                // Produto - procurar nas colunas seguintes
                let produtoEncontrado = false;
                let posProduto = 1;
                for (let col = 1; col < Math.min(5, linha.length); col++) {
                    if (linha[col] !== undefined && linha[col] !== '') {
                        const val = String(linha[col]).trim();
                        // Produto geralmente é texto, não número e não é unidade
                        if (val && !(val[0] >= '0' && val[0] <= '9') && !['KG', 'UN', '0'].includes(val) && val.length > 1) {
                            linhaDados.push(val);
                            produtoEncontrado = true;
                            posProduto = col;
                            break;
                        }
                    }
                }
                
                if (!produtoEncontrado) {
                    linhaDados.push('');
                    posProduto = 1;
                }
                
                // Unidade - procurar KG ou UN
                let unidadeEncontrada = false;
                let posUnidade = posProduto + 1;
                for (let col = posProduto + 1; col < posProduto + 3; col++) {
                    if (col < linha.length && linha[col] !== undefined && linha[col] !== '') {
                        const val = String(linha[col]).trim();
                        if (val === 'KG' || val === 'UN') {
                            linhaDados.push(val);
                            unidadeEncontrada = true;
                            posUnidade = col;
                            break;
                        }
                    }
                }
                
                if (!unidadeEncontrada) {
                    linhaDados.push('');
                    posUnidade = posProduto + 1;
                }
                
                // Estoque (geralmente 1 coluna após unidade)
                if (posUnidade + 1 < linha.length && linha[posUnidade + 1] !== undefined && linha[posUnidade + 1] !== '') {
                    linhaDados.push(String(linha[posUnidade + 1]).trim());
                } else {
                    linhaDados.push('0');
                }
                
                // Preço
                if (posUnidade + 2 < linha.length && linha[posUnidade + 2] !== undefined && linha[posUnidade + 2] !== '') {
                    linhaDados.push(String(linha[posUnidade + 2]).trim());
                } else {
                    linhaDados.push('0');
                }
                
                // Total
                if (posUnidade + 3 < linha.length && linha[posUnidade + 3] !== undefined && linha[posUnidade + 3] !== '') {
                    linhaDados.push(String(linha[posUnidade + 3]).trim());
                } else {
                    linhaDados.push('0');
                }
                
                // Entrada (data)
                if (posUnidade + 4 < linha.length && linha[posUnidade + 4] !== undefined && linha[posUnidade + 4] !== '') {
                    linhaDados.push(String(linha[posUnidade + 4]).trim());
                } else {
                    linhaDados.push('');
                }
                
                // Saída (data)
                if (posUnidade + 5 < linha.length && linha[posUnidade + 5] !== undefined && linha[posUnidade + 5] !== '') {
                    linhaDados.push(String(linha[posUnidade + 5]).trim());
                } else {
                    linhaDados.push('');
                }
                
                // Dias
                if (posUnidade + 6 < linha.length && linha[posUnidade + 6] !== undefined && linha[posUnidade + 6] !== '') {
                    linhaDados.push(String(linha[posUnidade + 6]).trim());
                } else {
                    linhaDados.push('0');
                }
                
                // Verificar se temos pelo menos código e produto
                if (linhaDados.length >= 2 && linhaDados[0] && linhaDados[1]) {
                    dadosBloco.push(linhaDados);
                }
            }
            
            if (dadosBloco.length > 0) {
                console.log(`    ✅ Extraídas ${dadosBloco.length} linhas para ${nomeLojaAtual}`);
                
                // Converter para objetos
                for (const row of dadosBloco) {
                    const codigo = row[0];
                    const codigoInt = parseInt(codigo) || 0;
                    if (codigoInt === 0) continue;
                    
                    // Converter números (formato brasileiro)
                    const estoque = this.converterNumeroBR(row[3]);
                    const preco = this.converterNumeroBR(row[4]);
                    const total = this.converterNumeroBR(row[5]);
                    const dias = parseInt(this.converterNumeroBR(row[8])) || 0;
                    
                    // Buscar na base de preços
                    const baseInfo = this.buscarNaBase(codigo, basePrecos);
                    
                    todosDados.push({
                        codigo: codigo,
                        codigoInt: codigoInt,
                        produto: row[1].substring(0, 100),
                        unidade: row[2] || '',
                        estoque: estoque,
                        preco: preco,
                        total: total,
                        entrada: this.formatarData(row[6]),
                        saida: this.formatarData(row[7]),
                        dias: dias,
                        loja: nomeLojaAtual,
                        categoria: baseInfo.categoria,
                        grupo: baseInfo.grupo,
                        subgrupo: baseInfo.subgrupo,
                        precoBase: baseInfo.preco
                    });
                }
            }
        }
        
        console.log(`  📦 Total de produtos extraídos: ${todosDados.length}`);
        return todosDados;
    }

    converterNumeroBR(valor) {
        if (valor === undefined || valor === null) return 0;
        if (typeof valor === 'number') return valor;
        
        let str = String(valor).trim();
        if (str === '') return 0;
        
        // Remover pontos de milhar e substituir vírgula por ponto
        str = str.replace(/\./g, '');
        str = str.replace(/,/g, '.');
        
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    formatarData(valor) {
        if (!valor) return '';
        const str = String(valor).trim();
        
        // Tentar diferentes formatos
        // DD/MM/AA
        if (str.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
            const partes = str.split('/');
            return `${partes[0]}/${partes[1]}/20${partes[2]}`;
        }
        
        // DD/MM/AAAA
        if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return str;
        }
        
        // Data do Excel (número serial)
        if (!isNaN(parseFloat(str)) && str.length > 5) {
            try {
                const data = new Date(Math.round((parseFloat(str) - 25569) * 86400 * 1000));
                return data.toLocaleDateString('pt-BR');
            } catch (e) {
                return str;
            }
        }
        
        return str;
    }

    buscarNaBase(codigo, basePrecos) {
        if (!basePrecos || basePrecos.length === 0) {
            return { preco: 0, categoria: 'NÃO MAPEADO', grupo: 'NÃO MAPEADO', subgrupo: 'NÃO MAPEADO' };
        }
        const encontrado = basePrecos.find(p => p.codigo === codigo || p.codigoInt === parseInt(codigo));
        if (encontrado) {
            return {
                preco: encontrado.preco || 0,
                categoria: encontrado.categoria || 'NÃO MAPEADO',
                grupo: encontrado.grupo || 'NÃO MAPEADO',
                subgrupo: encontrado.subgrupo || 'NÃO MAPEADO'
            };
        }
        return { preco: 0, categoria: 'NÃO MAPEADO', grupo: 'NÃO MAPEADO', subgrupo: 'NÃO MAPEADO' };
    }

    calcularEstatisticas(dados) {
        const stats = {
            totalProdutos: dados.length,
            totalProdutosUnicos: [...new Set(dados.map(p => p.codigo))].length,
            totalLojas: [...new Set(dados.map(p => p.loja))].length,
            quantidadeTotal: dados.reduce((s, p) => s + p.estoque, 0),
            valorTotal: dados.reduce((s, p) => s + p.total, 0),
            produtosComEstoque: dados.filter(p => p.estoque > 0).length,
            produtosSemEstoque: dados.filter(p => p.estoque === 0).length,
            produtosNC: dados.filter(p => p.produto.toUpperCase().startsWith('NC')).length,
            porLoja: {}
        };
        
        // Estatísticas por loja
        const lojas = [...new Set(dados.map(p => p.loja))];
        for (const loja of lojas) {
            const pl = dados.filter(p => p.loja === loja);
            stats.porLoja[loja] = {
                quantidade: pl.reduce((s, p) => s + p.estoque, 0),
                valor: pl.reduce((s, p) => s + p.total, 0),
                produtos: pl.length,
                produtosComEstoque: pl.filter(p => p.estoque > 0).length,
                produtosSemEstoque: pl.filter(p => p.estoque === 0).length
            };
        }
        
        return stats;
    }

    filtrarPorLojas(lojasSelecionadas) {
        if (!this.dadosProcessados) return [];
        if (!lojasSelecionadas || lojasSelecionadas.length === 0) return this.dadosProcessados;
        return this.dadosProcessados.filter(p => lojasSelecionadas.includes(p.loja));
    }

    getResumoFiltrado(lojasSelecionadas = []) {
        let dadosFiltrados = this.dadosProcessados;
        
        if (lojasSelecionadas.length) {
            dadosFiltrados = dadosFiltrados.filter(p => lojasSelecionadas.includes(p.loja));
        }
        
        const lojas = [...new Set(dadosFiltrados.map(p => p.loja))];
        const porLoja = {};
        
        for (const loja of lojas) {
            const pl = dadosFiltrados.filter(p => p.loja === loja);
            porLoja[loja] = {
                quantidade: pl.reduce((s, p) => s + p.estoque, 0),
                valor: pl.reduce((s, p) => s + p.total, 0),
                produtos: pl.length,
                produtosComEstoque: pl.filter(p => p.estoque > 0).length,
                produtosSemEstoque: pl.filter(p => p.estoque === 0).length
            };
        }
        
        return {
            totalProdutos: dadosFiltrados.length,
            totalProdutosUnicos: [...new Set(dadosFiltrados.map(p => p.codigo))].length,
            totalLojas: lojas.length,
            quantidadeTotal: dadosFiltrados.reduce((s, p) => s + p.estoque, 0),
            valorTotal: dadosFiltrados.reduce((s, p) => s + p.total, 0),
            produtosComEstoque: dadosFiltrados.filter(p => p.estoque > 0).length,
            produtosSemEstoque: dadosFiltrados.filter(p => p.estoque === 0).length,
            produtosNC: dadosFiltrados.filter(p => p.produto.toUpperCase().startsWith('NC')).length,
            porLoja: porLoja
        };
    }
}

const produtosProcessor = new ProdutosProcessor();
console.log('✅ ProdutosProcessor carregado e instanciado');