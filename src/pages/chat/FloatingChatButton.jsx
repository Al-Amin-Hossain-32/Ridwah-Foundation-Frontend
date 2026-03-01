// components/FloatingChatButton.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useRedux";
import { selectUnreadCount } from "@/app/store/chatSlice";
import { selectAuth } from "@/app/store/authSlice";

const STORAGE_KEY  = "fcb_pos_v2";
const BTN          = 56;
const DISMISS_ZONE = 50; // যেকোনো edge থেকে শেষ 100px
const M            = { t: 64, b: 84, l: 8, r: 8 };

const vw = () => window.visualViewport?.width  ?? window.innerWidth;
const vh = () => window.visualViewport?.height ?? window.innerHeight;

const clamp = (x, y) => ({
  x: Math.min(Math.max(M.l, x), vw() - BTN - M.r),
  y: Math.min(Math.max(M.t,  y), vh() - BTN - M.b),
});

// কোন edge zone এ আছে সেটা বের করো
// returns: 'top' | 'bottom' | 'left' | 'right' | null
const getDismissEdge = (x, y) => {
  const w = vw(), h = vh();
  const cx = x + BTN / 2; // button center
  const cy = y + BTN / 2;

  if (cy <= DISMISS_ZONE)           return "top";
  if (cy >= h - DISMISS_ZONE)       return "bottom";
  if (cx <= DISMISS_ZONE)           return "left";
  if (cx >= w - DISMISS_ZONE)       return "right";
  return null;
};

const loadPos = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return clamp(...Object.values(JSON.parse(s)));
  } catch {}
  return clamp(vw() - BTN - 16, vh() - BTN - 100);
};

// Edge label বাংলায়
const EDGE_LABEL = {
  top:    "↑ ছেড়ে দিলে dismiss হবে",
  bottom: "↓ ছেড়ে দিলে dismiss হবে",
  left:   "← ছেড়ে দিলে dismiss হবে",
  right:  "→ ছেড়ে দিলে dismiss হবে",
};

