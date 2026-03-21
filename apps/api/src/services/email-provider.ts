import { Resend } from "resend";

export type SendEmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; code: string; message: string };

export function createResendProvider(apiKey: string) {
  const resend = new Resend(apiKey);
  return {
    async send(payload: SendEmailPayload): Promise<SendEmailResult> {
      const { data, error } = await resend.emails.send({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      if (error) {
        return {
          ok: false,
          code: "resend_error",
          message: error.message,
        };
      }
      const id = data?.id;
      if (!id) {
        return {
          ok: false,
          code: "missing_provider_id",
          message: "Provider returned no message id",
        };
      }
      return { ok: true, providerMessageId: id };
    },
  };
}
