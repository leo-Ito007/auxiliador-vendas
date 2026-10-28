// ====== CONFIGURAÇÃO DO BANCO DE DADOS FIREBASE ======
import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, set, onValue } from "https://gstatic.com";

// Suas credenciais oficiais do Firebase (já preenchidas a partir da sua imagem)
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

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// ====================================================

// Produtos carregados da Nuvem, Clientes guardados no celular localmente
let produtos = [];
let listaClientes = JSON.parse(localStorage.getItem('banco_clientes')) || [];
let clienteAtivo = null;

// Escuta as alterações na nuvem em tempo real
onValue(ref(db, 'banco_produtos'), (snapshot) => {
    const dados = snapshot.val();
    if (dados) {
        produtos = Object.keys(dados).map(key => dados[key]);
    } else {
        produtos = [];
    }
    renderizarProdutos();
    renderizarListaClientes();
});

window.onload = function() {
    renderizarListaClientes();
    if (listaClientes.length > 0) {
        selecionarCliente(listaClientes[0].id);
    }
};

// Controla as abas/telas do aplicativo
// Procure por esta função dentro do seu app.js e garanta que ela comece com window.alternarTela
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
    
    if (idTela === 'tela-inicio') document.getElementById('btn-inicio').classList.add('active');
    if (idTela === 'tela-cadastros') document.getElementById('btn-cadastros').classList.add('active');
    if (idTela === 'tela-simulador') document.getElementById('btn-simulador').classList.add('active');
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

// REMOVER UM CLIENTE ESPECÍFICO (No painel da esquerda)
window.removerCliente = function(id, event) {
    if (event) event.stopPropagation();

    if (confirm("Deseja mesmo remover esta pessoa do painel de lembretes?")) {
        if (clienteAtivo && clienteAtivo.id === id) {
            clienteAtivo = null;
            document.getElementById('nome-cliente-ativo').innerText = 'Nenhum selecionado';
            document.getElementById('resumo-cliente').innerText = 'Selecione um cliente ao lado';
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
            <div class="item-cliente-link ${classeAtivo}" onclick="selecionarCliente(${cli.id})" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px;">
                <div style="flex: 1; text-align: left;">
                    <div style="font-size: 14px; font-weight: 800; color: #000000;">${cli.nome}</div>
                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 2px;">📍 ${cli.cidade}</div>
                    <div style="font-size: 12px; color: #1e3a8a; font-weight: bold; margin-top: 4px;">
                        Total: R$ ${totalDinheiro.toFixed(2).replace('.', ',')}
                    </div>
                </div>
                <button onclick="removerCliente(${cli.id}, event)" style="background-color: #991b1b; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
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
        document.getElementById('nome-cliente-ativo').innerText = clienteAtivo.nome;
        document.getElementById('resumo-cliente').innerHTML = `Pedido para: <strong>${clienteAtivo.nome}</strong> (CPF: ${clienteAtivo.cpf})`;
    }
    
    renderizarListaClientes();
    renderizarProdutos();
}

// Cadastra o produto salvando na Nuvem do Firebase
window.cadastrarProduto = function() {
    const nome = document.getElementById('prod-nome').value;
    const preco = parseFloat(document.getElementById('prod-preco').value);
    const imagemInput = document.getElementById('prod-imagem');

    if (!nome || isNaN(preco)) {
        alert("Por favor, preencha o nome e o preço do produto!");
        return;
    }

    const file = imagemInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onloadend = function() {
            salvarNoBanco(nome, preco, reader.result);
        }
        reader.readAsDataURL(file);
    } else {
        salvarNoBanco(nome, preco, 'https://placeholder.com');
    }
}

function salvarNoBanco(nome, preco, imagemBase64) {
    const idUnico = Date.now();
    const trackingProduto = {
        id: idUnico,
        nome: nome,
        preco: preco,
        imagem: imagemBase64
    };

    // ENVIA PARA A NUVEM DO FIREBASE
    set(ref(db, 'banco_produtos/' + idUnico), trackingProduto)
    .then(() => {
        document.getElementById('prod-nome').value = '';
        document.getElementById('prod-preco').value = '';
        document.getElementById('prod-imagem').value = '';
        window.alternarTela('tela-simulador');
    })
    .catch((error) => {
        alert("Erro ao salvar produto na nuvem: " + error.message);
    });
}

// REMOVER UM PRODUTO PERMANENTEMENTE NA NUVEM
window.removerProduto = function(id) {
    if (confirm("Deseja mesmo excluir permanentemente este produto do catálogo geral da nuvem?")) {
        listaClientes.forEach(cli => {
            if (cli.carrinho && cli.carrinho[id]) {
                delete cli.carrinho[id];
            }
        });
        localStorage.setItem('banco_clientes', JSON.stringify(listaClientes));

        // APAGA DIRETO DO FIREBASE
        set(ref(db, 'banco_produtos/' + id), null);
    }
}

// RENDERIZA OS PRODUTOS
function renderizarProdutos() {
    const container = document.getElementById('lista-produtos');
    if (!container) return;
    container.innerHTML = '';

    if (produtos.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; grid-column: span 2 / span 2; text-align: center; padding: 32px 0;">Nenhum produto cadastrado ainda.</p>';
        document.getElementById('total-geral').innerText = "R$ 0,00";
        return;
    }

    produtos.forEach(prod => {
        const qtdAtual = (clienteAtivo && clienteAtivo.carrinho) ? (clienteAtivo.carrinho[prod.id] || 0) : 0;

        container.innerHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <img src="${prod.imagem}" style="width: 52px; height: 52px; object-fit: cover; border-radius: 8px; background-color: #e5e7eb;">
                    <div style="text-align: left;">
                        <h4 style="font-weight: 800; color: #000000; font-size: 13px; margin: 0 0 2px 0;">${prod.nome}</h4>
                        <p style="color: #0f172a; font-weight: bold; font-size: 13px; margin: 0;">R$ ${prod.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px;">
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
campoTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
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