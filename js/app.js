// ========== APLICAÇÃO PRINCIPAL ==========

let paginaAtual = 'dashboard';

async function carregarPagina(page) {
    const container = document.getElementById('pageContainer');
    const pageTitle = document.getElementById('pageTitle');
    
    if (!container) return;
    
    paginaAtual = page;
    
    const titles = {
        'dashboard': 'Dashboard',
        'curva-abc': 'Curva ABC por Loja',
        'entradas': 'Entradas por Grupo',
        'produtos-sem-venda': 'Produtos sem Venda',
        'relatorio': 'Criar Relatório'
    };
    if (pageTitle) pageTitle.textContent = titles[page] || "K'PY AUTOMATE";
    
    container.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-pulse"></i><p>Carregando...</p></div>`;
    
    // Garantir que a base de preços está carregada
    if (processador.dadosPrecos.length === 0) {
        await processador.carregarBasePrecos();
    }
    
    let html = '';
    switch(page) {
        case 'dashboard':
            html = renderDashboard();
            break;
        case 'curva-abc':
            html = renderizarCurvaABC();
            break;
        case 'entradas':
            html = renderizarEntradas();
            break;
        case 'produtos-sem-venda':
            html = renderizarProdutosSemVenda();
            break;
        case 'relatorio':
            html = renderizarSeletorModelo();
            break;
        default:
            html = renderDashboard();
    }
    
    container.innerHTML = html;
    
    // Inicializar a tela correspondente
    if (page === 'curva-abc') {
        inicializarCurvaABC();
    } else if (page === 'entradas') {
        inicializarEntradas();
    } else if (page === 'produtos-sem-venda') {
        inicializarProdutos();
    } else if (page === 'relatorio') {
        inicializarSeletor();
    }
}

function renderDashboard() {
    const stats = processador.getEstatisticas();
    
    return `
        <div class="cards-grid">
            <div class="card">
                <div class="card-title">📦 TOTAL DE PRODUTOS</div>
                <div class="card-value">${stats.totalProdutos.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">💰 COM PREÇO</div>
                <div class="card-value">${stats.produtosComPreco.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">🚫 SEM PREÇO</div>
                <div class="card-value">${stats.produtosSemPreco.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-title">💰 PREÇO MÉDIO</div>
                <div class="card-value">${formatarMoeda(stats.precoMedio)}</div>
            </div>
            <div class="card">
                <div class="card-title">📁 CATEGORIAS</div>
                <div class="card-value">${stats.totalCategorias}</div>
            </div>
            <div class="card">
                <div class="card-title">📂 GRUPOS</div>
                <div class="card-value">${stats.totalGrupos}</div>
            </div>
        </div>
        <div class="preview-area">
            <div class="preview-header">
                <h4><i class="fas fa-database"></i> Base de Preços (primeiros 20)</h4>
            </div>
            <div class="preview-content">
                <pre>${formatarPreview(processador.dadosPrecos.slice(0, 20))}</pre>
            </div>
        </div>
    `;
}

function formatarPreview(dados) {
    if (!dados || dados.length === 0) return 'Nenhum dado disponível';
    
    let output = 'CÓDIGO    PRODUTO                                    PREÇO       CATEGORIA\n';
    output += '------    ----------------------------------------  ----------  ------------------\n';
    
    dados.forEach(p => {
        const codigo = (p.codigo || '').slice(0, 8).padEnd(8);
        const produto = (p.produto || '').slice(0, 40).padEnd(40);
        const preco = formatarMoeda(p.preco).padStart(10);
        const categoria = (p.categoria || 'NÃO MAPEADO').slice(0, 18).padEnd(18);
        output += `${codigo}  ${produto}  ${preco}  ${categoria}\n`;
    });
    
    return output;
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.onclick = () => {
            const page = item.dataset.page;
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            carregarPagina(page);
        };
    });
}

function initAuth() {
    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('appContainer');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const userNameSpan = document.getElementById('userName');
    const userEmailSpan = document.getElementById('userEmail');
    
    if (auth.isLoggedIn()) {
        const user = auth.getUsuario();
        loginContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        if (userNameSpan) userNameSpan.textContent = user.nome;
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        carregarPagina('dashboard');
    }
    
    if (btnLogin) {
        btnLogin.onclick = async () => {
            const email = document.getElementById('loginEmail').value;
            const senha = document.getElementById('loginPassword').value;
            
            if (auth.login(email, senha)) {
                const user = auth.getUsuario();
                loginContainer.style.display = 'none';
                appContainer.style.display = 'flex';
                if (userNameSpan) userNameSpan.textContent = user.nome;
                if (userEmailSpan) userEmailSpan.textContent = user.email;
                await processador.carregarBasePrecos();
                carregarPagina('dashboard');
                showToast('Login realizado!', 'success');
            } else {
                showToast('E-mail ou senha inválidos!', 'error');
            }
        };
    }
    
    if (btnLogout) {
        btnLogout.onclick = () => {
            auth.logout();
            loginContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            showToast('Logout realizado', 'info');
        };
    }
    
    const senhaInput = document.getElementById('loginPassword');
    if (senhaInput) {
        senhaInput.onkeypress = (e) => {
            if (e.key === 'Enter' && btnLogin) btnLogin.click();
        };
    }
}

function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle) {
        menuToggle.onclick = () => sidebar.classList.toggle('mobile-open');
    }
    
    if (window.innerWidth <= 768 && menuToggle) {
        menuToggle.style.display = 'block';
    }
}

function initLimparCache() {
    const btnLimparCache = document.getElementById('btnLimparCache');
    if (btnLimparCache) {
        btnLimparCache.onclick = () => {
            sessionStorage.clear();
            showToast('Cache limpo!', 'success');
            setTimeout(() => location.reload(), 1000);
        };
    }
}

function initAjuda() {
    const btnAjuda = document.getElementById('btnAjuda');
    const modal = document.getElementById('ajudaModal');
    const modalClose = document.querySelector('.modal-close');
    
    if (btnAjuda) {
        btnAjuda.onclick = () => modal.classList.add('active');
    }
    if (modalClose) modalClose.onclick = () => modal.classList.remove('active');
    if (modal) modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    
    document.onkeydown = (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            if (modal) modal.classList.add('active');
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    initMenuToggle();
    initLimparCache();
    initAjuda();
});