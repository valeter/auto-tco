import test from 'node:test';
import assert from 'node:assert/strict';
import {CAR_INFO,FIELDS,defaultState,normalizeState,calculate,stateDelta,resale,loanSchedule} from './dist/model.mjs';
import {LEGACY_V2} from './dist/legacy-v2.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} != ${b}`);
const car=(s,id='azimut')=>calculate(s).find(c=>c.id===id);

test('preserves legacy full states and sparse links against their original defaults',()=>{
  const s=structuredClone(LEGACY_V2);
  assert.equal(s.cars.azimut.price,2800000);
  assert.equal(calculate(s).length,7);
  for(const [id,tco] of [['changan',4294380],['tenet',4562025],['gac',5302300],['jolion',3188675]])near(car(s,id).tco,tco);
  s.general.years=8;
  for(const [id,tco] of [['changan',6259822.5],['tenet',6564625],['gac',7613575],['jolion',4749775]])near(car(s,id).tco,tco);
  s.general.years=3;assert.equal(car(s).rows.length,4);near(car(s,'belgee').saleNet,1900000);
  const sparse=normalizeState({version:2,general:{years:3}});
  assert.equal(sparse.needsReview,true);assert.deepEqual(calculate(sparse),calculate(s));
  assert.deepEqual(normalizeState(stateDelta(sparse)),sparse);
  assert.equal(defaultState().needsReview,false);
});

test('all supported horizons and mileage boundaries remain finite and reconcile',()=>{
  for(let years=1;years<=15;years++)for(const km of [0,8000,15000,60000]){
    const s=defaultState();Object.assign(s.general,{years,km});
    for(const r of calculate(s)){
      assert.ok(Number.isFinite(r.tco));near(r.cash-r.sale,r.tco);
      near(r.rows.reduce((a,b)=>a+b.net,0),r.tco);
      near(r.categories.purchase+r.categories.equipment+r.operating+r.categories.finance-r.saleNet,r.tco);
      if(km===0)assert.equal(r.perKm,null);
    }
  }
});

test('discount affects purchase and CASCO but not resale; fuel responds linearly',()=>{
  const s=defaultState(),base=car(s);s.cars.azimut.price-=100000;
  near(car(s).saleNet,base.saleNet);near(base.tco-car(s).tco,120000);
  s.general.fuelPrice+=10;near(car(s).categories.fuel-base.categories.fuel,67500);
});

test('age and mileage resale forecast, manual gross, bargaining and commissions',()=>{
  const s=defaultState(),info=CAR_INFO[0],c=s.cars.azimut;
  near(resale(info,c,s.general).gross,info.sale5);
  const before=resale(info,c,s.general).gross;s.general.resaleShift=10;
  near(resale(info,c,s.general).gross-before,c.referencePrice*.1);
  Object.assign(c,{resaleMode:'manual',manualSale:2000000,bargain:10,urgentDiscount:20,saleCommission:5,saleFixed:10000});
  near(resale(info,c,s.general).net,1358000);
  s.general.years=8;s.general.km=60000;s.general.resaleShift=-30;
  near(resale(info,c,s.general).net,1358000);
  c.resaleMode='auto';s.general.resaleShift=0;const high=resale(info,c,s.general).net;
  s.general.km=15000;assert.ok(resale(info,c,s.general).net>high);
});

test('maintenance counts time/mileage events and adds zero service once',()=>{
  const s=defaultState();s.general.km=0;
  assert.equal(car(s).rows.slice(1).reduce((a,b)=>a+b.serviceCount,0),5);
  s.general.km=15000;s.general.years=3;
  near(car(s,'volga').categories.service,4*40000+11880);
  Object.assign(s.cars.volga,{independentYear:2,independentDiscount:50});
  near(car(s,'volga').categories.service,40000+3*20000+11880);
});

