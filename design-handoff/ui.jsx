/* ============================================================
   UBER RENTALS — Shared UI primitives → window
   ============================================================ */
const { useEffect: useEffectUI } = React;

/* ---- Brand wordmark (CSS, theme-aware) ---- */
function Logo({ size = 1, tagline = false, mono = false }) {
  const s = size;
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 11 * s, color:'inherit' }}>
      <div style={{
        width: 38 * s, height: 38 * s, borderRadius: 9 * s,
        border: '1.5px solid var(--accent)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-display)', fontWeight:700, fontSize: 19 * s,
        color:'var(--accent)', letterSpacing:'-0.02em', flexShrink:0,
      }}>UR</div>
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily:'var(--font-display)', fontWeight:600, fontSize: 19 * s,
          letterSpacing:'0.01em', color: mono ? 'var(--accent)' : 'currentColor',
        }}>
          Uber <span style={{ color:'var(--accent)' }}>Rentals</span>
        </div>
        {tagline && (
          <div style={{
            fontFamily:'var(--font-mono)', fontSize: 8.5 * s, letterSpacing:'0.34em',
            textTransform:'uppercase', opacity:0.55, marginTop: 4 * s,
          }}>Exclusive Car Rentals</div>
        )}
      </div>
    </div>
  );
}

/* ---- Status badge ---- */
function Badge({ status, children }) {
  const meta = window.biz.statusMeta(status);
  return (
    <span className={`badge ${meta.cls}`}>
      <span className="dot" />{children || meta.label}
    </span>
  );
}

/* ---- Car image placeholder (striped, labeled) — used where persistence isn't needed ---- */
function CarImage({ vehicle, view = '3/4 FRONT', ratio = '16 / 10', style }) {
  const label = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle';
  return (
    <div className="car-ph" style={{ aspectRatio: ratio, borderRadius: 12, ...style }}>
      <svg viewBox="0 0 120 60" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.5 }} preserveAspectRatio="xMidYMid meet">
        <path d="M18 40 q4 -13 14 -15 q10 -7 26 -7 q18 0 27 9 q9 1 16 6 q4 3 4 7 l-1 3 l-86 0 q-2 -5 0 -8 z"
          fill="none" stroke="var(--text-faint)" strokeWidth="1.1" opacity="0.7"/>
        <circle cx="40" cy="44" r="6" fill="none" stroke="var(--text-faint)" strokeWidth="1.1" opacity="0.7"/>
        <circle cx="88" cy="44" r="6" fill="none" stroke="var(--text-faint)" strokeWidth="1.1" opacity="0.7"/>
      </svg>
      <div className="car-ph-label" style={{ position:'relative', zIndex:1, width:'100%' }}>
        {label} · {view}
      </div>
    </div>
  );
}

/* ---- Fillable car photo (drag-and-drop, persists by id) ---- */
/* readOnly: display admin-uploaded photo but block renter upload/update */
function CarSlot({ vehicle, view = 'cover', ratio = '16 / 10', radius = 12, readOnly = false, style }) {
  const id = `car-${vehicle.id}-${view}`;
  const label = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle';
  return (
    <div className="car-ph" style={{ aspectRatio: ratio, borderRadius: radius, position:'relative', display:'block',
      overflow: readOnly ? 'hidden' : 'visible', ...style }}>
      {React.createElement('image-slot', {
        id, shape: 'rounded', radius,
        placeholder: readOnly ? `${label} · ${view}` : `${label} — drop ${view} photo`,
        style: {
          position:'absolute', inset:0, width:'100%', height:'100%', color:'var(--text-dim)',
          ...(readOnly ? { pointerEvents:'none', cursor:'default' } : {}),
        },
      })}
    </div>
  );
}

/* ---- Modal ---- */
function Modal({ open, onClose, title, eyebrow, children, footer, width = 540 }) {
  useEffectUI(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:200, background:'rgba(14,12,8,0.55)',
      backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} className="anim-fade">
      <div onClick={(e)=>e.stopPropagation()} className="card anim-pop" style={{
        width, maxWidth:'100%', maxHeight:'90vh', overflow:'auto', boxShadow:'var(--shadow)',
        background:'var(--surface)',
      }}>
        <div style={{ padding:'22px 24px 0' }}>
          {eyebrow && <div className="eyebrow" style={{ marginBottom:8 }}>{eyebrow}</div>}
          {title && <h3 style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:600, fontSize:24, color:'var(--text)' }}>{title}</h3>}
        </div>
        <div style={{ padding:'18px 24px' }}>{children}</div>
        {footer && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Form field wrapper ---- */
function Field({ label, children, hint, span }) {
  return (
    <label style={{ display:'block', gridColumn: span ? `span ${span}` : undefined }}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span style={{ display:'block', marginTop:6, fontSize:12, color:'var(--text-faint)' }}>{hint}</span>}
    </label>
  );
}

/* ---- Tiny KPI / stat ---- */
function Stat({ label, value, sub, tone }) {
  const toneColor = { red:'var(--st-red-fg)', amber:'var(--st-amber-fg)', green:'var(--st-green-fg)' }[tone];
  return (
    <div className="card" style={{ padding:'18px 20px' }}>
      <div className="eyebrow" style={{ color:'var(--text-dim)' }}>{label}</div>
      <div className="kpi-num" style={{ fontSize:40, marginTop:10, color: toneColor || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:12.5, color:'var(--text-dim)', marginTop:6 }}>{sub}</div>}
    </div>
  );
}

/* ---- Empty / info row ---- */
function InfoRow({ k, v, mono }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:13, color:'var(--text-dim)' }}>{k}</span>
      <span style={{ fontSize:13.5, color:'var(--text)', textAlign:'right', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
    </div>
  );
}

/* ---- Theme toggle (sun/moon) ---- */
function ThemeToggle({ value, onToggle }) {
  const isDark = value === 'dark';
  return (
    <button className="btn btn-ghost btn-sm" onClick={onToggle} title={isDark ? 'Switch to light' : 'Switch to dark'}
      aria-label="Toggle theme" style={{ gap:7, padding:'7px 12px' }}>
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      )}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

Object.assign(window, { Logo, Badge, CarImage, CarSlot, Modal, Field, Stat, InfoRow, ThemeToggle });
