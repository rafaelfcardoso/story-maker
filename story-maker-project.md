Sticky, Maio 2025
Avaliação prática - engenheiros(as) de software

    Na nossa experiência, projetos práticos são a maneira mais realista de avaliar engenheiros(as)
    de software, e de oferecer uma ilustração do tipo de desafio que enfrentamos na Sticky. No
    entanto, sabemos que este tipo de avaliação representa um investimento de tempo relevante,
    por isso, ficamos à disposição para nos alinharmos.
    Gaste o tempo que tiver disponível e achar apropriado, mas não mais que um total de 8 horas.
    Se tiver apenas 1 hora, sem problemas. Faça o que é viável em 1 hora.
    É mais importante fazer bem e completar uma parcela do que é proposto, do que tentar fazer
    tudo e se embolar.
    Como avaliação, este projeto não é remunerado, mas se por acaso quisermos usar algo do seu
    código, haverá remuneração.
    Esta avaliação é baseada num projeto real da Sticky. Não é um teste inventado.
    O briefing dado é essencialmente o mesmo passado a um engenheiro nosso.
    Assim como nesse briefing real, o PM (product manager) buscou já comunicar o contexto do que
    imagina para a direção do produto muitos passos à frente e dá sugestões que podem ou não ser
    úteis. Caso você queira implementar até o fim do briefing, para fins de aprendizado próprio, etc.
    fique a vontade. Mas não é nossa expectativa. Conforme dito acima, a expectativa é que você
    faça o possível em 1-8 horas.
    Entender o que o PM está pensando, pensar quais aspectos do produto seria importante
    demonstrar numa prova de conceito no tempo limitado que você tem, usar premissas razoáveis
    onde falta informação - tudo isso faz parte do desafio.
    O projeto envolve chamadas a APIs de AI generativa (ex. OpenAI). Para obter uma chave
    temporária para testar com OpenAI, contatem Ozeias Furtozo +55-41-98773-7438 /
    ozeias@getstic.ky
    Caso tenham dúvidas sobre o projeto, contatem Alan Lammiman +55-11-97644-1542 /
    alan@getstic.ky
    É permitido o uso de AI
    É permitido incorporar código existente (ex. open source). Não há pontos por reinventar a roda.
    É permitido usar qualquer linguagem de programação (no nosso backend usamos principalmente
    Node.js com TypeScript)
    É permitido (dentro do razoável), fazer perguntas por whatsapp/email para o Alan.
    Não existe uma resposta certa única. Até mesmo o formato da entrega (ex. uma especificação
    técnica, um script, um repositório com código-fonte de um app, demo de um app em produção)
    pode variar, conforme sua disponibilidade de tempo e em qual parte do problema você focou.
    Marcaremos uma conversa rápida para falar sobre a entrega.
    Briefing do Product Manager
    Contexto - a feature/o produto que queremos criar - “Choose Your Story”

    Há uma categoria de muito sucesso de apps “Choose your Story” de histórias interativas: os
    usuários passam por uma história, no papel de um personagem, e podem fazer escolhas que
    adaptam a história.
    No formato mais simples, cada cena da história é uma imagem estática de tela cheia, com um
    texto curto de narração ou balão de texto se houver algum personagem falando. Tem um botão
    de ‘próximo’ se não houver escolha para o usuário, ou 2-3 botões se houver escolhas. Hoje em
    dia os apps incluem animações e outros detalhes, mas essa é a essencia. São basicamente
    graphic novels com multipla escolha e só 1 quadro por vez na tela.
    Exemplos:
        Episode: https://www.episodeinteractive.com/
        Choices: https://apps.apple.com/br/app/choices-stories-you-play/id
    Há um projeto open-source que é para histórias deste tipo, que pode ou não ser útil:
        https://twinery.org/
    Esse genero surgiu antes da AI generativa (na verdade ‘game-books’ nessa linha existem desde
    antes da internet, e os mais velhos entre nós lembram que a TV brasileira tinha o “Você Decide”)
    e portanto tinham algumas limitações técnicas:
    - Necessidade de ter um número limitado de finais diferentes e na verdade todas as
    escolhas convergem nesses finais.
    - Histórias com arte limitada (muitos são cenas dos mesmos personagens falando) para
    economizar em custo de criação.
    Entendemos que o uso da AI generativa para criar essas histórias pode abrir novas
    possibilidades para esse genero de jogo/aplicativo.
    Antes de criar o produto completo, queríamos só fazer uma prova de conceito da criação das
    histórias e artes usando IA. Conseguiríamos criar muitas histórias boas, com mais riqueza de
    escolhas e arte legal, com pouco envolvimento humano - praticamente só usando IA?
    Sugestão do PM de prova de conceito.
    Lembrando - isto é uma sugestão. Você é o(a) engenheiro(a). Se julgar que faz sentido, maravilha. Se
    julgar que o melhor caminho é outro, faça como achar melhor. E para dar o contexto completo, o PM está
    desenhando idéias de versões até bem em frente - não esperamos que você faça tudo. Se o que encaixa
    no tempo é uma boa implementação de só uma parte do passo V1, sem problemas.

    V1
    Tentar fazer, com um script ou app simples, a AI fazer uma história linear, sem escolhas. Ou seja,
    só uma ‘branch'. Usuário só avança ou volta
    Input inicial
    Usuário insere briefing geral da história (texto)
    AI retorna a proposta de história, usuário pode pedir ajustes
    Usuário insere # de cenas (telas) até o fim da história
    AI retorna as cenas (descrição da cena, texto da fala do personagem,
    texto do narrador, etc.), usuário pode pedir ajustes
    Estilo visual
    AI retorna 3 cenas distintas naquele estilo, usuário pode pedir ajustes no
    estilo ou alterar o estilo
    Dispara a criação das artes (lembrando que as artes iniciais precisam ser dadas como contexto
    para a criação das artes de cenas posteriores para ter consistencia de personagens), exporta
    tudo em formato utilizável

    Obs - OpenAI GPT permite a geração de texto e imagens. Se quiser usar outras AIs
    pode ser que sejam 2 AIs/APIs diferentes, etc.
    Algum formato simples para vermos a navegação dessa história (ex. na web)
    V2 (mais avançado)
    Expandir de história linear para múltiplos finais distintos (múltiplas branches, branches terminam
    em finais distintos, não há branches que voltam e cruzam/re-conectam com branch original):
    Input:
    Número de finais distintos (pode ser pequeno)
    Opcional - Briefing sobre quais são os finais distintos
    AI retorna as propostas de histórias com finais distintos, usuário pode pedir ajustes
    Usuário insere # de cenas (telas) das histórias com finais distintos
    AI retorna as cenas, usuário pode pedir ajustes
    Dispara a criação das artes, exporta tudo em formato utilizável (já mais complexo pq
    história não é linear)
    Algum formato para vermos a navegação dessa história (ex. na web)
    V3 (super avançado):
    Adicionar caminhos na história que saem de uma dada branch e voltam para a mesma branch
    Adicionar caminhos na história que saem de uma dada branch e terminam em outra