export default function FloatingChatButton() {
  const navigate       = useNavigate();
  const location       = useLocation();
  const { isLoggedIn } = useAppSelector(selectAuth);
  const unreadCount    = useAppSelector(selectUnreadCount);

  const [pos,         setPos]         = useState(loadPos);
  const [visible,     setVisible]     = useState(false);
  const [pulsing,     setPulsing]     = useState(false);
  const [showTip,     setShowTip]     = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const [dismissed,   setDismissed]   = useState(false);
  const [dismissEdge, setDismissEdge] = useState(null); // 'top'|'bottom'|'left'|'right'|null
  const [showClose,   setShowClose]   = useState(false);

  const rootRef       = useRef(null);
  const hoverTimer    = useRef(null);
  const dismissedAt   = useRef(null);
  const prevCount     = useRef(unreadCount);

  const stateRef = useRef({
    dragging: false, moved: false,
    startX: 0, startY: 0,
    offX: 0, offY: 0,
    posX: pos.x, posY: pos.y,
  });

  const isChatPage = location.pathname.includes("/chat");

  // ── Visibility ──
  useEffect(() => {
    if (!isLoggedIn || isChatPage || unreadCount <= 0) { setVisible(false); return; }
    if (dismissed && unreadCount === dismissedAt.current) { setVisible(false); return; }
    setVisible(true);
  }, [isLoggedIn, isChatPage, unreadCount, dismissed]);

  // ── Pulse + dismiss reset on new message ──
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setDismissed(false);
      dismissedAt.current = null;
      setPulsing(true); setShowTip(true);
      const t1 = setTimeout(() => setPulsing(false), 2200);
      const t2 = setTimeout(() => setShowTip(false),  3200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  // ── Resize / orientation ──
  useEffect(() => {
    const fix = () => setPos(p => {
      const n = clamp(p.x, p.y);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
      return n;
    });
    window.addEventListener("resize", fix);
    window.visualViewport?.addEventListener("resize", fix);
    window.visualViewport?.addEventListener("scroll", fix);
    const onOrient = () => setTimeout(fix, 200);
    window.addEventListener("orientationchange", onOrient);
    return () => {
      window.removeEventListener("resize", fix);
      window.visualViewport?.removeEventListener("resize", fix);
      window.visualViewport?.removeEventListener("scroll", fix);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, []);

  // ════════════════════════════════════════
  // POINTER DRAG
  // ════════════════════════════════════════
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    const el = rootRef.current;
    const rect = el.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    stateRef.current = {
      dragging: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      posX: rect.left, posY: rect.top,
    };
    setDragging(true);
    setDismissEdge(null);
  }, []);

  const onPointerMove = useCallback((e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    e.preventDefault();

    const dx = Math.abs(e.clientX - s.startX);
    const dy = Math.abs(e.clientY - s.startY);
    if (dx > 4 || dy > 4) s.moved = true;

    const ox = window.visualViewport?.offsetLeft ?? 0;
    const oy = window.visualViewport?.offsetTop  ?? 0;

    // Drag চলাকালীন boundary ছাড়িয়ে যেতে দাও (dismiss zone এর জন্য)
    // কিন্তু screen বাইরে না যায়
    const rawX = e.clientX - s.offX + ox;
    const rawY = e.clientY - s.offY + oy;

    const boundX = Math.min(Math.max(0, rawX), vw() - BTN);
    const boundY = Math.min(Math.max(0, rawY), vh() - BTN);

    s.posX = boundX;
    s.posY = boundY;

    // Direct DOM — smooth
    const el = rootRef.current;
    el.style.left = boundX + "px";
    el.style.top  = boundY + "px";

    // ✅ Dismiss zone check
    const edge = getDismissEdge(boundX, boundY);
    setDismissEdge(edge);

    // ✅ Dismiss zone এ থাকলে button opacity কমাও
    if (edge) {
      el.style.opacity = "0.55";
    } else {
      el.style.opacity = "1";
    }
  }, []);

  const onPointerUp = useCallback((e) => {
    const s = stateRef.current;
    if (!s.dragging) return;

    const el = rootRef.current;
    el.releasePointerCapture(e.pointerId);
    el.style.opacity = "1";
    s.dragging = false;
    setDragging(false);

    const edge = getDismissEdge(s.posX, s.posY);

    if (edge && s.moved) {
      // ✅ Dismiss zone এ ছেড়ে দিলে dismiss
      setDismissEdge(null);
      dismissedAt.current = unreadCount;
      setDismissed(true);
      setPulsing(false);
      setShowTip(false);
      // Position reset করো (পরের বার দেখালে default position)
      const defaultPos = clamp(vw() - BTN - 16, vh() - BTN - 100);
      setPos(defaultPos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPos));
    } else {
      // ✅ Normal drop — position save
      setDismissEdge(null);
      const next = clamp(s.posX, s.posY);
      setPos(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      el.style.left = next.x + "px";
      el.style.top  = next.y + "px";

      if (!s.moved) navigate("/app/chat");
    }
  }, [navigate, unreadCount]);

  // ── X button dismiss ──
  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    dismissedAt.current = unreadCount;
    setDismissed(true);
    setShowClose(false);
    setPulsing(false);
    setShowTip(false);
  }, [unreadCount]);

  // ── Hover X show ──
  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setShowClose(true), 300);
  }, []);
  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setShowClose(false);
  }, []);

  if (!visible) return null;

  const tipRight = pos.x < 130;

  return (
    <>
      <style>{`
        @keyframes _fcb_pop {
          0%   { transform:scale(0) rotate(-200deg); opacity:0 }
          65%  { transform:scale(1.16) rotate(5deg); opacity:1 }
          82%  { transform:scale(.93) rotate(-2deg) }
          100% { transform:scale(1) rotate(0); opacity:1 }
        }
        @keyframes _fcb_ring {
          0%   { transform:scale(1);   opacity:.6 }
          100% { transform:scale(2.6); opacity:0  }
        }
        @keyframes _fcb_badge {
          0%,100% { transform:scale(1)    }
          45%     { transform:scale(1.38) }
        }
        @keyframes _fcb_shimmer {
          0%   { background-position:-200% center }
          100% { background-position: 200% center }
        }
        @keyframes _fcb_float {
          0%,100% { transform:translateY(0)   }
          50%     { transform:translateY(-5px)}
        }
        @keyframes _fcb_close_in {
          0%   { transform:scale(0) rotate(-90deg); opacity:0 }
          100% { transform:scale(1) rotate(0);      opacity:1 }
        }
        @keyframes _fcb_warn_pulse {
          0%,100% { opacity:1 }
          50%     { opacity:.6}
        }

        .__fcb {
          position:fixed; z-index:99999;
          user-select:none; -webkit-user-select:none;
          -webkit-tap-highlight-color:transparent;
          touch-action:none;
          will-change:left,top;
          animation:_fcb_pop .5s cubic-bezier(.34,1.56,.64,1) both;
          cursor:grab;
          transition: opacity .15s;
        }
        .__fcb._drag { cursor:grabbing; }

        .__fcb_btn {
          width:56px; height:56px;
          border-radius:50%; border:none; outline:none;
          display:flex; align-items:center; justify-content:center;
          position:relative; overflow:visible;
          background:linear-gradient(135deg,#2cb8ad 0%,#06544e 50%,#2cb8ad 100%);
          box-shadow:0 4px 22px rgba(44,184,173,.5),inset 0 1px 0 rgba(255,255,255,.22);
          transition:box-shadow .18s, transform .15s;
          pointer-events:none;
          -webkit-backface-visibility:hidden;
        }
        .__fcb._drag .__fcb_btn {
          transform:scale(1.09);
          box-shadow:0 12px 40px rgba(44,184,173,.7),inset 0 1px 0 rgba(255,255,255,.26);
        }
        /* dismiss zone এ গেলে red tint */
        .__fcb._indismiss .__fcb_btn {
          background:linear-gradient(135deg,#f43f5e 0%,#9f1239 50%,#f43f5e 100%);
          box-shadow:0 4px 22px rgba(244,63,94,.6),inset 0 1px 0 rgba(255,255,255,.2);
          animation:_fcb_warn_pulse .6s ease-in-out infinite;
        }
        .__fcb_btn._float { animation:_fcb_float 3s ease-in-out infinite; }
        .__fcb_btn::before {
          content:''; position:absolute; inset:0; border-radius:50%;
          background:linear-gradient(110deg,transparent 38%,rgba(255,255,255,.22) 50%,transparent 62%);
          background-size:200% auto;
          animation:_fcb_shimmer 3.5s linear infinite;
          pointer-events:none;
        }

        .__fcb_ring {
          position:absolute; inset:-2px; border-radius:50%;
          background:rgba(44,184,173,.35);
          animation:_fcb_ring 1.7s ease-out infinite;
          pointer-events:none;
        }
        .__fcb_ring:nth-of-type(2) { animation-delay:.55s }

        .__fcb_badge {
          position:absolute; top:-5px; right:-5px;
          min-width:20px; height:20px; padding:0 5px; border-radius:10px;
          background:linear-gradient(135deg,#f43f5e,#e11d48);
          color:#fff; font-size:11px; font-weight:700;
          font-family:-apple-system,'Helvetica Neue',sans-serif;
          display:flex; align-items:center; justify-content:center;
          border:2.5px solid #fff;
          box-shadow:0 2px 10px rgba(244,63,94,.55);
          z-index:10; pointer-events:none;
          animation:_fcb_badge .38s cubic-bezier(.34,1.56,.64,1) both;
        }
        .__fcb_badge._pulse {
          animation:_fcb_badge .5s cubic-bezier(.34,1.56,.64,1) infinite alternate;
        }

        /* ✅ Dismiss zone warning label */
        .__fcb_warn {
          position:absolute;
          white-space:nowrap;
          background:rgba(244,63,94,.92);
          backdrop-filter:blur(8px);
          color:#fff; font-size:11px; font-weight:600;
          font-family:-apple-system,'Helvetica Neue',sans-serif;
          padding:5px 10px; border-radius:20px;
          pointer-events:none; z-index:30;
          box-shadow:0 4px 14px rgba(244,63,94,.45);
          animation:_fcb_close_in .2s cubic-bezier(.34,1.56,.64,1) both;
        }
        /* edge অনুযায়ী position */
        .__fcb_warn._top    { bottom:calc(100% + 8px); left:50%; transform:translateX(-50%); }
        .__fcb_warn._bottom { top:calc(100% + 8px);    left:50%; transform:translateX(-50%); }
        .__fcb_warn._left   { right:calc(100% + 8px);  top:50%;  transform:translateY(-50%); }
        .__fcb_warn._right  { left:calc(100% + 8px);   top:50%;  transform:translateY(-50%); }

        .__fcb_close {
          position:absolute; top:-8px; left:-8px;
          width:20px; height:20px; border-radius:50%;
          background:rgba(20,20,28,.88);
          backdrop-filter:blur(6px);
          border:1.5px solid rgba(255,255,255,.18);
          color:#fff; display:flex; align-items:center; justify-content:center;
          cursor:pointer; pointer-events:all; z-index:20;
          box-shadow:0 2px 8px rgba(0,0,0,.4);
          transition:background .15s, transform .15s;
          animation:_fcb_close_in .25s cubic-bezier(.34,1.56,.64,1) both;
        }
        .__fcb_close:hover { background:rgba(244,63,94,.9); transform:scale(1.15); }
        .__fcb_close svg { pointer-events:none; }

        .__fcb_tip {
          position:absolute; top:50%; transform:translateY(-50%);
          background:rgba(10,10,16,.93);
          backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
          color:#fff; font-size:12px; font-weight:500;
          font-family:-apple-system,'Helvetica Neue',sans-serif;
          white-space:nowrap; padding:6px 11px; border-radius:9px;
          border:1px solid rgba(255,255,255,.12);
          box-shadow:0 4px 18px rgba(0,0,0,.35);
          pointer-events:none;
          opacity:0; transition:opacity .22s; z-index:1;
        }
        .__fcb_tip._show { opacity:1 !important }
        @media(hover:hover){ .__fcb:hover .__fcb_tip { opacity:1 } }
        .__fcb_tip._l { right:calc(100% + 11px) }
        .__fcb_tip._l::after {
          content:''; position:absolute; right:-5px; top:50%; transform:translateY(-50%);
          border:5px solid transparent; border-right:none;
          border-left-color:rgba(10,10,16,.93);
        }
        .__fcb_tip._r { left:calc(100% + 11px) }
        .__fcb_tip._r::before {
          content:''; position:absolute; left:-5px; top:50%; transform:translateY(-50%);
          border:5px solid transparent; border-left:none;
          border-right-color:rgba(10,10,16,.93);
        }

        /* ✅ Screen edge dismiss zone highlight — drag করলে দেখায় */
        .__fcb_edge_hint {
          position:fixed; z-index:99990; pointer-events:none;
          background:linear-gradient(to var(--dir), rgba(244,63,94,.18), transparent);
          transition:opacity .2s;
        }
        .__fcb_edge_hint._top    { top:0; left:0; right:0; height:${DISMISS_ZONE}px; --dir:bottom; }
        .__fcb_edge_hint._bottom { bottom:0; left:0; right:0; height:${DISMISS_ZONE}px; --dir:top; }
        .__fcb_edge_hint._left   { left:0; top:0; bottom:0; width:${DISMISS_ZONE}px; --dir:right; }
        .__fcb_edge_hint._right  { right:0; top:0; bottom:0; width:${DISMISS_ZONE}px; --dir:left; }
      `}</style>

      {/* ✅ Drag চলাকালীন সব edge hint দেখাও (active edge highlight) */}
      {dragging && (
        <>
          <div className={`__fcb_edge_hint _top${dismissEdge === "top" ? "" : ""}`}
            style={{ opacity: dismissEdge === "top" ? 1 : 0.4 }} />
          <div className={`__fcb_edge_hint _bottom`}
            style={{ opacity: dismissEdge === "bottom" ? 1 : 0.4 }} />
          <div className={`__fcb_edge_hint _left`}
            style={{ opacity: dismissEdge === "left" ? 1 : 0.4 }} />
          <div className={`__fcb_edge_hint _right`}
            style={{ opacity: dismissEdge === "right" ? 1 : 0.4 }} />
        </>
      )}

      <div
        ref={rootRef}
        className={`__fcb${dragging ? " _drag" : ""}${dismissEdge ? " _indismiss" : ""}`}
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`__fcb_btn${dragging ? "" : " _float"}`}>
          {pulsing && !dismissEdge && (
            <>
              <span className="__fcb_ring" />
              <span className="__fcb_ring" />
            </>
          )}

          {/* Dismiss zone এ গেলে X icon দেখাও */}
          {dismissEdge ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              style={{ position:"relative", zIndex:2, flexShrink:0 }}>
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg style={{ width:25, height:25, position:"relative", zIndex:2, flexShrink:0 }}
              viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white"/>
              <circle cx="8.5"  cy="11" r="1.1" fill="rgba(99,241,153,.75)" />
              <circle cx="12"   cy="11" r="1.1" fill="rgba(99,241,187,.75)" />
              <circle cx="15.5" cy="11" r="1.1" fill="rgba(99,241,175,.75)" />
            </svg>
          )}

          {!dismissEdge && unreadCount > 0 && (
            <span className={`__fcb_badge${pulsing ? " _pulse" : ""}`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* Hover X button */}
          {showClose && !dragging && (
            <button
              className="__fcb_close"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleDismiss}
              aria-label="বন্ধ করুন"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Warning label — dismiss zone এ থাকলে */}
        {dismissEdge && (
          <div className={`__fcb_warn _${dismissEdge}`}>
            {EDGE_LABEL[dismissEdge]}
          </div>
        )}

        {/* Normal tooltip */}
        {!dismissEdge && (
          <div className={`__fcb_tip ${tipRight ? "_r" : "_l"}${showTip ? " _show" : ""}`}>
            💬 {unreadCount}টি নতুন বার্তা
          </div>
        )}
      </div>
    </>
  );
}