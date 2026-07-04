import { useState, useEffect, useRef, useReducer, useCallback } from "react";
import { RULES, makeInitialState, processAction } from "./data.js";
import { inputStyle, primaryBtnStyle, ghostBtnStyle, iconBtnStyle } from "./styles.js";
import MultiGame from "./MultiGame.jsx";

// ─── Shared UI ────────────────────────────────────────────────────────────────

export function CupVisual({ kingsDrawn }) {
  const fillPct = (kingsDrawn / 4) * 100;
  const colors = ["rgba(180,120,40,0.6)","rgba(180,80,40,0.7)","rgba(160,40,40,0.75)","rgba(120,20,20,0.85)"];
  const fillColor = kingsDrawn > 0 ? colors[kingsDrawn - 1] : "transparent";
  return (
    <div title={`${kingsDrawn}/4 Könige`} style={{ position: "relative", width: 48, height: 56 }}>
      <svg width="48" height="56" viewBox="0 0 48 56" fill="none" style={{ position: "absolute", inset: 0 }}>
        {kingsDrawn > 0 && (
          <>
            <clipPath id="cup-clip"><path d="M8 8 L40 8 L35 50 L13 50 Z" /></clipPath>
            <rect x="8" y={8 + 42 * (1 - fillPct / 100)} width="40"
              height={42 * (fillPct / 100)} fill={fillColor} clipPath="url(#cup-clip)"
              style={{ transition: "all 0.5s ease" }} />
          </>
        )}
        <path d="M8 8 L40 8 L35 50 L13 50 Z" stroke="#c9a227" strokeWidth="2" fill="none" />
        <line x1="6" y1="8" x2="42" y2="8" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function PlayingCard({ card, flipped, onClick, disabled }) {
  return (
    <div style={{ perspective: "1200px", width: 210, height: 300 }} onClick={!disabled ? onClick : undefined}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(.4,.2,.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        cursor: disabled ? "default" : "pointer",
      }}>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 16,
          background: "repeating-linear-gradient(135deg,#5c1f2a 0 10px,#4a1620 10px 20px)",
          border: "3px solid #c9a227",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", border: "2px solid #c9a227",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, color: "#c9a227", fontFamily: "'Cormorant Garamond', serif",
          }}>♛</div>
        </div>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: 16,
          background: "#f3e9d2", border: "3px solid #c9a227",
          boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
          padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          {card && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, color: card.color, lineHeight: 1 }}>
                {card.rank}<div style={{ fontSize: 22 }}>{card.suit}</div>
              </div>
              <div style={{ alignSelf: "center", fontSize: 52, color: card.color, opacity: 0.9 }}>{card.suit}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, color: card.color, lineHeight: 1, alignSelf: "flex-end", transform: "rotate(180deg)" }}>
                {card.rank}<div style={{ fontSize: 22 }}>{card.suit}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ children }) {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#c9a227", fontWeight: 600, marginBottom: 10, borderBottom: "1px solid #4a342a", paddingBottom: 4 }}>
      {children}
    </div>
  );
}

