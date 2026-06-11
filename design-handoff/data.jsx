/* ============================================================
   UBER RENTALS — Mock data + business logic
   Exposes window.DB and window.biz
   ============================================================ */
(function () {
  // ---------- helpers ----------
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (dstr, n) => { const d = new Date(dstr + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const overlaps = (s1, e1, s2, e2) => s1 <= e2 && s2 <= e1;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtDate(dstr) {
    if (!dstr) return '—';
    const d = new Date(dstr + 'T00:00:00');
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  function fmtShort(dstr) {
    const d = new Date(dstr + 'T00:00:00');
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }
  const money = (n) => '$' + Number(n).toLocaleString('en-US');

  // "today" anchor for the prototype
  const TODAY = '2026-05-30';

  // ---------- vehicles ----------
  const vehicles = [
    { id:'v1', vin:'WDD2030461A6841', plate:'URX-118', year:2025, make:'Mercedes-Benz', model:'S 580 Sedan', color:'Obsidian Black', seats:5, transmission:'Automatic', weekly_price:2450, status:'RENTED', images:3, hp:496, drivetrain:'AWD', fuel:'Gas · 22 MPG', topspeed:'130 mph', body:'Full-size Sedan', tagline:'The standard by which luxury sedans are measured.', features:['Executive rear seats','Burmester 4D sound','Heated & ventilated seats','Night-vision assist','Panoramic roof'] },
    { id:'v2', vin:'WBA7F2C50KGM2238', plate:'URX-204', year:2024, make:'BMW', model:'7 Series 760i', color:'Mineral White', seats:5, transmission:'Automatic', weekly_price:2200, status:'AVAILABLE', images:4, hp:536, drivetrain:'AWD', fuel:'Gas · 21 MPG', topspeed:'130 mph', body:'Full-size Sedan', tagline:'Commanding presence with theater-screen comfort.', features:['31" rear theater screen','Bowers & Wilkins audio','Massaging seats','Power doors','Sky Lounge roof'] },
    { id:'v3', vin:'SALGS2SE8MA44781', plate:'URX-330', year:2025, make:'Land Rover', model:'Range Rover Autobiography', color:'Santorini Black', seats:5, transmission:'Automatic', weekly_price:2800, status:'RENTED', images:4, hp:523, drivetrain:'4WD', fuel:'Gas · 19 MPG', topspeed:'155 mph', body:'Full-size SUV', tagline:'Go anywhere, arrive in absolute refinement.', features:['Terrain Response 2','Meridian Signature audio','24-way heated seats','Air suspension','Hot-stone massage'] },
    { id:'v4', vin:'WP0AB2A99NS22710', plate:'URX-051', year:2024, make:'Porsche', model:'911 Carrera S', color:'Guards Red', seats:2, transmission:'Automatic', weekly_price:3100, status:'AVAILABLE', images:5, hp:443, drivetrain:'RWD', fuel:'Gas · 20 MPG', topspeed:'191 mph', body:'Sports Coupe', tagline:'Seven generations of obsession in one silhouette.', features:['Sport Chrono package','PASM sport suspension','Sport exhaust','Carbon-ceramic brakes','14-way sport seats'] },
    { id:'v5', vin:'5YJSA1E63MF44120', plate:'URX-777', year:2025, make:'Tesla', model:'Model S Plaid', color:'Pearl White', seats:5, transmission:'Automatic', weekly_price:1950, status:'AVAILABLE', images:3, hp:1020, drivetrain:'AWD', fuel:'Electric · 396 mi', topspeed:'200 mph', body:'Performance Sedan', tagline:'1,020 horsepower of silent, savage acceleration.', features:['0–60 in 1.99s','Yoke steering','22-speaker audio','Full self-driving (sup.)','Glass roof'] },
    { id:'v6', vin:'WA1VAAF74MD00921', plate:'URX-462', year:2024, make:'Audi', model:'Q8 Prestige', color:'Glacier White', seats:5, transmission:'Automatic', weekly_price:1780, status:'MAINTENANCE', images:3, hp:335, drivetrain:'AWD', fuel:'Gas · 21 MPG', topspeed:'130 mph', body:'Coupe SUV', tagline:'Quattro poise wrapped in coupe-SUV drama.', features:['Quattro AWD','Bang & Olufsen 3D','Virtual cockpit','Adaptive air suspension','Heated seats'] },
    { id:'v7', vin:'ZFF92LMA5N0260118', plate:'URX-016', year:2023, make:'Ferrari', model:'Roma', color:'Rosso Corsa', seats:2, transmission:'Automatic', weekly_price:4600, status:'AVAILABLE', images:4, hp:612, drivetrain:'RWD', fuel:'Gas · 18 MPG', topspeed:'199 mph', body:'Grand Tourer', tagline:'La Nuova Dolce Vita — the new sweet life.', features:['3.9L twin-turbo V8','8-speed DCT','Manettino dial','Carbon-fiber trim','Daytona-style seats'] },
    { id:'v8', vin:'SCBCR3ZA9NC00781', plate:'URX-090', year:2025, make:'Bentley', model:'Continental GT', color:'Glacier Silver', seats:4, transmission:'Automatic', weekly_price:3950, status:'AVAILABLE', images:4, hp:542, drivetrain:'AWD', fuel:'Gas · 19 MPG', topspeed:'208 mph', body:'Grand Tourer', tagline:'Hand-built grand touring without compromise.', features:['Rotating display','Naim for Bentley audio','Diamond-knurled controls','Mulliner driving spec','Heated/cooled/massage'] },
    { id:'v9', vin:'WDDWJ8EB2KF77120', plate:'URX-243', year:2024, make:'Mercedes-Benz', model:'GLE 450 SUV', color:'Selenite Grey', seats:5, transmission:'Automatic', weekly_price:1650, status:'AVAILABLE', images:3, hp:375, drivetrain:'AWD', fuel:'Gas · 23 MPG', topspeed:'130 mph', body:'Mid-size SUV', tagline:'Effortless everyday luxury, family-sized.', features:['MBUX dual screens','Burmester audio','Heated seats','Hands-free liftgate','Wireless charging'] },
    { id:'v10', vin:'1G1YB2D40N5100442', plate:'URX-808', year:2024, make:'Chevrolet', model:'Corvette Stingray', color:'Torch Red', seats:2, transmission:'Automatic', weekly_price:2050, status:'ARCHIVED', images:2, hp:495, drivetrain:'RWD', fuel:'Gas · 19 MPG', topspeed:'194 mph', body:'Mid-engine Sports', tagline:'Mid-engine supercar performance, American-made.', features:['6.2L V8','Z51 performance pkg','Magnetic Ride','Removable roof','Performance Data Recorder'] },
  ];

  // ---------- renters ----------
  const renters = [
    { id:'r1', first_name:'Marcus', last_name:'Adeyemi', dob:'1989-03-14', phone:'(312) 555-0148', email:'m.adeyemi@gmail.com', street:'1820 N Clark St', city:'Chicago', state:'IL', zip:'60614', license_number:'A284-5519-9027', license_state:'IL', license_expiry:'2028-03-14' },
    { id:'r2', first_name:'Sofia', last_name:'Reyes', dob:'1992-11-02', phone:'(305) 555-0193', email:'sofia.reyes@gmail.com', street:'455 Brickell Ave', city:'Miami', state:'FL', zip:'33131', license_number:'R110-8841-2210', license_state:'FL', license_expiry:'2027-11-02' },
    { id:'r3', first_name:'David', last_name:'Chen', dob:'1985-06-21', phone:'(415) 555-0177', email:'d.chen@gmail.com', street:'88 King St', city:'San Francisco', state:'CA', zip:'94107', license_number:'C903-4412-0098', license_state:'CA', license_expiry:'2026-08-19' },
    { id:'r4', first_name:'Amara', last_name:'Okafor', dob:'1994-01-30', phone:'(646) 555-0112', email:'amara.okafor@gmail.com', street:'250 W 50th St', city:'New York', state:'NY', zip:'10019', license_number:'O221-7788-1190', license_state:'NY', license_expiry:'2029-01-30' },
    { id:'r5', first_name:'James', last_name:'Whitfield', dob:'1979-09-08', phone:'(214) 555-0166', email:'jwhitfield@gmail.com', street:'1700 Pacific Ave', city:'Dallas', state:'TX', zip:'75201', license_number:'W554-3321-7741', license_state:'TX', license_expiry:'2026-06-10' },
    { id:'r6', first_name:'Elena', last_name:'Volkov', dob:'1990-12-19', phone:'(702) 555-0154', email:'elena.volkov@gmail.com', street:'3700 Las Vegas Blvd', city:'Las Vegas', state:'NV', zip:'89109', license_number:'V889-2204-5512', license_state:'NV', license_expiry:'2028-12-19' },
  ];

  // ---------- bookings ----------
  // statuses: REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, ACTIVE, COMPLETED
  const bookings = [
    { id:'b1', reference_number:'CR-20260528-0007', renter_id:'r1', vehicle_id:'v1', start_date:'2026-05-25', end_date:'2026-06-22', status:'ACTIVE', insurance_type:'COMPANY', created_at:'2026-05-18' },
    { id:'b2', reference_number:'CR-20260529-0003', renter_id:'r2', vehicle_id:'v3', start_date:'2026-05-29', end_date:'2026-06-26', status:'ACTIVE', insurance_type:'CUSTOMER', created_at:'2026-05-21' },
    { id:'b3', reference_number:'CR-20260530-0011', renter_id:'r4', vehicle_id:'v4', start_date:'2026-06-05', end_date:'2026-06-19', status:'UNDER_REVIEW', insurance_type:'CUSTOMER', created_at:'2026-05-30' },
    { id:'b4', reference_number:'CR-20260530-0012', renter_id:'r3', vehicle_id:'v7', start_date:'2026-06-08', end_date:'2026-06-22', status:'REQUESTED', insurance_type:'COMPANY', created_at:'2026-05-30' },
    { id:'b5', reference_number:'CR-20260530-0013', renter_id:'r6', vehicle_id:'v8', start_date:'2026-06-12', end_date:'2026-07-10', status:'REQUESTED', insurance_type:'CUSTOMER', created_at:'2026-05-30' },
    { id:'b6', reference_number:'CR-20260520-0002', renter_id:'r5', vehicle_id:'v2', start_date:'2026-05-22', end_date:'2026-06-05', status:'APPROVED', insurance_type:'COMPANY', created_at:'2026-05-15' },
    { id:'b7', reference_number:'CR-20260410-0005', renter_id:'r1', vehicle_id:'v9', start_date:'2026-04-12', end_date:'2026-05-10', status:'COMPLETED', insurance_type:'CUSTOMER', created_at:'2026-04-05' },
    { id:'b8', reference_number:'CR-20260515-0008', renter_id:'r2', vehicle_id:'v5', start_date:'2026-05-16', end_date:'2026-05-30', status:'REJECTED', insurance_type:'COMPANY', created_at:'2026-05-12' },
  ];

  // ---------- insurance ----------
  // type CUSTOMER|COMPANY, status PENDING|VERIFIED|REJECTED
  const insurance = [
    { id:'i1', booking_id:'b1', type:'COMPANY', provider_name:'Uber Rentals Fleet Cover', policy_number:'URF-2026-0581', policy_address:'200 W Madison St, Chicago, IL', agent_phone:'(800) 555-0100', agent_email:'fleet@uberrentals.co', status:'VERIFIED', expiry_date:'2026-06-30' },
    { id:'i2', booking_id:'b2', type:'CUSTOMER', provider_name:'GEICO', policy_number:'GC-9920-44817', policy_address:'455 Brickell Ave, Miami, FL', agent_phone:'(305) 555-0200', agent_email:'claims@geico.com', status:'VERIFIED', expiry_date:'2026-12-01' },
    { id:'i3', booking_id:'b3', type:'CUSTOMER', provider_name:'State Farm', policy_number:'SF-1182-90043', policy_address:'250 W 50th St, New York, NY', agent_phone:'(646) 555-0211', agent_email:'agent@statefarm.com', status:'PENDING', expiry_date:'2027-02-15' },
    { id:'i4', booking_id:'b4', type:'COMPANY', provider_name:'Uber Rentals Fleet Cover', policy_number:'URF-2026-0590', policy_address:'200 W Madison St, Chicago, IL', agent_phone:'(800) 555-0100', agent_email:'fleet@uberrentals.co', status:'PENDING', expiry_date:'2026-06-15' },
    { id:'i5', booking_id:'b6', type:'COMPANY', provider_name:'Uber Rentals Fleet Cover', policy_number:'URF-2026-0571', policy_address:'200 W Madison St, Chicago, IL', agent_phone:'(800) 555-0100', agent_email:'fleet@uberrentals.co', status:'VERIFIED', expiry_date:'2026-06-08' },
    { id:'i6', booking_id:'b7', type:'CUSTOMER', provider_name:'Progressive', policy_number:'PG-7741-22018', policy_address:'1820 N Clark St, Chicago, IL', agent_phone:'(312) 555-0233', agent_email:'support@progressive.com', status:'VERIFIED', expiry_date:'2026-09-01' },
  ];

  // ---------- generate weekly payments from booking duration ----------
  function genWeeks(b) {
    const v = vehicles.find(x => x.id === b.vehicle_id);
    const weekly = v ? v.weekly_price : 0;
    const total = Math.max(1, daysBetween(b.start_date, b.end_date));
    const out = [];
    let cursor = b.start_date;
    let i = 0;
    while (daysBetween(b.start_date, cursor) < total) {
      const wEnd = addDays(cursor, 6);
      const realEnd = daysBetween(b.start_date, wEnd) > total ? b.end_date : wEnd;
      out.push({ start: cursor, end: realEnd, amount: weekly });
      cursor = addDays(cursor, 7);
      i++;
      if (i > 12) break;
    }
    return out;
  }

  // ---------- payments ----------
  // status PAID|DUE|OVERDUE — assigned per booking with realistic mix
  const payments = [];
  let pid = 1;
  function buildPayments() {
    bookings.forEach(b => {
      if (!['ACTIVE','COMPLETED','APPROVED'].includes(b.status)) return;
      const weeks = genWeeks(b);
      weeks.forEach((w, idx) => {
        let status;
        if (b.status === 'COMPLETED') status = 'PAID';
        else if (b.status === 'APPROVED') status = 'DUE';
        else {
          // ACTIVE: past weeks paid, current due, one overdue example
          if (w.end < TODAY) status = (b.id === 'b2' && idx === 0) ? 'OVERDUE' : 'PAID';
          else if (w.start <= TODAY && TODAY <= w.end) status = 'DUE';
          else status = 'DUE';
        }
        payments.push({ id:'p'+(pid++), booking_id:b.id, week_start:w.start, week_end:w.end, amount:w.amount, status });
      });
    });
  }
  buildPayments();

  // ---------- audit logs ----------
  const audit = [
    { id:'a1', admin:'A. Bello', entity_type:'BOOKING', entity_id:'CR-20260520-0002', action:'APPROVED booking', changes:{status:['UNDER_REVIEW','APPROVED']}, created_at:'2026-05-29 14:22' },
    { id:'a2', admin:'A. Bello', entity_type:'INSURANCE', entity_id:'URF-2026-0571', action:'VERIFIED insurance', changes:{status:['PENDING','VERIFIED']}, created_at:'2026-05-29 14:24' },
    { id:'a3', admin:'L. Mensah', entity_type:'PAYMENT', entity_id:'CR-20260528-0007 · W1', action:'Marked payment PAID', changes:{status:['DUE','PAID']}, created_at:'2026-05-28 09:10' },
    { id:'a4', admin:'L. Mensah', entity_type:'BOOKING', entity_id:'CR-20260515-0008', action:'REJECTED booking', changes:{status:['UNDER_REVIEW','REJECTED'], reason:['—','Insurance policy expired']}, created_at:'2026-05-26 16:48' },
    { id:'a5', admin:'A. Bello', entity_type:'VEHICLE', entity_id:'URX-462', action:'Status → MAINTENANCE', changes:{status:['AVAILABLE','MAINTENANCE']}, created_at:'2026-05-25 11:30' },
    { id:'a6', admin:'A. Bello', entity_type:'BOOKING', entity_id:'CR-20260528-0007', action:'Marked booking ACTIVE', changes:{status:['APPROVED','ACTIVE']}, created_at:'2026-05-25 08:02' },
    { id:'a7', admin:'L. Mensah', entity_type:'VEHICLE', entity_id:'URX-204', action:'Created vehicle', changes:{}, created_at:'2026-05-20 13:15' },
  ];

  // ============================================================
  //  BUSINESS LOGIC
  // ============================================================
  const biz = {
    TODAY, fmtDate, fmtShort, money, daysBetween, addDays, iso,

    renter: (id) => renters.find(r => r.id === id),
    vehicle: (id) => vehicles.find(v => v.id === id),
    bookingInsurance: (bid) => insurance.find(i => i.booking_id === bid),
    bookingPayments: (bid) => payments.filter(p => p.booking_id === bid),

    // availability: NOT available if an APPROVED|ACTIVE booking overlaps requested dates
    isAvailable(vehicleId, start, end, ignoreBookingId) {
      const v = vehicles.find(x => x.id === vehicleId);
      if (!v) return false;
      if (['MAINTENANCE','ARCHIVED'].includes(v.status)) return false;
      const blocking = bookings.filter(b =>
        b.vehicle_id === vehicleId &&
        b.id !== ignoreBookingId &&
        ['APPROVED','ACTIVE'].includes(b.status)
      );
      return !blocking.some(b => overlaps(start, end, b.start_date, b.end_date));
    },

    // next reference number for a given day
    nextReference(dateStr) {
      const day = (dateStr || TODAY).replace(/-/g, '');
      const todays = bookings.filter(b => b.reference_number.includes(`CR-${day}`));
      const seq = pad(todays.length + 1, 4);
      return `CR-${day}-${seq}`;
    },

    genWeeks,

    // canonical photo views per vehicle (shared by admin + client):
    // cover + up to 4 additional photos
    vehicleViews(v) {
      return [['cover','Cover'],['profile','Profile'],['interior','Interior'],['rear','Rear 3/4'],['detail','Detail']];
    },

    // insurance enforcement before marking PAID
    canMarkPaid(booking) {
      const ins = insurance.find(i => i.booking_id === booking.id);
      if (booking.insurance_type === 'COMPANY') {
        if (!ins) return { ok:false, reason:'No company insurance on file.' };
        if (ins.status !== 'VERIFIED') return { ok:false, reason:'Company insurance is not VERIFIED.' };
        if (ins.expiry_date < TODAY) return { ok:false, reason:`Company insurance expired ${fmtDate(ins.expiry_date)}.` };
      }
      return { ok:true };
    },

    // weeks of insurance expiring soon (within 14 days)
    insuranceExpiringSoon() {
      return insurance.filter(i => {
        const dleft = daysBetween(TODAY, i.expiry_date);
        return dleft >= 0 && dleft <= 14;
      });
    },

    // ---- Cron / scheduled jobs (simulated) ----
    // Marks overdue payments, detects expiring insurance, regenerates reminders.
    runDailyJobs() {
      let newOverdue = 0;
      payments.forEach(p => {
        if (p.status === 'DUE' && p.week_end < TODAY) { p.status = 'OVERDUE'; newOverdue++; }
      });
      const expiring = insurance.filter(i => {
        const dleft = daysBetween(TODAY, i.expiry_date);
        return dleft >= 0 && dleft <= 14;
      });
      const out = [];
      payments.filter(p => p.status === 'OVERDUE').forEach(p => {
        const b = bookings.find(x => x.id === p.booking_id);
        const r = b && renters.find(x => x.id === b.renter_id);
        out.push({ kind:'payment', sev:'high', title:`Overdue payment · ${money(p.amount)}`,
          detail:`${b ? b.reference_number : ''} · ${r ? r.first_name+' '+r.last_name : ''} · week of ${fmtShort(p.week_start)}` });
      });
      expiring.forEach(i => {
        const dleft = daysBetween(TODAY, i.expiry_date);
        const b = bookings.find(x => x.id === i.booking_id);
        out.push({ kind:'insurance', sev: dleft <= 3 ? 'high' : 'med', title:`Insurance expiring in ${dleft}d`,
          detail:`${i.provider_name} · ${i.policy_number}${b ? ' · '+b.reference_number : ''}` });
      });
      // licenses expiring within 60 days
      renters.forEach(r => {
        const dleft = daysBetween(TODAY, r.license_expiry);
        if (dleft >= 0 && dleft <= 60) out.push({ kind:'license', sev: dleft <= 14 ? 'high' : 'low',
          title:`License expires in ${dleft}d`, detail:`${r.first_name} ${r.last_name} · ${r.license_state} ${r.license_number}` });
      });
      reminders.length = 0;
      out.forEach((r, idx) => reminders.push({ id:'rem'+idx, ...r, created_at: TODAY }));
      lastRun.at = TODAY + ' ' + new Date().toTimeString().slice(0,5);
      audit.unshift({ id:'a'+(audit.length+1), admin:'System (cron)', entity_type:'PAYMENT', entity_id:'Daily automations',
        action:'Ran scheduled jobs', changes:{}, created_at: lastRun.at });
      return { newOverdue, expiring: expiring.length, reminders: reminders.length };
    },
    lastRun: () => lastRun.at,


    statusMeta(status) {
      const map = {
        REQUESTED:    { cls:'badge-neutral', label:'Requested' },
        UNDER_REVIEW: { cls:'badge-amber',   label:'Under Review' },
        APPROVED:     { cls:'badge-green',   label:'Approved' },
        REJECTED:     { cls:'badge-red',     label:'Rejected' },
        ACTIVE:       { cls:'badge-blue',    label:'Active' },
        COMPLETED:    { cls:'badge-neutral', label:'Completed' },
        AVAILABLE:    { cls:'badge-green',   label:'Available' },
        RENTED:       { cls:'badge-blue',    label:'Rented' },
        MAINTENANCE:  { cls:'badge-amber',   label:'Maintenance' },
        ARCHIVED:     { cls:'badge-neutral', label:'Archived' },
        PAID:         { cls:'badge-green',   label:'Paid' },
        DUE:          { cls:'badge-amber',   label:'Due' },
        OVERDUE:      { cls:'badge-red',     label:'Overdue' },
        VERIFIED:     { cls:'badge-green',   label:'Verified' },
        PENDING:      { cls:'badge-amber',   label:'Pending' },
      };
      return map[status] || { cls:'badge-neutral', label:status };
    },
  };

  // ---------- admins ----------
  const admins = [
    { id:'ad1', email:'a.bello@uberrentals.co', name:'A. Bello', role:'Fleet Admin · Owner', created_at:'2025-09-01' },
    { id:'ad2', email:'l.mensah@uberrentals.co', name:'L. Mensah', role:'Operations', created_at:'2025-11-14' },
  ];

  // ---------- reminders (populated by cron) ----------
  const reminders = [];
  const lastRun = { at: null };

  window.DB = { vehicles, renters, bookings, insurance, payments, audit, admins, reminders };
  window.biz = biz;
})();
