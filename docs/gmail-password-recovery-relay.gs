const SENDER_NAME = 'Neurify – Neurosurgery Department';

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function equalTokens(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function validRecipient(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function doPost(event) {
  try {
    const payload = JSON.parse(
      event.postData && event.postData.contents ? event.postData.contents : '{}',
    );
    const token = String(payload.relay_token || '');
    const properties = PropertiesService.getScriptProperties();
    const configuredToken = properties.getProperty('RELAY_TOKEN');

    if (!configuredToken) {
      if (payload.action !== 'bootstrap' || token.length < 32) {
        return json({ ok: false, error: 'Relay is not configured.' });
      }
      properties.setProperty('RELAY_TOKEN', token);
      return json({ ok: true, configured: true });
    }

    if (!equalTokens(configuredToken, token)) {
      return json({ ok: false, error: 'Unauthorized relay request.' });
    }
    if (payload.action === 'bootstrap') return json({ ok: true, configured: true });
    if (
      payload.action !== 'password_recovery' ||
      !validRecipient(payload.to) ||
      !/^\d{6}$/.test(String(payload.code || ''))
    ) {
      return json({ ok: false, error: 'Invalid recovery request.' });
    }

    MailApp.sendEmail({
      to: String(payload.to).trim(),
      subject: String(payload.subject || 'Neurify password recovery code'),
      body: String(payload.text || ''),
      htmlBody: String(payload.html || ''),
      name: SENDER_NAME,
    });
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: 'Delivery failed.' });
  }
}
