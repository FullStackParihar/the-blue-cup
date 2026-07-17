import type { Order } from "@the-blue-cup/types";

/**
 * Generates a WhatsApp deep link with a formatted bill message.
 */
export const generateWhatsAppBillLink = (order: Order): string => {
  if (!order.customerPhone) return "";

  const phone = order.customerPhone.replace(/\D/g, "");
  // Ensure country code (default to India +91 if not present)
  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

  const orderId = order._id?.slice(-6).toUpperCase();
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "";
  
  let itemsList = "";
  order.items.forEach((item: any) => {
    const itemName = item.menuItem?.name || "Item";
    itemsList += `• ${itemName} x ${item.quantity} - ₹${(item.priceAtOrder * item.quantity).toFixed(0)}\n`;
  });

  const message = `*The Blue Cup - Digital Bill* ☕\n\n` +
    `Order ID: #ORD-${orderId}\n` +
    `Date: ${date}\n` +
    `Table: ${order.tableNumber || "Takeaway"}\n\n` +
    `*Items:*\n${itemsList}\n` +
    `*Subtotal:* ₹${order.subtotal.toFixed(0)}\n` +
    `--------------------------\n` +
    `*TOTAL: ₹${order.totalAmount.toFixed(0)}*\n` +
    `--------------------------\n\n` +
    `Thank you for visiting *The Blue Cup*! Hope to see you again soon. ✨`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};
