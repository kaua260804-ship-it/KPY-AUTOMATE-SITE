// ========== MAPEAMENTO DE COMPRADORES ==========
// Baseado no compradores.py original

const GRUPO_COMPRADOR = {
    // Joao
    "FRUTAS": "Joao",
    "VERDURAS": "Joao",
    "LEGUMES": "Joao",
    "OVOS": "Joao",
    "HORTALICAS": "Joao",
    
    // Joseane
    "MERCEARIA DOCE": "Joseane",
    "CONGELADOS": "Joseane",
    "MATINAIS": "Joseane",
    "BOMBONIERE": "Joseane",
    
    // Jhonatan
    "FRUTAS SECAS": "Jhonatan",
    "ROTISSERIA": "Jhonatan",
    "ACAIS": "Jhonatan",
    "MATERIA-PRIMA": "Jhonatan",
    "CAFETERIA": "Jhonatan",
    "SANDUICHES TRADICIONAIS": "Jhonatan",
    "ADICIONAIS": "Jhonatan",
    "BEBIDAS": "Jhonatan",
    "CONFEITARIA DOCE": "Jhonatan",
    "LANCHES DA CASA": "Jhonatan",
    "BACALHAU": "Jhonatan",
    "PADARIA": "Jhonatan",
    "HAMBUGUERES": "Jhonatan",
    "BEIRUTES": "Jhonatan",
    "CONFEITARIA SALGADA": "Jhonatan",
    "PADARIA INDUSTRIALIZADO": "Jhonatan",
    "DOCURAS": "Jhonatan",
    "ENCOMENDAS": "Jhonatan",
    "CAFE DA MANHA": "Jhonatan",
    "SALGADOS": "Jhonatan",
    "CREPIOCAS": "Jhonatan",
    "SOBREMESAS / CREMES": "Jhonatan",
    "GERAL": "Jhonatan",
    "OMELETES": "Jhonatan",
    "PIZZAS": "Jhonatan",
    "SALADAS E PRATOS": "Jhonatan",
    "SALADAS DE FRUTA": "Jhonatan",
    "SUCOS NATURAIS": "Jhonatan",
    "TAPIOCAS": "Jhonatan",
    "ALMOCO": "Jhonatan",
    "APERITIVOS WB": "Jhonatan",
    
    // Wendell
    "CONSERVAS": "Wendell",
    "TEMPEROS/CONDIMENTOS": "Wendell",
    "FARINACEOS/FERMENTOS": "Wendell",
    "GRAOS": "Wendell",
    "AZEITES/OLEOS": "Wendell",
    "MOLHOS/ATOMATADOS": "Wendell",
    "MASSAS": "Wendell",
    
    // Erilana
    "BAZAR": "Erilana",
    "ARTIGOS CHURRASCO": "Erilana",
    "PLANTAS": "Erilana",
    
    // Marcelo
    "HIGIENE E PERFUMARIA": "Marcelo",
    "LIMPEZA": "Marcelo",
    "DESCARTAVEIS": "Marcelo",
    "APERITIVOS/SALGADINHOS": "Marcelo",
    
    // Euclides
    "MAT.DE EMBALAGENS": "Euclides",
    "MAT.MANUT.MECANICA": "Euclides",
    "MAT.SEG.PROT.UNIFORM": "Euclides",
    "MAT.DE ESCRITORIO": "Euclides",
    "MAT.P/CONVENIENCIA/PADARIA": "Euclides",
    "UTENSILIOS E ACESSOR": "Euclides",
    "PROPAGANDAS/PUBLIC.": "Euclides",
    "INSUMOS": "Euclides",
    "FERRAM. E ACESSORIOS": "Euclides",
    "MAT.DE LIMPEZA": "Euclides",
    "MEDICAMENTOS": "Euclides",
    "MAT.MANUT.ELETRICA": "Euclides",
    "MAT.DE IMOBILIZADO": "Euclides",
    "MATS/EQUIP.COHATRAC3": "Euclides",
    "OUTROS INVESTIMENTOS": "Euclides",
    "MAT. E EMBALAGENS E-COMMERCE": "Euclides",
    "MAT.DIVERSOS": "Euclides",
    "MAT.P/COPA E COZINHA": "Euclides",
    "NAO MAPEADO": "Euclides",
    
    // Glacirene
    "DIANTEIRA S/ OSSO": "Glacirene",
    "DIANTEIRA C/ OSSO": "Glacirene",
    "OVINOS": "Glacirene",
    "TRASEIRA C/ OSSO": "Glacirene",
    "TRASEIRA S/ OSSO": "Glacirene",
    "SUINOS": "Glacirene",
    "AVES": "Glacirene",
    "INDUSTRIALIZADOS": "Glacirene",
    "MIUDOS": "Glacirene",
    "PONTA DA AGULHA": "Glacirene",
    "OSSO E SEBO": "Glacirene",
    "PEIXES / MARISCOS": "Glacirene",
    
    // Anderson
    "EMBUTIDOS/DEFUMADOS": "Anderson",
    "MARGARINAS/MANTEIGAS": "Anderson",
    "BEBIDAS LACTEAS": "Anderson",
    "PRESUNTARIA/MORTADELA": "Anderson",
    "ANTEPASTOS/SOBREMESAS/APER": "Anderson",
    "IOGURTES": "Anderson",
    "REQUEIJAO/QUEIJOS CREMOSOS": "Anderson",
    "MASSAS REFRIGERADAS": "Anderson",
    "QUEIJOS COMODITIES": "Anderson",
    "QUEIJOS ESPECIAIS": "Anderson",
    
    // Andreia Silva
    "BEBIDAS NAO ALCOOLICAS": "Andreia Silva",
    "BEBIDAS ALCOOLICAS": "Andreia Silva",
    "SUPLEMENTOS NUTRICIONAIS": "Andreia Silva",
    
    // Afranio
    "EVENTOS": "Afranio",
    "CURSO DE GASTRONOMIA": "Afranio",
    "CURSOS DE VINHOS": "Afranio",
    "BUFFET": "Afranio"
};

function getComprador(grupo) {
    return GRUPO_COMPRADOR[grupo] || "NAO MAPEADO";
}

function getGruposPorComprador(comprador) {
    const grupos = [];
    for (const [grupo, comp] of Object.entries(GRUPO_COMPRADOR)) {
        if (comp === comprador) {
            grupos.push(grupo);
        }
    }
    return grupos;
}

function getEstatisticasMapeamento() {
    const compradores = {};
    for (const comp of Object.values(GRUPO_COMPRADOR)) {
        compradores[comp] = (compradores[comp] || 0) + 1;
    }
    return {
        totalGrupos: Object.keys(GRUPO_COMPRADOR).length,
        totalCompradores: Object.keys(compradores).length,
        gruposPorComprador: compradores
    };
}
