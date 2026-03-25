import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module window.dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

async function agentTest() {
  console.log('--- Resend Agent Test (ESM) ---');
  console.log('AI Agent (Antigravity) is testing the Resend integration...');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Antigravity <onboarding@resend.dev>',
      to: ['delivered@resend.dev'], // Test address
      subject: 'Agent Integration Test',
      html: `
        <h1>Agent System Report</h1>
        <p>This email was triggered by <strong>Antigravity</strong> using the new Resend agent-friendly features.</p>
        <ul>
          <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          <li><strong>Agent ID:</strong> antigravity-01</li>
          <li><strong>Status:</strong> Ready for automation</li>
        </ul>
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      process.exit(1);
    }

    console.log('Success! Email sent successfully.');
    console.log('Machine-readable output:', JSON.stringify(data));
  } catch (err) {
    console.error('An unexpected error occurred:', err);
    process.exit(1);
  }
}

agentTest();
