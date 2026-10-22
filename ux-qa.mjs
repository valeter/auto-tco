import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defaultState} from './dist/model.mjs';
const baseURL=new URL(process.env.QA_BASE_URL??'http://127.0.0.1:4173/');
const cdpURL=new URL(process.env.QA_CDP_URL??'http://127.0.0.1:9223/');
const outputDir=process.env.QA_OUTPUT_DIR??join(tmpdir(),'auto-tco-qa');
await mkdir(outputDir,{recursive:true});
const pages=await(await fetch(new URL('json/list',cdpURL))).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let seq=0,currentLoaderId='';const pending=new Map(),errors=[];
ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result);}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails);else if(d.method==='Page.frameNavigated'&&!d.params.frame.parentId)currentLoaderId=d.params.frame.loaderId;};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForDocument(predicate){for(let i=0;i<100;i++){if(predicate()&&await run('document.readyState==="complete"'))return;await pause(50);}throw Error('Navigation did not finish');}
async function navigate(url){const result=await send('Page.navigate',{url});if(result.loaderId)await waitForDocument(()=>currentLoaderId===result.loaderId);}
async function reload(){const previous=currentLoaderId;await send('Page.reload');await waitForDocument(()=>currentLoaderId!==previous);}
const click=selector=>run(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function ready(){for(let i=0;i<50;i++){if(await run('document.querySelectorAll("#baseline-rows tr").length===8'))return;await pause(100);}throw Error('Page not ready: '+JSON.stringify(errors));}
const val=id=>run(`document.getElementById(${JSON.stringify(id)}).value`);
const change=(id,value)=>run(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
const input=(id,value)=>run(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(String(value))};e.dispatchEvent(new Event('input',{bubbles:true}));if(e.type==='number')e.dispatchEvent(new FocusEvent('focusout',{bubbles:true}));})()`);
async function type(id,text){await run(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.focus();e.select();})()`);const values=[];for(const char of text){await send('Input.insertText',{text:char});values.push(await val(id));}return values;}
const key=async key=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:key==='Enter'?13:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:key==='Enter'?13:27});};
async function shot(name){await run('document.getElementById("toast").classList.remove("visible")');await pause(200);const r=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(outputDir,'ux-'+name+'.png'),Buffer.from(r.data,'base64'));}
async function metrics(){return run(`(()=>{const svg=document.querySelector('#chart svg');return {resultTop:Math.round(document.getElementById('results').getBoundingClientRect().top+scrollY),labelPixels:12*svg.clientWidth/svg.viewBox.baseVal.width,overflow:document.documentElement.scrollWidth>innerWidth};})()`);}
async function saved(){await pause(220);return run('JSON.parse(localStorage.getItem("auto-tco-state-v2"))');}
const scenarios=()=>run('JSON.parse(localStorage.getItem("auto-tco-scenarios-v2"))');

