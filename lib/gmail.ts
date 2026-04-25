import { google } from "googleapis";

function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth });
}

export async function fetchUnreadEmails(maxResults = 20) {
  const gmail = getGmailClient();
  const list = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults,
  });

  const messages = list.data.messages ?? [];
  const emails: { id: string; subject: string; from: string; body: string }[] = [];

  for (const msg of messages) {
    const full = await gmail.users.messages.get({ userId: "me", id: msg.id! });
    const headers = full.data.payload?.headers ?? [];
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
    const from = headers.find((h) => h.name === "From")?.value ?? "";
    const body = extractBody(full.data.payload);
    emails.push({ id: msg.id!, subject, from, body });
  }

  return emails;
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }
  return "";
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  body: string;
  attachments?: { filename: string; content: Buffer; mimeType: string }[];
}) {
  const gmail = getGmailClient();
  const boundary = "boundary_bidsafe";

  let raw = [
    `To: ${opts.to}`,
    `From: ${process.env.GMAIL_DEMO_EMAIL}`,
    `Subject: ${opts.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    opts.body,
  ].join("\r\n");

  if (opts.attachments) {
    for (const att of opts.attachments) {
      raw += [
        "",
        `--${boundary}`,
        `Content-Type: ${att.mimeType}`,
        `Content-Disposition: attachment; filename="${att.filename}"`,
        `Content-Transfer-Encoding: base64`,
        "",
        att.content.toString("base64"),
      ].join("\r\n");
    }
  }

  raw += `\r\n--${boundary}--`;

  const encoded = Buffer.from(raw).toString("base64url");
  await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
}
