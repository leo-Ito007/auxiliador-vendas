// ====== CONFIGURAÇÃO DO BANCO DE DADOS FIREBASE (FORMATO COMPATÍVEL) ======
const firebaseConfig = {
    apiKey: "AIzaSyCBLiK7H_dgn5uvB10NUsjkgEgGRRB4yiE",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://firebaseio.com",
    projectId: "auxiliador-de-vendas-422f9",
    storageBucket: "auxiliador-de-vendas-422f9.firebasestorage.app",
    messagingSenderId: "695886275660",
    appId: "1:695886275660:web:52c5e6b797f6dea05800e9",
    measurementId: "G-YRHKXFK8HE"
};


// Inicializa o Firebase com tratamento de erro integrado
try {
    if (!window.firebaseAppsInitialized && typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        window.firebaseAppsInitialized = true;
    }
} catch (e) {
    console.error("Erro ao inicializar Firebase: ", e);
}

const db = (typeof firebase !== 'undefined') ? firebase.database() : null;
// ====================================================

let produtos = [];
let listaClientes = JSON.parse(localStorage.getItem('banco_clientes')) || [];
let clienteAtivo = null;

// Escuta as alterações na nuvem em tempo real de forma segura
if (db) {
    db.ref('banco_produtos').on('value', (snapshot) => {
        try {
            const dados = snapshot.val();
            if (dados) {
                produtos = Object.keys(dados).map(key => dados[key]);
            } else {
                produtos = [];
            }
            renderizarProdutos();
            renderizarListaClientes();
        } catch (e) {
            console.error("Erro ao ler dados da nuvem: ", e);
        }
    });
}

window.onload = function() {
    renderizarListaClientes();
    if (listaClientes && listaClientes.length > 0) {
        selecionarCliente(listaClientes[0].id);
    }
};

// Controla as abas/telas do aplicativo de forma global
window.alternarTela = function(idTela) {
    document.querySelectorAll('.tela-painel').forEach(tela => {
        tela.classList.add('hidden');
    });
    document.querySelectorAll('.btn-menu').forEach(btn => {
        btn.classList.remove('active');
    });

    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.classList.remove('hidden');
    }
    
    const btnIni = document.getElementById('btn-inicio');
    const btnCad = document.getElementById('btn-cadastros');
    const btnSim = document.getElementById('btn-simulador');

    if (idTela === 'tela-inicio' && btnIni) btnIni.classList.add('active');
    if (idTela === 'tela-cadastros' && btnCad) btnCad.classList.add('active');
    if (idTela === 'tela-simulador' && btnSim) btnSim.classList.add('active');
}

// Cadastra o cliente lembrete
window.salvarCliente = function() {
    const nome = document.getElementById('cliente-nome').value;
    const cpf = document.getElementById('cliente-cpf').value;
    const cidade = document.getElementById('cliente-cidade').value;

    if (!nome) {
        alert("Por favor, preencha ao menos o nome do cliente!");
        return;
    }

    const novoCliente = {
        id: Date.now(),
        nome: nome,
        cpf: cpf || 'Não informado',
        cidade: cidade || 'Não informada',
        carrinho: {}
    };

    listaClientes.push(novoCliente);
    localStorage.setItem('banco_clientes', JSON.stringify(listaClientes));

    document.getElementById('cliente-nome').value = '';
    document.getElementById('cliente-cpf').value = '';
    document.getElementById('cliente-cidade').value = '';

    renderizarListaClientes();
    selecionarCliente(novoCliente.id);
    window.alternarTela('tela-simulador');
}

// REMOVER UM CLIENTE ESPECÍFICO
window.removerCliente = function(id, event) {
    if (event) event.stopPropagation();

    if (confirm("Deseja mesmo remover esta pessoa do painel de lembretes?")) {
        if (clienteAtivo && clienteAtivo.id === id) {
            clienteAtivo = null;
            const nmCli = document.getElementById('nome-cliente-ativo');
            const resCli = document.getElementById('resumo-cliente');
            if (nmCli) nmCli.innerText = 'Nenhum selecionado';
            if (resCli) resCli.innerText = 'Selecione um cliente ao lado';
        }

        listaClientes = listaClientes.filter(cli => cli.id !== id);
        localStorage.setItem('banco_clientes', JSON.stringify(listaClientes));

        renderizarListaClientes();
        renderizarProdutos();
    }
}

// Calcula o total acumulado de um cliente
function calcularTotalCliente(cliente) {
    let total = 0;
    if (!cliente || !cliente.carrinho) return 0;
    
    produtos.forEach(prod => {
        const qtd = cliente.carrinho[prod.id] || 0;
        total += prod.preco * qtd;
    });
    return total;
}

// Renderiza a lista de clientes (Esquerda)
function renderizarListaClientes() {
    const container = document.getElementById('lista-clientes-selecao');
    if (!container) return;
    container.innerHTML = '';

    if (listaClientes.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-size: 13px; text-align: center; padding: 16px 0;">Nenhum lembrete salvo.</p>';
        return;
    }

    listaClientes.forEach(cli => {
        const classeAtivo = clienteAtivo && clienteAtivo.id === cli.id ? 'active' : '';
        const totalDinheiro = calcularTotalCliente(cli);
        
        container.innerHTML += `
            <div class="item-cliente-link ${classeAtivo}" onclick="window.selecionarCliente(${cli.id})" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px;">
                <div style="flex: 1; text-align: left;">
                    <div style="font-size: 14px; font-weight: 800; color: #000000;">${cli.nome}</div>
                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 2px;">📍 ${cli.cidade}</div>
                    <div style="font-size: 12px; color: #1e3a8a; font-weight: bold; margin-top: 4px;">
                        Total: R$ ${totalDinheiro.toFixed(2).replace('.', ',')}
                    </div>
                </div>
                <button onclick="window.removerCliente(${cli.id}, event)" style="background-color: #991b1b; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                    🗑️
                </button>
            </div>
        `;
    });
}

