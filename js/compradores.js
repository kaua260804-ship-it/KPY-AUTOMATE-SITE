// ========== MAPEAMENTO DE COMPRADORES ==========
// Baseado no compradores.py original

const GRUPO_COMPRADOR = {
    // Anderson
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
    
    // Erilana
    'ARTIGOS CHURRASCO': 'Erilana',
    'BAZAR': 'Erilana',
    'BOMBONIERE': 'Erilana',
    'MERCEARIA DOCE': 'Erilana',
    'MATINAIS': 'Erilana',
    'PLANTAS': 'Erilana',
    
    // Andreia Silva
    'BEBIDAS NAO ALCOOLICAS': 'Andreia Silva',
    'BEBIDAS ALCOOLICAS': 'Andreia Silva',
    'SUPLEMENTOS NUTRICIONAIS': 'Andreia Silva',
    
    // Euclides
    'MAT.P/CONVENIENCIA/PADARIA': 'Euclides',
    'MAT.P/COPA E COZINHA': 'Euclides',
    'INSUMOS': 'Euclides',
    'MAT.SEG.PROT.UNIFORM': 'Euclides',
    'MEDICAMENTOS': 'Euclides',
    'PECAS P/VEICULOS': 'Euclides',
    'MAT.MANUT.MECANICA': 'Euclides',
    'SERV.MANUT.VEICULOS': 'Euclides',
    'COMBUSTIVEIS': 'Euclides',
    'MAT.DE ESCRITORIO': 'Euclides',
    'UTENSILIOS E ACESSOR': 'Euclides',
    'EQPTOS.USADOS C/COND - GP 2': 'Euclides',
    'MAT. DE REFRIGERACAO': 'Euclides',
    'MAT.DE LIMPEZA': 'Euclides',
    'MAT.DE EMBALAGENS': 'Euclides',
    'MAT.DIVERSOS': 'Euclides',
    'FERRAM. E ACESSORIOS': 'Euclides',
    'MAT.DE IMOBILIZADO': 'Euclides',
    'MAT.MANUT.ELETRICA': 'Euclides',
    'MAO-DE-OBRA REFORMAS/MANUTENC': 'Euclides',
    'OUTROS INVESTIMENTOS': 'Euclides',
    'AQUIS. EQUIP. P/REESTUTURACAO': 'Euclides',
    'CESTA BASICA - FUNCIONARIOS': 'Euclides',
    'MATS/EQUIP.COHATRAC3': 'Euclides',
    'OBRAS CIVIS': 'Euclides',
    'OLEOS E LUBRIFICANTES': 'Euclides',
    'OUTRAS DESP.C/PESSOAL': 'Euclides',
    'PROPAGANDAS/PUBLIC.': 'Euclides',
    'EVENTOS E COMEMORACOES': 'Euclides',
    'MAT. E EMBALAGENS E-COMMERCE': 'Euclides',
    'MAT. PARA LAVAGEM VEICULOS': 'Euclides',
    'DOACOES E BRINDES': 'Euclides',
    'MATS/EQUIP. COHAMA': 'Euclides',
    
    // Glacirene
    'DIANTEIRA C/ OSSO': 'Glacirene',
    'DIANTEIRA S/ OSSO': 'Glacirene',
    'TRASEIRA S/ OSSO': 'Glacirene',
    'AVES': 'Glacirene',
    'TRASEIRA C/ OSSO': 'Glacirene',
    'INDUSTRIALIZADOS': 'Glacirene',
    'MIUDOS': 'Glacirene',
    'SUINOS': 'Glacirene',
    'PONTA DA AGULHA': 'Glacirene',
    'OVINOS': 'Glacirene',
    'OSSO E SEBO': 'Glacirene',
    'PEIXES / MARISCOS': 'Glacirene',
    'ANIMAIS': 'Glacirene',
    
    // Joao
    'FRUTAS': 'Joao',
    'LEGUMES': 'Joao',
    'VERDURAS': 'Joao',
    'OVOS': 'Joao',
    
    // Joseane
    'CONGELADOS': 'Joseane',
    'TEMPEROS/CONDIMENTOS': 'Joseane',
    'APERITIVOS/SALGADINHOS': 'Joseane',
    'AZEITES/OLEOS': 'Joseane',
    'FARINACEOS/FERMENTOS': 'Joseane',
    'CONSERVAS': 'Joseane',
    'MASSAS': 'Joseane',
    'MOLHOS/ATOMATADOS': 'Joseane',
    'SOPAS': 'Joseane',
    'GRAOS': 'Joseane',
    
    // Marcelo
    'LIMPEZA': 'Marcelo',
    'HIGIENE E PERFUMARIA': 'Marcelo',
    'DESCARTAVEIS': 'Marcelo',
    
    // Renato
    'FRUTAS SECAS': 'Renato',
    'ROTISSERIA': 'Renato',
    'CONFEITARIA DOCE': 'Renato',
    'GERAL': 'Renato',
    'CONFEITARIA SALGADA': 'Renato',
    'BACALHAU': 'Renato',
    'MATERIA-PRIMA': 'Renato',
    'PADARIA': 'Renato',
    'ENCOMENDAS': 'Renato',
    'DOCURAS': 'Renato',
    'SOBREMESAS / CREMES': 'Renato',
    'ACAIS': 'Renato',
    'CAFETERIA': 'Renato',
    'SANDUICHES TRADICIONAIS': 'Renato',
    'ALMOCO': 'Renato',
    'ADICIONAIS': 'Renato',
    'BEBIDAS': 'Renato',
    'LANCHES DA CASA': 'Renato',
    'HAMBUGUERES': 'Renato',
    'SALGADOS': 'Renato',
    'BEIRUTES': 'Renato',
    'PADARIA INDUSTRIALIZADO': 'Renato',
    'CAFE DA MANHA': 'Renato',
    'APERITIVOS WB': 'Renato',
    'CREPIOCAS': 'Renato',
    'OMELETES': 'Renato',
    'PIZZAS': 'Renato',
    'SALADAS E PRATOS': 'Renato',
    'SALADAS DE FRUTA': 'Renato',
    'SUCOS NATURAIS': 'Renato',
    'TAPIOCAS': 'Renato'
};

function getComprador(grupo) {
    return GRUPO_COMPRADOR[grupo] || 'NAO MAPEADO';
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