/* ============================================================
   UBER RENTALS — Admin: insurance, payments, vehicles, audit
   ============================================================ */
const { useState: useStateX } = React;

/* ===================== INSURANCE ===================== */
function InsuranceList({ navigate, refresh }) {
  const [filter, setFilter] = useStateX('ALL');
  const [sel, setSel] = useStateX(null);
  const [editing, setEditing] = useStateX(false);
  const [d, setD] = useStateX({});
  const rows = window.DB.insurance.filter(i => filter==='ALL' || i.status===filter);
  const setD_ = (k) => (e) => setD(s => ({ ...s, [k]: e.target.value }));

  function closeModal() { setSel(null); setEditing(false); }
  function openEdit() {
    setD({ provider_name:sel.provider_name, policy_number:sel.policy_number, expiry_date:sel.expiry_date,
      agent_phone:sel.agent_phone, agent_email:sel.agent_email, policy_address:sel.policy_address });
    setEditing(true);
  }
  function saveEdit() {
    Object.assign(sel, d);
    window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'INSURANCE',
      entity_id:sel.policy_number, action:'Edited insurance details', changes:{}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
    setEditing(false); refresh();
  }

  function act(i, status) {
    i.status = status;
    window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'INSURANCE',
      entity_id:i.policy_number, action:`${status==='VERIFIED'?'VERIFIED':'REJECTED'} insurance`,
      changes:{status:['PENDING',status]}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
    closeModal(); refresh();
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div className="pillbar">
          {['ALL','PENDING','VERIFIED','REJECTED'].map(f=>(
            <button key={f} className={filter===f?'on':''} onClick={()=>setFilter(f)}>{f==='ALL'?'All':window.biz.statusMeta(f).label}</button>
          ))}
        </div>
        <div style={{ fontSize:12.5, color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{rows.length} POLICIES</div>
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Provider</th><th>Booking</th><th>Type</th><th>Policy #</th><th>Expiry</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(i=>{
              const b = window.DB.bookings.find(x=>x.id===i.booking_id);
              const expired = i.expiry_date < window.biz.TODAY;
              return (
                <tr key={i.id} onClick={()=>setSel(i)}>
                  <td>{i.provider_name}</td>
                  <td><span className="mono" style={{ fontSize:12, color:'var(--accent)' }}>{b?b.reference_number:'—'}</span></td>
                  <td><span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>{i.type}</span></td>
                  <td className="mono" style={{ fontSize:12.5, color:'var(--text-dim)' }}>{i.policy_number}</td>
                  <td style={{ color: expired?'var(--st-red-fg)':'var(--text)' }}>{window.biz.fmtDate(i.expiry_date)}{expired?' · expired':''}</td>
                  <td><Badge status={i.status} /></td>
                  <td style={{ textAlign:'right' }}><span style={{ color:'var(--accent)', fontSize:12.5 }}>Review →</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!sel} onClose={closeModal} width={680} eyebrow={sel?sel.type+' policy':''} title={sel?sel.provider_name:''}
        footer={sel && (editing
          ? <>
              <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={saveEdit}>Save details</button>
            </>
          : <>
              <button className="btn btn-ghost" onClick={closeModal}>Close</button>
              <button className="btn btn-ghost" style={{ marginRight:'auto' }} onClick={openEdit}>Edit details</button>
              {sel.status!=='REJECTED' && <button className="btn btn-danger" onClick={()=>act(sel,'REJECTED')}>Reject</button>}
              {sel.status!=='VERIFIED' && <button className="btn btn-gold" onClick={()=>act(sel,'VERIFIED')}>Verify</button>}
            </>)}>
        {sel && <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
            <DocSlot label="Insurance card — front" />
            <DocSlot label="Insurance card — back" />
          </div>
          {editing ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <Field label="Provider" span="2"><input className="input" value={d.provider_name} onChange={setD_('provider_name')} /></Field>
              <Field label="Policy number"><input className="input" value={d.policy_number} onChange={setD_('policy_number')} /></Field>
              <Field label="Expiry"><input className="input" type="date" value={d.expiry_date} onChange={setD_('expiry_date')} /></Field>
              <Field label="Agent phone"><input className="input" value={d.agent_phone} onChange={setD_('agent_phone')} /></Field>
              <Field label="Agent email"><input className="input" value={d.agent_email} onChange={setD_('agent_email')} /></Field>
              <Field label="Policy address" span="2"><input className="input" value={d.policy_address} onChange={setD_('policy_address')} /></Field>
            </div>
          ) : <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 30px' }}>
              <InfoRow k="Status" v={window.biz.statusMeta(sel.status).label} />
              <InfoRow k="Expiry" v={window.biz.fmtDate(sel.expiry_date)} />
              <InfoRow k="Policy #" v={sel.policy_number} mono />
              <InfoRow k="Type" v={sel.type} />
              <InfoRow k="Agent phone" v={sel.agent_phone} mono />
              <InfoRow k="Agent email" v={sel.agent_email} />
            </div>
            <div style={{ marginTop:8 }}><InfoRow k="Policy address" v={sel.policy_address} /></div>
          </>}
        </>}
      </Modal>
    </div>
  );
}
function DocSlot({ label }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="car-ph" style={{ aspectRatio:'16/10', borderRadius:10, alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-faint)', letterSpacing:'0.06em' }}>SCANNED DOCUMENT</span>
      </div>
    </div>
  );
}

/* ===================== PAYMENTS ===================== */
function PaymentsList({ navigate, refresh }) {
  const [filter, setFilter] = useStateX('ALL');
  const [blocked, setBlocked] = useStateX(null);
  const rows = window.DB.payments.filter(p => filter==='ALL' || p.status===filter);

  function markPaid(p) {
    const b = window.DB.bookings.find(x=>x.id===p.booking_id);
    const check = window.biz.canMarkPaid(b);
    if (!check.ok) { setBlocked({ p, reason:check.reason, b }); return; }
    p.status = 'PAID';
    window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'PAYMENT',
      entity_id:`${b.reference_number}`, action:'Marked payment PAID', changes:{status:['DUE','PAID']}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
    refresh();
  }

  const totals = {
    paid: window.DB.payments.filter(p=>p.status==='PAID').reduce((s,p)=>s+p.amount,0),
    due: window.DB.payments.filter(p=>p.status==='DUE').reduce((s,p)=>s+p.amount,0),
    overdue: window.DB.payments.filter(p=>p.status==='OVERDUE').reduce((s,p)=>s+p.amount,0),
  };

  return (
    <div>
      <div className="r-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:24 }}>
        <Stat label="Collected" value={window.biz.money(totals.paid)} sub="paid to date" />
        <Stat label="Due" value={window.biz.money(totals.due)} tone="amber" sub="scheduled & current" />
        <Stat label="Overdue" value={window.biz.money(totals.overdue)} tone="red" sub="needs follow-up" />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div className="pillbar">
          {['ALL','DUE','OVERDUE','PAID'].map(f=>(
            <button key={f} className={filter===f?'on':''} onClick={()=>setFilter(f)}>{f==='ALL'?'All':window.biz.statusMeta(f).label}</button>
          ))}
        </div>
        <div style={{ fontSize:11.5, color:'var(--text-faint)', fontFamily:'var(--font-mono)', display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--st-amber-fg)' }}></span>
          INSURANCE RULE ENFORCED ON PAYMENT
        </div>
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Booking</th><th>Renter</th><th>Week</th><th>Amount</th><th>Insurance</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(p=>{
              const b = window.DB.bookings.find(x=>x.id===p.booking_id);
              const r = b?window.biz.renter(b.renter_id):null;
              const check = b?window.biz.canMarkPaid(b):{ok:true};
              return (
                <tr key={p.id} style={{ cursor:'default' }}>
                  <td><span className="mono" style={{ fontSize:12, color:'var(--accent)' }}>{b?b.reference_number:'—'}</span></td>
                  <td>{r?`${r.first_name} ${r.last_name}`:'—'}</td>
                  <td className="mono" style={{ fontSize:12.5, color:'var(--text-dim)' }}>{window.biz.fmtShort(p.week_start)}–{window.biz.fmtShort(p.week_end)}</td>
                  <td>{window.biz.money(p.amount)}</td>
                  <td>{b && b.insurance_type==='COMPANY' && !check.ok
                    ? <span title={check.reason} style={{ fontSize:11.5, color:'var(--st-red-fg)', fontFamily:'var(--font-mono)' }}>⚠ BLOCKED</span>
                    : <span style={{ fontSize:11.5, color:'var(--text-faint)', fontFamily:'var(--font-mono)' }}>OK</span>}</td>
                  <td><Badge status={p.status} /></td>
                  <td style={{ textAlign:'right' }}>
                    {p.status!=='PAID'
                      ? <button className="btn btn-ghost btn-sm" onClick={()=>markPaid(p)}>Mark paid</button>
                      : <span style={{ color:'var(--st-green-fg)', fontSize:12.5 }}>✓ Paid</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!blocked} onClose={()=>setBlocked(null)} eyebrow="Payment blocked" title="Insurance rule violation"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setBlocked(null)}>Close</button>
          <button className="btn btn-gold" onClick={()=>{ setBlocked(null); navigate('#/admin/insurance'); }}>Go to insurance →</button>
        </>}>
        {blocked && <>
          <div style={{ display:'flex', gap:14, padding:'16px 18px', borderRadius:12, background:'var(--st-red-bg)', marginBottom:16 }}>
            <span style={{ fontSize:22 }}>⚠</span>
            <div>
              <div style={{ fontWeight:600, color:'var(--st-red-fg)', fontSize:14.5 }}>Cannot mark as paid</div>
              <div style={{ fontSize:13, color:'var(--st-red-fg)', marginTop:4, lineHeight:1.5 }}>{blocked.reason}</div>
            </div>
          </div>
          <p style={{ fontSize:13.5, color:'var(--text-dim)', lineHeight:1.6, margin:0 }}>
            Company-insured bookings require <b style={{color:'var(--text)'}}>verified, non-expired</b> insurance before any payment can be recorded. Resolve the policy in Insurance, then retry.
          </p>
        </>}
      </Modal>
    </div>
  );
}

/* ===================== VEHICLES ===================== */
const VSTATUS = ['AVAILABLE','RENTED','MAINTENANCE','ARCHIVED'];
function VehiclesList({ navigate, refresh }) {
  const [sel, setSel] = useStateX(null);
  const [adding, setAdding] = useStateX(false);
  const [del, setDel] = useStateX(null);
  const NV0 = { make:'', model:'', year:'2025', weekly_price:'', vin:'', color:'', seats:'5', transmission:'Automatic' };
  const [nv, setNv] = useStateX(NV0);
  const setN = (k) => (e) => setNv(s => ({ ...s, [k]: e.target.value }));

  function logV(action, plate, changes) {
    window.DB.audit.unshift({ id:'a'+(window.DB.audit.length+1), admin:'A. Bello', entity_type:'VEHICLE',
      entity_id:plate, action, changes:changes||{}, created_at:'2026-05-31 '+new Date().toTimeString().slice(0,5) });
  }
  function createVehicle() {
    if (!nv.make || !nv.model || !nv.weekly_price) return;
    const id = 'v' + Date.now();
    const plate = 'URX-' + Math.floor(100 + Math.random() * 900);
    window.DB.vehicles.unshift({
      id, vin: nv.vin || '—', plate, year: +nv.year || 2025, make: nv.make, model: nv.model,
      color: nv.color || '—', seats: +nv.seats || 5, transmission: nv.transmission || 'Automatic',
      weekly_price: +nv.weekly_price || 0, status: 'AVAILABLE', images: 5,
      hp: '—', drivetrain: '—', fuel: '—', topspeed: '—', body: '—',
      tagline: 'Newly added to the fleet.', features: [],
    });
    logV('Created vehicle', plate, {});
    setAdding(false); setNv(NV0); refresh();
  }
  function removeVehicle(v, mode) {
    if (mode === 'archive') {
      const prev = v.status; v.status = 'ARCHIVED';
      logV('Archived vehicle (removed from fleet)', v.plate, { status:[prev,'ARCHIVED'] });
    } else {
      const hasHistory = window.DB.bookings.some(b => b.vehicle_id === v.id);
      if (hasHistory) {
        // keep the record so booking history retains the vehicle name
        v.deleted = true; v.status = 'ARCHIVED';
        if (!/\(deleted\)/i.test(v.model)) v.model = v.model + ' (Deleted)';
        logV('Deleted vehicle — record kept for booking history', v.plate, {});
      } else {
        const idx = window.DB.vehicles.findIndex(x => x.id === v.id);
        if (idx >= 0) window.DB.vehicles.splice(idx, 1);
        logV('Deleted vehicle', v.plate, {});
      }
    }
    setDel(null); setSel(null); refresh();
  }
  const blockingFor = (v) => v ? window.DB.bookings.filter(b => b.vehicle_id === v.id && ['REQUESTED','UNDER_REVIEW','APPROVED','ACTIVE'].includes(b.status)) : [];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:18 }}>
        <button className="btn btn-gold btn-sm" onClick={()=>setAdding(true)}>+ Add vehicle</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:20 }}>
        {window.DB.vehicles.filter(v=>!v.deleted).map(v=>(
          <div key={v.id} className="card" style={{ overflow:'hidden' }}>
            <div style={{ position:'relative' }}>
              <CarSlot vehicle={v} view="cover" ratio="16/10" radius={0} readOnly />
              <div style={{ position:'absolute', top:12, right:12, zIndex:2 }}><Badge status={v.status} /></div>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <div className="eyebrow" style={{ color:'var(--text-faint)' }}>{v.year} · {v.make}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, marginTop:3 }}>{v.model}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
                <span className="mono" style={{ fontSize:12, color:'var(--text-dim)' }}>{v.plate}</span>
                <span><span className="kpi-num" style={{ fontSize:20, color:'var(--accent)' }}>{window.biz.money(v.weekly_price)}</span><span style={{ fontSize:11, color:'var(--text-dim)' }}>/wk</span></span>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={()=>setSel(v)}>Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={()=>setSel(v)}>Status</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* edit / status modal */}
      <Modal open={!!sel} onClose={()=>setSel(null)} width={600} eyebrow={sel?`${sel.year} ${sel.make}`:''} title={sel?sel.model:''}
        footer={<>
          <button className="btn btn-danger" style={{ marginRight:'auto' }} onClick={()=>setDel(sel)}>Delete vehicle</button>
          <button className="btn btn-ghost" onClick={()=>setSel(null)}>Cancel</button>
          <button className="btn btn-gold" onClick={()=>setSel(null)}>Save changes</button>
        </>}>
        {sel && <>
          <div style={{ marginBottom:8 }}>
            <div className="field-label" style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span>Photos — cover + up to 4 more</span>
              <span style={{ textTransform:'none', letterSpacing:0, fontSize:11, color:'var(--text-faint)' }}>Drop to add · hover a photo to Replace / Remove</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'30px 12px', marginBottom:10 }}>
              {window.biz.vehicleViews(sel).map(([key,label])=>(
                <div key={key}>
                  <CarSlot vehicle={sel} view={key} ratio="16/11" radius={10} />
                  <div style={{ fontSize:10.5, fontFamily:'var(--font-mono)', letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-faint)', marginTop:5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Field label="Weekly price"><input className="input" defaultValue={sel.weekly_price} /></Field>
            <Field label="Color"><input className="input" defaultValue={sel.color} /></Field>
            <Field label="VIN" span="2"><input className="input mono" defaultValue={sel.vin} style={{ fontFamily:'var(--font-mono)' }} /></Field>
          </div>
          <div style={{ marginTop:18 }}>
            <div className="field-label">Status</div>
            <div className="pillbar" style={{ background:'var(--surface-3)' }}>
              {VSTATUS.map(s=>(
                <button key={s} className={sel.status===s?'on':''} onClick={()=>{ sel.status=s; setSel({...sel}); refresh(); }}>{window.biz.statusMeta(s).label}</button>
              ))}
            </div>
          </div>
        </>}
      </Modal>

      {/* delete / archive confirmation */}
      <Modal open={!!del} onClose={()=>setDel(null)} width={500}
        eyebrow="Remove from fleet" title={del ? `Delete ${del.model}?` : ''}
        footer={del && (blockingFor(del).length > 0
          ? <>
              <button className="btn btn-ghost" onClick={()=>setDel(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={()=>removeVehicle(del,'archive')}>Archive instead</button>
            </>
          : <>
              <button className="btn btn-ghost" onClick={()=>setDel(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={()=>removeVehicle(del,'archive')}>Archive</button>
              <button className="btn btn-danger" onClick={()=>removeVehicle(del,'delete')}>
                {window.DB.bookings.some(b => b.vehicle_id === del.id) ? 'Delete' : 'Delete permanently'}
              </button>
            </>)}>
        {del && (() => {
          const blk = blockingFor(del);
          return blk.length > 0 ? (
            <>
              <div style={{ display:'flex', gap:12, padding:'14px 16px', borderRadius:12, background:'var(--st-amber-bg)', color:'var(--st-amber-fg)', marginBottom:16 }}>
                <span style={{ fontSize:18 }}>⚠</span>
                <div style={{ fontSize:13.5, lineHeight:1.5 }}>
                  This vehicle has <b>{blk.length} live booking{blk.length>1?'s':''}</b> (requested, approved, or active). It can't be permanently deleted while bookings reference it.
                </div>
              </div>
              <p style={{ fontSize:13.5, color:'var(--text-dim)', lineHeight:1.6, margin:0 }}>
                <b style={{color:'var(--text)'}}>Archive</b> removes it from the public fleet and calendar while preserving its booking history. You can also cancel and resolve the bookings first.
              </p>
            </>
          ) : (() => {
            const hasHistory = window.DB.bookings.some(b => b.vehicle_id === del.id);
            return (
              <p style={{ fontSize:14, color:'var(--text-dim)', lineHeight:1.6, margin:0 }}>
                <b style={{color:'var(--text)'}}>{del.year} {del.make} {del.model}</b> (plate {del.plate}) has no live bookings.{' '}
                {hasHistory
                  ? <>It has past booking history, so deleting keeps its record — the name stays in those bookings and the audit log, marked <b style={{color:'var(--text)'}}>(Deleted)</b>, and it's removed from the fleet, public site, and calendar.</>
                  : <><b style={{color:'var(--text)'}}>Delete permanently</b> removes it entirely; <b style={{color:'var(--text)'}}>Archive</b> keeps it on file but hides it from the public fleet.</>}
              </p>
            );
          })()
        })()}
      </Modal>

      {/* add vehicle */}
      <Modal open={adding} onClose={()=>{setAdding(false); setNv(NV0);}} width={600} eyebrow="New vehicle" title="Add to fleet"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>{setAdding(false); setNv(NV0);}}>Cancel</button>
          <button className="btn btn-gold" disabled={!nv.make || !nv.model || !nv.weekly_price} onClick={createVehicle}>Create vehicle</button>
        </>}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Field label="Make"><input className="input" value={nv.make} onChange={setN('make')} placeholder="Mercedes-Benz" /></Field>
          <Field label="Model"><input className="input" value={nv.model} onChange={setN('model')} placeholder="S 580" /></Field>
          <Field label="Year"><input className="input" value={nv.year} onChange={setN('year')} placeholder="2025" /></Field>
          <Field label="Weekly price"><input className="input" value={nv.weekly_price} onChange={setN('weekly_price')} placeholder="2450" /></Field>
          <Field label="Color"><input className="input" value={nv.color} onChange={setN('color')} placeholder="Obsidian Black" /></Field>
          <Field label="Seats"><input className="input" value={nv.seats} onChange={setN('seats')} placeholder="5" /></Field>
          <Field label="VIN" span="2"><input className="input" value={nv.vin} onChange={setN('vin')} placeholder="WDD…" /></Field>
          <div style={{ gridColumn:'span 2' }}>
            <div className="field-label">Photos</div>
            <div style={{ fontSize:12.5, color:'var(--text-faint)', lineHeight:1.5 }}>
              Create the vehicle first, then open <b>Edit</b> to drop in cover + up to 4 photos.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== AUTOMATIONS (cron simulation) ===================== */
function Automations({ navigate, refresh }) {
  const [summary, setSummary] = useStateX(null);
  const reminders = window.DB.reminders;
  const lastRun = window.biz.lastRun();

  function run() {
    const res = window.biz.runDailyJobs();
    setSummary(res);
    refresh && refresh();
  }
  const sevColor = { high:['var(--st-red-bg)','var(--st-red-fg)'], med:['var(--st-amber-bg)','var(--st-amber-fg)'], low:['var(--st-blue-bg)','var(--st-blue-fg)'] };
  const kindLabel = { payment:'PAYMENT', insurance:'INSURANCE', license:'LICENSE' };

  const JOBS = [
    ['Mark overdue payments', 'Any DUE weekly payment past its end date is flipped to OVERDUE.', 'Daily · 06:00'],
    ['Detect expiring insurance', 'Flags COMPANY & customer policies expiring within 14 days.', 'Daily · 06:00'],
    ['License expiry watch', 'Surfaces renter licenses expiring within 60 days.', 'Weekly · Mon'],
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:18, marginBottom:24, flexWrap:'wrap' }}>
        <p style={{ margin:0, fontSize:13.5, color:'var(--text-dim)', maxWidth:560, lineHeight:1.6 }}>
          These scheduled jobs run automatically in production. Trigger them here to simulate a daily run — overdue payments are updated, expiring policies and licenses are flagged, and reminders are regenerated below.
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:12, color:'var(--text-faint)', fontFamily:'var(--font-mono)' }}>
            {lastRun ? `LAST RUN ${lastRun}` : 'NEVER RUN'}
          </span>
          <button className="btn btn-gold" onClick={run}>Run daily jobs now</button>
        </div>
      </div>

      {summary && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:18, padding:'14px 18px', marginBottom:22, background:'var(--surface-2)', borderColor:'var(--border-strong)' }}>
          <span style={{ fontSize:18, color:'var(--accent)' }}>✓</span>
          <span style={{ fontSize:13.5 }}>
            Run complete · <b>{summary.newOverdue}</b> payment{summary.newOverdue!==1?'s':''} newly overdue · <b>{summary.expiring}</b> polic{summary.expiring!==1?'ies':'y'} expiring · <b>{summary.reminders}</b> reminder{summary.reminders!==1?'s':''} generated.
          </span>
        </div>
      )}

      <div className="r-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:28 }}>
        {JOBS.map(([t,d,sch])=>(
          <div key={t} className="card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>{t}</h3>
              <span style={{ width:8, height:8, borderRadius:'50%', background: lastRun?'var(--st-green-fg)':'var(--text-faint)' }}></span>
            </div>
            <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.55, margin:'10px 0 14px' }}>{d}</p>
            <div className="eyebrow" style={{ color:'var(--text-faint)' }}>{sch}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:'4px 0' }}>
        <SectionHead title="Reminders & alerts" count={reminders.length} />
        {reminders.length === 0 && <Empty text={lastRun ? 'No active reminders — all clear.' : 'Run the daily jobs to generate reminders.'} />}
        {reminders.map(r=>{
          const [bg,fg] = sevColor[r.sev] || sevColor.low;
          return (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 22px', borderTop:'1px solid var(--border)' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.08em', color:fg, background:bg, padding:'3px 8px', borderRadius:6, flexShrink:0 }}>{kindLabel[r.kind]}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, color:'var(--text)' }}>{r.title}</div>
                <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>{r.detail}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate(r.kind==='payment'?'#/admin/payments':r.kind==='insurance'?'#/admin/insurance':'#/admin/renters')}>Review →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== AUDIT ===================== */
