const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'abhijith.k@elektrobit.com',
    pass: process.env.SMTP_PASS || '',
  },
  tls: { rejectUnauthorized: false },
});

const FROM_ADDRESS = process.env.SMTP_USER || 'abhijith.k@elektrobit.com';

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

  const isRecognition = context === 'recognition';
  const subject = isRecognition
    ? `🏆 ${mentionedBy} recognized you on Knowledge Factory!`
    : `${mentionedBy} mentioned you in ${context === 'reply' ? 'a reply on' : ''} "${feedbackTitle || 'Open Feedback'}"`;

  const headerText = isRecognition ? 'You were recognized! 🎉' : 'You were mentioned!';
  const bodyText = isRecognition
    ? `<strong>${mentionedBy}</strong> recognized you on the Recognition Wall:`
    : `<strong>${mentionedBy}</strong> mentioned you in ${context === 'reply' ? 'a reply on' : 'a feedback post titled'} "<strong>${feedbackTitle || 'Untitled'}</strong>":`;
  const footerText = isRecognition ? '— Knowledge Factory · Recognition Wall' : '— Knowledge Factory · Open Feedback';
  const gradient = isRecognition ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'linear-gradient(135deg, #4f46e5, #6366f1)';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${gradient}; padding: 20px 24px;">
        <h2 style="color: #fff; margin: 0; font-size: 18px;">${headerText}</h2>
      </div>
      <div style="padding: 24px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi <strong>${mentionedName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          ${bodyText}
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 20px;">
          <p style="color: #475569; font-size: 13px; margin: 0; white-space: pre-wrap; line-height: 1.5;">${messageText}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          ${footerText}
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

/**
 * Send celebration wish email.
 */
async function sendCelebrationWishEmail({ toEmail, recipientName, senderName, type, message }) {
  if (!toEmail) return;

  const isBirthday = type === 'birthday';
  const emoji = isBirthday ? '🎂' : '🏆';
  const occasion = isBirthday ? 'Birthday' : 'Work Anniversary';
  const gradient = isBirthday
    ? 'linear-gradient(135deg, #ec4899, #f43f5e)'
    : 'linear-gradient(135deg, #f59e0b, #d97706)';

  const subject = `${emoji} ${senderName} sent you a ${occasion} wish!`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${gradient}; padding: 20px 24px; text-align: center;">
        <h2 style="color: #fff; margin: 0; font-size: 22px;">${emoji} Happy ${occasion}! ${emoji}</h2>
      </div>
      <div style="padding: 24px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi <strong>${recipientName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          <strong>${senderName}</strong> has sent you a ${occasion.toLowerCase()} wish:
        </p>
        <div style="background: #f8fafc; border-left: 4px solid ${isBirthday ? '#ec4899' : '#f59e0b'}; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 20px;">
          <p style="color: #475569; font-size: 14px; margin: 0; white-space: pre-wrap; line-height: 1.5;">${message}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          — Knowledge Factory · Celebrations
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Knowledge Factory" <${FROM_ADDRESS}>`,
      to: toEmail,
      subject,
      html,
    });
    console.log(`Celebration wish email sent to ${toEmail}`);
  } catch (err) {
    console.error(`Failed to send celebration wish email to ${toEmail}:`, err.message);
  }
}

module.exports = { sendMentionNotification, sendCelebrationWishEmail };
