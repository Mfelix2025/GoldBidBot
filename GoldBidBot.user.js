// ==UserScript==
// @name         GoldBidBot
// @namespace    http://tampermonkey.net/
// @version      2025-02-24
// @description  Auto bids on gold auctions (runs in background, mobile & desktop)
// @author       Mateus Félix (Telegram: @Mateus_Felix)

// @match       https://m.rivalregions.com/*
// @match       http://m.rivalregions.com/*
// @match       https://tr.rivalregions.com/*
// @match       http://tr.rivalregions.com/*
// @run-at       document-idle
// @downloadURL https://github.com/Mfelix2025/GoldBidBot/raw/main/GoldBidBot.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Verifica se a URL exata é "https://rivalregions.com/" ou "https://m.rivalregions.com/" (login)
    if (window.location.href === "https://rivalregions.com/" || window.location.href === "https://m.rivalregions.com/") {
        return; // Encerra a execução do script
    }

    if (window.top !== window.self) {
        return; // Impede a execução dentro de iframes
    }

    // Adiciona Material Icons ao <head> (caso ainda não tenha sido carregado)
    if (!document.getElementById('material-icons-link')) {
        const link = document.createElement('link');
        link.id = 'material-icons-link';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.appendChild(link);
    }

    function criarPainel() {
        const leilaoAtivo = localStorage.getItem('emAndamento') === 'true';
        const painelHTML = `
            <div id="painelConfiguracoes" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #333; color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(255, 255, 255, 0.2); z-index: 9999; min-width: 300px; width: 80%; max-width: 600px; font-size: clamp(14px, 2vw, 18px);">
              <button id="btnFechar" style="position: absolute; top: 10px; right: 10px; background: none; color: #fff; border: none; font-size: clamp(16px, 2vw, 20px); cursor: pointer;"> <span class="material-icons">close</span> </button>
              <div style="display: flex; flex-direction: column; gap: 10px;">
              <h3 style="user-select: none; font-size: clamp(18px, 3vw, 24px); display: flex; align-items: center; gap: 5px;"> <span class="material-icons" style="color:gold;font-size: 1.5em;">smart_toy</span> Gold Bid Bot </h3>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                 <span style="user-select: none;">Off</span>
                 <span id="automacaoToggle" class="material-icons" style="user-select: none; cursor: pointer; font-size: 3em; color: ${localStorage.getItem('ativo') === 'true' ? 'green' : 'red'};">${localStorage.getItem('ativo') === 'true' ? 'toggle_on' : 'toggle_off'}</span>
                 <span style="user-select: none;">On</span>
              </div>
              <label style="user-select: none; font-weight: bold;">Valor Limite de Lances:</label>
              <input type="text" id="limiteLances" value="${formatarValor(localStorage.getItem('limite') || '0')}" style="height: 20px; font-size: 18px; padding: 10px; border-radius: 5px; border: none;" />
              <button id="salvarLimite" style="user-select: none; font-size: 15px; padding: 10px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer;">Salvar Limite</button>

             ${leilaoAtivo ? `
            <div style="user-select: none; background-color: #4CAF50; padding: 10px; border-radius: 5px; text-align: center; cursor: pointer;" onclick="hash_action('auction/show/${localStorage.getItem('idLeilao')}'); document.getElementById('btnFechar').click();">
                <span class="material-icons" style="vertical-align: middle;">gavel</span> Leilão em Andamento! Clique para ver.
            </div>
            ` : ''}

            <div style="user-select: none; text-align: center; margin-top: 10px;"> <span class="material-icons" style="vertical-align: middle;">fingerprint</span> <a href="https://t.me/Mateus_Felix" target="_blank">Mateus Félix</a></div>
            </div>
         </div>
        `;

        document.body.insertAdjacentHTML('beforeend', painelHTML);

        document.getElementById('btnFechar').addEventListener('click', fecharPainel);
        const inputLimite = document.getElementById('limiteLances');

        inputLimite.addEventListener('input', () => {
            let valor = inputLimite.value.replace(/\D/g, '');
            valor = removerZerosAEsquerda(valor);
            valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            inputLimite.value = valor;
        });

        document.getElementById('salvarLimite').addEventListener('click', () => {
            let limite = inputLimite.value.replace(/\D/g, '');
            if (limite === '' || parseInt(limite) < 0) {
                limite = '0';
            }
            localStorage.setItem('limite', limite);
            alert('Limite de lances salvo!');
        });

        const automacaoToggle = document.getElementById('automacaoToggle');
        automacaoToggle.addEventListener('click', () => {
            const ativoAtual = localStorage.getItem('ativo') === 'true';
            const novoAtivo = !ativoAtual;
            localStorage.setItem('ativo', novoAtivo.toString());
            automacaoToggle.textContent = novoAtivo ? 'toggle_on' : 'toggle_off';
            automacaoToggle.style.color = novoAtivo ? 'green' : 'red';
        });
    }

    function formatarValor(valor) {
        valor = valor.replace(/\D/g, '');
        return valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function removerZerosAEsquerda(valor) {
        return valor.replace(/^0+/, '') || '0';
    }

    function mostrarBotaoCabecalho() {
        function gerarBotaoHTML(tipo) {
            const isHeaderChat = tipo === 'headerChat';
            const positionStyle = isHeaderChat ? '' : 'position: absolute; left: 75px; top: 4px; z-index: 1000;';
            const classStyle = isHeaderChat ? 'class="header_buttons_hover header_slide header_buttons"' : '';

            return `
            <button id="botaoAbrirCabecalho" ${classStyle}
                style="${positionStyle}
                       display: flex; align-items: center; justify-content: center; gap: 5px;
                       margin-top: 1vh; height: 3vh; width: 10vw; padding: 1px; font-size: 1.5em;
                       text-align: center; background-color: #007BFF; color: #fff; border: none;
                       border-radius: 5px; cursor: pointer;">
                <span class="material-icons">gavel</span>
            </button>
        `;
        }

        const headerChat = document.getElementById('header_chat');
        const headerDiv = document.getElementById('header');

        if (headerChat && headerChat.parentNode) {
            headerChat.parentNode.insertBefore(
                new DOMParser().parseFromString(gerarBotaoHTML('headerChat'), 'text/html').body.firstChild,
                headerChat.nextSibling
            );
        } else if (headerDiv) {
            headerDiv.insertAdjacentHTML('beforebegin', gerarBotaoHTML('headerDiv'));
        }

        const botaoAbrir = document.getElementById('botaoAbrirCabecalho');
        botaoAbrir.addEventListener('click', () => {
            if (document.getElementById('painelConfiguracoes')) {
                fecharPainel();
            } else {
                criarPainel();
                botaoAbrir.style.backgroundColor = 'red';
                botaoAbrir.innerHTML = `<span class="material-icons">close</span>`;
            }
        });

        // Injeção de JavaScript para eventos de pesquisa
        const script = document.createElement('script');
        script.textContent = `
        (function() {
            const botaoAbrir = document.getElementById('botaoAbrirCabecalho');
            const searchButton = document.getElementById('header_search_button');
            const searchClose = document.getElementById('header_search_close');
            const searchedDiv = document.getElementById('searched');

        if (searchButton) {
           searchButton.addEventListener('click', () => {
               if (botaoAbrir) botaoAbrir.style.visibility = 'hidden'; // Mudança aqui
           });
       }

       if (searchClose) {
           searchClose.addEventListener('click', () => {
               if (botaoAbrir) botaoAbrir.style.visibility = 'visible'; // Mudança aqui
           });
       }

       if (searchedDiv) {
           const observer = new MutationObserver(mutations => {
               mutations.forEach(mutation => {
                   if (mutation.attributeName === 'style' && searchedDiv.style.display === 'none') {
                   if (botaoAbrir) botaoAbrir.style.visibility = 'visible'; // Mudança aqui
                   }
               });
       });
           observer.observe(searchedDiv, { attributes: true, attributeFilter: ['style'] });
                   }
               })();
       `;
            document.head.appendChild(script);
    }

    function fecharPainel() {
        const painel = document.getElementById('painelConfiguracoes');
        if(painel){
            painel.remove();
        }
        const botaoAbrir = document.getElementById('botaoAbrirCabecalho');
        botaoAbrir.style.backgroundColor = '#007BFF';
        botaoAbrir.innerHTML = `<span class="material-icons">gavel</span>`;
    }

    function verificarEAdicionarCamposNoStorage() {
        if (!localStorage.getItem('limite')) localStorage.setItem('limite', '0');
        if (!localStorage.getItem('ativo')) localStorage.setItem('ativo', 'false');
    }

    // Função para obter o valor de um cookie
    function obterCookie(nome) {
        const match = document.cookie.match(new RegExp('(^| )' + nome + '=([^;]+)'));
        return match ? match[2] : null;
    }

    // Verifica e define o valor de "usuario" no localStorage com base no cookie "rr_id"
    if (!localStorage.getItem("usuario")) {
        const rr_id = obterCookie("rr_id");
        if (rr_id) {
            localStorage.setItem("usuario", rr_id);
        }
    }

    // Cria e insere o iframe invisível no body
    const iframe = document.createElement("iframe");
    iframe.id = "iframe";
    iframe.style.display = "none";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);

    function obterIdLeilao(action) {
        return action.split("/").pop();
    }

    function obterIdUsuario(iframeDoc) {
        // Encontrar o elemento com id 'auction_winner' dentro do iframe
        const auctionWinnerElement = iframeDoc.querySelector('#auction_winner');

        if (auctionWinnerElement) {
            // Pegar o valor da URL de background da imagem
            let backgroundImage = auctionWinnerElement.style.backgroundImage;

            if (backgroundImage) {
                // Regex para capturar o id_usuario antes do timestamp
                const regex = /\/(\d+)_\d+\.png/;
                const match = backgroundImage.match(regex);

                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        return null; // Caso não encontre o id
    }

    function verificarLimiteEParticiparLeilao(iframe) {
        let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        let iframeWindow = iframe.contentWindow; // Obtém o window do iframe

        // ✅ Verificação do usuário antes de seguir
        let idUsuarioAtual = obterIdUsuario(iframeDoc);
        let idUsuarioLocal = localStorage.getItem("usuario");

        if (idUsuarioAtual && idUsuarioAtual === idUsuarioLocal) {
            console.log("Jogador que está ganhando é o usuario atual do bot. Lance não efetuado.");
            return iframe.contentWindow.location.reload(); // Encerra a função se o usuário for o mesmo
        }

        // Acesso direto ao valor do lance atual
        let auctionPriceElement = iframeDoc.querySelector('#auction_price_t');
        let limite = Number(localStorage.getItem("limite"));
        let valorLanceAtual = 0;
        let hashElement = iframeDoc.querySelector('input[name="hash"]');
        let hash = hashElement ? hashElement.value : "";
        let idLeilao = localStorage.getItem("idLeilao"); // Ajuste para capturar corretamente o ID do leilão
        let usuario = idUsuarioLocal;

        if (auctionPriceElement) {
            valorLanceAtual = Number(auctionPriceElement.getAttribute("b"));
            console.log("Lance atual:", valorLanceAtual);

            // Lógica de verificação e aposta
            if (valorLanceAtual < limite) {
              let valorNovoLance = valorLanceAtual + 50000000 <= limite ? valorLanceAtual + 50000000 : limite;

                window.eval(`window.socket.emit('rr_auction', '{"price":"${valorNovoLance}", "edit":"${idLeilao}", "id":"${usuario}", "hash":"${hash}", "room":"auction_${idLeilao}"}')`);

                console.log(`Lance emitido: ${valorNovoLance}`);
                return iframe.contentWindow.location.reload();
            } else {
                console.log("Limite atingido. O maior lance é de:", valorLanceAtual);
                return iframe.contentWindow.location.reload();
            }
        } else {
            return iframe.contentWindow.location.reload();
        }
    }


    function participarDoLeilao() {
        const idLeilao = localStorage.getItem("idLeilao");
        if (idLeilao) {
            console.log(`Participando do leilão ${idLeilao}...`);
            iframe.src = `/auction/show/${idLeilao}`;

            // Monitorar o leilão a cada 5 segundos
            setInterval(() => {
                // Adiciona a verificação aqui
                if (localStorage.getItem("ativo") == "true") {
                    if (localStorage.getItem("emAndamento") == "true") {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        iframe.contentWindow.location.reload(); // Recarregar o iframe

                        // Obter o conteúdo dos scripts do iframe
                        const scripts = iframeDoc.getElementsByTagName("script");

                        // Procurar pelo script que contém o countdown
                        for (let script of scripts) {
                            const scriptContent = script.textContent || script.innerText;
                            const regex = /until:\s*(-?\d+)/; // Regex para encontrar o valor numérico de 'until'
                            let match = scriptContent.match(regex);

                            if (match && match[1]) {
                                let untilValue = parseInt(match[1], 10);
                                console.log("Valor segundos restantes:", untilValue);

                                if (untilValue > 0) {
                                    console.log("Ainda há tempo no leilão");
                                    verificarLimiteEParticiparLeilao(iframe); // Chama a função para verificar o limite e tentar participar
                                } else {
                                    console.log(untilValue);
                                    // Se o tempo for 0 ou menor, o leilão acabou
                                    localStorage.setItem("emAndamento", "false");
                                    localStorage.removeItem("idLeilao");
                                    console.log("Leilão encerrado, status atualizado.");
                                    iframe.contentWindow.location.reload(); // Recarregar o iframe
                                    iniciarMonitoramento(); // Continuar monitorando o leilão
                                }
                                break; // Parar de procurar nos outros scripts, já encontramos o valor
                            }
                        }
                    }
                }
            }, 5000); // Intervalo de 5 segundos
        } else {
            // Caso o leilão tenha sido encerrado
            localStorage.setItem("emAndamento", "false");
            localStorage.removeItem("idLeilao");
            console.log("Leilão encerrado, status atualizado.");
            iframe.contentWindow.location.reload(); // Recarregar o iframe
            iniciarMonitoramento(); // Continuar monitorando o leilão
        }
    }

    function verificarLeilao() {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const linhasTabela = iframeDoc.querySelectorAll("#table_list tr");
        linhasTabela.forEach((linha) => {
            const celulaColspan = linha.querySelector("[colspan='2'] span");
            if (celulaColspan && celulaColspan.textContent.trim() === "1000 G") {
                const divComAction = linha.querySelector("div[action]");
                if (divComAction) {
                    const idLeilao = obterIdLeilao(divComAction.getAttribute("action"));
                    localStorage.setItem("idLeilao", idLeilao);
                    localStorage.setItem("emAndamento", "true");
                    participarDoLeilao();
                }
            }
        });
    }

    function iniciarMonitoramento() {
        if (localStorage.getItem("emAndamento") == "false") {
            iframe.src = "/auction/all";
            verificarLeilao();
            setInterval(() => {
                // Encapsula todo o conteúdo do setInterval dentro do if
                if (localStorage.getItem("ativo") == "true") {
                    if (localStorage.getItem("emAndamento") == "false") {
                        iframe.contentWindow.location.reload();
                        console.log("No loop");
                        verificarLeilao();
                    }
                }
            }, 15000);
        } else {
            participarDoLeilao();
        }
    }

    if (!localStorage.getItem("emAndamento")) {
        localStorage.setItem("emAndamento", "false");
    }
    if (!localStorage.getItem("ativo")) {
        localStorage.setItem("ativo", "false");
    }

    if (localStorage.getItem("emAndamento") == "true" && localStorage.getItem("idLeilao")) {
        if (localStorage.getItem("ativo") == "true") {
            participarDoLeilao();
        }
    }

    // Inicializa o Gold Bid Bot
    verificarEAdicionarCamposNoStorage();
    mostrarBotaoCabecalho();
    iniciarMonitoramento();

})();
