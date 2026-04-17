// ========== CONFIGURACOES DO SISTEMA ==========

const CONFIG = {
    VERSAO: "3.0.0",
    APP_NOME: "K'PY AUTOMATE",
    
    // Macros de lojas
    MACROS: {
        emporio: [
            "PONTA D AREIA", "CALHAU", "PENINSULA PTA AREIA", "COHAMA",
            "EMPORIO FRIBAL TERESINA", "EMPORIO IMPERATRIZ", "TURU"
        ],
        mercearia: [
            "CURVA DO 90", "MERCEARIA SANTA INES", "MERCEARIA MAIOBAO"
        ]
    },
    
    // Mapeamento de compradores por grupo
    COMPRADORES: {
        // Anderson
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
        
        // Erilana
        "ARTIGOS CHURRASCO": "Erilana",
        "BAZAR": "Erilana",
        "PLANTAS": "Erilana",
        
        // Joseane
        "BOMBONIERE": "Joseane",
        "MERCEARIA DOCE": "Joseane",
        "MATINAIS": "Joseane",
        "CONGELADOS": "Joseane",
        
        // Andreia Silva
        "BEBIDAS NAO ALCOOLICAS": "Andreia Silva",
        "BEBIDAS ALCOOLICAS": "Andreia Silva",
        "SUPLEMENTOS NUTRICIONAIS": "Andreia Silva",
        
        // Marcelo
        "LIMPEZA": "Marcelo",
        "HIGIENE E PERFUMARIA": "Marcelo",
        "DESCARTAVEIS": "Marcelo",
        
        // Glacirene
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
        
        // Joao
        "FRUTAS": "Joao",
        "LEGUMES": "Joao",
        "VERDURAS": "Joao",
        "OVOS": "Joao",
        
        // Wendell
        "TEMPEROS/CONDIMENTOS": "Wendell",
        "CONSERVAS": "Wendell",
        "MASSAS": "Wendell",
        "MOLHOS/ATOMATADOS": "Wendell",
        
        // Jhonatan
        "FRUTAS SECAS": "Jhonatan",
        "ROTISSERIA": "Jhonatan",
        "PADARIA": "Jhonatan",
        "GERAL": "Jhonatan",
        "DOCURAS": "Jhonatan"
    },
    
    // Cores dos macros
    CORES: {
        emporio: "#51cf66",
        mercearia: "#ffd43b",
        outros: "#4dabf7"
    }
};

function getComprador(grupo) {
    return CONFIG.COMPRADORES[grupo] || "NAO MAPEADO";
}

function getMacroLoja(loja) {
    if (CONFIG.MACROS.emporio.includes(loja)) return "emporio";
    if (CONFIG.MACROS.mercearia.includes(loja)) return "mercearia";
    return "outros";
}
