import nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(
  toParam: string | EmailData,
  subjectParam?: string,
  htmlParam?: string,
  attachmentsParam?: EmailAttachment[]
) {
  try {
    // Handle both object and parameter-based calls
    let to: string;
    let subject: string;
    let html: string;
    let attachments: EmailAttachment[] | undefined;

    if (typeof toParam === 'object' && toParam !== null) {
      // Handle object input
      const emailData = toParam as EmailData;
      to = emailData.to;
      subject = emailData.subject;
      html = emailData.html || emailData.text || '';
      attachments = emailData.attachments;
    } else {
      // Handle parameter-based input
      to = toParam as string;
      subject = subjectParam || '';
      html = htmlParam || '';
      attachments = attachmentsParam;
    }

    // Validate email
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.error('Invalid email address:', to);
      return false;
    }

    const cleanEmail = to.trim().toLowerCase();
    console.log('Sending email to:', cleanEmail);

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'crewarthmanager@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD // This should be an App Password, not your regular password
      }
    });

    // Prepare email data
    const mailOptions = {
      from: '"ShapeShift AI" <crewarthmanager@gmail.com>',
      to: cleanEmail,
      subject: subject,
      html: html,
      attachments: attachments?.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
} 