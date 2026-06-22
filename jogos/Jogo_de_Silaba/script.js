const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  console.error("Falha ao obter o contexto do canvas");
}

// Define o tamanho do canvas
canvas.width = 800;
canvas.height = 400;

// Carregar imagens
const backgroundImg = new Image();
backgroundImg.src = "assets/background.jpg";

const characterImg = new Image();
characterImg.src = "assets/character.png";

// Configuração do jogador
const jogador = {
  x: 50,
  y: canvas.height - 60,
  largura: 50,
  altura: 50,
  dy: 0,
  gravidade: 0.5,
  poderPulo: -15, // Aumentar o poder do pulo
  pulando: false,
  velocidade: 5, // Adicionar propriedade de velocidade
};

// Configuração das sílabas
const silabas = [];
const listaSilabas = [
  "Ca",
  "Va",
  "Ba",
  "Am",
  "Ar",
  "Al",
  "U",
  "Ur",
  "Um",
  "ra",
  "ma",
  "lo",
  "bo",
  "pa",
  "ju",
  "so",
  "ta",
  "sa",
  "no",
  "be",
  "ro",
  "va",
  "ne",
  "ca",
  "le",
  "go",
  "ri",
  "do",
  "xo",
  "so",
  "te",
  "ra",
  "ba",
  "na",
  "ro",
  "la",
  "to",
  "nha",
  "or",
];
// TODO: Review and expand valid words list for educational value
const palavrasValidas = [
  "Cara",
  "Cama",
  "Calo",
  "Cabo",
  "Capa",
  "Caju",
  "Cama",
  "Caso",
  "Carta",
  "Casa",
  "Cano",
  "Cabe",
  "Caro",
  "Cava",
  "Carne",
  "Vaca",
  "Vale",
  "Vago",
  "Vara",
  "Vaza",
  "Vaso",
  "Banco",
  "Baile",
  "Barco",
  "Bala",
  "Baco",
  "Baixo",
  "Bando",
  "Baque",
  "Barão",
  "Balde",
  "Bando",
  "Banca",
  "Bardo",
  "Bate",
  "Batalha",
  "Amor",
  "Amigo",
  "Árvore",
  "Arroz",
  "Arco",
  "Alvo",
  "Alma",
  "Andar",
  "Unha",
  "Urso",
  "Um",
  "Uivo",
  "Ultima",
  "Baleia",
  "Arte",
  "Arma",
  "Urna",
  "Vala",
  "Arca",
];
// Função para verificar se uma palavra foi formada
function verificarPalavra() {
  const palavra = silabasColetadas.join("");

  if (palavrasValidas.includes(palavra)) {
    pontuacao += 10;
    silabasColetadas = [];
  }
}

const frequenciaSilabas = {};

let silabasColetadas = [];
let pontuacao = 0;
let ultimoTempoGeracao = 0;
let intervaloGeracao = 2000; // Aumentar o intervalo de geração para desacelerar o jogo

// Função para desenhar o jogador
function desenharJogador() {
  ctx.drawImage(characterImg, jogador.x, jogador.y, jogador.largura, jogador.altura);
}

// Função para gerar sílabas
function obterSilabaAleatoriaPonderada() {
  const quantidadeSilabasJogador = silabasColetadas.length;
  const pesoTotal = Object.values(frequenciaSilabas).reduce((acc, peso) => acc + peso, 0);
  let aleatorio = Math.random() * pesoTotal;

  if (quantidadeSilabasJogador === 0) {
    // Mostrar apenas sílabas iniciais
    const silabasIniciais = ["Ca", "Va", "Ba", "Am", "Ar", "Al", "Uv", "Un", "Ur", "Um"];
    const frequenciaFiltrada = Object.fromEntries(
      Object.entries(frequenciaSilabas).filter(([silaba]) => silabasIniciais.includes(silaba))
    );
    const pesoTotalFiltrado = Object.values(frequenciaFiltrada).reduce(
      (acc, peso) => acc + peso,
      0
    );
    aleatorio = Math.random() * pesoTotalFiltrado;
    for (const [silaba, peso] of Object.entries(frequenciaFiltrada)) {
      if (aleatorio < peso) {
        return silaba;
      }
      aleatorio -= peso;
    }
  } else {
    // Aumentar a probabilidade de sílabas que podem completar a palavra
    const ultimaSilaba = silabasColetadas[silabasColetadas.length - 1];
    const finaisPossiveis = palavrasValidas
      .filter((palavra) => palavra.startsWith(silabasColetadas.join("")))
      .map((palavra) => palavra.slice(silabasColetadas.join("").length))
      .flatMap((restante) => restante.split(/(?=[A-Z])/).map((silaba) => silaba.toLowerCase()));

    const frequenciaAjustada = { ...frequenciaSilabas };
    finaisPossiveis.forEach((silaba) => {
      if (frequenciaAjustada[silaba] !== undefined) {
        frequenciaAjustada[silaba] *= 10; // Aumentar significativamente a probabilidade
      }
    });

    const pesoTotalAjustado = Object.values(frequenciaAjustada).reduce(
      (acc, peso) => acc + peso,
      0
    );
    aleatorio = Math.random() * pesoTotalAjustado;
    for (const [silaba, peso] of Object.entries(frequenciaAjustada)) {
      if (aleatorio < peso) {
        return silaba;
      }
      aleatorio -= peso;
    }
  }
}

