#!/usr/bin/env python3
"""
ساخت دموی تک‌فایلی و کاملاً آفلاین هاوڕێ.

خروجی: docs/DEMO.html — یک فایل HTML مستقل که همه تصاویر را به‌صورت base64
درون خود دارد و بدون هیچ سرور، فونت یا اینترنتی روی گوشی کار می‌کند.
"""
import base64
import pathlib
import json

ROOT = pathlib.Path(__file__).resolve().parent.parent


def b64(path: str) -> str:
    data = (ROOT / path).read_bytes()
    ext = pathlib.Path(path).suffix.lstrip('.').replace('jpg', 'jpeg')
    return f"data:image/{ext};base64,{base64.b64encode(data).decode()}"


LOGO = b64('public/brand/mark-192.png')

PEOPLE = [
    dict(name='ترانه', age=29, city='مشهد', km=32, bio='مترجم کتاب، دوستدار گربه‌ها و باران.',
         tags=['کتاب', 'حیوانات', 'موسیقی'], img='public/seed/girl-3.jpg', verified=True),
    dict(name='رهام', age=32, city='تهران', km=5, bio='عکاس خیابانی، دنبال نورهای عجیب شهر.',
         tags=['عکاسی', 'سفر', 'قهوه'], img='public/seed/boy-1.jpg', verified=False),
    dict(name='پرنیا', age=30, city='رشت', km=18, bio='گرافیست و علاقه‌مند به موسیقی محلی.',
         tags=['هنر', 'موسیقی', 'آشپزی'], img='public/seed/girl-4.jpg', verified=False),
    dict(name='سامان', age=34, city='یزد', km=41, bio='راهنمای گردشگری؛ کویر را بیشتر از دریا دوست دارم.',
         tags=['سفر', 'عکاسی', 'طبیعت‌گردی'], img='public/seed/boy-3.jpg', verified=True),
    dict(name='هستی', age=27, city='کرج', km=12, bio='مربی یوگا؛ صبح‌ها زودتر از خورشید بیدارم.',
         tags=['یوگا', 'ورزش', 'طبیعت‌گردی'], img='public/seed/girl-2.jpg', verified=False),
    dict(name='کیان', age=33, city='شیراز', km=27, bio='آشپزی می‌کنم و شنبه‌ها می‌دوم.',
         tags=['آشپزی', 'دویدن', 'طبیعت‌گردی'], img='public/seed/boy-2.jpg', verified=False),
    dict(name='دنیا', age=25, city='اهواز', km=36, bio='دانشجوی مهندسی، بازی‌های رومیزی را جدی می‌گیرم.',
         tags=['بازی', 'شطرنج', 'سینما'], img='public/seed/girl-5.jpg', verified=False),
    dict(name='بردیا', age=35, city='تبریز', km=22, bio='شطرنج‌باز آماتور و علاقه‌مند به تاریخ.',
         tags=['شطرنج', 'کتاب', 'سفر'], img='public/seed/boy-4.jpg', verified=False),
]
for p in PEOPLE:
    p['img'] = b64(p['img'])

ME = b64('public/seed/girl-1.jpg')
NIMA = b64('public/seed/boy-1.jpg')

DATA = json.dumps({'people': PEOPLE, 'me': ME, 'nima': NIMA, 'logo': LOGO}, ensure_ascii=False)