test('reviewed first-service schedules and TENET per-visit prices are counted once',()=>{
  const s=defaultState();s.general.years=1;s.general.km=10000;
  assert.equal(car(s,'jolion').rows[1].serviceCount,1);
  s.general.km=25000;s.general.years=2;
  assert.deepEqual(car(s,'jolion').rows.slice(1).map(r=>r.serviceCount),[2,1]);
  s.general.km=15000;s.general.years=5;
  assert.equal(car(s,'gac').rows.reduce((n,r)=>n+r.serviceCount,0),7);
  assert.equal(car(s,'changan').rows.reduce((n,r)=>n+r.serviceCount,0),10);
  near(car(s,'tenet').categories.service,16500+24300+24300+36300+30800+35200+59400+24300);
  s.cars.tenet.zeroService=0;s.general.years=8;
  near(car(s,'tenet').categories.service,336900+2*35000);
  s.cars.tenet.serviceUseSchedule=false;s.general.years=1;s.general.km=10000;s.cars.tenet.serviceEarly=100;
  near(car(s,'tenet').categories.service,100);
});

test('common maintenance interval adjustment changes mileage and time including the first visit',()=>{
  const s=defaultState();s.cars.custom.enabled=true;s.general.years=3;
  const original=structuredClone(s.cars);
  s.general.serviceIntervalShift=-50;
  assert.equal(car(s,'jolion').rows.reduce((n,r)=>n+r.serviceCount,0),6);
  near(car(s,'tenet').categories.service,16500+301700);
  near(car(s,'volga').categories.service,9*40000+11880);
  assert.equal(car(s,'custom').rows.reduce((n,r)=>n+r.serviceCount,0),6);
  s.general.serviceIntervalShift=50;
  assert.equal(car(s,'jolion').rows.reduce((n,r)=>n+r.serviceCount,0),2);
  s.general.years=1;s.general.km=0;s.general.serviceIntervalShift=-50;
  assert.equal(car(s,'changan').rows[1].serviceCount,4);
  s.general.serviceIntervalShift=100;
  assert.equal(car(s,'changan').rows[1].serviceCount,1);
  assert.deepEqual(s.cars,original);
  assert.deepEqual(normalizeState(stateDelta(s)),s);
});

test('CASCO master switch overrides every tariff without losing settings or affecting other costs',()=>{
  const s=defaultState();s.cars.custom.enabled=true;
  Object.assign(s.cars.azimut,{overrideCasco:true,cascoFirst:9,cascoNext:4});
  Object.assign(s.cars.custom,{overrideCasco:true,cascoFirst:8,cascoYears:2});
  const before=calculate(s),original=structuredClone(s.cars);
  s.general.cascoEnabled=false;
  for(const r of calculate(s)){
    const old=before.find(b=>b.id===r.id);
    near(r.categories.casco,0);near(old.tco-r.tco,old.categories.casco);
    near(r.categories.osago,old.categories.osago);near(r.categories.service,old.categories.service);
  }
  assert.deepEqual(s.cars,original);
  assert.deepEqual(normalizeState(stateDelta(s)),s);
  s.general.cascoEnabled=true;assert.deepEqual(calculate(s),before);
  delete s.general.cascoEnabled;delete s.general.serviceIntervalShift;
  assert.deepEqual(calculate(s),before);
  const invalid=normalizeState({general:{cascoEnabled:'false',serviceIntervalShift:-1000}});
  assert.equal(invalid.general.cascoEnabled,true);assert.equal(invalid.general.serviceIntervalShift,-50);
});

test('repair event, insurance cutoff and per-car extras override',()=>{
  const s=defaultState(),base=car(s);
  Object.assign(s.cars.azimut,{largeRepair:200000,largeRepairYear:6});near(car(s).tco,base.tco);
  s.cars.azimut.largeRepairYear=5;near(car(s).tco-base.tco,200000);
  Object.assign(s.cars.azimut,{overrideCasco:true,cascoYears:1});near(car(s).categories.casco,2800000*.06);
  Object.assign(s.general,{parking:50000,oneOff:100000,oneOffYear:3});near(car(s).categories.parking,250000);near(car(s).categories.other,100000);
  Object.assign(s.cars.azimut,{overrideExtras:true,parking:10000,oneOff:20000,oneOffYear:1});near(car(s).categories.parking,50000);near(car(s).categories.other,20000);
});

