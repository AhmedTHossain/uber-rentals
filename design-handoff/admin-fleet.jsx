/* ============================================================
   UBER RENTALS — Admin: renters + fleet calendar
   ============================================================ */
const { useState: useStateF } = React;

/* ===================== RENTERS ===================== */
function RentersList({ navigate }) {
  const [q, setQ] = useStateF('');
  const rows = window.DB.renters.filter(r => {
    const s = `${r.first_name} ${r.last_name} ${r.email} ${r.city}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });
  const bookingsFor = (rid) => window.DB.bookings.filter(b => b.renter_id === rid);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:14, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 260px', maxWidth:340 }}>
          <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search renters…" style={{ paddingLeft:36, background:'var(--surface-2)' }} />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        </div>
        <div style={{ fontSize:12.5, color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{rows.length} RENTERS</div>
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Contact</th><th>Location</th><th>License</th><th>Bookings</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>{
              const bk = bookingsFor(r.id);
              const expSoon = r.license_expiry < window.biz.addDays(window.biz.TODAY, 60);
              return (
                <tr key={r.id} onClick={()=>navigate('#/admin/renters/'+r.id)}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                      <Avatar name={`${r.first_name} ${r.last_name}`} />
                      <span style={{ fontWeight:500 }}>{r.first_name} {r.last_name}</span>
                    </div>
                  </td>
                  <td><span style={{ color:'var(--text-dim)' }}>{r.email}</span></td>
                  <td>{r.city}, {r.state}</td>
                  <td>
                    <span className="mono" style={{ fontSize:12.5, color: expSoon?'var(--st-amber-fg)':'var(--text-dim)' }}>{r.license_state} · exp {window.biz.fmtShort(r.license_expiry)}</span>
                  </td>
                  <td>{bk.length}</td>
                  <td style={{ textAlign:'right' }}><span style={{ color:'var(--accent)', fontSize:12.5 }}>Profile →</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(n=>n[0]).slice(0,2).join('');
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)',
      display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:600, fontSize:size*0.42, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function RenterDetail({ id, navigate }) {
  const r = window.biz.renter(id);
  if (!r) return <div>Renter not found.</div>;
  const bk = window.DB.bookings.filter(b => b.renter_id === id).slice().sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const spend = bk.filter(b=>['ACTIVE','COMPLETED'].includes(b.status)).reduce((s,b)=>{
    const v = window.biz.vehicle(b.vehicle_id); const wk = Math.max(1,Math.ceil(window.biz.daysBetween(b.start_date,b.end_date)/7));
    return s + (v?v.weekly_price*wk:0);
  },0);
  const licExpired = r.license_expiry < window.biz.TODAY;
  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate('#/admin/renters')} style={{ marginBottom:20 }}>← All renters</button>
      <div className="r-split" style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:22, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
          <div className="card" style={{ padding:'26px 24px', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Avatar name={`${r.first_name} ${r.last_name}`} size={68} /></div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600 }}>{r.first_name} {r.last_name}</div>
            <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:4 }}>Member since {window.biz.fmtDate(bk.length?bk[bk.length-1].created_at:window.biz.TODAY)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)', borderRadius:10, overflow:'hidden', marginTop:20 }}>
              <div style={{ background:'var(--surface)', padding:'14px' }}><div className="kpi-num" style={{ fontSize:26 }}>{bk.length}</div><div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>Bookings</div></div>
              <div style={{ background:'var(--surface)', padding:'14px' }}><div className="kpi-num" style={{ fontSize:26, color:'var(--accent)' }}>{window.biz.money(spend)}</div><div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>Lifetime</div></div>
            </div>
          </div>
          <div className="card" style={{ padding:'20px 22px' }}>
            <h3 style={{ margin:'0 0 12px', fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>Contact</h3>
            <InfoRow k="Email" v={r.email} />
            <InfoRow k="Phone" v={r.phone} mono />
            <InfoRow k="DOB" v={window.biz.fmtDate(r.dob)} />
            <InfoRow k="Address" v={`${r.street}`} />
            <InfoRow k="City" v={`${r.city}, ${r.state} ${r.zip}`} />
          </div>
          <div className="card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>Driver license</h3>
              <Badge status={licExpired?'REJECTED':'VERIFIED'} children={licExpired?'Expired':'Valid'} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <DocSlot label="License — front" />
              <DocSlot label="License — back" />
            </div>
            <InfoRow k="Number" v={r.license_number} mono />
            <InfoRow k="State" v={r.license_state} />
            <InfoRow k="Expiry" v={window.biz.fmtDate(r.license_expiry)} />
          </div>
        </div>
        <div className="card" style={{ padding:'4px 0' }}>
          <SectionHead title="Booking history" count={bk.length} />
          {bk.length===0 && <Empty text="No bookings yet." />}
          {bk.map(b=>{
            const v = window.biz.vehicle(b.vehicle_id);
            return (
              <div key={b.id} onClick={()=>navigate('#/admin/bookings/'+b.id)} className="hover-row" style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 22px', borderTop:'1px solid var(--border)', cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="mono" style={{ fontSize:12, color:'var(--accent)' }}>{b.reference_number}</div>
                  <div style={{ fontSize:14, marginTop:3 }}>{v?`${v.year} ${v.make} ${v.model}`:'—'}</div>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text-dim)', whiteSpace:'nowrap' }}>{window.biz.fmtShort(b.start_date)}–{window.biz.fmtShort(b.end_date)}</div>
                <Badge status={b.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================== FLEET CALENDAR ===================== */
function FleetCalendar({ navigate }) {
  const WIN_START = '2026-05-04';
  const WIN_DAYS = 84; // 12 weeks
  const winEnd = window.biz.addDays(WIN_START, WIN_DAYS);
  const totalDays = window.biz.daysBetween(WIN_START, winEnd);
  const pct = (d) => (window.biz.daysBetween(WIN_START, d) / totalDays) * 100;
  const todayLeft = pct(window.biz.TODAY);

  // week ticks
  const weeks = [];
  for (let i=0;i<=WIN_DAYS;i+=7) weeks.push(window.biz.addDays(WIN_START, i));

  const statusColor = {
    ACTIVE:   ['var(--st-blue-bg)','var(--st-blue-fg)'],
    APPROVED: ['var(--st-green-bg)','var(--st-green-fg)'],
    COMPLETED:['var(--st-neutral-bg)','var(--st-neutral-fg)'],
    UNDER_REVIEW:['var(--st-amber-bg)','var(--st-amber-fg)'],
    REQUESTED:['var(--st-amber-bg)','var(--st-amber-fg)'],
  };

  const shown = window.DB.vehicles.filter(v => v.status !== 'ARCHIVED');

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18, flexWrap:'wrap', gap:14 }}>
        <p style={{ margin:0, fontSize:13.5, color:'var(--text-dim)', maxWidth:520, lineHeight:1.5 }}>
          Each bar is a booking. Only <b style={{color:'var(--text)'}}>approved</b> and <b style={{color:'var(--text)'}}>active</b> rentals block availability — requests overlap freely until you approve.
        </p>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {[['Active','var(--st-blue-fg)'],['Approved','var(--st-green-fg)'],['Requested','var(--st-amber-fg)'],['Completed','var(--st-neutral-fg)']].map(([l,c])=>(
            <span key={l} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--text-dim)' }}>
              <span style={{ width:11, height:11, borderRadius:3, background:c }}></span>{l}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {/* header week scale */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:190, flexShrink:0, padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-dim)', borderRight:'1px solid var(--border)' }}>Vehicle</div>
          <div style={{ position:'relative', flex:1, height:40 }}>
            {weeks.map((w,i)=>(
              <div key={i} style={{ position:'absolute', left:pct(w)+'%', top:0, bottom:0, borderLeft: i?'1px solid var(--border)':'0', paddingLeft:6, display:'flex', alignItems:'center' }}>
                <span className="mono" style={{ fontSize:10.5, color:'var(--text-faint)' }}>{window.biz.fmtShort(w)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* rows */}
        <div style={{ position:'relative' }}>
          {/* today line over whole grid */}
          <div style={{ position:'absolute', left:`calc(190px + (100% - 190px) * ${todayLeft/100})`, top:0, bottom:0, width:2, background:'var(--accent)', zIndex:3, pointerEvents:'none' }}>
            <span style={{ position:'absolute', top:-2, left:4, fontSize:9.5, fontFamily:'var(--font-mono)', color:'var(--accent)', background:'var(--surface)', padding:'1px 4px', borderRadius:4 }}>TODAY</span>
          </div>
          {shown.map(v=>{
            const bars = window.DB.bookings.filter(b => b.vehicle_id === v.id && ['ACTIVE','APPROVED','COMPLETED','UNDER_REVIEW','REQUESTED'].includes(b.status));
            return (
              <div key={v.id} style={{ display:'flex', borderTop:'1px solid var(--border)', minHeight:54 }}>
                <div style={{ width:190, flexShrink:0, padding:'10px 16px', borderRight:'1px solid var(--border)' }}>
                  <div style={{ fontSize:13, fontWeight:500, lineHeight:1.2 }}>{v.model}</div>
                  <div className="mono" style={{ fontSize:10.5, color:'var(--text-dim)', marginTop:3 }}>{v.plate}</div>
                </div>
                <div style={{ position:'relative', flex:1 }}>
                  {weeks.map((w,i)=> i? <div key={i} style={{ position:'absolute', left:pct(w)+'%', top:0, bottom:0, borderLeft:'1px solid var(--border)', opacity:0.5 }}/> : null)}
                  {bars.map(b=>{
                    const s = b.start_date < WIN_START ? WIN_START : b.start_date;
                    const e = b.end_date > winEnd ? winEnd : b.end_date;
                    if (e < WIN_START || s > winEnd) return null;
                    const [bg,fg] = statusColor[b.status];
                    const r = window.biz.renter(b.renter_id);
                    const dashed = ['REQUESTED','UNDER_REVIEW'].includes(b.status);
                    return (
                      <div key={b.id} onClick={()=>navigate('#/admin/bookings/'+b.id)} title={`${b.reference_number} · ${r?r.last_name:''}`}
                        style={{ position:'absolute', left:pct(s)+'%', width:Math.max(2,pct(e)-pct(s))+'%', top:11, height:32, background:bg, color:fg,
                          border: dashed?`1.5px dashed ${fg}`:`1px solid ${fg}33`, borderRadius:7, display:'flex', alignItems:'center', padding:'0 9px',
                          fontSize:11.5, fontWeight:500, overflow:'hidden', whiteSpace:'nowrap', cursor:'pointer', zIndex:2 }}>
                        {r?r.last_name:b.reference_number}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RentersList, RenterDetail, FleetCalendar, Avatar });
