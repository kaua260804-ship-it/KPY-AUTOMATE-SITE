// ========== PROCESSADOR DE DADOS ==========
// Este arquivo lê e processa os dados do CSV

class ProcessadorDados {
    constructor() {
        this.dadosPrecos = [];
        this.dadosMediaVendas = [];
        this.dadosCarregados = false;
    }

    // Carregar CSV da base de preços
    async carregarBasePrecos() {
        try {
            showToast('📥 Carregando base de preços...', 'info');
            
            // Tentar carregar o CSV local
            const response = await fetch('Base KPY site - Preço.csv');
            const csvText = await response.text();
            
            // Parse do CSV
            this.dadosPrecos = this.parseCSV(csvText);
            
            console.log('✅ Base de preços carregada:', this.dadosPrecos.length, 'registros');
            showToast(`✅ Base de preços carregada: ${this.dadosPrecos.length} produtos`, 'success');
            
            return this.dadosPrecos;
        } catch (error) {
            console.error('❌ Erro ao carregar base de preços:', error);
            showToast('❌ Erro ao carregar base de preços. Verifique se o arquivo CSV existe.', 'error');
            return [];
        }
    }

    // Parse CSV manual (para não depender de bibliotecas externas)
    parseCSV(csvText) {
        const linhas = csvText.split('\n');
        if (linhas.length === 0) return [];
        
        // Pegar cabeçalho
        const cabecalho = this.parseCSVLinha(linhas[0]);
        
        // Mapear índices das colunas
        const indices = {
            codigo: this.encontrarIndice(cabecalho, ['Código', 'CODIGO', 'codigo', 'ID']),
            produto: this.encontrarIndice(cabecalho, ['Produto', 'PRODUTO', 'produto', 'Descrição']),
            preco: this.encontrarIndice(cabecalho, ['Preço varejo', 'Preço', 'PRECO', 'preco']),
            categoria: this.encontrarIndice(cabecalho, ['Categoria', 'CATEGORIA', 'categoria']),
            grupo: this.encontrarIndice(cabecalho, ['Grupo', 'GRUPO', 'grupo']),
            subgrupo: this.encontrarIndice(cabecalho, ['Subgrupo', 'SUBGRUPO', 'subgrupo']),
            loja: this.encontrarIndice(cabecalho, ['Loja', 'LOJA', 'loja']),
            media: this.encontrarIndice(cabecalho, ['Média', 'MEDIA', 'media', 'Qtd'])
        };
        
        console.log('📋 Colunas encontradas:', indices);
        
        // Processar dados
        const dados = [];
        for (let i = 1; i < linhas.length; i++) {
            if (linhas[i].trim() === '') continue;
            
            const valores = this.parseCSVLinha(linhas[i]);
            if (valores.length === 0) continue;
            
            const registro = {};
            
            // Código
            if (indices.codigo !== -1 && valores[indices.codigo]) {
                let codigo = valores[indices.codigo].trim();
                // Remover zeros à esquerda e converter para número
                codigo = codigo.replace(/^0+/, '');
                registro.codigo = codigo;
                registro.codigoNum = parseInt(codigo) || 0;
            }
            
            // Produto
            if (indices.produto !== -1 && valores[indices.produto]) {
                registro.produto = valores[indices.produto].trim();
            }
            
            // Preço
            if (indices.preco !== -1 && valores[indices.preco]) {
                let precoStr = valores[indices.preco].toString().replace(',', '.');
                registro.preco = parseFloat(precoStr) || 0;
            } else {
                registro.preco = 0;
            }
            
            // Categoria
            if (indices.categoria !== -1 && valores[indices.categoria]) {
                registro.categoria = valores[indices.categoria].trim();
            } else {
                registro.categoria = 'NÃO MAPEADO';
            }
            
            // Grupo
            if (indices.grupo !== -1 && valores[indices.grupo]) {
                registro.grupo = valores[indices.grupo].trim();
            } else {
                registro.grupo = 'NÃO MAPEADO';
            }
            
            // Subgrupo
            if (indices.subgrupo !== -1 && valores[indices.subgrupo]) {
                registro.subgrupo = valores[indices.subgrupo].trim();
            } else {
                registro.subgrupo = 'NÃO MAPEADO';
            }
            
            // Loja (para média de vendas)
            if (indices.loja !== -1 && valores[indices.loja]) {
                registro.loja = valores[indices.loja].trim();
            }
            
            // Média de vendas
            if (indices.media !== -1 && valores[indices.media]) {
                let mediaStr = valores[indices.media].toString().replace(',', '.');
                registro.media = parseFloat(mediaStr) || 0;
            } else {
                registro.media = 0;
            }
            
            if (registro.codigo && registro.codigo !== '') {
                dados.push(registro);
            }
        }
        
        console.log(`📊 Parse concluído: ${dados.length} registros`);
        return dados;
    }

    parseCSVLinha(linha) {
        const resultado = [];
        let dentroAspas = false;
        let valorAtual = '';
        
        for (let i = 0; i < linha.length; i++) {
            const char = linha[i];
            
            if (char === '"') {
                dentroAspas = !dentroAspas;
            } else if (char === ',' && !dentroAspas) {
                resultado.push(valorAtual);
                valorAtual = '';
            } else {
                valorAtual += char;
            }
        }
        resultado.push(valorAtual);
        
        return resultado;
    }

    encontrarIndice(cabecalho, possiveisNomes) {
        for (let i = 0; i < cabecalho.length; i++) {
            const coluna = cabecalho[i].toLowerCase().trim();
            for (const nome of possiveisNomes) {
                if (coluna === nome.toLowerCase() || coluna.includes(nome.toLowerCase())) {
                    return i;
                }
            }
        }
        return -1;
    }

    // Buscar produto por código
    buscarProduto(codigo) {
        const codigoStr = codigo.toString().replace(/^0+/, '');
        return this.dadosPrecos.find(p => p.codigo === codigoStr || p.codigoNum === parseInt(codigoStr));
    }

    // Buscar média de vendas por produto e loja
    buscarMediaVendas(codigo, loja) {
        const codigoStr = codigo.toString().replace(/^0+/, '');
        const registros = this.dadosPrecos.filter(p => 
            (p.codigo === codigoStr || p.codigoNum === parseInt(codigoStr)) && 
            p.loja && p.loja.toUpperCase() === loja.toUpperCase()
        );
        
        if (registros.length > 0) {
            return registros[0].media || 0;
        }
        return 0;
    }

    // Obter estatísticas
    getEstatisticas() {
        const produtosComPreco = this.dadosPrecos.filter(p => p.preco > 0).length;
        const categorias = [...new Set(this.dadosPrecos.map(p => p.categoria).filter(c => c && c !== 'NÃO MAPEADO'))];
        const grupos = [...new Set(this.dadosPrecos.map(p => p.grupo).filter(g => g && g !== 'NÃO MAPEADO'))];
        
        return {
            totalProdutos: this.dadosPrecos.length,
            produtosComPreco: produtosComPreco,
            produtosSemPreco: this.dadosPrecos.length - produtosComPreco,
            totalCategorias: categorias.length,
            totalGrupos: grupos.length,
            valorMedioPreco: this.dadosPrecos.reduce((s, p) => s + p.preco, 0) / this.dadosPrecos.length || 0
        };
    }
}

// Instância global
const processador = new ProcessadorDados();