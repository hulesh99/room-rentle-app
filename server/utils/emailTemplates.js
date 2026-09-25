const layout = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#15803d;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;">RoomRental</span>
    </div>
    <div style="padding:28px;">
      <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">${title}</h2>
      <div style="color:#374151;font-size:14px;line-height:1.6;">${bodyHtml}</div>
    </div>
    <div style="padding:16px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;text-align:center;">
      You are receiving this email because you have a RoomRental account.
    </div>
  </div>
</body>
</html>
`;

const p = (text) => `<p style="margin:0 0 12px;">${text}</p>`;
const highlight = (text) => `<strong style="color:#111827;">${text}</strong>`;

export const newBookingRequestEmail = ({ ownerName, renterName, roomTitle, message }) =>
  layout(
    'New booking request received',
    [
      p(`Hi ${highlight(ownerName)},`),
      p(`${highlight(renterName)} has sent a booking request for your listing ${highlight(roomTitle)}.`),
      message ? p(`<em>"${message}"</em>`) : '',
      p('Open your dashboard to accept or reject this request. Once accepted, you can chat with the renter in real time.'),
      p('<a href="http://localhost:5173/owner/requests" style="display:inline-block;background:#15803d;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">Review request</a>'),
    ]
      .filter(Boolean)
      .join('')
  );

export const requestAcceptedEmail = ({ renterName, roomTitle, ownerName }) =>
  layout(
    'Your booking request was accepted!',
    [
      p(`Great news, ${highlight(renterName)}!`),
      p(`${highlight(ownerName)} accepted your booking request for ${highlight(roomTitle)}.`),
      p('The owner\u2019s contact number is now visible on the room page, and your chat is unlocked.'),
      p('<a href="http://localhost:5173/chat" style="display:inline-block;background:#15803d;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">Open chat</a>'),
    ].join('')
  );

export const requestRejectedEmail = ({ renterName, roomTitle, ownerName }) =>
  layout(
    'Booking request update',
    [
      p(`Hi ${highlight(renterName)},`),
      p(`Unfortunately, ${highlight(ownerName)} could not accept your request for ${highlight(roomTitle)} at this time.`),
      p('Don\u2019t worry — there are plenty more rooms waiting for you.'),
      p('<a href="http://localhost:5173/rooms" style="display:inline-block;background:#15803d;color:#ffffff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">Browse rooms</a>'),
    ].join('')
  );
