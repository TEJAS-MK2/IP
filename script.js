const form=document.querySelector('#lookupForm');
const input=document.querySelector('#ipInput');
const lookupBtn=document.querySelector('#lookupBtn');
const myIpBtn=document.querySelector('#myIpBtn');
const status=document.querySelector('#status');
const result=document.querySelector('#result');
const copyIp=document.querySelector('#copyIp');
const fields={ip:document.querySelector('#ipValue'),city:document.querySelector('#city'),region:document.querySelector('#region'),country:document.querySelector('#country'),postal:document.querySelector('#postal'),timezone:document.querySelector('#timezone'),coords:document.querySelector('#coords'),asn:document.querySelector('#asn'),org:document.querySelector('#org'),pill:document.querySelector('#countryPill'),map:document.querySelector('#map')};
let controller=null;
const value=v=>v===null||v===undefined||String(v).trim()===''?'—':String(v);
function setStatus(message='',type='error'){status.textContent=message;status.className=`status${type==='error'?' status-error':type==='success'?' status-success':''}`;}
function setBusy(busy){lookupBtn.disabled=busy;myIpBtn.disabled=busy;lookupBtn.querySelector('.button-label').textContent=busy?'Looking up…':'Lookup';}
function isValidIp(value){
  const ip=value.trim();
  if(!ip||ip.length>45)return false;
  const parts=ip.split('.');
  if(parts.length===4&&parts.every(p=>/^\d{1,3}$/.test(p)))return parts.every(p=>Number(p)>=0&&Number(p)<=255);
  if(!ip.includes(':'))return false;
  return /^[0-9a-f:]+$/i.test(ip)&&ip.includes(':')&&ip.split('::').length<=2&&ip.split(':').filter(Boolean).length<=8;
}
function mapUrl(lat,lon){
  const pad=.15;
  const west=Math.max(-180,lon-pad),east=Math.min(180,lon+pad),south=Math.max(-90,lat-pad),north=Math.min(90,lat+pad);
  const bbox=[west,south,east,north].map(n=>n.toFixed(5)).join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lon.toFixed(5)}`;
}
function render(data){
  const lat=Number(data.latitude),lon=Number(data.longitude);
  fields.ip.textContent=value(data.ip);fields.city.textContent=value(data.city);fields.region.textContent=value(data.region);fields.country.textContent=value(data.country_name||data.country);fields.postal.textContent=value(data.postal);fields.timezone.textContent=value(data.timezone);fields.coords.textContent=Number.isFinite(lat)&&Number.isFinite(lon)?`${lat.toFixed(4)}, ${lon.toFixed(4)}`:'—';fields.asn.textContent=value(data.asn);fields.org.textContent=value(data.org);
  fields.pill.textContent=[data.country_code,data.country_name].filter(Boolean).join(' · ')||'Unknown';
  if(Number.isFinite(lat)&&Number.isFinite(lon))fields.map.src=mapUrl(lat,lon);else fields.map.removeAttribute('src');
  result.classList.remove('hidden');
}
async function lookup(ip=''){
  const clean=ip.trim();setStatus('');setBusy(true);if(controller)controller.abort();controller=new AbortController();
  try{
    const url=clean?`https://ipapi.co/${encodeURIComponent(clean)}/json/`:'https://ipapi.co/json/';
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal,cache:'no-store'});
    if(response.status===429)throw new Error('Too many requests. Please wait a moment and try again.');
    if(!response.ok)throw new Error(`Lookup failed (${response.status}). Please try again.`);
    const data=await response.json();
    if(data.error)throw new Error(data.reason||'The IP address could not be found.');
    if(!data.ip)throw new Error('The lookup service returned no IP address.');
    render(data);setStatus('Lookup complete.','success');
  }catch(error){
    if(error.name==='AbortError')return;
    result.classList.add('hidden');setStatus(error.message||'Something went wrong. Please try again.');
  }finally{setBusy(false);controller=null;}
}
form.addEventListener('submit',event=>{event.preventDefault();const ip=input.value.trim();if(!ip)return lookup();if(!isValidIp(ip)){setStatus('Enter a valid IPv4 or IPv6 address.');input.focus();return;}lookup(ip);});
myIpBtn.addEventListener('click',()=>{input.value='';lookup();});
copyIp.addEventListener('click',async()=>{const ip=fields.ip.textContent;if(!ip||ip==='—')return;try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(ip);else{const area=document.createElement('textarea');area.value=ip;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();}copyIp.textContent='Copied';setTimeout(()=>{copyIp.textContent='Copy';},1200);}catch{setStatus('Could not copy the IP address.');}});
lookup();
