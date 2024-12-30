import { jsPDF } from 'jspdf';
import path from 'path';
import fs from 'fs';

interface ReceiptData {
  orderId: string;
  paymentId: string;
  date: string;
  amount: number;
  credits: number;
  customerName: string;
  customerEmail: string;
}

export async function generateReceipt(data: ReceiptData): Promise<Buffer> {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set initial positions
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    let y = margin;

    // Helper function to add horizontal line
    const addLine = (yPos: number) => {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    // Add logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'InvoiceLogo.png');
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
      doc.addImage(logoBase64, 'PNG', margin, y, 30, 30);
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    // Add company header (right aligned)
    doc.setFontSize(24);
    doc.setTextColor(124, 58, 237); // Purple color (#7C3AED)
    doc.setFont("helvetica", 'bold');
    doc.text('ShapeShift AI', pageWidth - margin, y + 15, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", 'normal');
    doc.text('Tax Invoice', pageWidth - margin, y + 25, { align: 'right' });
    y += 50; // Extra space for logo

    // Add line after header
    addLine(y);
    y += 15;

    // Create table-like structure for invoice details
    const col1 = margin;
    const col2 = 60;
    const col3 = pageWidth / 2;
    const col4 = pageWidth - margin;
    
    // Invoice details row
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", 'bold');
    doc.text('Invoice Date:', col1, y);
    doc.setFont("helvetica", 'normal');
    doc.text(data.date, col2, y);
    
    doc.setFont("helvetica", 'bold');
    doc.text('Payment ID:', col3, y);
    doc.setFont("helvetica", 'normal');
    doc.text(data.paymentId, col3 + 25, y);
    y += 15;

    // Customer details section
    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", 'bold');
    doc.text('Bill To:', col1, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", 'normal');
    doc.text(data.customerName, col1, y);
    doc.text(data.customerEmail, col1, y + 5);
    y += 25;

    // Add table header
    addLine(y);
    y += 8;
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('Description', col1, y);
    doc.text('Credits', col3, y);
    doc.text('Amount (₹)', col4, y, { align: 'right' });
    y += 3;
    addLine(y);
    y += 12;

    // Add table content
    doc.setFont("helvetica", 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Credits Purchase', col1, y);
    doc.text(data.credits.toString(), col3, y);
    doc.text((data.amount / 100).toFixed(2), col4, y, { align: 'right' });
    y += 3;
    addLine(y);
    y += 15;

    // Add total section
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('Total Amount:', col3, y);
    doc.text(`₹${(data.amount / 100).toFixed(2)}`, col4, y, { align: 'right' });
    y += 30;

    // Add footer with border
    const footerY = doc.internal.pageSize.height - 30;
    addLine(footerY);
    doc.setFontSize(8);
    doc.setFont("helvetica", 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('This is a computer generated invoice and does not require a signature.', pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text('For any queries, please contact support@shapeshiftai.com', pageWidth / 2, footerY + 15, { align: 'center' });

    // Convert the PDF to a buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw new Error('Failed to generate receipt');
  }
} 