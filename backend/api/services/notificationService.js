const webpush = require('web-push');
const { getOne, run, getAll } = require('../utils/queryHelpers');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const saveSubscription = async (userId, subscription) => {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Inscrição push inválida.');
  }

  await run(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
    [userId, endpoint, keys.p256dh, keys.auth]
  );

  return { message: 'Inscrito com sucesso.' };
};

const removeSubscription = async (userId, endpoint) => {
  await run('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
  return { message: 'Inscrição removida.' };
};

const getUserSubscriptions = async (userId) => {
  return getAll('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [userId]);
};

const sendNotification = async (subscription, payload) => {
  if (!vapidPublicKey || !vapidPrivateKey) return;
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await removeSubscription(subscription.user_id || 0, subscription.endpoint);
    }
  }
};

const sendToUser = async (userId, title, body, options = {}) => {
  if (!vapidPublicKey || !vapidPrivateKey) return { sent: 0, error: 'VAPID not configured' };
  const subs = await getUserSubscriptions(userId);
  if (subs.length === 0) return { sent: 0 };
  let sent = 0;
  for (const sub of subs) {
    await sendNotification({ ...sub, user_id: userId }, { title, body, ...options });
    sent++;
  }
  return { sent };
};

module.exports = { saveSubscription, removeSubscription, getUserSubscriptions, sendNotification, sendToUser };
