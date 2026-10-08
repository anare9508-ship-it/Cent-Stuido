// CLASS INTERPRETADORA DA LINGUAGEM CANT
class CantEngine {
  constructor(containerSaida) {
    this.container = containerSaida;
    this.variaveis = {}; // Armazena as variáveis criadas no programa
  }

  executar(codigo) {
    this.container.innerHTML = "";
    this.variaveis = {}; // Reseta as variáveis a cada execução

    const linhas = codigo.split("\n");

    linhas.forEach((linha, index) => {
      linha = linha.trim();

      if (!linha) return;

      let quantidade = 1;
      let instrucao = linha;

      // 1. Processa repetição: N.x ...
      if (linha.includes(".x")) {
        const partes = linha.split(".x");
        const num = parseInt(partes[0].trim(), 10);

        if (!isNaN(num)) {
          quantidade = num;
          instrucao = partes.slice(1).join(".x").trim();
        }
      }

      // 2. Declaração de Variável (- [tag] nome = valor ou apenas - [tag] nome)
      if (instrucao.startsWith("-")) {
        const match = instrucao.match(/^-\s*\[(.*?)\]\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*=\s*(.*))?$/);

        if (match) {
          const tag = match[1].trim();
          const nomeVar = match[2].trim();
          let valorStr = match[3] !== undefined ? match[3].trim() : "";

          let valorFinal = valorStr;

          if (valorStr.startsWith('"') && valorStr.endsWith('"') || valorStr.startsWith("'") && valorStr.endsWith("'")) {
            valorFinal = valorStr.slice(1, -1);
          } else if (!isNaN(Number(valorStr))) {
            valorFinal = Number(valorStr);
          } else if (valorStr.startsWith("calc(")) {
            const expr = valorStr.slice(5, -1).trim();
            try {
              valorFinal = Function(`"use strict"; return (${expr})`)();
            } catch (e) {
              this.renderizarErro(`[Erro Linha ${index + 1}]: Expressão matemática inválida na variável -> "${expr}"`);
              return;
            }
          }

          this.variaveis[nomeVar] = {
            tag: tag,
            valor: valorFinal
          };

        } else {
          this.renderizarErro(`[Erro de Sintaxe Linha ${index + 1}]: Declaração de variável inválida. Use o formato: - [tag] nome = valor`);
        }
      }
      // 3. Processa instrução pri("...") para Texto
      else if (instrucao.startsWith("pri(") && instrucao.endsWith(")")) {
        let conteudo = instrucao.slice(4, -1).trim();

        if (
          (conteudo.startsWith('"') && conteudo.endsWith('"')) ||
          (conteudo.startsWith("'") && conteudo.endsWith("'"))
        ) {
          conteudo = conteudo.slice(1, -1);
        } else if (this.variaveis[conteudo] !== undefined) {
          conteudo = this.variaveis[conteudo].valor;
        }

        for (let i = 0; i < quantidade; i++) {
          this.renderizarTexto(conteudo);
        }
      } 
      // 4. Processa instrução calc(...) para Matemática
      else if (instrucao.startsWith("calc(") && instrucao.endsWith(")")) {
        let expresao = instrucao.slice(5, -1).trim();

        for (const [nomeVar, dados] of Object.entries(this.variaveis)) {
          const regex = new RegExp(`\\b${nomeVar}\\b`, 'g');
          if (typeof dados.valor === 'number') {
            expresao = expresao.replace(regex, dados.valor);
          }
        }

        if (/^[0-9\s\+\-\*\/\(\)\.]+$/.test(expresao)) {
          try {
            const resultado = Function(`"use strict"; return (${expresao})`)();
            for (let i = 0; i < quantidade; i++) {
              this.renderizarTexto(resultado);
            }
          } catch (e) {
            this.renderizarErro(`[Erro de Cálculo Linha ${index + 1}]: Expressão matemática inválida -> "${expresao}"`);
          }
        } else {
          this.renderizarErro(`[Erro de Sintaxe Linha ${index + 1}]: Use apenas números e (+, +, *, /) dentro de calc()`);
        }
      } 
      // 5. NOVO RECURSO: Processa instrução img("...") para Imagens
      else if (instrucao.startsWith("img(") && instrucao.endsWith(")")) {
        let caminhoImg = instrucao.slice(4, -1).trim();

        if (
          (caminhoImg.startsWith('"') && caminhoImg.endsWith('"')) ||
          (caminhoImg.startsWith("'") && caminhoImg.endsWith("'"))
        ) {
          caminhoImg = caminhoImg.slice(1, -1);
        } else if (this.variaveis[caminhoImg] !== undefined) {
          caminhoImg = this.variaveis[caminhoImg].valor;
        }

        for (let i = 0; i < quantidade; i++) {
          this.renderizarImagem(caminhoImg);
        }
      }
      else {
        this.renderizarErro(`[Erro Linha ${index + 1}]: Comando não reconhecido -> "${linha}"`);
      }
    });
  }

  renderizarTexto(texto) {
    const elemento = document.createElement("p");
    elemento.textContent = texto;
    this.container.appendChild(elemento);
  }

  renderizarImagem(caminho) {
    const elemento = document.createElement("img");
    elemento.src = caminho;
    elemento.alt = "Imagem Cant";
    elemento.style.maxWidth = "100%";
    elemento.style.height = "auto";
    elemento.style.borderRadius = "6px";
    elemento.style.margin = "8px 0";
    this.container.appendChild(elemento);
  }

  renderizarErro(mensagem) {
    const elemento = document.createElement("div");
    elemento.className = "linha-erro";
    elemento.textContent = mensagem;
    this.container.appendChild(elemento);
  }
}

// INICIALIZAÇÃO DA INTERFACE
window.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("codigoSource");
  const numeracaoLinhas = document.getElementById("numeracaoLinhas");
  const containerSaida = document.getElementById("saidaWeb");

  const engine = new CantEngine(containerSaida);

  window.executarCant = function() {
    const codigo = textarea.value;
    engine.executar(codigo);
  };

  function atualizarLinhas() {
    const totalLinhas = textarea.value.split("\n").length;
    let linhasHTML = "";
    for (let i = 1; i <= totalLinhas; i++) {
      linhasHTML += i + "<br>";
    }
    numeracaoLinhas.innerHTML = linhasHTML;
  }

  textarea.addEventListener("scroll", () => {
    numeracaoLinhas.scrollTop = textarea.scrollTop;
  });

  textarea.addEventListener("input", atualizarLinhas);

  const codigoExemplo = `pri("--- TESTE DA LINGUAGEM CANT COM IMAGEM ---")
img("https://via.placeholder.com/300")
pri("Foto carregada com sucesso!")`;

  textarea.value = codigoExemplo;
  atualizarLinhas();
  window.executarCant();
});

