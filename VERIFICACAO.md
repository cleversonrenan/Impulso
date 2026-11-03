# Verificação — IMPULSO HTML

Data: 3 de novembro de 2026.

- HTML único gerado com JavaScript e estilos incorporados. Fontes possuem fallback; Firebase é carregado sob demanda da CDN oficial.
- 19 testes automatizados passaram, incluindo 127 combinações de disponibilidade e 225 combinações de modalidade, nível, duração e equipamentos.
- Verificados no navegador: perfil local, geração semanal, início de treino, carga/repetições, concluir série, início automático do descanso, pausa/continuação, expiração visual do contador, adaptação academia/calistenia, preservação das séries feitas, substituição manual, bloqueio sem equipamento compatível, pular séries e finalizar parcialmente com histórico correto.
- Recarregamento da página preservou série feita, carga de 12 kg, exercício adaptado e tempo pausado. Os valores usados eram dados de teste locais e não estão incorporados ao HTML distribuído.
- Layout conferido em larguras de celular (390 px) e computador (1280 px), sem excesso de largura da página no celular. Capturas em previa-semana.jpg e previa-treino.jpg.
- JavaScript passou pela verificação de sintaxe. Não houve erros no console durante o fluxo local testado.
- Firebase usa os mesmos caminhos e formatos do aplicativo Android: trainingProfiles, weeklyPlans e workoutSessions. As regras fornecidas são as mesmas da versão 0.4.0, anteriormente testadas no emulador. Não foram alteradas nem publicadas neste trabalho.
- Login com conta real, recebimento de e-mail e sincronização em produção não foram testados. Exigem domínio autorizado, provedores habilitados e chave cliente permitida para web. Nenhuma conta fictícia foi criada.
- Emissão audível e vibração em aparelho físico ainda precisam ser conferidas. A expiração do contador foi observada no navegador. Páginas suspensas ou fechadas não oferecem a garantia de alarme de um serviço nativo Android.
- A exportação/importação possui validação e confirmação no código; o fluxo completo de seleção de arquivo não foi testado via navegador.

## Reproduzir

1. `node build.cjs`
2. `node --check src/app.js`
3. `node --test --test-isolation=none tests/core.test.cjs`
4. `node serve.cjs`, abrir http://localhost:8794 e selecionar Usar só neste navegador.

Para distribuição, use IMPULSO.html. Consulte LEIA-ME.html para login, hospedagem e diferenças entre armazenamento local e conta.
