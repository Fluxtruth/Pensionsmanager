import jsPDF from "jspdf";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

/**
 * Unified helper to save a jsPDF document using a native file picker in Tauri.
 */
export async function savePdfNative(doc: jsPDF, filename: string): Promise<boolean> {
    try {
        // Prepare the PDF data as a Uint8Array
        const pdfArrayBuffer = doc.output('arraybuffer');
        const uint8Array = new Uint8Array(pdfArrayBuffer);

        // Open the native save as dialog
        const filePath = await save({
            filters: [{
                name: 'PDF Document',
                extensions: ['pdf']
            }],
            defaultPath: filename
        });

        if (!filePath) {
            // User cancelled the dialog
            return false;
        }

        // Write the file to the chosen path
        await writeFile(filePath, uint8Array);
        return true;
    } catch (error) {
        console.error("Failed to save PDF natively:", error);
        // Fallback for non-tauri or errors (though this is a tauri app)
        doc.save(filename);
        return true;
    }
}
