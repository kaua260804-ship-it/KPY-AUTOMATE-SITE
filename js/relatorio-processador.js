// ========== PROCESSADOR DE RELATÓRIO DE RUPTURA ==========

class RelatorioProcessor {
    constructor() {
        this.dadosProcessados = null;
        this.lojas = [];
        this.estatisticas = {};
        this.previewOriginal = "";
        this.ultimosFiltros = {};
        console.log("RelatorioProcessor inicializado");
    }

    // Usar o mapa de compradores do config.js
    getComprador(grupo) {
        if (typeof CONFIG !== "undefined" && CONFIG.COMPRADORES) {
            return CONFIG.COMPRADORES[grupo] || "NAO MAPEADO";
        }
        
        // Fallback (caso o config nao esteja disponivel)
        const MAPA_COMPRADORES = {
            "QUEIJOS ESPECIAIS": "Anderson",
            "EMBUTIDOS/DEFUMADOS": "Anderson",
            "PRESUNTARIA/MORTADELA": "Anderson",
            "QUEIJOS COMODITIES": "Anderson",
            "MARGARINAS/MANTEIGAS": "Anderson",
            "REQUEIJAO/QUEIJOS CREMOSOS": "Anderson",
            "IOGURTES": "Anderson",
            "ANTEPASTOS/SOBREMESAS/APER": "Anderson",
            "MASSAS REFRIGERADAS": "Anderson",
            "BEBIDAS LACTEAS": "Anderson",
            "ARTIGOS CHURRASCO": "Erilana",
            "BAZAR": "Erilana",
            "PLANTAS": "Erilana",
            "BOMBONIERE": "Joseane",
            "MERCEARIA DOCE": "Joseane",
            "MATINAIS": "Joseane",
            "CONGELADOS": "Joseane",
            "BEBIDAS NAO ALCOOLICAS": "Andreia Silva",
            "BEBIDAS ALCOOLICAS": "Andreia Silva",
            "SUPLEMENTOS NUTRICIONAIS": "Andreia Silva",
            "LIMPEZA": "Marcelo",
            "HIGIENE E PERFUMARIA": "Marcelo",
            "DESCARTAVEIS": "Marcelo",
            "APERITIVOS/SALGADINHOS": "Marcelo",
            "DIANTEIRA C/ OSSO": "Glacirene",
            "DIANTEIRA S/ OSSO": "Glacirene",
            "TRASEIRA S/ OSSO": "Glacirene",
            "AVES": "Glacirene",
            "TRASEIRA C/ OSSO": "Glacirene",
            "INDUSTRIALIZADOS": "Glacirene",
            "MIUDOS": "Glacirene",
            "SUINOS": "Glacirene",
            "OVINOS": "Glacirene",
            "PEIXES / MARISCOS": "Glacirene",
            "FRUTAS": "Joao",
            "LEGUMES": "Joao",
            "VERDURAS": "Joao",
            "OVOS": "Joao",
            "TEMPEROS/CONDIMENTOS": "Wendell",
            "CONSERVAS": "Wendell",
            "MASSAS": "Wendell",
            "MOLHOS/ATOMATADOS": "Wendell",
            "AZEITES/OLEOS": "Wendell",
            "FARINACEOS/FERMENTOS": "Wendell",
            "GRAOS": "Wendell",
            "FRUTAS SECAS": "Jhonatan",
            "ROTISSERIA": "Jhonatan",
            "PADARIA": "Jhonatan",
            "GERAL": "Jhonatan",
            "DOCURAS": "Jhonatan",
            "BACALHAU": "Jhonatan",
            "PADARIA INDUSTRIALIZADO": "Jhonatan"
        };
        return MAPA_COMPRADORES[grupo] || "NAO MAPEADO";
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
            
            produtos.push({
                codigo: codigo,
                codigoInt: parseInt(codigo),
                produto: String(produto).substring(0, 100),
                estoqueLoja: estoqueLoja,
                loja: loja,
                categoria: categoria,
                grupo: grupo,
                subgrupo: subgrupo,
                fornecedor: fornecedor
            });
        }
        console.log("Estoque processado: " + produtos.length + " produtos");
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
        
        if (vendas.length > 0) {
            console.log("Primeiras 5 vendas:");
            vendas.slice(0, 5).forEach(v => {
                console.log("   Codigo: " + v.codigo + ", Loja: " + v.loja + ", Qtd: " + v.qtd);
            });
        }
        
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
        console.log("Mapa de vendas criado com " + vendasMap.size + " combinacoes");
        
        const mediaMap = new Map();
        for (const media of dadosMedia) {
            const key = media.codigo + "|" + media.loja;
            mediaMap.set(key, media.qtd);
        }
        console.log("Mapa de media criado com " + mediaMap.size + " combinacoes");
        
