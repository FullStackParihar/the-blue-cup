import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "@the-blue-cup/types";

export const generateBillPdf = (order: Order): Buffer => {
  const doc = new jsPDF();
  const orderId = order._id?.toString().slice(-6).toUpperCase() || "NEW";
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(26, 43, 76); // primary-navy
  doc.text("The Blue Cup Cafe", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Good Food • Good Mood • Great Time", 105, 28, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Invoice for Order: #ORD-${orderId}`, 14, 45);
  doc.text(`Table No: ${order.tableNumber || "Takeaway"}`, 14, 52);
  doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}`, 14, 59);

  // Table Data
  const tableData = order.items.map((item: any, index: number) => {
    const itemName = item.menuItem?.name || "Item";
    const itemPrice = item.priceAtOrder || 0;
    
    return [
      index + 1,
      itemName + (item.customization ? `\nNote: ${item.customization}` : ""),
      item.quantity,
      `INR ${itemPrice.toFixed(0)}`,
      `INR ${(itemPrice * item.quantity).toFixed(0)}`
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [["#", "Item", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [26, 43, 76] }, // primary-navy
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 65;

  doc.setFontSize(10);
  doc.text(`Subtotal: INR ${order.subtotal.toFixed(0)}`, 140, finalY + 10);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: INR ${order.totalAmount.toFixed(0)}`, 140, finalY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Thank you for visiting The Blue Cup Cafe!", 105, finalY + 40, { align: "center" });

  const pdfOutput = doc.output();
  return Buffer.from(pdfOutput, "binary");
};
