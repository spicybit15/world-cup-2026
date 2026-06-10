// fetch.mjs — World Cup 2026 pool auto-sync (free stack, Node 20+, no dependencies)
// Reads the live feed, computes points with the pool's rules, writes one Supabase row.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, FOOTBALL_DATA_KEY (optional -> falls back to openfootball)

const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_KEY;
const FD_KEY=process.env.FOOTBALL_DATA_KEY||"";
const ROW="wc2026";
if(!SUPABASE_URL||!SERVICE_KEY){console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");process.exit(1);}

const FIX=[
    {g:"A",md:1,iso:"2026-06-11",a:"Mexico",b:"South Africa"},
    {g:"A",md:1,iso:"2026-06-11",a:"South Korea",b:"Czechia"},
    {g:"B",md:1,iso:"2026-06-12",a:"Canada",b:"Bosnia & Herzegovina"},
    {g:"D",md:1,iso:"2026-06-12",a:"United States",b:"Paraguay"},
    {g:"B",md:1,iso:"2026-06-13",a:"Qatar",b:"Switzerland"},
    {g:"C",md:1,iso:"2026-06-13",a:"Brazil",b:"Morocco"},
    {g:"C",md:1,iso:"2026-06-13",a:"Haiti",b:"Scotland"},
    {g:"D",md:1,iso:"2026-06-13",a:"Australia",b:"Türkiye"},
    {g:"E",md:1,iso:"2026-06-14",a:"Germany",b:"Curaçao"},
    {g:"F",md:1,iso:"2026-06-14",a:"Netherlands",b:"Japan"},
    {g:"E",md:1,iso:"2026-06-14",a:"Ivory Coast",b:"Ecuador"},
    {g:"F",md:1,iso:"2026-06-14",a:"Sweden",b:"Tunisia"},
    {g:"H",md:1,iso:"2026-06-15",a:"Spain",b:"Cape Verde"},
    {g:"G",md:1,iso:"2026-06-15",a:"Belgium",b:"Egypt"},
    {g:"H",md:1,iso:"2026-06-15",a:"Saudi Arabia",b:"Uruguay"},
    {g:"G",md:1,iso:"2026-06-15",a:"Iran",b:"New Zealand"},
    {g:"I",md:1,iso:"2026-06-16",a:"France",b:"Senegal"},
    {g:"I",md:1,iso:"2026-06-16",a:"Iraq",b:"Norway"},
    {g:"J",md:1,iso:"2026-06-16",a:"Argentina",b:"Algeria"},
    {g:"J",md:1,iso:"2026-06-16",a:"Austria",b:"Jordan"},
    {g:"K",md:1,iso:"2026-06-17",a:"Portugal",b:"Congo DR"},
    {g:"L",md:1,iso:"2026-06-17",a:"England",b:"Croatia"},
    {g:"L",md:1,iso:"2026-06-17",a:"Ghana",b:"Panama"},
    {g:"K",md:1,iso:"2026-06-17",a:"Uzbekistan",b:"Colombia"},
    {g:"A",md:2,iso:"2026-06-18",a:"Czechia",b:"South Africa"},
    {g:"B",md:2,iso:"2026-06-18",a:"Switzerland",b:"Bosnia & Herzegovina"},
    {g:"B",md:2,iso:"2026-06-18",a:"Canada",b:"Qatar"},
    {g:"A",md:2,iso:"2026-06-18",a:"Mexico",b:"South Korea"},
    {g:"C",md:2,iso:"2026-06-19",a:"Scotland",b:"Morocco"},
    {g:"D",md:2,iso:"2026-06-19",a:"United States",b:"Australia"},
    {g:"C",md:2,iso:"2026-06-19",a:"Brazil",b:"Haiti"},
    {g:"D",md:2,iso:"2026-06-19",a:"Türkiye",b:"Paraguay"},
    {g:"F",md:2,iso:"2026-06-20",a:"Netherlands",b:"Sweden"},
    {g:"E",md:2,iso:"2026-06-20",a:"Germany",b:"Ivory Coast"},
    {g:"E",md:2,iso:"2026-06-20",a:"Ecuador",b:"Curaçao"},
    {g:"F",md:2,iso:"2026-06-20",a:"Tunisia",b:"Japan"},
    {g:"H",md:2,iso:"2026-06-21",a:"Spain",b:"Saudi Arabia"},
    {g:"G",md:2,iso:"2026-06-21",a:"Belgium",b:"Iran"},
    {g:"H",md:2,iso:"2026-06-21",a:"Uruguay",b:"Cape Verde"},
    {g:"G",md:2,iso:"2026-06-21",a:"New Zealand",b:"Egypt"},
    {g:"J",md:2,iso:"2026-06-22",a:"Argentina",b:"Austria"},
    {g:"I",md:2,iso:"2026-06-22",a:"France",b:"Iraq"},
    {g:"I",md:2,iso:"2026-06-22",a:"Norway",b:"Senegal"},
    {g:"J",md:2,iso:"2026-06-22",a:"Jordan",b:"Algeria"},
    {g:"K",md:2,iso:"2026-06-23",a:"Portugal",b:"Uzbekistan"},
    {g:"L",md:2,iso:"2026-06-23",a:"England",b:"Ghana"},
    {g:"L",md:2,iso:"2026-06-23",a:"Panama",b:"Croatia"},
    {g:"K",md:2,iso:"2026-06-23",a:"Colombia",b:"Congo DR"},
    {g:"B",md:3,iso:"2026-06-24",a:"Switzerland",b:"Canada"},
    {g:"B",md:3,iso:"2026-06-24",a:"Bosnia & Herzegovina",b:"Qatar"},
    {g:"C",md:3,iso:"2026-06-24",a:"Scotland",b:"Brazil"},
    {g:"C",md:3,iso:"2026-06-24",a:"Morocco",b:"Haiti"},
    {g:"A",md:3,iso:"2026-06-24",a:"Czechia",b:"Mexico"},
    {g:"A",md:3,iso:"2026-06-24",a:"South Africa",b:"South Korea"},
    {g:"E",md:3,iso:"2026-06-25",a:"Ecuador",b:"Germany"},
    {g:"E",md:3,iso:"2026-06-25",a:"Curaçao",b:"Ivory Coast"},
    {g:"F",md:3,iso:"2026-06-25",a:"Japan",b:"Sweden"},
    {g:"F",md:3,iso:"2026-06-25",a:"Tunisia",b:"Netherlands"},
    {g:"D",md:3,iso:"2026-06-25",a:"Türkiye",b:"United States"},
    {g:"D",md:3,iso:"2026-06-25",a:"Paraguay",b:"Australia"},
    {g:"I",md:3,iso:"2026-06-26",a:"Norway",b:"France"},
    {g:"I",md:3,iso:"2026-06-26",a:"Senegal",b:"Iraq"},
    {g:"H",md:3,iso:"2026-06-26",a:"Cape Verde",b:"Saudi Arabia"},
    {g:"H",md:3,iso:"2026-06-26",a:"Uruguay",b:"Spain"},
    {g:"G",md:3,iso:"2026-06-26",a:"Egypt",b:"Iran"},
    {g:"G",md:3,iso:"2026-06-26",a:"New Zealand",b:"Belgium"},
    {g:"L",md:3,iso:"2026-06-27",a:"Panama",b:"England"},
    {g:"L",md:3,iso:"2026-06-27",a:"Croatia",b:"Ghana"},
    {g:"K",md:3,iso:"2026-06-27",a:"Colombia",b:"Portugal"},
    {g:"K",md:3,iso:"2026-06-27",a:"Congo DR",b:"Uzbekistan"},
    {g:"J",md:3,iso:"2026-06-27",a:"Algeria",b:"Austria"},
    {g:"J",md:3,iso:"2026-06-27",a:"Jordan",b:"Argentina"},
  ];
FIX.forEach((f,i)=>f.id="m"+i);   // same ids as the site

// ---- team-name normalization (feed spellings -> our names) ----
const normKey=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
const ALIAS={
  korearepublic:"South Korea",korea:"South Korea",southkorea:"South Korea",
  iriran:"Iran",iran:"Iran",
  cotedivoire:"Ivory Coast",ivorycoast:"Ivory Coast",
  turkey:"Türkiye",turkiye:"Türkiye",
  czechrepublic:"Czechia",czechia:"Czechia",
  caboverde:"Cape Verde",capeverde:"Cape Verde",
  drcongo:"Congo DR",congodr:"Congo DR",democraticrepublicofthecongo:"Congo DR",
  bosniaherzegovina:"Bosnia & Herzegovina",bosniaandherzegovina:"Bosnia & Herzegovina",bosnia:"Bosnia & Herzegovina",
  usa:"United States",unitedstates:"United States",unitedstatesofamerica:"United States",
  curacao:"Curaçao",
};
const LOOKUP={};
[...new Set(FIX.flatMap(f=>[f.a,f.b]))].forEach(n=>{LOOKUP[normKey(n)]=n;});
Object.entries(ALIAS).forEach(([k,v])=>{LOOKUP[k]=v;});
const resolve=name=>LOOKUP[normKey(name)]||null;

const FIX_BY_PAIR={};
FIX.forEach(f=>{FIX_BY_PAIR[f.g+"|"+[f.a,f.b].sort().join("~")]=f;});
function findFixture(group,t1,t2){const a=resolve(t1),b=resolve(t2);if(!a||!b)return null;
  return FIX_BY_PAIR[group+"|"+[a,b].sort().join("~")]||null;}

// KO round just won -> stage index reached (matches site STAGES: R16=2,QF=3,SF=4,Final=5,Champion=6)
function reachedIndex(round){const r=(round||"").toUpperCase();
  if(r.includes("THIRD")||r.includes("3RD"))return null;   // third-place match: no points
  if(r.includes("QUARTER"))return 4;
  if(r.includes("SEMI"))return 5;
  if(r==="FINAL"||r.includes("THE FINAL"))return 6;
  if(r.includes("32"))return 2;
  if(r.includes("16"))return 3;
  return null;}

// ---- feed adapters -> [{scope, group?, round?, home, away, winner}] ----
async function fromFootballData(){
  const res=await fetch("https://api.football-data.org/v4/competitions/WC/matches",{headers:{"X-Auth-Token":FD_KEY}});
  if(!res.ok)throw new Error("football-data HTTP "+res.status);
  const j=await res.json();const ev=[];
  for(const mt of (j.matches||[])){
    if(mt.status!=="FINISHED"&&mt.status!=="AWARDED")continue;
    const w=mt.score&&mt.score.winner;
    const winner=w==="HOME_TEAM"?"home":w==="AWAY_TEAM"?"away":"draw";
    const stage=mt.stage||"";const home=mt.homeTeam&&mt.homeTeam.name;const away=mt.awayTeam&&mt.awayTeam.name;
    if(stage.includes("GROUP")){const group=(mt.group||"").replace(/GROUP[_ ]?/i,"").trim().charAt(0).toUpperCase();
      ev.push({scope:"group",group,home,away,winner});}
    else ev.push({scope:"ko",round:stage,home,away,winner});
  }
  return ev;
}
async function fromOpenfootball(){
  const res=await fetch("https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json");
  if(!res.ok)throw new Error("openfootball HTTP "+res.status);
  const j=await res.json();const ev=[];
  for(const mt of (j.matches||[])){
    const sc=mt.score;if(!sc)continue;const ft=sc.ft;if(!Array.isArray(ft)||ft.length<2)continue;  // unplayed
    const pen=sc.p||sc.pen,et=sc.et;let winner;
    if(ft[0]>ft[1])winner="home";else if(ft[1]>ft[0])winner="away";
    else if(Array.isArray(pen))winner=pen[0]>pen[1]?"home":pen[1]>pen[0]?"away":"draw";
    else if(Array.isArray(et))winner=et[0]>et[1]?"home":et[1]>et[0]?"away":"draw";
    else winner="draw";
    const isGroup=/^matchday/i.test(mt.round||"");
    if(isGroup){const group=(mt.group||"").replace(/group[_ ]?/i,"").trim().charAt(0).toUpperCase();
      ev.push({scope:"group",group,home:mt.team1,away:mt.team2,winner});}
    else ev.push({scope:"ko",round:mt.round,home:mt.team1,away:mt.team2,winner});
  }
  return ev;
}

function build(events){
  const m={},ko={};
  for(const e of events){
    if(e.scope==="group"){
      const f=findFixture(e.group,e.home,e.away);if(!f)continue;
      if(e.winner==="draw")m[f.id]="D";
      else{const win=resolve(e.winner==="home"?e.home:e.away);m[f.id]=win===f.a?"A":"B";}
    }else{
      const reached=reachedIndex(e.round);if(reached==null||e.winner==="draw")continue;
      const win=resolve(e.winner==="home"?e.home:e.away);if(!win)continue;
      ko[win]=Math.max(ko[win]||0,reached);
    }
  }
  return {m,ko};
}

async function getCurrent(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/pool_state?id=eq.${ROW}&select=data`,
    {headers:{apikey:SERVICE_KEY,Authorization:"Bearer "+SERVICE_KEY}});
  if(!r.ok)return {m:{},ko:{},locked:{}};
  const rows=await r.json();return (rows[0]&&rows[0].data)||{m:{},ko:{},locked:{}};
}
async function putRow(data){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/pool_state?on_conflict=id`,
    {method:"POST",headers:{apikey:SERVICE_KEY,Authorization:"Bearer "+SERVICE_KEY,
      "Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
     body:JSON.stringify([{id:ROW,data}])});
  if(!r.ok)throw new Error("supabase write "+r.status+" "+await r.text());
}

(async function main(){
  let events;
  try{events=FD_KEY?await fromFootballData():await fromOpenfootball();}
  catch(e){console.error("Primary feed failed:",e.message);
    if(FD_KEY){console.error("Falling back to openfootball…");events=await fromOpenfootball();}else throw e;}
  const feed=build(events);
  const cur=await getCurrent();const locked=cur.locked||{};
  const m={...feed.m},ko={...feed.ko};
  for(const key in locked){ if(!locked[key])continue;
    if(key.startsWith("m:")){const id=key.slice(2);if(cur.m&&cur.m[id]!==undefined)m[id]=cur.m[id];else delete m[id];}
    else if(key.startsWith("ko:")){const t=key.slice(3);if(cur.ko&&cur.ko[t]!==undefined)ko[t]=cur.ko[t];}
  }
  await putRow({m,ko,locked,updatedAt:Date.now()});
  console.log(`Synced ${Object.keys(m).length} group + ${Object.keys(ko).length} KO entries via ${FD_KEY?"football-data.org":"openfootball"}.`);
})().catch(e=>{console.error(e);process.exit(1);});
