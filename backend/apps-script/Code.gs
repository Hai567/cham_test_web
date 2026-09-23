/**
 * Chạm: nơi nhận đơn tối giản bằng Google Apps Script.
 * - Ghi mỗi đơn thành một dòng trong Google Sheet.
 * - Lưu ảnh, video của đơn vào một thư mục riêng trong Google Drive.
 * - Gửi email báo đơn mới cho team.
 * Cách cài đặt: xem backend/apps-script/README.md.
 */

// ====== CẤU HÌNH (điền trước khi triển khai) ======
const CONFIG = {
  SHEET_ID: 'DIEN_ID_GOOGLE_SHEET',        // phần giữa /d/ và /edit trong link Sheet
  ROOT_FOLDER_ID: 'DIEN_ID_THU_MUC_DRIVE',  // phần cuối link thư mục Drive
  NOTIFY_EMAILS: 'email1@gmail.com,email2@gmail.com',
  SHARED_KEY: '',                           // tùy chọn: trùng với VITE_ORDER_KEY phía web
  MAX_FILE_BYTES: 30 * 1024 * 1024,
};

const HEADERS = ['Thời gian', 'Mã đơn', 'Trạng thái', 'Tên khách', 'Liên hệ', 'Dịch vụ', 'Trải nghiệm', 'Cảm xúc', 'Âm thanh',
  'Tặng ai', 'Dịp', 'Người tặng', 'Người nhận', 'Lời nhắn', 'Ghi chú', 'Ảnh in', 'Danh sách file', 'Xác nhận quyền', 'Thư mục Drive', 'File chưa nhận', 'Mã kiểm tra'];
const ORDER_ID = /^CHAM-[A-Z0-9]{4}-[A-Z0-9]{4,8}$/;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (CONFIG.SHARED_KEY && body.key !== CONFIG.SHARED_KEY) return reply({ ok: false, error: 'Không được phép.' });
    if (body.action === 'order') return reply(saveOrder(body.order));
    if (body.action === 'file') return reply(saveFile(body));
    if (body.action === 'finish') return reply(finish(body));
    return reply({ ok: false, error: 'Yêu cầu không hợp lệ.' });
  } catch (err) {
    return reply({ ok: false, error: 'Lỗi máy chủ: ' + err });
  }
}

function doGet() {
  return reply({ ok: true, service: 'cham-orders' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet() {
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function findRow(sh, orderId) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return -1;
  const ids = sh.getRange(2, 2, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === orderId) return i + 2;
  return -1;
}

function orderFolder(orderId) {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const it = root.getFoldersByName(orderId);
  return it.hasNext() ? it.next() : root.createFolder(orderId);
}

/** Chỉ cho ghi vào thư mục con trực tiếp của thư mục Chạm, và đúng tên mã đơn. */
function checkedFolder(folderId, orderId) {
  const folder = DriveApp.getFolderById(folderId);
  const parents = folder.getParents();
  const ok = parents.hasNext() && parents.next().getId() === CONFIG.ROOT_FOLDER_ID && folder.getName() === orderId;
  if (!ok) throw new Error('Thư mục không hợp lệ.');
  return folder;
}

function saveOrder(o) {
  if (!o || !ORDER_ID.test(o.id)) return { ok: false, error: 'Mã đơn không hợp lệ.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet();
    const fingerprint = 'fp:' + o.createdAt + '|' + o.contactReach;
    const row = findRow(sh, o.id);
    if (row !== -1 && sh.getRange(row, HEADERS.length).getValue() !== fingerprint) {
      // Cùng mã nhưng là đơn khác: không bao giờ ghi file của khách này vào thư mục của khách kia.
      return { ok: false, code: 'DUPLICATE', error: 'Mã đơn bị trùng.' };
    }
    const folder = orderFolder(o.id);
    if (row === -1) {
      sh.appendRow([o.createdAt, o.id, 'Đang nhận file', o.contactName, o.contactReach, o.service, o.mode, o.mood, o.audio,
        o.recipient, o.occasion, o.senderName, o.recipientName, o.message, o.notes, o.printTarget, o.media, o.rightsConfirmed, folder.getUrl(), '', fingerprint]);
    }
    return { ok: true, folderId: folder.getId() };
  } finally {
    lock.releaseLock();
  }
}

function saveFile(b) {
  if (!ORDER_ID.test(b.orderId)) return { ok: false, error: 'Mã đơn không hợp lệ.' };
  if (!/^(image|video)\//.test(b.mimeType || '')) return { ok: false, error: 'Chỉ nhận ảnh và video.' };
  if (!b.data || b.data.length > CONFIG.MAX_FILE_BYTES * 1.37) return { ok: false, error: 'File quá lớn.' };
  const folder = checkedFolder(b.folderId, b.orderId);
  if (folder.getFilesByName(b.name).hasNext()) return { ok: true, skipped: 'đã có' };
  folder.createFile(Utilities.newBlob(Utilities.base64Decode(b.data), b.mimeType, b.name));
  return { ok: true };
}

function finish(b) {
  if (!ORDER_ID.test(b.orderId)) return { ok: false, error: 'Mã đơn không hợp lệ.' };
  const folder = checkedFolder(b.folderId, b.orderId);
  const sh = sheet();
  const row = findRow(sh, b.orderId);
  if (row === -1) return { ok: false, error: 'Chưa có đơn.' };
  const status = sh.getRange(row, 3).getValue();
  const skipped = (b.skipped || []).map(function (f) { return f.name + ' (' + f.reason + ')'; });
  if (status === 'Đã nhận') return { ok: true, note: 'đã báo trước đó' };
  sh.getRange(row, 3).setValue(skipped.length ? 'Thiếu file lớn' : 'Đã nhận');
  sh.getRange(row, 20).setValue(skipped.join('\n'));
  const values = sh.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const lines = HEADERS.map(function (h, i) { return '<tr><td style="color:#7A6A60;padding:2px 12px 2px 0;vertical-align:top">' + h + '</td><td>' + String(values[i]).replace(/\n/g, '<br>') + '</td></tr>'; });
  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAILS,
    subject: '[Chạm] Đơn mới ' + b.orderId + ' từ ' + (b.contactName || 'khách'),
    htmlBody:
      '<p>Có đơn mới. Thư mục file: <a href="' + folder.getUrl() + '">' + b.orderId + '</a></p>' +
      (skipped.length ? '<p style="color:#A23D2A"><b>Cần liên hệ khách để nhận file:</b> ' + skipped.join(', ') + '</p>' : '') +
      '<table style="font-family:sans-serif;font-size:14px">' + lines.join('') + '</table>',
  });
  return { ok: true };
}