function AuditLog() {
  const ICONS = { BOOKING:'#c6a052', INSURANCE:'#5b4a86', PAYMENT:'#3c6b43', VEHICLE:'#2f6175' };
  return (
    <div className="card" style={{ padding:'8px 0' }}>
      {window.DB.audit.map((a,i)=>(
        <div key={a.id} style={{ display:'flex', gap:16, padding:'15px 24px', borderTop: i?'1px solid var(--border)':'0' }}>
          <div style={{ width:8, height:8, borderRadius:2, background:ICONS[a.entity_type]||'var(--accent)', marginTop:6, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
              <div style={{ fontSize:14, color:'var(--text)' }}>{a.action}</div>
              <div className="mono" style={{ fontSize:11.5, color:'var(--text-faint)', whiteSpace:'nowrap' }}>{a.created_at}</div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:5 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, letterSpacing:'0.08em', color:'var(--text-dim)', background:'var(--surface-3)', padding:'2px 7px', borderRadius:5 }}>{a.entity_type}</span>
              <span className="mono" style={{ fontSize:12, color:'var(--text-dim)' }}>{a.entity_id}</span>
              <span style={{ fontSize:12.5, color:'var(--text-faint)' }}>· {a.admin}</span>
            </div>
            {a.changes && a.changes.status && (
              <div style={{ marginTop:7, fontSize:12, color:'var(--text-dim)' }}>
                <span className="mono">{a.changes.status[0]}</span> → <span className="mono" style={{ color:'var(--accent)' }}>{a.changes.status[1]}</span>
                {a.changes.reason && <span style={{ marginLeft:10, fontStyle:'italic' }}>“{a.changes.reason[1]}”</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { InsuranceList, PaymentsList, VehiclesList, Automations, AuditLog, DocSlot });
