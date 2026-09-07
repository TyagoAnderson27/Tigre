// ==========================================
// CONFIGURAÇÕES INICIAIS DO JOGO
// ==========================================
let saldo = 1000;
let apostaAtual = 10;
let modoTurbo = false;
let tempoGiro = 1000;

const premiosBase = {
    '🐯': 500,
    '🐉': 200,
    '💎': 100,
    '🪙': 50,
    '🍊': 30,
    '🍉': 20,
    '🍒': 15
};

const simbolos = Object.keys(premiosBase);

// ==========================================
// SISTEMA DE EFEITOS SONOROS (WEB AUDIO API)
// ==========================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Inicializa o sistema de som após o primeiro clique do usuário (regra dos navegadores)
function garantirAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
    }
}

// Som 1: Clique curto ao apertar botões ou alterar apostas
function somClique() {
    garantirAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Som 2: Som repetitivo que toca enquanto os rolos estão girando
function somGiro(duracao) {
    garantirAudio();
    const intervalo = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }, 60);

    setTimeout(() => clearInterval(intervalo), duracao);
}

// Som 3: Som festivo de moedas acumulando rapidamente quando há vitória
function somVitoria() {
    garantirAudio();
    let tempo = audioCtx.currentTime;
    // Toca uma sequência de 8 bipes rápidos subindo de tom
    for (let i = 0; i < 8; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + (i * 120), tempo + (i * 0.08));

        gain.gain.setValueAtTime(0.1, tempo + (i * 0.08));
        gain.gain.linearRampToValueAtTime(0.01, tempo + (i * 0.08) + 0.1);

        osc.start(tempo + (i * 0.08));
        osc.stop(tempo + (i * 0.08) + 0.1);
    }
}

// ==========================================
// FUNÇÕES DE CONTROLE E INTERFACE
// ==========================================
function atualizarInterface() {
    document.getElementById('saldo').innerText = saldo;
    document.getElementById('valor-aposta').innerText = apostaAtual;
}

function alterarAposta() {
    somClique();
    if (apostaAtual === 10) apostaAtual = 20;
    else if (apostaAtual === 20) apostaAtual = 50;
    else if (apostaAtual === 50) apostaAtual = 100;
    else apostaAtual = 10;
    atualizarInterface();
    exibirMensagem(`Aposta alterada para ${apostaAtual} moedas.`, "aviso");
}

function alternarTurbo() {
    somClique();
    modoTurbo = !modoTurbo;
    tempoGiro = modoTurbo ? 250 : 1000;
    const btnTurbo = document.getElementById('btn-turbo');
    btnTurbo.innerText = modoTurbo ? "Modo Turbo: LIGADO" : "Modo Turbo: DESLIGADO";
    btnTurbo.style.background = modoTurbo ? "#ff4500" : "#333";
}

function exibirMensagem(texto, tipo) {
    const msgEl = document.getElementById('msg');
    msgEl.innerText = texto;
    msgEl.className = "mensagem " + tipo;
}

function limparBrilhos() {
    for (let i = 0; i < 9; i++) {
        const elSlot = document.getElementById(`slot${i}`);
        elSlot.style.backgroundColor = "#fcfcfc";
        elSlot.style.boxShadow = "none";
        elSlot.style.borderColor = "#ddd";
    }
}

function piscarLinhaVencedora(indicesDaLinha) {
    indicesDaLinha.forEach(index => {
        const elSlot = document.getElementById(`slot${index}`);
        elSlot.style.backgroundColor = "#fffbcc";
        elSlot.style.borderColor = "#ffcc00";
        elSlot.style.boxShadow = "0 0 15px #ffcc00 inset, 0 0 10px #ffcc00";
    });
}

function brilharTelaCheia() {
    for (let i = 0; i < 9; i++) {
        const elSlot = document.getElementById(`slot${i}`);
        elSlot.style.backgroundColor = "#ffe6e6";
        elSlot.style.borderColor = "#ff4500";
        elSlot.style.boxShadow = "0 0 25px #ff4500 inset, 0 0 15px #ff4500";
    }
}

