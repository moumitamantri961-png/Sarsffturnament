import React, { useState, useEffect, useRef } from "react";

export default function App() {
  // Configurable date from the HTML config comments
  const TOURNAMENT_DATE = new Date("2025-05-21T10:00:00+05:30"); // IST

  // --- Countdown States ---
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00"
  });

  // --- Accordion States ---
  const [openAccordion, setOpenAccordion] = useState<number>(1); // Index of open accordion (1-indexed based on original html)

  // --- Particle Canvas Ref ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Parallax Card Ref ---
  const posterRef = useRef<HTMLDivElement | null>(null);

  // --- Spotlight Coordinate tracking ---
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({
    "--mx": "50%",
    "--my": "30%",
  } as React.CSSProperties);

  // --- Intersection Observer (Reveal on scroll) ---
  const revealRefs = useRef<Array<HTMLDivElement | null>>([]);

  // --- LocalStorage Editable texts ---
  const [editableTexts, setEditableTexts] = useState<{ [key: string]: string }>({});

  // Initialize and load editable fields
  useEffect(() => {
    const loaded: { [key: string]: string } = {};
    for (let i = 0; i < 6; i++) {
      const key = "fft-edit-" + i;
      const saved = localStorage.getItem(key);
      if (saved) {
        loaded[key] = saved;
      }
    }
    setEditableTexts(loaded);
  }, []);

  const handleEditableBlur = (index: number, content: string | undefined) => {
    if (content === undefined) return;
    const key = "fft-edit-" + index;
    localStorage.setItem(key, content);
    setEditableTexts(prev => ({ ...prev, [key]: content }));
  };

  // 1. Tick Countdown useEffect
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = TOURNAMENT_DATE.getTime() - now;
      if (diff <= 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      let tempDiff = diff;
      const d = Math.floor(tempDiff / 86400000);
      tempDiff -= d * 86400000;
      const h = Math.floor(tempDiff / 3600000);
      tempDiff -= h * 3600000;
      const m = Math.floor(tempDiff / 60000);
      tempDiff -= m * 60000;
      const s = Math.floor(tempDiff / 1000);

      setCountdown({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0")
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Spotlight mouse interaction
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      setSpotlightStyle({
        "--mx": `${e.clientX}px`,
        "--my": `${e.clientY}px`
      } as React.CSSProperties);
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  // 3. Parallax Card Tilt
  const handleArtMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const poster = posterRef.current;
    if (!poster) return;
    const r = poster.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    poster.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateZ(0)`;
  };

  const handleArtMouseLeave = () => {
    const poster = posterRef.current;
    if (!poster) return;
    poster.style.transform = "";
  };

  // 4. Particle System (Glowing subtle embers matching gold theme)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleCount = 55;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.15 - Math.random() * 0.35,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.6 + 0.25
    }));

    let animationId: number;
    const pTick = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,193,55,${p.a})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(pTick);
    };

    pTick();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 5. Scroll Reveal intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Soft smooth scroll anchor clicker
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (targetId === "#") return;
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getEditableValue = (index: number, defaultValue: string) => {
    const key = "fft-edit-" + index;
    return editableTexts[key] !== undefined ? editableTexts[key] : defaultValue;
  };

  return (
    <>
      {/* Spotlight Effect container */}
      <div id="spotlight" style={spotlightStyle}></div>

      {/* Sparks Canvas Background */}
      <canvas id="particles" ref={canvasRef}></canvas>

      {/* Nav Menu */}
      <nav className="nav">
        <div className="nav-inner">
          <a
            href="#top"
            onClick={(e) => handleAnchorClick(e, "#top")}
            className="brand"
            style={{ cursor: "pointer", textDecoration: "none" }}
          >
            <div className="brand-mark">ST</div>
            <div className="brand-text"><b>SARS</b> • TOURNAMENT</div>
          </a>
          <div className="nav-right">SEASON <span>01</span> • INDIA</div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero" id="top">
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">FREE FIRE ESPORTS • INVITE ONLY</div>
            <h1>
              <span className="thin">SARS</span>
              <span className="gold">TOURNAMENT</span>
            </h1>
            <p className="hero-sub">SHOW YOUR SKILLS. DOMINATE THE BATTLE. A premium, squad-only Battle Royale testing cup. 8 squads. One champion. Pure BR.</p>
            <div className="hero-ctas">
              <a 
                className="btn btn-primary" 
                href="https://wa.me/918695019315?text=Hello!%20I%20want%20to%20register%20my%20squad%20for%20the%20Free%20Fire%20Testing%20Tournament.%20Please%20share%20the%20registration%20details." 
                target="_blank" 
                rel="noopener noreferrer"
              >
                REGISTER NOW →
              </a>
              <a 
                className="btn btn-ghost" 
                href="#rules"
                onClick={(e) => handleAnchorClick(e, "#rules")}
              >
                RULES
              </a>
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--gold)", marginTop: "14px", fontWeight: 500, letterSpacing: "0.05em" }}>
              ওয়েবসাইট খুলতে এখানে চাপুন
            </div>
            <div className="hero-meta">
              <div>ENTRY <b>₹40 / Squad</b></div>
              <div>MODE <b>Squad BR</b></div>
              <div>SLOTS <b>8 / 8</b></div>
            </div>
          </div>

          <div className="poster-wrap reveal in" ref={(el) => { if (el) revealRefs.current[0] = el; }}>
            <div 
              className="poster-frame" 
              id="posterParallax"
              ref={posterRef}
              onMouseMove={handleArtMouseMove}
              onMouseLeave={handleArtMouseLeave}
            >
              <div className="poster-badge">SARS TOURNAMENT</div>
              <div className="poster-tag-r">BR • SQUAD</div>
              <img 
                src="https://i.ibb.co/n8LtnFQ9/file-00000000bff4720b9f962bfec34454ec.png" 
                alt="SARS TOURNAMENT Primary Artwork" 
                referrerPolicy="no-referrer"
                loading="eager" 
                width="460" 
                height="580" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='460' height='580'><rect width='100%' height='100%' fill='%2312121a'/><text x='50%' y='50%' fill='%23FFC327' font-family='sans-serif' font-size='24' text-anchor='middle'>IMAGE NOT FOUND</text></svg>";
                }}
              />
              <div className="poster-bottom">
                <div className="p-left">BOOYAH!<span>WHO'S NEXT?</span></div>
                <div className="p-right">
                  <div className="pill-live"><i></i> LIVE SOON</div>
                  <div style={{ marginTop: "8px", opacity: 0.9 }}>Prize Pool ₹230</div>
                </div>
              </div>
            </div>
            <div className="float-chip left">8 SQUADS ONLY</div>
            <div className="float-chip right">₹40 ENTRY</div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: "1160px", marginTop: "10px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "min(460px, 100%)", marginRight: "calc((100% - 1160px)/2 + 24px)", marginLeft: "auto" }}>
              <div className="countdown" id="countdown" style={{ marginLeft: "auto" }}>
                <div className="cd-box"><div className="cd-num" id="cd-d">{countdown.days}</div><div className="cd-label">Days</div></div>
                <div className="cd-box"><div className="cd-num" id="cd-h">{countdown.hours}</div><div className="cd-label">Hours</div></div>
                <div className="cd-box"><div className="cd-num" id="cd-m">{countdown.minutes}</div><div className="cd-label">Mins</div></div>
                <div className="cd-box"><div className="cd-num" id="cd-s">{countdown.seconds}</div><div className="cd-label">Secs</div></div>
              </div>
              <div style={{ textAlign: "center", color: "#8c8a93", fontSize: "12.4px", marginTop: "8px", letterSpacing: ".04em" }}>
                Starts{" "}
                <span 
                  className="editable" 
                  contentEditable={true} 
                  suppressContentEditableWarning={true}
                  spellCheck={false}
                  onBlur={(e) => handleEditableBlur(0, e.currentTarget.textContent || undefined)}
                >
                  {getEditableValue(0, "21 MAY 2025")}
                </span>{" "}
                •{" "}
                <span 
                  className="editable" 
                  contentEditable={true} 
                  suppressContentEditableWarning={true}
                  spellCheck={false}
                  onBlur={(e) => handleEditableBlur(1, e.currentTarget.textContent || undefined)}
                >
                  {getEditableValue(1, "10:00 AM IST")}
                </span>
                <span style={{ opacity: 0.85, display: "block", marginTop: "4px", color: "var(--gold)" }}>
                  {" "}— ওয়েবসাইট খুলতে এখানে চাপুন (পরিবর্তন করতে ক্লিক করুন)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hr-gold"></div>

      {/* INFO SECTION */}
      <section className="info" id="info">
        <div 
          className="section-bg-art left" 
          style={{ 
            position: "absolute", 
            left: "-10%", 
            bottom: "-5%", 
            height: "95%", 
            width: "auto", 
            opacity: 0.06, 
            pointerEvents: "none", 
            zIndex: 0, 
            mixBlendMode: "screen" 
          }}
        >
          <img 
            src="https://i.ibb.co/n8LtnFQ9/file-00000000bff4720b9f962bfec34454ec.png" 
            alt="" 
            referrerPolicy="no-referrer"
            style={{ height: "100%", width: "auto", objectFit: "contain" }} 
          />
        </div>

        <div className="container">
          <div className="eyebrow">BATTLE BRIEFING</div>
          <h2 className="section-title reveal" ref={(el) => { if (el) revealRefs.current[1] = el; }}>
            TOURNAMENT<br />INTEL
          </h2>
          <p className="section-sub reveal" ref={(el) => { if (el) revealRefs.current[2] = el; }}>
            Clean, competitive, no nonsense. Professional lobby structure built for Free Fire squads who actually want to compete.
          </p>

          <div className="info-grid">
            <div className="info-card reveal" ref={(el) => { if (el) revealRefs.current[3] = el; }}>
              <div className="ic-top">SQUADS</div>
              <div className="ic-val">8 TOTAL</div>
              <div className="ic-sub">আমন্ত্রণ / আগে আসলে আগে পাবেন ভিত্তিতে। স্লট লক হওয়ার পর কোনো এন্ট্রি নেওয়া হবে না।</div>
            </div>
            <div className="info-card reveal" ref={(el) => { if (el) revealRefs.current[4] = el; }}>
              <div className="ic-top">ROSTER</div>
              <div className="ic-val">4 PLAYERS</div>
              <div className="ic-sub">৪ জন মূল খেলোয়াড়। রেজিস্ট্রেশনের সময় ১ জন অতিরিক্ত খেলোয়াড় রাখা যাবে।</div>
            </div>
            <div className="info-card accent reveal" ref={(el) => { if (el) revealRefs.current[5] = el; }}>
              <div className="ic-top">ENTRY</div>
              <div className="ic-val">₹40</div>
              <div className="ic-sub">প্রতি স্কোয়াড। শুধুমাত্র UPI। স্ক্রিনশট দিতে হবে।</div>
            </div>
            <div className="info-card reveal" ref={(el) => { if (el) revealRefs.current[6] = el; }}>
              <div className="ic-top">DATE</div>
              <div className="ic-val" style={{ fontSize: "36px" }}>
                <span 
                  className="editable" 
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleEditableBlur(2, e.currentTarget.textContent || undefined)}
                >
                  {getEditableValue(2, "21 MAY")}
                </span>
              </div>
              <div className="ic-sub">পরিবর্তন করতে ক্লিক করুন। ব্রাউজারে এটি স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।</div>
            </div>
            <div className="info-card reveal" ref={(el) => { if (el) revealRefs.current[7] = el; }}>
              <div className="ic-top">TIME</div>
              <div className="ic-val" style={{ fontSize: "36px" }}>
                <span 
                  className="editable" 
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleEditableBlur(3, e.currentTarget.textContent || undefined)}
                >
                  {getEditableValue(3, "10:00 AM")}
                </span>
              </div>
              <div className="ic-sub">IST • রুম ম্যাচ শুরুর ১৫ মিনিট আগে খোলা হবে।</div>
            </div>
            <div className="info-card reveal" ref={(el) => { if (el) revealRefs.current[8] = el; }}>
              <div className="ic-top">MODE</div>
              <div className="ic-val" style={{ fontSize: "38px" }}>SQUAD BR</div>
              <div className="ic-sub">ব্যাটল রয়্যাল • বারমুডা / পারগেটরি</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIZE POOL SECTION */}
      <section className="prize" id="prize">
        <div className="prize-bg-glow"></div>
        <div className="container" style={{ textAlign: "center" }}>
          <div className="eyebrow">THE VAULT</div>
          <h2 className="section-title reveal" style={{ marginLeft: "auto", marginRight: "auto" }} ref={(el) => { if (el) revealRefs.current[9] = el; }}>
            PRIZE POOL
          </h2>
          <p className="section-sub reveal" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center" }} ref={(el) => { if (el) revealRefs.current[10] = el; }}>
            Top-heavy. Winner-takes-prestige. Clean payout within 2 hours of results.
          </p>

          <div className="prize-grid" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "left" }}>
            <div className="prize-card first reveal" ref={(el) => { if (el) revealRefs.current[11] = el; }}>
              <div className="gold-sheen"></div>
              <div className="trophy-ico" aria-hidden="true">
                <svg width="62" height="62" viewBox="0 0 64 64" fill="none">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffe8a6" />
                      <stop offset="100%" stopColor="#ffb633" />
                    </linearGradient>
                  </defs>
                  <path d="M17 8h30v6c0 8.8-5.8 14-14 16.8V38h10v5H21v-5h10v-7.2C22.8 28 17 22.8 17 14V8Z" fill="url(#g1)" />
                  <circle cx="32" cy="50" r="2.3" fill="#ffcf6a" />
                </svg>
              </div>
              <div className="prize-medal prize-secondary-medal">CHAMPIONS • 1ST PLACE</div>
              <div className="prize-place prize-first-place">BOOYAH</div>
              <div className="prize-amount prize-first-amount">₹150</div>
              <div className="prize-note">Squad payout • UPI instant • + Tournament Champion role</div>
            </div>

            <div className="prize-card reveal" ref={(el) => { if (el) revealRefs.current[12] = el; }}>
              <div className="trophy-ico" aria-hidden="true">
                <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                  <defs>
                    <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f2f3f6" />
                      <stop offset="100%" stopColor="#b9bcc6" />
                    </linearGradient>
                  </defs>
                  <path d="M19 10h26v5c0 7.4-4.9 11.8-12 14.2V35h9v4H22v-4h9v-5.8C23.9 26.8 19 22.4 19 15v-5Z" fill="url(#s1)" />
                </svg>
              </div>
              <div className="prize-medal">RUNNER-UP • 2ND PLACE</div>
              <div className="prize-place">FINALIST</div>
              <div className="prize-amount" style={{ color: "#e6e4df" }}>₹80</div>
              <div className="prize-note">Squad payout • UPI instant</div>
            </div>
          </div>
          <p style={{ color: "#7c7a82", marginTop: "22px", fontSize: "13px" }}>Player-first prize structure.</p>
        </div>
      </section>

      {/* REGISTRATION SECTION */}
      <section className="register" id="register">
        <div 
          className="section-bg-art left" 
          style={{ 
            position: "absolute", 
            left: "-12%", 
            top: "5%", 
            height: "90%", 
            width: "auto", 
            opacity: 0.05, 
            pointerEvents: "none", 
            zIndex: 0, 
            mixBlendMode: "screen" 
          }}
        >
          <img 
            src="https://i.ibb.co/n8LtnFQ9/file-00000000bff4720b9f962bfec34454ec.png" 
            alt="" 
            referrerPolicy="no-referrer"
            style={{ height: "100%", width: "auto", objectFit: "contain" }} 
          />
        </div>

        <div className="container register-inner">
          <div className="reg-copy reveal" ref={(el) => { if (el) revealRefs.current[13] = el; }}>
            <div className="eyebrow">REGISTRATION</div>
            <h2>LOCK YOUR<br />SQUAD SLOT</h2>
            <p>8 squads only. FCFS with confirmed payment. Send squad name, 4 IGNs + UIDs, and payment screenshot on WhatsApp. You’ll get Room ID/Pass 15 min before go-live.</p>
            
            <div className="reg-list">
              <div>• <b>Fee:</b> ₹40 / Squad — UPI</div>
              <div>• <b>Slots:</b> 8 total — <span style={{ color: "#ffce6b" }}>5 left</span></div>
              <div>• <b>Deadline:</b> 1 hour before match</div>
              <div>• <b>Check-in:</b> Mandatory in WhatsApp group</div>
            </div>

            {/* Bengali Payment Directions */}
            <div className="payment-steps" style={{ marginTop: "24px", borderTop: "1px dashed rgba(255,195,39,0.25)", paddingTop: "20px" }}>
              <h4 style={{ fontFamily: "'Teko', sans-serif", fontSize: "22px", color: "var(--gold)", letterSpacing: "0.05em", marginBottom: "12px", textTransform: "uppercase" }}>
                পেমেন্ট নির্দেশাবলী (Payment Steps)
              </h4>
              <ol style={{ color: "#b9b7be", fontSize: "14.5px", lineHeight: 1.8, paddingLeft: "20px" }}>
                <li>QR কোড স্ক্যান করুন।</li>
                <li>₹40 এন্ট্রি ফি প্রদান করুন।</li>
                <li>পেমেন্টের স্ক্রিনশট সংরক্ষণ করুন।</li>
                <li>WhatsApp-এ স্ক্রিনশট পাঠিয়ে রেজিস্ট্রেশন সম্পন্ন করুন।</li>
                <li>রেজিস্ট্রেশন নিশ্চিত হলে আপনাকে জানিয়ে দেওয়া হবে।</li>
              </ol>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <a 
                className="btn btn-primary" 
                href="https://wa.me/918695019315?text=Hello!%20I%20want%20to%20register%20my%20squad%20for%20the%20Free%20Fire%20Testing%20Tournament.%20Please%20share%20the%20registration%20details." 
                target="_blank" 
                rel="noopener noreferrer"
              >
                REGISTER VIA WHATSAPP
              </a>
              <a 
                className="btn btn-ghost" 
                href="#rules"
                onClick={(e) => handleAnchorClick(e, "#rules")}
              >
                Read Full Rules
              </a>
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--gold)", marginTop: "14px", fontWeight: 500, letterSpacing: "0.05em" }}>
              ওয়েবসাইট খুলতে এখানে চাপুন
            </div>
          </div>

          <div className="qr-card reveal" ref={(el) => { if (el) revealRefs.current[14] = el; }}>
            <div className="qr-frame">
              <span className="qr-corner tl"></span><span className="qr-corner tr"></span><span className="qr-corner bl"></span><span className="qr-corner br"></span>
              <div className="qr-inner">
                <img 
                  src="https://i.ibb.co/HD7H2qJ2/Phone-Pe-QR-Punjab-National-Bank-75671.png" 
                  alt="PhonePe QR Code for registration" 
                  className="w-full h-full object-contain block mx-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D918695019315%40ybl%26pn%3DSARS%20TOURNAMENT%26am%3D40";
                  }}
                />
              </div>
            </div>
            <div className="qr-title" style={{ fontSize: "24px", marginTop: "12px", color: "var(--gold)" }}>স্ক্যান করে এন্ট্রি ফি প্রদান করুন</div>
            <div className="qr-sub" style={{ color: "var(--white)", fontSize: "14px", marginTop: "8px", fontWeight: 500 }}>
              পেমেন্ট করার পর WhatsApp-এ স্ক্রিনশট পাঠান
            </div>
          </div>
        </div>
      </section>

      {/* RULES & FAIR PLAY SECTION */}
      <section className="rules" id="rules">
        <div 
          className="section-bg-art right" 
          style={{ 
            position: "absolute", 
            right: "-5%", 
            top: "5%", 
            height: "90%", 
            width: "auto", 
            opacity: 0.06, 
            pointerEvents: "none", 
            zIndex: 0, 
            mixBlendMode: "screen", 
            filter: "grayscale(40%)" 
          }}
        >
          <img 
            src="https://i.ibb.co/XmYRMb4/file-0000000046dc720b8a25498ac737278c.png" 
            alt="" 
            referrerPolicy="no-referrer"
            style={{ height: "100%", width: "auto", objectFit: "contain" }} 
          />
        </div>

        <div className="container">
          <div className="eyebrow">COMPETITION HANDBOOK</div>
          <h2 className="section-title reveal" ref={(el) => { if (el) revealRefs.current[15] = el; }}>
            RULES &<br />FAIR PLAY
          </h2>
          <p className="section-sub">Keep it clean. Keep it competitive. Violations = instant disqualification, no refund.</p>

          <div className="accordion" id="accordion">
            
            {/* 1. general */}
            <div className={`acc-item ${openAccordion === 1 ? "open" : ""}`}>
              <button className="acc-btn" onClick={() => setOpenAccordion(openAccordion === 1 ? 0 : 1)}>
                <span className="acc-left"><span>১. সাধারণ নিয়ম</span></span>
                <span className="acc-icon">{openAccordion === 1 ? "×" : "+"}</span>
              </button>
              <div className="acc-panel" style={{ gridTemplateRows: openAccordion === 1 ? "1fr" : "0fr" }}>
                <div className="acc-panel-inner">
                  <div className="acc-body">
                    <ul>
                      <li>রেজিস্ট্রেশন নিশ্চিত করার আগে এন্ট্রি ফি জমা দিতে হবে।</li>
                      <li>একবার টাকা জমা দিলে কোনো রিফান্ড দেওয়া হবে না।</li>
                      <li>শুধুমাত্র রেজিস্টার করা খেলোয়াড়রাই অংশগ্রহণ করতে পারবে।</li>
                      <li>আয়োজকের সিদ্ধান্তই চূড়ান্ত সিদ্ধান্ত হিসেবে গণ্য হবে।</li>
                      <li>ম্যাচ শুরু হওয়ার আগে নির্ধারিত সময়ে উপস্থিত থাকতে হবে।</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. fairplay */}
            <div className={`acc-item ${openAccordion === 2 ? "open" : ""}`}>
              <button className="acc-btn" onClick={() => setOpenAccordion(openAccordion === 2 ? 0 : 2)}>
                <span className="acc-left"><span>২. ফেয়ার প্লে নিয়ম</span></span>
                <span className="acc-icon">{openAccordion === 2 ? "×" : "+"}</span>
              </button>
              <div className="acc-panel" style={{ gridTemplateRows: openAccordion === 2 ? "1fr" : "0fr" }}>
                <div className="acc-panel-inner">
                  <div className="acc-body">
                    <ul>
                      <li>কোনো ধরনের হ্যাক, স্ক্রিপ্ট বা চিট ব্যবহার করা যাবে না।</li>
                      <li>গেমের বাগ বা গ্লিচ ব্যবহার করা নিষিদ্ধ।</li>
                      <li>অন্য দলের সঙ্গে টিমিং করা যাবে না।</li>
                      <li>জোনে ইচ্ছাকৃত র‍্যাঙ্ক পুশিং করা যাবে না।</li>
                      <li>সন্দেহজনক কার্যকলাপ পাওয়া গেলে দলকে বাতিল করা হতে পারে।</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. recording */}
            <div className={`acc-item ${openAccordion === 3 ? "open" : ""}`}>
              <button className="acc-btn" onClick={() => setOpenAccordion(openAccordion === 3 ? 0 : 3)}>
                <span className="acc-left"><span>৩. রেকর্ডিং নিয়ম</span></span>
                <span className="acc-icon">{openAccordion === 3 ? "×" : "+"}</span>
              </button>
              <div className="acc-panel" style={{ gridTemplateRows: openAccordion === 3 ? "1fr" : "0fr" }}>
                <div className="acc-panel-inner">
                  <div className="acc-body">
                    <ul>
                      <li>প্রতিটি স্কোয়াডের অন্তত একজন খেলোয়াড়কে সম্পূর্ণ ম্যাচ রেকর্ড করতে হবে।</li>
                      <li>প্রয়োজনে আয়োজক রেকর্ডিং চাইতে পারেন।</li>
                      <li>রেকর্ডিং দেখাতে ব্যর্থ হলে পুরস্কার বাতিল হতে পারে।</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. conduct */}
            <div className={`acc-item ${openAccordion === 4 ? "open" : ""}`}>
              <button className="acc-btn" onClick={() => setOpenAccordion(openAccordion === 4 ? 0 : 4)}>
                <span className="acc-left"><span>৪. আচরণবিধি</span></span>
                <span className="acc-icon">{openAccordion === 4 ? "×" : "+"}</span>
              </button>
              <div className="acc-panel" style={{ gridTemplateRows: openAccordion === 4 ? "1fr" : "0fr" }}>
                <div className="acc-panel-inner">
                  <div className="acc-body">
                    <ul>
                      <li>গালাগালি, খারাপ ভাষা বা অসদাচরণ সম্পূর্ণ নিষিদ্ধ।</li>
                      <li>কোনো খেলোয়াড় খারাপ ভাষা ব্যবহার করলে পুরো দলকে সাসপেন্ড করা হতে পারে।</li>
                      <li>সকল খেলোয়াড় ও আয়োজকদের সম্মান করতে হবে।</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. br limits */}
            <div className={`acc-item ${openAccordion === 5 ? "open" : ""}`}>
              <button className="acc-btn" onClick={() => setOpenAccordion(openAccordion === 5 ? 0 : 5)}>
                <span className="acc-left"><span>৫. ব্যাটল রয়্যাল নিয়ম</span></span>
                <span className="acc-icon">{openAccordion === 5 ? "×" : "+"}</span>
              </button>
              <div className="acc-panel" style={{ gridTemplateRows: openAccordion === 5 ? "1fr" : "0fr" }}>
                <div className="acc-panel-inner">
                  <div className="acc-body">
                    <ul>
                      <li>শুধুমাত্র Squad Battle Royale মোডে খেলা হবে।</li>
                      <li>ইচ্ছাকৃতভাবে ম্যাচ ছেড়ে যাওয়া যাবে না।</li>
                      <li>অন্য দলকে সাহায্য করা নিষিদ্ধ।</li>
                      <li>সকল খেলোয়াড়কে আয়োজকের নির্দেশনা মেনে চলতে হবে।</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. cs limits */}
            <div className={`acc-item ${openAccordion === 6 ? "open" : ""}`}>
              <button className="acc-btn" onClick={() => setOpenAccordion(openAccordion === 6 ? 0 : 6)}>
                <span className="acc-left"><span>৬. ক্ল্যাশ স্কোয়াড নিয়ম</span></span>
                <span className="acc-icon">{openAccordion === 6 ? "×" : "+"}</span>
              </button>
              <div className="acc-panel" style={{ gridTemplateRows: openAccordion === 6 ? "1fr" : "0fr" }}>
                <div className="acc-panel-inner">
                  <div className="acc-body">
                    <ul>
                      <li>কোনো বাগ বা গ্লিচ ব্যবহার করা যাবে না।</li>
                      <li>ইচ্ছাকৃত ডিসকানেক্ট করা যাবে না।</li>
                      <li>ন্যায্যভাবে খেলা বাধ্যতামূলক।</li>
                      <li>চিটিং ধরা পড়লে সরাসরি ডিসকোয়ালিফাই করা হবে।</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="eyebrow">NEED HELP?</div>
          <h2 className="section-title" style={{ fontSize: "clamp(44px,6vw,78px)" }}>TALK TO ADMIN</h2>
          <div className="contact-icons">
            <a 
              className="c-ico" 
              href="https://wa.me/918695019315?text=Hello!%20I%20want%20to%20register%20my%20squad%20for%20the%20Free%20Fire%20Testing%20Tournament.%20Please%20share%20the%20registration%20details." 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="WhatsApp"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M20.5 11.9a8.5 8.5 0 0 1-12.3 7.5L4 20.5l1.1-4A8.5 8.5 0 1 1 20.5 11.9Z animate-pulse" />
                <path d="M9.2 9.6c.1-.3-.1-.5-.4-.5h-.9c-.2 0-.4.1-.5.3-.3.5-.5 1-.5 1.6 0 .9.5 1.8 1.2 2.6.8.9 1.9 1.7 3.1 2 .5.1 1 0 1.4-.3l.7-.6c.2-.2.3-.4.2-.7l-.4-1c-.1-.2-.3-.3-.5-.2l-1 .4c-.2.1-.4 0-.6-.1-.4-.3-.8-.6-1.1-.9-.3-.3-.5-.6-.7-1 0-.2 0-.4.2-.5l.8-.6Z" />
              </svg>
            </a>
            <a 
              className="c-ico" 
              href="https://www.instagram.com/surja7_7_7?utm_source=qr&igsh=MXZ4Z2c5ODR3ajlhMQ==" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="3.6" />
                <circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a 
              className="c-ico" 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Discord"
            >
              <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55">
                <path d="M18.6 6.4c-1.2-.55-2.45-.95-3.75-1.18-.18.32-.38.75-.52 1.09-1.38-.21-2.75-.21-4.13 0-.14-.35-.35-.78-.53-1.09-1.3.23-2.55.63-3.75 1.18C3.25 10.2 2.5 13.9 2.72 17.54c1.55 1.14 3.06 1.83 4.54 2.28.37-.5.7-1.03.98-1.6-.53-.2-1.04-.45-1.52-.75.13-.09.25-.19.37-.29 2.88 1.34 6 1.34 8.84 0 .12.1.24.2.37.29-.48.3-1 .55-1.53.75.28.57.61 1.1.98 1.6 1.48-.45 3-1.14 4.55-2.28.26-4.2-.76-7.76-2.7-11.14Z" />
                <path d="M9.8 14.5c-.88 0-1.6-.81-1.6-1.8s.7-1.8 1.6-1.8 1.6.81 1.6 1.8-.72 1.8-1.6 1.8Zm4.4 0c-.88 0-1.6-.81-1.6-1.8s.7-1.8 1.6-1.8 1.6.81 1.6 1.8-.72 1.8-1.6 1.8Z" />
              </svg>
            </a>
          </div>
          <div className="contact-note">Response time: typically under 20 minutes • 10 AM – 11 PM IST</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div>© 2026 SARS TOURNAMENT • Not affiliated with Garena</div>
        <div>Built for esports. Built for Booyah.</div>
      </footer>
    </>
  );
}
