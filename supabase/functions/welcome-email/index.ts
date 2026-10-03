type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  welcome_email_status: "pending" | "sent" | "failed";
};

type InsertPayload = {
  type: "INSERT";
  table: "profiles";
  schema: "public";
  record: Profile;
  old_record: null;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character]!,
  );
}

function welcomeEmail(profile: Profile, siteUrl: string) {
  const firstName = escapeHtml(
    profile.display_name?.trim().split(/\s+/)[0] || "there",
  );
  const guidesUrl = `${siteUrl}/guides`;
  const startUrl = `${siteUrl}/guides/building-your-first-mcp-server`;

  return {
    subject: "Welcome to All Things MCP",
    text: `Hi ${firstName},\n\nWelcome to All Things MCP — a practical place to understand MCP, build with it, and keep up with the protocol.\n\nA good place to start:\n1. Browse the Guides: ${guidesUrl}\n2. Build your first MCP server: ${startUrl}\n3. Follow Spec Watch for changes that affect your implementation: ${siteUrl}/spec-watch\n\nSee you inside,\nAll Things MCP`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f9fc;color:#091225;font-family:Inter,Arial,sans-serif">
    <div style="max-width:620px;margin:0 auto;padding:40px 20px">
      <div style="background:#071426;border-radius:14px 14px 0 0;padding:30px;color:#fff">
        <p style="margin:0 0 12px;color:#8fb1ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">All Things MCP</p>
        <h1 style="margin:0;font-size:32px;line-height:1.15">Welcome, ${firstName}.</h1>
      </div>
      <div style="background:#fff;border:1px solid #dde3ed;border-top:0;border-radius:0 0 14px 14px;padding:30px">
        <p style="margin:0 0 24px;color:#3e4c66;font-size:16px;line-height:1.7">You now have a practical place to understand MCP, build with it, and keep up with the protocol.</p>
        <h2 style="margin:0 0 14px;font-size:18px">Start here</h2>
        <ol style="padding-left:22px;margin:0 0 28px;color:#3e4c66;line-height:1.8">
          <li><a href="${guidesUrl}" style="color:#0a55ff;font-weight:600">Browse the Guides</a></li>
          <li><a href="${startUrl}" style="color:#0a55ff;font-weight:600">Build your first MCP server</a></li>
          <li><a href="${siteUrl}/spec-watch" style="color:#0a55ff;font-weight:600">Follow Spec Watch</a></li>
        </ol>
        <a href="${startUrl}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:#0a55ff;color:#fff;font-weight:700;text-decoration:none">Start building</a>
        <p style="margin:28px 0 0;color:#66738c;font-size:13px">See you inside,<br>All Things MCP</p>
      </div>
    </div>
  </body>
</html>`,
  };
}

Deno.serve(async (request) => {
  const webhookSecret = Deno.env.get("WELCOME_EMAIL_WEBHOOK_SECRET");
  const authorization = request.headers.get("authorization");
  if (!webhookSecret || authorization !== `Bearer ${webhookSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as InsertPayload;
  if (
    payload.type !== "INSERT" ||
    payload.schema !== "public" ||
    payload.table !== "profiles" ||
    !payload.record?.email ||
    payload.record.welcome_email_status !== "pending"
  ) {
    return Response.json({ ignored: true });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("WELCOME_EMAIL_FROM");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = (
    Deno.env.get("SITE_URL") || "https://allthingsmcp.com"
  ).replace(/\/$/, "");
  if (!resendKey || !from || !supabaseUrl || !serviceKey) {
    return Response.json(
      { error: "Email delivery is not configured" },
      { status: 503 },
    );
  }

  const message = welcomeEmail(payload.record, siteUrl);
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendKey}`,
      "content-type": "application/json",
      "idempotency-key": `welcome-${payload.record.id}`,
    },
    body: JSON.stringify({
      from,
      to: [payload.record.email],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  const status = emailResponse.ok ? "sent" : "failed";
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${payload.record.id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      welcome_email_status: status,
      welcome_email_sent_at: emailResponse.ok ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!emailResponse.ok) {
    return Response.json(
      { error: "Welcome email could not be sent" },
      { status: 502 },
    );
  }
  return Response.json({ sent: true });
});