function gerarSilaba() {
  const minY = canvas.height - jogador.altura - 150; // Aumentar a altura mínima acima do solo
  const maxY = canvas.height - jogador.altura - 100; // Aumentar a altura máxima acima do solo
  const silaba = {
    x: canvas.width,
    y: Math.random() * (maxY - minY) + minY, // Garantir que as sílabas apareçam na faixa capturável
    largura: 70, // Aumentar o tamanho da sílaba
    altura: 70, // Aumentar o tamanho da sílaba
    texto: obterSilabaAleatoriaPonderada(),
  };
  silabas.push(silaba);
}

// Função para desenhar sílabas
function desenharSilabas() {
  silabas.forEach((silaba) => {
    ctx.fillStyle = "white";
    ctx.fillRect(silaba.x, silaba.y, silaba.largura, silaba.altura);
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(silaba.texto, silaba.x + silaba.largura / 2, silaba.y + silaba.altura / 2 + 5);
  });
}

// Função para atualizar a posição das sílabas
function atualizarSilabas() {
  silabas.forEach((silaba, indice) => {
    silaba.x -= 0.575; // Aumentar a velocidade das sílabas em 15%
    if (silaba.x + silaba.largura < 0) {
      silabas.splice(indice, 1);
    }
  });
}

// Função para detectar colisão entre jogador e sílabas
function verificarColisao() {
  silabas.forEach((silaba, indice) => {
    if (
      jogador.x < silaba.x + silaba.largura &&
      jogador.x + jogador.largura > silaba.x &&
      jogador.y < silaba.y + silaba.altura &&
      jogador.y + jogador.altura > silaba.y
    ) {
      silabasColetadas.push(silaba.texto);
      silabas.splice(indice, 1);
      verificarPalavra();
      atualizarFrequenciaSilabas();
    }
  });
}
// Função para desenhar a pontuação e sílabas coletadas
function desenharHUD() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Pontuação: ${pontuacao}`, 10, 20);
  ctx.fillText(`Coletadas: ${silabasColetadas.join("")}`, 10, 40);
}

// Função principal de renderização
function renderizar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height); // Desenhar o fundo
  desenharJogador();
  desenharSilabas();
  desenharHUD();
}

// Função para atualizar a posição do jogador
function atualizarJogador() {
  jogador.y += jogador.dy;
  jogador.dy += jogador.gravidade;

  if (jogador.y + jogador.altura > canvas.height) {
    jogador.y = canvas.height - jogador.altura;
    jogador.dy = 0;
    jogador.pulando = false;
  }

  // Limitar o movimento do jogador dentro do canvas
  if (jogador.x < 0) {
    jogador.x = 0;
  } else if (jogador.x + jogador.largura > canvas.width) {
    jogador.x = canvas.width - jogador.largura;
  }
}

function calcularFrequenciaSilabas(listaSilabas, palavrasValidas, quantidadeSilabasJogador) {
  const frequenciaSilabas = {};

  // Inicializar contagem de frequência
  listaSilabas.forEach((silaba) => {
    frequenciaSilabas[silaba] = 0;
  });

  // Contar ocorrências de sílabas no início das palavras
  palavrasValidas.forEach((palavra) => {
    const silabasNaPalavra = palavra.split(/(?=[A-Z])/); // Assumindo que as sílabas são capitalizadas
    if (silabasNaPalavra.length > 0) {
      const primeiraSilaba = silabasNaPalavra[0].toLowerCase();
      if (frequenciaSilabas[primeiraSilaba] !== undefined) {
        frequenciaSilabas[primeiraSilaba]++;
      }
    }
  });

  // Ajustar frequência com base na quantidade de sílabas do jogador
  palavrasValidas.forEach((palavra) => {
    const silabasNaPalavra = palavra.split(/(?=[A-Z])/); // Assumindo que as sílabas são capitalizadas
    silabasNaPalavra.forEach((silaba, indice) => {
      const silabaMinuscula = silaba.toLowerCase();
      if (frequenciaSilabas[silabaMinuscula] !== undefined) {
        if (indice > 0) {
          frequenciaSilabas[silabaMinuscula] += quantidadeSilabasJogador;
        }
      }
    });
  });

  return frequenciaSilabas;
}

// Função para atualizar a frequência das sílabas com base na quantidade de sílabas do jogador
function atualizarFrequenciaSilabas() {
  const quantidadeSilabasJogador = silabasColetadas.length;
  const frequenciaSilabas = calcularFrequenciaSilabas(
    listaSilabas,
    palavrasValidas,
    quantidadeSilabasJogador
  );
}

// Loop principal do jogo
function loopJogo(timestamp) {
  if (timestamp - ultimoTempoGeracao > intervaloGeracao) {
    gerarSilaba();
    ultimoTempoGeracao = timestamp;
  }
  atualizarJogador();
  atualizarSilabas();
  verificarColisao();
  renderizar();
  requestAnimationFrame(loopJogo);
}

// Detectar entrada do jogador
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" && !jogador.pulando) {
    jogador.dy = jogador.poderPulo;
    jogador.pulando = true;
  } else if (e.key === "ArrowDown") {
    silabasColetadas.pop();
  } else if (e.key === "ArrowLeft") {
    jogador.x -= jogador.velocidade * 2; // Aumentar a velocidade para a esquerda
  } else if (e.key === "ArrowRight") {
    jogador.x += jogador.velocidade * 2; // Aumentar a velocidade para a direita
  }
});
listaSilabas.forEach((silaba) => {
  frequenciaSilabas[silaba] = frequenciaSilabas[silaba] || 1; // Peso padrão é 1
});
// Função para gerar sílabas com aleatoriedade ponderada

// Iniciar o loop do jogo após o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  atualizarFrequenciaSilabas();
  requestAnimationFrame(loopJogo);

  // Signal to parent shell that the game is ready
  if (window.parent !== window) {
    window.parent.postMessage('game-ready', '*');
  }
});
