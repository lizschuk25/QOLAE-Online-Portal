// Backend version of your IntroductoryEmail template
const generateIntroEmail = (lawyer, customBody) => {
    const getFirstName = (fullName) => {
      if (!fullName) return '';
      return fullName.split(' ')[0];
    };
  
    // Use fixed absolute URL for the logo
    const logoUrl = '/central-repository/images/qolaeNewLogo.svg';
    // If customBody is provided, use it as the main body (HTML), otherwise use the default content
    const mainBody = customBody && customBody.trim() ? customBody : `
        <p>Thank you for reaching out and connecting with Liz Chukwu RN, Clinical Director at QOLAE.</p>
        <p>I understand how busy your schedule can be, which is why we've designed our portal and workflow to be as seamless and efficient as possible.</p>
        <br />
        <p>Attached to this email, you will find:</p>
        <br>
        <p>1. Terms of Business: Personalised with your unique PIN ${
          (lawyer.pinAddedToTOB === true && lawyer.readyToSend === true) ?
          `<a href="/LawyersLogin?pin=${lawyer.pin}"
             style="color: #007bff;
                    text-decoration: underline;
                    font-weight: bold;
                    cursor: pointer;"
             target="_blank"
             rel="noopener noreferrer">${lawyer.pin}</a>` :
          lawyer.pin
        }, detailing our services, workflow and policies</p>
        <br>
        <p>2. CV and Case Studies: Highlighting our expertise.</p>
        <br />
        <p style="font-family: Arial; font-size: 14px; font-weight: bold;">Here's What to Do Next:</p>
        <br>
        <p>1. Log into the QOLAE portal using your unique PIN ${
          (lawyer.pinAddedToTOB === true && lawyer.readyToSend === true) ?
          `<a href="/LawyersLogin?pin=${lawyer.pin}"
             style="color: #007bff;
                    text-decoration: underline;
                    font-weight: bold;
                    cursor: pointer;"
             target="_blank"
             rel="noopener noreferrer">${lawyer.pin}</a>` :
          lawyer.pin
        } found in the Terms of Business document</p>
        <br />
        <p>2. Engage with our multi-factor authentication to ensure secure access.</p>
        <br />
        <p>3. Set your notification preferences by opting in or out of step by step email updates.</p>
        <br>
        <p>4. Review and sign the Terms of Business directly in the portal.</p>
        <br>
        <p>5. Make the upfront payment to activate further portal access.</p>
        <br>
        <p>6. Complete client details for the consent form, tick the box and send it directly to your<br>
           client for approval.</p>
        <br>
        <p>7. Upload instructions, medical notes and any supporting documents securely.</p>
        <br />
        <br />
        <p style="font-family: Arial; font-size: 14px; font-weight: bold;">Your Notification Preferences</p>
        <br>
        <p>As part of our commitment to making your experience seamless, we offer:</p>
        <br>
        <p>• Email notifications for step by step completions and key updates.</p>
        <br>
        <p>• A professional workflow space that visually highlights each step as you proceed.</p>
        <br>
        <p>You can choose to opt-in or opt-out of email notifications when you first access the portal or at any other time during your visit to QOLAE's online portal.</p>
        <p>The entire process is designed to take 20 minutes or less, allowing you to focus on your priorities whilst we handle the rest.</p>
        <br />
        <p>If you have any questions or need assistance during this process, please contact me directly.</p>
        <br />
        <p>We are thrilled to have had a conversation with you and look forward to a successful and professional working collaboration.</p>
        <br />
        <p>Kindest regards and Best wishes,</p>
        <br />
        <p>Liz</p>
        <br />
        <br />
        <br />`;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            line-height: 1.6;
          }
          ul, ol {
            margin: 15px 0;
            padding-left: 20px;
          }
          .signature {
            margin-top: 30px;
            color: #444;
          }
          a {
            color: #007bff;
            text-decoration: underline;
            font-weight: bold;
          }
          a:hover {
            color: #0056b3;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-width: 200px;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="logo">
          <img src="${logoUrl}" alt="QOLAE Logo" style="max-width: 500px; display: block; margin: 0 auto;">
        </div>
        <p>Dear ${getFirstName(lawyer.contactName)},</p>
        <br />
        ${mainBody}
        <div class="signature">
          <p>
            Liz Chukwu.RN<br>
            Clinical Director & Case Manager<br>
            |Case Management & Rehabilitation|Clinical Negligence|Mediation|<br>
            E: <a href="mailto:Liz.Chukwu@qolae.com">Liz.Chukwu@qolae.com</a><br>
            T: 07960 247 764<br>
            QOLAE™
          </p>
        </div>
      </body>
      </html>
    `;
  };
  
  const getEmailSubject = () => {
    return "Thank You For Connecting With QOLAE. Let's Get Started.";
  };
  
  export { generateIntroEmail, getEmailSubject }; 