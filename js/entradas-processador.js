// ========== PROCESSADOR DE ENTRADAS POR GRUPO ==========
// Usa o mapeamento de compradores do compradores.js

class EntradasProcessor {
    constructor() {
        this.dadosProcessados = null;
        this.grupos = [];
        this.compradores = [];
        this.estatisticas = {};
        console.log("EntradasProcessor inicializado");
    }

    async processarArquivo(file, basePrecos) {
        console.log("processarArquivo Entradas:", file.name);
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const fileName = file.name.toLowerCase();
                    
                    let workbook;
                    if (fileName.endsWith(".xls")) {
                        workbook = XLSX.read(data, { type: "array", bookType: "xls" });
                    } else {
                        workbook = XLSX.read(data, { type: "array" });
                    }
                    
                    const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];
                    const dadosRaw = XLSX.utils.sheet_to_json(primeiraPlanilha, { header: 1, defval: "" });
                    
                    console.log("Planilha Entradas:", dadosRaw.length, "linhas");
                    
                    const resultado = this.processarDados(dadosRaw, basePrecos);
                    resolve(resultado);
                } catch (error) {
                    console.error("Erro:", error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
            reader.readAsArrayBuffer(file);
        });
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

    processarDados(dadosRaw, basePrecos) {
        console.log("Processando Entradas...");
        
        const todosDados = [];
        
        let catCodigo = "";
        let catNome = "";
        let grupoCodigo = "";
        let grupoNome = "";
        
        console.log("Varrendo linha por linha...");
        
        for (let i = 0; i < dadosRaw.length; i++) {
            const linha = dadosRaw[i];
            if (!linha || !Array.isArray(linha)) continue;
            
            const primeira = linha[0] !== undefined ? String(linha[0]).trim() : "";
            const primeiraLower = primeira.toLowerCase();
            
            if (primeiraLower.includes("categoria:")) {
                catCodigo = (linha[1] !== undefined) ? String(linha[1]).replace(/^0+/, "") : "";
                catNome = (linha[2] !== undefined) ? String(linha[2]).trim() : "";
                grupoCodigo = (linha[4] !== undefined) ? String(linha[4]).replace(/^0+/, "") : "";
                grupoNome = (linha[5] !== undefined) ? String(linha[5]).trim() : "";
                
                console.log("Linha " + i + ": Categoria " + catCodigo + "-" + catNome + ", Grupo " + grupoCodigo + "-" + grupoNome);
                continue;
            }
            
            const primeiroChar = String(primeira).charAt(0);
            if (primeiroChar >= "0" && primeiroChar <= "9") {
                const linhaProduto = [];
                for (let j = 0; j <= 10; j++) {
                    if (j < linha.length && linha[j] !== undefined && linha[j] !== "") {
                        linhaProduto.push(String(linha[j]).trim());
                    } else {
                        linhaProduto.push("");
                    }
                }
                
                linhaProduto.push(catNome);
                linhaProduto.push(grupoNome);
                linhaProduto.push("");
                
                todosDados.push(linhaProduto);
            }
        }
        
        console.log("Total de produtos encontrados: " + todosDados.length);
        
        if (todosDados.length === 0) {
            return { success: false, error: "Nenhum produto encontrado", dados: [], grupos: [], compradores: [], estatisticas: {} };
        }
        
        const colunas = [
            "Codigo", "Produto", "Pecas", "Qtd", "Unid",
            "Custo Md", "Total", "Pr. Vda", "Markup", "Margem", "Ult.Ent.",
            "Categoria", "Grupo", "Comprador"
        ];
        
        const produtos = [];
        
        for (const row of todosDados) {
            const produto = {};
            
            for (let j = 0; j < colunas.length && j < row.length; j++) {
                produto[colunas[j]] = row[j];
            }
            
            produto["Codigo"] = String(produto["Codigo"] || "").replace(/^0+/, "");
            produto["CodigoInt"] = parseInt(produto["Codigo"]) || 0;
            produto["Qtd"] = this.converterNumeroBR(produto["Qtd"]);
            produto["Total"] = this.converterNumeroBR(produto["Total"]);
            produto["Custo Md"] = this.converterNumeroBR(produto["Custo Md"]);
            produto["Pr. Vda"] = this.converterNumeroBR(produto["Pr. Vda"]);
            produto["Markup"] = this.converterNumeroBR(produto["Markup"]);
            produto["Margem"] = this.converterNumeroBR(produto["Margem"]);
            produto["Pecas"] = this.converterNumeroBR(produto["Pecas"]);
            
            // Usar a funcao getComprador do compradores.js
            produto["Comprador"] = getComprador(produto["Grupo"]);
            
            produtos.push({
                codigo: produto["Codigo"],
                codigoInt: produto["CodigoInt"],
                produto: (produto["Produto"] || "").substring(0, 100),
                pecas: produto["Pecas"] || 0,
                qtd: produto["Qtd"] || 0,
                unid: produto["Unid"] || "",
                custoMd: produto["Custo Md"] || 0,
                total: produto["Total"] || 0,
                prVda: produto["Pr. Vda"] || 0,
                markup: produto["Markup"] || 0,
                margem: produto["Margem"] || 0,
                ultEnt: produto["Ult.Ent."] || "",
                categoria: produto["Categoria"] || "NAO MAPEADO",
                grupo: produto["Grupo"] || "NAO MAPEADO",
                comprador: produto["Comprador"]
            });
        }
        
        const produtosFiltrados = produtos.filter(p => p.codigoInt !== 0);
        
        console.log("Produtos apos filtro: " + produtosFiltrados.length);
        
        if (produtosFiltrados.length === 0) {
            return { success: false, error: "Nenhum produto valido encontrado", dados: [], grupos: [], compradores: [], estatisticas: {} };
        }
        
        this.dadosProcessados = produtosFiltrados;
        this.grupos = [...new Set(produtosFiltrados.map(p => p.grupo))];
        this.compradores = [...new Set(produtosFiltrados.map(p => p.comprador))];
        
        const quantidadeTotal = produtosFiltrados.reduce((s, p) => s + p.qtd, 0);
        const valorTotal = produtosFiltrados.reduce((s, p) => s + p.total, 0);
        
        const porGrupo = {};
        for (const grupo of this.grupos) {
            const pg = produtosFiltrados.filter(p => p.grupo === grupo);
            porGrupo[grupo] = {
                quantidade: pg.reduce((s, p) => s + p.qtd, 0),
                valor: pg.reduce((s, p) => s + p.total, 0),
                produtos: pg.length
            };
        }
        
        const porComprador = {};
        for (const comprador of this.compradores) {
            const pc = produtosFiltrados.filter(p => p.comprador === comprador);
            porComprador[comprador] = {
                quantidade: pc.reduce((s, p) => s + p.qtd, 0),
                valor: pc.reduce((s, p) => s + p.total, 0),
                produtos: pc.length,
                grupos: [...new Set(pc.map(p => p.grupo))]
            };
        }
        
        this.estatisticas = {
            totalRegistros: produtosFiltrados.length,
            totalProdutosUnicos: [...new Set(produtosFiltrados.map(p => p.codigo))].length,
            totalGrupos: this.grupos.length,
            totalCompradores: this.compradores.length,
            quantidadeTotal: quantidadeTotal,
            valorTotal: valorTotal,
            porGrupo: porGrupo,
            porComprador: porComprador
        };
        
        console.log("Processado: " + produtosFiltrados.length + " registros, " + this.grupos.length + " grupos, " + this.compradores.length + " compradores");
        
        return {
            success: true,
            dados: produtosFiltrados,
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
console.log("EntradasProcessor carregado e instanciado");