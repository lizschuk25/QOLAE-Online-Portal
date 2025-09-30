import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb } from 'pdf-lib';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * First, inspect the PDF to see what fields actually exist
 */
async function inspectPDFFields(pdfDoc) {
    try {
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        console.log('\n=== PDF FIELD INSPECTION ===');
        console.log(`Total fields found: ${fields.length}`);
        
        if (fields.length === 0) {
            console.log('No form fields found in PDF');
            return [];
        }
        
        const fieldInfo = [];
        fields.forEach(field => {
            const name = field.getName();
            const info = {
                name: name,
                type: field.constructor.name,
                isReadOnly: field.isReadOnly ? field.isReadOnly() : 'unknown'
            };
            fieldInfo.push(info);
            console.log(`Field: "${name}" | Type: ${info.type} | ReadOnly: ${info.isReadOnly}`);
        });
        
        return fieldInfo;
        
    } catch (error) {
        console.error('Error inspecting fields:', error.message);
        return [];
    }
}

/**
 * Handle button field signature insertion
 */
async function insertSignatureIntoButtonField(pdfDoc, signatureBytes, fieldName) {
    try {
        const form = pdfDoc.getForm();
        const buttonField = form.getButton(fieldName);
        
        if (!buttonField) {
            throw new Error(`Button field "${fieldName}" not found`);
        }
        
        // Embed the signature image
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        // Set the button's appearance to show the signature
        // This is the correct way to add images to button fields
        buttonField.setImage(signatureImage);

        console.log(`Button field "${fieldName}" updated with signature (scaled for maximum visibility)`);
        return true;
        
    } catch (error) {
        console.error(`Failed to insert signature into button field "${fieldName}":`, error.message);
        return false;
    }
}

/**
 * Handle text field signature insertion (fallback method)
 */
async function insertSignatureIntoTextField(pdfDoc, signatureBytes, fieldName) {
    try {
        const form = pdfDoc.getForm();
        const textField = form.getTextField(fieldName);
        
        if (!textField) {
            throw new Error(`Text field "${fieldName}" not found`);
        }
        
        // For text fields, we need to use appearance streams
        // This is more complex and field-dependent
        console.log(`Text field "${fieldName}" found - this requires appearance stream handling`);
        
        // This would require custom appearance stream creation
        // which is significantly more complex
        return false;
        
    } catch (error) {
        console.error(`Failed to insert signature into text field "${fieldName}":`, error.message);
        return false;
    }
}

/**
 * Smart signature insertion - tries multiple methods
 */
async function insertSignatureSmart(pdfDoc, signatureData, fieldName) {
    try {
        console.log(`\nAttempting to insert signature for: ${fieldName}`);
        
        // Process signature data with enhanced visibility
        let signatureBytes;
        if (signatureData.startsWith('data:image/')) {
            // Base64 data from canvas/upload (high-resolution)
            const base64Data = signatureData.split(',')[1];
            signatureBytes = Buffer.from(base64Data, 'base64');
            console.log(`Processing high-resolution base64 signature data (${signatureBytes.length} bytes)`);
            console.log(`Signature format: ${signatureData.split(',')[0]}`);
        } else if (signatureData.startsWith('http')) {
            // URL - convert to local file path for Liz's signature
            const urlPath = new URL(signatureData).pathname;
            const localPath = path.join(__dirname, '..', urlPath);
            if (fs.existsSync(localPath)) {
                signatureBytes = fs.readFileSync(localPath);
                console.log(`Processing signature file: ${localPath} (${signatureBytes.length} bytes)`);
            } else {
                throw new Error(`Signature file not found at: ${localPath}`);
            }
        } else if (fs.existsSync(signatureData)) {
            // Direct file path
            signatureBytes = fs.readFileSync(signatureData);
            console.log(`Processing signature file: ${signatureData} (${signatureBytes.length} bytes)`);
        } else {
            throw new Error(`Invalid signature data: ${signatureData}`);
        }
        
        // Method 1: Try button field insertion
        try {
            console.log(`Trying button field method for ${fieldName}...`);
            const success = await insertSignatureIntoButtonField(pdfDoc, signatureBytes, fieldName);
            if (success) {
                console.log(`SUCCESS: Button field method worked for ${fieldName}`);
                return true;
            }
        } catch (error) {
            console.log(`Button field method failed: ${error.message}`);
        }
        
        // Method 2: Try text field insertion
        try {
            console.log(`Trying text field method for ${fieldName}...`);
            const success = await insertSignatureIntoTextField(pdfDoc, signatureBytes, fieldName);
            if (success) {
                console.log(`SUCCESS: Text field method worked for ${fieldName}`);
                return true;
            }
        } catch (error) {
            console.log(`Text field method failed: ${error.message}`);
        }
        
        // No coordinate fallback - form fields must work or we fail
        console.log(`FAILED: No form field methods worked for ${fieldName}`);
        return false;
        
    } catch (error) {
        console.error(`Error in smart signature insertion:`, error.message);
        return false;
    }
}

