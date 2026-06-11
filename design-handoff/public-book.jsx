/* ============================================================
   UBER RENTALS — Booking request wizard + confirmation
   ============================================================ */
const { useState: useStateB } = React;

function BookingForm({ id, navigate }) {
  const v = window.biz.vehicle(id);
  const [step, setStep] = useStateB(0);
  const [attempted, setAttempted] = useStateB({});
  const [f, setF] = useStateB({
    start_date:'2026-06-15', end_date:'2026-07-13',
    first_name:'', last_name:'', dob:'', phone:'', email:'',
    street:'', city:'', state:'', zip:'',
    license_number:'', license_state:'', license_expiry:'',
    insurance_type:'COMPANY',
    provider_name:'', policy_number:'', agent_phone:'', agent_email:'', policy_expiry:'',
  });
  const SKEY = `ur-booking-${id}`;
  // restore saved progress
  React.useEffect(() => {
    try { const raw = localStorage.getItem(SKEY); if (raw) { const d = JSON.parse(raw);
      if (d.f) setF(s => ({ ...s, ...d.f })); if (typeof d.step === 'number') setStep(d.step); } } catch (e) {}
  }, [SKEY]);
  // persist progress
  React.useEffect(() => {
    try { localStorage.setItem(SKEY, JSON.stringify({ f, step })); } catch (e) {}
  }, [f, step, SKEY]);

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  if (!v) return <div style={{ padding:60 }}>Vehicle not found.</div>;

  const REQUIRED = {
    1: ['first_name','last_name','email','phone','license_number','license_expiry'],
    2: f.insurance_type === 'CUSTOMER' ? ['provider_name','policy_number','policy_expiry'] : [],
  };
  const showErr = !!attempted[step];
  const inv = (k) => showErr && (REQUIRED[step] || []).includes(k) && !f[k];
  const errStyle = { borderColor:'var(--st-red-fg)', boxShadow:'0 0 0 3px var(--st-red-bg)' };

  const weeks = Math.max(1, Math.ceil(window.biz.daysBetween(f.start_date, f.end_date) / 7));
  const subtotal = weeks * v.weekly_price;
  const steps = ['Dates','Driver','Insurance','Review'];

  function submit() {
    const ref = window.biz.nextReference(window.biz.TODAY);
    // create renter + booking (REQUESTED) in the prototype store
    const rid = 'r' + (window.DB.renters.length + 1);
    window.DB.renters.push({ id:rid, first_name:f.first_name||'New', last_name:f.last_name||'Guest', dob:f.dob,
      phone:f.phone, email:f.email, street:f.street, city:f.city, state:f.state, zip:f.zip,
      license_number:f.license_number, license_state:f.license_state, license_expiry:f.license_expiry });
    const bid = 'b' + (window.DB.bookings.length + 1);
    window.DB.bookings.push({ id:bid, reference_number:ref, renter_id:rid, vehicle_id:v.id,
      start_date:f.start_date, end_date:f.end_date, status:'REQUESTED', insurance_type:f.insurance_type, created_at:window.biz.TODAY });
    if (f.insurance_type === 'CUSTOMER' && f.provider_name) {
      window.DB.insurance.push({ id:'i'+(window.DB.insurance.length+1), booking_id:bid, type:'CUSTOMER',
        provider_name:f.provider_name, policy_number:f.policy_number, policy_address:`${f.street}, ${f.city}, ${f.state}`,
        agent_phone:f.agent_phone, agent_email:f.agent_email, status:'PENDING', expiry_date:f.policy_expiry });
    }
    try { localStorage.removeItem(SKEY); } catch (e) {}
    navigate('#/confirm/' + ref);
  }

  const canNext = () => {
    if (step === 0) return f.start_date && f.end_date && f.end_date > f.start_date;
    return (REQUIRED[step] || []).every(k => f[k]);
  };
  function next() {
    if (canNext()) { setStep(step + 1); setAttempted(a => ({ ...a, [step]: false })); }
    else setAttempted(a => ({ ...a, [step]: true }));
  }

  return (
    <div className="r-split" style={{ paddingTop:30, display:'grid', gridTemplateColumns:'1.55fr 0.85fr', gap:44, alignItems:'start' }}>
      <div>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('#/vehicle/'+v.id)} style={{ marginBottom:22 }}>← Back</button>
        <div className="eyebrow">Booking request</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:600, margin:'8px 0 26px' }}>Reserve the {v.model}</h1>

        {/* stepper */}
        <div style={{ display:'flex', gap:6, marginBottom:30 }}>
          {steps.map((s,i)=>(
            <div key={s} style={{ flex:1 }}>
              <div style={{ height:3, borderRadius:9, background: i<=step ? 'var(--accent)':'var(--border)' }} />
              <div style={{ marginTop:8, fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase',
                color: i===step ? 'var(--accent)' : i<step ? 'var(--text)' : 'var(--text-faint)' }}>
                {String(i+1).padStart(2,'0')} {s}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:'26px 26px 28px' }}>
          {showErr && !canNext() && (
            <div style={{ display:'flex', gap:11, alignItems:'center', padding:'11px 15px', borderRadius:10, background:'var(--st-red-bg)', color:'var(--st-red-fg)', marginBottom:20, fontSize:13.5 }}>
              <span style={{ fontSize:16 }}>⚠</span>
              {step===0 ? 'Please choose a valid date range.' : 'Please complete the highlighted required fields.'}
            </div>
          )}
          {step===0 && (
            <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
              <Field label="Pick-up date"><input className="input" type="date" value={f.start_date} onChange={set('start_date')} /></Field>
              <Field label="Return date"><input className="input" type="date" value={f.end_date} onChange={set('end_date')} /></Field>
              <div style={{ gridColumn:'span 2', background:'var(--surface-2)', borderRadius:10, padding:'14px 16px', fontSize:13, color:'var(--text-dim)' }}>
                {f.end_date > f.start_date
                  ? <>Duration: <b style={{color:'var(--text)'}}>{weeks} week{weeks>1?'s':''}</b> · billed weekly at {window.biz.money(v.weekly_price)}</>
                  : <span style={{ color:'var(--st-amber-fg)' }}>Return date must be after pick-up date.</span>}
              </div>
            </div>
          )}
          {step===1 && (
            <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
              <Field label="First name"><input className="input" style={inv('first_name')?errStyle:undefined} value={f.first_name} onChange={set('first_name')} placeholder="Marcus" /></Field>
              <Field label="Last name"><input className="input" style={inv('last_name')?errStyle:undefined} value={f.last_name} onChange={set('last_name')} placeholder="Adeyemi" /></Field>
              <Field label="Date of birth"><input className="input" type="date" value={f.dob} onChange={set('dob')} /></Field>
              <Field label="Phone"><input className="input" style={inv('phone')?errStyle:undefined} value={f.phone} onChange={set('phone')} placeholder="(312) 555-0148" /></Field>
              <Field label="Email" span="2"><input className="input" style={inv('email')?errStyle:undefined} type="email" value={f.email} onChange={set('email')} placeholder="you@email.com" /></Field>
              <Field label="Street address" span="2"><input className="input" value={f.street} onChange={set('street')} placeholder="1820 N Clark St" /></Field>
              <Field label="City"><input className="input" value={f.city} onChange={set('city')} placeholder="Chicago" /></Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="State"><input className="input" value={f.state} onChange={set('state')} placeholder="IL" /></Field>
                <Field label="ZIP"><input className="input" value={f.zip} onChange={set('zip')} placeholder="60614" /></Field>
              </div>
              <div style={{ gridColumn:'span 2', height:1, background:'var(--border)', margin:'4px 0' }} />
              <Field label="License number"><input className="input" style={inv('license_number')?errStyle:undefined} value={f.license_number} onChange={set('license_number')} placeholder="A284-5519-9027" /></Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="License state"><input className="input" value={f.license_state} onChange={set('license_state')} placeholder="IL" /></Field>
                <Field label="Expiry"><input className="input" style={inv('license_expiry')?errStyle:undefined} type="date" value={f.license_expiry} onChange={set('license_expiry')} /></Field>
              </div>
              <UploadRow label="License — front" id={`book-${v.id}-lic-front`} />
              <UploadRow label="License — back" id={`book-${v.id}-lic-back`} />
            </div>
          )}
          {step===2 && (
            <div>
              <div className="field-label">Insurance type</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:6 }}>
                {[['COMPANY','Company coverage','Add our fleet policy to this rental. Subject to verification.'],
                  ['CUSTOMER','Bring your own','Provide your existing policy. We verify before approval.']].map(([val,t,d])=>(
                  <div key={val} onClick={()=>setF(s=>({...s,insurance_type:val}))} style={{ cursor:'pointer', padding:'16px 18px', borderRadius:12,
                    border:'1.5px solid '+(f.insurance_type===val?'var(--accent)':'var(--border)'),
                    background: f.insurance_type===val?'var(--accent-soft)':'transparent' }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{t}</div>
                    <div style={{ fontSize:12.5, color:'var(--text-dim)', marginTop:6, lineHeight:1.5 }}>{d}</div>
                  </div>
                ))}
              </div>
              {f.insurance_type==='CUSTOMER' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginTop:20 }}>
                  <Field label="Provider name" span="2"><input className="input" style={inv('provider_name')?errStyle:undefined} value={f.provider_name} onChange={set('provider_name')} placeholder="State Farm" /></Field>
                  <Field label="Policy number"><input className="input" style={inv('policy_number')?errStyle:undefined} value={f.policy_number} onChange={set('policy_number')} placeholder="SF-1182-90043" /></Field>
                  <Field label="Policy expiry"><input className="input" style={inv('policy_expiry')?errStyle:undefined} type="date" value={f.policy_expiry} onChange={set('policy_expiry')} /></Field>
                  <Field label="Agent phone"><input className="input" value={f.agent_phone} onChange={set('agent_phone')} placeholder="(646) 555-0211" /></Field>
                  <Field label="Agent email"><input className="input" value={f.agent_email} onChange={set('agent_email')} placeholder="agent@provider.com" /></Field>
                  <UploadRow label="Insurance card — front" id={`book-${v.id}-ins-front`} />
                  <UploadRow label="Insurance card — back" id={`book-${v.id}-ins-back`} />
                </div>
              )}
            </div>
          )}
          {step===3 && (
            <div>
              <p style={{ fontSize:14, color:'var(--text-dim)', marginTop:0, lineHeight:1.6 }}>
                Please confirm. On submit, your request is created with status <b style={{color:'var(--text)'}}>REQUESTED</b> and enters our review queue.
              </p>
              <div className="card" style={{ padding:'6px 20px', background:'var(--surface-2)' }}>
                <InfoRow k="Vehicle" v={`${v.year} ${v.make} ${v.model}`} />
                <InfoRow k="Dates" v={`${window.biz.fmtDate(f.start_date)} → ${window.biz.fmtDate(f.end_date)}`} />
                <InfoRow k="Duration" v={`${weeks} week${weeks>1?'s':''}`} />
                <InfoRow k="Driver" v={`${f.first_name||'—'} ${f.last_name||''}`} />
                <InfoRow k="Insurance" v={f.insurance_type==='COMPANY'?'Company coverage':'Customer policy'} />
                <InfoRow k="Estimated weekly billing" v={window.biz.money(v.weekly_price)} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:22 }}>
          <button className="btn btn-ghost" onClick={()=> step===0 ? navigate('#/vehicle/'+v.id) : setStep(step-1)}>Back</button>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontSize:11.5, color:'var(--text-faint)', fontFamily:'var(--font-mono)', letterSpacing:'0.05em' }}>✓ PROGRESS SAVED</span>
            {step<3
              ? <button className="btn btn-gold" onClick={next}>Continue</button>
              : <button className="btn btn-gold" onClick={submit}>Submit request</button>}
          </div>
        </div>
      </div>

      {/* summary rail */}
      <div className="card booking-summary" style={{ overflow:'hidden', position:'sticky', top:24 }}>
        <CarSlot vehicle={v} view="cover" ratio="16 / 10" radius={0} readOnly />
        <div style={{ padding:'20px 22px' }}>
          <div className="eyebrow">{v.year} · {v.make}</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, marginTop:4 }}>{v.model}</div>
          <div style={{ height:1, background:'var(--border)', margin:'18px 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13.5, color:'var(--text-dim)', marginBottom:10 }}>
            <span>{window.biz.money(v.weekly_price)} × {weeks} wk</span><span style={{color:'var(--text)'}}>{window.biz.money(subtotal)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:8 }}>
            <span style={{ fontSize:13, color:'var(--text-dim)' }}>Estimated total</span>
            <span className="kpi-num" style={{ fontSize:30, color:'var(--accent)' }}>{window.biz.money(subtotal)}</span>
          </div>
          <p style={{ fontSize:11.5, color:'var(--text-faint)', marginTop:14, lineHeight:1.6 }}>
            Billed in weekly installments once approved & insurance is verified. Not charged at request.
          </p>
        </div>
      </div>
    </div>
  );
}

