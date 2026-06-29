export const SUITS = [
  { sym: "♠", color: "#1a1410" },
  { sym: "♥", color: "#9c2b3a" },
  { sym: "♦", color: "#9c2b3a" },
  { sym: "♣", color: "#1a1410" },
];

export const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

export const RULES = {
  A:    { title: "Wasserfall",  emoji: "🌊", text: "Alle trinken gleichzeitig. Du hörst zuerst auf – dann reihum der Nächste." },
  "2":  { title: "Du",         emoji: "👉", text: "Du wählst jemanden – der trinkt." },
  "3":  { title: "Ich",        emoji: "🙋", text: "Die Person, die gezogen hat, trinkt." },
  "4":  { title: "Frauen",     emoji: "💃", text: "Alle Frauen am Tisch trinken." },
  "5":  { title: "Daumen",     emoji: "👍", text: "Daumen auf den Tisch! Wer als Letzter nachzieht, trinkt." },
  "6":  { title: "Männer",     emoji: "🕺", text: "Alle Männer am Tisch trinken." },
  "7":  { title: "Himmel",     emoji: "🙌", text: "Hand hoch! Wer als Letzter die Hand hebt, trinkt." },
  "8":  { title: "Kumpel",     emoji: "🤝", text: "Wähle einen Trink-Kumpel. Immer wenn du trinkst, trinkt er mit." },
  "9":  { title: "Reim",       emoji: "🎤", text: "Sag ein Wort. Reihum reimt jeder darauf. Wer keinen Reim findet, trinkt." },
  "10": { title: "Kategorie",  emoji: "🗂️", text: "Nenne eine Kategorie. Reihum nennt jeder ein Wort. Wer zögert, trinkt." },
  J:    { title: "Regel",      emoji: "📜", text: "Stelle eine neue Regel auf – sie gilt ab sofort für alle." },
  Q:    { title: "Frage",      emoji: "❓", text: "Stelle jemandem eine Frage. Wer antwortet, trinkt." },
  K:    { title: "König",      emoji: "👑", text: "Gieße einen Schluck in den Becher. Wer den 4. König zieht, trinkt alles!" },
};

export function buildDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ rank, suit: suit.sym, color: suit.color });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function makeInitialState(players) {
  return {
    deck: buildDeck(),
    current: null,
    kingsDrawn: 0,
    gameOver: false,
    activeRules: [],
    kumpel: null,
    currentPlayerIdx: 0,
    lastDrawerIdx: null,
    drawCount: 0,
    log: [],
    players,
    deckVersion: 1,
    showRuleForm: false,
    showKumpelPicker: false,
  };
}

export function processAction(state, action) {
  switch (action.type) {
    case "DRAW": {
      if (state.gameOver) return state;
      let { deck, deckVersion } = state;
      if (deck.length === 0) { deck = buildDeck(); deckVersion += 1; }
      const card = deck[0];
      const rest = deck.slice(1);
      let kingsDrawn = state.kingsDrawn;
      let gameOver = false;
      if (card.rank === "K") { kingsDrawn += 1; if (kingsDrawn >= 4) gameOver = true; }
      const log = [
        { ...card, title: RULES[card.rank].title, player: state.players[state.currentPlayerIdx] },
        ...state.log,
      ].slice(0, 20);
      return {
        ...state,
        deck: rest,
        current: card,
        kingsDrawn,
        gameOver,
        log,
        lastDrawerIdx: state.currentPlayerIdx,
        currentPlayerIdx: (state.currentPlayerIdx + 1) % state.players.length,
        deckVersion,
        drawCount: state.drawCount + 1,
        showRuleForm: card.rank === "J",
        showKumpelPicker: card.rank === "8",
      };
    }
    case "ADD_RULE":
      return { ...state, activeRules: [...state.activeRules, { text: action.text, id: Date.now() }], showRuleForm: false };
    case "REMOVE_RULE":
      return { ...state, activeRules: state.activeRules.filter(r => r.id !== action.id) };
    case "SET_KUMPEL":
      return { ...state, kumpel: action.player, showKumpelPicker: false };
    case "CLEAR_KUMPEL":
      return { ...state, kumpel: null };
    case "DISMISS_RULE_FORM":
      return { ...state, showRuleForm: false };
    case "NEW_GAME":
      return makeInitialState(state.players);
    default:
      return state;
  }
}

// Strip deck from state before sending over the wire
export function serializeState(state) {
  const { deck, ...rest } = state;
  return { ...rest, deckLength: deck.length };
}

export function roomCodeToPeerId(code) {
  return `kc-${code.toLowerCase()}`;
}

export function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}