/**
 * Main PDF signature insertion function
 */
async function insertSignaturesIntoPDF(pin, lawyerData, signatureData) {
    try {
        console.log(`\nStarting PDF signature insertion for PIN: ${pin}`);
        
        // Load PDF from final-tob folder
        const centralRepository = process.env.CENTRAL_REPOSITORY_PATH;
        const finalTobPath = path.join(centralRepository, 'final-tob');
        const files = fs.readdirSync(finalTobPath);
        const pdfFile = files.find(file => file.endsWith('.pdf'));
        
        if (!pdfFile) {
            throw new Error(`No PDF file found in final-tob folder`);
        }
        
        const pdfPath = path.join(finalTobPath, pdfFile);
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        console.log(`PDF loaded: ${pdfDoc.getPageCount()} pages`);
        
        // Inspect fields first
        const fieldInfo = await inspectPDFFields(pdfDoc);
        
        // Track results
        const results = {
            lizSignature: false,
            lawyerSignature1: false,
            lawyerSignature2: false
        };
        
        // Insert Liz's signature - prioritize canvas signature, fallback to original
        if (signatureData.lizSignature) {
            // Check for canvas signature first (preferred)
            const canvasSignaturePath = path.join(centralRepository, 'signatures/lizs-signature-canvas.png');
            const originalSignaturePath = path.join(centralRepository, 'signatures/lizs-signature.png');

            let signaturePath;
            let signatureType;

            if (fs.existsSync(canvasSignaturePath)) {
                signaturePath = canvasSignaturePath;
                signatureType = 'canvas-drawn (high quality)';
                console.log(`✅ Using Liz's ${signatureType} signature - same format as lawyer signatures`);
            } else if (fs.existsSync(originalSignaturePath)) {
                signaturePath = originalSignaturePath;
                signatureType = 'original file';
                console.log(`Using Liz's ${signatureType} signature with base64 processing`);
            } else {
                console.log(`❌ No Liz signature file found`);
                results.lizSignature = false;
            }

            if (signaturePath) {
                // Convert to base64 data like lawyer signatures for consistent quality
                const signatureBuffer = fs.readFileSync(signaturePath);
                const base64Data = signatureBuffer.toString('base64');
                const dataUrl = `data:image/png;base64,${base64Data}`;

                // Use the EXACT same base64 processing path as lawyer signatures
                results.lizSignature = await insertSignatureSmart(pdfDoc, dataUrl, 'LizsSignature');
                
                if (results.lizSignature) {
                    console.log(`✅ Liz's signature embedded using same method as lawyer signatures`);
                } else {
                    console.log(`❌ Failed to embed Liz's signature`);
                }
            } else {
                console.log(`❌ Liz's signature PNG not found`);
                results.lizSignature = false;
            }
        }
        
        // Insert lawyer signatures
        if (signatureData.lawyerSignature1) {
            results.lawyerSignature1 = await insertSignatureSmart(pdfDoc, signatureData.lawyerSignature1, 'LawyerSignature1');
        }
        if (signatureData.lawyerSignature2) {
            results.lawyerSignature2 = await insertSignatureSmart(pdfDoc, signatureData.lawyerSignature2, 'LawyerSignature2');
        }
        
        // Save result
        const outputFilename = `TOB_${pin}_Signed.pdf`;
        const outputPath = path.join(centralRepository, 'signed-tob', outputFilename);
        
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const finalPdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, finalPdfBytes);
        
        console.log(`\n=== RESULTS ===`);
        console.log(`PDF saved to: ${outputPath}`);
        console.log('Signature insertion results:', results);
        console.log('Fields found in PDF:', fieldInfo.length > 0 ? fieldInfo.map(f => `${f.name}(${f.type})`).join(', ') : 'None');
        
        return {
            success: true,
            outputPath,
            downloadUrl: `${process.env.API_BASE_URL}/api/documents/${pin}/signed`,
            results,
            fieldInfo,
            methodsAttempted: ['buttonField', 'textField']
        };
        
    } catch (error) {
        console.error(`PDF signature insertion failed:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export {
    inspectPDFFields,
    insertSignatureSmart,
    insertSignaturesIntoPDF
};