try{
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('about:blank');
  await send('Storage.clearDataForOrigin',{origin:baseURL.origin,storageTypes:'all'});
  await navigate(baseURL.href);await ready();
  assert.equal(await val('compare-base'),'granta');
  assert.match(await run('document.querySelector("#cards article").textContent'),/Lada Granta.*База сравнения/s);
  const legacy=defaultState();legacy.version=3;delete legacy.cars.granta;legacy.cars.azimut.price=3100000;
  await run(`window.addEventListener('pagehide',()=>{localStorage.setItem('auto-tco-state-v2',${JSON.stringify(JSON.stringify(legacy))});localStorage.setItem('auto-tco-ui-v4',JSON.stringify({compareBase:'azimut'}));},{once:true});`);
  await navigate('about:blank');await navigate(baseURL.href);await ready();
  assert.equal(await val('compare-base'),'granta');
  assert.equal(await run('document.querySelector("[data-enabled=granta]").checked'),true);
  assert.equal(await val('azimut-price-value'),'3100000');
  await change('compare-base','gac');await reload();await ready();assert.equal(await val('compare-base'),'gac');
  await change('compare-base','granta');await click('#reset-all');await click('#dismiss-undo');
  await click('[data-car-tab="granta"]');assert.equal(await val('granta-price-value'),'1290000');
  await input('granta-price-value',1390000);assert.equal((await saved()).cars.granta.price,1390000);
  await click('#share');const grantaURL=await val('share-url');await navigate(grantaURL);await ready();
  assert.equal(await val('compare-base'),'granta');assert.equal(await val('granta-price-value'),'1390000');
  await click('#reset-all');await click('#dismiss-undo');await click('[data-car-tab="azimut"]');
  for(const km of [60001,100000,300000]){
    await type('general-km-value',String(km));await key('Enter');
    assert.equal((await saved()).general.km,km);
    assert.notEqual(await run('document.getElementById("general-km-value").getAttribute("aria-invalid")'),'true');
    if(km%1000===0)assert.equal(await val('general-km-range'),String(km));
    const fuel=await run(`[...[...document.querySelectorAll('#breakdown-rows tr')].find(r=>r.querySelector('th').textContent==='Топливо').querySelectorAll('td')].map(e=>Number(e.textContent.replace(/[^0-9]/g,'')))`);
    assert.ok(fuel.includes(Math.round(km*5/100*8*77)));
  }
  await click('#share');const highMileageURL=await val('share-url');await navigate(highMileageURL);await ready();
  assert.equal(await val('general-km-value'),'300000');
  await reload();await ready();assert.equal((await saved()).general.km,300000);
  await click('#reset-all');await click('#dismiss-undo');
  for(const name of ['includePurchase','includeSale']){
    assert.equal(await run(`document.getElementById('general-${name}-value').checked`),true);
    assert.equal(await run(`document.getElementById('general-${name}-value').closest('section').id`),'settings');
  }
  const accountingRow=label=>run(`(()=>{const row=[...document.querySelectorAll('#breakdown-rows tr')].find(r=>r.querySelector('th').textContent===${JSON.stringify(label)});return [...row.querySelectorAll('td')].map(e=>e.textContent);})()`);
  const resaleBefore=await accountingRow('Выручка от продажи до комиссии');
  await click('#general-includePurchase-value');
  assert.equal((await saved()).cars.azimut.price,2800000);
  assert.ok((await accountingRow('Покупка автомобиля')).every(v=>v==='0 ₽'));
  assert.deepEqual((await accountingRow('Выручка от продажи до комиссии')).sort(),resaleBefore.sort());
  await click('#general-includeSale-value');
  assert.ok((await accountingRow('Выручка от продажи до комиссии')).every(v=>v==='0 ₽'));
  assert.ok((await accountingRow('Расходы при продаже')).every(v=>v==='0 ₽'));
  assert.equal(await run('document.getElementById("results-title").textContent'),'Расходы без покупки и продажи');
  assert.match(await run('document.querySelector("#cards .sale-tag").textContent'),/Продажа не учитывается/);
  await click('#share');const accountingURL=await val('share-url');await navigate(accountingURL);await ready();
  assert.equal(await run('document.getElementById("general-includePurchase-value").checked'),false);
  assert.equal(await run('document.getElementById("general-includeSale-value").checked'),false);
  const advancedLink='#settings a[href="#general-settings"]';
  assert.match(await run(`document.querySelector(${JSON.stringify(advancedLink)}).textContent`),/Расширенные настройки для всех машин/);
  await click(advancedLink);await pause(100);assert.equal(await run('location.hash'),'#general-settings');
  await click('#reset-all');await click('#dismiss-undo');
  await run('document.documentElement.style.scrollBehavior="auto"');
  assert.equal(await run('document.getElementById("general-cascoEnabled-value").checked'),true);
  assert.equal(await run('document.querySelectorAll("#source-links article").length'),9);
  assert.ok(await run('document.querySelectorAll("#source-links a[href^=\\"https://\\"]").length>20'));
  assert.equal(await run('Boolean(document.querySelector(".baseline").compareDocumentPosition(document.getElementById("sources")) & Node.DOCUMENT_POSITION_FOLLOWING)'),true);
  await run('document.getElementById("quick-maintenance").open=true');
  await input('general-serviceIntervalShift-range',-20);
  await click('[data-car-tab="tenet"]');
  assert.match(await run('document.getElementById("service-schedule-note").textContent'),/8.*000.*9,6/);
  assert.equal((await saved()).cars.tenet.serviceKm,10000);
  await click('[data-car-tab="azimut"]');await click('#azimut-overrideCasco-value');await input('azimut-cascoFirst-value',9);
  await click('#general-cascoEnabled-value');
  assert.equal(await run('document.getElementById("general-cascoFirst-value").disabled'),true);
  assert.equal(await run('document.getElementById("azimut-overrideCasco-value").disabled'),true);
  await click('#share');const quickURL=await val('share-url');await navigate(quickURL);await ready();
  assert.equal(await run('document.getElementById("general-cascoEnabled-value").checked'),false);
  assert.equal(await val('general-serviceIntervalShift-value'),'-20');
  const allCascoZero=()=>run(`[...[...document.querySelectorAll('#breakdown-rows tr')].find(r=>r.querySelector('th').textContent==='Каско').querySelectorAll('td')].every(e=>Number(e.textContent.replace(/[^0-9]/g,''))===0)`);
  assert.equal(await allCascoZero(),true);
  await click('#general-cascoEnabled-value');assert.equal(await val('azimut-cascoFirst-value'),'9');assert.equal(await allCascoZero(),false);
  await input('general-serviceIntervalShift-value',20);assert.match(await run('document.getElementById("service-adjustment-label").textContent'),/\+20%.*реже/);
  await click('#reset-all');await click('#dismiss-undo');await run('document.getElementById("quick-maintenance").open=false');
  assert.equal(await run('document.getElementById("general-cascoFirst-value").closest("details").dataset.group'),'general-extras');
  const cascoAmounts=()=>run(`[...document.querySelectorAll('#breakdown-rows tr')].find(r=>r.querySelector('th').textContent==='Каско').querySelectorAll('td')`).then(()=>run(`[...[...document.querySelectorAll('#breakdown-rows tr')].find(r=>r.querySelector('th').textContent==='Каско').querySelectorAll('td')].map(e=>Number(e.textContent.replace(/[^0-9]/g,'')))`));
  assert.equal(await run('document.getElementById("azimut-cascoFirst-value").disabled'),true);
  await run('document.querySelector("[data-group=general-extras]").open=true');
  await input('general-cascoFirst-range',8);assert.equal((await saved()).general.cascoFirst,8);
  await input('general-cascoYears-value',0);assert.ok((await cascoAmounts()).every(n=>n===0));
  await click('#azimut-overrideCasco-value');assert.equal(await val('azimut-cascoFirst-value'),'8');assert.equal(await val('azimut-cascoYears-value'),'0');
  await input('azimut-cascoYears-value',1);await input('azimut-cascoFirst-value',10);assert.deepEqual((await cascoAmounts()).filter(n=>n>0),[280000]);
  await input('general-cascoFirst-value',4);assert.deepEqual((await cascoAmounts()).filter(n=>n>0),[280000]);
  await click('#azimut-overrideCasco-value');assert.ok((await cascoAmounts()).every(n=>n===0));
  await click('#share');const cascoURL=await val('share-url');await navigate(cascoURL);await ready();
  assert.equal(await val('general-cascoFirst-value'),'4');assert.equal(await val('general-cascoYears-value'),'0');assert.equal(await run('document.getElementById("azimut-overrideCasco-value").checked'),false);assert.ok((await cascoAmounts()).every(n=>n===0));
  await run(`location.hash='s='+btoa(JSON.stringify({version:2,cars:{azimut:{cascoFirst:9}}}))`);await pause(100);
  assert.equal(await run('document.getElementById("azimut-overrideCasco-value").checked'),true);assert.equal(await val('azimut-cascoFirst-value'),'9');
  assert.equal(await run('document.getElementById("review-notice").hidden'),false);
  await click('#apply-reviewed-defaults');assert.equal(await run('document.getElementById("review-notice").hidden'),true);
  assert.equal((await saved()).cars.gac.serviceKm,10000);assert.equal((await saved()).cars.azimut.tireMode,'purchases');
  await click('#undo');assert.equal(await run('document.getElementById("review-notice").hidden'),false);
  await click('#reset-all');await click('#dismiss-undo');
  await run('document.querySelector("[data-group=general-extras]").open=true;document.getElementById("general-settings").scrollIntoView({behavior:"instant"})');await shot('casco-desktop');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(200);await shot('casco-mobile');
  assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});

  assert.equal(await run('document.querySelectorAll("#cards article").length'),8);
  assert.equal(await run('document.title'),'Во сколько обойдётся автомобиль');
  await type('general-fuelPrice-value','1');assert.equal(await run(`document.querySelector('[data-reset-field="fuelPrice"][data-scope="general"]').disabled`),false);await key('Escape');assert.equal(await run(`document.querySelector('[data-reset-field="fuelPrice"][data-scope="general"]').disabled`),true);
  assert.deepEqual(await type('general-fuelPrice-value','95'),['9','95']);await key('Enter');assert.equal((await saved()).general.fuelPrice,95);
  await type('general-fuelPrice-value','1');await key('Enter');assert.equal(await run('document.getElementById("general-fuelPrice-value").getAttribute("aria-invalid")'),'true');assert.equal((await saved()).general.fuelPrice,95);await key('Escape');assert.equal(await val('general-fuelPrice-value'),'95');
  await click('[data-car-tab="azimut"]');await run('document.querySelector("[data-group=car-service]").open=true');
  assert.equal((await type('azimut-serviceKm-value','10000')).at(-1),'10000');await key('Enter');assert.equal((await saved()).cars.azimut.serviceKm,10000);
  assert.match(await run('document.querySelector("[data-field=\\"azimut.serviceKm\\"] .field-change").textContent'),/15.*000.*10.*000/);
  await click('[data-car-tab="gac"]');await click('[data-car-tab="azimut"]');assert.equal(await run('document.querySelector("[data-group=car-service]").open'),true);
  const actual=await run('[...document.querySelectorAll("#car-settings [data-field]")].map(e=>e.dataset.field.split(".")[1])');
  assert.deepEqual([...new Set(actual)].sort(),Object.keys(defaultState().cars.azimut).filter(k=>!['enabled','serviceUseSchedule'].includes(k)).sort());
  const visibleFinance=()=>run('[...document.querySelectorAll("[data-group=general-finance] .field")].filter(e=>!e.hidden).length');
  assert.equal(await visibleFinance(),1);await click('#general-financial-value');assert.equal(await run('document.querySelector("[data-field=\\"general.loanRate\\"]").hidden'),true);await click('#general-loanEnabled-value');assert.equal(await run('document.querySelector("[data-field=\\"general.loanRate\\"]").hidden'),false);
  await input('general-loanRate-value',-10);await click('#general-loanEnabled-value');await click('#share');assert.ok((await val('share-url')).includes('#s='));
  await click('#reset-all');await click('#dismiss-undo');
  await run('document.getElementById("scenario-tools").open=true');
  await input('scenario-name','A');await click('#save-as');const idA=await val('scenario-select');
  await type('general-km-value','16000');assert.equal(await run('document.getElementById("save-scenario").disabled'),false);await key('Escape');
  await input('general-km-value',25000);await input('scenario-name','B');await click('#save-as');const idB=await val('scenario-select');
  await change('scenario-select',idA);assert.equal(await val('scenario-name'),'');
  await input('general-km-value',18000);assert.equal(await val('scenario-select'),idA);assert.match(await run('document.getElementById("scenario-dirty").textContent'),/несохран/);await click('#save-scenario');
  await pause(250);await reload();await ready();assert.equal(await val('scenario-select'),idA);assert.equal(await val('general-km-value'),'18000');
  assert.equal((await scenarios()).find(s=>s.id===idA).state.general.km,18000);assert.equal((await scenarios()).find(s=>s.id===idB).state.general.km,25000);
  await input('scenario-name','A');await click('#save-as');assert.equal((await scenarios()).at(-1).name,'A (2)');
  await click('#delete-scenario');assert.equal((await scenarios()).length,2);await click('#undo');assert.equal((await scenarios()).length,3);
  await click('[data-car-tab="azimut"]');await input('azimut-price-value',3100000);await click('#reset-car');assert.equal(await val('azimut-price-value'),'2800000');await click('#undo');assert.equal(await val('azimut-price-value'),'3100000');
  await click('#reset-all');await click('#undo');assert.equal(await val('azimut-price-value'),'3100000');
  await change('compare-base','gac');assert.match(await run('document.querySelector("#cards article .comparison-delta").textContent'),/−/);
  await click('[data-metric="monthly"]');assert.match(await run('document.getElementById("metric-explanation").textContent'),/не платёж по кредиту/);
  await click('[data-column="purchase"]');assert.match(await run('document.getElementById("comparison-head").textContent'),/Покупка/);
  await click('[data-chart="gac"]');assert.equal(await val('chart-car'),'gac');assert.equal(await run('document.querySelectorAll("#chart g[opacity=\\".15\\"]").length'),7);
  await click('[data-open-custom]');assert.equal(await run('document.querySelector("[data-stage=\\"1\\"]").hidden'),false);
  await input('custom-name-value','Мой автомобиль');await change('copy-from','jolion');await click('#copy-car');assert.equal(await val('custom-price-value'),'2949000');assert.equal((await saved()).cars.custom.enabled,false);
  await click('#wizard-next');assert.equal(await run('document.querySelector("[data-stage=\\"2\\"]").hidden'),false);
  await input('custom-price-value',3330000);await input('custom-fuel-value',8.7);await click('#wizard-next');await input('custom-retention5-value',60);await click('#wizard-add');
  assert.equal(await run('document.querySelectorAll("#cards article").length'),9);assert.match(await run('document.getElementById("chart-legend").textContent'),/Мой автомобиль/);
  const customFields=await run('[...document.querySelectorAll("#car-settings [data-field]")].map(e=>e.dataset.field.split(".")[1])');
  assert.deepEqual([...new Set(customFields)].sort(),Object.keys(defaultState().cars.custom).filter(k=>!['enabled','serviceUseSchedule'].includes(k)).sort());
  await input('custom-name-value','=1+1 \"Тест\" <b> 🚗');assert.equal(await run('document.querySelectorAll("#cards b").length'),0);
  await run('window.__csv=null;URL.createObjectURL=b=>{window.__csv=b;return "blob:qa"};HTMLAnchorElement.prototype.click=function(){}');await click('#export');assert.ok((await run('window.__csv.text()')).includes("'="));
  await input('custom-name-value','Мой автомобиль');
  await click('#share');const url=await val('share-url');await run('localStorage.clear()');await navigate(url);await ready();
  assert.equal(await run('document.querySelectorAll("#cards article").length'),9);await click('[data-car-tab="custom"]');assert.equal(await val('custom-price-value'),'3330000');
  await run('window.__csv=null;URL.createObjectURL=b=>{window.__csv=b;return "blob:qa"};HTMLAnchorElement.prototype.click=function(){}');await click('#export');const csv=await run('window.__csv.text()');assert.match(csv,/Мой автомобиль/);assert.match(csv,/3330000/);
  await input('general-km-value',0);assert.equal((await saved()).general.km,0);
  for(const id of Object.keys(defaultState().cars))await click('[data-enabled="'+id+'"]');assert.equal(await run('document.getElementById("result-empty").hidden'),false);
  await click('#reset-all');await click('#dismiss-undo');await click('[data-metric="annual"]');
  await run('document.getElementById("scenario-tools").open=false;document.getElementById("selection-details").open=false;window.scrollTo(0,0)');
  console.log('Desktop',await metrics());await shot('desktop');
  await click('[data-car-tab="azimut"]');await run('document.getElementById("car-editor").scrollIntoView({behavior:"instant"})');await shot('editor');
  for(const width of [390,320]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await pause(200);
    await run('window.scrollTo({top:0,behavior:"instant"})');const m=await metrics();assert.equal(m.overflow,false);assert.ok(m.labelPixels>=11);assert.ok(m.resultTop<1200);assert.equal(await run('getComputedStyle(document.querySelector(".comparison-table th")).position'),'sticky');console.log('Mobile '+width,m);await shot('mobile-'+width);
    await run('document.querySelector(".chart-panel").scrollIntoView({behavior:"instant"})');await shot('chart-'+width);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await run('window.print=()=>{window.__printed=true}');await click('#print');assert.equal(await run('window.__printed'),true);
  await click('[data-car-tab="tenet"]');assert.equal(await run('document.getElementById("tenet-serviceUseSchedule-value").checked'),true);
  assert.equal(await run('document.querySelector("[data-field=\\"tenet.price\\"] .basis").textContent'),'Исходное: подтверждено прайсом ↗');
  await navigate(new URL('audit.html#tenet',baseURL).href);
  for(let i=0;i<50;i++){if(await run('document.querySelectorAll("[data-audit-field]").length>500'))break;await pause(100);}
  assert.equal(await run('document.getElementById("tenet").open'),true);
  assert.equal(await run('document.querySelectorAll("#model-findings article").length'),8);
  assert.equal(await run('document.querySelectorAll("#impact-rows tr").length'),8);
  assert.equal(await run('/NaN|undefined/.test(document.getElementById("impact-rows").textContent)'),false);
  assert.ok(await run('document.getElementById("granta").textContent.includes("106 л.с.")'));
  for(const width of [390,320]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await pause(100);
    assert.equal(await run('document.documentElement.scrollWidth>innerWidth'),false);
  }
  await run('scrollTo(0,0)');const auditShot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(outputDir,'audit-mobile.png'),Buffer.from(auditShot.data,'base64'));
  assert.deepEqual(errors,[]);
  console.log('PASS: common CASCO rates, cutoff, individual exceptions and legacy/shared scenarios; real keyboard input, validation, scenario identities/copies/undo, all fields reachable, persistent groups, progressive finance, sorting/metrics/base/columns/chart, custom wizard/template, sharing/CSV, mobile layout and print.');
}finally{ws.close();}
