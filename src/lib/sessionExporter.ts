import { Message } from '../core/types';

export interface SessionMetadata {
  facilityName?: string;
  department?: string;
  officerName?: string;
  citizenName?: string;
  startTime: number;
  endTime: number;
}

/**
 * Generates an official, printable and archivable HTML Session Transcript Report
 * for healthcare, legal, or banking interactions.
 */
export function generateOfficialTranscriptHTML(
  messages: Message[],
  meta?: Partial<SessionMetadata>
): string {
  const facility = meta?.facilityName || 'Public Service Counter';
  const officer = meta?.officerName || 'Duty Officer';
  const citizen = meta?.citizenName || 'Deaf Citizen / Participant';
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const verifiedCount = messages.filter((m) => m.trustLevel === 'VERIFIED').length;
  const demoCount = messages.filter((m) => m.trustLevel === 'DEMO' || m.source === 'SIGN-DEMO').length;

  const rows = messages
    .map((msg, idx) => {
      const timeStr = new Date(msg.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const isSignOrCitizen = msg.source === 'SIGN-DEMO' || msg.source === 'TYPED';
      const speaker = isSignOrCitizen ? citizen : officer;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 12px; color: #64748b; vertical-align: top;">#${idx + 1}<br/>${timeStr}</td>
          <td style="padding: 10px; font-weight: bold; font-size: 13px; color: #1e293b; vertical-align: top;">
            ${speaker}
            <div style="font-size: 10px; font-weight: normal; color: #0284c7;">[Source: ${msg.source}]</div>
          </td>
          <td style="padding: 10px; font-size: 13px; color: #0f172a; line-height: 1.5; vertical-align: top;">
            ${msg.text}
            ${msg.glossMatch ? `<div style="font-size: 11px; color: #0d9488; margin-top: 4px;">ISL Gloss: <strong>${msg.glossMatch}</strong></div>` : ''}
          </td>
          <td style="padding: 10px; font-size: 11px; vertical-align: top;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 10px; background-color: ${
              msg.trustLevel === 'VERIFIED' ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'
            }">
              ${msg.trustLevel}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Accessible Session Audit Transcript - ${formattedDate}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 40px;
      color: #0f172a;
      background: #ffffff;
    }
    .header-box {
      border-bottom: 2px solid #0d9488;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th {
      background: #f8fafc;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 60px;
      padding-top: 20px;
    }
    .signature-line {
      border-top: 1px dashed #64748b;
      padding-top: 8px;
      font-size: 12px;
      color: #475569;
    }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #0d9488; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
      🖨️ Print or Save as PDF
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer;">
      Close Window
    </button>
  </div>

  <div class="header-box">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="margin: 0; font-size: 22px; color: #0d9488;">Project SignStream</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Official Accessible Communication Session Record</p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #475569;">
        <div><strong>Date:</strong> ${formattedDate}</div>
        <div><strong>Time:</strong> ${formattedTime}</div>
        <div><strong>Facility:</strong> ${facility}</div>
      </div>
    </div>

    <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
      <span class="badge">Total Messages: ${messages.length}</span>
      <span class="badge">Verified Exchanges: ${verifiedCount}</span>
      <span class="badge">Demonstration/Unverified: ${demoCount}</span>
      <span class="badge">Confidentiality: On-Device Local Audit</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Timestamp</th>
        <th style="width: 25%;">Speaker</th>
        <th style="width: 45%;">Statement / Translation</th>
        <th style="width: 15%;">Trust Rating</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div style="margin-top: 40px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 11px; color: #64748b; line-height: 1.6;">
    <strong>Verification Attestation:</strong> This log captures a real-time two-way interaction mediated via Indian Sign Language (ISL), automated speech recognition, and synthetic voice. Data processed strictly on-device in compliance with the Digital Personal Data Protection Act (India, 2023).
  </div>

  <div class="signature-grid">
    <div>
      <div class="signature-line">
        <strong>${citizen}</strong><br/>
        Participant / Deaf Citizen Signature
      </div>
    </div>
    <div>
      <div class="signature-line">
        <strong>${officer}</strong><br/>
        Authorized Service Representative / Officer Signature
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Opens print preview window for the current conversation session.
 */
export function openSessionTranscriptPrintWindow(messages: Message[]): void {
  const html = generateOfficialTranscriptHTML(messages);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
