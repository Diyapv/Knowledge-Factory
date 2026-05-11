const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
});

const FROM_ADDRESS = 'Abhijith.K@elektrobit.com';

/**
 * Send mention notification email.
 * @param {string} toEmail - Recipient email
 * @param {string} mentionedName - Name of the person mentioned
 * @param {string} mentionedBy - Display name of the person who mentioned
 * @param {string} context - "feedback" or "reply"
 * @param {string} feedbackTitle - Title of the feedback post
 * @param {string} messageText - The full message text containing the mention
 */
async function sendMentionNotification({ toEmail, mentionedName, mentionedBy, context, feedbackTitle, messageText }) {
  if (!toEmail) return;

  const subject = `${mentionedBy} mentioned you in ${context === 'reply' ? 'a reply on' : ''} "${feedbackTitle || 'Open Feedback'}"`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 20px 24px;">
        <h2 style="color: #fff; margin: 0; font-size: 18px;">You were mentioned!</h2>
      </div>
      <div style="padding: 24px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi <strong>${mentionedName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          <strong>${mentionedBy}</strong> mentioned you in ${context === 'reply' ? 'a reply on' : 'a feedback post titled'}
          "<strong>${feedbackTitle || 'Untitled'}</strong>":
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 20px;">
          <p style="color: #475569; font-size: 13px; margin: 0; white-space: pre-wrap; line-height: 1.5;">${messageText}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          — Knowledge Factory · Open Feedback
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Knowledge Factory" <${FROM_ADDRESS}>`,
      to: toEmail,
      subject,
      html,
    });
    console.log(`Mention email sent to ${toEmail}`);
  } catch (err) {
    console.error(`Failed to send mention email to ${toEmail}:`, err.message);
  }
}

module.exports = { sendMentionNotification };