test('common CASCO rates, cutoff and individual exceptions affect every car including custom',()=>{
  const s=defaultState();s.cars.custom.enabled=true;
  Object.assign(s.general,{cascoFirst:4,cascoNext:2,cascoLate:1,cascoYears:6});
  for(const years of [3,5,8]){
    s.general.years=years;
    const rate=.04+.02*Math.min(years-1,4)+(years>=6?.01:0);
    for(const r of calculate(s))near(r.categories.casco,s.cars[r.id].price*rate);
  }
  Object.assign(s.cars.azimut,{overrideCasco:true,cascoFirst:10,cascoNext:5,cascoYears:2});
  s.general.cascoYears=0;
  for(const r of calculate(s))near(r.categories.casco,r.id==='azimut'?2800000*.15:0);
  s.cars.azimut.overrideCasco=false;for(const r of calculate(s))near(r.categories.casco,0);
  Object.assign(s.general,{years:3,cascoYears:1,financial:true,moneyMode:'nominal',insuranceGrowth:10});
  near(car(s).categories.casco,2800000*.04*1.1);
  s.general.moneyMode='real';s.general.inflation=10;near(car(s).categories.casco,2800000*.04);
});

test('legacy CASCO settings survive migration and disabled overrides stay disabled in shared links',()=>{
  const legacy=defaultState();
  for(const key of ['cascoFirst','cascoNext','cascoLate','cascoYears'])delete legacy.general[key];
  for(const c of Object.values(legacy.cars))delete c.overrideCasco;
  legacy.cars.gac.cascoFirst=9;legacy.cars.azimut.cascoYears=0;
  const migrated=normalizeState(legacy);
  assert.equal(migrated.cars.gac.overrideCasco,true);assert.equal(migrated.cars.azimut.overrideCasco,true);
  assert.equal(migrated.cars.jolion.overrideCasco,false);near(car(migrated,'gac').categories.casco,5349000*.23);
  near(car(migrated).categories.casco,0);
  const sparse=normalizeState({version:2,cars:{gac:{cascoFirst:9}}});assert.equal(sparse.cars.gac.overrideCasco,true);
  migrated.cars.gac.overrideCasco=false;migrated.general.cascoFirst=3;
  assert.deepEqual(normalizeState(stateDelta(migrated)),migrated);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(migrated))),migrated);
  near(car(normalizeState(stateDelta(migrated)),'gac').categories.casco,5349000*.17);
});

test('tires include first winter only, replacements before sale, and optional legacy reserve',()=>{
  const s=defaultState();s.general.km=0;
  near(car(s).categories.tires,70000+5*9000);
  s.general.years=6;near(car(s).categories.tires,70000+60000+70000+6*9000);
  s.general.km=60000;s.general.years=5;near(car(s).categories.tires,70000+3*(60000+70000)+5*9000);
  s.cars.azimut.winterIncluded=true;near(car(s).categories.tires,3*(60000+70000)+5*9000);
  s.cars.azimut.tireMode='reserve';near(car(s).categories.tires,5*(60000*.75+70000*.75+9000));
  s.cars.azimut.tireMode='purchases';s.cars.azimut.winterIncluded=false;s.cars.azimut.summerShare=100;s.general.km=0;
  near(car(s).categories.tires,5*9000);
});

test('loans count principal once, settle early sale and include interest and fees',()=>{
  const s=defaultState(),base=car(s);Object.assign(s.general,{financial:true,moneyMode:'nominal',fuelGrowth:0,serviceGrowth:0,insuranceGrowth:0,otherGrowth:0,resaleGrowth:0,loanEnabled:true,loanRate:0,loanYears:10});
  near(car(s).tco,base.tco);near(car(s).loanRemaining,700000);near(car(s).categories.purchase,2800000);
  s.general.loanRate=12;s.general.loanFees=25000;const r=car(s);
  near(r.tco-base.tco,r.loanInterest+25000);near(r.categories.purchase,2800000);
  s.cars.azimut.overrideLoan=true;s.cars.azimut.downPayment=100;s.cars.azimut.loanFees=0;
  near(car(s).loanPayment,0);near(car(s).tco,base.tco);
  const loan=loanSchedule(120000,0,1,1);near(loan.payment,10000);near(loan.remaining,0);
});

test('financial block off ignores all latent inputs; equal inflation cancels real cost growth',()=>{
  const s=defaultState(),base=car(s).tco;
  Object.assign(s.general,{loanEnabled:true,loanRate:30,returnRate:30,capitalEnabled:true});near(car(s).tco,base);near(car(s).capital,0);
  Object.assign(s.general,{financial:true,loanEnabled:false,taxGrowth:5});near(car(s).tco,base);
  assert.ok(car(s).capital>0);s.general.returnRate=0;near(car(s).capital,0);
  s.general.moneyMode='nominal';assert.ok(car(s).tco!==base);
});

