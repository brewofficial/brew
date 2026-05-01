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
  const [tab,setTab]=useState("beans"); // beans | coffee | resume | answers
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
            <button onClick={async()=>{await supabase.auth.signOut();window.location.reload();}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer"}}>로그아웃</button>
          </div>
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
                        <div style={{fontSize:11,color:T.muted}}>서비스 이용 + 출금 가능</div>
                      </div>
                    </div>
                    <div style={{fontSize:18,fontWeight:700,color:T.drip}}>{earnedBeans}빈</div>
                  </div>
                  <div style={{height:1,background:T.border}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.heading}}>합계</div>
                    <div style={{fontSize:18,fontWeight:700,color:T.heading}}>{purchasedBeans+earnedBeans}빈</div>
                  </div>
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

  useEffect(()=>{
    async function load(){
      const {data}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});
      if(data) setUsers(data);
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
    if(!user?.id) return;
    async function loadAll(){
      setLoading(true);
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

  async function handleReviewReq(price){
    if(purchasedBeans<price){setBeanModal(true);return false;}
    return await spendBeans(price);
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
      await supabase.rpc("add_earned_beans",{user_id:ans.author_id, amount:qa.bounty});
    }
    setQaList(list=>list.map(q=>{
      if(q.id!==qaId) return q;
      return {...q,adopted:true,answers:q.answers.map(a=>({...a,adopted:a.id===ansId}))};
    }));
    sendNotification("⭐ 베스트 답변 채택", `${qa?.bounty}빈이 수익빈으로 지급됐어요!`);
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
          <button style={tabBtn("qa")} onClick={()=>setTab("qa")}>💬 Q&A</button>
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
                <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:T.heading,fontWeight:400,lineHeight:1.25,marginBottom:6}}>현직자에게<br/>질문하고 빈으로 보상.</h1>
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