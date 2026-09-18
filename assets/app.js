const sampleCSV = `date,reference,account,description,debit,credit
2026-09-01,JV-1001,1100,Bank receipt,50000,0
2026-09-01,JV-1001,4000,Sales revenue,0,50000
2026-09-02,JV-1002,5100,Rent expense,65000,0
2026-09-02,JV-1002,1100,Bank payment,0,65000
2026-09-03,JV-1003,1200,Customer receivable,88500,0
2026-09-03,JV-1003,4000,Consulting revenue,0,88500
2026-09-04,JV-1004,5200,Office supplies,12800,0
2026-09-04,JV-1004,1100,Bank payment,0,12650
2026-09-05,JV-1005,1100,Client receipt,70000,0
2026-09-05,JV-1005,1200,Customer receivable,0,70000
2026-09-06,JV-1006,5300,Bank charges,200,0
2026-09-06,JV-1006,1100,Bank,0,200
2026-09-06,JV-1006,1100,Bank,0,200`;
const $=id=>document.getElementById(id); const input=$('csvInput'); input.value=sampleCSV;

function parseCSV(text){
  const rows=[]; let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i]; const n=text[i+1];
    if(c==='"'&&q&&n==='"'){cell+='"';i++;continue;} if(c==='"'){q=!q;continue;}
    if(c===','&&!q){row.push(cell);cell='';continue;} if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(v=>v.trim()!==''))rows.push(row);row=[];continue;} cell+=c;
  }
  row.push(cell); if(row.some(v=>v.trim()!==''))rows.push(row); if(!rows.length)return {headers:[],data:[]};
  const headers=rows[0].map(v=>v.trim().toLowerCase()); return {headers,data:rows.slice(1).map((r,i)=>Object.fromEntries(headers.map((h,j)=>[h,(r[j]??'').trim()]))).map((x,i)=>({...x,__row:i+2}))};
}
function num(v){const s=String(v??'').replace(/,/g,'').trim(); if(s==='')return 0; const n=Number(s); return Number.isFinite(n)?n:NaN;}
function money(n){return new Intl.NumberFormat('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(n));}
function analyze(){
  const parsed=parseCSV(input.value); const required=['date','reference','account','description','debit','credit']; const missing=required.filter(h=>!parsed.headers.includes(h));
  const findings=[]; if(missing.length)findings.push({severity:'error',title:'Missing required columns',detail:`Add: ${missing.join(', ')}.`});
  const valid=[]; const seen=new Map();
  parsed.data.forEach(r=>{
    const debit=num(r.debit),credit=num(r.credit); const signature=[r.date,r.reference,r.account,r.description,r.debit,r.credit].join('|').toLowerCase();
    if(!r.reference)findings.push({severity:'error',title:`Row ${r.__row}: missing reference`,detail:'Every journal line should have a grouping reference.'});
    if(!r.account)findings.push({severity:'error',title:`Row ${r.__row}: missing account`,detail:'Assign an account/code before posting.'});
    if(Number.isNaN(debit)||Number.isNaN(credit))findings.push({severity:'error',title:`Row ${r.__row}: invalid amount`,detail:'Debit and credit must be numeric or blank.'});
    if(Number.isFinite(debit)&&Number.isFinite(credit)&&debit!==0&&credit!==0)findings.push({severity:'warn',title:`Row ${r.__row}: both debit and credit populated`,detail:'A single journal line normally carries one side of the entry.'});
    if(Number.isFinite(debit)&&Number.isFinite(credit)&&debit===0&&credit===0)findings.push({severity:'warn',title:`Row ${r.__row}: zero-value line`,detail:'Confirm this row is intentional.'});
    if(seen.has(signature))findings.push({severity:'warn',title:`Row ${r.__row}: exact duplicate`,detail:`Matches row ${seen.get(signature)} and may represent a duplicate posting/import.`}); else seen.set(signature,r.__row);
    valid.push({...r,debit:Number.isFinite(debit)?debit:0,credit:Number.isFinite(credit)?credit:0});
  });
  const groups=new Map(); valid.forEach(r=>{const key=r.reference||`(row ${r.__row})`; if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);});
  const journals=[...groups.entries()].map(([reference,rows])=>{const debit=rows.reduce((s,r)=>s+r.debit,0),credit=rows.reduce((s,r)=>s+r.credit,0),diff=debit-credit; if(Math.abs(diff)>.004)findings.push({severity:'error',title:`${reference}: journal is unbalanced`,detail:`Debit and credit differ by ${money(diff)}.`}); return {reference,rows:rows.length,debit,credit,diff};});
  const debit=valid.reduce((s,r)=>s+r.debit,0),credit=valid.reduce((s,r)=>s+r.credit,0),difference=debit-credit;
  if(parsed.data.length&&!findings.length)findings.push({severity:'good',title:'No built-in checks failed',detail:'This is a mechanical sanity check, not an audit or accounting-policy review.'});
  return {parsed,findings,journals,debit,credit,difference};
}
function render(){
  const r=analyze(); $('debitTotal').textContent=money(r.debit); $('creditTotal').textContent=money(r.credit); $('rowCount').textContent=r.parsed.data.length; $('journalCount').textContent=r.journals.length; $('difference').textContent=r.parsed.data.length?`KES ${money(r.difference)}`:'—';
  const balanced=Math.abs(r.difference)<.005 && r.parsed.data.length>0; $('differenceText').textContent=!r.parsed.data.length?'Load data to calculate':balanced?'Control totals balance':'Debit and credit control totals differ'; $('overallState').textContent=!r.parsed.data.length?'Ready':balanced?'Balanced':'Review'; $('overallState').className=`state ${!r.parsed.data.length?'':balanced?'good':'bad'}`;
  $('journalTable').innerHTML=r.journals.length?r.journals.map(j=>`<tr><td><b>${esc(j.reference)}</b></td><td>${j.rows}</td><td>${money(j.debit)}</td><td>${money(j.credit)}</td><td class="${Math.abs(j.diff)>.004?'money-bad':''}">${money(j.diff)}</td><td><span class="pill ${Math.abs(j.diff)<.005?'good':'bad'}">${Math.abs(j.diff)<.005?'BALANCED':'REVIEW'}</span></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No journal analysis yet.</td></tr>';
  $('findings').innerHTML=r.findings.length?r.findings.map(f=>`<div class="finding ${f.severity}"><div><span class="tag">${f.severity.toUpperCase()}</span><strong>${esc(f.title)}</strong></div><p>${esc(f.detail)}</p></div>`).join(''):'<div class="empty">No findings yet.</div>';
  window.currentResult=r;
}
function esc(v){return String(v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));}
function loadSample(){input.value=sampleCSV;render();}
$('loadSample').onclick=loadSample; $('sampleTop').onclick=()=>{loadSample();document.querySelector('#workspace').scrollIntoView({behavior:'smooth'});}; $('runCheck').onclick=render; $('clearData').onclick=()=>{input.value='';render();};
$('csvFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{input.value=reader.result;render();};reader.readAsText(f);});
$('exportIssues').onclick=()=>{const r=window.currentResult||analyze();const lines=['severity,title,detail',...r.findings.map(f=>[f.severity,f.title,f.detail].map(csv).join(','))];const blob=new Blob([lines.join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ledgercheck-findings.csv';a.click();URL.revokeObjectURL(a.href);};
function csv(v){v=String(v??'');return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}
render();