test('purchase and sale switches preserve price and insurance and reconcile all four combinations',()=>{
  for(const financial of [false,true])for(const moneyMode of ['real','nominal'])for(const years of [3,5,8]){
    const s=defaultState();s.cars.custom.enabled=true;
    Object.assign(s.general,{financial,moneyMode,years});
    s.cars.gac.saleCommission=3;s.cars.gac.saleFixed=10000;
    const cars=structuredClone(s.cars),original=calculate(s);
    for(const includePurchase of [true,false])for(const includeSale of [true,false]){
      Object.assign(s.general,{includePurchase,includeSale});
      for(const r of calculate(s)){
        const before=original.find(x=>x.id===r.id);
        near(r.tco,before.tco-(includePurchase?0:before.categories.purchase)+(includeSale?0:before.saleNet));
        near(r.saleNet,includeSale?before.saleNet:0);
        near(r.categories.purchase,includePurchase?before.categories.purchase:0);
        near(r.categories.casco,before.categories.casco);
        near(r.categories.equipment,before.categories.equipment);
        near(r.categories.saleCosts,includeSale?before.categories.saleCosts:0);
        assert.deepEqual(r.referenceSale,before.referenceSale);
        near(r.rows.reduce((n,row)=>n+row.net,0),r.tco);
      }
      assert.deepEqual(normalizeState(stateDelta(s)),s);
    }
    assert.deepEqual(s.cars,cars);
  }
  for(const version of [2,3,4]){
    const restored=normalizeState({version});
    assert.equal(restored.general.includePurchase,true);assert.equal(restored.general.includeSale,true);
  }
});

test('keeping the car does not trigger loan settlement and excluded purchase never counts principal',()=>{
  const s=defaultState();Object.assign(s.general,{years:3,financial:true,moneyMode:'nominal',loanEnabled:true,loanYears:10,loanRate:12,loanFees:25000});
  const sold=car(s);assert.ok(sold.loanRemaining>0);assert.ok(sold.loanInterest>0);
  s.general.includeSale=false;const kept=car(s);
  near(kept.tco,sold.tco+sold.saleNet-sold.loanRemaining);
  near(kept.categories.purchase,sold.categories.purchase-sold.loanRemaining);
  near(kept.rows.at(-1).debtSettlement,0);near(kept.loanRemaining,sold.loanRemaining);
  for(const includeSale of [true,false]){
    Object.assign(s.general,{includeSale,includePurchase:false});const r=car(s);
    near(r.categories.purchase,0);near(r.categories.finance,sold.categories.finance);
    near(r.tco,(includeSale?sold:kept).tco-(includeSale?sold:kept).categories.purchase);
    assert.ok(r.rows.every(row=>row.categories.purchase===0&&row.debtSettlement===0));
  }
});

test('transport tax is independent of expense inflation',()=>{
  const s=defaultState();Object.assign(s.general,{financial:true,moneyMode:'nominal',otherGrowth:20});
  near(car(s,'gac').categories.tax,5*17325);
  s.general.taxGrowth=10;assert.ok(car(s,'gac').categories.tax>5*17325);
});

test('sanitizes imported settings and supports delta round-trip, including all-off',()=>{
  const s=normalizeState({general:{years:99,km:-10,fuelPrice:Infinity,financial:'true'},cars:{azimut:{price:NaN,enabled:false}}});
  assert.equal(s.general.years,15);assert.equal(s.general.km,0);assert.equal(s.general.fuelPrice,77);assert.equal(s.general.financial,false);assert.equal(s.cars.azimut.price,2800000);
  assert.deepEqual(normalizeState(stateDelta(s)),s);
  for(const c of Object.values(s.cars))c.enabled=false;assert.deepEqual(calculate(s),[]);
});

test('all individual parameter extremes produce finite totals',()=>{
  for(const [key,field] of Object.entries(FIELDS.car))if(field.type==='number')for(const value of [field.min,field.max]){
    const s=defaultState();s.cars.azimut[key]=value;
    assert.ok(Number.isFinite(car(s).tco),key);
  }
});

