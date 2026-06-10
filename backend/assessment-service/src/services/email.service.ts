import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Assessment } from '../entities/assessment.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Only authenticate when credentials are provided — auth-less relays
    // (MailHog in dev/staging, IP-allowlisted relays in prod) reject AUTH.
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth,
    });
  }

  async sendInvitation(
    email: string,
    candidateName: string,
    assessment: Assessment,
    token: string,
    customMessage?: string,
    expiresAt?: Date,
  ): Promise<void> {
    const assessmentUrl = `${process.env.FRONTEND_URL}/assessment/${token}`;

    const emailHtml = this.generateInvitationEmail(
      candidateName || 'Candidate',
      assessment,
      assessmentUrl,
      customMessage,
      expiresAt,
    );

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'CodeSphere <noreply@codesphere.com>',
      to: email,
      subject: `Invitation: ${assessment.title}`,
      html: emailHtml,
    });
  }

  private generateInvitationEmail(
    candidateName: string,
    assessment: Assessment,
    assessmentUrl: string,
    customMessage?: string,
    expiresAt?: Date,
  ): string {
    const expiryText = expiresAt
      ? `This invitation expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 CodeSphere Assessment</h1>
          </div>
          <div class="content">
            <p>Hi ${candidateName},</p>

            ${customMessage ? `<p>${customMessage}</p>` : ''}

            <p>You have been invited to complete a coding assessment:</p>

            <div class="info-box">
              <h2 style="margin-top: 0;">${assessment.title}</h2>
              ${assessment.description ? `<p>${assessment.description}</p>` : ''}
              <p><strong>Duration:</strong> ${assessment.durationMinutes} minutes</p>
              <p><strong>Problems:</strong> ${assessment.assessmentProblems?.length || 0} coding challenges</p>
              ${expiryText ? `<p><strong>⏰ ${expiryText}</strong></p>` : ''}
            </div>

            <p style="text-align: center;">
              <a href="${assessmentUrl}" class="button">Start Assessment</a>
            </p>

            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:<br>
              <a href="${assessmentUrl}">${assessmentUrl}</a>
            </p>

            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>You can only take this assessment once</li>
              <li>Make sure you have a stable internet connection</li>
              <li>The timer starts when you begin the assessment</li>
              <li>Your progress will be automatically saved</li>
            </ul>

            <p>Good luck! 🚀</p>
          </div>
          <div class="footer">
            <p>This is an automated email from CodeSphere. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} CodeSphere. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  async sendAssessmentCompleted(
    email: string,
    candidateName: string,
    assessment: Assessment,
    score: number,
    percentage: number,
  ): Promise<void> {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px;
            }
            .content {
              padding: 30px;
            }
            .score-box {
              background: #f0fdf4;
              border: 2px solid #10b981;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .score {
              font-size: 48px;
              font-weight: bold;
              color: #10b981;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Assessment Completed!</h1>
          </div>
          <div class="content">
            <p>Hi ${candidateName},</p>

            <p>Thank you for completing the <strong>${assessment.title}</strong> assessment.</p>

            <div class="score-box">
              <div class="score">${percentage}%</div>
              <p>Your Score: ${score} points</p>
            </div>

            <p>Your submission has been recorded and will be reviewed by our team.</p>

            <p>We appreciate your time and effort!</p>

            <p>Best regards,<br>The CodeSphere Team</p>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'CodeSphere <noreply@codesphere.com>',
      to: email,
      subject: `Assessment Completed: ${assessment.title}`,
      html: emailHtml,
    });
  }
}
