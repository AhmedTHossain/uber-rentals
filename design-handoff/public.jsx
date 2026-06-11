/* ============================================================
   UBER RENTALS — Public site (luxury dark)
   ============================================================ */
const { useState: useStateP, useMemo: useMemoP } = React;

/* ---------- Public shell ---------- */
function PublicShell({ navigate, route, theme = 'theme-dark', themeValue = 'dark', onToggleTheme, children }) {
  return (
    <div className={theme} style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
      {/* ambient glow */}
      <div style={{ position:'fixed', top:-220, left:'50%', transform:'translateX(-50%)', width:900, height:520,
        background:'radial-gradient(ellipse at center, rgba(198,160,82,0.10), transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <header className="public-header" style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'22px 42px', borderBottom:'1px solid var(--border)', maxWidth:1280, margin:'0 auto' }}>
        <div onClick={()=>navigate('#/')} style={{ cursor:'pointer' }}><Logo tagline /></div>
        <nav style={{ display:'flex', alignItems:'center', gap:32, fontSize:13.5 }}>
          <a onClick={()=>navigate('#/')} className="nav-link" style={{ cursor:'pointer', color:'var(--text-dim)' }}>Fleet</a>
          <a className="nav-link" style={{ cursor:'pointer', color:'var(--text-dim)' }}>How it works</a>
          <a className="nav-link" style={{ cursor:'pointer', color:'var(--text-dim)' }}>Contact</a>
          <ThemeToggle value={themeValue} onToggle={onToggleTheme} />
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('#/admin')}>Admin Portal</button>
        </nav>
      </header>
      <main className="public-main" style={{ position:'relative', zIndex:1, maxWidth:1280, margin:'0 auto', padding:'0 42px 90px' }}>
        {children}
      </main>
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid var(--border)', padding:'34px 42px',
        maxWidth:1280, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <Logo size={0.8} />
        <div style={{ fontSize:12, color:'var(--text-faint)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>
          © 2026 UBER RENTALS · BY REQUEST ONLY · NOT INSTANT BOOKING
        </div>
      </footer>
    </div>
  );
}

/* ---------- Listing ---------- */
function Listing({ navigate }) {
  const [maxPrice, setMaxPrice] = useStateP(5000);
  const [seats, setSeats] = useStateP('any');
  const [trans, setTrans] = useStateP('any');
  const [sort, setSort] = useStateP('featured');

  const list = useMemoP(() => {
    let v = window.DB.vehicles.filter(x => x.status !== 'ARCHIVED');
    v = v.filter(x => x.weekly_price <= maxPrice);
    if (seats !== 'any') v = v.filter(x => seats === '2' ? x.seats <= 2 : x.seats >= 4);
    if (trans !== 'any') v = v.filter(x => x.transmission === trans);
    if (sort === 'price-lo') v = [...v].sort((a,b)=>a.weekly_price-b.weekly_price);
    if (sort === 'price-hi') v = [...v].sort((a,b)=>b.weekly_price-a.weekly_price);
    return v;
  }, [maxPrice, seats, trans, sort]);

  return (
    <div>
      {/* hero */}
      <section style={{ padding:'66px 0 48px', textAlign:'center' }}>
        <div className="eyebrow" style={{ marginBottom:18 }}>Chicago · Miami · New York · Las Vegas</div>
        <h1 className="hero-h1" style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:60, lineHeight:1.08, margin:0, letterSpacing:'-0.01em', maxWidth:840, marginInline:'auto' }}>
          The keys to something <span style={{ fontStyle:'italic', color:'var(--accent)' }}>exceptional</span>, by the week.
        </h1>
        <p style={{ color:'var(--text-dim)', fontSize:16.5, maxWidth:540, margin:'22px auto 0', lineHeight:1.6 }}>
          Browse the fleet and submit a request. Every reservation is personally reviewed and approved by our team — no instant checkout, no surprises.
        </p>
      </section>

      {/* filter bar */}
      <div className="card" style={{ padding:'18px 22px', display:'flex', gap:28, alignItems:'flex-end', flexWrap:'wrap', marginBottom:30 }}>
        <div style={{ flex:'1 1 260px', minWidth:220 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span className="field-label" style={{ margin:0 }}>Max weekly price</span>
            <span className="mono" style={{ fontSize:12.5, color:'var(--accent)' }}>{window.biz.money(maxPrice)}/wk</span>
          </div>
          <input type="range" min="1500" max="5000" step="50" value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)}
            style={{ width:'100%', accentColor:'var(--accent)' }} />
        </div>
        <FilterSelect label="Seats" value={seats} onChange={setSeats} options={[['any','Any'],['2','2 seats'],['4','4+ seats']]} />
        <FilterSelect label="Transmission" value={trans} onChange={setTrans} options={[['any','Any'],['Automatic','Automatic'],['Manual','Manual']]} />
        <FilterSelect label="Sort" value={sort} onChange={setSort} options={[['featured','Featured'],['price-lo','Price ↑'],['price-hi','Price ↓']]} />
        <div style={{ marginLeft:'auto', fontSize:12.5, color:'var(--text-dim)', fontFamily:'var(--font-mono)', paddingBottom:10 }}>
          {list.length} VEHICLES
        </div>
      </div>

      {/* grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:24 }}>
        {list.map(v => <VehicleCard key={v.id} v={v} navigate={navigate} />)}
      </div>

      {/* how it works */}
      <section style={{ marginTop:90 }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div className="eyebrow" style={{ marginBottom:14 }}>How it works</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:42, margin:0, lineHeight:1.05 }}>
            Considered, not automated.
          </h2>
          <p style={{ color:'var(--text-dim)', fontSize:15.5, maxWidth:520, margin:'16px auto 0', lineHeight:1.6 }}>
            Every reservation passes through a person. It is what keeps the fleet immaculate and the experience uncompromising.
          </p>
        </div>
        <div className="r-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {[
            ['01','Request','Choose your vehicle and dates, share your details and insurance preference. Nothing is charged.'],
            ['02','Review','Our team verifies your license and insurance, confirms availability, and approves — usually within 24 hours.'],
            ['03','Collect','On approval we arrange handover. Company coverage is finalized; customer policies are confirmed valid.'],
            ['04','Drive','Billing runs in clean weekly installments for the length of your rental. No deposits held hostage.'],
          ].map(([n,t,d])=>(
            <div key={n} className="card" style={{ padding:'24px 22px' }}>
              <div className="kpi-num" style={{ fontSize:34, color:'var(--accent)' }}>{n}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:21, fontWeight:600, marginTop:10 }}>{t}</div>
              <p style={{ fontSize:13.5, color:'var(--text-dim)', lineHeight:1.6, marginTop:8, marginBottom:0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ minWidth:130 }}>
      <span className="field-label">{label}</span>
      <select className="select" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function VehicleCard({ v, navigate }) {
  const avail = window.biz.isAvailable(v.id, window.biz.TODAY, window.biz.addDays(window.biz.TODAY, 7));
  return (
    <div className="card" onClick={()=>navigate('#/vehicle/'+v.id)} style={{ overflow:'hidden', cursor:'pointer', transition:'transform 0.18s ease, border-color 0.18s ease' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='var(--border-strong)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='var(--border)';}}>
      <CarSlot vehicle={v} view="cover" ratio="16 / 10" radius={0} readOnly />
      <div style={{ padding:'18px 20px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{v.year} · {v.make}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:23, fontWeight:600, marginTop:4 }}>{v.model}</div>
          </div>
          <Badge status={avail ? 'AVAILABLE' : 'RENTED'} children={avail ? 'Available' : 'Booked'} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:18 }}>
          <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-dim)' }}>
            <span>{v.seats} seats</span><span>·</span><span>{v.transmission}</span>
          </div>
          <div style={{ textAlign:'right' }}>
            <span className="kpi-num" style={{ fontSize:26, color:'var(--accent)' }}>{window.biz.money(v.weekly_price)}</span>
            <span style={{ fontSize:12, color:'var(--text-dim)' }}> /wk</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Vehicle detail ---------- */
function VehicleDetail({ id, navigate }) {
  const v = window.biz.vehicle(id);
  const [active, setActive] = useStateP(0);
  if (!v) return <div style={{ padding:60 }}>Vehicle not found.</div>;
  const views = window.biz.vehicleViews(v); // [[key,label], ...]
  const avail = window.biz.isAvailable(v.id, window.biz.TODAY, window.biz.addDays(window.biz.TODAY, 28));

  return (
    <div style={{ paddingTop:30 }}>
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate('#/')} style={{ marginBottom:24 }}>← Back to fleet</button>
      <div className="r-split" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:44, alignItems:'start' }}>
        <div>
          <CarSlot vehicle={v} view={views[active][0]} ratio="16 / 10" radius={14} readOnly />
          <div className="detail-thumbs" style={{ display:'grid', gridTemplateColumns:`repeat(${views.length}, 1fr)`, gap:12, marginTop:14 }}>
            {views.map(([key,label],i)=>(
              <div key={key} onClick={()=>setActive(i)} style={{ cursor:'pointer', borderRadius:9, overflow:'hidden',
                outline: i===active ? '2px solid var(--accent)' : '1px solid var(--border)', outlineOffset:i===active?'0':'-1px' }}>
                <CarSlot vehicle={v} view={key} ratio="16 / 11" radius={0} readOnly />
              </div>
            ))}
          </div>
          <p style={{ fontSize:11.5, color:'var(--text-faint)', marginTop:10, fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>
            SELECT A VIEW TO ENLARGE
          </p>
        </div>
        <div>
          <div className="eyebrow">{v.year} · {v.make}</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:46, fontWeight:600, margin:'8px 0 0', lineHeight:1.02 }}>{v.model}</h1>
          <p style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:19, color:'var(--text-dim)', margin:'10px 0 0', lineHeight:1.4 }}>{v.tagline}</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, margin:'18px 0' }}>
            <span className="kpi-num" style={{ fontSize:38, color:'var(--accent)' }}>{window.biz.money(v.weekly_price)}</span>
            <span style={{ color:'var(--text-dim)' }}>per week</span>
            <span style={{ marginLeft:'auto' }}><Badge status={avail ? 'AVAILABLE':'RENTED'} children={avail?'Available now':'Currently booked'} /></span>
          </div>

          {/* spec grid */}
          <div className="r-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            {[['Power',v.hp+' hp'],['Drivetrain',v.drivetrain],['Top speed',v.topspeed],['Body',v.body],['Seats',v.seats+' seats'],['Energy',v.fuel]].map(([k,val])=>(
              <div key={k} style={{ background:'var(--surface)', padding:'14px 16px' }}>
                <div style={{ fontSize:10.5, fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)' }}>{k}</div>
                <div style={{ fontSize:15, marginTop:5, color:'var(--text)' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* features */}
          <div style={{ marginBottom:22 }}>
            <div className="eyebrow" style={{ color:'var(--text-dim)', marginBottom:12 }}>Appointments</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px 18px' }}>
              {v.features.map(ft=>(
                <div key={ft} style={{ display:'flex', gap:9, alignItems:'baseline', fontSize:13.5, color:'var(--text)' }}>
                  <span style={{ color:'var(--accent)', flexShrink:0 }}>—</span>{ft}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding:'4px 20px', marginBottom:24 }}>
            <InfoRow k="Color" v={v.color} />
            <InfoRow k="Plate" v={v.plate} mono />
            <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'9px 0' }}>
              <span style={{ fontSize:13, color:'var(--text-dim)' }}>VIN</span>
              <span className="mono" style={{ fontSize:12.5 }}>{v.vin}</span>
            </div>
          </div>
          <button className="btn btn-gold" style={{ width:'100%', padding:'15px' }} disabled={!avail}
            onClick={()=>navigate('#/book/'+v.id)}>
            {avail ? 'Request this vehicle' : 'Unavailable for selected dates'}
          </button>
          <p style={{ fontSize:12.5, color:'var(--text-faint)', textAlign:'center', marginTop:14, lineHeight:1.6 }}>
            Submitting a request does not confirm a booking. Our team reviews every request and verifies insurance before approval.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublicShell, Listing, VehicleDetail });
