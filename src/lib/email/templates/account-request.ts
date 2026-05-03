/**
 * Account Request Email Template
 * Renders a dark-themed HTML email for new account request notifications
 */

export interface AccountRequestEmailData {
  firstName: string
  lastName: string
  email?: string | null
  phone: string
  department?: string | null
  title?: string | null
  supervisorName: string
  submittedAt: string
  reviewUrl: string
}

/**
 * Render account request notification email
 */
export function renderAccountRequestEmail(data: AccountRequestEmailData): {
  subject: string
  html: string
} {
  const {
    firstName,
    lastName,
    email,
    phone,
    department,
    title,
    supervisorName,
    submittedAt,
    reviewUrl,
  } = data

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digital.xasecurity.ca'
  const logoUrl = `${appUrl}/Logos/Horizontal Wordmark/PNG/72 ppi/XA Horizontal Wordmark-White.png`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Account Request</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0a0a0a;
      padding: 20px;
    }
    .card {
      background-color: #141414;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background-color: #1a1a1a;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #2a2a2a;
    }
    .header img {
      max-height: 50px;
      width: auto;
    }
    .content {
      padding: 32px 24px;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 14px;
      color: #b0b0b0;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }
    .section-label {
      font-size: 12px;
      font-weight: 600;
      color: #FFC107;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 24px 0 12px 0;
    }
    .details-card {
      background-color: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #252525;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 13px;
      font-weight: 500;
      color: #808080;
      min-width: 100px;
    }
    .detail-value {
      font-size: 13px;
      color: #e0e0e0;
      text-align: right;
      flex: 1;
      margin-left: 12px;
      word-break: break-word;
    }
    .cta-button {
      display: inline-block;
      background-color: #FFC107;
      color: #000000;
      padding: 12px 28px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-top: 8px;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #FFD54F;
    }
    .footer {
      background-color: #0f0f0f;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #2a2a2a;
    }
    .footer-text {
      font-size: 12px;
      color: #707070;
      margin: 0;
      line-height: 1.6;
    }
    .footer-link {
      color: #FFC107;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <img src="${logoUrl}" alt="XA Security" style="max-height: 50px;">
      </div>

      <!-- Content -->
      <div class="content">
        <h1 class="title">New Account Request</h1>
        <p class="subtitle">A new account request has been submitted and is awaiting review.</p>

        <div class="section-label">Request Details</div>
        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <span class="detail-value">${firstName} ${lastName}</span>
          </div>
          ${
            email
              ? `<div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value"><a href="mailto:${email}" style="color: #FFC107; text-decoration: none;">${email}</a></span>
          </div>`
              : ''
          }
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value"><a href="tel:${phone}" style="color: #FFC107; text-decoration: none;">${phone}</a></span>
          </div>
          ${
            department
              ? `<div class="detail-row">
            <span class="detail-label">Department</span>
            <span class="detail-value">${department}</span>
          </div>`
              : ''
          }
          ${
            title
              ? `<div class="detail-row">
            <span class="detail-label">Title</span>
            <span class="detail-value">${title}</span>
          </div>`
              : ''
          }
          <div class="detail-row">
            <span class="detail-label">Supervisor</span>
            <span class="detail-value">${supervisorName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Submitted</span>
            <span class="detail-value">${submittedAt}</span>
          </div>
        </div>

        <a href="${reviewUrl}" class="cta-button">Review Request →</a>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          XA Security · <a href="https://xasecurity.ca" class="footer-link">xasecurity.ca</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  return {
    subject: `New Account Request — ${firstName} ${lastName}`,
    html,
  }
}
