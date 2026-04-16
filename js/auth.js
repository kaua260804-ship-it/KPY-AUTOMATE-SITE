// ========== AUTENTICAÇÃO ==========

const USUARIOS = {
    'admin@kpy.com': { senha: 'admin123', nome: 'Administrador', email: 'admin@kpy.com' },
    'compras@kpy.com': { senha: 'compras123', nome: 'Equipe de Compras', email: 'compras@kpy.com' },
    'gerente@kpy.com': { senha: 'gerente123', nome: 'Gerente', email: 'gerente@kpy.com' }
};

class Auth {
    constructor() {
        this.usuarioLogado = null;
        this.carregarSessao();
    }

    carregarSessao() {
        const sessao = sessionStorage.getItem('kpy_user');
        if (sessao) {
            this.usuarioLogado = JSON.parse(sessao);
        }
    }

    login(email, senha) {
        const usuario = USUARIOS[email];
        if (usuario && usuario.senha === senha) {
            this.usuarioLogado = usuario;
            sessionStorage.setItem('kpy_user', JSON.stringify(usuario));
            return true;
        }
        return false;
    }

    logout() {
        this.usuarioLogado = null;
        sessionStorage.removeItem('kpy_user');
    }

    isLoggedIn() {
        return this.usuarioLogado !== null;
    }

    getUsuario() {
        return this.usuarioLogado;
    }
}

const auth = new Auth();