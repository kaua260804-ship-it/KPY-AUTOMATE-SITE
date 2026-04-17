// ========== SELETOR DE MODELO DE RELATÓRIO ==========

let modeloSelecionado = null;

function renderizarSeletorModelo() {
    return `
        <div class="cards-grid">
            <div class="card">
                <div class="card-title">📦 BASE DE PREÇOS</div>
                <div class="card-value">${processador.dadosPrecos.length.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">🚧 STATUS</div>
                <div class="card-value">Selecione um modelo</div>
            </div>
        </div>
        
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
            <!-- Modelo Ruptura -->
            <div class="card-modelo" id="modeloRuptura" style="width: 300px; cursor: pointer; text-align: center; padding: 30px; border-radius: 16px; background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%); border: 2px solid #404040; transition: all 0.3s ease;">
                <i class="fas fa-chart-line" style="font-size: 48px; color: #8b0000; margin-bottom: 15px;"></i>
                <h3 style="color: #ffffff; margin-bottom: 10px;">📊 RUPTURA</h3>
                <p style="color: #888888; font-size: 13px;">Relatório completo de ruptura combinando Estoque, Curva ABC e Média de Vendas</p>
                <div style="margin-top: 15px; font-size: 11px; color: #4caf50;">✓ Identifica produtos em ruptura</div>
                <div style="font-size: 11px; color: #4caf50;">✓ Calcula DDE (Dias de Estoque)</div>
                <div style="font-size: 11px; color: #4caf50;">✓ Mapeia compradores por grupo</div>
            </div>
            
            <!-- Modelo 2 (futuro) -->
            <div class="card-modelo" style="width: 300px; text-align: center; padding: 30px; border-radius: 16px; background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%); border: 2px solid #404040; opacity: 0.5;">
                <i class="fas fa-clock" style="font-size: 48px; color: #888888; margin-bottom: 15px;"></i>
                <h3 style="color: #888888; margin-bottom: 10px;">🚧 EM BREVE</h3>
                <p style="color: #666666; font-size: 13px;">Novos modelos de relatório serão adicionados em breve</p>
            </div>
        </div>
        
        <div class="preview-area" style="margin-top: 30px;">
            <div class="preview-header">
                <h4><i class="fas fa-info-circle"></i> Instruções</h4>
            </div>
            <div class="preview-content">
                <p><strong>📋 Criar Relatório</strong></p>
                <p>Selecione um modelo de relatório para começar.</p>
                <p><strong>Modelo de Ruptura:</strong> Combina arquivos de Estoque, Curva ABC e Média de Vendas para identificar produtos em ruptura.</p>
                <p><strong>Arquivos necessários:</strong></p>
                <ul>
                    <li>Estoque (obrigatório)</li>
                    <li>Curva ABC por Loja (obrigatório)</li>
                    <li>Média de Vendas (arquivo fixo - media_vendas.xlsx)</li>
                </ul>
            </div>
        </div>
    `;
}

function inicializarSeletor() {
    console.log('🚀 inicializarSeletor chamado');
    
    const modeloRuptura = document.getElementById('modeloRuptura');
    if (modeloRuptura) {
        modeloRuptura.onclick = () => {
            console.log('📊 Modelo Ruptura selecionado');
            modeloSelecionado = 'ruptura';
            // Mudar para a tela de upload do relatório
            const container = document.getElementById('pageContainer');
            container.innerHTML = renderizarRelatorio();
            inicializarRelatorio();
        };
        
        // Efeito hover
        modeloRuptura.onmouseenter = () => {
            modeloRuptura.style.borderColor = '#8b0000';
            modeloRuptura.style.transform = 'translateY(-5px)';
        };
        modeloRuptura.onmouseleave = () => {
            modeloRuptura.style.borderColor = '#404040';
            modeloRuptura.style.transform = 'translateY(0)';
        };
    }
}