// ==========================================
// LÓGICA PRINCIPAL DO GIRO
// ==========================================
function jogar() {
    if (saldo < apostaAtual) {
        exibirMensagem(`Saldo insuficiente!`, "erro");
        return;
    }

    // Toca os efeitos sonoros do início da jogada
    somClique();
    somGiro(tempoGiro);

    saldo -= apostaAtual;
    atualizarInterface();
    limparBrilhos();

    const botaoGirar = document.getElementById('btn-girar');
    const botaoAposta = document.getElementById('btn-aposta');
    botaoGirar.disabled = true;
    if (botaoAposta) botaoAposta.disabled = true;

    exibirMensagem("Girando os 9 slots...", "aviso");

    for (let i = 0; i < 9; i++) {
        document.getElementById(`slot${i}`).classList.add('girando');
    }

    setTimeout(() => {
        // Remove a animação para os emojis pararem de girar antes de mostrar o resultado
        for (let i = 1; i <= 9; i++) {
            const slot = document.getElementById(`slot${i}`);
            if (slot) slot.classList.remove('girando');
        }

        let resultados = [];

        // Chance configurada em 10% para forçar a Tela Cheia (9 iguais)
        const chanceBonus9Iguais = 0.10;
        const ativouBonus9Iguais = Math.random() < chanceBonus9Iguais;

        if (ativouBonus9Iguais) {
            const simboloEscolhidoParaTodos = simbolos[Math.floor(Math.random() * simbolos.length)];
            for (let i = 0; i < 9; i++) {
                resultados.push(simboloEscolhidoParaTodos);
            }
        } else {
            for (let i = 0; i < 9; i++) {
                const simboloSorteado = simbolos[Math.floor(Math.random() * simbolos.length)];
                resultados.push(simboloSorteado);
            }
        }

        for (let i = 0; i < 9; i++) {
            const elSlot = document.getElementById(`slot${i}`);
            elSlot.innerText = resultados[i];
            elSlot.classList.remove('girando');
        }

        const l1 = "0,1,2".split(",").map(Number);
        const l2 = "3,4,5".split(",").map(Number);
        const l3 = "6,7,8".split(",").map(Number);
        const d1 = "0,4,8".split(",").map(Number);
        const d2 = "2,4,6".split(",").map(Number);

        const linhasDePagamento = [l1, l2, l3, d1, d2];

        let ganhoTotalRodada = 0;
        let linhasGanhas = 0;
        let multiplicadorAposta = apostaAtual / 10;

        linhasDePagamento.forEach(linha => {
            const idx1 = linha[0];
            const idx2 = linha[1];
            const idx3 = linha[2];

            if (resultados[idx1] === resultados[idx2] && resultados[idx2] === resultados[idx3]) {
                ganhoTotalRodada += premiosBase[resultados[idx1]] * multiplicadorAposta;
                linhasGanhas++;
                piscarLinhaVencedora(linha);
            }
        });

        const todosIguais = resultados.every(val => val === resultados[0]);

        if (todosIguais) {
            let superPremioExtra = ganhoTotalRodada * 10;
            saldo += superPremioExtra;
            brilharTelaCheia();
            somVitoria(); // Toca o som de vitória
            exibirMensagem(`🔥 TELA CHEIA DE ${resultados[0]}! SUPER MULTIPLICADOR 10X ATIVADO: +${superPremioExtra} moedas! 🎉`, "sucesso");
        } else if (ganhoTotalRodada > 0) {
            saldo += ganhoTotalRodada;
            somVitoria(); // Toca o som de vitória
            exibirMensagem(`🎉 VITÓRIA! Fez ${linhasGanhas} linha(s) e ganhou +${ganhoTotalRodada} moedas!`, "sucesso");
        } else {
            exibirMensagem("Não deu linha. Tente de novo! 🐯", "");
        }

        atualizarInterface();
        botaoGirar.disabled = false;
        if (botaoAposta) botaoAposta.disabled = false;
    }, tempoGiro);
}
