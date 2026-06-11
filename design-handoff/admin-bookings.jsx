/* ============================================================
   UBER RENTALS — Admin: bookings list + detail + timeline
   ============================================================ */
const { useState: useStateBk } = React;

const BK_FILTERS = ['ALL','REQUESTED','UNDER_REVIEW','APPROVED','ACTIVE','COMPLETED','REJECTED'];

function BookingsList({ navigate, refresh }) {
  const [filter, setFilter] = useStateBk('ALL');
  const [sel, setSel] = useStateBk({});
  const rows = window.DB.bookings.filter(b => filter==='ALL' || b.status===filter)
    .slice().sort((a,b)=> b.created_at.localeCompare(a.created_at));

  const selIds = Object.keys(sel).filter(k=>sel[k]);
  const selPending = selIds.filter(id => { const b=window.DB.bookings.find(x=>x.id===id); return b && ['REQUESTED','UNDER_REVIEW'].includes(b.status); });
  const toggle = (id) => setSel(s => ({ ...s, [id]: !s[id] }));
  const allOn = rows.length>0 && rows.every(b=>sel[b.id]);
  const toggleAll = () => { const ns={}; if(!allOn) rows.forEach(b=>ns[b.id]=true); setSel(ns); };

  function bulk(to) {
    selPending.forEach(id=>{
      const b = window.DB.bookings.find(x=>x.id===id);
      if (to==='APPROVED' && !window.biz.isAvailable(b.vehicle_id, b.start_date, b.end_date, b.id)) return; // skip conflicts
      const from=b.status; b.status=to;
      window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'BOOKING',
        entity_id:b.reference_number, action:`${to==='APPROVED'?'Approved':'Rejected'} booking (bulk)`, changes:{status:[from,to]}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
    });
    setSel({}); refresh && refresh();
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:14 }}>
        <div className="pillbar">
          {BK_FILTERS.map(f=>(
            <button key={f} className={filter===f?'on':''} onClick={()=>setFilter(f)}>
              {f==='ALL'?'All':window.biz.statusMeta(f).label}
            </button>
          ))}
        </div>
        <div style={{ fontSize:12.5, color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{rows.length} BOOKINGS</div>
      </div>

      {/* bulk action bar */}
      {selIds.length>0 && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 18px', marginBottom:14, background:'var(--surface-2)', borderColor:'var(--border-strong)' }}>
          <span style={{ fontSize:13.5, fontWeight:500 }}>{selIds.length} selected</span>
          <span style={{ fontSize:12.5, color:'var(--text-dim)' }}>{selPending.length} actionable (requested / under review)</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setSel({})}>Clear</button>
            <button className="btn btn-danger btn-sm" disabled={!selPending.length} onClick={()=>bulk('REJECTED')}>Reject selected</button>
            <button className="btn btn-gold btn-sm" disabled={!selPending.length} onClick={()=>bulk('APPROVED')}>Approve selected</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow:'hidden' }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width:36 }}><input type="checkbox" checked={allOn} onChange={toggleAll} style={{ accentColor:'var(--accent)', cursor:'pointer' }} /></th>
            <th>Reference</th><th>Renter</th><th>Vehicle</th><th>Dates</th><th>Insurance</th><th>Status</th>
          </tr></thead>
          <tbody>
            {rows.map(b=>{
              const r = window.biz.renter(b.renter_id); const v = window.biz.vehicle(b.vehicle_id);
              return (
                <tr key={b.id} style={{ background: sel[b.id]?'var(--accent-soft)':undefined }}>
                  <td onClick={(e)=>{e.stopPropagation(); toggle(b.id);}}>
                    <input type="checkbox" checked={!!sel[b.id]} onChange={()=>toggle(b.id)} style={{ accentColor:'var(--accent)', cursor:'pointer' }} />
                  </td>
                  <td onClick={()=>navigate('#/admin/bookings/'+b.id)}><span className="mono" style={{ color:'var(--accent)', fontSize:12.5 }}>{b.reference_number}</span></td>
                  <td onClick={()=>navigate('#/admin/bookings/'+b.id)}>{r?`${r.first_name} ${r.last_name}`:'—'}</td>
                  <td onClick={()=>navigate('#/admin/bookings/'+b.id)}><span style={{color:'var(--text-dim)'}}>{v?`${v.year} ${v.make} ${v.model}`:'—'}</span></td>
                  <td onClick={()=>navigate('#/admin/bookings/'+b.id)} className="mono" style={{ fontSize:12.5, color:'var(--text-dim)' }}>{window.biz.fmtShort(b.start_date)}–{window.biz.fmtShort(b.end_date)}</td>
                  <td onClick={()=>navigate('#/admin/bookings/'+b.id)}><span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>{b.insurance_type}</span></td>
                  <td onClick={()=>navigate('#/admin/bookings/'+b.id)}><Badge status={b.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Booking detail ---------- */
const LIFECYCLE = ['REQUESTED','UNDER_REVIEW','APPROVED','ACTIVE','COMPLETED'];

function BookingDetail({ id, navigate, refresh }) {
  const [modal, setModal] = useStateBk(null); // 'approve' | 'reject'
  const [reason, setReason] = useStateBk('');
  const b = window.DB.bookings.find(x=>x.id===id);
  if (!b) return <div>Booking not found.</div>;
  const r = window.biz.renter(b.renter_id);
  const v = window.biz.vehicle(b.vehicle_id);
  const ins = window.biz.bookingInsurance(b.id);
  const pays = window.biz.bookingPayments(b.id);

  // availability conflict check for approval
  const conflict = !window.biz.isAvailable(b.vehicle_id, b.start_date, b.end_date, b.id);

  function logAudit(action, changes) {
    window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'BOOKING',
      entity_id:b.reference_number, action, changes:changes||{}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
  }
  function transition(to, extra) {
    const from = b.status; b.status = to;
    logAudit(`Status → ${window.biz.statusMeta(to).label}`, { status:[from,to], ...(extra||{}) });
    setModal(null); setReason(''); refresh();
  }

  const rejected = b.status==='REJECTED';
  const stageIdx = LIFECYCLE.indexOf(b.status);

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate('#/admin/bookings')} style={{ marginBottom:20 }}>← All bookings</button>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span className="mono" style={{ fontSize:18, color:'var(--accent)' }}>{b.reference_number}</span>
            <Badge status={b.status} />
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:600, marginTop:8, color:'var(--text)' }}>
            {r?`${r.first_name} ${r.last_name}`:'—'} · {v?v.model:''}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {b.status==='REQUESTED' && <button className="btn btn-ghost" onClick={()=>transition('UNDER_REVIEW')}>Start review</button>}
          {['REQUESTED','UNDER_REVIEW'].includes(b.status) && <>
            <button className="btn btn-danger" onClick={()=>setModal('reject')}>Reject</button>
            <button className="btn btn-gold" onClick={()=>setModal('approve')}>Approve</button>
          </>}
          {b.status==='APPROVED' && <button className="btn btn-gold" onClick={()=>transition('ACTIVE')}>Mark active</button>}
          {b.status==='ACTIVE' && <button className="btn btn-dark" onClick={()=>transition('COMPLETED')}>Mark completed</button>}
        </div>
      </div>

      <div className="r-split" style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:22, alignItems:'start' }}>
        {/* left: timeline + vehicle */}
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
          <div className="card" style={{ padding:'20px 22px' }}>
            <h3 style={{ margin:'0 0 18px', fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>Booking timeline</h3>
            {LIFECYCLE.map((s,i)=>{
              const done = !rejected && i < stageIdx;
              const current = !rejected && i===stageIdx;
              return (
                <div key={s} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div className={`tl-dot ${done?'done':''} ${current?'current':''}`} />
                    {i<LIFECYCLE.length-1 && <div style={{ width:2, height:30, background: done?'var(--accent)':'var(--border)' }} />}
                  </div>
                  <div style={{ paddingBottom:14 }}>
                    <div style={{ fontSize:13.5, fontWeight: current?600:400, color: (done||current)?'var(--text)':'var(--text-faint)' }}>{window.biz.statusMeta(s).label}</div>
                    {current && <div style={{ fontSize:11.5, color:'var(--accent)', fontFamily:'var(--font-mono)', marginTop:2 }}>CURRENT STAGE</div>}
                  </div>
                </div>
              );
            })}
            {rejected && (
              <div style={{ display:'flex', gap:14, alignItems:'center', marginTop:4 }}>
                <div className="tl-dot reject" />
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--st-red-fg)' }}>Rejected</div>
              </div>
            )}
          </div>

          <div className="card" style={{ overflow:'hidden' }}>
            {v && <CarSlot vehicle={v} view="cover" ratio="16 / 9" radius={0} readOnly />}
            <div style={{ padding:'16px 20px' }}>
              <div className="eyebrow" style={{ color:'var(--text-faint)' }}>Vehicle</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, marginTop:4 }}>{v?`${v.make} ${v.model}`:'—'}</div>
              <div style={{ marginTop:10 }}>
                <InfoRow k="Plate" v={v?v.plate:'—'} mono />
                <InfoRow k="Weekly rate" v={v?window.biz.money(v.weekly_price):'—'} />
                <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', fontSize:13 }}>
                  <span style={{ color:'var(--text-dim)' }}>Status</span>
                  <a onClick={()=>navigate('#/admin/vehicles')} style={{ color:'var(--accent)', cursor:'pointer' }}>{v?window.biz.statusMeta(v.status).label:'—'}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* right: renter + insurance + payments */}
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
          <div className="card" style={{ padding:'20px 22px' }}>
            <h3 style={{ margin:'0 0 14px', fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>Renter & license</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 30px' }}>
              <InfoRow k="Name" v={r?`${r.first_name} ${r.last_name}`:'—'} />
              <InfoRow k="DOB" v={r?window.biz.fmtDate(r.dob):'—'} />
              <InfoRow k="Email" v={r?r.email:'—'} />
              <InfoRow k="Phone" v={r?r.phone:'—'} mono />
              <InfoRow k="Address" v={r?`${r.city}, ${r.state}`:'—'} />
              <InfoRow k="License #" v={r?r.license_number:'—'} mono />
              <InfoRow k="License state" v={r?r.license_state:'—'} />
              <InfoRow k="License expiry" v={r?window.biz.fmtDate(r.license_expiry):'—'} />
            </div>
          </div>

          <div className="card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>Insurance</h3>
              {ins ? <Badge status={ins.status} /> : <span style={{ fontSize:12, color:'var(--text-faint)' }}>None on file</span>}
            </div>
            {ins ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 30px' }}>
                <InfoRow k="Type" v={ins.type} />
                <InfoRow k="Provider" v={ins.provider_name} />
                <InfoRow k="Policy #" v={ins.policy_number} mono />
                <InfoRow k="Expiry" v={window.biz.fmtDate(ins.expiry_date)} />
                <div style={{ gridColumn:'span 2', marginTop:10 }}>
                  <a onClick={()=>navigate('#/admin/insurance')} className="btn btn-ghost btn-sm">Open insurance review →</a>
                </div>
              </div>
            ) : <p style={{ fontSize:13, color:'var(--text-dim)' }}>{b.insurance_type==='COMPANY'?'Company coverage selected — add the fleet policy in Insurance.':'No customer policy submitted.'}</p>}
          </div>

          <div className="card" style={{ padding:'4px 0' }}>
            <SectionHead title="Weekly payments" action="Payments →" onAction={()=>navigate('#/admin/payments')} count={pays.length} />
            {pays.length===0 && <Empty text="No payments scheduled until approved." />}
            {pays.map((p,i)=>(
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 22px', borderTop:'1px solid var(--border)' }}>
                <span className="mono" style={{ fontSize:11.5, color:'var(--text-faint)', width:32 }}>W{i+1}</span>
                <span style={{ fontSize:13, color:'var(--text-dim)', flex:1 }}>{window.biz.fmtShort(p.week_start)} – {window.biz.fmtShort(p.week_end)}</span>
                <span style={{ fontSize:13.5 }}>{window.biz.money(p.amount)}</span>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* approve modal */}
      <Modal open={modal==='approve'} onClose={()=>setModal(null)} eyebrow="Confirm approval" title="Approve this booking?"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
          <button className="btn btn-gold" disabled={conflict} onClick={()=>transition('APPROVED')}>Approve booking</button>
        </>}>
        <p style={{ fontSize:14, color:'var(--text-dim)', marginTop:0, lineHeight:1.6 }}>
          Approving <span className="mono" style={{ color:'var(--text)' }}>{b.reference_number}</span> will reserve the {v?v.model:'vehicle'} for these dates and block availability for any overlapping requests.
        </p>
        <div className="card" style={{ padding:'14px 16px', background:'var(--surface-2)' }}>
          <InfoRow k="Dates" v={`${window.biz.fmtDate(b.start_date)} → ${window.biz.fmtDate(b.end_date)}`} />
          <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', fontSize:13 }}>
            <span style={{ color:'var(--text-dim)' }}>Availability check</span>
            <span style={{ color: conflict?'var(--st-red-fg)':'var(--st-green-fg)', fontWeight:500 }}>{conflict?'Date conflict — cannot approve':'No conflicts'}</span>
          </div>
        </div>
        {conflict && <p style={{ fontSize:12.5, color:'var(--st-red-fg)', marginBottom:0 }}>Another approved or active booking overlaps these dates. Resolve the conflict before approving.</p>}
      </Modal>

      {/* reject modal */}
      <Modal open={modal==='reject'} onClose={()=>setModal(null)} eyebrow="Confirm rejection" title="Reject this booking?"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={()=>transition('REJECTED',{reason:['—',reason||'No reason given']})}>Reject booking</button>
        </>}>
        <p style={{ fontSize:14, color:'var(--text-dim)', marginTop:0, lineHeight:1.6 }}>
          The renter will be notified that request <span className="mono" style={{ color:'var(--text)' }}>{b.reference_number}</span> was declined. This does not block availability.
        </p>
        <Field label="Reason (internal)">
          <textarea className="input" rows="3" value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Insurance policy expired; license verification failed…" />
        </Field>
      </Modal>
    </div>
  );
}

Object.assign(window, { BookingsList, BookingDetail });
