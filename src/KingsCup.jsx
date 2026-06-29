import { useState, useEffect, useRef, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const SUITS = [
  { sym: "♠", color: "#1a1410" },
  { sym: "♥", color: "#9c2b3a" },
  { sym: "♦", color: "#9c2b3a" },
  { sym: "♣", color: "#1a1410" },
];

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const RULES = {
  A:   { title: "Wasserfall",    emoji: "🌊", text: "Alle trinken gleichzeitig. Du hörst zuerst auf – dann reihum der Nächste, einer nach dem anderen." },
  "2": { title: "Du",            emoji: "👉", text: "Du wählst jemanden – der trinkt." },
  "3": { title: "Ich",           emoji: "🙋", text: "Die Person, die gezogen hat, trinkt." },
  "4": { title: "Frauen",        emoji: "💃", text: "Alle Frauen am Tisch trinken." },
  "5": { title: "Daumenkrieg",   emoji: "👍", text: "Daumen auf den Tisch! Wer als Letzter nachzieht, trinkt." },
  "6": { title: "Männer",        emoji: "🕺", text: "Alle Männer am Tisch trinken." },
  "7": { title: "Himmel",        emoji: "🙌", text: "Hand hoch! Wer als Letzter die Hand hebt, trinkt." },
  "8": { title: "Kumpel",        emoji: "🤝", text: "Wähle einen Trink-Kumpel. Immer wenn du trinkst, trinkt er mit – bis zum Spielende." },
  "9": { title: "Reim",          emoji: "🎤", text: "Sag ein Wort. Reihum reimt sich jeder darauf. Wer keinen Reim findet, trinkt." },
  "10":{ title: "Kategorie",     emoji: "🗂️",  text: "Nenne eine Kategorie. Reihum nennt jeder ein Wort daraus. Wer zögert oder wiederholt, trinkt." },
  J:   { title: "Regel",         emoji: "📜", text: "Stelle eine neue Regel auf – sie gilt ab sofort für alle." },
  Q:   { title: "Frage",         emoji: "❓", text: "Stelle jemandem eine Frage. Wer antwortet, trinkt. Wer zurückfragt, leitet die Frage weiter." },
  K:   { title: "König",         emoji: "👑", text: "Gieße einen Schluck deines Getränks in den Becher. Wer den 4. König zieht, trinkt alles!" },
};

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit: suit.sym, color: suit.color });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CupVisual({ kingsDrawn }) {
  const fillPct = (kingsDrawn / 4) * 100;
  const colors = ["rgba(180,120,40,0.6)", "rgba(180,80,40,0.7)", "rgba(160,40,40,0.75)", "rgba(120,20,20,0.85)"];
  const fillColor = kingsDrawn > 0 ? colors[kingsDrawn - 1] : "transparent";

  return (
    <div title={`${kingsDrawn}/4 Könige`} style={{ position: "relative", width: 48, height: 56 }}>
      {/* Cup outline */}
      <svg width="48" height="56" viewBox="0 0 48 56" fill="none" style={{ position: "absolute", inset: 0 }}>
        {/* Fill */}
        {kingsDrawn > 0 && (
          <clipPath id="cup-clip">
            <path d="M8 8 L40 8 L35 50 L13 50 Z" />
          </clipPath>

        )}
        {kingsDrawn > 0 && (
          <rect
            x="8" y={8 + 42 * (1 - fillPct / 100)}
            width="40" height={42 * (fillPct / 100)}
            fill={fillColor}
            clipPath="url(#cup-clip)"
            style={{ transition: "all 0.5s ease" }}
          />
        )}
        {/* Cup shape */}
        <path d="M8 8 L40 8 L35 50 L13 50 Z" stroke="#c9a227" strokeWidth="2" fill="none" />
        <line x1="6" y1="8" x2="42" y2="8" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PlayingCard({ card, flipped, onClick, disabled }) {
  return (
    <div
      style={{ perspective: "1200px", width: 210, height: 300 }}
      onClick={!disabled ? onClick : undefined}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(.4,.2,.2,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          borderRadius: 16,
          background: "repeating-linear-gradient(135deg, #5c1f2a 0 10px, #4a1620 10px 20px)",
          border: "3px solid #c9a227",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "2px solid #c9a227",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, color: "#c9a227",
            fontFamily: "'Cormorant Garamond', serif",
          }}>♛</div>
        </div>

        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: 16,
          background: "#f3e9d2", border: "3px solid #c9a227",
          boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
          padding: "14px 16px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          {card && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, color: card.color, lineHeight: 1 }}>
                {card.rank}
                <div style={{ fontSize: 22 }}>{card.suit}</div>
              </div>
              <div style={{ alignSelf: "center", fontSize: 52, color: card.color, opacity: 0.9 }}>
                {card.suit}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, color: card.color, lineHeight: 1, alignSelf: "flex-end", transform: "rotate(180deg)" }}>
                {card.rank}
                <div style={{ fontSize: 22 }}>{card.suit}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [names, setNames] = useState(["", ""]);

  const addPlayer = () => {
    if (names.length < 8) setNames((n) => [...n, ""]);
  };

  const removePlayer = (i) => {
    if (names.length > 2) setNames((n) => n.filter((_, idx) => idx !== i));
  };

  const updateName = (i, val) => {
    setNames((n) => n.map((x, idx) => (idx === i ? val : x)));
  };

  const handleStart = () => {
    const players = names.map((n, i) => n.trim() || `Spieler ${i + 1}`);
    onStart(players);
  };

  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 14, letterSpacing: "0.35em", color: "#c9a227", marginBottom: 2 }}>
          EIN TRINKSPIEL
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 44, margin: 0, letterSpacing: "0.04em", color: "#f3e6cf", textShadow: "0 2px 18px rgba(201,162,39,0.25)" }}>
          King's Cup
        </h1>
      </div>

      <div style={{ marginBottom: 8, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#c9a227", fontWeight: 600 }}>
        Spieler
      </div>

      {names.map((name, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={`Spieler ${i + 1}`}
            maxLength={20}
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
          />
          {names.length > 2 && (
            <button onClick={() => removePlayer(i)} style={iconBtnStyle}>✕</button>
          )}
        </div>
      ))}

      {names.length < 8 && (
        <button onClick={addPlayer} style={{ ...ghostBtnStyle, width: "100%", marginBottom: 24, marginTop: 4 }}>
          + Spieler hinzufügen
        </button>
      )}

      <button onClick={handleStart} style={primaryBtnStyle}>
        Spiel starten
      </button>

      <div style={{ fontSize: 11, color: "#5c4a3c", marginTop: 20, textAlign: "center" }}>
        Namen sind optional – du kannst auch einfach loslegen.
      </div>
    </div>
  );
}