function UploadRow({ label, id }) {
  return (
    <div style={{ gridColumn:'span 1' }}>
      <span className="field-label">{label}</span>
      {React.createElement('image-slot', {
        id, shape:'rounded', radius:10, placeholder:`Drop ${label}`,
        style:{ display:'block', width:'100%', height:96, color:'var(--text-dim)',
          background:'repeating-linear-gradient(135deg, var(--surface-2) 0 12px, var(--surface-3) 12px 24px)', borderRadius:10 },
      })}
    </div>
  );
}

/* ---------- Confirmation ---------- */
function Confirmation({ ref: refNum, navigate }) {
  const booking = window.DB.bookings.find(b => b.reference_number === refNum);
  const v = booking ? window.biz.vehicle(booking.vehicle_id) : null;
  return (
    <div style={{ paddingTop:70, maxWidth:560, margin:'0 auto', textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 26px', color:'var(--accent)', fontSize:30 }}>✓</div>
      <div className="eyebrow">Request received</div>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:44, fontWeight:600, margin:'10px 0 0', lineHeight:1.05 }}>
        We're reviewing your request
      </h1>
      <p style={{ color:'var(--text-dim)', fontSize:16, lineHeight:1.6, marginTop:18 }}>
        Thank you. Your booking is in our queue with status <b style={{color:'var(--text)'}}>Requested</b>. Our team verifies details and insurance before approving — you'll hear from us within 24 hours.
      </p>
      <div className="card" style={{ padding:'22px 26px', marginTop:30, textAlign:'left' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text-dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Reference</span>
          <span className="mono" style={{ fontSize:18, color:'var(--accent)', letterSpacing:'0.04em' }}>{refNum}</span>
        </div>
        {v && <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)', fontSize:14, color:'var(--text-dim)' }}>
          {v.year} {v.make} {v.model} · {window.biz.fmtDate(booking.start_date)} → {window.biz.fmtDate(booking.end_date)}
        </div>}
      </div>
      <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:30 }}>
        <button className="btn btn-ghost" onClick={()=>navigate('#/')}>Back to fleet</button>
        <button className="btn btn-gold" onClick={()=>navigate('#/admin/bookings')}>View in admin →</button>
      </div>
    </div>
  );
}

Object.assign(window, { BookingForm, Confirmation });
