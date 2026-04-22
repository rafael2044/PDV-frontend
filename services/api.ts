import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {

    const token = Cookies.get('token');
    // Pegamos o ID do terminal salvo
    const terminalId = Cookies.get('terminal_id');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Injetamos o Header, se existir
    if (terminalId) {
        config.headers['x-terminal-id'] = terminalId;
    }

    return config;
});

api.interceptors.response.use(
    (response) => {
        // Se deu sucesso (200, 201), passa direto
        return response;
    },
    (error) => {
        // Se houver erro na resposta
        if (error.response && error.response.status === 401) {
            // Erro 401 = Não Autorizado (Token inválido ou expirado)

            // Evita loop infinito se já estiver na tela de login
            if (window.location.pathname !== '/login') {
                console.warn("Sessão expirada. Redirecionando para login...");
                // Limpa dados sensíveis
                Cookies.remove('token');
                Cookies.remove('user');
                Cookies.remove('role');

                // Força o redirecionamento via window (mais seguro que router aqui)
                window.location.href = '/login';
            }

        }
        // Repassa o erro para o componente tratar (ex: mostrar Toast de erro) caso não seja 401
        return Promise.reject(error);
    }
);
export default api;
