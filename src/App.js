import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PaymentSuccess, PaymentFail } from "./Payment";

/* ── Tokens ─────────────────────────────────── */
const T = {
  bg:"#ffffff", surface:"#fafaf9", border:"#e8e2db",
  muted:"#a89880", body:"#5c4f42", heading:"#1c1410",
  coffee:"#6b3d1e", coffeeLt:"#8b5230",
  tag:"#f3ede6", tagText:"#7a5238",
  green:"#2d7a4f", greenBg:"#edf7f1",
  red:"#c0392b", redBg:"#fdf0ee",
  drip:"#6b3d1e", dripBg:"#f5ece2",
};

const DripIcon = ({ size=14, color=T.drip }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{display:"inline-block",verticalAlign:"middle"}}>
    <path d="M8 2C8 2 4 6.5 4 9.5C4 11.985 5.79 14 8 14C10.21 14 12 11.985 12 9.5C12 6.5 8 2 8 2Z" fill={color} opacity="0.9"/>
    <path d="M6 10C6 10 6.5 12 8 12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// 세리프 라이트 로고
function BrewLogo({size="md"}) {
  const fs = size==="lg" ? 32 : size==="sm" ? 18 : 24;
  const sub = size==="lg" ? 10 : size==="sm" ? 7 : 8;
  return (
    <div style={{display:"flex",alignItems:"baseline",gap:4}}>
      <span style={{fontFamily:"'Noto Serif KR',serif",fontSize:fs,fontWeight:300,color:T.coffee,letterSpacing:"4px"}}>브루</span>
      <span style={{fontFamily:"'Noto Serif KR',serif",fontSize:sub,fontWeight:400,color:T.muted,letterSpacing:"2px",marginBottom:2}}>CAREER</span>
    </div>
  );
}

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Noto+Serif+KR:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;color:#5c4f42;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
input,textarea,button,select{font-family:'Inter',sans-serif}
::placeholder{color:#c5b8a8}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeIn 0.25s ease forwards}
`;

const FREE_VIEWS     = 5;    // 첫 5회 열람 무료
const BEANS_PER_VIEW = 1;    // 6번째부터 열람당 1빈
const BEANS_PER_SEND = 5;    // 커피챗 신청 5빈 = ₩10,000
const BEAN_WON       = 2000; // 1빈 = ₩2,000
const INDUSTRIES = ["전체","IT/테크","금융/투자","컨설팅","마케팅","디자인","MBA/대학원","스타트업","헤드헌터","기타"];

const INIT_QA = [
  {id:301,author:"익명",initial:"A",question:"카카오 PM 최종면접 준비할 때 가장 중요한 게 뭔가요?",industry:"IT/테크",bounty:3,answers:[{id:1,author:"김지수",initial:"J",verified:true,text:"카카오는 데이터 기반 의사결정을 굉장히 중시해요. 과거 프로젝트에서 어떤 지표를 보고 어떤 결정을 내렸는지 숫자로 설명할 수 있어야 해요.",adopted:false}],adopted:false,createdAt:"2일 전"},
  {id:302,author:"익명",initial:"B",question:"토스 개발자로 이직할 때 코딩테스트 난이도가 어떤가요?",industry:"IT/테크",bounty:5,answers:[],adopted:false,createdAt:"5시간 전"},
  {id:303,author:"익명",initial:"C",question:"VC 심사역으로 커리어 전환하려는데 어디서 시작해야 할까요?",industry:"금융/투자",bounty:8,answers:[{id:1,author:"이하은",initial:"H",verified:true,text:"보통 IB나 컨설팅 출신이 많지만, 스타트업 경험도 굉장히 유효해요. 먼저 VC 블라인드 채용을 노리기보다 네트워킹으로 인턴십이나 파트타임 포지션을 찾는 게 현실적이에요.",adopted:false}],adopted:false,createdAt:"1일 전"},
  {id:304,author:"익명",initial:"D",question:"마케터로 5년차인데 그로스 마케팅으로 전환하려면 뭘 공부해야 할까요?",industry:"마케팅",bounty:4,answers:[],adopted:false,createdAt:"3일 전"},
];

const BEAN_PKGS = [
  {id:1,beans:5,  price:10000,label:"Starter", desc:"커피챗 신청 1회",  popular:false},
  {id:2,beans:10, price:18000,label:"Basic",   desc:"커피챗 신청 2회", popular:false},
  {id:3,beans:25, price:40000,label:"Standard",desc:"커피챗 신청 5회", popular:true},
  {id:4,beans:50, price:70000,label:"Pro",     desc:"커피챗 신청 10회",popular:false},
];

/* ── Mock Data ──────────────────────────────── */
const INIT_PROFILES = [
  {id:1,name:"김지수",role:"Product Manager",  company:"카카오",          yoe:6,skills:["PM","B2C","로드맵","데이터분석"],        bio:"카카오페이 PO 출신. 스타트업→대기업 커리어패스 경험 공유 가능.",    available:true, unlocked:false,initial:"J",industry:"IT/테크",  verified:true},
  {id:2,name:"박민준",role:"Senior Engineer",   company:"토스",            yoe:5,skills:["React","Node.js","시스템설계","코드리뷰"],bio:"토스 결제 코어팀. 이직 및 기술 인터뷰 준비 도움 가능.",           available:true, unlocked:false,initial:"M",industry:"IT/테크",  verified:true},
  {id:3,name:"이하은",role:"Investment Analyst",company:"스틱인베스트먼트",yoe:4,skills:["VC","스타트업","딜소싱","밸류에이션"],    bio:"VC 심사역. 창업 준비 또는 VC 이직 희망자와 커피챗 환영.",          available:true, unlocked:false,initial:"H",industry:"금융/투자",verified:true},
  {id:4,name:"최도현",role:"Brand Designer",    company:"무신사",          yoe:7,skills:["브랜딩","UI/UX","Figma","포트폴리오"],  bio:"패션 이커머스 디자인 리드. 포트폴리오 리뷰 및 커리어 고민 상담.",  available:false,unlocked:false,initial:"D",industry:"디자인",   verified:false},
  {id:5,name:"정서연",role:"Marketing Lead",    company:"크래프톤",        yoe:8,skills:["그로스","퍼포먼스","CRM","게임마케팅"],  bio:"배그 글로벌 마케팅 출신. 마케터 커리어 전환 및 해외 취업 공유.",   available:true, unlocked:false,initial:"S",industry:"마케팅",   verified:true},
  {id:6,name:"오재원",role:"Data Scientist",    company:"네이버",          yoe:5,skills:["ML","Python","추천시스템","A/B테스트"],  bio:"검색 랭킹 ML팀. DS/ML 커리어 시작 또는 전환 고민하는 분들 환영.", available:true, unlocked:false,initial:"J",industry:"IT/테크",  verified:true},
];

const INIT_REVIEWERS = [
  {id:101,name:"김지수",role:"Product Manager",  company:"카카오",          yoe:6, initial:"J",industry:"IT/테크",  price:20,tags:["PM 레주메","커리어 전환"],  desc:"PM·PO 직군 레주메 집중 피드백. 서류 탈락 경험 기반 실전 조언.",turnaround:"3일 이내",reviews:34,rating:4.9},
  {id:102,name:"박민준",role:"Senior Engineer",   company:"토스",            yoe:5, initial:"M",industry:"IT/테크",  price:15,tags:["개발자 레주메","기술면접"], desc:"백엔드·풀스택 개발자 레주메 리뷰. GitHub 링크 및 포폴 같이 봐드려요.",turnaround:"2일 이내",reviews:21,rating:4.8},
  {id:103,name:"이하은",role:"Investment Analyst",company:"스틱인베스트먼트",yoe:4, initial:"H",industry:"금융/투자",price:25,tags:["금융권 레주메","VC/PE"],     desc:"IB·VC·PE 직군 레주메 특화. 커버레터 작성도 함께 봐드립니다.",turnaround:"5일 이내",reviews:12,rating:5.0},
  {id:104,name:"정서연",role:"Marketing Lead",    company:"크래프톤",        yoe:8, initial:"S",industry:"마케팅",   price:12,tags:["마케터 레주메","성과수치화"],desc:"퍼포먼스·그로스 마케터 레주메 피드백. 수치 기반 성과 서술법 코칭.",turnaround:"3일 이내",reviews:28,rating:4.7},
  {id:105,name:"오재원",role:"Data Scientist",    company:"네이버",          yoe:5, initial:"J",industry:"IT/테크",  price:18,tags:["DS/ML 레주메","포폴리뷰"],  desc:"데이터 직군 레주메 + 프로젝트 포폴 피드백. 석박사 지원자 환영.",turnaround:"4일 이내",reviews:17,rating:4.8},
  {id:106,name:"최도현",role:"Brand Designer",    company:"무신사",          yoe:7, initial:"D",industry:"디자인",   price:10,tags:["디자이너 포폴","UX 리뷰"],  desc:"UX/브랜드 디자이너 포트폴리오 리뷰. Figma 파일 공유 후 화상 피드백.",turnaround:"2일 이내",reviews:41,rating:4.9},
];


/* ── Primitives ─────────────────────────────── */
function Tag({label,small}) {
  return <span style={{background:T.tag,color:T.tagText,fontSize:small?10:11,padding:small?"2px 7px":"3px 9px",borderRadius:4,fontWeight:500}}>{label}</span>;
}

function Avatar({initial, photo, size=40}) {
  if (photo) {
    return (
      <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,overflow:"hidden",border:`1px solid ${T.border}`}}>
        <img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      </div>
    );
  }
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:T.tag,color:T.coffee,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:600,fontFamily:"'Instrument Serif',serif",border:`1px solid ${T.border}`}}>
      {initial}
    </div>
  );
}

function Inp({value,onChange,placeholder,type="text",...rest}) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 13px",fontSize:13,color:T.heading,outline:"none",boxSizing:"border-box"}}
      onFocus={e=>e.target.style.borderColor=T.coffee}
      onBlur={e=>e.target.style.borderColor=T.border}
      {...rest}
    />
  );
}

const Lbl = ({children}) => <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5,fontWeight:500}}>{children}</label>;

/* ── Bean Modal (토스페이먼츠 연동) ────────────── */
function BeanModal({onClose,onBuy,user}) {
  const [loading,setLoading]=useState(false);

  async function handlePay(pkg) {
    setLoading(true);
    try {
      const tossPayments = await window.TossPayments(process.env.REACT_APP_TOSS_CLIENT_KEY);
      await tossPayments.requestPayment("카드", {
        amount: pkg.price,
        orderId: `brew_${Date.now()}`,
        orderName: `브루 ${pkg.label} · ${pkg.beans}빈`,
        customerName: user?.name || "브루 사용자",
        customerEmail: user?.email || "",
        successUrl: `${window.location.origin}/payment/success?beans=${pkg.beans}&price=${pkg.price}&label=${pkg.label}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch(e) {
      if(e.code !== "USER_CANCEL") alert("결제 중 오류가 발생했어요. 다시 시도해주세요.");
    }
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:14,padding:"28px 28px 22px",maxWidth:400,width:"100%",boxShadow:"0 16px 48px rgba(28,20,16,0.18)"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,color:T.heading,fontWeight:400,marginBottom:4}}>원두 충전</h2>
        <p style={{fontSize:13,color:T.muted,marginBottom:20}}>커피챗 신청, 레주메 리뷰 신청에 사용해요.</p>
        <div style={{background:T.surface,borderRadius:8,padding:"12px 14px",marginBottom:20,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span>🫘</span>
            <span style={{fontSize:13,fontWeight:600,color:T.heading}}>구매빈</span>
            <span style={{fontSize:12,color:T.muted}}>— 서비스 이용 전용, 출금 불가</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <DripIcon size={15}/>
            <span style={{fontSize:13,fontWeight:600,color:T.drip}}>수익빈</span>
            <span style={{fontSize:12,color:T.muted}}>— 출금 전용, 서비스 이용 불가</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {BEAN_PKGS.map(pkg=>(
            <button key={pkg.id} onClick={()=>handlePay(pkg)} disabled={loading} style={{background:pkg.popular?T.coffee:T.surface,border:`1px solid ${pkg.popular?T.coffee:T.border}`,borderRadius:9,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:loading?"not-allowed":"pointer",position:"relative",transition:"border-color 0.15s",opacity:loading?0.7:1}}
              onMouseEnter={e=>{if(!pkg.popular&&!loading)e.currentTarget.style.borderColor=T.coffee;}}
              onMouseLeave={e=>{if(!pkg.popular)e.currentTarget.style.borderColor=T.border;}}>
              {pkg.popular&&<span style={{position:"absolute",top:-9,left:14,background:T.coffeeLt,color:"#fff",fontSize:10,fontWeight:600,padding:"2px 9px",borderRadius:20}}>인기</span>}
              <div>
                <div style={{fontWeight:600,fontSize:14,color:pkg.popular?"#fff":T.heading}}>{pkg.label} · {pkg.beans}빈</div>
                <div style={{fontSize:12,marginTop:2,color:pkg.popular?"rgba(255,255,255,0.65)":T.muted}}>{pkg.desc}</div>
              </div>
              <div style={{fontWeight:700,fontSize:16,color:pkg.popular?"#fff":T.coffee}}>₩{pkg.price.toLocaleString()}</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:12,background:"none",border:`1px solid ${T.border}`,borderRadius:9,padding:"10px",color:T.muted,fontSize:13,cursor:"pointer"}}>닫기</button>
      </div>
    </div>
  );
}

/* ── Withdraw Modal ─────────────────────────── */
function WithdrawModal({earnedBeans,bankAccount,onClose,onWithdraw}) {
  const [amount,setAmount]=useState("");
  const [done,setDone]=useState(false);
  const won=(parseInt(amount)||0)*2000;
  const presets=[1,3,5,10,20,50].filter(n=>n<=earnedBeans);
  const isValid=parseInt(amount)>0&&parseInt(amount)<=earnedBeans;

  function submit(){if(!isValid)return;onWithdraw(parseInt(amount));setDone(true);}

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:14,padding:"28px 28px 22px",maxWidth:400,width:"100%",boxShadow:"0 16px 48px rgba(28,20,16,0.18)"}} onClick={e=>e.stopPropagation()}>
        {done?(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:38,marginBottom:12}}>✅</div>
            <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:T.heading,fontWeight:400,marginBottom:8}}>전환 완료</h2>
            <p style={{fontSize:13,color:T.muted,lineHeight:1.7}}>
              <strong style={{color:T.heading}}>₩{won.toLocaleString()}</strong>이<br/>
              연동 계좌 <strong style={{color:T.heading}}>{bankAccount}</strong>로<br/>
              1~2 영업일 내 입금됩니다.
            </p>
            <button onClick={onClose} style={{marginTop:20,background:T.coffee,border:"none",borderRadius:7,padding:"10px 28px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>확인</button>
          </div>
        ):(
          <>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:3}}>보유 수익빈</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <DripIcon size={18}/>
                  <span style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:T.heading,fontWeight:400}}>{earnedBeans}</span>
                  <span style={{fontSize:13,color:T.muted}}>빈</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:T.muted,marginBottom:3}}>입금 계좌</div>
                <div style={{fontSize:12,color:T.body,fontWeight:500}}>{bankAccount||"계좌 미등록"}</div>
              </div>
            </div>

            <div style={{height:1,background:T.border,marginBottom:18}}/>

            {/* Preset buttons */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:T.muted,marginBottom:8}}>빈 선택</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {presets.map(n=>(
                  <button key={n} onClick={()=>setAmount(String(n))} style={{
                    background:parseInt(amount)===n?T.coffee:T.tag,
                    border:`1px solid ${parseInt(amount)===n?T.coffee:T.border}`,
                    borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:600,
                    color:parseInt(amount)===n?"#fff":T.tagText,cursor:"pointer",transition:"all 0.15s"
                  }}>{n}빈</button>
                ))}
                <button onClick={()=>setAmount(String(earnedBeans))} style={{
                  background:parseInt(amount)===earnedBeans?T.coffee:T.tag,
                  border:`1px solid ${parseInt(amount)===earnedBeans?T.coffee:T.border}`,
                  borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:600,
                  color:parseInt(amount)===earnedBeans?"#fff":T.tagText,cursor:"pointer"
                }}>전체</button>
              </div>
            </div>

            {/* Manual input */}
            <div style={{marginBottom:16}}>
              <Lbl>직접 입력</Lbl>
              <div style={{position:"relative"}}>
                <Inp type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`1 ~ ${earnedBeans}`}/>
                {amount&&<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.muted}}>빈</span>}
              </div>
            </div>

            {/* Cash display */}
            <div style={{background:won>0?T.dripBg:T.surface,borderRadius:10,padding:"14px 18px",marginBottom:18,transition:"background 0.2s"}}>
              <div style={{fontSize:12,color:T.muted,marginBottom:4}}>교환될 캐시</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:28,color:won>0?T.coffee:T.muted,fontWeight:400}}>
                {won>0?`₩${won.toLocaleString()}`:"—"}
              </div>
              {won>0&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{amount}빈 × ₩2,000</div>}
            </div>

            <button onClick={submit} disabled={!isValid} style={{
              width:"100%",background:isValid?T.coffee:T.tag,border:"none",
              borderRadius:7,padding:"12px",color:isValid?"#fff":T.muted,
              fontWeight:600,fontSize:14,cursor:isValid?"pointer":"not-allowed",transition:"background 0.15s"
            }}>캐시로 전환하기</button>

            <button onClick={onClose} style={{width:"100%",marginTop:8,background:"none",border:"none",padding:"8px",color:T.muted,fontSize:13,cursor:"pointer"}}>닫기</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Signup Modal ───────────────────────────── */
