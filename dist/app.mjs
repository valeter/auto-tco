import {CAR_INFO,GENERAL_GROUPS,CAR_GROUPS,FIELDS,CASCO_KEYS,CATEGORY_LABELS,defaultState,normalizeState,calculate,calculateCar,maintenanceIntervals,resale,builtInScenarios,stateDelta,coerce,displayName,DATE} from './model.mjs';
import {SOURCES,COMMON_SOURCES,parameterEvidence} from './sources.mjs';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
const decimal=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
const compact=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const millions=value=>decimal.format(value/1000000);
const rub=value=>num.format(value)+' ₽';
const yearLabel=value=>value+' '+(value===1?'год':value>=2&&value<=4?'года':'лет');
const STORAGE='auto-tco-state-v2',SCENARIOS='auto-tco-scenarios-v2';
const defaults=defaultState();
let storageAvailable=true,bootMessage='',saveTimer,toastTimer;
function readStorage(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{storageAvailable=false;return fallback;}}
const storedState=readStorage(STORAGE,null);
let state=normalizeState(storedState);
// Add the requested benchmark to the working draft without altering saved scenarios.
const addedGranta=storedState&&[2,3].includes(storedState.version)&&!Object.hasOwn(storedState.cars??{},'granta');
if(addedGranta){state.cars.granta.enabled=true;bootMessage='Добавлена Lada Granta — база сравнения расходов. Параметры остальных машин сохранены.';}
function decodeHash(hash){
  if(!hash.startsWith('#s='))return null;
  if(hash.length>65000)throw new Error('Слишком длинная ссылка сценария.');
  const encoded=hash.slice(3).replace(/-/g,'+').replace(/_/g,'/');
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const parsed=JSON.parse(new TextDecoder().decode(bytes));
  if(![2,3,4].includes(parsed.version))throw new Error('Эта версия сценария не поддерживается.');
  return normalizeState(parsed);
}
try{const shared=decodeHash(location.hash);if(shared){state=shared;bootMessage='Загружен сценарий из ссылки.';}}catch{bootMessage='Сценарий в ссылке не удалось прочитать. Загружены локальные настройки.';}
let customs=readStorage(SCENARIOS,[]);
if(!Array.isArray(customs))customs=[];
customs=customs.filter(x=>x&&typeof x.name==='string'&&typeof x.id==='string').slice(0,20).map(x=>({id:x.id.slice(0,80),name:x.name.slice(0,60),state:normalizeState(x.state)}));
const preferences=readStorage('auto-tco-ui-v4',{});
let selectedCar=CAR_INFO.some(c=>c.id===preferences?.selectedCar)?preferences.selectedCar:'azimut',annualCar='azimut',results=[];
let activeScenario=typeof preferences?.activeScenario==='string'?preferences.activeScenario:'';
if(location.hash.startsWith('#s='))activeScenario='';
let metric=['annual','tco','monthly'].includes(preferences?.metric)?preferences.metric:'annual';
let sortMode=['cost','name','catalogue'].includes(preferences?.sortMode)?preferences.sortMode:'cost';
let compareBase=preferences?.grantaBaselineAdded&&CAR_INFO.some(c=>c.id===preferences.compareBase)?preferences.compareBase:'granta',chartCar='';
let wizardStep=1,undoSnapshot=null;
const opened=new Set(Array.isArray(preferences?.opened)?preferences.opened:[]),drafts=new Map();
const COLUMNS={annual:['В год, ₽',r=>r.annual],tco:['За весь срок, ₽',r=>r.tco],delta:['Разница, ₽',r=>r[metric]-(results.find(x=>x.id===compareBase)?.[metric]??0)],purchase:['Покупка и допы, ₽',r=>r.categories.purchase+r.categories.equipment],operating:['Эксплуатация, ₽',r=>r.operating],finance:['Кредит: проценты и комиссии, ₽',r=>r.categories.finance],sale:['Оценка продажи, ₽',r=>r.saleNet],monthly:['Средняя стоимость в месяц, ₽',r=>r.monthly],perKm:['На км, ₽',r=>r.perKm]};
let columns=new Set(Array.isArray(preferences?.columns)?preferences.columns.filter(k=>COLUMNS[k]):['annual','tco','delta']);
if(!columns.size)columns=new Set(['annual']);
const nameOf=id=>displayName(CAR_INFO.find(c=>c.id===id),state.cars[id]);
const currentScenario=()=>[...builtInScenarios(),...customs].find(s=>s.id===activeScenario);
const sameState=(a,b)=>JSON.stringify(normalizeState(a))===JSON.stringify(normalizeState(b));
function savePreferences(){try{localStorage.setItem('auto-tco-ui-v4',JSON.stringify({selectedCar,activeScenario,metric,sortMode,compareBase,grantaBaselineAdded:true,columns:[...columns],opened:[...opened]}));}catch{}}
function rememberUndo(message){undoSnapshot={state:structuredClone(state),customs:structuredClone(customs),activeScenario};$('undo-message').textContent=message;$('undo-bar').hidden=false;}
const signed=value=>(value>0?'+':value<0?'−':'')+rub(Math.abs(value));
function fieldValue(field,value){if(field?.type==='boolean'||typeof value==='boolean')return value?'Да':'Нет';if(field?.type==='select')return field.options.find(([key])=>key===value)?.[1]??value;return typeof value==='number'?compact.format(value)+(field?.unit?' '+field.unit:''):value;}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
function persist(){savePreferences();clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE,JSON.stringify(state));$('save-status').textContent='Рабочий черновик сохранён в этом браузере. Именованные сценарии обновляются кнопкой «Сохранить изменения».';}catch{storageAvailable=false;$('save-status').textContent='Хранилище недоступно — сохраните ссылку на сценарий';}},180);}
function fieldID(scope,key,kind){return scope+'-'+key+'-'+kind;}
function fieldHTML(field,scope){
  if(scope==='custom'){
    const help={serviceLate:'Условный средний бюджет одного ТО с шестого года. Задайте оценку для своей модели.',serviceKm:'Задайте интервал из регламента выбранного автомобиля.',bargain:'Применяется один раз к заданной вами цене до торга — автоматической или ручной.'}[field.key];
    if(help)field={...field,help};
  }
  const value=scope==='general'?state.general[field.key]:state.cars[scope][field.key];
  const id=fieldID(scope,field.key,'value');
  const common='data-scope="'+scope+'" data-key="'+field.key+'"';
  const evidence=parameterEvidence(scope,field.key);
  const source='<a class="basis evidence-'+evidence.status+'" href="./audit.html#'+scope+'" title="'+escape(evidence.detail)+'">Исходное: '+escape(evidence.label)+' ↗</a>';
  const reset='<button type="button" class="field-reset" data-reset-field="'+field.key+'" data-scope="'+scope+'" aria-label="Сбросить: '+escape(field.label)+'" title="Исходное значение">↺</button>';
  const help=field.help?'<p class="field-help" id="'+id+'-help">'+escape(field.help)+'</p>':'';
  const described=field.help?' aria-describedby="'+id+'-help"':'';
  if(field.type==='text')return '<div class="field text-field" data-field="'+scope+'.'+field.key+'"><div class="field-heading"><label for="'+id+'">'+escape(field.label)+'</label>'+reset+'</div><input type="text" id="'+id+'" '+common+' maxlength="'+field.maxLength+'" value="'+escape(value)+'"'+described+'>'+help+'</div>';
  if(field.type==='boolean')return '<div class="field boolean" data-field="'+scope+'.'+field.key+'"><label class="toggle-label" for="'+id+'"><input type="checkbox" id="'+id+'" '+common+(value?' checked':'')+described+'><span>'+escape(field.label)+'</span></label>'+reset+help+'</div>';
  if(field.type==='select')return '<div class="field select-field" data-field="'+scope+'.'+field.key+'"><div class="field-heading"><label for="'+id+'">'+escape(field.label)+'</label>'+reset+'</div><select id="'+id+'" '+common+described+'>'+field.options.map(([k,label])=>'<option value="'+k+'"'+(value===k?' selected':'')+'>'+escape(label)+'</option>').join('')+'</select>'+help+'</div>';
  return '<div class="field" data-field="'+scope+'.'+field.key+'"><div class="field-heading"><label for="'+id+'">'+escape(field.label)+'</label>'+reset+'</div><div class="field-value"><input type="number" inputmode="decimal" step="any" min="'+field.min+'" max="'+field.max+'" id="'+id+'" '+common+' value="'+Number(value.toFixed(2))+'" aria-describedby="'+id+'-error'+(field.help?' '+id+'-help':'')+'"><span>'+escape(field.unit)+'</span></div><input class="range" type="range" min="'+field.min+'" max="'+field.max+'" step="'+field.step+'" value="'+value+'" id="'+fieldID(scope,field.key,'range')+'" '+common+' aria-label="'+escape(field.label)+' — ползунок"'+described+'><p class="field-error" id="'+id+'-error" role="status"></p>'+help+'<div class="field-meta">'+source+'</div></div>';
}
function groupHTML(group,scope){const fields=group.fields.filter(f=>(!f.customOnly||scope==='custom')&&(!f.models||f.models.includes(scope)));const key=(scope==='general'?'general':'car')+'-'+group.id;return '<details class="settings-group" data-group="'+key+'"'+(opened.has(key)?' open':'')+'><summary>'+escape(group.title)+'<span class="group-count">'+fields.length+'</span></summary><div class="fields-grid">'+fields.map(f=>fieldHTML(f,scope)).join('')+'</div></details>';}
function renderGeneral(){
  $('main-controls').innerHTML=GENERAL_GROUPS[0].fields.slice(0,3).map(f=>fieldHTML(f,'general')).join('');
  $('quick-casco').innerHTML=fieldHTML(FIELDS.general.cascoEnabled,'general');
  $('quick-maintenance-fields').innerHTML=fieldHTML(FIELDS.general.serviceIntervalShift,'general');
  $('general-details').innerHTML=groupHTML({id:'resale',title:'Общий прогноз перепродажи',fields:[FIELDS.general.resaleShift]},'general')+GENERAL_GROUPS.slice(1).map(group=>groupHTML(group,'general')).join('');
}
function renderCarChoice(){
  $('car-choices').innerHTML=CAR_INFO.map(c=>'<label class="car-choice" style="--car:'+c.color+'"><input type="checkbox" data-enabled="'+c.id+'"'+(state.cars[c.id].enabled?' checked':'')+'><span data-car-name="'+c.id+'">'+escape(displayName(c,state.cars[c.id]))+'</span></label>').join('');
  $('car-tabs').innerHTML=CAR_INFO.map(c=>'<button type="button" role="tab" id="tab-'+c.id+'" aria-controls="car-settings" aria-selected="'+(c.id===selectedCar)+'" tabindex="'+(c.id===selectedCar?'0':'-1')+'" data-car-tab="'+c.id+'" style="--car:'+c.color+'"><span data-car-name="'+c.id+'">'+escape(displayName(c,state.cars[c.id]))+'</span></button>').join('');
}
function renderCarEditor(){
  const info=CAR_INFO.find(c=>c.id===selectedCar);
  $('car-settings').setAttribute('aria-labelledby','tab-'+selectedCar);
  $('car-editor-title').textContent=displayName(info,state.cars[info.id])+' · '+info.trim;
  $('car-note').textContent=info.note;
  const basic=['price','fuel','serviceEarly','overrideCasco','cascoFirst','resaleMode','manualSale','individualShift'];
  const customKeys=['name','price','fuel','serviceEarly','overrideCasco','cascoFirst','referencePrice','resaleMode','manualSale','retention3','retention5','retention8'];
  const used=new Set(info.custom?customKeys:basic);
  $('custom-wizard').hidden=!info.custom;
  if(info.custom){
    $('custom-wizard').innerHTML='<div class="wizard-steps" role="group" aria-label="Шаги добавления">'+['Название','Расходы','Перепродажа'].map((label,i)=>'<button type="button" data-step="'+(i+1)+'" aria-pressed="'+(wizardStep===i+1)+'">'+(i+1)+'. '+label+'</button>').join('')+'</div><div data-stage="1"><div class="fields-grid">'+fieldHTML(FIELDS.car.name,'custom')+'</div><div class="template-tools"><label for="copy-from">Взять за основу текущие параметры модели</label><select id="copy-from">'+CAR_INFO.filter(c=>!c.custom).map(c=>'<option value="'+c.id+'">'+escape(c.name)+'</option>').join('')+'</select><button type="button" id="copy-car">Скопировать параметры</button></div><p class="table-note">Начальные числа условные. Скопированные параметры также стоит уточнить для своей машины.</p></div><div data-stage="2"><div class="fields-grid">'+['price','fuel','serviceEarly','overrideCasco','cascoFirst'].map(k=>fieldHTML(FIELDS.car[k],'custom')).join('')+'</div></div><div data-stage="3"><div class="fields-grid">'+['resaleMode','referencePrice','retention3','retention5','retention8','manualSale'].map(k=>fieldHTML(FIELDS.car[k],'custom')).join('')+'</div><p class="table-note">Опорные цены — до торга. Оценка обновляется при изменении срока. Остальные параметры доступны ниже.</p></div><div class="wizard-actions"><button type="button" id="wizard-back">Назад</button><button type="button" id="wizard-next">Далее</button><button type="button" id="wizard-add">'+(state.cars.custom.enabled?'Применить и сравнить':'Добавить в сравнение')+'</button></div>';
  }else $('custom-wizard').innerHTML='';
  const basics=info.custom?'':'<div class="basic-settings"><h4>Основные расходы</h4><div class="fields-grid">'+basic.map(k=>fieldHTML(FIELDS.car[k],selectedCar)).join('')+'</div></div>';
  const groups=CAR_GROUPS.filter(g=>!g.customOnly).map(g=>({...g,fields:g.fields.filter(f=>!used.has(f.key)&&(!f.customOnly||info.custom))})).filter(g=>g.fields.length);
  $('car-groups').innerHTML=basics+'<h4 class="advanced-title">Подробные параметры</h4>'+groups.map(g=>groupHTML(g,selectedCar)).join('');
  syncFields();
}
const financeKeys=new Set(GENERAL_GROUPS.find(g=>g.id==='finance').fields.map(f=>f.key));
const loanKeys=new Set(['downPayment','loanRate','loanYears','loanFees']);
const extraKeys=new Set(['parking','wash','tolls','other','oneOff','oneOffYear']);
function disabled(scope,key){
  if(!state.general.cascoEnabled&&(CASCO_KEYS.includes(key)||key==='overrideCasco'))return true;
  if(scope==='general'){
    if(financeKeys.has(key)&&key!=='financial'&&!state.general.financial)return true;
    if(loanKeys.has(key)&&!state.general.loanEnabled)return true;
    if(key==='returnRate'&&!state.general.capitalEnabled)return true;
  }else{
    const car=state.cars[scope];
    if(CASCO_KEYS.includes(key)&&!car.overrideCasco)return true;
    if(extraKeys.has(key)&&!car.overrideExtras)return true;
    if((loanKeys.has(key)||key==='overrideLoan')&&(!state.general.financial||!state.general.loanEnabled))return true;
    if(loanKeys.has(key)&&!car.overrideLoan)return true;
    if(key==='manualSale'&&car.resaleMode!=='manual')return true;
    if(['referencePrice','individualShift','mileagePenalty','tailDepreciation','retention3','retention5','retention8'].includes(key)&&car.resaleMode==='manual')return true;
  }
  return false;
}
function syncFields(){
  document.querySelectorAll('input[data-scope],select[data-scope]').forEach(input=>{
    const scope=input.dataset.scope,key=input.dataset.key,value=scope==='general'?state.general[key]:state.cars[scope][key];
    if(input.type==='checkbox')input.checked=!!value;
    else if(document.activeElement!==input&&!drafts.has(scope+'.'+key))input.value=typeof value==='number'&&input.type==='number'?String(Number(value.toFixed(2))):String(value);
    input.disabled=disabled(scope,key);
    if(input.disabled&&drafts.has(scope+'.'+key)){drafts.delete(scope+'.'+key);input.value=String(value);input.removeAttribute('aria-invalid');const error=$(input.id+'-error');if(error)error.textContent='';}
    const field=input.closest('.field');if(field){field.hidden=input.disabled;field.classList.toggle('disabled',input.disabled);}
  });
  document.querySelectorAll('[data-years]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.years)===state.general.years)));
  document.querySelectorAll('[data-enabled]').forEach(input=>input.checked=state.cars[input.dataset.enabled].enabled);
  document.querySelectorAll('[data-car-name]').forEach(el=>{const info=CAR_INFO.find(c=>c.id===el.dataset.carName);el.textContent=displayName(info,state.cars[info.id]);});
  const info=CAR_INFO.find(c=>c.id===selectedCar);$('car-editor-title').textContent=displayName(info,state.cars[info.id])+' · '+info.trim;
  const shift=state.general.serviceIntervalShift,intervals=maintenanceIntervals(state.cars[selectedCar],state.general);
  $('service-adjustment-label').textContent=shift===0?'Исходный график':(shift>0?'+':'')+compact.format(shift)+'% · '+(shift>0?'реже':'чаще');
  const intervalText=(km,months)=>num.format(km)+' км / '+compact.format(months)+' мес.';
  $('service-schedule-note').textContent='График в расчёте: первое ТО — '+intervalText(intervals.firstKm,intervals.firstMonths)+'; далее — '+intervalText(intervals.km,intervals.months)+'.'+(shift?' Общая поправка к интервалам: '+(shift>0?'+':'')+compact.format(shift)+'%.':'')+' Что наступит раньше. Дополнительное нулевое ТО учитывается отдельно.';
  document.querySelectorAll('.field[data-field]').forEach(el=>{
    const [scope,key]=el.dataset.field.split('.'),current=scope==='general'?state.general:state.cars[scope],base=scope==='general'?defaults.general:defaults.cars[scope],field=(scope==='general'?FIELDS.general:FIELDS.car)[key];
    const changed=current[key]!==base[key];el.classList.toggle('is-changed',changed);
    let note=el.querySelector('.field-change');if(!note){note=document.createElement('p');note.className='field-change';el.append(note);}
    note.textContent=changed?'Было: '+fieldValue(field,base[key])+' → '+fieldValue(field,current[key]):scope==='custom'&&field.type==='number'?'Условное начальное значение':'';
    const reset=el.querySelector('[data-reset-field]');if(reset)reset.disabled=!changed&&!drafts.has(scope+'.'+key);
  });
  document.querySelectorAll('[data-group="car-loanOverrides"]').forEach(el=>el.hidden=!state.general.financial||!state.general.loanEnabled);
  document.querySelectorAll('[data-stage]').forEach(el=>el.hidden=Number(el.dataset.stage)!==wizardStep);
  if($('wizard-back')){$('wizard-back').hidden=wizardStep===1;$('wizard-next').hidden=wizardStep===3;$('wizard-add').hidden=wizardStep!==3;}
  document.querySelectorAll('[data-step]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.step)===wizardStep)));
  $('selection-count').textContent=CAR_INFO.filter(c=>state.cars[c.id].enabled).length+' из '+CAR_INFO.length;
}
function renderScenarios(){
  $('scenario-select').innerHTML='<option value="">Рабочий черновик</option><optgroup label="Готовые сценарии">'+builtInScenarios().map(s=>'<option value="'+s.id+'">'+escape(s.name)+'</option>').join('')+'</optgroup>'+(customs.length?'<optgroup label="Мои сценарии">'+customs.map(s=>'<option value="'+escape(s.id)+'">'+escape(s.name)+'</option>').join('')+'</optgroup>':'');
  $('scenario-select').value=currentScenario()?activeScenario:'';
  updateScenarioStatus();
}
function updateScenarioStatus(){const current=currentScenario(),dirty=!!current&&!sameState(state,current.state),owned=customs.some(s=>s.id===activeScenario);$('scenario-label').textContent=current?.name??'Рабочий черновик';$('scenario-dirty').textContent=drafts.size?'Есть незавершённый ввод':dirty?'Есть несохранённые изменения':'';$('save-scenario').disabled=!owned||(!dirty&&!drafts.size);$('delete-scenario').disabled=!owned;}
function renderChanges(){
  const changes=[];
  for(const scope of ['general',...CAR_INFO.map(c=>c.id)]){const target=scope==='general'?state.general:state.cars[scope],base=scope==='general'?defaults.general:defaults.cars[scope];for(const [key,value] of Object.entries(target))if(value!==base[key])changes.push({scope,key,value,before:base[key],field:(scope==='general'?FIELDS.general:FIELDS.car)[key]});}
  $('change-count').textContent=changes.length?'Изменено параметров: '+changes.length:'';$('changes-total').textContent=changes.length;
  const local=changes.filter(c=>c.scope===selectedCar).length;$('car-change-count').textContent=local?'Изменено параметров: '+local:'Исходные параметры';
  $('changes-list').innerHTML=changes.length?changes.map(c=>'<div class="change-row"><div><strong>'+escape(c.scope==='general'?'Общие условия':nameOf(c.scope))+'</strong><span>'+escape(c.field?.label??c.key)+': '+escape(fieldValue(c.field,c.before))+' → '+escape(fieldValue(c.field,c.value))+'</span></div><button type="button" class="quiet-button" data-reset-field="'+c.key+'" data-scope="'+c.scope+'">Вернуть исходное</button></div>').join(''):'<p class="table-note">Все параметры соответствуют исходному расчёту.</p>';
}
function moneyDescription(){return state.general.financial&&state.general.moneyMode==='nominal'?'Будущие номинальные рубли':'Покупательная способность рублей 2026 года';}
function renderResults(){
  $('review-notice').hidden=!state.needsReview;
  results=calculate(state);
  if(!results.some(r=>r.id===compareBase))compareBase=results[0]?.id??'azimut';
  if(chartCar&&!results.some(r=>r.id===chartCar))chartCar='';
  if(sortMode==='cost')results.sort((a,b)=>a[metric]-b[metric]);else if(sortMode==='name')results.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  const g=state.general;
  $('period-label').textContent=yearLabel(g.years)+' · '+num.format(g.km*g.years)+' км · '+moneyDescription();
  $('currency-label').textContent=moneyDescription();
  $('print-assumptions').textContent='Срок '+yearLabel(g.years)+', пробег '+num.format(g.km)+' км/год, бензин '+g.fuelPrice+' ₽/л. '+moneyDescription()+'.';
  $('result-empty').hidden=results.length>0;
  $('result-content').hidden=results.length===0;
  const base=results.find(r=>r.id===compareBase),metricLabel=metric==='annual'?'в год':metric==='monthly'?'в месяц':'за весь срок';
  $('compare-base').innerHTML=results.map(r=>'<option value="'+r.id+'"'+(r.id===compareBase?' selected':'')+'>'+escape(r.name)+'</option>').join('');$('sort-results').value=sortMode;
  document.querySelectorAll('[data-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.metric===metric)));
  $('metric-explanation').textContent=(metric==='tco'?'Стоимость ':'Средняя стоимость ')+metricLabel+' включает потерю цены при перепродаже и резервы на ремонт. Это не платёж по кредиту. Разница показана относительно '+(base?.name??'выбранной машины')+'.';
  $('cards').innerHTML=results.map(r=>'<article class="car-card" style="--car:'+r.color+'"><h3>'+escape(r.name)+'</h3><p class="trim">'+escape(r.trim)+'</p><div class="total">'+(metric==='tco'?millions(r.tco):num.format(r[metric]/1000))+' <small>'+(metric==='tco'?'млн ₽':'тыс. ₽')+'</small></div><div class="annual">'+(metric==='tco'?'Стоимость ':'Средняя стоимость ')+metricLabel+'</div><div class="comparison-delta">'+(r.id===compareBase?'База сравнения':signed(r[metric]-base[metric])+' '+metricLabel)+'</div><div class="sale-tag">Оценка продажи: '+millions(r.saleNet)+' млн ₽</div><button class="edit-car" type="button" data-edit-car="'+r.id+'">Настроить →</button></article>').join('');
  $('column-choices').innerHTML=Object.entries(COLUMNS).map(([key,[label]])=>'<label><input type="checkbox" data-column="'+key+'"'+(columns.has(key)?' checked':'')+'>'+escape(label)+'</label>').join('');
  $('comparison-head').innerHTML='<tr><th scope="col">Автомобиль</th>'+[...columns].map(key=>'<th scope="col">'+escape(key==='delta'?'Разница '+metricLabel+', ₽':COLUMNS[key][0])+'</th>').join('')+'</tr>';
  $('comparison-rows').innerHTML=results.map(r=>'<tr><th scope="row"><span class="dot" style="background:'+r.color+'"></span>'+escape(r.name)+'</th>'+[...columns].map(key=>'<td>'+((COLUMNS[key][1](r)===null)?'—':key==='delta'?signed(COLUMNS[key][1](r)):rub(COLUMNS[key][1](r)))+'</td>').join('')+'</tr>').join('');
  $('breakdown-head').innerHTML='<tr><th scope="col">Статья расходов</th>'+results.map(r=>'<th scope="col">'+escape(r.name)+'</th>').join('')+'</tr>';
  $('breakdown-rows').innerHTML=Object.entries(CATEGORY_LABELS).map(([key,label])=>'<tr><th scope="row">'+label+'</th>'+results.map(r=>'<td>'+rub(r.categories[key])+'</td>').join('')+'</tr>').join('')+'<tr><th scope="row">Выручка от продажи до комиссии</th>'+results.map(r=>'<td>−'+rub(r.sale)+'</td>').join('')+'</tr><tr class="table-total"><th scope="row">Стоимость владения</th>'+results.map(r=>'<td>'+rub(r.tco)+'</td>').join('')+'</tr>';
  $('finance-output').hidden=!(g.financial&&(g.loanEnabled||g.capitalEnabled))||!results.length;
  $('finance-rows').innerHTML=results.map(r=>'<tr><th scope="row">'+escape(r.name)+'</th><td>'+rub(r.loanPayment)+'</td><td>'+rub(r.loanInterest)+'</td><td>'+rub(r.loanRemaining)+'</td><td>'+(g.capitalEnabled?rub(r.capital):'—')+'</td></tr>').join('');
  if(!results.some(r=>r.id===annualCar))annualCar=results[0]?.id??'azimut';
  $('annual-car').innerHTML=results.map(r=>'<option value="'+r.id+'"'+(r.id===annualCar?' selected':'')+'>'+escape(r.name)+'</option>').join('');
  renderAnnual();renderChart();
  const notices=[];
  if(state.cars.granta.enabled)notices.push('Granta с механикой и чёрным салоном — ориентир расходов; вашим условиям покупки она не соответствует.');
  if(!g.cascoEnabled)notices.push('Каско отключено для всех автомобилей. Сохранённые общие и индивидуальные тарифы не применяются.');
  if(g.serviceIntervalShift)notices.push('Интервалы полного ТО изменены на '+(g.serviceIntervalShift>0?'+':'')+compact.format(g.serviceIntervalShift)+'% по пробегу и времени. Это сценарий расходов; исходный регламент остаётся в параметрах машин.');
  if(state.cars.custom.enabled)notices.push('«'+displayName(CAR_INFO.at(-1),state.cars.custom)+'» рассчитан по вашим параметрам. Начальные значения условные, рыночные данные не загружаются.');
  if(state.cars.custom.enabled&&state.cars.custom.resaleMode==='auto'&&(state.cars.custom.retention5>state.cars.custom.retention3||state.cars.custom.retention8>state.cars.custom.retention5))notices.push('У вашего автомобиля задан рост остаточной стоимости с возрастом — проверьте доли цены через 3, 5 и 8 лет.');
  if(g.years!==5&&g.years!==8)notices.push('Прогноз на этот срок рассчитан по возрастным ориентирам и интерполяции между ними; после восьми лет применяется заданное удешевление.');
  if(CAR_INFO.some(c=>state.cars[c.id].enabled&&state.cars[c.id].resaleMode==='manual'))notices.push('Ручная цена продажи не реагирует на срок, пробег и общую поправку. Торг и расходы на продажу применяются.');
  if(g.financial&&g.loanEnabled)notices.push('Непогашенный кредит полностью закрывается при продаже; остаток долга уже включён в расчёт.');
  if(!g.financial)notices.push('Финансовый блок выключен: инфляция, рост цен, кредит и альтернативная доходность не учитываются.');
  $('scenario-notices').textContent=notices.join(' ');
  const sorted=[...results].sort((a,b)=>a.tco-b.tco);
  $('current-conclusion').textContent=sorted.length?'В этом сценарии наименьшие расчётные расходы у '+sorted[0].name+': '+millions(sorted[0].tco)+' млн ₽'+(sorted.length>1?'. Разница со следующим вариантом — '+rub(sorted[1].tco-sorted[0].tco)+'.':'.'):'Выберите хотя бы один автомобиль для сравнения.';
  renderLiveSummary();renderChanges();updateScenarioStatus();
}
function renderLiveSummary(){
  const info=CAR_INFO.find(c=>c.id===selectedCar),r=calculateCar(info,state.cars[selectedCar],state.general),baseline=currentScenario()?.state??defaults,previous=calculateCar(info,baseline.cars[selectedCar],baseline.general),difference=r.annual-previous.annual;
  const note=state.cars[selectedCar].enabled?'Участвует в сравнении':'Предпросмотр · не включён в сравнение';
  $('live-summary').innerHTML='<p class="eyebrow">Результат настройки</p><h3>'+escape(r.name)+'</h3><strong class="live-value">'+num.format(r.annual/1000)+' тыс. ₽/год</strong><p class="live-delta">'+signed(difference)+' в год '+(currentScenario()?'к открытому сценарию':'к исходным параметрам')+'</p><dl><dt>За '+yearLabel(state.general.years)+'</dt><dd>'+rub(r.tco)+'</dd><dt>Средняя стоимость в месяц</dt><dd>'+rub(r.monthly)+'</dd><dt>Оценка продажи</dt><dd>'+rub(r.saleNet)+'</dd></dl><p class="table-note">'+note+'. Включены потеря цены и резервы.</p><a href="#results">К сравнению ↑</a>';
  $('mobile-dock').innerHTML='<div><span>'+escape(r.name)+'</span><strong>'+num.format(r.annual/1000)+' тыс. ₽/год</strong><small>'+signed(difference)+' к '+(currentScenario()?'сценарию':'исходному')+(state.cars[selectedCar].enabled?'':' · предпросмотр')+'</small></div><a href="#results">Сравнить ↑</a>';
}
function renderAnnual(){
  const r=results.find(r=>r.id===annualCar);
  $('annual-rows').innerHTML=r?r.rows.map(row=>{
    const c=row.categories;
    return '<tr><th scope="row">'+(row.year===0?'Покупка':'Год '+row.year)+'</th><td>'+rub(c.purchase+c.equipment)+'</td><td>'+rub(c.fuel)+'</td><td>'+rub(c.service)+'<small>'+row.serviceCount+' ТО</small></td><td>'+rub(c.repairs+c.tires)+'</td><td>'+rub(c.casco+c.osago+c.tax)+'</td><td>'+rub(c.parking+c.wash+c.tolls+c.other+c.saleCosts)+'</td><td>'+rub(c.finance)+'</td><td>'+rub(row.sale)+'</td><td class="table-total">'+rub(row.net)+'</td></tr>';
  }).join(''):'';
}
function renderChart(){
  if(!results.length){$('chart').innerHTML='';$('chart-legend').innerHTML='';return;}
  const width=Math.max(260,Math.round($('chart').getBoundingClientRect().width)),height=270,left=46,right=15,top=18,bottom=34;
  const max=Math.max(1,...results.flatMap(r=>r.rows.map(row=>row.cumulative)))*1.06;
  const x=year=>left+year/state.general.years*(width-left-right);
  const y=value=>height-bottom-value/max*(height-top-bottom);
  let content='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">Накопленные расходы до вычета продажи</title><desc id="chart-description">Линия каждой машины показывает суммарные расходы от покупки до выбранного года. Точные значения доступны в таблице по годам.</desc>';
  for(let i=0;i<=4;i++){const v=max*i/4,yy=y(v);content+='<line x1="'+left+'" y1="'+yy+'" x2="'+(width-right)+'" y2="'+yy+'" stroke="#d9ded4"/><text x="'+(left-10)+'" y="'+(yy+4)+'" text-anchor="end">'+compact.format(v/1000000)+'</text>';}
  const tickStep=Math.max(1,Math.ceil(state.general.years/(width<500?4:10)));
  for(let year=0;year<=state.general.years;year++){if(year%tickStep&&year!==state.general.years)continue;content+='<text x="'+x(year)+'" y="'+(height-12)+'" text-anchor="middle">'+year+'</text>';}
  for(const r of [...results].sort((a,b)=>Number(a.id===chartCar)-Number(b.id===chartCar))){const opacity=chartCar&&r.id!==chartCar?'.15':'1';content+='<g opacity="'+opacity+'"><polyline fill="none" stroke="'+r.color+'" stroke-width="'+(r.id===chartCar?'4':'2.5')+'" stroke-linejoin="round" points="'+r.rows.map(row=>x(row.year)+','+y(row.cumulative)).join(' ')+'"/>';for(const row of r.rows)content+='<circle cx="'+x(row.year)+'" cy="'+y(row.cumulative)+'" r="3" fill="'+r.color+'"><title>'+escape(r.name)+', год '+row.year+': '+rub(row.cumulative)+'</title></circle>';content+='</g>';}
  content+='</svg>';$('chart').innerHTML=content;
  $('chart-legend').innerHTML='<button type="button" data-chart="" aria-pressed="'+(!chartCar)+'">Все</button>'+results.map(r=>'<button type="button" data-chart="'+r.id+'" aria-pressed="'+(chartCar===r.id)+'"><i class="dot" style="background:'+r.color+'"></i>'+escape(r.name)+'</button>').join('');
  $('chart-car').innerHTML='<option value="">Все автомобили</option>'+results.map(r=>'<option value="'+r.id+'"'+(r.id===chartCar?' selected':'')+'>'+escape(r.name)+'</option>').join('');
}
function refresh({controls=false,changed=true}={}){
  if(controls){renderGeneral();renderCarChoice();renderCarEditor();}
  syncFields();renderResults();
  if(changed){if(location.hash.startsWith('#s='))history.replaceState(null,'',location.pathname+location.search);persist();}
}
function changeField(input){
  const {scope,key}=input.dataset;
  const target=scope==='general'?state.general:state.cars[scope];
  const field=(scope==='general'?FIELDS.general:FIELDS.car)[key];
  if(!field||!target)return;
  if(input.type==='number'&&input.value==='')return;
  const value=input.type==='checkbox'?input.checked:field.type==='number'?Number(input.value):input.value;
  const next=coerce(field,value,target[key]);
  if(input.type==='range'){drafts.delete(scope+'.'+key);const number=$(fieldID(scope,key,'value'));if(number){number.removeAttribute('aria-invalid');$(number.id+'-error').textContent='';}}
  if(scope!=='general'&&key==='overrideCasco'&&next&&!target.overrideCasco)for(const k of CASCO_KEYS)target[k]=state.general[k];
  if(scope!=='general'&&key==='overrideExtras'&&next&&!target.overrideExtras)for(const k of extraKeys)target[k]=state.general[k];
  if(scope!=='general'&&key==='overrideLoan'&&next&&!target.overrideLoan)for(const k of loanKeys)target[k]=state.general[k];
  target[key]=next;
  if(input.type==='number'&&Number(input.value)!==next)input.value=String(next);
  refresh();
}
function commitNumber(input){
  const {scope,key}=input.dataset,id=scope+'.'+key;if(!drafts.has(id))return true;
  const field=(scope==='general'?FIELDS.general:FIELDS.car)[key],value=input.valueAsNumber;
  const error=$(input.id+'-error');
  if(input.value===''||!Number.isFinite(value)||value<field.min||value>field.max){input.setAttribute('aria-invalid','true');if(error)error.textContent='Введите число от '+num.format(field.min)+' до '+num.format(field.max)+'. В расчёте пока прежнее значение.';return false;}
  drafts.delete(id);input.removeAttribute('aria-invalid');if(error)error.textContent='';changeField(input);return true;
}
function commitAll(){for(const id of [...drafts.keys()]){const [scope,key]=id.split('.'),input=$(fieldID(scope,key,'value'));if(input&&!commitNumber(input)){const stage=input.closest('[data-stage]');if(stage){wizardStep=Number(stage.dataset.stage);syncFields();}input.closest('details')?.setAttribute('open','');input.focus();toast('Проверьте выделенное числовое поле.');return false;}}return true;}
document.addEventListener('input',event=>{const input=event.target;if(!input.matches('input[data-scope]'))return;if(input.type==='number'){drafts.set(input.dataset.scope+'.'+input.dataset.key,input.value);const error=$(input.id+'-error');if(error)error.textContent='Enter или выход из поля — применить.';input.removeAttribute('aria-invalid');input.closest('.field').querySelector('[data-reset-field]').disabled=false;updateScenarioStatus();return;}if(input.type!=='checkbox')changeField(input);});
document.addEventListener('change',event=>{
  if(event.target.matches('select[data-scope],input[type="checkbox"][data-scope]'))changeField(event.target);
  if(event.target.matches('[data-enabled]')){state.cars[event.target.dataset.enabled].enabled=event.target.checked;refresh();}
});
document.addEventListener('focusout',event=>{if(event.target.matches('input[type="number"][data-scope]'))commitNumber(event.target);});
document.addEventListener('keydown',event=>{const input=event.target;if(!input.matches('input[type="number"][data-scope]'))return;if(event.key==='Enter'){event.preventDefault();if(commitNumber(input))input.blur();}if(event.key==='Escape'){drafts.delete(input.dataset.scope+'.'+input.dataset.key);input.value=(input.dataset.scope==='general'?state.general:state.cars[input.dataset.scope])[input.dataset.key];input.removeAttribute('aria-invalid');$(input.id+'-error').textContent='';input.blur();syncFields();updateScenarioStatus();}});
document.addEventListener('toggle',event=>{const el=event.target;if(el.matches('details[data-group]')&&el.isConnected){el.open?opened.add(el.dataset.group):opened.delete(el.dataset.group);savePreferences();}},true);
function editCar(id,scroll=true){if(!commitAll())return;selectedCar=id;renderCarChoice();renderCarEditor();renderResults();savePreferences();if(scroll)$('car-editor').scrollIntoView({behavior:'smooth'});}
document.addEventListener('click',event=>{
  const reset=event.target.closest('[data-reset-field]');
  if(reset){rememberUndo('Параметр возвращён к исходному.');const {scope,resetField:key}=reset.dataset;drafts.delete(scope+'.'+key);const input=$(fieldID(scope,key,'value'));if(input){input.removeAttribute('aria-invalid');const error=$(input.id+'-error');if(error)error.textContent='';}(scope==='general'?state.general:state.cars[scope])[key]=(scope==='general'?defaults.general:defaults.cars[scope])[key];refresh();}
  const tab=event.target.closest('[data-car-tab]');
  if(tab){editCar(tab.dataset.carTab,false);$('tab-'+selectedCar).focus({preventScroll:true});}
  const edit=event.target.closest('[data-edit-car]');if(edit)editCar(edit.dataset.editCar);
  if(event.target.closest('[data-open-custom]')){wizardStep=1;editCar('custom');$('custom-name-value')?.focus({preventScroll:true});}
  const period=event.target.closest('[data-years]');
  if(period){state.general.years=Number(period.dataset.years);refresh();}
  const metricButton=event.target.closest('[data-metric]');if(metricButton){metric=metricButton.dataset.metric;renderResults();savePreferences();}
  const chartButton=event.target.closest('[data-chart]');if(chartButton){chartCar=chartButton.dataset.chart;renderChart();}
  const step=event.target.closest('[data-step]');if(step&&commitAll()){wizardStep=Number(step.dataset.step);syncFields();}
  if(event.target.closest('#wizard-next')&&commitAll()){wizardStep=Math.min(3,wizardStep+1);syncFields();}
  if(event.target.closest('#wizard-back')&&commitAll()){wizardStep=Math.max(1,wizardStep-1);syncFields();}
  if(event.target.closest('#wizard-add')&&commitAll()){state.cars.custom.enabled=true;refresh();$('results').scrollIntoView({behavior:'smooth'});toast('Ваш автомобиль добавлен в сравнение.');}
  if(event.target.closest('#copy-car')&&commitAll()){
    rememberUndo('Параметры модели скопированы в ваш автомобиль.');const id=$('copy-from').value,info=CAR_INFO.find(c=>c.id===id),source=state.cars[id],name=state.cars.custom.name,enabled=state.cars.custom.enabled;
    Object.assign(state.cars.custom,structuredClone(source),{name:name==='Твой автомобиль'?'Мой '+info.name:name,enabled,serviceUseSchedule:false});
    for(const years of [3,5,8])state.cars.custom['retention'+years]=Math.min(100,resale(info,{...source,resaleMode:'auto'},{...state.general,km:15000,resaleShift:0},years).quote/source.referencePrice*100);
    refresh({controls:true});toast('Скопированы текущие параметры '+info.name+'. Уточните их для своей машины.');
  }
});
$('car-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=CAR_INFO.findIndex(c=>c.id===selectedCar);editCar(CAR_INFO[event.key==='Home'?0:event.key==='End'?CAR_INFO.length-1:(index+(event.key==='ArrowRight'?1:-1)+CAR_INFO.length)%CAR_INFO.length].id,false);$('tab-'+selectedCar).focus({preventScroll:true});});
$('reset-car').addEventListener('click',()=>{rememberUndo('Параметры автомобиля сброшены.');drafts.clear();state.cars[selectedCar]=structuredClone(defaults.cars[selectedCar]);wizardStep=1;refresh({controls:true});});
$('reset-all').addEventListener('click',()=>{rememberUndo('Восстановлен исходный расчёт.');drafts.clear();state=defaultState();activeScenario='base';wizardStep=1;refresh({controls:true});renderScenarios();});
$('apply-reviewed-defaults').addEventListener('click',()=>$('reset-all').click());
$('undo').addEventListener('click',()=>{if(!undoSnapshot)return;const saved=undoSnapshot;state=saved.state;customs=saved.customs;activeScenario=saved.activeScenario;drafts.clear();try{localStorage.setItem(SCENARIOS,JSON.stringify(customs));}catch{toast('Не удалось сохранить отмену сценария в браузере.');}undoSnapshot=null;$('undo-bar').hidden=true;refresh({controls:true});renderScenarios();});
$('dismiss-undo').addEventListener('click',()=>{$('undo-bar').hidden=true;undoSnapshot=null;});
$('annual-car').addEventListener('change',event=>{annualCar=event.target.value;renderAnnual();});
$('scenario-select').addEventListener('change',()=>{const id=$('scenario-select').value,scenario=[...builtInScenarios(),...customs].find(s=>s.id===id);if(!commitAll()){$('scenario-select').value=activeScenario;return;}if(scenario){rememberUndo('Открыт другой сценарий.');activeScenario=id;state=normalizeState(scenario.state);$('scenario-name').value='';refresh({controls:true});renderScenarios();toast('Загружен сценарий «'+scenario.name+'».');}});
function storeScenarios(updated){try{localStorage.setItem(SCENARIOS,JSON.stringify(updated));customs=updated;return true;}catch{toast('Не удалось сохранить. Используйте ссылку на сценарий.');return false;}}
$('save-scenario').addEventListener('click',()=>{if(!commitAll())return;const existing=customs.find(s=>s.id===activeScenario);if(!existing)return;const updated=customs.map(s=>s.id===activeScenario?{...s,state:normalizeState(state)}:s);if(storeScenarios(updated)){renderScenarios();persist();renderLiveSummary();toast('Изменения сохранены в «'+existing.name+'».');}});
$('save-as').addEventListener('click',()=>{
  if(!commitAll())return;let name=$('scenario-name').value.trim().slice(0,60);if(!name){$('scenario-name').focus();toast('Введите название новой копии.');return;}
  if(customs.length>=20){toast('Достигнут лимит: 20 сценариев. Удалите ненужный.');return;}
  const original=name;let suffix=2;while(customs.some(s=>s.name===name))name=original.slice(0,52)+' ('+(suffix++)+')';
  const entry={id:'custom-'+crypto.randomUUID(),name,state:normalizeState(state)};
  if(storeScenarios([...customs,entry])){activeScenario=entry.id;$('scenario-name').value='';renderScenarios();persist();renderLiveSummary();toast('Создан сценарий «'+name+'».');}
});
$('delete-scenario').addEventListener('click',()=>{if(!customs.some(s=>s.id===activeScenario))return;rememberUndo('Сохранённый сценарий удалён.');if(storeScenarios(customs.filter(s=>s.id!==activeScenario))){activeScenario='';renderScenarios();persist();renderLiveSummary();}});
$('sort-results').addEventListener('change',event=>{sortMode=event.target.value;renderResults();savePreferences();});
$('compare-base').addEventListener('change',event=>{compareBase=event.target.value;renderResults();savePreferences();});
$('chart-car').addEventListener('change',event=>{chartCar=event.target.value;renderChart();});
$('column-choices').addEventListener('change',event=>{const key=event.target.dataset.column;if(!key)return;if(!event.target.checked&&columns.size===1){event.target.checked=true;toast('Оставьте хотя бы один показатель.');return;}event.target.checked?columns.add(key):columns.delete(key);renderResults();savePreferences();});
$('share').addEventListener('click',async()=>{
  if(!commitAll())return;
  const bytes=new TextEncoder().encode(JSON.stringify(stateDelta(state)));
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  const hash=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const url=location.origin+location.pathname+'#s='+hash;
  $('share-url').value=url;$('share-box').hidden=false;
  try{await navigator.clipboard.writeText(url);toast('Ссылка на текущий сценарий скопирована.');}catch{$('share-url').focus();$('share-url').select();toast('Ссылка готова — скопируйте её из поля.');}
});
$('close-share').addEventListener('click',()=>{$('share-box').hidden=true;});
function csvCell(value){let text=String(value??'');if(typeof value==='string'&&/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
$('export').addEventListener('click',()=>{
  if(!commitAll())return;
  const g=state.general,rows=[['Стоимость владения автомобилем'],['Дата исходных данных',DATE],['Срок, лет',g.years],['Пробег в год, км',g.km],['Денежные единицы',moneyDescription()],[],['Автомобиль','Покупка и оборудование','Эксплуатация','Финансирование','Продажа после комиссии','Стоимость владения','В год','В месяц','На км']];
  for(const r of results)rows.push([r.name,r.categories.purchase+r.categories.equipment,r.operating,r.categories.finance,r.saleNet,r.tco,r.annual,r.monthly,r.perKm]);
  rows.push([],['Статья',...results.map(r=>r.name)]);for(const [k,label] of Object.entries(CATEGORY_LABELS))rows.push([label,...results.map(r=>r.categories[k])]);
  for(const r of results){rows.push([],[r.name+' — по годам'],['Год',...Object.values(CATEGORY_LABELS),'Выручка от продажи','Чистые расходы года']);for(const row of r.rows)rows.push([row.year,...Object.keys(CATEGORY_LABELS).map(k=>row.categories[k]),row.sale,row.net]);}
  rows.push([],['Настройки общего сценария']);for(const [key,value] of Object.entries(g))rows.push([FIELDS.general[key]?.label??key,value]);
  for(const info of CAR_INFO){rows.push([],[displayName(info,state.cars[info.id])+' — настройки']);for(const [key,value] of Object.entries(state.cars[info.id]))rows.push([FIELDS.car[key]?.label??key,value]);}
  const csv='\uFEFF'+rows.map(row=>row.map(x=>csvCell(typeof x==='number'?Number(x.toFixed(2)):x)).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='auto-tco-'+g.years+'-years.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Таблица и настройки выгружены в CSV.');
});
$('print').addEventListener('click',()=>{if(!commitAll())return;document.querySelectorAll('.report-details').forEach(details=>details.open=true);window.print();});
window.addEventListener('hashchange',()=>{try{const next=decodeHash(location.hash);if(next){rememberUndo('Открыт сценарий из ссылки.');drafts.clear();activeScenario='';state=next;refresh({controls:true});renderScenarios();toast('Загружен сценарий из ссылки.');}}catch{toast('Не удалось прочитать сценарий из ссылки.');}});
function renderReference(){
  const catalogue=CAR_INFO.filter(info=>!info.custom);
  $('source-cards').innerHTML=catalogue.map(info=>'<article><h3>'+escape(info.name)+'</h3><p>'+escape(SOURCES[info.id].text)+'</p><a href="#sources-'+info.id+'">Источники по модели ↓</a></article>').join('');
  const sourceGroup=(id,title,links)=>'<article id="sources-'+id+'"><h3>'+escape(title)+'</h3><ul>'+links.map(([label,url])=>'<li><a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">'+escape(label)+' ↗</a></li>').join('')+'</ul></article>';
  $('source-links').innerHTML=sourceGroup('general','Налоги и оформление',[
    ['ФНС: транспортный налог в Москве, 2026',COMMON_SOURCES.tax],
    ['Закон Москвы о транспортном налоге · ставки',COMMON_SOURCES.taxLaw],
    ['Сообщение Госавтоинспекции о госпошлинах',COMMON_SOURCES.registration]
  ])+catalogue.map(info=>sourceGroup(info.id,info.name,SOURCES[info.id].links)).join('');
  const baselines=[3,5,8].map(years=>{const s=defaultState();s.general.years=years;return calculate(s);});
  $('baseline-rows').innerHTML=catalogue.map((info,i)=>'<tr><th scope="row">'+escape(info.name)+'</th><td>'+millions(defaults.cars[info.id].price)+'</td>'+baselines.map(rows=>'<td>'+millions(rows[i].saleNet)+'</td><td class="table-total">'+millions(rows[i].tco)+'</td>').join('')+'</tr>').join('');
}
if(!activeScenario&&sameState(state,defaults))activeScenario='base';
renderGeneral();renderCarChoice();renderCarEditor();renderScenarios();syncFields();renderResults();renderReference();
let chartWidth=0;new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width!==chartWidth&&width>0){chartWidth=width;renderChart();}}).observe($('chart'));
window.addEventListener('pagehide',()=>{try{localStorage.setItem(STORAGE,JSON.stringify(state));savePreferences();}catch{}});
if(!storageAvailable)$('save-status').textContent='Хранилище недоступно — сохраните ссылку на сценарий';
if(bootMessage)toast(bootMessage);
