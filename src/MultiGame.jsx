import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "peerjs";
import { makeInitialState, processAction, serializeState, generateRoomCode, roomCodeToPeerId, RULES } from "./data.js";
import { inputStyle, primaryBtnStyle, ghostBtnStyle, iconBtnStyle } from "./styles.js";
import { PlayingCard, CupVisual, SectionHeader, GameHeader, RuleText, StatusBar, ActiveRules, CardLog } from "./KingsCup.jsx";

// ─── Utilities ────────────────────────────────────────────────────────────────

function ShareBox({ url, roomCode }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 14, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.3)" }}>
      <div style={{ fontSize: 12, color: "#7a6655", marginBottom: 6 }}>Teile diesen Link:</div>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#f3e6cf", wordBreak: "break-all", marginBottom: 10 }}>{url}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={copy} style={{ ...primaryBtnStyle, padding: "8px 18px", fontSize: 13 }}>
          {copied ? "✓ Kopiert!" : "Link kopieren"}
        </button>
        <div style={{ fontSize: 13, color: "#7a6655" }}>oder Code: <strong style={{ color: "#c9a227", letterSpacing: "0.12em" }}>{roomCode}</strong></div>
      </div>
    </div>
  );
}

function PlayerList({ players, myName, hostName }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <SectionHeader>Spieler ({players.length})</SectionHeader>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {players.map(p => (
          <div key={p} style={{
            padding: "5px 12px", borderRadius: 999,
            background: p === myName ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${p === myName ? "rgba(201,162,39,0.5)" : "#2e1a14"}`,
            fontSize: 13, color: p === myName ? "#c9a227" : "#d8c4a8",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {p === hostName && <span style={{ fontSize: 10 }}>👑</span>}
            {p}{p === myName && " (du)"}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Name Entry (for guests joining via link) ────────────────────────────────

function NameEntry({ roomCode, onJoin }) {
  const [name, setName] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <GameHeader />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: "#a8927a" }}>Du wurdest eingeladen</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c9a227", fontWeight: 700, marginTop: 4 }}>
          Raum <span style={{ letterSpacing: "0.12em" }}>{roomCode.toUpperCase()}</span>
        </div>
      </div>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="Dein Name" maxLength={20} style={{ ...inputStyle, marginBottom: 12 }}
        onKeyDown={e => e.key === "Enter" && name.trim() && onJoin(name.trim())}
        autoFocus />
      <button onClick={() => name.trim() && onJoin(name.trim())} style={{ ...primaryBtnStyle, width: "100%" }}>
        Beitreten
      </button>
    </div>
  );
}

// ─── Host Create ──────────────────────────────────────────────────────────────

function HostCreate({ onStart }) {
  const [name, setName] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <GameHeader />
      <div style={{ marginBottom: 20, fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#c9a227", fontWeight: 600 }}>Raum erstellen</div>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="Dein Name" maxLength={20} style={{ ...inputStyle, marginBottom: 12 }}
        onKeyDown={e => e.key === "Enter" && name.trim() && onStart(name.trim())}
        autoFocus />
      <button onClick={() => name.trim() && onStart(name.trim())} style={{ ...primaryBtnStyle, width: "100%" }}>
        Raum erstellen
      </button>
    </div>
  );
}

// ─── Shared GameView (used by host and guest) ────────────────────────────────

function GameView({ syncState, myName, hostName, isHost, onAction, onExit }) {
  const { players, current, kingsDrawn, gameOver, activeRules, kumpel,
    currentPlayerIdx, lastDrawerIdx, drawCount, log, deckLength, deckVersion,
    showRuleForm, showKumpelPicker } = syncState;

  const [flipped, setFlipped] = useState(false);
  const [ruleInput, setRuleInput] = useState("");
  const prevDrawCount = useRef(0);

  const isMyTurn = players[currentPlayerIdx] === myName;
  const iAmDrawer = lastDrawerIdx !== null && players[lastDrawerIdx] === myName;
  const lastDrawerName = lastDrawerIdx !== null ? players[lastDrawerIdx] : null;

  useEffect(() => {
    if (drawCount > prevDrawCount.current) {
      prevDrawCount.current = drawCount;
      setFlipped(false);
      const t = setTimeout(() => setFlipped(true), 80);
      return () => clearTimeout(t);
    }
  }, [drawCount]);

  const addRule = () => {
    if (!ruleInput.trim()) return;
    onAction({ type: "ADD_RULE", text: ruleInput.trim() });
    setRuleInput("");
  };

  const stateForComponents = {
    ...syncState,
    deck: { length: deckLength }, // duck-type for StatusBar
  };

  return (
    <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <GameHeader />
        <button onClick={onExit} style={{ ...iconBtnStyle, padding: "6px 10px", marginTop: -8 }} title="Spiel verlassen">✕</button>
      </div>

      <StatusBar state={syncState} deckLength={deckLength} />

      {/* "Am Zug" indicator for spectators */}
      {!isMyTurn && !gameOver && (
        <div style={{ textAlign: "center", marginBottom: 10, padding: "6px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid #2e1a14" }}>
          <span style={{ fontSize: 13, color: "#7a6655" }}>
            ⏳ Warte auf <strong style={{ color: "#f3e6cf" }}>{players[currentPlayerIdx]}</strong>…
          </span>
        </div>
      )}

      {kumpel && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "7px 14px", borderRadius: 10, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)" }}>
          <span style={{ fontSize: 13, color: "#c9a227" }}>🤝 Trink-Kumpel: <strong>{kumpel}</strong></span>
          {(iAmDrawer || isHost) && (
            <button onClick={() => onAction({ type: "CLEAR_KUMPEL" })} style={{ background: "none", border: "none", color: "#7a6655", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
          )}
        </div>
      )}

      {/* Card — clickable only on your turn */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <PlayingCard
          card={current}
          flipped={flipped}
          onClick={isMyTurn && !gameOver ? () => onAction({ type: "DRAW" }) : undefined}
          disabled={!isMyTurn || gameOver}
        />
      </div>

      <RuleText state={syncState} gameOver={gameOver} lastDrawerName={lastDrawerName} />

      {/* Kumpel picker — only for drawer */}
      {showKumpelPicker && iAmDrawer && players.length > 1 && (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.25)" }}>
          <div style={{ fontSize: 13, color: "#c9a227", marginBottom: 8, fontWeight: 600 }}>Wähle deinen Trink-Kumpel:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {players.filter((_, i) => i !== lastDrawerIdx).map(p => (
              <button key={p} onClick={() => onAction({ type: "SET_KUMPEL", player: p })}
                style={{ ...ghostBtnStyle, padding: "5px 14px", fontSize: 13 }}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Rule form — only for drawer */}
      {showRuleForm && iAmDrawer && (
        <div style={{ marginBottom: 14 }}>
          <input value={ruleInput} onChange={e => setRuleInput(e.target.value)}
            placeholder="Neue Regel eintippen…"
            onKeyDown={e => e.key === "Enter" && addRule()}
            style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addRule} style={{ ...primaryBtnStyle, flex: 1 }}>Festlegen</button>
            <button onClick={() => onAction({ type: "DISMISS_RULE_FORM" })} style={{ ...ghostBtnStyle, flex: 0.4 }}>Überspringen</button>
          </div>
        </div>
      )}

      {/* Draw button — only on your turn */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        {!gameOver && isMyTurn && (
          <button onClick={() => onAction({ type: "DRAW" })} style={{ ...primaryBtnStyle, flex: 1 }}>
            Karte ziehen
          </button>
        )}
        {gameOver && isHost && (
          <button onClick={() => onAction({ type: "NEW_GAME" })} style={{ ...primaryBtnStyle, flex: 1 }}>
            Neues Spiel
          </button>
        )}
        {gameOver && !isHost && (
          <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#7a6655", paddingTop: 8 }}>
            Warte auf Host für neues Spiel…
          </div>
        )}
      </div>

      <ActiveRules rules={activeRules} onRemove={iAmDrawer || isHost ? id => onAction({ type: "REMOVE_RULE", id }) : null} />
      <CardLog log={log} />
      <div style={{ fontSize: 11, color: "#5c4a3c", textAlign: "center", paddingBottom: 16 }}>Bitte verantwortungsbewusst feiern. 🍻</div>
    </div>
  );
}

// ─── Main MultiGame Component ─────────────────────────────────────────────────

export default function MultiGame({ onExit, initialRoomCode }) {
  const isGuest = !!initialRoomCode;

  // Phase: 'name-entry' | 'host-create' | 'lobby' | 'game' | 'error'
  const [phase, setPhase] = useState(isGuest ? "name-entry" : "host-create");
  const [myName, setMyName] = useState("");
  const [roomCode, setRoomCode] = useState(initialRoomCode || "");
  const [players, setPlayers] = useState([]);
  const [hostName, setHostName] = useState("");
  const [syncState, setSyncState] = useState(null);
  const [error, setError] = useState("");
  const [peerReady, setPeerReady] = useState(false);

  const peerRef = useRef(null);
  const connectionsRef = useRef(new Map()); // name -> DataConnection (host only)
  const hostConnRef = useRef(null);          // guest -> host connection
  const gameStateRef = useRef(null);          // host keeps live state here

  // ── Broadcast (host only) ──
  const broadcast = useCallback((msg) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  }, []);

  // ── Host dispatch: process action + sync to all guests ──
  const hostDispatch = useCallback((action) => {
    if (!gameStateRef.current) return;
    const next = processAction(gameStateRef.current, action);
    gameStateRef.current = next;
    const serialized = serializeState(next);
    setSyncState(serialized);
    broadcast({ type: "SYNC", state: serialized });
  }, [broadcast]);

  // ── Guest action: forward to host ──
  const guestAction = useCallback((action) => {
    if (hostConnRef.current?.open) {
      hostConnRef.current.send({ type: "ACTION", action });
    }
  }, []);

  // ── Handle action (routes to host or guest) ──
  const onAction = isGuest ? guestAction : hostDispatch;

  // ── HOST SETUP ──
  const startHost = useCallback((name) => {
    const code = generateRoomCode();
    setMyName(name);
    setRoomCode(code);
    setHostName(name);
    setPlayers([name]);

    const peerId = roomCodeToPeerId(code);
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on("open", () => setPeerReady(true));
    peer.on("error", e => {
      setError(`Verbindungsfehler: ${e.message}`);
      setPhase("error");
    });

    peer.on("connection", (conn) => {
      conn.on("open", () => {
        // Send current state or lobby info
        if (gameStateRef.current) {
          conn.send({ type: "SYNC", state: serializeState(gameStateRef.current) });
          conn.send({ type: "PHASE", phase: "game" });
        } else {
          // Still in lobby — send current player list
          setPlayers(prev => {
            conn.send({ type: "LOBBY", players: prev, host: name });
            return prev;
          });
        }
      });

      conn.on("data", (data) => {
        if (data.type === "JOIN") {
          const guestName = data.name;
          connectionsRef.current.set(guestName, conn);
          setPlayers(prev => {
            const next = prev.includes(guestName) ? prev : [...prev, guestName];
            connectionsRef.current.forEach(c => c.open && c.send({ type: "LOBBY", players: next, host: name }));
            return next;
          });
        }
        if (data.type === "ACTION" && gameStateRef.current) {
          hostDispatch(data.action);
        }
      });

      conn.on("close", () => {
        // Remove disconnected player
        connectionsRef.current.forEach((c, n) => { if (c === conn) connectionsRef.current.delete(n); });
      });
    });

    setPhase("lobby");
  }, [hostDispatch]);

  // ── HOST START GAME ──
  const startGame = useCallback(() => {
    const initialState = makeInitialState(players);
    gameStateRef.current = initialState;
    const serialized = serializeState(initialState);
    setSyncState(serialized);
    broadcast({ type: "SYNC", state: serialized });
    broadcast({ type: "PHASE", phase: "game" });
    setPhase("game");
  }, [players, broadcast]);

  // ── GUEST SETUP ──
  const joinRoom = useCallback((name) => {
    setMyName(name);
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(roomCodeToPeerId(initialRoomCode));
      hostConnRef.current = conn;

      conn.on("open", () => {
        conn.send({ type: "JOIN", name });
        setPeerReady(true);
        setPhase("lobby");
      });

      conn.on("data", (data) => {
        if (data.type === "LOBBY") {
          setPlayers(data.players);
          setHostName(data.host);
        }
        if (data.type === "SYNC") {
          setSyncState(data.state);
        }
        if (data.type === "PHASE" && data.phase === "game") {
          setPhase("game");
        }
      });

      conn.on("close", () => {
        setError("Host hat die Verbindung getrennt.");
        setPhase("error");
      });

      conn.on("error", () => {
        setError("Verbindung zum Host verloren.");
        setPhase("error");
      });
    });

    peer.on("error", e => {
      if (e.type === "peer-unavailable") {
        setError(`Raum „${initialRoomCode?.toUpperCase()}" nicht gefunden. Ist der Link noch gültig?`);
      } else {
        setError(`Verbindungsfehler: ${e.message}`);
      }
      setPhase("error");
    });
  }, [initialRoomCode]);

  // ── CLEANUP ──
  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  // ── RENDER ──

  if (phase === "name-entry") {
    return <NameEntry roomCode={initialRoomCode} onJoin={joinRoom} />;
  }

  if (phase === "host-create") {
    return (
      <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
        <HostCreate onStart={startHost} />
        <button onClick={onExit} style={{ ...ghostBtnStyle, marginTop: 16, width: "100%" }}>← Zurück</button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", textAlign: "center" }}>
        <GameHeader />
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, color: "#cdb89e", marginBottom: 24, lineHeight: 1.6 }}>{error}</div>
        <button onClick={onExit} style={{ ...primaryBtnStyle, width: "100%" }}>Zurück zum Menü</button>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <GameHeader />
          <button onClick={onExit} style={{ ...iconBtnStyle, padding: "6px 10px", marginTop: -8 }}>✕</button>
        </div>

        {!isGuest && peerReady && <ShareBox url={shareUrl} roomCode={roomCode} />}

        <PlayerList players={players} myName={myName} hostName={hostName} />

        {!isGuest ? (
          <>
            {players.length < 2 && (
              <div style={{ fontSize: 13, color: "#7a6655", marginBottom: 16, textAlign: "center" }}>
                Warte auf weitere Spieler…
              </div>
            )}
            <button
              onClick={startGame}
              disabled={players.length < 2}
              style={{ ...primaryBtnStyle, width: "100%", opacity: players.length < 2 ? 0.4 : 1 }}
            >
              Spiel starten ({players.length} Spieler)
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 14, color: "#7a6655" }}>
              {peerReady ? "✓ Verbunden · Warte auf Host…" : "Verbinde…"}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "game" && syncState) {
    return (
      <GameView
        syncState={syncState}
        myName={myName}
        hostName={hostName}
        isHost={!isGuest}
        onAction={onAction}
        onExit={onExit}
      />
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 14, color: "#7a6655" }}>Verbinde…</div>
    </div>
  );
}
