(function () {
  'use strict';

  var MISSION_ID = 'letrion-prologo';
  var decision = null;
  var sceneIndex = 0;

  var scenes = [
    {
      id: 'awakening', step: 1, scene: 'cockpit', characters: ['pingo'],
      kicker: 'Prólogo · Órbita de Letrion', title: 'Um sinal na escuridão',
      speaker: 'Pingo', avatar: '🤖',
      text: 'Você acordou! Eu sou Pingo, robô de manutenção e, desde agora, seu companheiro de bordo. Acabamos de receber uma transmissão muito estranha.',
      type: 'continue', cta: 'Abrir transmissão'
    },
    {
      id: 'signal', step: 1, scene: 'signal', characters: ['pingo'],
      kicker: 'Cabine da nave', title: 'A mensagem quebrada',
      speaker: 'Pingo', avatar: '🤖',
      text: 'O Eclipse apagou partes do sinal. Toque nas sílabas na ordem certa para montar a palavra que chegou de Letrion.',
      type: 'syllables'
    },
    {
      id: 'landing', step: 2, scene: 'letrion', characters: ['pingo', 'iris'],
      kicker: 'Planeta Letrion', title: 'A guardiã da biblioteca',
      speaker: 'Mestra Íris', avatar: '✦',
      text: 'Ainda bem que vieram! Palavras inteiras estão desaparecendo dos livros. Uma criatura de tinta passou por aqui pouco antes de tudo começar.',
      type: 'continue', cta: 'Investigar os jardins'
    },
    {
      id: 'trail', step: 3, scene: 'trail', characters: ['pingo', 'iris'],
      kicker: 'Jardins de Letrion', title: 'Rastros de tinta',
      speaker: 'Pingo', avatar: '🤖',
      text: 'Meu detector encontrou cinco marcas, mas apenas três são tinta fresca. Encontre os rastros que ainda estão brilhando.',
      type: 'clues'
    },
    {
      id: 'parkour', step: 4, scene: 'bridge', characters: ['pingo'],
      kicker: 'Ponte das Palavras', title: 'O caminho desapareceu',
      speaker: 'Pingo', avatar: '🤖',
      text: 'A ponte só reaparece quando as palavras são completadas. Corra pelas trilhas e recupere cinco delas para atravessarmos!',
      type: 'parkour'
    },
    {
      id: 'risco', step: 5, scene: 'risco', characters: ['pingo', 'risco'],
      kicker: 'Entrada da biblioteca', title: 'A criatura de tinta',
      speaker: 'Risco', avatar: '●',
      text: 'Parem! Eu não roubei as palavras. Eu estava tentando avisar todo mundo, mas aquela sombra me seguiu até aqui!',
      type: 'choice'
    },
    {
      id: 'library', step: 6, scene: 'library', characters: ['iris', 'risco'],
      kicker: 'Porta da biblioteca', title: 'A história fora de ordem',
      speaker: 'Mestra Íris', avatar: '✦',
      text: 'A porta perdeu a memória do que aconteceu. Recoloque os três acontecimentos na ordem correta para ela se lembrar.',
      type: 'sequence'
    },
    {
      id: 'finale', step: 7, scene: 'finale', characters: ['pingo', 'iris', 'risco'],
      kicker: 'Biblioteca de Letrion', title: 'O primeiro fragmento',
      speaker: 'Pingo', avatar: '🤖',
      text: 'Encontramos um fragmento do Cristal do Conhecimento! Mas aquela sombra no céu… isso foi só o começo do Eclipse.',
      type: 'finale'
    }
  ];

  function $(id) { return document.getElementById(id); }

  function progressApi() {
    return window.MeuPlanetinha && window.MeuPlanetinha.progress;
  }

  function save(changes) {
    var api = progressApi();
    if (api && api.saveNarrative) api.saveNarrative(MISSION_ID, changes);
  }

  function setFeedback(message, good) {
    var feedback = $('story-feedback');
    feedback.textContent = message || '';
    feedback.classList.toggle('is-good', Boolean(good));
  }

  function showCharacters(names) {
    document.querySelectorAll('[data-character]').forEach(function (character) {
      character.classList.toggle('is-visible', names.indexOf(character.dataset.character) !== -1);
    });
  }

  function setContinue(label, enabled) {
    var button = $('story-continue');
    $('story-actions').innerHTML = '';
    button = document.createElement('button');
    button.id = 'story-continue';
    button.type = 'button';
    button.className = 'story-btn story-btn--primary';
    button.disabled = !enabled;
    button.innerHTML = label + ' <span aria-hidden="true">→</span>';
    button.addEventListener('click', nextScene);
    $('story-actions').appendChild(button);
  }

  function renderSyllablePuzzle() {
    var interaction = $('story-interaction');
    interaction.innerHTML =
      '<div class="word-builder" aria-label="Monte a palavra ajuda">' +
        '<div class="word-builder__answer" id="word-answer"><span>_</span><span>_</span><span>_</span></div>' +
        '<div class="choice-row">' +
          '<button type="button" class="puzzle-chip" data-order="1">JU</button>' +
          '<button type="button" class="puzzle-chip" data-order="2">DA</button>' +
          '<button type="button" class="puzzle-chip" data-order="0">A</button>' +
        '</div>' +
        '<p class="puzzle-hint">Dica: é o que pedimos quando precisamos de alguém.</p>' +
      '</div>';

    var selected = [];
    var slots = interaction.querySelectorAll('#word-answer span');
    interaction.querySelectorAll('.puzzle-chip').forEach(function (button) {
      button.addEventListener('click', function () {
        var expected = selected.length;
        if (Number(button.dataset.order) !== expected) {
          selected = [];
          slots.forEach(function (slot) { slot.textContent = '_'; });
          interaction.querySelectorAll('.puzzle-chip').forEach(function (chip) { chip.disabled = false; });
          setFeedback('Quase! Tente começar pelo som inicial da palavra.', false);
          return;
        }
        selected.push(button.textContent);
        slots[expected].textContent = button.textContent;
        button.disabled = true;
        setFeedback(selected.length === 3 ? 'AJUDA! A transmissão foi reconstruída.' : 'Boa! Continue.', true);
        if (selected.length === 3) setContinue('Responder ao chamado', true);
      });
    });
    setContinue('Responder ao chamado', false);
  }

  function renderCluePuzzle() {
    var interaction = $('story-interaction');
    interaction.innerHTML =
      '<div class="clue-field" aria-label="Área com rastros de tinta">' +
        '<button type="button" class="ink-clue ink-clue--one" data-clue="PONTE" aria-label="Rastro brilhante perto das flores"></button>' +
        '<button type="button" class="ink-clue ink-clue--dry" aria-label="Mancha antiga perto da pedra"></button>' +
        '<button type="button" class="ink-clue ink-clue--two" data-clue="MEDO" aria-label="Rastro brilhante perto da placa"></button>' +
        '<button type="button" class="ink-clue ink-clue--dry-two" aria-label="Sombra de uma folha"></button>' +
        '<button type="button" class="ink-clue ink-clue--three" data-clue="LIVROS" aria-label="Rastro brilhante perto do caminho"></button>' +
        '<span class="clue-scenery clue-flower">✿</span><span class="clue-scenery clue-stone">●</span><span class="clue-scenery clue-sign">↗</span>' +
      '</div>' +
      '<div class="clue-words" id="clue-words"><span>?</span><span>?</span><span>?</span></div>';

    var found = [];
    var wordSlots = interaction.querySelectorAll('#clue-words span');
    interaction.querySelectorAll('.ink-clue').forEach(function (button) {
      button.addEventListener('click', function () {
        var clue = button.dataset.clue;
        if (!clue) {
          setFeedback('Essa marca já está seca. Procure uma que ainda brilhe lilás.', false);
          return;
        }
        if (button.classList.contains('is-found')) return;
        button.classList.add('is-found');
        button.disabled = true;
        wordSlots[found.length].textContent = clue;
        found.push(clue);
        setFeedback('Rastro encontrado: ' + clue + '.', true);
        if (found.length === 3) {
          setFeedback('PONTE, MEDO, LIVROS… as pistas levam até a biblioteca!', true);
          setContinue('Seguir até a ponte', true);
        }
      });
    });
    setContinue('Seguir até a ponte', false);
  }

  function renderParkour() {
    $('story-interaction').innerHTML =
      '<div class="bridge-preview" aria-hidden="true"><span></span><span></span><span></span><b>?</b><b>?</b><b>?</b></div>' +
      '<p class="interaction-note">Esta parte abre uma versão curta do Palavra Parkour e volta para a história ao terminar.</p>';
    $('story-actions').innerHTML =
      '<a class="story-btn story-btn--primary" id="parkour-link" href="jogos/jogar.html?game=jogo-de-silaba&amp;mission=letrion-prologo&amp;build=narrativa-v1">Atravessar no Palavra Parkour <span aria-hidden="true">→</span></a>';
    $('parkour-link').addEventListener('click', function () {
      save({ stage: 'parkour', sceneIndex: sceneIndex });
    });
  }

  function renderChoice() {
    $('story-interaction').innerHTML =
      '<div class="dialogue-choices" role="group" aria-label="Como responder ao Risco?">' +
        '<button type="button" class="choice-card" data-decision="perseguir"><strong>Vamos atrás da sombra!</strong><span>Agir rápido antes que ela fuja.</span></button>' +
        '<button type="button" class="choice-card" data-decision="escutar"><strong>Conte o que você viu.</strong><span>Ouvir Risco antes de decidir.</span></button>' +
      '</div>';
    $('story-actions').innerHTML = '';
    document.querySelectorAll('[data-decision]').forEach(function (button) {
      button.addEventListener('click', function () {
        decision = button.dataset.decision;
        save({ decision: decision });
        document.querySelectorAll('[data-decision]').forEach(function (choice) {
          choice.classList.toggle('is-selected', choice === button);
          choice.disabled = true;
        });
        if (decision === 'escutar') {
          $('dialogue-text').textContent = 'Obrigado por me ouvir. A sombra tocou os livros e eles começaram a esquecer suas próprias histórias.';
          setFeedback('Ouvir revelou uma pista importante.', true);
        } else {
          $('dialogue-text').textContent = 'Eu também quero impedir a sombra! Mas, se corrermos sem entender o que aconteceu, podemos perder a única pista.';
          setFeedback('Pingo lembra: investigar também faz parte da aventura.', false);
        }
        setContinue('Reconstruir a história', true);
      });
    });
  }

  function renderSequencePuzzle() {
    var interaction = $('story-interaction');
    interaction.innerHTML =
      '<div class="sequence-slots" id="sequence-slots"><span>1</span><span>2</span><span>3</span></div>' +
      '<div class="sequence-options">' +
        '<button type="button" class="sequence-card" data-order="2">A biblioteca fechou as portas para proteger os livros.</button>' +
        '<button type="button" class="sequence-card" data-order="0">Risco viu o Eclipse tocar as estantes.</button>' +
        '<button type="button" class="sequence-card" data-order="1">Risco correu para avisar Mestra Íris.</button>' +
      '</div>';
    var chosen = [];
    var slots = interaction.querySelectorAll('#sequence-slots span');
    interaction.querySelectorAll('.sequence-card').forEach(function (button) {
      button.addEventListener('click', function () {
        var expected = chosen.length;
        if (Number(button.dataset.order) !== expected) {
          chosen = [];
          slots.forEach(function (slot, index) { slot.textContent = String(index + 1); });
          interaction.querySelectorAll('.sequence-card').forEach(function (card) { card.disabled = false; card.classList.remove('is-used'); });
          setFeedback('Essa parte aconteceu depois. Recomece pelo primeiro acontecimento.', false);
          return;
        }
        chosen.push(button.textContent);
        slots[expected].textContent = button.textContent;
        button.disabled = true;
        button.classList.add('is-used');
        if (chosen.length === 3) {
          setFeedback('História recuperada! A porta reconheceu a sequência.', true);
          setContinue('Abrir a biblioteca', true);
        } else {
          setFeedback('Certo. O que aconteceu em seguida?', true);
        }
      });
    });
    setContinue('Abrir a biblioteca', false);
  }

  function renderFinale() {
    $('story-interaction').innerHTML =
      '<div class="crystal-reward"><span aria-hidden="true">◆</span><div><strong>Fragmento de Letrion</strong><small>Primeiro Cristal do Conhecimento</small></div><b>+25 ★</b></div>' +
      '<p class="final-choice-note">' + (decision === 'escutar'
        ? 'Risco confia em você porque você escolheu ouvir sua história.'
        : 'Risco decide ajudar depois que vocês investigam os fatos juntos.') + '</p>';
    $('story-actions').innerHTML =
      '<a class="story-btn story-btn--primary" href="nave.html">Voltar para a Nave Central <span aria-hidden="true">→</span></a>' +
      '<a class="story-btn story-btn--quiet" href="missao-letrion.html?replay=1">Jogar novamente</a>';
    save({ stage: 'completed', sceneIndex: sceneIndex, decision: decision, completed: true });
  }

  function renderScene() {
    var scene = scenes[sceneIndex];
    $('mission-stage').dataset.scene = scene.scene;
    $('scene-kicker').textContent = scene.kicker;
    $('scene-title').textContent = scene.title;
    $('dialogue-speaker').textContent = scene.speaker;
    $('dialogue-avatar').textContent = scene.avatar;
    $('dialogue-text').textContent = scene.text;
    $('mission-step-label').textContent = 'Etapa ' + scene.step + ' de 7';
    $('mission-progress-bar').style.width = ((scene.step / 7) * 100) + '%';
    $('story-interaction').innerHTML = '';
    $('story-actions').innerHTML = '';
    setFeedback('', false);
    showCharacters(scene.characters);
    save({ stage: scene.id, sceneIndex: sceneIndex, decision: decision });

    if (scene.type === 'continue') setContinue(scene.cta, true);
    if (scene.type === 'syllables') renderSyllablePuzzle();
    if (scene.type === 'clues') renderCluePuzzle();
    if (scene.type === 'parkour') renderParkour();
    if (scene.type === 'choice') renderChoice();
    if (scene.type === 'sequence') renderSequencePuzzle();
    if (scene.type === 'finale') renderFinale();
  }

  function nextScene() {
    if (sceneIndex < scenes.length - 1) {
      sceneIndex += 1;
      renderScene();
    }
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var api = progressApi();
    var saved = (api && api.getNarrative && api.getNarrative(MISSION_ID)) || {};
    decision = saved.decision || null;

    if (params.get('resume') === 'parkour') {
      sceneIndex = 5;
    } else if (params.get('replay') === '1') {
      sceneIndex = 0;
    } else if (saved.completed) {
      sceneIndex = scenes.length - 1;
    } else if (Number.isInteger(saved.sceneIndex)) {
      sceneIndex = Math.max(0, Math.min(saved.sceneIndex, scenes.length - 1));
    }

    renderScene();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
