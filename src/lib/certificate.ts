import jsPDF from "jspdf";
import QRCode from "qrcode";
import { savePdfNative } from "./pdf-export";

/**
 * Generates a PDF containing the 12-word mnemonic and its QR code representation,
 * and prompts the user to save it natively.
 * 
 * @param mnemonic The 12-word BIP-39 mnemonic phrase.
 * @returns boolean indicating if the save was successful or completed without throw.
 */
export async function exportSecurityCertificate(mnemonic: string): Promise<boolean> {
    if (!mnemonic || mnemonic.split(" ").length !== 12) {
        throw new Error("Invalid mnemonic provided for certificate export.");
    }

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // Title and Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Sicherheits-Zertifikat", 105, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Pensionsmanager Zero-Knowledge Master-Key", 105, 40, { align: "center" });

    // Warning text
    doc.setFontSize(10);
    doc.setTextColor(200, 0, 0); // Red warning text
    doc.text("WICHTIG: Bewahren Sie dieses Dokument extrem sicher auf!", 105, 55, { align: "center" });
    doc.text("Wer diese 12 W\u00f6rter besitzt, hat vollen Zugriff auf alle verschl\u00fcsselten G\u00e4stedaten.", 105, 62, { align: "center" });
    doc.text("Bei Verlust dieses Schl\u00fcssels k\u00f6nnen Ihre Daten nicht wiederhergestellt werden.", 105, 69, { align: "center" });

    // Mnemonic text section
    doc.setTextColor(0, 0, 0); // Reset color to black
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ihre 12-Wort-Phrase:", 105, 90, { align: "center" });

    // Grid layout for the 12 words
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const words = mnemonic.split(" ");

    let startY = 105;
    for (let i = 0; i < 12; i++) {
        const col = i % 2 === 0 ? 60 : 130;
        const row = Math.floor(i / 2);
        doc.text(`${i + 1}. ${words[i]}`, col, startY + (row * 10));
    }

    // QR Code generation and embedding
    try {
        const qrDataUrl = await QRCode.toDataURL(mnemonic, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 80
        });

        // Add QR code to the PDF
        // params: imageData, format, x, y, width, height
        doc.addImage(qrDataUrl, "PNG", 65, 180, 80, 80);

        doc.setFontSize(10);
        doc.text("QR-Code f\u00fcr den schnellen Import am Zweitger\u00e4t scannen", 105, 270, { align: "center" });

    } catch (err) {
        console.error("Failed to generate QR Code for PDF", err);
        throw new Error("Failed to generate QR code");
    }

    // Save using the native dialog (which will fallback to web download if needed)
    return await savePdfNative(doc, "Sicherheits-Zertifikat.pdf");
}