test('custom car is last and opt-in and does not change other cars',()=>{
  assert.equal(CAR_INFO.at(-1).id,'custom');
  const s=defaultState();assert.equal(s.cars.custom.enabled,false);assert.equal(calculate(s).length,8);
  const old=structuredClone(s);delete old.cars.custom;
  assert.deepEqual(calculate(old),calculate(s));
  s.cars.custom.enabled=true;s.cars.custom.name='Мой автомобиль';
  assert.equal(calculate(s).length,9);assert.equal(calculate(s).at(-1).name,'Мой автомобиль');
  const after=calculate(s).filter(r=>r.id!=='custom');assert.deepEqual(after,calculate(old));
  s.cars.custom.name='   ';assert.equal(car(s,'custom').name,'Твой автомобиль');
});

test('Granta is included in new scenarios while v3 full and sparse scenarios retain their selection',()=>{
  const current=defaultState(),previous=structuredClone(current);
  previous.version=3;delete previous.cars.granta;
  previous.general.km=18000;previous.cars.gac.price=5100000;
  const restored=normalizeState(previous);
  assert.equal(restored.cars.granta.enabled,false);
  assert.equal(restored.cars.granta.tireMode,'purchases');
  assert.equal(restored.cars.gac.price,5100000);assert.equal(restored.general.km,18000);
  assert.equal(calculate(restored).length,7);
  assert.equal(calculate({version:3,general:{years:3}}).length,7);
  assert.deepEqual(normalizeState(stateDelta(restored)),restored);
  assert.equal(calculate(normalizeState(stateDelta(current))).length,8);
  for(const years of [3,5,8]){
    current.general.years=years;
    const result=car(current,'granta');
    assert.ok(result.saleNet>0&&result.saleNet<result.categories.purchase);
    assert.equal(result.rows.reduce((n,row)=>n+row.serviceCount,0),years);
    assert.ok(calculate(current).filter(r=>r.id!=='granta').every(r=>r.tco>result.tco));
  }
  current.general.years=5;near(car(current,'granta').saleNet,760000);
  current.general.years=8;near(car(current,'granta').saleNet,570000);
});

test('custom resale is controlled by its own 3/5/8-year anchors and not a hidden analogue',()=>{
  const s=defaultState();const c=s.cars.custom;c.enabled=true;
  Object.assign(c,{referencePrice:4000000,retention3:75,retention5:50,retention8:25,bargain:10});
  for(const [years,expected] of [[3,2700000],[5,1800000],[8,900000]]){s.general.years=years;near(car(s,'custom').saleNet,expected);}
  s.general.years=4;near(car(s,'custom').saleNet,Math.sqrt(3000000*2000000)*.9);
  s.general.years=9;near(car(s,'custom').saleNet,900000*.91);
  c.price=1000000;near(car(s,'custom').saleNet,900000*.91);
  c.resaleMode='manual';c.manualSale=1234567;near(car(s,'custom').saleNet,1234567*.9);
});

test('custom zero and reversed resale anchors remain finite at all ages',()=>{
  const s=defaultState();s.cars.custom.enabled=true;
  for(const values of [[0,0,0],[100,0,0],[0,100,0],[40,60,80]]){
    [s.cars.custom.retention3,s.cars.custom.retention5,s.cars.custom.retention8]=values;
    for(let y=1;y<=15;y++){s.general.years=y;assert.ok(Number.isFinite(car(s,'custom').tco));}
  }
});

test('custom name, parameters and selection survive scenarios and shared deltas',()=>{
  const s=defaultState();Object.assign(s.cars.custom,{enabled:true,name:'Renault «Мой» & <вариант>',price:3900000,retention5:47,serviceEarly:45678});
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(stateDelta(s)))),s);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(s))),s);
  const dirty=normalizeState({cars:{custom:{enabled:true,name:'x'.repeat(100),retention3:999,retention5:NaN,price:-1},azimut:{name:'not allowed'}}});
  assert.equal(dirty.cars.custom.name.length,60);assert.equal(dirty.cars.custom.retention3,100);assert.equal(dirty.cars.custom.retention5,55);assert.equal(dirty.cars.custom.price,0);
  assert.equal(Object.hasOwn(dirty.cars.azimut,'name'),false);
});
