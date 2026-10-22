import {CAR_INFO,GENERAL_GROUPS,CAR_GROUPS,FIELDS,defaultState,calculate} from './model.mjs';
import {SOURCES,parameterEvidence} from './sources.mjs';

const state=defaultState();
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const integer=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
const value=(field,v)=>field?.type==='boolean'?(v?'Да':'Нет'):field?.type==='select'?(field.options.find(([key])=>key===v)?.[1]??v):typeof v==='number'?number.format(v)+(field?.unit?' '+field.unit:''):v;
const details={
  granta:'Добавлена как база расходов: максимальная комплектация Клуб ММС с МКПП и чёрным салоном. Расход 8 л/100 км — бюджет против паспортных 6,5; ТО 20 / 25 тыс. ₽, шины 30 / 35 тыс. ₽ за летний / зимний комплект и шиномонтаж 2,5 тыс. ₽ за смену — допущения. ОСАГО, каско и резерв ремонта рассчитаны по той же методике, что у остальных машин. ТО-0 отдельно не заложено; дополнительную замену масла можно добавить. Налог 3 286 ₽ заморожен по ставке Москвы 2026: предусмотренный законом рост до 3 604 ₽ в 2027 и 3 710 ₽ с 2028 автоматически не учтён.',
  azimut:'Исправлен налог: 4 620 ₽ при условном моторе 132 л.с. вместо неаргументированных 150 л.с. Цена, комплектация, интервал ТО, расход, стоимость обслуживания и перепродажа не стали фактами. Пропорциональное цене машины обслуживание сохранено только как согласованная с вами гипотеза.',
  changan:'Исправлен условный интервал 15 000 км / 12 месяцев. Принят более частый график руководства IV поколения: первый визит 5 000 км / 3 месяца, последующие через 10 000 км / 6 месяцев. Первое обслуживание входит в число визитов, отдельно ТО-0 не начисляется. Расхождение с общими материалами требует проверки сервисной книжки конкретного VIN.',
  tenet:'Интервал исправлен с 15 000 на 10 000 км. Вместо 50 220 ₽ за каждый визит используются цены ТО-1…ТО-10: 24 300; 24 300; 36 300; 30 800; 35 200; 59 400; 24 300; 30 800; 36 300; 35 200 ₽. Далее — условные 35 000 ₽ за визит с шестого года. ТО-0 за 16 500 ₽ включено как рекомендованное для сервисных привилегий; его можно убрать. Прайс требует участия дилера в программе.',
  gac:'Интервал исправлен с 15 000 на 10 000 км. Начальное обслуживание 5 000 км / 3 месяца бесплатно; оно не увеличивает денежные расходы. Начиная с 10 000 км / 12 месяцев — платные ТО. Бюджет среднего визита 55 / 68,3 тыс. ₽ остаётся неподтверждённым.',
  jolion:'Добавлен особый срок первого ТО: 10 000 км / 12 месяцев. После него — 15 000 км / 12 месяцев. При исходных 15 000 км в год число визитов может совпасть со старым расчётом, но на другом пробеге график отличается.',
  volga:'ТО-0 исправлено с условных 15 000 до опубликованных 11 880 ₽. Для первых двух обычных ТО опубликованы 19 380 и 29 780 ₽, но они не доказывают среднюю стоимость всех дальнейших визитов. Бюджет 40 / 50 тыс. ₽ сохранён с пометкой «не подтверждён».',
  belgee:'Цена и выбор негибридной версии подтверждены. Штатные колёса Style FWD — 225/65 R17; бюджеты 50 / 60 тыс. ₽ за летний / зимний комплект не привязаны к артикулам. 12 тыс. ₽ за ТО-0 — оценка, хотя сама платная замена масла предусмотрена. Подходящий не-чёрный и не-серый салон не подтверждён.'
};
document.getElementById('model-findings').innerHTML=CAR_INFO.filter(c=>!c.custom).map(c=>{
  const data=state.cars[c.id],source=SOURCES[c.id];
  return '<article class="model-finding"><h3>'+esc(c.name)+' · '+esc(c.trim)+'</h3><div class="facts"><span>Покупка: '+integer.format(data.price)+' ₽'+(c.id==='azimut'?' · гипотеза':'')+'</span><span>Расход для бюджета: '+number.format(data.fuel)+' л/100 км</span><span>Налог: '+integer.format(data.tax)+' ₽/год</span></div><p>'+esc(details[c.id])+'</p><p>'+esc(source.text)+'</p><div class="source-links">'+source.links.map(([title,url])=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(title)+' ↗</a>').join('')+'</div></article>';
}).join('');
const before={azimut:3016370.37037037,changan:4294380,tenet:4562025,gac:5302300,jolion:3188675,volga:4936635.7282872,belgee:2950798};
document.getElementById('impact-rows').innerHTML=calculate(state).map(r=>'<tr><th scope="row">'+esc(r.name)+'</th><td>'+(Object.hasOwn(before,r.id)?number.format(before[r.id]/1e6):'Не сравнивалась')+'</td><td>'+number.format(r.tco/1e6)+'</td><td>'+(Object.hasOwn(before,r.id)?((r.tco-before[r.id])>0?'+':'')+integer.format(r.tco-before[r.id]):'Добавлена')+'</td></tr>').join('');
function register(scope,title,groups,data){
  const seen=new Set();
  const rows=groups.flatMap(g=>g.fields).filter(f=>Object.hasOwn(data,f.key)&&!seen.has(f.key)&&seen.add(f.key)&&(!f.models||f.models.includes(scope))).map(field=>{
    const proof=parameterEvidence(scope,field.key);
    return '<tr data-audit-field="'+scope+'.'+field.key+'"><th scope="row" class="parameter-name">'+esc(field.label)+'</th><td class="parameter-value">'+esc(value(field,data[field.key]))+'</td><td class="parameter-proof"><span class="tag '+proof.status+'">'+esc(proof.label)+'</span><p>'+esc(proof.detail)+'</p>'+(proof.url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(proof.url)+'">Источник ↗</a>':'')+'</td></tr>';
  });
  return '<details id="'+scope+'"><summary>'+esc(title)+' · '+rows.length+' параметров</summary><div class="table-wrap"><table><caption>Исходные значения · 22 октября 2026</caption><thead><tr><th>Параметр</th><th>Значение</th><th>Результат проверки</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div></details>';
}
document.getElementById('parameter-register').innerHTML=register('general','Общие условия',GENERAL_GROUPS,state.general)+CAR_INFO.map(c=>register(c.id,c.name,CAR_GROUPS,state.cars[c.id])).join('');
function reveal(){const target=document.getElementById(location.hash.slice(1));if(target?.tagName==='DETAILS'){target.open=true;target.scrollIntoView();}}
window.addEventListener('hashchange',reveal);reveal();
