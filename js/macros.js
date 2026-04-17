// ========== MACROS DE LOJAS ==========

const MACROS_LOJAS = {
    emporio: [
        "PONTA D AREIA", "CALHAU", "PENINSULA PTA AREIA", "COHAMA",
        "EMPORIO FRIBAL TERESINA", "EMPORIO IMPERATRIZ", "TURU"
    ],
    mercearia: [
        "CURVA DO 90", "MERCEARIA SANTA INES", "MERCEARIA MAIOBAO"
    ]
};

const CORES_MACROS = {
    emporio: "#51cf66",
    mercearia: "#ffd43b",
    outros: "#4dabf7"
};

function getMacroLoja(loja) {
    if (MACROS_LOJAS.emporio.includes(loja)) return "emporio";
    if (MACROS_LOJAS.mercearia.includes(loja)) return "mercearia";
    return "outros";
}