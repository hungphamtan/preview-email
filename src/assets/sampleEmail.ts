export const sampleEmail = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to Acme</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; }

    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      color: #222222;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .email-wrapper { background-color: #f4f4f5; padding: 32px 16px; }
    .email-body {
      background-color: #fafafa;
      border-radius: 8px;
      max-width: 600px;
      margin: 0 auto;
      overflow: hidden;
    }
    .header { background-color: #4f46e5; padding: 32px 40px; text-align: center; }
    .header-logo { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .content { padding: 40px; background-color: #fafafa; }
    .content h1 { font-size: 28px; font-weight: 700; color: #111111; margin: 0 0 16px 0; line-height: 1.3; }
    .content p { font-size: 16px; line-height: 1.6; color: #444444; margin: 0 0 20px 0; }
    .cta-button {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 6px;
    }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
    .feature-cell {
      padding: 16px;
      background-color: #f0f0f2;
      border-radius: 6px;
      vertical-align: top;
    }
    .feature-icon { font-size: 28px; margin-bottom: 8px; }
    .feature-title { font-size: 15px; font-weight: 600; color: #222222; margin: 0 0 6px 0; }
    .feature-text { font-size: 14px; color: #555555; margin: 0; line-height: 1.5; }
    .footer { background-color: #f4f4f5; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 13px; color: #888888; margin: 0 0 8px 0; line-height: 1.5; }
    .footer a { color: #4f46e5; text-decoration: underline; }
    .img-container {
      background-color: #e0e7ff;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .img-placeholder {
      width: 100%;
      max-width: 480px;
      height: 160px;
      background-color: #c7d2fe;
      border-radius: 6px;
      display: block;
      margin: 0 auto;
    }

    @media (prefers-color-scheme: dark) {
      body { background-color: #0f0f0f; color: #e5e5e5; }
      .email-wrapper { background-color: #0f0f0f; }
      .email-body { background-color: #1c1c1e; }
      .header { background-color: #3730a3; }
      .content { background-color: #1c1c1e; }
      .content h1 { color: #f5f5f5; }
      .content p { color: #b0b0b0; }
      .cta-button { background-color: #6366f1; color: #ffffff !important; }
      .divider { border-top-color: #2e2e30; }
      .feature-cell { background-color: #2a2a2c; }
      .feature-title { color: #e5e5e5; }
      .feature-text { color: #999999; }
      .footer { background-color: #0f0f0f; }
      .footer p { color: #666666; }
      .footer a { color: #818cf8; }
      .img-container { background-color: #2e2d5e; }
      .img-placeholder { background-color: #3730a3; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <table class="email-body" cellpadding="0" cellspacing="0" width="100%">

      <tr>
        <td class="header">
          <div class="header-logo">&#9670; Acme</div>
        </td>
      </tr>

      <tr>
        <td class="content" style="padding-bottom: 0;">
          <div class="img-container">
            <div class="img-placeholder" role="img" aria-label="Product hero image"></div>
          </div>
        </td>
      </tr>

      <tr>
        <td class="content">
          <h1>Welcome to Acme, Alex!</h1>
          <p>
            We're thrilled to have you on board. Your account is ready and you can start
            exploring everything Acme has to offer right away.
          </p>
          <p>
            Here's a quick summary of what you can do next to get the most out of your
            new account and hit the ground running.
          </p>

          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td style="padding-right: 8px; width: 50%;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="feature-cell">
                      <div class="feature-icon">&#9881;&#65039;</div>
                      <p class="feature-title">Set Up Your Profile</p>
                      <p class="feature-text">Add your details and personalise your workspace.</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding-left: 8px; width: 50%;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="feature-cell">
                      <div class="feature-icon">&#128101;</div>
                      <p class="feature-title">Invite Your Team</p>
                      <p class="feature-text">Collaboration is better together. Add teammates now.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
            <tr>
              <td align="center">
                <a href="#" class="cta-button">Get Started</a>
              </td>
            </tr>
          </table>

          <hr class="divider">

          <p style="font-size: 14px; color: #666666;">
            Questions? Reply to this email or visit our
            <a href="#" style="color: #4f46e5;">Help Centre</a>. We are always happy to help.
          </p>
        </td>
      </tr>

      <tr>
        <td class="footer">
          <p>&#169; 2026 Acme Inc. &bull; 123 Main Street, San Francisco, CA 94105</p>
          <p>
            <a href="#">Unsubscribe</a> &bull;
            <a href="#">Privacy Policy</a> &bull;
            <a href="#">Terms of Service</a>
          </p>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>`