// Step 1: 기본 정보
// Step 2: 인증 (선택) — 명함+메일 인증하면 레주메 리뷰어 기능 해금
function SignupModal({onClose,onComplete}) {
  const [step,setStep]=useState(1);
  const [f,setF]=useState({name:"",email:"",role:"",company:"",yoe:""});
  const [wantVerify,setWantVerify]=useState(false);
  const [cardFile,setCardFile]=useState("");
  const [codeSent,setCodeSent]=useState(false);
  const [code,setCode]=useState("");
  const set=(k,v)=>setF(x=>({...x,[k]:v}));

  const totalSteps = wantVerify ? 2 : 1;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:14,padding:"28px 28px 22px",maxWidth:500,width:"100%",boxShadow:"0 16px 48px rgba(28,20,16,0.18)",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:T.heading,fontWeight:400}}>
            {step===1?"회원가입":wantVerify&&step===2?"인증 (선택)":"가입 완료"}
          </h2>
          <div style={{display:"flex",gap:4}}>
            {[1,2,3].slice(0,totalSteps).map(s=>(
              <div key={s} style={{width:24,height:3,borderRadius:2,background:s<=step?T.coffee:T.border,transition:"background 0.2s"}}/>
            ))}
          </div>
        </div>

        {/* Step 1 — 기본 정보 */}
        {step===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div><Lbl>이름</Lbl><Inp value={f.name} onChange={e=>set("name",e.target.value)} placeholder="홍길동"/></div>
            <div><Lbl>이메일</Lbl><Inp value={f.email} onChange={e=>set("email",e.target.value)} placeholder="hong@email.com" type="email"/></div>
            <div><Lbl>현재 직무</Lbl><Inp value={f.role} onChange={e=>set("role",e.target.value)} placeholder="Product Manager, UX Designer …"/></div>
            <div><Lbl>회사 (선택)</Lbl><Inp value={f.company} onChange={e=>set("company",e.target.value)} placeholder="카카오, 토스 …"/></div>
            <div><Lbl>경력 (년)</Lbl><Inp value={f.yoe} onChange={e=>set("yoe",e.target.value)} placeholder="5" type="number"/></div>

            {/* Optional paths */}
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,display:"flex",flexDirection:"column",gap:10}}>
              <p style={{fontSize:12,color:T.muted}}>추가 기능 활성화 (선택)</p>

              {/* Verify toggle */}
              <div style={{border:`1px solid ${wantVerify?T.coffee:T.border}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",background:wantVerify?T.tag:"none",transition:"all 0.15s"}} onClick={()=>setWantVerify(v=>!v)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:T.heading}}>명함 + 이메일 인증</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2,lineHeight:1.5}}>
                      레주메 리뷰어 등록 해금<br/>
                      수익빈 획득 가능 · 승인 <strong>영업일 3일 이내</strong>
                    </div>
                  </div>
                  <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${wantVerify?T.coffee:T.border}`,background:wantVerify?T.coffee:"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {wantVerify&&<div style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}/>}
                  </div>
                </div>
              </div>

            </div>

            <button onClick={()=>setStep(2)} disabled={!f.name||!f.email} style={{background:!f.name||!f.email?T.tag:T.coffee,border:"none",borderRadius:7,padding:"10px",color:!f.name||!f.email?T.muted:"#fff",fontWeight:600,fontSize:13,cursor:!f.name||!f.email?"not-allowed":"pointer",marginTop:4}}>
              {wantVerify?"다음 →":"가입 완료"}
            </button>
          </div>
        )}

        {/* Step 2 — Verification (if chosen) */}
        {step===2&&wantVerify&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:T.surface,borderRadius:8,padding:"12px 14px",fontSize:12,color:T.muted,lineHeight:1.6}}>
              ⏱ 승인은 <strong style={{color:T.heading}}>영업일 기준 3일 이내</strong> 처리됩니다.<br/>
              승인 완료 시 이메일로 알려드리고, 이후 수익빈 획득이 가능해요.
            </div>

            {/* Business card */}
            <div>
              <Lbl>명함 업로드</Lbl>
              <div style={{border:`1px dashed ${cardFile?T.coffee:T.border}`,borderRadius:7,padding:"18px",textAlign:"center",cursor:"pointer",background:cardFile?T.tag:"none"}}
                onClick={()=>setCardFile(v=>v?"":"명함_홍길동.jpg")}>
                {cardFile?(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{color:T.green}}>✓</span>
                    <span style={{fontSize:13,color:T.coffee,fontWeight:500}}>{cardFile}</span>
                    <span style={{fontSize:11,color:T.muted}}>(클릭하여 변경)</span>
                  </div>
                ):(
                  <>
                    <div style={{fontSize:20,marginBottom:4}}>📎</div>
                    <div style={{fontSize:13,color:T.muted}}>명함 이미지 업로드 (클릭)</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>JPG, PNG, PDF 지원</div>
                  </>
                )}
              </div>
            </div>

            {/* Email code */}
            <div>
              <Lbl>직장 이메일 인증</Lbl>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 13px",fontSize:13,color:T.muted,background:T.surface}}>{f.email}</div>
                <button onClick={()=>setCodeSent(true)} style={{background:codeSent?T.surface:T.coffee,border:`1px solid ${codeSent?T.border:"none"}`,borderRadius:7,padding:"9px 14px",color:codeSent?T.muted:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {codeSent?"재전송":"인증코드 전송"}
                </button>
              </div>
              {codeSent&&(
                <div style={{marginTop:8}}>
                  <Inp value={code} onChange={e=>setCode(e.target.value)} placeholder="인증코드 6자리"/>
                </div>
              )}
            </div>

            <div style={{background:"#fdf8ec",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#8a6d00",border:"1px solid #f0dfa0",lineHeight:1.6}}>
              💡 인증 완료 후 <strong>레주메 리뷰어 등록</strong>이 활성화됩니다.
            </div>

            {/* Bank account */}
            <div>
              <Lbl>입금 계좌 (수익빈 출금용)</Lbl>
              <Inp value={f.bank||""} onChange={e=>set("bank",e.target.value)} placeholder="카카오뱅크 3333-12-3456789"/>
              <p style={{fontSize:11,color:T.muted,marginTop:4}}>수익빈을 캐시로 전환할 때 사용돼요.</p>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setStep(1)} style={{background:T.tag,border:"none",borderRadius:7,padding:"10px 16px",color:T.body,fontSize:13,cursor:"pointer"}}>← 이전</button>
              <button onClick={()=>{onComplete({verified:true,name:f.name,bank:f.bank});onClose();}} style={{flex:1,background:T.coffee,border:"none",borderRadius:7,padding:"10px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>인증 신청 완료</button>
            </div>
          </div>
        )}

        {/* Instant complete: no optional steps */}
        {step===2&&!wantVerify&&(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>☕</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><BrewLogo size="md"/></div>
            <h2 style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,color:T.heading,fontWeight:400,marginBottom:8}}>에 오신 걸 환영해요!</h2>
            <p style={{fontSize:13,color:T.muted,lineHeight:1.6,marginBottom:20}}>커피챗 신청과 요청을 바로 시작할 수 있어요.</p>
            <button onClick={()=>{onComplete({verified:false,name:f.name});onClose();}} style={{background:T.coffee,border:"none",borderRadius:7,padding:"10px 28px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>시작하기</button>
          </div>
        )}
      </div>
    </div>
  );
}


/* ── Profile Card ───────────────────────────── */
function ProfileCard({p,onUnlock,onSend,purchasedBeans,viewCount,index}) {
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState("");
  const [sent,setSent]=useState(false);
  return (
    <div className="fade" style={{animationDelay:`${index*0.04}s`,opacity:0,background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"20px",transition:"box-shadow 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(107,61,30,0.08)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
        <Avatar initial={p.initial} photo={p.photo}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontWeight:600,fontSize:15,color:T.heading}}>{p.unlocked?p.name:`${p.name[0]}○○`}</span>
            {p.verified&&<span style={{fontSize:10,color:T.green,background:T.greenBg,padding:"2px 7px",borderRadius:20,fontWeight:600}}>✓ 인증</span>}
            <span style={{fontSize:11,color:p.available?T.green:T.muted,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:p.available?T.green:T.muted,display:"inline-block"}}/>
              {p.available?"가능":"중단"}
            </span>
          </div>
          <p style={{fontSize:12,color:T.muted,marginTop:2}}>{p.role} · {p.unlocked?p.company:"———"} · {p.yoe}년</p>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>{p.skills.map(s=><Tag key={s} label={s}/>)}</div>
      <div style={{height:1,background:T.border,marginBottom:14}}/>
      {p.unlocked?(
        <>
          <p style={{fontSize:13,color:T.body,lineHeight:1.65,marginBottom:14}}>{p.bio}</p>
          {!sent?(open?(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="간단한 소개와 커피챗 목적을 적어주세요" rows={3}
                style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontSize:13,resize:"none",outline:"none",color:T.heading,lineHeight:1.6}}
                onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
              {/* Cost + reply notice */}
              <div style={{background:T.surface,borderRadius:7,padding:"10px 12px",fontSize:12,color:T.muted,lineHeight:1.6}}>
                🫘 신청 시 <strong style={{color:T.coffee}}>5빈 (₩10,000)</strong> 차감 · 답장은 보장되지 않아요.
                {p.verified&&<span style={{color:T.green,marginLeft:4}}>✓ 인증 회원은 답장 확률이 높아요.</span>}
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>{const ok=onSend();if(ok)setSent(true);}} style={{flex:1,background:T.coffee,border:"none",borderRadius:7,padding:"9px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>신청 보내기 · 5빈</button>
                <button onClick={()=>setOpen(false)} style={{background:T.tag,border:"none",borderRadius:7,padding:"9px 14px",color:T.body,fontSize:13,cursor:"pointer"}}>취소</button>
              </div>
            </div>
          ):(
            <button onClick={()=>setOpen(true)} style={{width:"100%",background:"none",border:`1px solid ${T.coffee}`,borderRadius:7,padding:"9px",color:T.coffee,fontWeight:600,fontSize:13,cursor:"pointer",transition:"background 0.15s"}}
              onMouseEnter={e=>e.target.style.background=T.tag} onMouseLeave={e=>e.target.style.background="none"}>☕ 커피챗 신청하기</button>
          )):(
            <div style={{textAlign:"center",padding:"9px",background:T.tag,borderRadius:7,fontSize:13,color:T.tagText}}>신청 완료 — 답변을 기다리는 중이에요</div>
          )}
        </>
      ):(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          {viewCount < FREE_VIEWS
            ? <span style={{fontSize:12,color:T.muted}}>무료 열람 {FREE_VIEWS - viewCount}회 남음</span>
            : <span style={{fontSize:12,color:T.muted}}>열람 · 1빈 소요</span>
          }
          <button onClick={()=>onUnlock(p.id)}
            disabled={viewCount >= FREE_VIEWS && purchasedBeans < BEANS_PER_VIEW}
            style={{background:viewCount<FREE_VIEWS?T.coffee:(purchasedBeans>=BEANS_PER_VIEW?T.coffee:T.tag),border:"none",borderRadius:7,padding:"8px 16px",color:viewCount<FREE_VIEWS?"#fff":(purchasedBeans>=BEANS_PER_VIEW?"#fff":T.muted),fontSize:12,fontWeight:600,cursor:(viewCount>=FREE_VIEWS&&purchasedBeans<BEANS_PER_VIEW)?"not-allowed":"pointer"}}>
            {viewCount < FREE_VIEWS ? "무료 열람" : purchasedBeans >= BEANS_PER_VIEW ? "열람 · 1빈" : "빈 부족"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Reviewer Card ──────────────────────────── */
function ReviewerCard({r,onRequest,onBuyBeans,purchasedBeans,index,userVerified}) {
  const [open,setOpen]=useState(false);
  const [file,setFile]=useState(null);
  const [email,setEmail]=useState("");
  const [note,setNote]=useState("");
  const [sent,setSent]=useState(false);
  const [rated,setRated]=useState(false);
  const [myRating,setMyRating]=useState(0);
  const [hoverRating,setHoverRating]=useState(0);
  const [review,setReview]=useState("");
  const canAfford=purchasedBeans>=r.price;
  const canSubmit=canAfford&&file&&email.trim();
  return (
    <div className="fade" style={{animationDelay:`${index*0.04}s`,opacity:0,background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"20px",transition:"box-shadow 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(107,61,30,0.08)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,background:T.tag,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`}}>
          <span style={{fontSize:16}}>👤</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontWeight:600,fontSize:15,color:T.heading}}>{r.role}</span>
              <span style={{fontSize:10,color:T.green,background:T.greenBg,padding:"2px 7px",borderRadius:20,fontWeight:600}}>✓ 인증</span>
            </div>
            <span style={{background:T.tag,color:T.coffee,fontSize:13,fontWeight:700,padding:"3px 12px",borderRadius:20,border:`1px solid ${T.border}`}}>🫘 {r.price}빈</span>
          </div>
          <p style={{fontSize:12,color:T.muted,marginTop:2}}>{r.company} · {r.yoe}년차</p>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>{r.tags.map(t=><Tag key={t} label={t} small/>)}</div>
      <p style={{fontSize:13,color:T.body,lineHeight:1.6,marginBottom:10}}>{r.description||r.desc}</p>
      <div style={{display:"flex",gap:16,marginBottom:14}}>
        <span style={{fontSize:12,color:T.muted}}>⏱ {r.turnaround}</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:13,letterSpacing:"-1px"}}>
            {[1,2,3,4,5].map(i=>{
              const rating = r.rating||5;
              const full = Math.floor(rating);
              const hasHalf = rating !== full; // 소수점 있으면 반별
              if(i <= full) return <span key={i} style={{color:"#f5a623"}}>★</span>;
              if(i === full+1 && hasHalf) return <span key={i} style={{color:"#f5a623",opacity:0.5}}>★</span>;
              return <span key={i} style={{color:"#e0d0bc"}}>★</span>;
            })}
          </span>
          <span style={{fontSize:12,color:T.muted}}>{(r.rating||5).toFixed(1)} ({r.reviews||r.review_count||0}건)</span>
        </span>
      </div>
      <div style={{height:1,background:T.border,marginBottom:14}}/>
      {!sent?(open?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div
            style={{border:`1px dashed ${file?T.coffee:T.border}`,borderRadius:7,padding:"16px",textAlign:"center",cursor:"pointer",background:file?T.tag:"none",transition:"all 0.15s",position:"relative"}}
            onClick={()=>document.getElementById(`resume-upload-${r.id}`).click()}>
            <input id={`resume-upload-${r.id}`} type="file" accept=".pdf,.doc,.docx" style={{display:"none"}} onChange={e=>setFile(e.target.files[0]||null)}/>
            {file?(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{color:T.green}}>✓</span>
                <span style={{fontSize:13,color:T.coffee,fontWeight:500}}>{file.name}</span>
                <span style={{fontSize:11,color:T.muted,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setFile(null);}}>✕</span>
              </div>
            ):(
              <>
                <div style={{fontSize:20,marginBottom:4}}>📎</div>
                <div style={{fontSize:13,color:T.muted}}>레주메 첨부 (클릭)</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>PDF, DOC, DOCX 지원</div>
              </>
            )}
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="지원 직무, 중점적으로 봐줬으면 하는 부분" rows={3}
            style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontSize:13,resize:"none",outline:"none",color:T.heading,lineHeight:1.6}}
            onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
          <div>
            <label style={{display:"block",fontSize:12,color:T.muted,marginBottom:5,fontWeight:500}}>피드백 받을 이메일</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hong@email.com"
              style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontSize:13,outline:"none",color:T.heading,boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
            <p style={{fontSize:11,color:T.red,marginTop:4}}>⚠️ 이메일을 잘못 기입하면 빈이 환불되지 않으니 다시 한번 확인해주세요.</p>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>{onRequest(r.price);setSent(true);}} disabled={!canSubmit} style={{flex:1,background:canSubmit?T.coffee:T.tag,border:"none",borderRadius:7,padding:"9px",color:canSubmit?"#fff":T.muted,fontWeight:600,fontSize:13,cursor:canSubmit?"pointer":"not-allowed"}}>신청 · {r.price}빈 사용</button>
            <button onClick={()=>setOpen(false)} style={{background:T.tag,border:"none",borderRadius:7,padding:"9px 14px",color:T.body,fontSize:13,cursor:"pointer"}}>취소</button>
          </div>
        </div>
      ):(
        <button onClick={()=>canAfford?setOpen(true):onBuyBeans()} style={{width:"100%",background:canAfford?"none":T.coffee,border:`1px solid ${canAfford?T.coffee:T.coffee}`,borderRadius:7,padding:"9px",color:canAfford?T.coffee:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",transition:"background 0.15s"}}
          onMouseEnter={e=>{if(canAfford)e.target.style.background=T.tag;}} onMouseLeave={e=>{if(canAfford)e.target.style.background="none";}}>
          {canAfford?`📄 레주메 리뷰 신청 · ${r.price}빈`:`🫘 빈 충전하기 (${r.price}빈 필요)`}
        </button>
      )):(
        !rated ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{textAlign:"center",padding:"10px",background:T.greenBg,borderRadius:7,fontSize:13,color:T.green,fontWeight:500}}>
              ✅ 신청 완료 — {r.turnaround} 내 <strong>{email}</strong>으로 피드백이 도착해요
            </div>
            {/* 평점 남기기 */}
            <div style={{background:T.surface,borderRadius:9,padding:"14px 16px"}}>
              <p style={{fontSize:12,color:T.muted,marginBottom:10,fontWeight:500}}>피드백을 받으셨나요? 평점을 남겨주세요</p>
              {/* 별점 */}
              <div style={{display:"flex",gap:4,marginBottom:10}}>
                {[1,2,3,4,5].map(star=>(
                  <span key={star}
                    onClick={()=>setMyRating(star)}
                    onMouseEnter={()=>setHoverRating(star)}
                    onMouseLeave={()=>setHoverRating(0)}
                    style={{fontSize:26,cursor:"pointer",color:(hoverRating||myRating)>=star?"#f5a623":"#e0d0bc",transition:"color 0.1s"}}>★</span>
                ))}
                {myRating>0&&<span style={{fontSize:12,color:T.muted,marginLeft:4,alignSelf:"center"}}>{["","별로예요","아쉬워요","보통이에요","좋아요","최고예요"][myRating]}</span>}
              </div>
              {myRating>0&&(
                <>
                  <textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="한 줄 후기를 남겨주세요 (선택)" rows={2}
                    style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",fontSize:12,resize:"none",outline:"none",color:T.heading,lineHeight:1.5,boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
                  <button onClick={()=>setRated(true)} style={{width:"100%",marginTop:8,background:T.coffee,border:"none",borderRadius:7,padding:"9px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                    평점 등록
                  </button>
                </>
              )}
            </div>
          </div>
        ):(
          <div style={{textAlign:"center",padding:"10px",background:T.tag,borderRadius:7,fontSize:13,color:T.tagText}}>
            {"★".repeat(myRating)}{"☆".repeat(5-myRating)} 평점이 등록됐어요. 감사해요!
          </div>
        )
      )}
    </div>
  );
}