export function GameHeader() {
  return (
    <div style={{ textAlign: "center", marginBottom: 14 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.35em", color: "#c9a227" }}>EIN TRINKSPIEL</div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 40, margin: "2px 0 0", color: "#f3e6cf", textShadow: "0 2px 18px rgba(201,162,39,0.25)" }}>King's Cup</h1>
    </div>
  );
}

export function RuleText({ state, gameOver, lastDrawerName }) {
  const rule = state?.current ? RULES[state.current.rank] : null;
  return (
    <div style={{ minHeight: 80, textAlign: "center", marginBottom: 16, padding: "0 8px" }}>
      {gameOver ? (
        <>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c9a227", fontWeight: 700 }}>👑 Vierter König!</div>
          <div style={{ fontSize: 14, color: "#cdb89e", marginTop: 6, lineHeight: 1.5 }}>
            <strong>{lastDrawerName}</strong> hat den letzten König gezogen und muss den Becher leeren. Prost!
          </div>
        </>
      ) : rule ? (
        <>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c9a227", fontWeight: 700 }}>{rule.emoji} {rule.title}</div>
          <div style={{ fontSize: 14, color: "#cdb89e", marginTop: 6, lineHeight: 1.5 }}>{rule.text}</div>
        </>
      ) : (
        <div style={{ fontSize: 14, color: "#a8927a", marginTop: 20 }}>Tippe auf die Karte, um zu starten.</div>
      )}
    </div>
  );
}

export function StatusBar({ state, deckLength }) {
  const { kingsDrawn, players, currentPlayerIdx, deckVersion } = state;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid #2e1a14" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CupVisual kingsDrawn={kingsDrawn} />
        <div>
          <div style={{ fontSize: 11, color: "#7a6655", lineHeight: 1 }}>Könige</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#c9a227", fontWeight: 700, lineHeight: 1 }}>{kingsDrawn} / 4</div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#7a6655" }}>Am Zug</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#f3e6cf", fontWeight: 600 }}>{players[currentPlayerIdx]}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "#7a6655" }}>Stapel</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#f3e6cf", fontWeight: 600 }}>{deckLength}</div>
        {deckVersion > 1 && <div style={{ fontSize: 10, color: "#5c4632" }}>#{deckVersion}</div>}
      </div>
    </div>
  );
}

export function ActiveRules({ rules, onRemove }) {
  if (!rules.length) return null;
  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <SectionHeader>Geltende Regeln</SectionHeader>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {rules.map((r, i) => (
          <li key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < rules.length - 1 ? "1px solid #322019" : "none" }}>
            <span style={{ fontSize: 13, color: "#d8c4a8", flex: 1 }}>📜 {r.text}</span>
            {onRemove && <button onClick={() => onRemove(r.id)} style={{ background: "none", border: "none", color: "#5c4a3c", cursor: "pointer", fontSize: 15, padding: "0 0 0 10px" }}>✕</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CardLog({ log }) {
  if (log.length <= 1) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader>Verlauf</SectionHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {log.slice(1).map((c, i) => (
          <div key={i} title={`${c.player}: ${c.title}`} style={{
            width: 38, height: 50, borderRadius: 6,
            background: "#f3e9d2", border: "1px solid #5c4632",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: c.color, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 13,
            opacity: Math.max(0.35, 0.9 - i * 0.06), cursor: "default",
          }}>
            <div>{c.rank}</div><div style={{ fontSize: 12 }}>{c.suit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mode Select ──────────────────────────────────────────────────────────────

function ModeSelect({ onSelect }) {
  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 48, margin: 0, color: "#f3e6cf", textShadow: "0 2px 18px rgba(201,162,39,0.25)" }}>King's Cup</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button onClick={() => onSelect("single")} style={{
          ...primaryBtnStyle, padding: "20px 24px", borderRadius: 16,
          display: "flex", alignItems: "center", gap: 16, textAlign: "left", fontSize: 15,
        }}>
          <span style={{ fontSize: 32 }}>📱</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Ein Gerät</div>
            <div style={{ fontWeight: 400, fontSize: 13, opacity: 0.75 }}>Alle spielen auf einem Handy</div>
          </div>
        </button>

        <button onClick={() => onSelect("multi")} style={{
          ...ghostBtnStyle, padding: "20px 24px", borderRadius: 16,
          display: "flex", alignItems: "center", gap: 16, textAlign: "left", fontSize: 15,
        }}>
          <span style={{ fontSize: 32 }}>🔗</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Mehrere Geräte</div>
            <div style={{ fontWeight: 400, fontSize: 13, opacity: 0.75 }}>Jeder zieht auf seinem eigenen Handy</div>
          </div>
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#5c4a3c", marginTop: 32, textAlign: "center" }}>
        Bitte verantwortungsbewusst feiern. 🍻
      </div>
    </div>
  );
}

// ─── Setup Screen (single device) ────────────────────────────────────────────

function SetupScreen({ onStart, onBack }) {
  const [names, setNames] = useState(["", ""]);

  const addPlayer = () => { if (names.length < 8) setNames(n => [...n, ""]); };
  const removePlayer = i => { if (names.length > 2) setNames(n => n.filter((_, idx) => idx !== i)); };
  const updateName = (i, val) => setNames(n => n.map((x, idx) => idx === i ? val : x));

  const handleStart = () => {
    const players = names.map((n, i) => n.trim() || `Spieler ${i + 1}`);
    onStart(players);
  };

  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <GameHeader />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...iconBtnStyle, padding: "6px 10px" }}>←</button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#c9a227", fontWeight: 600 }}>Spieler</div>
      </div>

      {names.map((name, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={name} onChange={e => updateName(i, e.target.value)}
            placeholder={`Spieler ${i + 1}`} maxLength={20} style={inputStyle}
            onKeyDown={e => e.key === "Enter" && handleStart()} />
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
      <button onClick={handleStart} style={{ ...primaryBtnStyle, width: "100%" }}>Spiel starten</button>
      <div style={{ fontSize: 11, color: "#5c4a3c", marginTop: 16, textAlign: "center" }}>Namen sind optional.</div>
    </div>
  );
}

// ─── Single-device Game ───────────────────────────────────────────────────────

function Game({ players, onExit }) {
  const [state, dispatch] = useReducer(processAction, null, () => makeInitialState(players));
  const [flipped, setFlipped] = useState(false);
  const [ruleInput, setRuleInput] = useState("");
  const isDrawing = useRef(false);

  const prevDrawCount = useRef(0);
  useEffect(() => {
    if (state.drawCount > prevDrawCount.current) {
      prevDrawCount.current = state.drawCount;
      setFlipped(false);
      const t = setTimeout(() => setFlipped(true), 50);
      return () => clearTimeout(t);
    }
  }, [state.drawCount]);

  const drawCard = useCallback(() => {
    if (state.gameOver || isDrawing.current) return;
    isDrawing.current = true;
    setFlipped(false);
    setTimeout(() => {
      dispatch({ type: "DRAW" });
      isDrawing.current = false;
    }, 220);
  }, [state.gameOver]);

  const addRule = () => {
    if (!ruleInput.trim()) return;
    dispatch({ type: "ADD_RULE", text: ruleInput.trim() });
    setRuleInput("");
  };

  const lastDrawerName = state.lastDrawerIdx !== null ? state.players[state.lastDrawerIdx] : null;

  return (
    <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
      <GameHeader />
      <StatusBar state={state} deckLength={state.deck.length} />

      {state.kumpel && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "7px 14px", borderRadius: 10, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)" }}>
          <span style={{ fontSize: 13, color: "#c9a227" }}>🤝 Trink-Kumpel: <strong>{state.kumpel}</strong></span>
          <button onClick={() => dispatch({ type: "CLEAR_KUMPEL" })} style={{ background: "none", border: "none", color: "#7a6655", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <PlayingCard card={state.current} flipped={flipped} onClick={drawCard} disabled={state.gameOver} />
      </div>

      <RuleText state={state} gameOver={state.gameOver} lastDrawerName={lastDrawerName} />

      {/* Kumpel picker */}
      {state.showKumpelPicker && players.length > 1 && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.25)" }}>
          <div style={{ fontSize: 13, color: "#c9a227", marginBottom: 8, fontWeight: 600 }}>Wähle deinen Trink-Kumpel:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {players.filter((_, i) => i !== state.lastDrawerIdx).map(p => (
              <button key={p} onClick={() => dispatch({ type: "SET_KUMPEL", player: p })}
                style={{ ...ghostBtnStyle, padding: "5px 14px", fontSize: 13 }}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Jack rule form */}
      {state.showRuleForm && (
        <div style={{ marginBottom: 14 }}>
          <input value={ruleInput} onChange={e => setRuleInput(e.target.value)}
            placeholder="Neue Regel eintippen…"
            onKeyDown={e => e.key === "Enter" && addRule()}
            style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addRule} style={{ ...primaryBtnStyle, flex: 1 }}>Festlegen</button>
            <button onClick={() => dispatch({ type: "DISMISS_RULE_FORM" })} style={{ ...ghostBtnStyle, flex: 0.4 }}>Überspringen</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        {!state.gameOver && <button onClick={drawCard} style={{ ...primaryBtnStyle, flex: 1 }}>Karte ziehen</button>}
        {state.gameOver
          ? <button onClick={() => dispatch({ type: "NEW_GAME" })} style={{ ...primaryBtnStyle, flex: 1 }}>Neues Spiel</button>
          : <button onClick={onExit} style={{ ...ghostBtnStyle, flex: 0 }} title="Zurück zum Menü">↺</button>
        }
      </div>

      <ActiveRules rules={state.activeRules} onRemove={id => dispatch({ type: "REMOVE_RULE", id })} />
      <CardLog log={state.log} />
      <div style={{ fontSize: 11, color: "#5c4a3c", textAlign: "center", paddingBottom: 16 }}>Bitte verantwortungsbewusst feiern. 🍻</div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function KingsCup() {
  // Check URL for room param (multiplayer guest join)
  const urlRoom = new URLSearchParams(window.location.search).get("room");
  const [mode, setMode] = useState(urlRoom ? "multi" : null);
  const [players, setPlayers] = useState(null);

  useEffect(() => {
    const id = "kc-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  const handleExit = () => {
    setMode(null);
    setPlayers(null);
    // Remove room param from URL if present
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% -10%,#3a1820 0%,#1b0e10 55%,#120a0a 100%)",
      fontFamily: "'Inter', sans-serif",
      color: "#e8d9c4",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 16px 48px",
    }}>
      {mode === null && <ModeSelect onSelect={setMode} />}
      {mode === "single" && players === null && <SetupScreen onStart={setPlayers} onBack={() => setMode(null)} />}
      {mode === "single" && players !== null && <Game players={players} onExit={handleExit} />}
      {mode === "multi" && <MultiGame onExit={handleExit} initialRoomCode={urlRoom} />}
    </div>
  );
}