HTML = """<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>هاوڕێ — دموی تعاملی</title>
<style>
  :root{
    --bg:#fdf6f2; --ink:#2a1427; --muted:#7d6b66; --soft:#e9dfda; --card:#ffffff;
    --brand:#f95c4b; --brand-700:#bd2d2e; --grad:linear-gradient(135deg,#f5455f 0%,#ff7a45 52%,#ffaf4b 100%);
    --coral:#e5375c; --ok:#10b981;
  }
  html.dark{
    --bg:#170a15; --ink:#fbeef6; --muted:#bda8ba; --soft:rgba(255,255,255,.1); --card:#241128;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:Vazirmatn,'IRANSans',Tahoma,'Segoe UI',system-ui,sans-serif;
    overscroll-behavior:none}
  .app{max-width:460px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;position:relative;
    background:
      radial-gradient(42rem 28rem at 88% -8%, rgba(255,169,60,.18), transparent 60%),
      radial-gradient(32rem 24rem at 4% 8%, rgba(249,92,75,.14), transparent 62%);
  }
  html.dark .app{background:
      radial-gradient(42rem 28rem at 88% -8%, rgba(255,169,60,.10), transparent 60%),
      radial-gradient(32rem 24rem at 4% 8%, rgba(249,92,75,.12), transparent 62%);}
  header.top{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;
    gap:10px;padding:10px 14px;background:color-mix(in srgb,var(--card) 70%,transparent);
    backdrop-filter:blur(14px);border-bottom:1px solid var(--soft)}
  .brand{display:flex;align-items:center;gap:8px;font-weight:800}
  .brand img{width:30px;height:30px}
  .iconbtn{width:38px;height:38px;border:0;border-radius:12px;background:transparent;color:var(--muted);
    display:grid;place-items:center;cursor:pointer}
  .iconbtn:active{background:var(--soft)}
  main{flex:1;padding:14px 14px 104px}
  .screen{display:none;animation:fade .25s ease}
  .screen.on{display:block}
  @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  h1,h2,h3{margin:0}
  .card{background:var(--card);border:1px solid var(--soft);border-radius:26px;
    box-shadow:0 20px 45px -30px rgba(42,20,39,.55)}
  .btn{border:0;border-radius:16px;padding:13px 18px;font-weight:800;font-size:14px;cursor:pointer;
    font-family:inherit;white-space:nowrap}
  .btn-primary{background:var(--grad);color:#fff;box-shadow:0 12px 26px -14px rgba(249,92,75,.9)}
  .btn-ghost{background:var(--card);color:var(--ink);border:1px solid var(--soft)}
  .chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 12px;font-size:12px;
    font-weight:800;background:rgba(249,92,75,.1);color:var(--brand-700);border:1px solid rgba(249,92,75,.22)}
  html.dark .chip{color:#ffb9a7}
  .muted{color:var(--muted)}

  /* ---------- کاوش ---------- */
  .deck{position:relative;margin:0 -14px}
  .swipe{position:relative;border-radius:28px;overflow:hidden;background:var(--grad);
    box-shadow:0 26px 60px -34px rgba(42,20,39,.8);touch-action:pan-y;user-select:none}
  .swipe img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
  .ph{position:relative;width:100%;height:min(calc(100dvh - 206px), calc((100vw - 4px) * 16 / 9));min-height:360px;overflow:hidden}
  .swipe img{position:absolute;inset:0}
  .shade{position:absolute;inset:auto 0 0 0;height:66%;
    background:linear-gradient(to top,rgba(0,0,0,.85),rgba(0,0,0,.3) 45%,transparent)}
  .info{position:absolute;inset:auto 0 0 0;padding:18px 18px 104px;color:#fff}
  .info h2{font-size:26px;font-weight:800;display:flex;align-items:center;gap:7px}
  .info .meta{font-size:12px;font-weight:700;opacity:.92;margin-top:5px}
  .info .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .info .tags span{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.16);
    padding:5px 10px;border-radius:999px;font-size:11px;font-weight:800;backdrop-filter:blur(6px)}
  .stamp{position:absolute;top:56px;padding:8px 18px;border-radius:16px;font-size:20px;font-weight:800;color:#fff;
    border:3px solid;opacity:0;pointer-events:none;backdrop-filter:blur(3px)}
  .stamp.like{inset-inline-start:18px;border-color:#34d399;background:rgba(16,185,129,.3);transform:rotate(-14deg)}
  .stamp.nope{inset-inline-end:18px;border-color:#fb7185;background:rgba(229,55,92,.3);transform:rotate(14deg)}
  .tint{position:absolute;inset:0;opacity:0;pointer-events:none}
  .actions{position:absolute;inset-inline:0;bottom:22px;display:flex;align-items:center;justify-content:center;gap:18px;z-index:5}
  .fab{width:62px;height:62px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;
    box-shadow:0 14px 30px -12px rgba(0,0,0,.5);outline:4px solid rgba(255,255,255,.75)}
  html.dark .fab{outline-color:rgba(255,255,255,.18)}
  .fab.like{background:var(--grad);color:#fff}
  .fab.nope{background:#fff;color:var(--coral)}
  .fab.undo{width:46px;height:46px;background:var(--card);color:var(--muted);border:1px solid var(--soft);outline:0}
  .fab:active{transform:scale(.94)}
  .progress{position:absolute;inset-inline:12px;top:12px;display:flex;gap:6px;z-index:4}
  .progress i{flex:1;height:3px;border-radius:999px;background:rgba(255,255,255,.35)}
  .progress i.on{background:#fff}

  /* ---------- فهرست آشنایی‌ها ---------- */
  .row{display:flex;align-items:center;gap:12px;padding:12px;border-radius:22px;background:var(--card);
    border:1px solid var(--soft);margin-bottom:10px;cursor:pointer}
  .row:active{transform:scale(.99)}
  .av{width:54px;height:54px;border-radius:18px;object-fit:cover;flex:none}
  .row .t{flex:1;min-width:0}
  .row .t b{display:flex;align-items:center;gap:6px}
  .row .t p{margin:3px 0 0;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .badge{background:var(--coral);color:#fff;border-radius:999px;min-width:22px;height:22px;display:grid;
    place-items:center;font-size:11px;font-weight:800;padding:0 6px}

  /* ---------- چت ---------- */
  .chat{display:flex;flex-direction:column;height:calc(100vh - 190px)}
  .msgs{flex:1;overflow-y:auto;padding:12px;background:var(--card);border:1px solid var(--soft);
    border-radius:26px}
  .day{display:flex;justify-content:center;margin:6px 0 10px}
  .day span{font-size:11px;font-weight:800;color:var(--muted);background:var(--bg);border:1px solid var(--soft);
    padding:4px 12px;border-radius:999px}
  .b{max-width:78%;padding:10px 14px;border-radius:20px;font-size:14px;line-height:1.9;margin-bottom:8px;
    position:relative;word-break:break-word;white-space:pre-line}
  .b.me{margin-inline-end:auto;background:var(--grad);color:#fff;border-bottom-right-radius:6px}
  .b.you{margin-inline-start:auto;background:var(--bg);border:1px solid var(--soft);border-bottom-left-radius:6px}
  .b time{display:block;font-size:10px;opacity:.75;margin-top:3px}
  .typing{display:flex;gap:4px;align-items:center;margin-inline-start:auto;width:fit-content;padding:14px 16px;
    background:var(--bg);border:1px solid var(--soft);border-radius:20px;border-bottom-left-radius:6px;margin-bottom:8px}
  .typing i{width:6px;height:6px;border-radius:50%;background:var(--brand);animation:bnc .9s infinite}
  .typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
  @keyframes bnc{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
  .composer{display:flex;gap:8px;align-items:flex-end;margin-top:10px;padding:8px;border-radius:24px;
    background:var(--card);border:1px solid var(--soft)}
  .composer textarea{flex:1;border:0;background:transparent;color:var(--ink);font-family:inherit;font-size:14px;
    padding:10px;resize:none;max-height:100px;outline:0}
  .send{width:44px;height:44px;border-radius:16px;border:0;background:var(--grad);color:#fff;display:grid;
    place-items:center;cursor:pointer;flex:none}

  /* ---------- نوار پایین ---------- */
  nav.bottom{position:fixed;inset-inline:0;bottom:0;z-index:50;display:flex;justify-content:center;padding:0 10px 10px;
    pointer-events:none}
  nav.bottom .wrap{pointer-events:auto;width:100%;max-width:440px;display:flex;justify-content:space-between;
    background:color-mix(in srgb,var(--card) 88%,transparent);backdrop-filter:blur(16px);border:1px solid var(--soft);
    border-radius:24px;padding:8px 6px;box-shadow:0 20px 45px -28px rgba(42,20,39,.7)}
  nav.bottom button{flex:1;border:0;background:transparent;color:var(--muted);font-family:inherit;font-size:11px;
    font-weight:800;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;position:relative;padding:4px}
  nav.bottom button .ic{width:40px;height:34px;border-radius:12px;display:grid;place-items:center}
  nav.bottom button.on{color:var(--brand-700)}
  html.dark nav.bottom button.on{color:#ff9b85}
  nav.bottom button.on .ic{background:var(--grad);color:#fff}
  nav.bottom .dot{position:absolute;top:0;inset-inline-start:22px;background:var(--coral);color:#fff;border-radius:999px;
    min-width:18px;height:18px;font-size:10px;display:grid;place-items:center;border:2px solid var(--card)}

  /* ---------- دیگر ---------- */
  .sheet{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;padding:18px;
    background:rgba(23,10,21,.55);backdrop-filter:blur(5px)}
  .sheet.on{display:flex}
  .sheet .box{width:100%;max-width:380px;background:var(--card);border-radius:28px;padding:22px;text-align:center;
    animation:pop .25s ease}
  @keyframes pop{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}
  .seg{display:flex;gap:6px;background:var(--soft);padding:5px;border-radius:18px}
  .seg button{flex:1;border:0;border-radius:14px;padding:10px;font-family:inherit;font-weight:800;font-size:13px;
    background:transparent;color:var(--muted);cursor:pointer}
  .seg button.on{background:var(--card);color:var(--brand-700);box-shadow:0 8px 18px -12px rgba(0,0,0,.4)}
  .list{display:grid;gap:10px}
  .tile{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:20px;background:var(--card);
    border:1px solid var(--soft)}
  .tile .ic{width:40px;height:40px;border-radius:14px;background:var(--grad);color:#fff;display:grid;place-items:center;flex:none}
  .hint{text-align:center;font-size:11px;font-weight:800;color:var(--muted);margin:0 0 10px}
  .demo-pill{position:fixed;top:8px;inset-inline-start:50%;transform:translateX(50%);z-index:90;background:var(--ink);
    color:#fff;font-size:10px;font-weight:800;padding:4px 12px;border-radius:999px;opacity:.75}
  svg{display:block}
</style>
</head>
<body>
<div class="app">
  <header class="top">
    <span class="brand"><img id="logo" alt="" /> هاوڕێ</span>
    <span style="display:flex;gap:4px;align-items:center">
      <button class="iconbtn" id="themeBtn" aria-label="حالت نمایش">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
      </button>
      <img id="meAv" class="av" style="width:34px;height:34px;border-radius:12px" alt="" />
    </span>
  </header>

  <main>
    <!-- ============ کاوش ============ -->
    <section class="screen on" id="s-discover">
      <p class="hint">کشیدن به راست = پسندیدن &nbsp;•&nbsp; کشیدن به چپ = رد کردن</p>
      <div class="deck" id="deck"></div>
    </section>

    <!-- ============ آشنایی‌ها ============ -->
    <section class="screen" id="s-matches">
      <h2 style="font-size:20px;margin-bottom:4px">آشنایی‌ها</h2>
      <p class="muted" style="font-size:12px;margin:0 0 14px">افرادی که شما و آن‌ها یکدیگر را پسندیده‌اید.</p>
      <div id="matchList"></div>
      <p class="muted" id="noMatch" style="text-align:center;font-size:13px;padding:30px 0;display:none">
        هنوز آشنایی‌ای ندارید. در کاوش چند نفر را بپسندید.
      </p>
    </section>

    <!-- ============ چت ============ -->
    <section class="screen" id="s-chat">
      <div class="chat">
        <div class="card" style="display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:10px">
          <button class="iconbtn" onclick="go('matches')" aria-label="بازگشت">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M14 6l6 6-6 6M20 12H4"/></svg>
          </button>
          <img id="chatAv" class="av" style="width:40px;height:40px;border-radius:14px" alt="" />
          <div style="flex:1;min-width:0">
            <b id="chatName" style="display:block">—</b>
            <small id="chatStatus" style="color:var(--ok);font-weight:800;font-size:11px">آنلاین</small>
          </div>
        </div>
        <div class="msgs" id="msgs"></div>
        <form class="composer" id="composer">
          <textarea id="msgInput" rows="1" placeholder="پیام خود را بنویسید…"></textarea>
          <button class="send" type="submit" aria-label="ارسال">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z"/></svg>
          </button>
        </form>
      </div>
    </section>

    <!-- ============ پروفایل ============ -->
    <section class="screen" id="s-profile">
      <div class="card" style="padding:20px;text-align:center">
        <img id="meBig" style="width:110px;height:110px;border-radius:32px;object-fit:cover" alt="" />
        <h2 style="margin-top:12px;font-size:20px">آرمیتا، ۲۸</h2>
        <p class="muted" style="font-size:12px;margin:6px 0 0">تهران • معمار، عاشق پیاده‌روی شبانه و قهوه بدون شکر.</p>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:12px">
          <span class="chip">هنر</span><span class="chip">قهوه</span><span class="chip">سفر</span>
        </div>
      </div>
      <div class="tile" style="margin-top:12px">
        <span class="ic">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/>
          <circle cx="8.5" cy="11" r="2.2"/><path d="M5.5 16.2c.6-1.4 1.8-2.1 3-2.1s2.4.7 3 2.1M14.5 9.5h4M14.5 13h4"/></svg>
        </span>
        <div>
          <b>تأیید هویت</b>
          <p class="muted" style="font-size:12px;margin:5px 0 10px;line-height:1.9">
            با یک سلفیِ ساده، نشان «تأییدشده» کنار نام شما نمایش داده می‌شود.</p>
          <button class="btn btn-primary" style="font-size:13px;padding:10px 16px"
                  onclick="toast('در نسخه کامل، سلفی برای بررسی مدیر ارسال می‌شود.')">ارسال سلفی برای تأیید</button>
        </div>
      </div>
    </section>

    <!-- ============ تنظیمات ============ -->
    <section class="screen" id="s-settings">
      <div class="card" style="padding:18px;margin-bottom:12px">
        <b style="display:block;margin-bottom:10px">حالت نمایش</b>
        <div class="seg" id="themeSeg">
          <button data-theme="light" class="on">روشن</button>
          <button data-theme="dark">تاریک</button>
        </div>
      </div>
      <div class="card" style="padding:18px;margin-bottom:12px">
        <b style="display:block;margin-bottom:10px">زبان</b>
        <div class="seg" id="langSeg">
          <button data-lang="fa" class="on">فارسی</button>
          <button data-lang="ckb">کوردی</button>
          <button data-lang="en">English</button>
        </div>
        <p class="muted" style="font-size:11px;margin:10px 0 0">در این دمو فقط چند متن کلیدی ترجمه می‌شود؛ نسخه کامل ۴ زبان دارد.</p>
      </div>
      <div class="card" style="padding:18px">
        <b style="display:block;margin-bottom:10px">حریم خصوصی</b>
        <div class="list" style="font-size:13px;line-height:1.9">
          <span class="muted">• رمز عبور هش‌شده ذخیره می‌شود و قابل بازیابی نیست.</span>
          <span class="muted">• ایمیل شما هرگز به دیگران نشان داده نمی‌شود.</span>
          <span class="muted">• مکان دقیق ذخیره نمی‌شود؛ فقط شهر و فاصله تقریبی.</span>
          <span class="muted">• حداقل سن استفاده ۱۸ سال است.</span>
        </div>
      </div>
      <p class="muted" style="text-align:center;font-size:11px;margin-top:18px">
        هاوڕێ — ساخته شده توسط عبدالمتین پرچین
      </p>
    </section>
  </main>

  <nav class="bottom"><div class="wrap">
    <button class="on" data-go="discover"><span class="ic">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>
      <path d="m15.2 8.8-1.8 4.4-4.4 1.8 1.8-4.4z"/></svg></span>کاوش</button>
    <button data-go="matches"><span class="ic">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round"><path d="M20 13.5c0 3-2.7 5.2-6 5.2-.7 0-1.4-.1-2-.3L8 20l.4-2.6C6.3 16.3 5 15 5 13.1 5 10.1 8.1 8 11.5 8S20 10.5 20 13.5Z"/></svg>
      </span><span id="navBadge" class="dot" style="display:none">۱</span>آشنایی‌ها</button>
    <button data-go="profile"><span class="ic">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.6"/>
      <path d="M5 20c.9-3.4 3.7-5.2 7-5.2s6.1 1.8 7 5.2"/></svg></span>پروفایل</button>
    <button data-go="settings"><span class="ic">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/>
      <path d="m19.4 14-.6 1 .9 1.8-1.9 1.9-1.8-.9-1 .6-.6 2h-2.8l-.6-2-1-.6-1.8.9-1.9-1.9.9-1.8-.6-1-2-.6v-2.8l2-.6.6-1-.9-1.8L6.2 5.3l1.8.9 1-.6.6-2h2.8l.6 2 1 .6 1.8-.9 1.9 1.9-.9 1.8.6 1 2 .6v2.8z"/></svg>
      </span>تنظیمات</button>
  </div></nav>

  <div class="sheet" id="matchSheet"><div class="box">
    <div style="display:flex;justify-content:center;gap:-10px">
      <img id="mA" style="width:84px;height:84px;border-radius:26px;object-fit:cover;border:3px solid var(--card)" alt="">
      <img id="mB" style="width:84px;height:84px;border-radius:26px;object-fit:cover;margin-inline-start:-18px;border:3px solid var(--card)" alt="">
    </div>
    <h2 style="margin-top:14px;font-size:20px">یک آشنایی دوطرفه شکل گرفت!</h2>
    <p class="muted" style="font-size:13px;line-height:1.9;margin-top:8px">حالا می‌توانید گفت‌وگو را شروع کنید.</p>
    <div style="display:flex;gap:8px;margin-top:18px">
      <button class="btn btn-ghost" style="flex:1" onclick="closeSheet()">ادامه کاوش</button>
      <button class="btn btn-primary" style="flex:1" id="goChatBtn">شروع گفت‌وگو</button>
    </div>
  </div></div>

  <div class="demo-pill">نسخه نمایشی آفلاین</div>
</div>

<script>
const DATA = __DATA__;
const T = {
  fa:{discover:'کاوش',matches:'آشنایی‌ها',profile:'پروفایل',settings:'تنظیمات',write:'پیام خود را بنویسید…',online:'آنلاین',typing:'در حال نوشتن…'},
  ckb:{discover:'گەڕان',matches:'ناسیاوەکان',profile:'پرۆفایل',settings:'ڕێکخستن',write:'نامەکەت بنووسە…',online:'سەرهێڵ',typing:'خەریکی نووسینە…'},
  en:{discover:'Discover',matches:'Matches',profile:'Profile',settings:'Settings',write:'Write your message…',online:'Online',typing:'typing…'}
};
let lang='fa';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
document.getElementById('logo').src=DATA.logo;
document.getElementById('meAv').src=DATA.me;
document.getElementById('meBig').src=DATA.me;
const fa=n=>String(n).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

/* ---------- ناوبری ---------- */
function go(name){
  $$('.screen').forEach(s=>s.classList.toggle('on', s.id==='s-'+name));
  $$('nav.bottom button').forEach(b=>b.classList.toggle('on', b.dataset.go===name));
  window.scrollTo({top:0});
  if(name==='matches'){ renderMatches(); setBadge(0); }
}
$$('nav.bottom button').forEach(b=>b.onclick=()=>go(b.dataset.go));

/* ---------- تم ---------- */
function setTheme(t){
  document.documentElement.classList.toggle('dark', t==='dark');
  $$('#themeSeg button').forEach(b=>b.classList.toggle('on', b.dataset.theme===t));
}
$('#themeBtn').onclick=()=>setTheme(document.documentElement.classList.contains('dark')?'light':'dark');
$$('#themeSeg button').forEach(b=>b.onclick=()=>setTheme(b.dataset.theme));

/* ---------- زبان ---------- */
$$('#langSeg button').forEach(b=>b.onclick=()=>{
  lang=b.dataset.lang;
  $$('#langSeg button').forEach(x=>x.classList.toggle('on',x===b));
  document.documentElement.dir = lang==='en'?'ltr':'rtl';
  const t=T[lang], labels=['discover','matches','profile','settings'];
  $$('nav.bottom button').forEach((btn,i)=>{
    btn.childNodes[btn.childNodes.length-1].textContent=t[labels[i]];
  });
  $('#msgInput').placeholder=t.write;
});

/* ---------- کاوش ---------- */
let queue=[...DATA.people], matches=[], current=null;
function cardHTML(p){
  return `<div class="swipe" id="card">
    <div class="ph">
      <div class="progress"><i class="on"></i><i></i></div>
      <img src="${p.img}" alt="">
      <div class="tint" id="tintLike" style="background:#10b981"></div>
      <div class="tint" id="tintNope" style="background:#e5375c"></div>
      <span class="stamp like" id="stampLike">پسندیدم</span>
      <span class="stamp nope" id="stampNope">رد شد</span>
      <div class="shade"></div>
      <div class="info">
        <h2>${p.name} <span style="font-size:19px;opacity:.95">${fa(p.age)}</span>
          ${p.verified?'<svg width="19" height="19" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 1.8l2.4 1.9 3-.3 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.3L12 22.2l-2.4-1.9-3 .3-1-2.9L3 16.1l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .3L12 1.8Z"/><path d="m8.4 12.2 2.5 2.4 4.7-4.8" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
        </h2>
        <p class="meta">${p.city} • حدود ${fa(p.km)} کیلومتر</p>
        <p class="meta" style="font-weight:500;opacity:.95;margin-top:8px">${p.bio}</p>
        <div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>
      </div>
    </div>
    <div class="actions">
      <button class="fab like" id="btnLike" aria-label="پسندیدن">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5s-7.5-4.6-7.5-9.4A4.3 4.3 0 0 1 12 8.4a4.3 4.3 0 0 1 7.5 2.7c0 4.8-7.5 9.4-7.5 9.4Z"/></svg>
      </button>
      <button class="fab undo" id="btnUndo" aria-label="لغو">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
             stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h11a4.5 4.5 0 1 1 0 9H8"/><path d="m8 5-4 4 4 4"/></svg>
      </button>
      <button class="fab nope" id="btnNope" aria-label="رد کردن">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"
             stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
  </div>`;
}
function renderCard(){
  const deck=$('#deck');
  if(!queue.length){
    deck.innerHTML=`<div class="card" style="padding:40px 22px;text-align:center">
      <b style="font-size:16px">فعلاً کسی نیست</b>
      <p class="muted" style="font-size:13px;line-height:1.9;margin:10px 0 16px">همه پیشنهادها را دیدید.</p>
      <button class="btn btn-primary" onclick="resetDeck()">شروع دوباره</button></div>`;
    return;
  }
  current=queue[0];
  deck.innerHTML=cardHTML(current);
  bindCard();
}
function resetDeck(){ queue=[...DATA.people]; renderCard(); }
function bindCard(){
  const card=$('#card'); let x=0, startX=0, dragging=false;
  const like=$('#stampLike'), nope=$('#stampNope'), tl=$('#tintLike'), tn=$('#tintNope');
  const set=()=>{
    card.style.transform=`translateX(${x}px) rotate(${x/22}deg)`;
    const l=Math.min(Math.max(x,0)/110,1), n=Math.min(Math.max(-x,0)/110,1);
    like.style.opacity=l; nope.style.opacity=n; tl.style.opacity=l*.18; tn.style.opacity=n*.18;
  };
  const down=e=>{dragging=true;startX=(e.touches?e.touches[0].clientX:e.clientX);card.style.transition='none';};
  const move=e=>{if(!dragging)return;x=(e.touches?e.touches[0].clientX:e.clientX)-startX;set();};
  const up=()=>{
    if(!dragging)return; dragging=false; card.style.transition='transform .28s ease';
    if(x>110) decide('like'); else if(x<-110) decide('nope'); else {x=0;set();}
  };
  card.addEventListener('touchstart',down,{passive:true});
  card.addEventListener('touchmove',move,{passive:true});
  card.addEventListener('touchend',up);
  card.addEventListener('mousedown',down); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  $('#btnLike').onclick=()=>decide('like');
  $('#btnNope').onclick=()=>decide('nope');
  $('#btnUndo').onclick=()=>toast('لغو آخرین انتخاب (در نسخه کامل فعال است)');
  window.__fly=(dir)=>{x=dir==='like'?500:-500;set();};
}
function decide(kind){
  const p=current; window.__fly(kind);
  setTimeout(()=>{
    queue.shift(); renderCard();
    if(kind==='like' && Math.random()<0.6){ addMatch(p); showMatch(p); }
  },260);
}
function addMatch(p){
  if(matches.find(m=>m.name===p.name))return;
  matches.push({...p, msgs:[{me:false,text:`سلام! خوشحالم که همدیگر را پسندیدیم 😊`.replace(' 😊',''),t:nowTime()}], unread:1});
  setBadge(matches.reduce((a,m)=>a+m.unread,0));
}
function showMatch(p){
  $('#mA').src=DATA.me; $('#mB').src=p.img; $('#matchSheet').classList.add('on');
  $('#goChatBtn').onclick=()=>{closeSheet();openChat(p.name);};
}
function closeSheet(){ $('#matchSheet').classList.remove('on'); }
function setBadge(n){
  const b=$('#navBadge'); if(n>0){b.style.display='grid';b.textContent=fa(n);} else b.style.display='none';
}

/* ---------- آشنایی‌ها ---------- */
function renderMatches(){
  const box=$('#matchList');
  $('#noMatch').style.display=matches.length?'none':'block';
  box.innerHTML=matches.map(m=>`<div class="row" onclick="openChat('${m.name}')">
      <img class="av" src="${m.img}" alt="">
      <div class="t"><b>${m.name}, ${fa(m.age)}
        ${m.verified?'<svg width="15" height="15" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 1.8l2.4 1.9 3-.3 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.3L12 22.2l-2.4-1.9-3 .3-1-2.9L3 16.1l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .3L12 1.8Z"/><path d="m8.4 12.2 2.5 2.4 4.7-4.8" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
      </b><p>${m.msgs[m.msgs.length-1].text}</p></div>
      ${m.unread?`<span class="badge">${fa(m.unread)}</span>`:''}
    </div>`).join('');
}

/* ---------- چت ---------- */
let chatWith=null;
function nowTime(){ return fa(new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})); }
function openChat(name){
  chatWith=matches.find(m=>m.name===name); if(!chatWith)return;
  chatWith.unread=0; setBadge(matches.reduce((a,m)=>a+m.unread,0));
  $('#chatAv').src=chatWith.img; $('#chatName').textContent=chatWith.name;
  $('#chatStatus').textContent=T[lang].online;
  drawMsgs(); go('chat');
}
function drawMsgs(typing){
  const box=$('#msgs');
  box.innerHTML=`<div class="day"><span>امروز</span></div>` + chatWith.msgs.map(m=>
    `<div class="b ${m.me?'me':'you'}">${m.text}<time>${m.t}${m.me?' ✓✓':''}</time></div>`).join('')
    + (typing?`<div class="typing"><i></i><i></i><i></i></div>`:'');
  box.scrollTop=box.scrollHeight;
}
$('#composer').onsubmit=e=>{
  e.preventDefault();
  const el=$('#msgInput'), text=el.value.trim(); if(!text||!chatWith)return;
  chatWith.msgs.push({me:true,text,t:nowTime()}); el.value=''; el.style.height='auto'; drawMsgs();
  $('#chatStatus').textContent=T[lang].typing;
  setTimeout(()=>{ drawMsgs(true); },700);
  setTimeout(()=>{
    const replies=['جالبه! بیشتر بگو 🙂'.replace(' 🙂',''),'موافقم، منم همین حس رو دارم.','آخر هفته وقتت آزاده؟','چه خوب! از کجا شروع کردی؟'];
    chatWith.msgs.push({me:false,text:replies[Math.floor(Math.random()*replies.length)],t:nowTime()});
    $('#chatStatus').textContent=T[lang].online; drawMsgs();
  },2200);
};
$('#msgInput').addEventListener('input',e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,100)+'px';});

/* ---------- پیام کوتاه ---------- */
function toast(text){
  const d=document.createElement('div');
  d.textContent=text;
  d.style.cssText='position:fixed;bottom:110px;inset-inline:40px;z-index:95;background:var(--ink);color:#fff;'+
    'padding:12px 16px;border-radius:16px;font-size:12px;font-weight:700;text-align:center;opacity:0;transition:.25s';
  document.body.appendChild(d); requestAnimationFrame(()=>d.style.opacity='.95');
  setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),300);},2200);
}

renderCard();
</script>
</body>
</html>
"""

out = HTML.replace('__DATA__', DATA)
target = ROOT / 'docs' / 'DEMO.html'
target.write_text(out, encoding='utf-8')
print(f"ساخته شد: {target} ({target.stat().st_size/1024/1024:.1f} مگابایت)")