/* ── Register Reviewer Modal (인증 필요 안내 포함) ── */
function RegisterReviewerModal({onClose,onRegister,userVerified,onGoVerify}) {
  const [f,setF]=useState({price:"",tags:"",desc:"",turnaround:""});
  const set=(k,v)=>setF(x=>({...x,[k]:v}));

  if(!userVerified) return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:14,padding:"32px 28px",maxWidth:400,width:"100%",boxShadow:"0 16px 48px rgba(28,20,16,0.18)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:38,marginBottom:14}}>🔐</div>
        <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:T.heading,fontWeight:400,marginBottom:8}}>인증이 필요해요</h2>
        <p style={{fontSize:13,color:T.muted,lineHeight:1.7,marginBottom:22}}>
          레주메 리뷰어 등록은 <strong style={{color:T.heading}}>명함 + 이메일 인증</strong>을 완료한 분만 가능해요.<br/>
          신뢰도 있는 리뷰 환경을 위한 조치입니다.
        </p>
        <button onClick={()=>{onClose();onGoVerify();}} style={{width:"100%",background:T.coffee,border:"none",borderRadius:7,padding:"11px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",marginBottom:8}}>인증하러 가기</button>
        <button onClick={onClose} style={{width:"100%",background:"none",border:`1px solid ${T.border}`,borderRadius:7,padding:"10px",color:T.muted,fontSize:13,cursor:"pointer"}}>닫기</button>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:14,padding:"28px 28px 22px",maxWidth:460,width:"100%",boxShadow:"0 16px 48px rgba(28,20,16,0.18)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:T.heading,fontWeight:400}}>레주메 리뷰어 등록</h2>
          <span style={{fontSize:10,color:T.green,background:T.greenBg,padding:"2px 8px",borderRadius:20,fontWeight:600}}>✓ 인증 완료</span>
        </div>
        <p style={{fontSize:13,color:T.muted,marginBottom:20}}>리뷰 완료 시 수익빈으로 지급되며, 계좌로 출금할 수 있어요.</p>
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <div><Lbl>리뷰 가격 (빈)</Lbl><Inp value={f.price} onChange={e=>set("price",e.target.value)} placeholder="15  (1빈 ≈ 100원)" type="number"/></div>
          <div><Lbl>전문 분야 (쉼표 구분)</Lbl><Inp value={f.tags} onChange={e=>set("tags",e.target.value)} placeholder="PM 레주메, 커리어 전환"/></div>
          <div><Lbl>응답 기간</Lbl><Inp value={f.turnaround} onChange={e=>set("turnaround",e.target.value)} placeholder="3일 이내"/></div>
          <div>
            <Lbl>리뷰 소개</Lbl>
            <textarea value={f.desc} onChange={e=>set("desc",e.target.value)} placeholder="어떤 레주메를 리뷰할 수 있는지, 어떤 피드백을 드릴 수 있는지 적어주세요." rows={3}
              style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontSize:13,resize:"none",outline:"none",color:T.heading,lineHeight:1.6,boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          <div style={{background:T.dripBg,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.drip,border:`1px solid ${T.coffeeLt}`,lineHeight:1.6,display:"flex",alignItems:"flex-start",gap:6}}>
            <DripIcon size={14}/> 리뷰 완료 후 지정 가격만큼 <strong>수익빈</strong>으로 지급됩니다. 수익빈은 현금으로 출금 가능해요.
          </div>
          <button onClick={()=>{onRegister(f);onClose();}} style={{background:T.coffee,border:"none",borderRadius:7,padding:"10px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>등록 완료</button>
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:10,background:"none",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px",color:T.muted,fontSize:13,cursor:"pointer"}}>닫기</button>
      </div>
    </div>
  );
}


