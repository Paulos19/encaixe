import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/welcome-email';
import { SubscriptionSuccessEmail } from '@/emails/subscription-success-email';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// --- FUNÇÕES DE DISPARO ---

/**
 * Envia o email de boas-vindas após o cadastro.
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const emailHtml = await render(WelcomeEmail({ name }));

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Bem-vindo ao Encaixe Já, ${name.split(' ')[0]}! 🚀`,
      html: emailHtml,
    });
    console.log(`📧 Email de boas-vindas enviado para ${email}`);
  } catch (error) {
    console.error("❌ Erro ao enviar email de boas-vindas:", error);
    // Não lançamos erro para não travar o fluxo de registro, apenas logamos
  }
}

/**
 * Envia email confirmando a assinatura de um plano.
 */
export async function sendSubscriptionSuccessEmail(email: string, name: string, planName: string) {
  try {
    const emailHtml = await render(SubscriptionSuccessEmail({ name, planName }));

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Sua assinatura do plano ${planName} está ativa! 🎉`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar email de assinatura:", error);
  }
}

export async function sendPasswordResetToken(email: string, token: string) {
  try {
    // Template simples de HTML para o código
    const html = `
      <div style="font-family: sans-serif; text-align: center; color: #333;">
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a redefinição de senha para sua conta no Encaixe Já.</p>
        <p>Seu código de verificação é:</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 10px; display: inline-block; margin: 20px 0;">
          <span style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #000;">${token}</span>
        </div>
        <p>Este código expira em 15 minutos.</p>
        <p style="font-size: 12px; color: #666;">Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Seu código de recuperação: ${token}`,
      html: html,
    });
    console.log(`🔑 Código de reset enviado para ${email}`);
  } catch (error) {
    console.error("❌ Erro ao enviar email de reset:", error);
  }
}