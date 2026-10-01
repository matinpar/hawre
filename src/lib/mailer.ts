import 'server-only';

/**
 * ارسال ایمیل تراکنشی.
 *
 * ساده‌ترین و کم‌هزینه‌ترین گزینه انتخاب شده است: Resend از طریق REST API
 * (بدون نصب SDK، فقط یک fetch). اگر `RESEND_API_KEY` تعریف نشده باشد،
 * ایمیل ارسال نمی‌شود و محتوا فقط در کنسول سرور چاپ می‌گردد — دقیقاً مثل قبل،
 * تا پروژه بدون هیچ سرویس بیرونی هم کار کند.
 */

const BRAND = 'هاوڕێ';
const ACCENT = '#f95c4b';
const ACCENT_2 = '#ffaf4b';

export type MailResult = { sent: boolean; skipped?: string; error?: string };

function appUrl() {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/** قالب مشترک HTML — RTL، بدون فایل خارجی، سازگار با Gmail و Outlook */
function layout(opts: { title: string; intro: string; body: string; cta?: { label: string; url: string }; footerNote?: string }) {
  const { title, intro, body, cta, footerNote } = opts;
  return `<!doctype html>
<html lang="fa" dir="rtl">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${title}</title></head>
  <body style="margin:0;padding:0;background:#fdf6f2;font-family:Tahoma,'Segoe UI',Arial,sans-serif;color:#2a1427;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f2;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 40px -24px rgba(42,20,39,.45);">
          <tr>
            <td style="background:linear-gradient(135deg,${ACCENT} 0%,#ff7a45 52%,${ACCENT_2} 100%);padding:26px 28px;">
              <div style="font-size:22px;font-weight:bold;color:#ffffff;">${BRAND}</div>
              <div style="font-size:12px;color:rgba(255,255,255,.9);margin-top:4px;">آشنایی ساده و امن</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:19px;">${title}</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:2;color:#5c4a55;">${intro}</p>
              ${body}
              ${
                cta
                  ? `<div style="text-align:center;margin:26px 0 8px;">
                       <a href="${cta.url}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 30px;border-radius:14px;">${cta.label}</a>
                     </div>
                     <p style="margin:12px 0 0;font-size:11px;line-height:1.9;color:#9b869a;word-break:break-all;">اگر دکمه کار نکرد، این نشانی را در مرورگر باز کنید:<br/>${cta.url}</p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid #f2e7f0;font-size:11px;line-height:1.9;color:#9b869a;">
              ${footerNote ?? 'اگر این درخواست از سوی شما نبوده، این ایمیل را نادیده بگیرید.'}<br/>
              ${BRAND} — پروژه آزمایشی آشنایی آنلاین · ساخته شده توسط عبدالمتین پرچین
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** تبدیل ساده HTML به متن ساده برای کلاینت‌هایی که HTML نمایش نمی‌دهند */
function toPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function send(to: string, subject: string, html: string): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? 'Hawre <onboarding@resend.dev>';

  if (!key) {
    console.info(`[MAIL:SKIPPED] سرویس ایمیل تنظیم نشده. گیرنده: ${to} | موضوع: ${subject}`);
    return { sent: false, skipped: 'RESEND_API_KEY تعریف نشده است.' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text: toPlainText(html) }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[MAIL:ERROR]', res.status, detail.slice(0, 300));
      return { sent: false, error: `ارسال ایمیل ناموفق بود (${res.status})` };
    }
    console.info(`[MAIL:SENT] ${subject} → ${to}`);
    return { sent: true };
  } catch (err) {
    console.error('[MAIL:ERROR]', err);
    return { sent: false, error: 'خطا در ارتباط با سرویس ایمیل' };
  }
}

/* ---------------------------- قالب‌ها ---------------------------- */

