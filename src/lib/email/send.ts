// Envoi d'e-mails transactionnels via Resend (API REST, sans dependance SDK).
//
// Tant que RESEND_API_KEY n'est pas defini (variable d'environnement Vercel),
// l'envoi est simplement journalise et ignore : le reste du flux fonctionne.
// Des que la cle est ajoutee, les e-mails partent sans autre changement.
//
// Cette fonction ne leve jamais d'exception : un echec d'e-mail ne doit pas
// bloquer une approbation.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM =
  process.env.RESEND_FROM ?? "Togo Academy <no-reply@academie.groupebm.net>";

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(
      `[email] RESEND_API_KEY absent : e-mail non envoye a ${opts.to} ("${opts.subject}").`,
    );
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend a repondu ${res.status} : ${body}`);
      return { ok: false, error: `status ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] echec d'envoi :", e);
    return { ok: false, error: String(e) };
  }
}

const ROLE_LABEL: Record<string, string> = {
  concepteur: "enseignant-concepteur",
  inspecteur: "inspecteur",
  tutor: "tuteur",
  parent: "parent",
};

// E-mail envoye au moment ou l'administration APPROUVE le compte.
export async function sendApprovalEmail(opts: {
  to: string;
  name?: string | null;
  role: string;
  loginUrl: string;
}): Promise<SendResult> {
  const label = ROLE_LABEL[opts.role] ?? "membre";
  const hello = opts.name ? `Bonjour ${opts.name},` : "Bonjour,";
  const subject = "Votre compte Togo Academy est activé";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1a2b1f;line-height:1.6">
      <p>${hello}</p>
      <p>Bonne nouvelle : votre compte <strong>${label}</strong> sur
      <strong>Togo Academy</strong> vient d'être approuvé par l'administration.</p>
      <p>Vous pouvez maintenant vous connecter avec l'adresse e-mail et le mot de
      passe que vous avez choisis lors de votre demande.</p>
      <p style="margin:28px 0">
        <a href="${opts.loginUrl}"
           style="background:#188a4a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">
          Se connecter
        </a>
      </p>
      <p style="font-size:13px;color:#5b6b60">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${opts.loginUrl}">${opts.loginUrl}</a>
      </p>
      <p>À très vite,<br>L'équipe Togo Academy</p>
    </div>`;
  const text = `${hello}

Votre compte ${label} sur Togo Academy vient d'être approuvé.
Connectez-vous avec l'e-mail et le mot de passe que vous avez choisis :
${opts.loginUrl}

L'équipe Togo Academy`;
  return sendMail({ to: opts.to, subject, html, text });
}
