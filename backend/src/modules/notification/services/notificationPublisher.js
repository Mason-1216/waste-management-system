import { Notification } from '../../../models/index.js';

function normalizePayload(payload) {
  const notify_type = payload.notify_type ?? payload.notifyType;
  const receiver_id = payload.receiver_id ?? payload.receiverId;

  if (!notify_type) throw new Error('notify_type is required');
  if (!receiver_id) throw new Error('receiver_id is required');

  return {
    notify_type,
    title: payload.title || '',
    content: payload.content || '',
    receiver_id,
    receiver_name: payload.receiver_name ?? payload.receiverName ?? null,
    related_id: payload.related_id ?? payload.relatedId ?? null,
    related_type: payload.related_type ?? payload.relatedType ?? null
  };
}

function emitNotification(io, receiverId, notification) {
  io.to(`user_${receiverId}`).emit('notification', {
    id: notification.id,
    title: notification.title,
    content: notification.content,
    type: notification.notify_type,
    createdAt: notification.created_at
  });
}

export async function publishNotification(payload, options = {}) {
  const { io, emit = false } = options;
  const normalized = normalizePayload(payload);
  const notification = await Notification.create(normalized);

  if (io && emit) {
    emitNotification(io, normalized.receiver_id, notification);
  }

  return notification;
}

export async function publishNotifications(list, options = {}) {
  const { io, emit = false } = options;
  const normalizedList = (Array.isArray(list) ? list : []).map(normalizePayload);

  if (!io || !emit) {
    // For MySQL, bulkCreate may not reliably return inserted instances with IDs.
    await Notification.bulkCreate(normalizedList);
    return { count: normalizedList.length };
  }

  // When emitting is required, create one-by-one to ensure we have IDs for payload.
  let count = 0;
  for (const item of normalizedList) {
    const created = await Notification.create(item);
    emitNotification(io, item.receiver_id, created);
    count += 1;
  }
  return { count };
}

export default { publishNotification, publishNotifications };
