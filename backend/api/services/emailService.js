const nodemailer = require('nodemailer');
const xlsx = require('xlsx');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetCode(email, code) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] Modo dev — código para ${email}: ${code}`);
    return { devMode: true, code };
  }

  try {
    await transporter.sendMail({
      from: `"Gestor Financeiro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código de recuperação de senha',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Recuperação de senha</h2>
          <p>Seu código de recuperação é:</p>
          <div style="background:#f4f4f4;padding:16px;border-radius:8px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;font-family:monospace;margin:16px 0">${code}</div>
          <p>O código expira em 15 minutos.</p>
          <hr style="border:none;border-top:1px solid #eee">
          <small style="color:#999">Se você não solicitou esta recuperação, ignore este email.</small>
        </div>
      `,
    });
    console.log(`[Email] Código enviado para ${email}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email] Falha ao enviar (${err.message}) — fallback dev`);
    console.log(`[Email] Código para ${email}: ${code}`);
    return { devMode: true, code };
  }
}

async function sendReport(userEmail, lancamentos, periodoLabel) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP não configurado — relatório não enviado');
    return { error: 'Email não configurado. Configure SMTP_USER e SMTP_PASS.' };
  }
  const wb = xlsx.utils.book_new();
  const data = lancamentos.map(l => ({
    Data: l.data, Descrição: l.descricao, Valor: Number(l.valor),
    Tipo: l.entradaSaida, Categoria: l.categoria || '',
    Pagamento: l.metodoPagamento || '', Observações: l.observacoes || '',
  }));
  const ws = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, 'Lançamentos');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  try {
    await transporter.sendMail({
      from: `"Gestor Financeiro" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Relatório Financeiro — ${periodoLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Relatório Financeiro</h2>
          <p>Segue em anexo o relatório do período <strong>${periodoLabel}</strong>.</p>
          <p>Total de lançamentos: ${lancamentos.length}</p>
          <hr style="border:none;border-top:1px solid #eee">
          <small style="color:#999">Gestor Financeiro — Relatório automático</small>
        </div>
      `,
      attachments: [{ filename: `relatorio-${periodoLabel.replace(/\s+/g, '-')}.xlsx`, content: buffer }],
    });
    console.log(`[Email] Relatório enviado para ${userEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email] Falha ao enviar relatório: ${err.message}`);
    throw new Error('Falha ao enviar email: ' + err.message);
  }
}

module.exports = { sendResetCode, sendReport };
