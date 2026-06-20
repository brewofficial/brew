import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const T = {
  bg:"#ffffff", surface:"#fafaf9", border:"#e8e2db",
  muted:"#a89880", heading:"#1c1410",
  coffee:"#6b3d1e", tag:"#f3ede6",
  green:"#2d7a4f", greenBg:"#edf7f1",
  red:"#c0392b",
};

export function PaymentSuccess() {
  const [status, setStatus] = useState("loading");
  const params = new URLSearchParams(window.location.search);
  const paymentKey = params.get("paymentKey");
  const orderId    = params.get("orderId");
  const amount     = parseInt(params.get("amount"));
  const beans      = parseInt(params.get("beans"));
  const label      = params.get("label");

  useEffect(() => {
    async function confirm() {
      try {
        // 토스 결제 승인
        const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(process.env.REACT_APP_TOSS_SECRET_KEY + ":")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        if (!res.ok) throw new Error("결제 승인 실패");

        // Supabase에 빈 추가
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc("add_purchased_beans", { user_id: user.id, amount: beans });
          await supabase.from("bean_transactions").insert({
            user_id: user.id,
            type: "charge",
            amount: beans,
            description: `${label} 충전 (₩${amount.toLocaleString()})`,
            payment_key: paymentKey,
            order_id: orderId,
          });
        }
        setStatus("success");
      } catch(e) {
        console.error(e);
        setStatus("error");
      }
    }
    if (paymentKey && orderId && amount) confirm();
    else setStatus("error");
  }, []);

  if (status === "loading") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}>
      <p style={{color:T.muted,fontSize:14}}>결제 처리 중…</p>
    </div>
  );

  if (status === "success") return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,padding:24,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16}}>☕</div>
      <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:24,color:T.heading,fontWeight:400,marginBottom:8}}>충전 완료!</h1>
      <p style={{fontSize:14,color:T.muted,marginBottom:6}}><strong style={{color:T.coffee}}>🫘 {beans}빈</strong>이 충전됐어요.</p>
      <p style={{fontSize:13,color:T.muted,marginBottom:28}}>₩{amount?.toLocaleString()} 결제 완료</p>
      <button onClick={()=>window.location.href="/"} style={{background:T.coffee,border:"none",borderRadius:10,padding:"12px 28px",color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer"}}>
        브루로 돌아가기
      </button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,padding:24,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16}}>❌</div>
      <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,color:T.heading,fontWeight:400,marginBottom:8}}>결제 처리 중 오류가 발생했어요</h1>
      <p style={{fontSize:13,color:T.muted,marginBottom:24}}>고객센터에 문의해주세요.</p>
      <button onClick={()=>window.location.href="/"} style={{background:T.coffee,border:"none",borderRadius:10,padding:"12px 28px",color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer"}}>
        돌아가기
      </button>
    </div>
  );
}

export function PaymentFail() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("message") || "결제가 취소됐어요.";
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,padding:24,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16}}>😔</div>
      <h1 style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,color:T.heading,fontWeight:400,marginBottom:8}}>결제가 완료되지 않았어요</h1>
      <p style={{fontSize:13,color:T.muted,marginBottom:24}}>{message}</p>
      <button onClick={()=>window.location.href="/"} style={{background:T.coffee,border:"none",borderRadius:10,padding:"12px 28px",color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer"}}>
        돌아가기
      </button>
    </div>
  );
}