import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "@the-blue-cup/types";

export const generateInvoice = (order: Order) => {
  const doc = new jsPDF();
  const orderId = order._id?.slice(-4).toUpperCase() || "NEW";
  
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
  doc.text(`Table No: ${order.tableNumber}`, 14, 52);
  doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}`, 14, 59);

  // Table Data
  const tableData = order.items.map((item, index) => {
    const itemName = typeof item.menuItem === "object" && item.menuItem !== null 
      ? (item.menuItem as any).name 
      : "Item";
    const itemPrice = typeof item.menuItem === "object" && item.menuItem !== null 
      ? (item.menuItem as any).price 
      : 0;
    
    return [
      index + 1,
      itemName + (item.customization ? `\nNote: ${item.customization}` : ""),
      item.quantity,
      `INR ${itemPrice.toFixed(2)}`,
      `INR ${(itemPrice * item.quantity).toFixed(2)}`
    ];
  });

  const subtotal = order.subtotal || order.totalAmount;
  const tax = 0;

  autoTable(doc, {
    startY: 65,
    head: [["#", "Item", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [26, 43, 76] }, // primary-navy
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 65;

  doc.setFontSize(10);
  doc.text(`Subtotal: INR ${subtotal.toFixed(2)}`, 140, finalY + 10);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: INR ${order.totalAmount.toFixed(2)}`, 140, finalY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Thank you for visiting The Blue Cup Cafe!", 105, finalY + 40, { align: "center" });

  try {
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  } catch (error) {
    console.error("Failed to open receipt preview:", error);
  }
  doc.save(`Invoice_ORD_${orderId}.pdf`);
};

export const generateDailyReport = (orders: Order[], reportDate = new Date()) => {
  const doc = new jsPDF();
  const completedOrders = orders.filter((order) => order.status === "Completed");
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const statusCounts = orders.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
    return counts;
  }, {});
  const itemMap = new Map<string, { quantity: number; revenue: number }>();

  completedOrders.forEach((order) => {
    order.items.forEach((item) => {
      const menuItem = item.menuItem as any;
      const itemName = typeof menuItem === "object" && menuItem !== null ? menuItem.name : "Item";
      const unitPrice = item.priceAtOrder || (typeof menuItem === "object" && menuItem !== null ? menuItem.price : 0);
      const current = itemMap.get(itemName) || { quantity: 0, revenue: 0 };
      itemMap.set(itemName, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + unitPrice * item.quantity,
      });
    });
  });

  const formattedDate = reportDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc.setFontSize(22);
  doc.setTextColor(26, 43, 76);
  doc.text("The Blue Cup Cafe", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("Daily Sales Report", 105, 30, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Date: ${formattedDate}`, 14, 44);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 51);

  autoTable(doc, {
    startY: 62,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `INR ${totalRevenue.toFixed(2)}`],
      ["Completed Orders", completedOrders.length],
      ["Total Orders", orders.length],
      ["Average Ticket", `INR ${avgTicket.toFixed(2)}`],
      ["Pending", statusCounts.Pending || 0],
      ["Preparing", statusCounts.Preparing || 0],
      ["Ready", statusCounts.Ready || 0],
      ["Cancelled", statusCounts.Cancelled || 0],
    ],
    theme: "striped",
    headStyles: { fillColor: [26, 43, 76] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const summaryY = (doc as any).lastAutoTable.finalY || 62;
  const itemRows = Array.from(itemMap.entries())
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .map(([name, item]) => [name, item.quantity, `INR ${item.revenue.toFixed(2)}`]);

  autoTable(doc, {
    startY: summaryY + 12,
    head: [["Item", "Qty Sold", "Revenue"]],
    body: itemRows.length > 0 ? itemRows : [["No completed item sales", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const itemsY = (doc as any).lastAutoTable.finalY || summaryY + 12;
  const transactionRows = orders.map((order) => [
    `ORD-${order._id?.slice(-6).toUpperCase() || "NEW"}`,
    order.tableNumber ? `Table ${order.tableNumber}` : "Guest",
    order.createdAt ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-",
    order.status,
    `INR ${(order.totalAmount || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: itemsY + 12,
    head: [["Order", "Table / Guest", "Time", "Status", "Total"]],
    body: transactionRows.length > 0 ? transactionRows : [["No orders", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [26, 43, 76] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  try {
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  } catch (error) {
    console.error("Failed to open daily report preview:", error);
  }
  doc.save(`Daily_Report_${reportDate.toISOString().slice(0, 10)}.pdf`);
};
