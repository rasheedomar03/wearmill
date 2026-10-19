import { Resend } from "resend";
import { NextResponse } from "next/server";

// ── Rate limiter (in-memory, per serverless instance) ──────────
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;            // 5 submissions per IP per hour

const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Clean stale entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
}, 10 * 60 * 1000);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  // Rate limit by IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot check — bots fill hidden fields
  if (body.hp_website) {
    return NextResponse.json({ success: true });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const business = typeof body.business === "string" ? body.business.trim().slice(0, 200) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 320) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";
  const productType = typeof body.productType === "string" ? body.productType.trim().slice(0, 100) : "";
  const quantity = typeof body.quantity === "string" ? body.quantity.trim().slice(0, 50) : "";
  const attachmentName = typeof body.attachmentName === "string" ? body.attachmentName.trim().slice(0, 255) : "";
  const attachmentData = typeof body.attachmentData === "string" ? body.attachmentData : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Attachment size check (4 MB base64 ≈ 5.6 MB string)
  if (attachmentData && attachmentData.length > 6_000_000) {
    return NextResponse.json({ error: "Attachment too large." }, { status: 400 });
  }

  const safeName = escapeHtml(name);
  const safeBusiness = escapeHtml(business);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);
  const safeProductType = escapeHtml(productType);
  const safeQuantity = escapeHtml(quantity);

  const notificationPayload: Parameters<typeof resend.emails.send>[0] = {
    from: "Wearmill Quote Form <onboarding@resend.dev>",
    to: ["hello@wearmill.com"],
    replyTo: email,
    subject: `Quote Request from ${name.replace(/[<>"]/g, "")}${business ? ` — ${business.replace(/[<>"]/g, "")}` : ""}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px;">
        <h2 style="margin-bottom: 4px;">New Quote Request</h2>
        <p style="color: #666; margin-top: 0; margin-bottom: 24px;">Via wearmill.com</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999; width: 120px;">Name</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999;">Business</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeBusiness || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
          </tr>
          ${safeProductType ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999;">Product</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${safeProductType}</td>
          </tr>` : ""}
          ${safeQuantity ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999;">Quantity</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${safeQuantity}</td>
          </tr>` : ""}
        </table>

        <h3 style="margin-top: 24px; margin-bottom: 8px;">What they need</h3>
        <p style="background: #f5f5f5; padding: 16px; border-radius: 6px; white-space: pre-wrap;">${safeMessage}</p>

        <p style="margin-top: 32px; color: #999; font-size: 13px;">
          Reply directly to this email to respond to ${safeName}.
        </p>
      </div>
    `,
  };

  if (attachmentName && attachmentData) {
    notificationPayload.attachments = [
      {
        filename: attachmentName,
        content: Buffer.from(attachmentData, "base64"),
      },
    ];
  }

  const { error } = await resend.emails.send(notificationPayload);

  if (error) {
    return NextResponse.json({ error: "Failed to send. Please try again." }, { status: 500 });
  }

  // Auto-acknowledgment to the customer
  // NOTE: requires wearmill.com verified as a sending domain in Resend.
  // Until then this send will fail silently and the form still succeeds.
  const firstName = name.split(" ")[0];
  await resend.emails.send({
    from: "Rasheed at Wearmill <hello@wearmill.com>",
    to: [email],
    replyTo: "hello@wearmill.com",
    subject: "Got your quote request",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; color: #1a1a1a;">
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Got your request. I'll send a quote back within 24 hours.</p>
        <p>If you have any files or additional details to share in the meantime, just reply here.</p>
        <p style="margin-top: 32px;">Rasheed<br>Wearmill | wearmill.com<br>(713) 966-0328</p>
      </div>
    `,
  }).catch(() => {
    // Domain not verified yet — fail silently so the form still works
  });

  return NextResponse.json({ success: true });
}
