/* ============================================================
   UBER RENTALS — Admin shell + overview (clean light)
   ============================================================ */
const { useState: useStateA } = React;

const NAV = [
  ['#/admin', 'Overview', 'M3 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z'],
  ['#/admin/bookings', 'Bookings', 'M5 3h14v18l-7-4-7 4z'],
  ['#/admin/calendar', 'Fleet Calendar', 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4'],
  ['#/admin/renters', 'Renters', 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5'],
  ['#/admin/insurance', 'Insurance', 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z'],
  ['#/admin/payments', 'Payments', 'M3 6h18v12H3zM3 10h18'],
  ['#/admin/vehicles', 'Vehicles', 'M5 16l1-5h12l1 5M4 16h16v3H4zM7 19v1M17 19v1'],
  ['#/admin/automations', 'Automations', 'M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8'],
  ['#/admin/audit', 'Audit Log', 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5'],
];

function AdminShell({ navigate, route, title, theme = 'theme-light', themeValue = 'light', onToggleTheme, children }) {
  const active = (href) => href === '#/admin' ? route === '#/admin' : route.startsWith(href);
  const [team, setTeam] = useStateA(false);
  const [, force] = useStateA(0);
  const [na, setNa] = useStateA({ name:'', email:'' });
  function addAdmin() {
    if (!na.name || !na.email) return;
    window.DB.admins.push({ id:'ad'+Date.now(), name:na.name, email:na.email, role:'Operations', created_at:'2026-05-31' });
    window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'BOOKING',
      entity_id:na.email, action:'Added admin to team', changes:{}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
    setNa({ name:'', email:'' }); force(n=>n+1);
  }
  return (
    <div className={theme} style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* sidebar */}
      <aside className="admin-sidebar" style={{ width:248, background:'var(--sb-bg)', borderRight:'1px solid var(--sb-border)', display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh', flexShrink:0 }}>
        <div style={{ padding:'24px 22px 20px', borderBottom:'1px solid var(--sb-border)' }}>
          <div onClick={()=>navigate('#/admin')} className="sb-collapse" style={{ cursor:'pointer', color:'var(--sb-text)' }}>
            <Logo size={0.92} tagline />
          </div>
        </div>
        <nav style={{ padding:'16px 12px', flex:1 }}>
          <div className="sb-collapse" style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.18em', color:'var(--sb-dim)', padding:'6px 12px 10px' }}>OPERATIONS</div>
          {NAV.map(([href,label,d])=>{
            const on = active(href);
            return (
              <a key={href} onClick={()=>navigate(href)} className={`sb-nav-item${on?' on':''}`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" style={{ flexShrink:0 }}><path d={d}/></svg>
                <span className="sb-navlabel">{label}</span>
              </a>
            );
          })}
        </nav>
        <div className="sb-collapse" style={{ padding:'16px', borderTop:'1px solid var(--sb-border)' }}>
          <a onClick={()=>navigate('#/')} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--sb-dim)', cursor:'pointer', padding:'4px 8px' }}>
            ↗ View public site
          </a>
          <div onClick={()=>setTeam(true)} title="Manage team" style={{ display:'flex', alignItems:'center', gap:11, marginTop:14, padding:'8px', borderRadius:9, cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--sb-surface)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent)', color:'#15130c', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontFamily:'var(--font-display)', fontSize:15 }}>AB</div>
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:13, color:'var(--sb-text)' }}>A. Bello</div>
              <div style={{ fontSize:11, color:'var(--sb-dim)' }}>Fleet Admin · manage team</div>
            </div>
          </div>
        </div>
      </aside>

      {/* main */}
      <div style={{ flex:1, minWidth:0 }}>
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 36px',
          borderBottom:'1px solid var(--border)', background:'var(--surface)', position:'sticky', top:0, zIndex:50 }}>
          <div>
            <div className="eyebrow" style={{ color:'var(--text-faint)' }}>Uber Rentals · Admin</div>
            <h1 style={{ margin:'4px 0 0', fontFamily:'var(--font-display)', fontWeight:600, fontSize:27, color:'var(--text)' }}>{title}</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="admin-header-search" style={{ position:'relative' }}>
              <input className="input" placeholder="Search reference, plate, name…" style={{ width:280, paddingLeft:36, background:'var(--surface-2)' }} />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            </div>
            <ThemeToggle value={themeValue} onToggle={onToggleTheme} />
          </div>
        </header>
        <div className="admin-main-pad" style={{ padding:'30px 36px 60px', maxWidth:1280 }}>{children}</div>
      </div>

      <Modal open={team} onClose={()=>setTeam(false)} width={560} eyebrow="Access control" title="Team & admins"
        footer={<button className="btn btn-ghost" onClick={()=>setTeam(false)}>Done</button>}>
        <div className="card" style={{ padding:'4px 0', marginBottom:18 }}>
          {window.DB.admins.map(a=>(
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderTop:'1px solid var(--border)' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:600, fontSize:14 }}>
                {a.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14 }}>{a.name}</div>
                <div style={{ fontSize:12, color:'var(--text-dim)' }}>{a.email}</div>
              </div>
              <span style={{ fontSize:11.5, fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>{a.role}</span>
            </div>
          ))}
        </div>
        <div className="field-label">Invite admin</div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          <input className="input" placeholder="Full name" value={na.name} onChange={e=>setNa(s=>({...s,name:e.target.value}))} />
          <input className="input" placeholder="email@uberrentals.co" value={na.email} onChange={e=>setNa(s=>({...s,email:e.target.value}))} />
          <button className="btn btn-gold" disabled={!na.name||!na.email} onClick={addAdmin} style={{ flexShrink:0 }}>Add</button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Overview ---------- */
function Overview({ navigate }) {
  const { bookings, payments } = window.DB;
  const active = bookings.filter(b => b.status === 'ACTIVE');
  const overdue = payments.filter(p => p.status === 'OVERDUE');
  const upcoming = payments.filter(p => p.status === 'DUE' && p.week_start >= window.biz.TODAY);
  const expiring = window.biz.insuranceExpiringSoon();
  const needReview = bookings.filter(b => ['REQUESTED','UNDER_REVIEW'].includes(b.status));
  const overdueTotal = overdue.reduce((s,p)=>s+p.amount,0);
  const upcomingTotal = upcoming.reduce((s,p)=>s+p.amount,0);

  return (
    <div>
      {/* stat row */}
      <div className="r-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18, marginBottom:26 }}>
        <Stat label="Active Rentals" value={active.length} sub={`${active.length} vehicles on the road`} />
        <Stat label="Overdue Payments" value={overdue.length} tone={overdue.length?'red':undefined} sub={window.biz.money(overdueTotal)+' outstanding'} />
        <Stat label="Upcoming Payments" value={upcoming.length} sub={window.biz.money(upcomingTotal)+' due soon'} />
        <Stat label="Insurance Expiring" value={expiring.length} tone={expiring.length?'amber':undefined} sub="within 14 days" />
      </div>

      <div className="r-split" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:22 }}>
        {/* review queue */}
        <div className="card" style={{ padding:'4px 0' }}>
          <SectionHead title="Needs your review" action="All bookings →" onAction={()=>navigate('#/admin/bookings')} count={needReview.length} />
          {needReview.length === 0 && <Empty text="Queue is clear." />}
          {needReview.map(b => {
            const r = window.biz.renter(b.renter_id); const v = window.biz.vehicle(b.vehicle_id);
            return (
              <div key={b.id} onClick={()=>navigate('#/admin/bookings/'+b.id)} className="hover-row" style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 22px', cursor:'pointer', borderTop:'1px solid var(--border)' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="mono" style={{ fontSize:12, color:'var(--accent)' }}>{b.reference_number}</div>
                  <div style={{ fontSize:14, marginTop:3, color:'var(--text)' }}>{r?`${r.first_name} ${r.last_name}`:'—'} · <span style={{color:'var(--text-dim)'}}>{v?`${v.make} ${v.model}`:''}</span></div>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text-dim)', whiteSpace:'nowrap' }}>{window.biz.fmtShort(b.start_date)}–{window.biz.fmtShort(b.end_date)}</div>
                <Badge status={b.status} />
              </div>
            );
          })}
        </div>

        {/* expiring insurance + activity */}
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
          <div className="card" style={{ padding:'4px 0' }}>
            <SectionHead title="Insurance expiring" action="Manage →" onAction={()=>navigate('#/admin/insurance')} count={expiring.length} />
            {expiring.length===0 && <Empty text="Nothing expiring soon." />}
            {expiring.map(i=>{
              const b = window.DB.bookings.find(x=>x.id===i.booking_id);
              const dleft = window.biz.daysBetween(window.biz.TODAY, i.expiry_date);
              return (
                <div key={i.id} className="hover-row" onClick={()=>navigate('#/admin/insurance')} style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:13.5, color:'var(--text)' }}>{i.provider_name}</div>
                    <Badge status={dleft<=3?'OVERDUE':'PENDING'} children={dleft+'d left'} />
                  </div>
                  <div className="mono" style={{ fontSize:11.5, color:'var(--text-dim)', marginTop:4 }}>{b?b.reference_number:''} · {i.type}</div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ padding:'4px 0' }}>
            <SectionHead title="Recent activity" action="Audit log →" onAction={()=>navigate('#/admin/audit')} />
            {window.DB.audit.slice(0,4).map(a=>(
              <div key={a.id} style={{ padding:'11px 22px', borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, color:'var(--text)' }}>{a.action}</div>
                <div className="mono" style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>{a.admin} · {a.created_at}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* shared bits used across admin */
function SectionHead({ title, action, onAction, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <h3 style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:600, fontSize:19, color:'var(--text)' }}>{title}</h3>
        {count!=null && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)', background:'var(--surface-3)', padding:'2px 7px', borderRadius:6 }}>{count}</span>}
      </div>
      {action && <a onClick={onAction} style={{ fontSize:12.5, color:'var(--accent)', cursor:'pointer', fontWeight:500 }}>{action}</a>}
    </div>
  );
}
function Empty({ text }) {
  return <div style={{ padding:'22px', textAlign:'center', color:'var(--text-faint)', fontSize:13.5, borderTop:'1px solid var(--border)' }}>{text}</div>;
}

Object.assign(window, { AdminShell, Overview, SectionHead, Empty });