window.selecionarCliente = function(id) {
    clienteAtivo = listaClientes.find(c => c.id === id);
    
    if (clienteAtivo && !clienteAtivo.carrinho) {
        clienteAtivo.carrinho = {};
    }

    if (clienteAtivo) {
        const nmCli = document.getElementById('nome-cliente-ativo');
        const resCli = document.getElementById('resumo-cliente');
        if (nmCli) nmCli.innerText = clienteAtivo.nome;
        if (resCli) resCli.innerHTML = `Pedido para: <strong>${clienteAtivo.nome}</strong> (CPF: ${clienteAtivo.cpf})`;
    }
    
    renderizarListaClientes();
    renderizarProdutos();
}

// Cadastra o produto salvando na Nuvem do Firebase
// Substitua a função window.cadastrarProduto antiga por esta no seu app.js
window.cadastrarProduto = function() {
    try {
        const nomeCampo = document.getElementById('prod-nome');
        const precoCampo = document.getElementById('prod-preco');
        const imagemInput = document.getElementById('prod-imagem');

        if (!nomeCampo || !precoCampo) {
            alert("Erro técnico: Os campos do formulário não foram encontrados no HTML.");
            return;
        }

        const nome = nomeCampo.value.trim();
        const preco = parseFloat(precoCampo.value);

        if (!nome || isNaN(preco)) {
            alert("Por favor, preencha o nome e o preço do produto antes de adicionar!");
            return;
        }

        // CORREÇÃO DEFINITIVA: Pegando o arquivo correto na posição [0]
        if (imagemInput && imagemInput.files && imagemInput.files.length > 0) {
            const file = imagemInput.files[0]; // Adicionado o [0] para pegar a primeira foto
            const reader = new FileReader();
            
            reader.onloadend = function() {
                salvarNoBanco(nome, preco, reader.result);
            };
            
            reader.onerror = function() {
                alert("Erro ao ler o arquivo de imagem. Salvando com imagem padrão.");
                salvarNoBanco(nome, preco, 'https://placeholder.com');
            };

            reader.readAsDataURL(file);
        } else {
            // Se o usuário não escolher foto, salva com uma imagem padrão sem travar
            salvarNoBanco(nome, preco, 'https://placeholder.com');
        }
    } catch (erro) {
        alert("Ocorreu um erro ao processar o cadastro: " + erro.message);
    }
};

// REMOVER UM PRODUTO PERMANENTEMENTE NA NUVEM
window.removerProduto = function(id) {
    if (!db) return;
    if (confirm("Deseja mesmo excluir permanentemente este produto do catálogo geral da nuvem?")) {
        listaClientes.forEach(cli => {
            if (cli.carrinho && cli.carrinho[id]) {
                delete cli.carrinho[id];
            }
        });
        localStorage.setItem('banco_clientes', JSON.stringify(listaClientes));
        db.ref('banco_produtos/' + id).remove();
    }
}

// RENDERIZA OS PRODUTOS (CÓDIGO CORRIGIDO E FECHADO TOTALMENTE)
function renderizarProdutos() {
    const container = document.getElementById('lista-produtos');
    if (!container) return;
    container.innerHTML = '';

    if (produtos.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; grid-column: span 2 / span 2; text-align: center; padding: 32px 0;">Nenhum produto cadastrado ainda.</p>';
        const campoTotal = document.getElementById('total-geral');
        if (campoTotal) campoTotal.innerText = "R$ 0,00";
        return;
    }

    produtos.forEach(prod => {
        const qtdAtual = (clienteAtivo && clienteAtivo.carrinho) ? (clienteAtivo.carrinho[prod.id] || 0) : 0;

        container.innerHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
${prod.nome}
R$ ${prod.preco.toFixed(2).replace('.', ',')}

Qtd
🗑️



`;
});
calcularTotalGeralAtivo();
}
window.atualizarQuantidade = function(idProduto, qtd) {
if (!clienteAtivo) {
alert("Por favor, selecione um cliente na barra lateral antes de alterar as quantidades!");
renderizarProdutos();
return;
}
const valorQtd = parseInt(qtd) || 0;
clienteAtivo.carrinho[idProduto] = valorQtd;
localStorage.setItem('banco_clientes', JSON.stringify(listaClientes));
calcularTotalGeralAtivo();
renderizarListaClientes();
}
function calcularTotalGeralAtivo() {
const total = calcularTotalCliente(clienteAtivo);
const campoTotal = document.getElementById('total-geral');
if (campoTotal) {
campoTotal.innerText = R$ `${total.toFixed(2).replace('.', ',')}`;
}
}
window.limparTudo = function() {
if (confirm("Tem certeza que deseja apagar permanentemente seus clientes locais? Os produtos da nuvem NÃO serão apagados por segurança.")) {
localStorage.removeItem('banco_clientes');
listaClientes = [];
clienteAtivo = null;
const nomeCli = document.getElementById('nome-cliente-ativo');
const resCli = document.getElementById('resumo-cliente');
if (nomeCli) nomeCli.innerText = 'Nenhum selecionado';
if (resCli) resCli.innerText = 'Selecione um cliente ao lado';
renderizarListaClientes();
renderizarProdutos();
window.alternarTela('tela-inicio');
}
}