/* ── Ask Modal (질문 등록) ───────────────────── */
function AskModal({onClose,onSubmit,purchasedBeans,onBuyBeans}) {
  const [q,setQ]=useState("");
  const [bounty,setBounty]=useState("");
  const [industry,setIndustry]=useState("IT/테크");
  const presets=[1,2,3,5,10];
  const canSubmit=q.trim()&&parseInt(bounty)>0&&parseInt(bounty)<=purchasedBeans;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:14,padding:"28px 28px 22px",maxWidth:480,width:"100%",boxShadow:"0 16px 48px rgba(28,20,16,0.18)"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:T.heading,fontWeight:400,marginBottom:4}}>질문 등록</h2>
        <p style={{fontSize:13,color:T.muted,marginBottom:20}}>베스트 답변자에게 빈이 수익빈으로 지급돼요.</p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Question */}
          <div>
            <Lbl>질문 내용</Lbl>
            <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="현직자에게 궁금한 점을 구체적으로 적어주세요." rows={4}
              style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontSize:13,resize:"none",outline:"none",color:T.heading,lineHeight:1.6,boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          {/* Industry */}
          <div>
            <Lbl>분야</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {INDUSTRIES.filter(i=>i!=="전체").map(ind=>(
                <button key={ind} onClick={()=>setIndustry(ind)} style={{background:industry===ind?T.coffee:T.tag,border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:500,color:industry===ind?"#fff":T.tagText,cursor:"pointer"}}>{ind}</button>
              ))}
            </div>
          </div>
          {/* Bounty */}
          <div>
            <Lbl>현상금 (빈)</Lbl>
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              {presets.map(n=>(
                <button key={n} onClick={()=>setBounty(String(n))} style={{background:parseInt(bounty)===n?T.coffee:T.tag,border:`1px solid ${parseInt(bounty)===n?T.coffee:T.border}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,color:parseInt(bounty)===n?"#fff":T.tagText,cursor:"pointer"}}>{n}빈</button>
              ))}
            </div>
            <Inp type="number" value={bounty} onChange={e=>setBounty(e.target.value)} placeholder="직접 입력"/>
            {parseInt(bounty)>purchasedBeans&&<p style={{fontSize:11,color:T.red,marginTop:4}}>보유 빈이 부족해요</p>}
          </div>
          {/* Notice */}
          <div style={{background:T.surface,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.muted,lineHeight:1.6}}>
            🫘 등록 시 <strong style={{color:T.coffee}}>{bounty||"0"}빈</strong> 예치 · 채택 시 답변자에게 <strong style={{color:T.drip}}>수익빈</strong>으로 지급<br/>
            댓글이 없으면 예치 빈 전액 회수 가능
          </div>
          <button onClick={()=>{
            if(!canSubmit){if(parseInt(bounty)>purchasedBeans)onBuyBeans();return;}
            onSubmit({question:q,industry,bounty:parseInt(bounty)});onClose();
          }} style={{background:canSubmit?T.coffee:T.tag,border:"none",borderRadius:7,padding:"11px",color:canSubmit?"#fff":T.muted,fontWeight:600,fontSize:13,cursor:canSubmit?"pointer":"not-allowed"}}>
            {parseInt(bounty)>purchasedBeans?"🫘 빈 충전하기":"질문 등록 · "+bounty+"빈 예치"}
          </button>
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:8,background:"none",border:"none",padding:"8px",color:T.muted,fontSize:13,cursor:"pointer"}}>닫기</button>
      </div>
    </div>
  );
}

/* ── QA Card ─────────────────────────────────── */
function QACard({qa,onAdopt,onRefund,index,currentUserId}) {
  const [open,setOpen]=useState(false);
  const [answer,setAnswer]=useState("");
  const [submitted,setSubmitted]=useState(false);

  return (
    <div className="fade" style={{animationDelay:`${index*0.04}s`,opacity:0,background:T.bg,border:`1px solid ${qa.adopted?T.green:T.border}`,borderRadius:10,padding:"20px",transition:"box-shadow 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(107,61,30,0.08)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:T.tag,color:T.coffee,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0,fontFamily:"'Instrument Serif',serif"}}>{qa.initial}</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <Tag label={qa.industry} small/>
              <span style={{fontSize:11,color:T.muted}}>{qa.createdAt}</span>
            </div>
            <p style={{fontSize:14,fontWeight:600,color:T.heading,marginTop:5,lineHeight:1.5}}>{qa.question}</p>
          </div>
        </div>
        {/* Bounty badge */}
        <div style={{flexShrink:0,textAlign:"center",background:qa.adopted?T.greenBg:T.tag,border:`1px solid ${qa.adopted?T.green:T.border}`,borderRadius:10,padding:"8px 12px"}}>
          <div style={{fontSize:16,display:"flex",justifyContent:"center"}}>{qa.adopted?<DripIcon size={18}/>:"🫘"}</div>
          <div style={{fontSize:14,fontWeight:700,color:qa.adopted?T.green:T.coffee}}>{qa.bounty}빈</div>
          <div style={{fontSize:9,color:T.muted,marginTop:1}}>{qa.adopted?"수익빈 지급":"현상금"}</div>
        </div>
      </div>

      {/* Answers — 질문자는 전체, 답변자는 본인 것만 */}
      {qa.answers.length>0&&(
        qa.author_id===currentUserId ? (
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginBottom:12,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>💬 답변 {qa.answers.length}개 — 질문자에게만 보여요</div>
            {qa.answers.map((ans)=>(
              <div key={ans.id} style={{background:ans.adopted?T.greenBg:T.surface,borderRadius:8,padding:"12px 14px",border:`1px solid ${ans.adopted?T.green:T.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:T.coffee,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600}}>{ans.initial}</div>
                    <span style={{fontSize:13,fontWeight:600,color:T.heading}}>{ans.author}</span>
                    {ans.verified&&<span style={{fontSize:10,color:T.green,background:T.greenBg,padding:"1px 6px",borderRadius:20,fontWeight:600}}>✓ 인증</span>}
                    {ans.adopted&&<span style={{fontSize:10,color:T.green,background:T.greenBg,padding:"1px 6px",borderRadius:20,fontWeight:700}}>⭐ 채택</span>}
                  </div>
                  {!qa.adopted&&(
                    <button onClick={()=>onAdopt(qa.id,ans.id)} style={{background:"none",border:`1px solid ${T.coffee}`,borderRadius:20,padding:"4px 12px",fontSize:11,color:T.coffee,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.target.style.background=T.coffee;e.target.style.color="#fff";}}
                      onMouseLeave={e=>{e.target.style.background="none";e.target.style.color=T.coffee;}}>
                      채택하기
                    </button>
                  )}
                </div>
                <p style={{fontSize:13,color:T.body,lineHeight:1.65}}>{ans.text}</p>
              </div>
            ))}
          </div>
        ):(()=>{
          // 내가 쓴 답변만 찾기
          const myAns = qa.answers.find(a=>a.author_id===currentUserId);
          return (
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10,marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
              {myAns ? (
                <>
                  <div style={{fontSize:11,color:T.muted}}>✏️ 내 답변 — 다른 답변은 볼 수 없어요</div>
                  <div style={{background:myAns.adopted?T.greenBg:T.surface,borderRadius:8,padding:"12px 14px",border:`1px solid ${myAns.adopted?T.green:T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      {myAns.adopted&&<span style={{fontSize:10,color:T.green,background:T.greenBg,padding:"1px 6px",borderRadius:20,fontWeight:700}}>⭐ 채택됨</span>}
                      {!myAns.adopted&&<span style={{fontSize:11,color:T.muted}}>채택 대기 중</span>}
                    </div>
                    <p style={{fontSize:13,color:T.body,lineHeight:1.65}}>{myAns.text}</p>
                  </div>
                </>
              ):(
                <span style={{fontSize:12,color:T.muted}}>💬 답변 {qa.answers.length}개 달림 · 질문자만 확인 가능해요</span>
              )}
            </div>
          );
        })()
      )}

      {/* Answer input */}
      {!qa.adopted&&(
        !submitted?(
          open?(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="답변을 작성해주세요. 채택되면 수익빈으로 지급돼요." rows={3}
                style={{border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontSize:13,resize:"none",outline:"none",color:T.heading,lineHeight:1.6}}
                onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>{setSubmitted(true);sendNotification("✏️ 답변 등록 완료","채택되면 수익빈이 지급돼요!");}} disabled={!answer.trim()} style={{flex:1,background:answer.trim()?T.coffee:T.tag,border:"none",borderRadius:7,padding:"9px",color:answer.trim()?"#fff":T.muted,fontWeight:600,fontSize:13,cursor:answer.trim()?"pointer":"not-allowed"}}>답변 등록</button>
                <button onClick={()=>setOpen(false)} style={{background:T.tag,border:"none",borderRadius:7,padding:"9px 14px",color:T.body,fontSize:13,cursor:"pointer"}}>취소</button>
              </div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* 본인 질문이면 답변 버튼 숨기기 */}
              {qa.author_id===currentUserId?(
                <div style={{textAlign:"center",fontSize:12,color:T.muted,padding:"6px 0"}}>
                  내가 등록한 질문이에요 · 답변을 기다려주세요
                </div>
              ):(
                <button onClick={()=>setOpen(true)} style={{width:"100%",background:"none",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px",color:T.muted,fontSize:13,cursor:"pointer",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.target.style.borderColor=T.coffee} onMouseLeave={e=>e.target.style.borderColor=T.border}>
                  ✏️ 답변 달기 · 채택 시 <DripIcon size={12} color={T.drip}/> {qa.bounty}빈 수익빈 지급
                </button>
              )}
              {/* 댓글 없으면 회수 가능 (본인 질문일 때만) */}
              {qa.author_id===currentUserId&&qa.answers.length===0&&(
                <button onClick={()=>onRefund(qa.id)} style={{width:"100%",background:"none",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px",color:T.muted,fontSize:12,cursor:"pointer",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.target.style.borderColor=T.red} onMouseLeave={e=>e.target.style.borderColor=T.border}>
                  ↩ 질문 취소 · {qa.bounty}빈 환불
                </button>
              )}
              {qa.author_id===currentUserId&&qa.answers.length>0&&(
                <div style={{textAlign:"center",fontSize:11,color:T.muted,padding:"4px 0"}}>
                  💬 댓글이 달려 빈 회수 불가 · 반드시 베스트 답변을 채택해주세요
                </div>
              )}
            </div>
          )
        ):(
          <div style={{textAlign:"center",padding:"9px",background:T.greenBg,borderRadius:7,fontSize:13,color:T.green,fontWeight:500}}>✅ 답변 등록 완료 — 채택되면 수익빈으로 지급돼요!</div>
        )
      )}
    </div>
  );
}
/* ── Onboarding & Auth ──────────────────────── */
const SLIDES = [
  { icon:"☕", title:"커피 한 잔으로\n시작하는 커리어",    desc:"현직자와 직접 만나 솔직한 이야기를 나눠보세요." },
  { icon:"📄", title:"내 레주메,\n현직자에게 점검받기",   desc:"실제 채용 담당자에게 피드백을 받고 합격률을 높이세요." },
  { icon:"💬", title:"궁금한 건\n빈으로 질문하기",        desc:"현상금을 걸고 질문하면 현직자가 직접 답변해드려요." },
];

function OnboardingScreen({onDone}) {
  const [slide,setSlide]=useState(0);
  const s=SLIDES[slide];
  const isLast=slide===SLIDES.length-1;
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"60px 32px 48px"}}>
      <BrewLogo size="md"/>
      <div style={{textAlign:"center",maxWidth:340}}>
        <div style={{fontSize:72,marginBottom:28,lineHeight:1}}>{s.icon}</div>
        <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:T.heading,fontWeight:400,lineHeight:1.3,marginBottom:14,whiteSpace:"pre-line"}}>{s.title}</h1>
        <p style={{fontSize:15,color:T.muted,lineHeight:1.7}}>{s.desc}</p>
      </div>
      <div style={{width:"100%",maxWidth:340}}>
        <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:28}}>
          {SLIDES.map((_,i)=>(
            <div key={i} onClick={()=>setSlide(i)} style={{width:i===slide?22:7,height:7,borderRadius:4,background:i===slide?T.coffee:T.border,transition:"all 0.3s",cursor:"pointer"}}/>
          ))}
        </div>
        {isLast?(
          <button onClick={onDone} style={{width:"100%",background:T.coffee,border:"none",borderRadius:12,padding:"15px",color:"#fff",fontFamily:"'Instrument Serif',serif",fontSize:17,cursor:"pointer"}}>시작하기</button>
        ):(
          <div style={{display:"flex",gap:10}}>
            <button onClick={onDone} style={{flex:1,background:"none",border:`1px solid ${T.border}`,borderRadius:12,padding:"14px",color:T.muted,fontSize:14,cursor:"pointer"}}>건너뛰기</button>
            <button onClick={()=>setSlide(s=>s+1)} style={{flex:2,background:T.coffee,border:"none",borderRadius:12,padding:"14px",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>다음 →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthScreen({onLogin}) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [pwConfirm,setPwConfirm]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [verified,setVerified]=useState(false); // 이메일 인증 대기 상태

  async function handleSubmit(){
    if(!email.trim()||!pw.trim()){setError("이메일과 비밀번호를 입력해주세요.");return;}
    if(mode==="signup"&&pw!==pwConfirm){setError("비밀번호가 일치하지 않아요.");return;}
    setError("");setLoading(true);
    try {
      // 10초 타임아웃
      const timeout = new Promise((_,reject)=>setTimeout(()=>reject(new Error("timeout")),10000));
      if(mode==="signup"){
        const {error:err} = await Promise.race([
          supabase.auth.signUp({email,password:pw,options:{data:{name:name||email.split("@")[0]}}}),
          timeout
        ]);
        if(err) throw err;
        setVerified(true);
      } else {
        const {data,error:err} = await Promise.race([
          supabase.auth.signInWithPassword({email,password:pw}),
          timeout
        ]);
        if(err) throw err;
        onLogin({name:data.user.user_metadata?.name||email.split("@")[0],email,id:data.user.id});
      }
    } catch(e){
      if(e.message==="timeout") setError("연결 시간이 초과됐어요. 다시 시도해주세요.");
      else if(e.message==="Invalid login credentials") setError("이메일 또는 비밀번호가 틀렸어요.");
      else setError(e.message);
    }
    setLoading(false);
  }

  const inp={width:"100%",border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 16px",fontSize:14,color:T.heading,outline:"none",boxSizing:"border-box",background:T.bg};

  if(verified) return (
    <div style={{minHeight:"100vh",background:T.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>📬</div>
      <BrewLogo size="md"/>
      <h2 style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,color:T.heading,fontWeight:400,marginTop:16,marginBottom:8}}>인증 메일을 보냈어요</h2>
      <p style={{fontSize:14,color:T.muted,lineHeight:1.7,maxWidth:320}}>
        <strong>{email}</strong>로 인증 링크를 보냈어요.<br/>
        메일 확인 후 링크를 클릭하면 로그인돼요.
      </p>
      <button onClick={()=>setVerified(false)} style={{marginTop:24,background:"none",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 24px",color:T.muted,fontSize:13,cursor:"pointer"}}>
        다시 로그인하기
      </button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <BrewLogo size="lg"/>
        <div style={{fontSize:13,color:T.muted,marginTop:6}}>커리어 커피챗 플랫폼</div>
      </div>
      <div style={{width:"100%",maxWidth:400,background:T.bg,borderRadius:16,border:`1px solid ${T.border}`,padding:"28px 28px 24px",boxShadow:"0 4px 24px rgba(107,61,30,0.07)"}}>
        {/* Tab */}
        <div style={{display:"flex",background:T.surface,borderRadius:10,padding:4,marginBottom:22}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,background:mode===m?T.bg:"none",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:mode===m?600:400,color:mode===m?T.heading:T.muted,cursor:"pointer",transition:"all 0.15s"}}>
              {m==="login"?"로그인":"회원가입"}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {mode==="signup"&&(
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={inp}
              onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
          )}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" style={inp}
            onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" style={inp}
            onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          {mode==="signup"&&(
            <input type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} placeholder="비밀번호 확인" style={inp}
              onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          )}
          {error&&<p style={{fontSize:12,color:T.red,margin:0}}>{error}</p>}
          <button onClick={handleSubmit} disabled={loading} style={{background:loading?T.tag:T.coffee,border:"none",borderRadius:10,padding:"13px",color:loading?T.muted:"#fff",fontWeight:600,fontSize:14,cursor:loading?"not-allowed":"pointer",marginTop:4}}>
            {loading?"처리 중…":mode==="login"?"로그인하기":"가입하기"}
          </button>
        </div>
        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0"}}>
          <div style={{flex:1,height:1,background:T.border}}/>
          <span style={{fontSize:12,color:T.muted}}>또는</span>
          <div style={{flex:1,height:1,background:T.border}}/>
        </div>
        {/* Kakao - 준비 중 */}
        <button disabled style={{width:"100%",background:"#f5f5f5",border:"1px solid #e0e0e0",borderRadius:10,padding:"13px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"not-allowed",fontSize:14,fontWeight:600,color:"#aaa"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#aaa"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.58 5.08 4 6.58L5 21l4.28-2.42C10.14 18.84 11.05 19 12 19c5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/></svg>
          카카오 로그인 (준비 중)
        </button>
        {mode==="login"&&(
          <p style={{textAlign:"center",fontSize:12,color:T.muted,marginTop:14,cursor:"pointer"}} onClick={()=>setMode("signup")}>
            아직 계정이 없으신가요? <span style={{color:T.coffee,fontWeight:600}}>회원가입</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── 브라우저 알림 ────────────────────────────────
async function requestNotificationPermission() {
  if(!("Notification" in window)) return false;
  if(Notification.permission==="granted") return true;
  const permission = await Notification.requestPermission();
  return permission==="granted";
}

function sendNotification(title, body) {
  if(Notification.permission==="granted"){
    new Notification(title, {body, icon:"/favicon.ico"});
  }
}

/* ── My Page ─────────────────────────────────── */
function MyPage({onClose,user,purchasedBeans,earnedBeans,bankAccount,onWithdraw,onCharge}) {
  const [tab,setTab]=useState("beans");
  const [feedbackOpen,setFeedbackOpen]=useState(false);
  const [feedbackText,setFeedbackText]=useState("");
  const [feedbackSent,setFeedbackSent]=useState(false);
  const [chatHistory]=useState([
    {id:1,name:"김지수",role:"Product Manager",company:"카카오",date:"2025.04.20",status:"답변대기"},
    {id:2,name:"오재원",role:"Data Scientist",company:"네이버",date:"2025.04.18",status:"완료"},
  ]);
  const [resumeHistory]=useState([
    {id:1,role:"Product Manager",company:"카카오",date:"2025.04.19",status:"피드백 완료",rating:5},
    {id:2,role:"Senior Engineer",company:"토스",date:"2025.04.15",status:"검토 중",rating:null},
  ]);
  const [answerHistory]=useState([
    {id:1,question:"카카오 PM 최종면접 준비할 때 가장 중요한 게 뭔가요?",bounty:3,status:"채택 대기",adopted:false,date:"2025.04.21"},
    {id:2,question:"토스 개발자로 이직할 때 코딩테스트 난이도가 어떤가요?",bounty:5,status:"채택됨",adopted:true,date:"2025.04.19"},
  ]);

  const tabStyle=(id)=>({
    flex:1,background:"none",border:"none",padding:"10px",fontSize:13,
    fontWeight:tab===id?600:400,color:tab===id?T.coffee:T.muted,
    cursor:"pointer",borderBottom:tab===id?`2px solid ${T.coffee}`:"2px solid transparent",
  });

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",zIndex:1000}} onClick={onClose}>
      <div style={{background:T.bg,height:"100vh",width:"100%",maxWidth:360,overflowY:"auto",boxShadow:"-4px 0 24px rgba(28,20,16,0.15)",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{background:T.coffee,padding:"32px 24px 24px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer"}}>← 닫기</button>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setFeedbackOpen(true)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>불편사항 접수</button>
              <button onClick={async()=>{await supabase.auth.signOut();window.location.reload();}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer"}}>로그아웃</button>
            </div>
          </div>

          {/* 불편사항 접수 폼 */}
          {feedbackOpen&&(
            <div style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"14px",marginBottom:14}}>
              {feedbackSent?(
                <p style={{fontSize:13,color:"#fff",textAlign:"center"}}>✅ 접수됐어요. 소중한 의견 감사해요!</p>
              ):(
                <>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginBottom:8}}>불편하셨던 점을 알려주세요</p>
                  <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="어떤 점이 불편하셨나요?" rows={3}
                    style={{width:"100%",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:7,padding:"8px 10px",fontSize:12,color:"#fff",resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <button onClick={async()=>{
                      if(!feedbackText.trim()) return;
                      await supabase.from("bean_transactions").insert({
                        user_id:user?.id, type:"feedback", amount:0,
                        description:`[불편사항] ${feedbackText}`
                      });
                      setFeedbackSent(true);
                      setFeedbackText("");
                    }} style={{flex:1,background:"#fff",border:"none",borderRadius:7,padding:"8px",color:T.coffee,fontWeight:600,fontSize:12,cursor:"pointer"}}>
                      접수하기
                    </button>
                    <button onClick={()=>{setFeedbackOpen(false);setFeedbackText("");}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:7,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer"}}>취소</button>
                  </div>
                </>
              )}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"'Noto Serif KR',serif",color:"#fff",fontWeight:600}}>
              {user?.name?.[0]||"U"}
            </div>
            <div>
              <div style={{color:"#fff",fontWeight:600,fontSize:16}}>{user?.name||"사용자"}</div>
              <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginTop:2}}>{user?.email}</div>
            </div>
          </div>
          {/* 빈 요약 */}
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <div style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:3}}>구매빈</div>
              <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>🫘 {purchasedBeans}</div>
            </div>
            <div style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:3}}>수익빈</div>
              <div style={{fontSize:18,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:4}}><DripIcon size={16} color="#fff"/> {earnedBeans}</div>
            </div>
          </div>
          {/* 현금 전환 버튼 — 항상 표시 */}
          <div style={{marginTop:10}}>
            <button onClick={()=>{onClose();onWithdraw();}} style={{width:"100%",background:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,color:T.coffee,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <DripIcon size={14}/> 현금으로 전환하기
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <button style={tabStyle("beans")} onClick={()=>setTab("beans")}>빈</button>
          <button style={tabStyle("coffee")} onClick={()=>setTab("coffee")}>☕</button>
          <button style={tabStyle("resume")} onClick={()=>setTab("resume")}>📄</button>
          <button style={tabStyle("answers")} onClick={()=>setTab("answers")}>✏️</button>
        </div>

        {/* Content */}
        <div style={{flex:1,padding:"20px 24px",overflowY:"auto"}}>

          {/* 빈 현황 */}
          {tab==="beans"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:T.surface,borderRadius:10,padding:"16px",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,color:T.muted,marginBottom:10,fontWeight:500}}>빈 종류 안내</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span>🫘</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:T.heading}}>구매빈</div>
                        <div style={{fontSize:11,color:T.muted}}>서비스 이용 전용</div>
                      </div>
                    </div>
                    <div style={{fontSize:18,fontWeight:700,color:T.coffee}}>{purchasedBeans}빈</div>
                  </div>
                  <div style={{height:1,background:T.border}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <DripIcon size={18}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:T.drip}}>수익빈</div>
                        <div style={{fontSize:11,color:T.muted}}>출금 전용</div>
                      </div>
                    </div>
                    <div style={{fontSize:18,fontWeight:700,color:T.drip}}>{earnedBeans}빈</div>
                  </div>
                  <div style={{height:1,background:T.border}}/>
                </div>
              </div>
            </div>
          )}

          {/* 커피챗 내역 */}
          {tab==="coffee"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:12,color:T.muted,marginBottom:4}}>총 {chatHistory.length}건</div>
              {chatHistory.map(c=>(
                <div key={c.id} style={{background:T.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:T.heading}}>{c.name}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>{c.role} · {c.company}</div>
                    </div>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600,background:c.status==="완료"?T.greenBg:T.tag,color:c.status==="완료"?T.green:T.tagText}}>{c.status}</span>
                  </div>
                  <div style={{fontSize:11,color:T.muted,marginTop:8}}>{c.date} · 5빈 사용</div>
                </div>
              ))}
            </div>
          )}

          {/* 레주메 내역 */}
          {tab==="resume"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:12,color:T.muted,marginBottom:4}}>총 {resumeHistory.length}건</div>
              {resumeHistory.map(r=>(
                <div key={r.id} style={{background:T.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:T.heading}}>{r.role}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>{r.company}</div>
                    </div>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600,background:r.status==="피드백 완료"?T.greenBg:T.tag,color:r.status==="피드백 완료"?T.green:T.tagText}}>{r.status}</span>
                  </div>
                  {r.rating&&<div style={{fontSize:12,color:"#f5a623",marginTop:6}}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>}
                  <div style={{fontSize:11,color:T.muted,marginTop:6}}>{r.date}</div>
                </div>
              ))}
            </div>
          )}

          {/* 내 답변 내역 */}
          {tab==="answers"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:12,color:T.muted,marginBottom:4}}>총 {answerHistory.length}건 · 채택 시 수익빈 지급</div>
              {answerHistory.map(a=>(
                <div key={a.id} style={{background:T.surface,borderRadius:10,padding:"14px 16px",border:`1px solid ${a.adopted?T.green:T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                    <p style={{fontSize:13,color:T.heading,lineHeight:1.5,flex:1}}>{a.question}</p>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap",flexShrink:0,background:a.adopted?T.greenBg:T.tag,color:a.adopted?T.green:T.tagText}}>
                      {a.adopted?"⭐ 채택됨":"대기 중"}
                    </span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                    <span style={{fontSize:11,color:T.muted}}>{a.date}</span>
                    {a.adopted
                      ?<span style={{fontSize:11,color:T.drip,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><DripIcon size={11}/> {a.bounty}빈 수익빈 지급</span>
                      :<span style={{fontSize:11,color:T.muted}}>채택 시 🫘 {a.bounty}빈</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Admin Panel ─────────────────────────────── */
function AdminPanel({onClose}) {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedUser,setSelectedUser]=useState(null);
  const [beanAmount,setBeanAmount]=useState("");
  const [beanType,setBeanType]=useState("purchased");
  const [done,setDone]=useState("");
  const [search,setSearch]=useState("");

  const [feedbacks,setFeedbacks]=useState([]);

  useEffect(()=>{
    async function load(){
      const {data}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});
      if(data) setUsers(data);
      const {data:fb}=await supabase.from("bean_transactions")
        .select("*").eq("type","feedback").order("created_at",{ascending:false}).limit(20);
      if(fb) setFeedbacks(fb);
      setLoading(false);
    }
    load();
  },[]);

  async function handleGiveBeans(){
    if(!selectedUser||!beanAmount||parseInt(beanAmount)<=0) return;
    const amount=parseInt(beanAmount);
    const col=beanType==="purchased"?"purchased_beans":"earned_beans";
    const current=selectedUser[col]||0;
    await supabase.from("profiles").update({[col]:current+amount}).eq("id",selectedUser.id);
    await supabase.from("bean_transactions").insert({
      user_id:selectedUser.id,
      type:"charge",
      amount,
      description:`관리자 지급 (${beanType==="purchased"?"구매빈":"수익빈"})`,
    });
    setDone(`✅ ${selectedUser.email}에게 ${beanType==="purchased"?"구매빈":"수익빈"} ${amount}빈 지급 완료!`);
    setUsers(us=>us.map(u=>u.id===selectedUser.id?{...u,[col]:current+amount}:u));
    setSelectedUser(u=>({...u,[col]:current+amount}));
    setBeanAmount("");
  }

  const filtered=users.filter(u=>u.email?.includes(search)||u.name?.includes(search));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,20,16,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,padding:"28px",maxWidth:620,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(28,20,16,0.3)"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <div>
            <div style={{fontSize:10,color:T.coffee,fontWeight:600,letterSpacing:"2px",marginBottom:4}}>ADMIN ONLY</div>
            <h2 style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,color:T.heading,fontWeight:400}}>관리자 패널</h2>
          </div>
          <button onClick={onClose} style={{background:T.tag,border:"none",borderRadius:20,padding:"6px 14px",fontSize:13,color:T.body,cursor:"pointer"}}>닫기</button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:22}}>
          {[
            {label:"총 가입자",value:`${users.length}명`},
            {label:"인증 완료",value:`${users.filter(u=>u.verified).length}명`},
            {label:"오늘 가입",value:`${users.filter(u=>new Date(u.created_at).toDateString()===new Date().toDateString()).length}명`},
          ].map(s=>(
            <div key={s.label} style={{background:T.surface,borderRadius:10,padding:"14px 16px",textAlign:"center",border:`1px solid ${T.border}`}}>
              <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,color:T.coffee,fontWeight:400}}>{s.value}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{height:1,background:T.border,marginBottom:20}}/>

        {/* Bean 지급 */}
        <h3 style={{fontSize:14,fontWeight:600,color:T.heading,marginBottom:14}}>🫘 빈 지급</h3>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름 또는 이메일 검색"
          style={{width:"100%",border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 13px",fontSize:13,color:T.heading,outline:"none",boxSizing:"border-box",marginBottom:10}}
          onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>

        {/* User list */}
        <div style={{maxHeight:180,overflowY:"auto",border:`1px solid ${T.border}`,borderRadius:8,marginBottom:14}}>
          {loading?(
            <div style={{padding:"16px",textAlign:"center",color:T.muted,fontSize:13}}>불러오는 중…</div>
          ):filtered.map(u=>(
            <div key={u.id} onClick={()=>setSelectedUser(u)} style={{
              padding:"10px 14px",cursor:"pointer",
              background:selectedUser?.id===u.id?T.tag:"none",
              borderBottom:`1px solid ${T.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center",
              transition:"background 0.1s",
            }}>
              <div>
                <div style={{fontSize:13,fontWeight:selectedUser?.id===u.id?600:400,color:T.heading}}>{u.name||"이름없음"}</div>
                <div style={{fontSize:11,color:T.muted}}>{u.email}</div>
              </div>
              <div style={{fontSize:11,color:T.muted,textAlign:"right"}}>
                <div>🫘 {u.purchased_beans||0}</div>
                <div style={{color:T.drip,display:"flex",alignItems:"center",gap:2}}><DripIcon size={10}/> {u.earned_beans||0}</div>
              </div>
            </div>
          ))}
        </div>

        {selectedUser&&(
          <div style={{background:T.surface,borderRadius:10,padding:"14px 16px",marginBottom:14,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:13,fontWeight:600,color:T.heading,marginBottom:10}}>
              {selectedUser.name} ({selectedUser.email}) 에게 빈 지급
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <button onClick={()=>setBeanType("purchased")} style={{flex:1,background:beanType==="purchased"?T.coffee:T.tag,border:"none",borderRadius:7,padding:"8px",fontSize:12,fontWeight:600,color:beanType==="purchased"?"#fff":T.tagText,cursor:"pointer"}}>🫘 구매빈</button>
              <button onClick={()=>setBeanType("earned")} style={{flex:1,background:beanType==="earned"?T.coffee:T.tag,border:"none",borderRadius:7,padding:"8px",fontSize:12,fontWeight:600,color:beanType==="earned"?"#fff":T.tagText,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><DripIcon size={12} color={beanType==="earned"?"#fff":T.coffee}/> 수익빈</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input type="number" value={beanAmount} onChange={e=>setBeanAmount(e.target.value)} placeholder="지급할 빈 수"
                style={{flex:1,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 13px",fontSize:13,color:T.heading,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=T.coffee} onBlur={e=>e.target.style.borderColor=T.border}/>
              <button onClick={handleGiveBeans} disabled={!beanAmount||parseInt(beanAmount)<=0} style={{background:beanAmount&&parseInt(beanAmount)>0?T.coffee:T.tag,border:"none",borderRadius:7,padding:"9px 18px",color:beanAmount&&parseInt(beanAmount)>0?"#fff":T.muted,fontWeight:600,fontSize:13,cursor:"pointer"}}>지급</button>
            </div>
            {done&&<div style={{marginTop:8,fontSize:12,color:T.green,fontWeight:500}}>{done}</div>}
          </div>
        )}

        {/* 불편사항 */}
        {feedbacks.length>0&&(
          <>
            <div style={{height:1,background:T.border,margin:"20px 0"}}/>
            <h3 style={{fontSize:14,fontWeight:600,color:T.heading,marginBottom:12}}>📋 불편사항 접수 내역</h3>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {feedbacks.map(fb=>(
                <div key={fb.id} style={{background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:12,color:T.body,lineHeight:1.6}}>{fb.description?.replace("[불편사항] ","")}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:4}}>{new Date(fb.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export default function App() {
  // 결제 성공/실패 페이지 라우팅
  const path = window.location.pathname;
  if (path === "/payment/success") return <PaymentSuccess/>;
  if (path === "/payment/fail")    return <PaymentFail/>;

  const [screen,setScreen]=useState(()=>{
    try { return localStorage.getItem("brew_onboarded") ? "auth" : "onboarding"; }
    catch { return "onboarding"; }
  });
  const [currentUser,setCurrentUser]=useState(null);

  // Supabase 세션 자동 복원 — 앱 껐다 켜도 로그인 유지
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){
        setCurrentUser({
          name: session.user.user_metadata?.name || session.user.email.split("@")[0],
          email: session.user.email,
          id: session.user.id
        });
        setScreen("main");
      }
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      if(session?.user){
        setCurrentUser({
          name: session.user.user_metadata?.name || session.user.email.split("@")[0],
          email: session.user.email,
          id: session.user.id
        });
        setScreen("main");
      } else {
        setCurrentUser(null);
        setScreen("auth");
      }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  function handleOnboardingDone(){
    try { localStorage.setItem("brew_onboarded","1"); } catch {}
    setScreen("auth");
  }

  function handleLogin(user){setCurrentUser(user);setScreen("main");}

  if(screen==="onboarding") return <><style>{FONTS}</style><OnboardingScreen onDone={handleOnboardingDone}/></>;
  if(screen==="auth") return <><style>{FONTS}</style><AuthScreen onLogin={handleLogin}/></>;

  return <MainApp user={currentUser}/>;
}

function MainApp({user}) {
  const [tab,setTab]=useState("chat");
  const [profiles,setProfiles]=useState([]);
  const [reviewers,setReviewers]=useState([]);
  const [qaList,setQaList]=useState([]);
  const [loading,setLoading]=useState(true);
  const [askModal,setAskModal]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);

  const [purchasedBeans,setPurchasedBeans]=useState(0);
  const [earnedBeans,setEarnedBeans]=useState(0);

  const [userVerified,setUserVerified]=useState(false);
  const [bankAccount,setBankAccount]=useState("");

  const [beanModal,setBeanModal]=useState(false);
  const [withdrawModal,setWithdrawModal]=useState(false);
  const [signupModal,setSignupModal]=useState(false);
  const [revRegModal,setRevRegModal]=useState(false);
  const [adminModal,setAdminModal]=useState(false);
  const [myPageModal,setMyPageModal]=useState(false);

  const [filter,setFilter]=useState("전체");
  const [viewCount,setViewCount]=useState(0);

  // ── Supabase 데이터 로드 ──────────────────────
  useEffect(()=>{
    async function loadAll(){
      setLoading(true);
      try {
        // 유저 프로필 (빈 잔액, 인증 여부)
        const {data:profile} = await supabase
          .from("profiles").select("*").eq("id",user.id).single();
        if(profile){
          setPurchasedBeans(profile.purchased_beans||0);
          setEarnedBeans(profile.earned_beans||0);
          setUserVerified(profile.verified||false);
          setBankAccount(profile.bank_account||"");
          setViewCount(profile.view_count||0);
          setIsAdmin(profile.is_admin||false);
        }

        // 커피챗 프로필
        const {data:chats} = await supabase
          .from("chat_profiles").select("*").order("created_at",{ascending:false});
        if(chats) setProfiles(chats.map(p=>({
          ...p, unlocked:false, initial:p.name?.[0]||"?",
        })));

        // 레주메 리뷰어
        const {data:revs} = await supabase
          .from("reviewers").select("*").order("created_at",{ascending:false});
        if(revs) setReviewers(revs.map(r=>({
          ...r, tags:r.tags||[], rating:r.rating||5.0, reviews:r.review_count||0,
        })));

        // Q&A
        const {data:qs} = await supabase
          .from("questions").select("*, answers(*)").order("created_at",{ascending:false});
        if(qs) setQaList(qs.map(q=>({
          ...q, initial:q.author_id===user.id?"나":"?",
          author:q.author_id===user.id?"나":"익명",
          createdAt: new Date(q.created_at).toLocaleDateString("ko-KR"),
          answers:(q.answers||[]).map(a=>({
            ...a, initial:"?", author:"익명", verified:false,
          })),
        })));

      } catch(e){
        console.error("loadAll error:", e);
      } finally {
        setLoading(false); // 에러나도 반드시 로딩 해제
      }
    }

    if(user?.id){
      loadAll();
      requestNotificationPermission(); // 로그인 시 알림 권한 요청
    } else {
      setLoading(false);
    }
  },[user?.id]);

  // ── 빈 차감 — 구매빈만 사용, 부족하면 충전 모달 ──
  async function spendBeans(amount){
    if(purchasedBeans < amount){
      setBeanModal(true);
      return false; // 실패
    }
    try {
      await supabase.from("profiles")
        .update({purchased_beans: purchasedBeans - amount})
        .eq("id", user.id);
      await supabase.from("bean_transactions").insert({
        user_id: user.id, type:"spend", amount,
        description:`서비스 이용 (${amount}빈)`,
      });
      setPurchasedBeans(pb => pb - amount);
      return true; // 성공
    } catch(e){
      console.error(e);
      return false;
    }
  }

  // ── 핸들러들 ─────────────────────────────────
  function handleUnlock(id){
    const isFree=viewCount<FREE_VIEWS;
    if(!isFree&&purchasedBeans<BEANS_PER_VIEW){setBeanModal(true);return;}
    setProfiles(ps=>ps.map(p=>p.id===id?{...p,unlocked:true}:p));
    const newCount=viewCount+1;
    setViewCount(newCount);
    // DB에 view_count 업데이트
    supabase.from("profiles").update({view_count:newCount}).eq("id",user.id);
    if(!isFree) spendBeans(BEANS_PER_VIEW);
  }

  async function handleSend(){
    if(purchasedBeans<BEANS_PER_SEND){setBeanModal(true);return false;}
    const ok = await spendBeans(BEANS_PER_SEND);
    return ok;
  }

  async function handleReviewReq(price, reviewerId){
    if(purchasedBeans<price){setBeanModal(true);return false;}
    const ok = await spendBeans(price);
    if(ok && reviewerId){
      const payout = Math.floor(price * 0.9); // 10% 플랫폼 운영비
      await supabase.rpc("add_earned_beans",{user_id:reviewerId, amount:payout});
    }
    return ok;
  }

  function handleBuy(pkg){
    setPurchasedBeans(pb=>pb+pkg.beans);
    setBeanModal(false);
  }

  function handleWithdraw(amount){
    setEarnedBeans(eb=>eb-amount);
    supabase.from("profiles")
      .update({earned_beans:earnedBeans-amount})
      .eq("id",user.id);
    setWithdrawModal(false);
  }

  async function handleAskSubmit({question,industry,bounty}){
    if(purchasedBeans<bounty){setBeanModal(true);return;}
    const ok = await spendBeans(bounty);
    if(!ok) return;
    const {data} = await supabase.from("questions").insert({
      author_id:user.id, question, industry, bounty
    }).select().single();
    if(data) setQaList(list=>[{
      ...data, initial:"나", author:"나",
      createdAt:"방금 전", answers:[], adopted:false,
    },...list]);
  }

  async function handleAdopt(qaId,ansId){
    await supabase.from("questions").update({adopted:true}).eq("id",qaId);
    await supabase.from("answers").update({adopted:true}).eq("id",ansId);
    const ans = qaList.find(q=>q.id===qaId)?.answers.find(a=>a.id===ansId);
    const qa  = qaList.find(q=>q.id===qaId);
    if(ans?.author_id && qa?.bounty){
      const payout = Math.floor(qa.bounty * 0.9); // 10% 플랫폼 운영비
      await supabase.rpc("add_earned_beans",{user_id:ans.author_id, amount:payout});
    }
    setQaList(list=>list.map(q=>{
      if(q.id!==qaId) return q;
      return {...q,adopted:true,answers:q.answers.map(a=>({...a,adopted:a.id===ansId}))};
    }));
    sendNotification("⭐ 베스트 답변 채택", `${Math.floor(qa?.bounty * 0.9)}빈이 수익빈으로 지급됐어요!`);
  }

  function handleRefund(qaId){
    setQaList(list=>list.map(q=>{
      if(q.id!==qaId||q.answers.length>0) return q;
      setPurchasedBeans(pb=>pb+q.bounty);
      supabase.from("questions").delete().eq("id",qaId);
      return {...q,refunded:true};
    }));
  }

  function handleSignupComplete({verified,bank}){
    if(verified){
      setUserVerified(true);
      if(bank){
        setBankAccount(bank);
        supabase.from("profiles").update({verified:true,bank_account:bank}).eq("id",user.id);
      }
    }
  }

  const filtered=filter==="전체"?profiles:profiles.filter(p=>p.industry===filter);
  const filtQa=(filter==="전체"?qaList:qaList.filter(q=>q.industry===filter)).filter(q=>!q.refunded);
  const sorted=[...filtered];
  const filtRev=filter==="전체"?reviewers:reviewers.filter(r=>r.industry===filter);

  const tabBtn=(id)=>({background:"none",border:"none",padding:"12px 20px",fontSize:14,fontWeight:tab===id?600:400,color:tab===id?T.coffee:T.muted,cursor:"pointer",borderBottom:tab===id?`2px solid ${T.coffee}`:"2px solid transparent",transition:"color 0.15s"});

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>☕</div>
        <p style={{color:T.muted,fontSize:14}}>불러오는 중…</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      <style>{FONTS}</style>

      {/* Header */}
      <header style={{borderBottom:`1px solid ${T.border}`,background:T.bg,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          {/* Logo */}
          <BrewLogo size="sm"/>

          {/* Right controls */}
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {/* Bean wallet — 클릭하면 충전 */}
            <div style={{display:"flex",alignItems:"center",gap:5,background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>setBeanModal(true)}>
              <span>🫘 {purchasedBeans}</span>
              <span style={{color:T.border}}>·</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:2,color:T.drip,fontWeight:600}}><DripIcon size={12}/> {earnedBeans}</span>
            </div>
            {/* User avatar - 클릭하면 마이페이지 */}
            <div onClick={()=>setMyPageModal(true)} style={{width:28,height:28,borderRadius:"50%",background:T.coffee,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,fontFamily:"'Noto Serif KR',serif",flexShrink:0,marginLeft:2,cursor:"pointer"}}>
              {user?.kakao ? user.email.split("@")[0][0].toUpperCase() : user?.name?.[0]||"U"}
            </div>
            {/* 관리자 버튼 — Jake만 보임 */}
            {isAdmin&&(
              <button onClick={()=>setAdminModal(true)} style={{background:T.coffee,border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:600,cursor:"pointer",letterSpacing:"0.5px"}}>
                ⚙️ 관리
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 24px",display:"flex",borderTop:`1px solid ${T.border}`}}>
          <button style={tabBtn("chat")} onClick={()=>setTab("chat")}>☕ 커피챗</button>
          <button style={tabBtn("resume")} onClick={()=>setTab("resume")}>📄 레주메 리뷰</button>
          <button style={tabBtn("qa")} onClick={()=>setTab("qa")}>💬 현직자 Q&A</button>
        </div>
      </header>

      <main style={{maxWidth:960,margin:"0 auto",padding:"32px 24px 60px"}}>

        {/* ── Coffee Chat ── */}
        {tab==="chat"&&(
          <>
            <div style={{marginBottom:20}}>
              <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:T.heading,fontWeight:400,lineHeight:1.25}}>이미 그 길을 걸어간<br/>사람과 커피 한 잔.</h1>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {INDUSTRIES.map(ind=>(
                <button key={ind} onClick={()=>setFilter(ind)} style={{background:filter===ind?T.coffee:T.tag,border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:500,color:filter===ind?"#fff":T.tagText,cursor:"pointer",transition:"all 0.15s"}}>{ind}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
              {sorted.map((p,i)=><ProfileCard key={p.id} p={p} onUnlock={handleUnlock} onSend={handleSend} purchasedBeans={purchasedBeans} viewCount={viewCount} index={i}/>)}
            </div>
          </>
        )}

        {/* ── Resume Review ── */}
        {tab==="resume"&&(
          <>
            <div style={{marginBottom:28}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:T.heading,fontWeight:400,lineHeight:1.25,marginBottom:8}}>현직자에게<br/>레주메 피드백 받기.</h1>
                  <p style={{fontSize:14,color:T.muted,lineHeight:1.6}}>
                    명함 + 이메일 인증을 완료한 분만 리뷰어로 등록할 수 있어요.
                  </p>
                </div>
                <button onClick={()=>setRevRegModal(true)} style={{background:userVerified?T.coffee:"none",border:`1px solid ${userVerified?T.coffee:T.border}`,borderRadius:20,padding:"8px 18px",color:userVerified?"#fff":T.body,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  {userVerified?"+ 리뷰어 등록":"🔐 리뷰어 등록 (인증 필요)"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {INDUSTRIES.map(ind=>(
                <button key={ind} onClick={()=>setFilter(ind)} style={{background:filter===ind?T.coffee:T.tag,border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:500,color:filter===ind?"#fff":T.tagText,cursor:"pointer",transition:"all 0.15s"}}>{ind}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
              {filtRev.map((r,i)=><ReviewerCard key={r.id} r={r} onRequest={handleReviewReq} onBuyBeans={()=>setBeanModal(true)} purchasedBeans={purchasedBeans} index={i} userVerified={userVerified}/>)}
            </div>
          </>
        )}

        {/* ── Q&A ── */}
        {tab==="qa"&&(
          <>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
              <div>
                <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:30,color:T.heading,fontWeight:400,lineHeight:1.25,marginBottom:6}}>현직자에게<br/>직접 물어보세요.</h1>
                <p style={{fontSize:13,color:T.muted}}>베스트 답변을 채택하면 답변자에게 수익빈이 지급돼요.</p>
              </div>
              <button onClick={()=>setAskModal(true)} style={{background:T.coffee,border:"none",borderRadius:20,padding:"9px 20px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>✏️ 질문 등록</button>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {INDUSTRIES.map(ind=>(
                <button key={ind} onClick={()=>setFilter(ind)} style={{background:filter===ind?T.coffee:T.tag,border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:500,color:filter===ind?"#fff":T.tagText,cursor:"pointer",transition:"all 0.15s"}}>{ind}</button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {filtQa.filter(qa=>!qa.refunded).map((qa,i)=><QACard key={qa.id} qa={qa} onAdopt={handleAdopt} onRefund={handleRefund} index={i} currentUserId={user?.id}/>)}
            </div>
          </>
        )}

      </main>

      {beanModal    &&<BeanModal onClose={()=>setBeanModal(false)} onBuy={handleBuy} user={user}/>}
      {withdrawModal&&<WithdrawModal earnedBeans={earnedBeans} bankAccount={bankAccount} onClose={()=>setWithdrawModal(false)} onWithdraw={handleWithdraw}/>}
      {signupModal  &&<SignupModal onClose={()=>setSignupModal(false)} onComplete={handleSignupComplete}/>}
      {revRegModal  &&<RegisterReviewerModal onClose={()=>setRevRegModal(false)} onRegister={()=>{}} userVerified={userVerified} onGoVerify={()=>{setRevRegModal(false);setSignupModal(true);}}/>}
      {askModal     &&<AskModal onClose={()=>setAskModal(false)} onSubmit={handleAskSubmit} purchasedBeans={purchasedBeans} onBuyBeans={()=>{setAskModal(false);setBeanModal(true);}}/>}
      {adminModal   &&<AdminPanel onClose={()=>setAdminModal(false)}/>}
      {myPageModal  &&<MyPage onClose={()=>setMyPageModal(false)} user={user} purchasedBeans={purchasedBeans} earnedBeans={earnedBeans} bankAccount={bankAccount} onWithdraw={()=>setWithdrawModal(true)} onCharge={()=>setBeanModal(true)}/>}
    </div>
  );
}