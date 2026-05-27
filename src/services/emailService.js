/**
 * EMAIL SERVICE - Cấu hình EmailJS
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Truy cập https://www.emailjs.com và đăng ký tài khoản miễn phí
 * 2. Vào Email Services → Add New Service → chọn Gmail → kết nối với dodinhnam160703@gmail.com
 * 3. Vào Email Templates → Create New Template:
 *    
 *    Subject: {{subject}}
 *    Body:
 *    {{message}}
 *    
 *    ---
 *    Thông tin đơn hàng:
 *    Tên: {{customer_name}}
 *    Email: {{customer_email}}
 *    SĐT: {{customer_phone}}
 *    Địa chỉ: {{customer_address}}
 *    Phương thức: {{payment_method}}
 *    Tổng tiền: {{total}}
 *    Chi tiết sản phẩm: {{order_items}}
 *    
 * 4. Lấy Service ID, Template ID, Public Key và điền vào bên dưới
 * 5. Trong template settings, set "To Email" = dodinhnam160703@gmail.com
 */

import emailjs from '@emailjs/browser';
import { formatVND, toVndInt } from '../utils/money';

// ============ THAY ĐỔI CÁC GIÁ TRỊ NÀY ============
const EMAILJS_SERVICE_ID = 'service_bkn9y1d';     // Ví dụ: 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_80e5glw';   // Ví dụ: 'template_xyz789'
const EMAILJS_PUBLIC_KEY = 'RRiJytCVMFdDeeqPS';      // Ví dụ: 'user_AbCdEf123456'
const SHOP_EMAIL = 'dodinhnam160703@gmail.com';
// ====================================================

/**
 * Gửi thông báo đơn hàng khi khách thanh toán chuyển khoản
 */
export async function sendBankTransferNotification(orderData) {
  const { name, email, phone, address, city, zip, cart, total } = orderData;

  const orderItems = cart.map(item => 
    `• ${item.name} x${item.quantity} — ${formatVND(toVndInt(item.price) * item.quantity)}`
  ).join('\n');

  const templateParams = {
    to_email: SHOP_EMAIL,
    subject: `🛒 Đơn hàng mới - Chuyển khoản - ${name}`,
    customer_name: name,
    customer_email: email,
    customer_phone: phone,
    customer_address: `${address}, ${city}, ${zip}`,
    payment_method: 'Chuyển khoản ngân hàng',
    total: formatVND(total),
    order_items: orderItems,
    message: `Có đơn hàng mới từ ${name}!\n\n` +
      `📦 Chi tiết đơn hàng:\n${orderItems}\n\n` +
      `💰 Tổng tiền: ${formatVND(total)}\n\n` +
      `👤 Thông tin khách hàng:\n` +
      `   Tên: ${name}\n` +
      `   Email: ${email}\n` +
      `   SĐT: ${phone}\n` +
      `   Địa chỉ giao hàng: ${address}, ${city}, ${zip}\n\n` +
      `💳 Phương thức: Chuyển khoản ngân hàng\n` +
      `⏳ Vui lòng kiểm tra tài khoản và xác nhận đơn hàng.`
  };

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('✅ Email sent successfully:', result.text);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return { success: false, error };
  }
}

/**
 * Gửi thông báo khi khách chọn mua tại cửa hàng
 */
export async function sendStorePickupNotification(orderData) {
  const { cart, total } = orderData;

  const orderItems = cart.map(item => 
    `• ${item.name} x${item.quantity} — ${formatVND(toVndInt(item.price) * item.quantity)}`
  ).join('\n');

  const templateParams = {
    to_email: SHOP_EMAIL,
    subject: `🏪 Khách hàng chọn mua tại cửa hàng`,
    customer_name: 'Khách mua tại cửa hàng',
    customer_email: '',
    customer_phone: '',
    customer_address: 'Mua tại cửa hàng',
    payment_method: 'Thanh toán tại cửa hàng',
    total: formatVND(total),
    order_items: orderItems,
    message: `Có khách hàng vừa chọn mua tại cửa hàng!\n\n` +
      `📦 Sản phẩm khách quan tâm:\n${orderItems}\n\n` +
      `💰 Tổng giá trị: ${formatVND(total)}\n\n` +
      `🏪 Phương thức: Thanh toán tiền mặt tại cửa hàng\n` +
      `📋 Vui lòng chuẩn bị sản phẩm.`
  };

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('✅ Email sent successfully:', result.text);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return { success: false, error };
  }
}