        const nomeMatriz = "COMCARNE MATRIZ SAO LUIS";
        const matrizNormalizada = this.normalizarLoja(nomeMatriz);
        const estoqueMatriz = new Map();
        for (const estq of dadosEstoque) {
            if (estq.loja === matrizNormalizada) {
                estoqueMatriz.set(estq.codigo, estq.estoqueLoja);
            }
        }
        console.log("Estoque matriz calculado para " + estoqueMatriz.size + " produtos");
        
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
            
            resultados.push({
                codigo: estq.codigoInt,
                produto: estq.produto,
                categoria: estq.categoria || "NAO MAPEADO",
                grupo: estq.grupo || "NAO MAPEADO",
                comprador: this.getComprador(estq.grupo),
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
        
        console.log("Cadeamento: " + comVenda + " produtos com venda, " + (dadosEstoque.length - comVenda) + " sem venda");
        
        this.dadosProcessados = resultados;
        this.lojas = [...new Set(resultados.map(r => r.loja))];
        
        this.atualizarEstatisticas();
        
        console.log("Relatorio gerado: " + resultados.length + " linhas, " + this.lojas.length + " lojas");
        
        return {
            success: true,
            dados: resultados,
            estatisticas: this.estatisticas,
            lojas: this.lojas
        };
    }

    atualizarEstatisticas() {
        const resultados = this.dadosProcessados;
        if (!resultados) return;
        
        const totalRuptura = resultados.filter(r => r.ruptura === "RUPTURA").length;
        const totalSemEstoque = resultados.filter(r => r.estqLoja === 0).length;
        const produtosUnicos = [...new Set(resultados.map(r => r.codigo))].length;
        
        this.estatisticas = {
            totalRegistros: resultados.length,
            totalProdutosUnicos: produtosUnicos,
            totalLojas: this.lojas.length,
            totalRuptura: totalRuptura,
            totalSemEstoque: totalSemEstoque,
            totalComEstoque: produtosUnicos - totalSemEstoque,
            percentualRuptura: produtosUnicos > 0 ? (totalRuptura / produtosUnicos) * 100 : 0,
            quantidadeTotal: resultados.reduce((s, r) => s + r.estqLoja, 0),
            valorTotal: resultados.reduce((s, r) => s + r.valorEstoque, 0),
            porLoja: {}
        };
        
        for (const loja of this.lojas) {
            const pl = resultados.filter(r => r.loja === loja);
            this.estatisticas.porLoja[loja] = {
                quantidade: pl.reduce((s, r) => s + r.estqLoja, 0),
                valor: pl.reduce((s, r) => s + r.valorEstoque, 0),
                produtos: pl.length,
                ruptura: pl.filter(r => r.ruptura === "RUPTURA").length
            };
        }
    }

    filtrarPorLojas(lojasSelecionadas) {
        if (!this.dadosProcessados) return [];
        if (!lojasSelecionadas || lojasSelecionadas.length === 0) return this.dadosProcessados;
        const lojasNorm = lojasSelecionadas.map(l => this.normalizarLoja(l));
        return this.dadosProcessados.filter(p => lojasNorm.includes(this.normalizarLoja(p.loja)));
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

    getValoresUnicos() {
        if (!this.dadosProcessados) return {};
        return {
            "LOJA": [...new Set(this.dadosProcessados.map(p => p.loja))].sort(),
            "RUPTURA": [...new Set(this.dadosProcessados.map(p => p.ruptura))].sort(),
            "STATUS DO ESTOQUE": [...new Set(this.dadosProcessados.map(p => p.statusEstoque))].sort(),
            "CATEGORIA": [...new Set(this.dadosProcessados.map(p => p.categoria))].filter(c => c && c !== "NAO MAPEADO").sort(),
            "GRUPO": [...new Set(this.dadosProcessados.map(p => p.grupo))].filter(g => g && g !== "NAO MAPEADO").sort(),
            "VENDA": [...new Set(this.dadosProcessados.map(p => p.venda))].sort(),
            "COMPRADOR": [...new Set(this.dadosProcessados.map(p => p.comprador))].filter(c => c !== "NAO MAPEADO").sort()
        };
    }

    exportarParaExcel(lojasSelecionadas = null) {
        let dados = this.dadosProcessados;
        if (lojasSelecionadas && lojasSelecionadas.length > 0) {
            const lojasNorm = lojasSelecionadas.map(l => this.normalizarLoja(l));
            dados = dados.filter(p => lojasNorm.includes(this.normalizarLoja(p.loja)));
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