// ─── Main Game ────────────────────────────────────────────────────────────────

function Game({ players, onNewGame }) {
  const [deck, setDeck] = useState(() => buildDeck());
  const [drawnTotal, setDrawnTotal] = useState(0);    // total cards drawn this session (for log)
  const [current, setCurrent] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [kingsDrawn, setKingsDrawn] = useState(0);    // NEVER reset on reshuffle
  const [gameOver, setGameOver] = useState(false);
  const [log, setLog] = useState([]);
  const [activeRules, setActiveRules] = useState([]);
  const [ruleInput, setRuleInput] = useState("");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [kumpel, setKumpel] = useState(null);         // currently tracked drinking buddy
  const [showKumpelPicker, setShowKumpelPicker] = useState(false);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [deckVersion, setDeckVersion] = useState(1);  // tracks how many times deck was reshuffled
  const isDrawing = useRef(false);

  const currentPlayer = players[currentPlayerIdx];

  const drawCard = useCallback(() => {
    if (gameOver || isDrawing.current) return;
    isDrawing.current = true;

    setFlipped(false);
    setShowRuleForm(false);
    setShowKumpelPicker(false);

    setTimeout(() => {
      setDeck((prevDeck) => {
        let workDeck = prevDeck;
        let reshuffled = false;

        if (workDeck.length === 0) {
          workDeck = buildDeck();
          reshuffled = true;
          setDeckVersion((v) => v + 1);
        }

        const card = workDeck[0];
        const rest = workDeck.slice(1);

        setCurrent(card);
        setFlipped(true);
        setDrawnTotal((t) => t + 1);
        setLog((l) => [{ ...card, title: RULES[card.rank].title, player: players[currentPlayerIdx] }, ...l].slice(0, 20));
        setCurrentPlayerIdx((idx) => (idx + 1) % players.length);

        if (card.rank === "K") {
          // Functional update avoids stale closure
          setKingsDrawn((prev) => {
            const next = prev + 1;
            if (next >= 4) setGameOver(true);
            return next;
          });
        }

        if (card.rank === "J") setShowRuleForm(true);
        if (card.rank === "8") setShowKumpelPicker(true);

        isDrawing.current = false;
        return rest;
      });
    }, 220);
  }, [gameOver, currentPlayerIdx, players]);

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setActiveRules((r) => [...r, { text: ruleInput.trim(), id: Date.now() }]);
    setRuleInput("");
    setShowRuleForm(false);
  };

  const removeRule = (id) => setActiveRules((r) => r.filter((x) => x.id !== id));

  const rule = current ? RULES[current.rank] : null;

  return (
    <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.35em", color: "#c9a227" }}>
          EIN TRINKSPIEL
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 40, margin: "2px 0 0", color: "#f3e6cf", textShadow: "0 2px 18px rgba(201,162,39,0.25)" }}>
          King's Cup
        </h1>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid #2e1a14" }}>
        {/* King cup */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CupVisual kingsDrawn={kingsDrawn} />
          <div>
            <div style={{ fontSize: 11, color: "#7a6655", lineHeight: 1 }}>Könige</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#c9a227", fontWeight: 700, lineHeight: 1 }}>
              {kingsDrawn} / 4
            </div>
          </div>
        </div>

        {/* Current player */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#7a6655" }}>Am Zug</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#f3e6cf", fontWeight: 600 }}>
            {currentPlayer}
          </div>
        </div>

        {/* Deck count */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#7a6655" }}>Stapel</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#f3e6cf", fontWeight: 600 }}>
            {deck.length}
          </div>
          {deckVersion > 1 && (
            <div style={{ fontSize: 10, color: "#5c4632" }}>#{deckVersion}</div>
          )}
        </div>
      </div>

      {/* Kumpel banner */}
      {kumpel && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "7px 14px", borderRadius: 10, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)" }}>
          <span style={{ fontSize: 13, color: "#c9a227" }}>
            🤝 Trink-Kumpel: <strong>{kumpel}</strong>
          </span>
          <button onClick={() => setKumpel(null)} style={{ background: "none", border: "none", color: "#7a6655", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
        </div>
      )}

      {/* Card */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <PlayingCard card={current} flipped={flipped} onClick={drawCard} disabled={gameOver} />
      </div>

      {/* Rule / Game Over text */}
      <div style={{ minHeight: 80, textAlign: "center", marginBottom: 16, padding: "0 8px" }}>
        {gameOver ? (
          <>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c9a227", fontWeight: 700 }}>
              👑 Vierter König!
            </div>
            <div style={{ fontSize: 14, color: "#cdb89e", marginTop: 6, lineHeight: 1.5 }}>
              <strong>{log[0]?.player}</strong> hat den letzten König gezogen und muss den Becher leeren. Prost!
            </div>
          </>
        ) : rule ? (
          <>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c9a227", fontWeight: 700 }}>
              {rule.emoji} {rule.title}
            </div>
            <div style={{ fontSize: 14, color: "#cdb89e", marginTop: 6, lineHeight: 1.5 }}>
              {rule.text}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: "#a8927a", marginTop: 20 }}>Tippe auf die Karte, um zu starten.</div>
        )}
      </div>

      {/* Kumpel picker (card 8) */}
      {showKumpelPicker && players.length > 1 && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.25)" }}>
          <div style={{ fontSize: 13, color: "#c9a227", marginBottom: 8, fontWeight: 600 }}>Wähle deinen Trink-Kumpel:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {players
              .filter((_, i) => i !== (currentPlayerIdx === 0 ? players.length - 1 : currentPlayerIdx - 1))
              .map((p) => (
                <button
                  key={p}
                  onClick={() => { setKumpel(p); setShowKumpelPicker(false); }}
                  style={{ ...ghostBtnStyle, padding: "5px 14px", fontSize: 13 }}
                >
                  {p}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Jack: rule input */}
      {showRuleForm && (
        <div style={{ marginBottom: 14 }}>
          <input
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            placeholder="Neue Regel eintippen…"
            onKeyDown={(e) => e.key === "Enter" && addRule()}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addRule} style={{ ...primaryBtnStyle, flex: 1 }}>Festlegen</button>
            <button onClick={() => setShowRuleForm(false)} style={{ ...ghostBtnStyle, flex: 0.4 }}>Überspringen</button>
          </div>
        </div>
      )}

      {/* Draw / New game buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        {!gameOver && (
          <button onClick={drawCard} style={{ ...primaryBtnStyle, flex: 1 }}>
            Karte ziehen
          </button>
        )}
        <button
          onClick={onNewGame}
          style={gameOver ? { ...primaryBtnStyle, flex: 1 } : { ...ghostBtnStyle, flex: 0 }}
        >
          {gameOver ? "Neues Spiel" : "↺"}
        </button>
      </div>

      {/* Active rules */}
      {activeRules.length > 0 && (
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <SectionHeader>Geltende Regeln</SectionHeader>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {activeRules.map((r, i) => (
              <li key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < activeRules.length - 1 ? "1px solid #322019" : "none" }}>
                <span style={{ fontSize: 13, color: "#d8c4a8", flex: 1 }}>📜 {r.text}</span>
                <button onClick={() => removeRule(r.id)} style={{ background: "none", border: "none", color: "#5c4a3c", cursor: "pointer", fontSize: 15, padding: "0 0 0 10px", flexShrink: 0 }}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Card log */}
      {log.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader>Verlauf</SectionHeader>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {log.slice(1).map((c, i) => (
              <div
                key={i}
                title={`${c.player}: ${c.title}`}
                style={{
                  width: 38, height: 50, borderRadius: 6,
                  background: "#f3e9d2", border: "1px solid #5c4632",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  color: c.color, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 13,
                  opacity: Math.max(0.35, 0.9 - i * 0.06),
                  cursor: "default",
                }}
              >
                <div>{c.rank}</div>
                <div style={{ fontSize: 12 }}>{c.suit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#5c4a3c", textAlign: "center", paddingBottom: 16 }}>
        Bitte verantwortungsbewusst feiern. 🍻
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1px solid #5c4632", background: "#241413",
  color: "#f3e6cf", fontSize: 14, outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle = {
  padding: "12px 20px", borderRadius: 999,
  border: "none", background: "#c9a227",
  color: "#1b0e10", fontWeight: 700, fontSize: 14,
  cursor: "pointer", letterSpacing: "0.04em",
};

const ghostBtnStyle = {
  padding: "12px 20px", borderRadius: 999,
  border: "1px solid #5c4632", background: "transparent",
  color: "#c9a227", fontWeight: 500, fontSize: 14,
  cursor: "pointer",
};

const iconBtnStyle = {
  padding: "10px 14px", borderRadius: 10,
  border: "1px solid #5c4632", background: "transparent",
  color: "#7a6655", cursor: "pointer", flexShrink: 0,
};

function SectionHeader({ children }) {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#c9a227", fontWeight: 600, marginBottom: 10, borderBottom: "1px solid #4a342a", paddingBottom: 4 }}>
      {children}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function KingsCup() {
  const [players, setPlayers] = useState(null);

  // Load Google Fonts once
  useEffect(() => {
    const id = "kings-cup-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% -10%, #3a1820 0%, #1b0e10 55%, #120a0a 100%)",
      fontFamily: "'Inter', sans-serif",
      color: "#e8d9c4",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px 48px",
    }}>
      {players === null
        ? <SetupScreen onStart={setPlayers} />
        : <Game players={players} onNewGame={() => setPlayers(null)} />
      }
    </div>
  );
}
