// ========== UTILIDADES ==========

function formatarMoeda(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarNumero(valor, decimais = 2) {
    if (valor === undefined || valor === null || isNaN(valor)) return '0';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

function formatarQuantidade(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return '0,000';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function showToast(mensagem, tipo = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `${tipo === 'success' ? '✓' : '⚠️'} ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function parseCSVLinha(linha) {
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