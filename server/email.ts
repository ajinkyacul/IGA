import { User } from "@shared/schema";

export interface EmailService {
  sendQuestionUpdatedNotification(user: User, questionTitle: string, questionId: number): Promise<void>;
  sendResponseAddedNotification(user: User, questionTitle: string, questionId: number): Promise<void>;
  sendFileUploadedNotification(user: User, questionTitle: string, questionId: number, fileName: string): Promise<void>;
}

class ConsoleEmailService implements EmailService {
  async sendQuestionUpdatedNotification(user: User, questionTitle: string, questionId: number): Promise<void> {
    console.log(`[EMAIL] Question Updated Notification to ${user.email}`);
    console.log(`Subject: [IdGov Platform] Question Updated: ${questionTitle}`);
    console.log(`Body: A question has been updated: "${questionTitle}". Click here to view: /question/${questionId}`);
  }

  async sendResponseAddedNotification(user: User, questionTitle: string, questionId: number): Promise<void> {
    console.log(`[EMAIL] Response Added Notification to ${user.email}`);
    console.log(`Subject: [IdGov Platform] New Response to: ${questionTitle}`);
    console.log(`Body: A new response has been added to question: "${questionTitle}". Click here to view: /question/${questionId}`);
  }

  async sendFileUploadedNotification(user: User, questionTitle: string, questionId: number, fileName: string): Promise<void> {
    console.log(`[EMAIL] File Uploaded Notification to ${user.email}`);
    console.log(`Subject: [IdGov Platform] New File Uploaded: ${questionTitle}`);
    console.log(`Body: A new file "${fileName}" has been uploaded to question: "${questionTitle}". Click here to view: /question/${questionId}`);
  }
}

// For a production application, you would implement a real email service using SMTP or Mailgun
// class SmtpEmailService implements EmailService {
//   private transport: nodemailer.Transporter;
//   
//   constructor() {
//     this.transport = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: parseInt(process.env.SMTP_PORT || '587'),
//       secure: process.env.SMTP_SECURE === 'true',
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASSWORD,
//       },
//     });
//   }
//   
//   async sendQuestionUpdatedNotification(user: User, questionTitle: string, questionId: number): Promise<void> {
//     await this.transport.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: user.email,
//       subject: `[IdGov Platform] Question Updated: ${questionTitle}`,
//       html: `<p>A question has been updated: "${questionTitle}".</p><p><a href="${process.env.APP_URL}/question/${questionId}">Click here to view</a></p>`,
//     });
//   }
//   
//   // Implement other methods similarly
// }

// Export the appropriate email service based on environment
export const emailService: EmailService = new ConsoleEmailService();
