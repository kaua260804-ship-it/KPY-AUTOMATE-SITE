// ========== PROCESSADOR DE RELATÓRIO DE RUPTURA ==========
// Usa o mapeamento de compradores do compradores.js

class RelatorioProcessor {
    constructor() {
        this.dadosProcessados = null;
        this.lojas = [];
        this.categorias = [];
        this.compradores = [];
        this.estatisticas = {};
        this.previewOriginal = "";
        this.ultimosFiltros = {};
        console.log("RelatorioProcessor inicializado");
    }

    normalizarCodigo(codigo) {
        if (!codigo) return "";
        return String(codigo).split(".")[0].replace(/^0+/, "");
    }

    normalizarLoja(loja) {
        if (!loja) return "";
        return String(loja).trim().toUpperCase();
    }

    converterNumeroBR(valor) {
        if (valor === undefined || valor === null) return 0;
        if (typeof valor === "number") return valor;
        let str = String(valor).trim();
        if (str === "") return 0;
        str = str.replace(/\./g, "").replace(/,/g, ".");
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    calcularDDE(estoque, media) {
        const estq = parseFloat(estoque) || 0;
        const med = parseFloat(media) || 0;
        
        if (estq === 0 && med === 0) return "Estoque e venda zerados";
        if (estq === 0) return "Estoque zerado";
        if (med === 0) return "Sem venda";
        
        const dias = (estq / med) * 30;
        if (dias >= 30) {
            const meses = Math.floor(dias / 30);
            return meses + " mes(es)";
        }
        return Math.floor(dias) + " dia(s)";
    }

    statusEstoque(estqLoja, estqMatriz) {
        const estqL = parseFloat(estqLoja) || 0;
        const estqM = parseFloat(estqMatriz) || 0;
        const statusLoja = estqL > 0 ? "C/ESTQ LJ" : "S/ESTQ LJ";
        const statusMatriz = estqM > 0 ? "C/ESTQ MTZ" : "S/ESTQ MTZ";
        return statusLoja + " " + statusMatriz;
    }

    statusVenda(vendas) {
        const v = parseFloat(vendas) || 0;
        return v > 0 ? "VENDA" : "SEM VENDA";
    }

    statusRuptura(media, estoque) {
        const med = parseFloat(media) || 0;
        const estq = parseFloat(estoque) || 0;
        if (med > 0 && estq === 0) return "RUPTURA";
        return "OK";
    }

    // ========== PROCESSAMENTO DO ESTOQUE ==========
    async processarEstoque(file, basePrecos) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
                    const dadosRaw = XLSX.utils.sheet_to_json(primeiraPlanilha, { header: 1, defval: "" });
                    const resultado = this._processarEstoque(dadosRaw, basePrecos);
                    resolve(resultado);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
            reader.readAsArrayBuffer(file);
        });
    }

    _processarEstoque(dadosRaw, basePrecos) {
        console.log("Processando Estoque...");
        
        let linhaCabecalho = -1;
        let colunas = {
            codigo: -1, produto: -1, estoqueLoja: -1,
            loja: -1, categoria: -1, grupo: -1, subgrupo: -1, fornecedor: -1
        };
        
        for (let i = 0; i < Math.min(30, dadosRaw.length); i++) {
            const linha = dadosRaw[i];
            if (!linha) continue;
            for (let j = 0; j < linha.length; j++) {
                const celula = String(linha[j] || "").toLowerCase().trim();
                if (celula === "código" || celula === "codigo") {
                    linhaCabecalho = i;
                    colunas.codigo = j;
                }
                if (celula === "descrição" || celula === "produto") colunas.produto = j;
                if (celula === "estoque loja") colunas.estoqueLoja = j;
                if (celula === "loja") colunas.loja = j;
                if (celula === "categoria") colunas.categoria = j;
                if (celula === "grupo") colunas.grupo = j;
                if (celula === "sub-grupo" || celula === "subgrupo") colunas.subgrupo = j;
                if (celula === "fornec/razão social" || celula === "fornecedor_razao") colunas.fornecedor = j;
            }
            if (linhaCabecalho !== -1 && colunas.codigo !== -1) break;
        }
        
        if (linhaCabecalho === -1) {
            linhaCabecalho = 4;
            colunas = { 
                codigo: 0, produto: 1, estoqueLoja: 3,
                loja: 18, categoria: 11, grupo: 12, subgrupo: 13, fornecedor: 14
            };
        }
        
        const produtos = [];
        const categoriasSet = new Set();
        const compradoresSet = new Set();
        
        for (let i = linhaCabecalho + 1; i < dadosRaw.length; i++) {
            const linha = dadosRaw[i];
            if (!linha) continue;
            
            let codigo = "";
            if (colunas.codigo !== -1 && linha[colunas.codigo]) {
                codigo = this.normalizarCodigo(linha[colunas.codigo]);
            }
            if (!codigo || isNaN(parseInt(codigo))) continue;
            
            const produto = colunas.produto !== -1 ? (linha[colunas.produto] || "") : "";
            const estoqueLoja = this.converterNumeroBR(linha[colunas.estoqueLoja]);
            const loja = colunas.loja !== -1 ? this.normalizarLoja(linha[colunas.loja]) : "";
            const categoria = colunas.categoria !== -1 ? (linha[colunas.categoria] || "") : "";
            const grupo = colunas.grupo !== -1 ? (linha[colunas.grupo] || "") : "";
            const subgrupo = colunas.subgrupo !== -1 ? (linha[colunas.subgrupo] || "") : "";
            const fornecedor = colunas.fornecedor !== -1 ? (linha[colunas.fornecedor] || "") : "";
            
            if (categoria) categoriasSet.add(categoria);
            const comprador = getComprador(grupo);
            if (comprador) compradoresSet.add(comprador);
            
            produtos.push({
                codigo: codigo,
                codigoInt: parseInt(codigo),
                produto: String(produto).substring(0, 100),
                estoqueLoja: estoqueLoja,
                loja: loja,
                categoria: categoria,
                grupo: grupo,
                subgrupo: subgrupo,
                fornecedor: fornecedor,
                comprador: comprador
            });
        }
        
        this.categorias = Array.from(categoriasSet).sort();
        this.compradores = Array.from(compradoresSet).sort();
        
        console.log("Estoque processado: " + produtos.length + " produtos");
        console.log("Categorias encontradas: " + this.categorias.length);
        console.log("Compradores encontrados: " + this.compradores.length);
        
        return produtos;
    }

    // ========== PROCESSAMENTO DA CURVA ABC ==========
    async processarCurva(file, basePrecos) {
        console.log("Processando Curva ABC via curvaProcessor...");
        
        const resultado = await curvaProcessor.processarArquivo(file, basePrecos);
        
        if (!resultado || !resultado.dados) {
            console.log("Nenhum dado retornado do curvaProcessor");
            return [];
        }
        
        const vendas = [];
        for (const item of resultado.dados) {
            const codigo = this.normalizarCodigo(item.codigo);
            const loja = this.normalizarLoja(item.loja);
            const qtd = parseFloat(item.qtd) || 0;
            
            if (codigo && loja && qtd > 0) {
                vendas.push({
                    codigo: codigo,
                    codigoInt: parseInt(codigo),
                    qtd: qtd,
                    loja: loja
                });
            }
        }
        
        console.log("Curva ABC processada: " + vendas.length + " registros de venda");
        return vendas;
    }

    // ========== MEDIA DE VENDAS ==========
    async carregarMediaVendas() {
        try {
            const caminhos = [
                "data/media_vendas.xlsx",
                "../data/media_vendas.xlsx",
                "./data/media_vendas.xlsx",
                "media_vendas.xlsx"
            ];
            
            let response = null;
            for (const caminho of caminhos) {
                try {
                    response = await fetch(caminho);
                    if (response.ok) break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                console.log("Arquivo media_vendas.xlsx nao encontrado");
                return [];
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
            const dados = XLSX.utils.sheet_to_json(primeiraPlanilha);
            
            const mediaVendas = dados.map(row => ({
                codigo: this.normalizarCodigo(row["Código"] || row["CODIGO"]),
                loja: this.normalizarLoja(row["Loja"] || row["LOJA"]),
                qtd: parseFloat(row["Qtd"] || row["QTD"] || 0)
            }));
            
            console.log("Media de vendas carregada: " + mediaVendas.length + " registros");
            return mediaVendas;
        } catch (error) {
            console.log("Erro ao carregar media de vendas:", error);
            return [];
        }
    }

    // ========== PROCESSAR RELATORIO COMPLETO ==========
    async processarRelatorio(arquivoEstoque, arquivoCurva, basePrecos) {
        console.log("GERANDO RELATORIO DE RUPTURA");
        
        if (!arquivoEstoque) throw new Error("Arquivo de Estoque e obrigatorio!");
        if (!arquivoCurva) throw new Error("Arquivo de Curva ABC e obrigatorio!");
        
        const dadosEstoque = await this.processarEstoque(arquivoEstoque, basePrecos);
        const dadosCurva = await this.processarCurva(arquivoCurva, basePrecos);
        const dadosMedia = await this.carregarMediaVendas();
        
        const vendasMap = new Map();
        for (const venda of dadosCurva) {
            const key = venda.codigo + "|" + venda.loja;
            vendasMap.set(key, venda.qtd);
        }
        
        const mediaMap = new Map();
        for (const media of dadosMedia) {
            const key = media.codigo + "|" + media.loja;
            mediaMap.set(key, media.qtd);
        }
        
        const nomeMatriz = "COMCARNE MATRIZ SAO LUIS";
        const matrizNormalizada = this.normalizarLoja(nomeMatriz);
        const estoqueMatriz = new Map();
        for (const estq of dadosEstoque) {
            if (estq.loja === matrizNormalizada) {
                estoqueMatriz.set(estq.codigo, estq.estoqueLoja);
            }
        }
        
        const resultados = [];
        let comVenda = 0;
        
        for (const estq of dadosEstoque) {
            const key = estq.codigo + "|" + estq.loja;
            const vendas = vendasMap.get(key) || 0;
            const media = mediaMap.get(key) || 0;
            const estoqueMatrizVal = estoqueMatriz.get(estq.codigo) || 0;
            
            if (vendas > 0) comVenda++;
            
            let precoBase = 0;
            const encontrado = basePrecos.find(p => p.codigo === estq.codigo || p.codigoInt === estq.codigoInt);
            if (encontrado) {
                precoBase = encontrado.preco || 0;
            }
            
            const comprador = getComprador(estq.grupo);
            
            resultados.push({
                codigo: estq.codigoInt,
                produto: estq.produto,
                categoria: estq.categoria || "NAO MAPEADO",
                grupo: estq.grupo || "NAO MAPEADO",
                comprador: comprador,
                estqLoja: estq.estoqueLoja,
                estqMatriz: estoqueMatrizVal,
                vendas: vendas,
                mediaVendas: media,
                dde: this.calcularDDE(estq.estoqueLoja, media),
                loja: estq.loja,
                statusEstoque: this.statusEstoque(estq.estoqueLoja, estoqueMatrizVal),
                venda: this.statusVenda(vendas),
                ruptura: this.statusRuptura(media, estq.estoqueLoja),
                valorEstoque: precoBase * estq.estoqueLoja,
                preco: precoBase,
                subgrupo: estq.subgrupo || "",
                forn: estq.fornecedor || ""
            });
        }
        
        this.dadosProcessados = resultados;
        this.lojas = [...new Set(resultados.map(r => r.loja))];
        
        this.atualizarEstatisticas();
        
        console.log("Relatorio gerado: " + resultados.length + " linhas, " + this.lojas.length + " lojas");
        
        return {
            success: true,
            dados: resultados,
            estatisticas: this.estatisticas,
            lojas: this.lojas,
            categorias: this.categorias,
            compradores: this.compradores
        };
    }

    atualizarEstatisticas() {
        const resultados = this.dadosProcessados;
        if (!resultados) return;
        
        // CONTAGEM DE PRODUTOS ÚNICOS (por código) - NÃO registros repetidos
        const produtosUnicos = [...new Set(resultados.map(r => r.codigo))].length;
        const totalRupturaUnicos = [...new Set(resultados.filter(r => r.ruptura === "RUPTURA").map(r => r.codigo))].length;
        const totalSemEstoqueUnicos = [...new Set(resultados.filter(r => r.estqLoja === 0).map(r => r.codigo))].length;
        const totalComEstoqueUnicos = produtosUnicos - totalSemEstoqueUnicos;
        
        this.estatisticas = {
            totalRegistros: resultados.length,
            totalProdutosUnicos: produtosUnicos,
            totalLojas: this.lojas.length,
            totalCategorias: this.categorias.length,
            totalCompradores: this.compradores.length,
            totalRuptura: totalRupturaUnicos,
            totalSemEstoque: totalSemEstoqueUnicos,
            totalComEstoque: totalComEstoqueUnicos,
            percentualRuptura: produtosUnicos > 0 ? (totalRupturaUnicos / produtosUnicos) * 100 : 0,
            quantidadeTotal: resultados.reduce((s, r) => s + r.estqLoja, 0),
            valorTotal: resultados.reduce((s, r) => s + r.valorEstoque, 0),
            porLoja: {},
            porCategoria: {},
            porComprador: {}
        };
        
        // Estatísticas por Loja (produtos únicos)
        for (const loja of this.lojas) {
            const produtosLoja = resultados.filter(r => r.loja === loja);
            const codigosLoja = [...new Set(produtosLoja.map(r => r.codigo))];
            const rupturaLoja = [...new Set(produtosLoja.filter(r => r.ruptura === "RUPTURA").map(r => r.codigo))];
            
            this.estatisticas.porLoja[loja] = {
                quantidade: produtosLoja.reduce((s, r) => s + r.estqLoja, 0),
                valor: produtosLoja.reduce((s, r) => s + r.valorEstoque, 0),
                produtos: codigosLoja.length,
                ruptura: rupturaLoja.length,
                percentualRuptura: codigosLoja.length > 0 ? (rupturaLoja.length / codigosLoja.length) * 100 : 0
            };
        }
        
        // Estatísticas por Categoria (produtos únicos)
        for (const categoria of this.categorias) {
            const produtosCategoria = resultados.filter(r => r.categoria === categoria);
            const codigosCategoria = [...new Set(produtosCategoria.map(r => r.codigo))];
            const rupturaCategoria = [...new Set(produtosCategoria.filter(r => r.ruptura === "RUPTURA").map(r => r.codigo))];
            
            this.estatisticas.porCategoria[categoria] = {
                quantidade: produtosCategoria.reduce((s, r) => s + r.estqLoja, 0),
                valor: produtosCategoria.reduce((s, r) => s + r.valorEstoque, 0),
                produtos: codigosCategoria.length,
                ruptura: rupturaCategoria.length,
                percentualRuptura: codigosCategoria.length > 0 ? (rupturaCategoria.length / codigosCategoria.length) * 100 : 0
            };
        }
        
        // Estatísticas por Comprador (produtos únicos)
        for (const comprador of this.compradores) {
            const produtosComprador = resultados.filter(r => r.comprador === comprador);
            const codigosComprador = [...new Set(produtosComprador.map(r => r.codigo))];
            const rupturaComprador = [...new Set(produtosComprador.filter(r => r.ruptura === "RUPTURA").map(r => r.codigo))];
            
            this.estatisticas.porComprador[comprador] = {
                quantidade: produtosComprador.reduce((s, r) => s + r.estqLoja, 0),
                valor: produtosComprador.reduce((s, r) => s + r.valorEstoque, 0),
                produtos: codigosComprador.length,
                ruptura: rupturaComprador.length,
                percentualRuptura: codigosComprador.length > 0 ? (rupturaComprador.length / codigosComprador.length) * 100 : 0
            };
        }
    }

    // ========== METODOS DE FILTRO ==========
    filtrarPorLojas(lojasSelecionadas) {
        if (!this.dadosProcessados) return [];
        if (!lojasSelecionadas || lojasSelecionadas.length === 0) return this.dadosProcessados;
        const lojasNorm = lojasSelecionadas.map(l => this.normalizarLoja(l));
        return this.dadosProcessados.filter(p => lojasNorm.includes(this.normalizarLoja(p.loja)));
    }

    filtrarPorCategorias(categoriasSelecionadas) {
        if (!this.dadosProcessados) return [];
        if (!categoriasSelecionadas || categoriasSelecionadas.length === 0) return this.dadosProcessados;
        return this.dadosProcessados.filter(p => categoriasSelecionadas.includes(p.categoria));
    }

    filtrarPorCompradores(compradoresSelecionados) {
        if (!this.dadosProcessados) return [];
        if (!compradoresSelecionados || compradoresSelecionados.length === 0) return this.dadosProcessados;
        return this.dadosProcessados.filter(p => compradoresSelecionados.includes(p.comprador));
    }

    getResumoFiltrado(lojasSelecionadas = [], categoriasSelecionadas = [], compradoresSelecionados = []) {
        let dadosFiltrados = this.dadosProcessados;
        
        if (lojasSelecionadas.length) {
            const lojasNorm = lojasSelecionadas.map(l => this.normalizarLoja(l));
            dadosFiltrados = dadosFiltrados.filter(p => lojasNorm.includes(this.normalizarLoja(p.loja)));
        }
        if (categoriasSelecionadas.length) {
            dadosFiltrados = dadosFiltrados.filter(p => categoriasSelecionadas.includes(p.categoria));
        }
        if (compradoresSelecionados.length) {
            dadosFiltrados = dadosFiltrados.filter(p => compradoresSelecionados.includes(p.comprador));
        }
        
        const lojas = [...new Set(dadosFiltrados.map(p => p.loja))];
        const categorias = [...new Set(dadosFiltrados.map(p => p.categoria))];
        const compradores = [...new Set(dadosFiltrados.map(p => p.comprador))];
        const produtosUnicos = [...new Set(dadosFiltrados.map(p => p.codigo))].length;
        const totalRuptura = [...new Set(dadosFiltrados.filter(p => p.ruptura === "RUPTURA").map(p => p.codigo))].length;
        
        const porLoja = {};
        const porCategoria = {};
        const porComprador = {};
        
        for (const loja of lojas) {
            const pl = dadosFiltrados.filter(p => p.loja === loja);
            const codigos = [...new Set(pl.map(p => p.codigo))];
            const ruptura = [...new Set(pl.filter(p => p.ruptura === "RUPTURA").map(p => p.codigo))];
            porLoja[loja] = {
                quantidade: pl.reduce((s, p) => s + p.estqLoja, 0),
                valor: pl.reduce((s, p) => s + p.valorEstoque, 0),
                produtos: codigos.length,
                ruptura: ruptura.length,
                percentualRuptura: codigos.length > 0 ? (ruptura.length / codigos.length) * 100 : 0
            };
        }
        
        for (const categoria of categorias) {
            const pc = dadosFiltrados.filter(p => p.categoria === categoria);
            const codigos = [...new Set(pc.map(p => p.codigo))];
            const ruptura = [...new Set(pc.filter(p => p.ruptura === "RUPTURA").map(p => p.codigo))];
            porCategoria[categoria] = {
                quantidade: pc.reduce((s, p) => s + p.estqLoja, 0),
                valor: pc.reduce((s, p) => s + p.valorEstoque, 0),
                produtos: codigos.length,
                ruptura: ruptura.length,
                percentualRuptura: codigos.length > 0 ? (ruptura.length / codigos.length) * 100 : 0
            };
        }
        
        for (const comprador of compradores) {
            const pcomp = dadosFiltrados.filter(p => p.comprador === comprador);
            const codigos = [...new Set(pcomp.map(p => p.codigo))];
            const ruptura = [...new Set(pcomp.filter(p => p.ruptura === "RUPTURA").map(p => p.codigo))];
            porComprador[comprador] = {
                quantidade: pcomp.reduce((s, p) => s + p.estqLoja, 0),
                valor: pcomp.reduce((s, p) => s + p.valorEstoque, 0),
                produtos: codigos.length,
                ruptura: ruptura.length,
                percentualRuptura: codigos.length > 0 ? (ruptura.length / codigos.length) * 100 : 0
            };
        }
        
        return {
            totalRegistros: dadosFiltrados.length,
            totalProdutosUnicos: produtosUnicos,
            totalLojas: lojas.length,
            totalCategorias: categorias.length,
            totalCompradores: compradores.length,
            quantidadeTotal: dadosFiltrados.reduce((s, p) => s + p.estqLoja, 0),
            valorTotal: dadosFiltrados.reduce((s, p) => s + p.valorEstoque, 0),
            totalRuptura: totalRuptura,
            porLoja: porLoja,
            porCategoria: porCategoria,
            porComprador: porComprador
        };
    }

    getValoresUnicos() {
        if (!this.dadosProcessados) return {};
        return {
            "LOJA": [...new Set(this.dadosProcessados.map(p => p.loja))].sort(),
            "CATEGORIA": [...new Set(this.dadosProcessados.map(p => p.categoria))].filter(c => c && c !== "NAO MAPEADO").sort(),
            "COMPRADOR": [...new Set(this.dadosProcessados.map(p => p.comprador))].filter(c => c !== "NAO MAPEADO").sort(),
            "RUPTURA": [...new Set(this.dadosProcessados.map(p => p.ruptura))].sort(),
            "STATUS DO ESTOQUE": [...new Set(this.dadosProcessados.map(p => p.statusEstoque))].sort(),
            "VENDA": [...new Set(this.dadosProcessados.map(p => p.venda))].sort()
        };
    }

    varrerRelatorio() {
        if (!this.dadosProcessados) return [];
        
        let dados = [...this.dadosProcessados];
        let removidos = 0;
        
        const antesLoja = dados.length;
        dados = dados.filter(p => this.normalizarLoja(p.loja) !== "COMCARNE MATRIZ SAO LUIS");
        removidos += antesLoja - dados.length;
        
        const antesNC = dados.length;
        dados = dados.filter(p => !p.produto.toUpperCase().startsWith("NC"));
        removidos += antesNC - dados.length;
        
        const antesZeros = dados.length;
        dados = dados.filter(p => !(p.estqLoja === 0 && p.vendas === 0 && p.mediaVendas === 0));
        removidos += antesZeros - dados.length;
        
        console.log("Varredura: " + removidos + " linhas removidas");
        
        this.dadosProcessados = dados;
        this.lojas = [...new Set(dados.map(p => p.loja))];
        this.atualizarEstatisticas();
        
        return dados;
    }

    exportarParaExcel(lojasSelecionadas = null, categoriasSelecionadas = null, compradoresSelecionados = null) {
        let dados = this.dadosProcessados;
        
        if (lojasSelecionadas && lojasSelecionadas.length > 0) {
            const lojasNorm = lojasSelecionadas.map(l => this.normalizarLoja(l));
            dados = dados.filter(p => lojasNorm.includes(this.normalizarLoja(p.loja)));
        }
        if (categoriasSelecionadas && categoriasSelecionadas.length > 0) {
            dados = dados.filter(p => categoriasSelecionadas.includes(p.categoria));
        }
        if (compradoresSelecionados && compradoresSelecionados.length > 0) {
            dados = dados.filter(p => compradoresSelecionados.includes(p.comprador));
        }
        
        const planilha = dados.map(p => ({
            "CATEGORIA": p.categoria,
            "GRUPO": p.grupo,
            "CODIGO": p.codigo,
            "PRODUTO": p.produto,
            "ESTQ LOJA": p.estqLoja,
            "ESTQ MATRIZ": p.estqMatriz,
            "VENDAS MES ATUAL": p.vendas,
            "MEDIA VENDA MENSAL": p.mediaVendas,
            "DDE": p.dde,
            "LOJA": p.loja,
            "STATUS DO ESTOQUE": p.statusEstoque,
            "VENDA": p.venda,
            "COMPRADOR": p.comprador,
            "RUPTURA": p.ruptura,
            "VALOR ETQ": p.valorEstoque,
            "Preco": p.preco,
            "SUBGRUPO": p.subgrupo,
            "FORN": p.forn
        }));
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(planilha);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ruptura");
        
        worksheet["!cols"] = [
            { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 50 },
            { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 10 },
            { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
            { wch: 25 }, { wch: 30 }
        ];
        
        return workbook;
    }
}

const relatorioProcessor = new RelatorioProcessor();
console.log("RelatorioProcessor carregado e instanciado");
