// ========== PROCESSADOR DE ENTRADAS POR GRUPO - COM CONVERSÃO CORRETA ==========

class EntradasProcessor {
    constructor() {
        this.dadosProcessados = null;
        this.grupos = [];
        this.compradores = [];
        this.estatisticas = {};
        console.log('🔧 EntradasProcessor inicializado');
    }

    async processarArquivo(file, basePrecos) {
        console.log('📊 processarArquivo Entradas:', file.name);
        
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
                    
                    console.log('📊 Planilha Entradas:', dadosRaw.length, 'linhas');
                    
                    const resultado = this.processarDados(dadosRaw, basePrecos);
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

    // Converte número no formato brasileiro (vírgula decimal) para número
    converterNumeroBR(valor) {
        if (valor === undefined || valor === null) return 0;
        if (typeof valor === 'number') return valor;
        
        let str = String(valor).trim();
        if (str === '') return 0;
        
        // Se já é um número (sem vírgula), retorna como está
        if (!str.includes(',') && !isNaN(parseFloat(str))) {
            return parseFloat(str);
        }
        
        // Remove pontos de milhar e substitui vírgula por ponto
        str = str.replace(/\./g, '');  // Remove pontos de milhar
        str = str.replace(/,/g, '.');   // Substitui vírgula decimal por ponto
        
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    processarDados(dadosRaw, basePrecos) {
        console.log('📊 Processando Entradas...');
        
        // Mapeamento de compradores
        const MAPA_COMPRADORES = {
            'QUEIJOS ESPECIAIS': 'Anderson',
            'EMBUTIDOS/DEFUMADOS': 'Anderson',
            'PRESUNTARIA/MORTADELA': 'Anderson',
            'QUEIJOS COMODITIES': 'Anderson',
            'MARGARINAS/MANTEIGAS': 'Anderson',
            'REQUEIJAO/QUEIJOS CREMOSOS': 'Anderson',
            'IOGURTES': 'Anderson',
            'ANTEPASTOS/SOBREMESAS/APER': 'Anderson',
            'MASSAS REFRIGERADAS': 'Anderson',
            'BEBIDAS LACTEAS': 'Anderson',
            'ARTIGOS CHURRASCO': 'Erilana',
            'BAZAR': 'Erilana',
            'BOMBONIERE': 'Erilana',
            'MERCEARIA DOCE': 'Erilana',
            'MATINAIS': 'Erilana',
            'PLANTAS': 'Erilana',
            'BEBIDAS NAO ALCOOLICAS': 'Andreia Silva',
            'BEBIDAS ALCOOLICAS': 'Andreia Silva',
            'SUPLEMENTOS NUTRICIONAIS': 'Andreia Silva',
            'LIMPEZA': 'Marcelo',
            'HIGIENE E PERFUMARIA': 'Marcelo',
            'DESCARTAVEIS': 'Marcelo',
            'DIANTEIRA C/ OSSO': 'Glacirene',
            'DIANTEIRA S/ OSSO': 'Glacirene',
            'TRASEIRA S/ OSSO': 'Glacirene',
            'AVES': 'Glacirene',
            'TRASEIRA C/ OSSO': 'Glacirene',
            'INDUSTRIALIZADOS': 'Glacirene',
            'MIUDOS': 'Glacirene',
            'SUINOS': 'Glacirene',
            'OVINOS': 'Glacirene',
            'PEIXES / MARISCOS': 'Glacirene',
            'FRUTAS': 'Joao',
            'LEGUMES': 'Joao',
            'VERDURAS': 'Joao',
            'OVOS': 'Joao',
            'CONGELADOS': 'Joseane',
            'TEMPEROS/CONDIMENTOS': 'Joseane',
            'CONSERVAS': 'Joseane',
            'MASSAS': 'Joseane',
            'MOLHOS/ATOMATADOS': 'Joseane',
            'FRUTAS SECAS': 'Renato',
            'ROTISSERIA': 'Renato',
            'PADARIA': 'Renato',
            'GERAL': 'Renato',
            'DOCURAS': 'Renato'
        };

        function getComprador(grupo) {
            return MAPA_COMPRADORES[grupo] || 'NÃO MAPEADO';
        }

        function isNumero(valor) {
            try {
                if (valor === undefined || valor === null) return false;
                const val = String(valor).trim();
                if (!val || val === 'nan' || val === 'None' || val === '') return false;
                // Verifica se o primeiro caractere é dígito (ignorando pontos e vírgulas)
                const primeiroChar = val[0];
                return (primeiroChar >= '0' && primeiroChar <= '9') || primeiroChar === '.';
            } catch {
                return false;
            }
        }

        // Array para armazenar todos os dados
        const todosDados = [];
        
        // Valores atuais de categoria e grupo
        let catCodigo = "";
        let catNome = "";
        let grupoCodigo = "";
        let grupoNome = "";
        
        console.log('🔍 Varrendo linha por linha...');
        
        // VAI LINHA POR LINHA
        for (let i = 0; i < dadosRaw.length; i++) {
            const linha = dadosRaw[i];
            if (!linha || !Array.isArray(linha)) continue;
            
            const primeira = linha[0] !== undefined ? String(linha[0]).trim() : "";
            
            // CASO 1: Encontrou CATEGORIA
            if (primeira.toLowerCase().includes('categoria:')) {
                if (linha[1] !== undefined) {
                    catCodigo = String(linha[1]).replace(/^0+/, '');
                }
                if (linha[2] !== undefined) {
                    catNome = String(linha[2]).trim();
                }
                if (linha[4] !== undefined) {
                    grupoCodigo = String(linha[4]).replace(/^0+/, '');
                }
                if (linha[5] !== undefined) {
                    grupoNome = String(linha[5]).trim();
                }
                console.log(`📁 Linha ${i}: Categoria ${catCodigo}-${catNome}, Grupo ${grupoCodigo}-${grupoNome}`);
                continue;
            }
            
            // CASO 2: Encontrou PRODUTO
            if (isNumero(primeira)) {
                // Coletar as 11 colunas (0 a 10)
                const linhaProduto = [];
                for (let j = 0; j <= 10; j++) {
                    if (j < linha.length && linha[j] !== undefined && linha[j] !== '') {
                        linhaProduto.push(linha[j]);
                    } else {
                        linhaProduto.push("");
                    }
                }
                
                // Adicionar categoria e grupo
                linhaProduto.push(catNome);
                linhaProduto.push(grupoNome);
                linhaProduto.push('');
                
                todosDados.push(linhaProduto);
            }
        }
        
        console.log(`📦 Total de produtos encontrados: ${todosDados.length}`);
        
        if (todosDados.length === 0) {
            return { success: false, error: 'Nenhum produto encontrado', dados: [], grupos: [], compradores: [], estatisticas: {} };
        }
        
        // Criar produtos com a conversão correta
        const produtos = [];
        
        for (const row of todosDados) {
            const codigo = String(row[0] || '').replace(/^0+/, '');
            const codigoInt = parseInt(codigo) || 0;
            
            if (codigoInt === 0) continue;
            
            // Converter os valores usando a função correta
            const pecas = this.converterNumeroBR(row[2]);
            const qtd = this.converterNumeroBR(row[3]);
            const custoMd = this.converterNumeroBR(row[5]);
            const total = this.converterNumeroBR(row[6]);
            const prVda = this.converterNumeroBR(row[7]);
            const markup = this.converterNumeroBR(row[8]);
            const margem = this.converterNumeroBR(row[9]);
            
            const produto = {
                codigo: codigo,
                codigoInt: codigoInt,
                produto: (row[1] || '').substring(0, 100),
                pecas: pecas,
                qtd: qtd,
                unid: row[4] || '',
                custoMd: custoMd,
                total: total,
                prVda: prVda,
                markup: markup,
                margem: margem,
                ultEnt: row[10] || '',
                categoria: row[11] || 'NÃO MAPEADO',
                grupo: row[12] || 'NÃO MAPEADO',
                comprador: ''
            };
            
            produto.comprador = getComprador(produto.grupo);
            produtos.push(produto);
        }
        
        console.log(`📦 Produtos válidos: ${produtos.length}`);
        
        if (produtos.length === 0) {
            return { success: false, error: 'Nenhum produto válido encontrado', dados: [], grupos: [], compradores: [], estatisticas: {} };
        }
        
        this.dadosProcessados = produtos;
        this.grupos = [...new Set(produtos.map(p => p.grupo))];
        this.compradores = [...new Set(produtos.map(p => p.comprador))];
        
        const quantidadeTotal = produtos.reduce((s, p) => s + p.qtd, 0);
        const valorTotal = produtos.reduce((s, p) => s + p.total, 0);
        
        const porGrupo = {};
        for (const grupo of this.grupos) {
            const pg = produtos.filter(p => p.grupo === grupo);
            porGrupo[grupo] = {
                quantidade: pg.reduce((s, p) => s + p.qtd, 0),
                valor: pg.reduce((s, p) => s + p.total, 0),
                produtos: pg.length
            };
        }
        
        const porComprador = {};
        for (const comprador of this.compradores) {
            const pc = produtos.filter(p => p.comprador === comprador);
            porComprador[comprador] = {
                quantidade: pc.reduce((s, p) => s + p.qtd, 0),
                valor: pc.reduce((s, p) => s + p.total, 0),
                produtos: pc.length,
                grupos: [...new Set(pc.map(p => p.grupo))]
            };
        }
        
        this.estatisticas = {
            totalRegistros: produtos.length,
            totalProdutosUnicos: [...new Set(produtos.map(p => p.codigo))].length,
            totalGrupos: this.grupos.length,
            totalCompradores: this.compradores.length,
            quantidadeTotal: quantidadeTotal,
            valorTotal: valorTotal,
            porGrupo: porGrupo,
            porComprador: porComprador
        };
        
        console.log(`✅ Processado: ${produtos.length} registros, ${this.grupos.length} grupos`);
        console.log(`📊 Amostra - primeiro produto:`, produtos[0]);
        
        return {
            success: true,
            dados: produtos,
            estatisticas: this.estatisticas,
            grupos: this.grupos,
            compradores: this.compradores
        };
    }

    filtrarPorGrupos(gruposSelecionados) {
        if (!this.dadosProcessados) return [];
        if (!gruposSelecionados || gruposSelecionados.length === 0) return this.dadosProcessados;
        return this.dadosProcessados.filter(p => gruposSelecionados.includes(p.grupo));
    }

    filtrarPorCompradores(compradoresSelecionados) {
        if (!this.dadosProcessados) return [];
        if (!compradoresSelecionados || compradoresSelecionados.length === 0) return this.dadosProcessados;
        return this.dadosProcessados.filter(p => compradoresSelecionados.includes(p.comprador));
    }

    getResumoFiltrado(gruposSelecionados = [], compradoresSelecionados = []) {
        let dadosFiltrados = this.dadosProcessados;
        
        if (gruposSelecionados.length) {
            dadosFiltrados = dadosFiltrados.filter(p => gruposSelecionados.includes(p.grupo));
        }
        if (compradoresSelecionados.length) {
            dadosFiltrados = dadosFiltrados.filter(p => compradoresSelecionados.includes(p.comprador));
        }
        
        const grupos = [...new Set(dadosFiltrados.map(p => p.grupo))];
        const compradores = [...new Set(dadosFiltrados.map(p => p.comprador))];
        const porGrupo = {};
        const porComprador = {};
        
        for (const grupo of grupos) {
            const pg = dadosFiltrados.filter(p => p.grupo === grupo);
            porGrupo[grupo] = {
                quantidade: pg.reduce((s, p) => s + p.qtd, 0),
                valor: pg.reduce((s, p) => s + p.total, 0),
                produtos: pg.length
            };
        }
        
        for (const comprador of compradores) {
            const pc = dadosFiltrados.filter(p => p.comprador === comprador);
            porComprador[comprador] = {
                quantidade: pc.reduce((s, p) => s + p.qtd, 0),
                valor: pc.reduce((s, p) => s + p.total, 0),
                produtos: pc.length
            };
        }
        
        return {
            totalRegistros: dadosFiltrados.length,
            totalProdutosUnicos: [...new Set(dadosFiltrados.map(p => p.codigo))].length,
            totalGrupos: grupos.length,
            totalCompradores: compradores.length,
            quantidadeTotal: dadosFiltrados.reduce((s, p) => s + p.qtd, 0),
            valorTotal: dadosFiltrados.reduce((s, p) => s + p.total, 0),
            porGrupo: porGrupo,
            porComprador: porComprador
        };
    }
}

const entradasProcessor = new EntradasProcessor();
console.log('✅ EntradasProcessor carregado e instanciado');