export function sendVerificationEmail(to: string, url: string) {
  return send(
    to,
    `${BRAND} | تأیید ایمیل`,
    layout({
      title: 'به هاوڕێ خوش آمدید 👋',
      intro: 'برای فعال‌سازی کامل حساب، ایمیل خود را تأیید کنید. این لینک تا ۲۴ ساعت معتبر است.',
      body: '<p style="margin:0;font-size:13px;line-height:2;color:#5c4a55;">پس از تأیید می‌توانید پروفایل خود را کامل کنید و افراد هم‌سلیقه را ببینید.</p>',
      cta: { label: 'تأیید ایمیل', url },
      footerNote: 'اگر شما در هاوڕێ ثبت‌نام نکرده‌اید، این ایمیل را نادیده بگیرید؛ حسابی فعال نخواهد شد.',
    }),
  );
}

export function sendPasswordResetEmail(to: string, url: string) {
  return send(
    to,
    `${BRAND} | بازیابی رمز عبور`,
    layout({
      title: 'بازیابی رمز عبور',
      intro: 'برای انتخاب رمز تازه روی دکمه زیر بزنید. این لینک تا ۶۰ دقیقه معتبر است و فقط یک بار کار می‌کند.',
      body: '<p style="margin:0;font-size:13px;line-height:2;color:#5c4a55;">اگر لینک منقضی شد، دوباره از صفحه ورود درخواست بازیابی بدهید.</p>',
      cta: { label: 'انتخاب رمز جدید', url },
      footerNote: 'اگر شما درخواست بازیابی نداده‌اید، رمز فعلی شما امن است و نیازی به اقدام نیست.',
    }),
  );
}

export function sendNewMatchEmail(to: string, peerName: string) {
  return send(
    to,
    `${BRAND} | یک آشنایی دوطرفه تازه`,
    layout({
      title: 'یک آشنایی دوطرفه شکل گرفت 🎉',
      intro: `شما و ${peerName} به هم علاقه نشان دادید. حالا می‌توانید گفت‌وگو را شروع کنید.`,
      body: '<p style="margin:0;font-size:13px;line-height:2;color:#5c4a55;">یک سلام ساده برای شروع کافی است. نکات ایمنی را در صفحه حریم خصوصی بخوانید.</p>',
      cta: { label: 'رفتن به گفت‌وگو', url: `${appUrl()}/matches` },
      footerNote: 'برای خاموش‌کردن این اعلان‌ها، به بخش تنظیمات ← اعلان آشنایی‌های تازه بروید.',
    }),
  );
}

export function sendVerificationResultEmail(to: string, approved: boolean, note?: string) {
  return approved
    ? send(
        to,
        `${BRAND} | پروفایل شما تأیید شد`,
        layout({
          title: 'پروفایل شما تأیید شد ✔️',
          intro: 'از این پس نشان «تأییدشده» کنار نام شما نمایش داده می‌شود و اعتماد دیگران بیشتر می‌شود.',
          body: '<p style="margin:0;font-size:13px;line-height:2;color:#5c4a55;">عکس سلفیِ تأیید هویت پس از بررسی حذف شد و در پروفایل شما نمایش داده نمی‌شود.</p>',
          cta: { label: 'مشاهده پروفایل', url: `${appUrl()}/profile` },
        }),
      )
    : send(
        to,
        `${BRAND} | نتیجه بررسی تأیید هویت`,
        layout({
          title: 'درخواست تأیید هویت پذیرفته نشد',
          intro: 'متأسفانه تصویر ارسالی قابل تأیید نبود. می‌توانید دوباره و با رعایت نکات زیر تلاش کنید.',
          body: `<ul style="margin:0;padding-right:18px;font-size:13px;line-height:2.1;color:#5c4a55;">
                   <li>صورت شما کاملاً واضح و بدون فیلتر باشد.</li>
                   <li>همان ژست خواسته‌شده را انجام دهید.</li>
                   <li>نور کافی باشد و تصویر تار نباشد.</li>
                 </ul>${note ? `<p style="margin:14px 0 0;font-size:13px;color:#5c4a55;">یادداشت بررسی‌کننده: ${note}</p>` : ''}`,
          cta: { label: 'ارسال دوباره', url: `${appUrl()}/profile` },
        }),
      );
}

export function mailerConfigured() {
  return !!process.env.RESEND_API_KEY;
}
