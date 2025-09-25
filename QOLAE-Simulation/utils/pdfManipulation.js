import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb } from 'pdf-lib';

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
        console.log(`Total fields found: ${fieldNames.length}`);
        
        if (fieldNames.length === 0) {
            console.log('No form fields found in PDF');
            return [];
        }
        
        const fieldInfo = [];
        fieldNames.forEach(name => {
            const field = form.getField(name);
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
        const { width, height } = buttonField.acroField.getWidgets()[0].getRectangle();
        
        buttonField.setImage(signatureImage);
        
        console.log(`Button field "${fieldName}" updated with signature`);
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

// No coordinate-based fallback - form fields only

/**
 * Smart signature insertion - tries multiple methods
 */
async function insertSignatureSmart(pdfDoc, signatureData, fieldName) {
    try {
        console.log(`\nAttempting to insert signature for: ${fieldName}`);
        
        // Process signature data
        let signatureBytes;
        if (signatureData.startsWith('data:image/')) {
            const base64Data = signatureData.split(',')[1];
            signatureBytes = Buffer.from(base64Data, 'base64');
        } else if (fs.existsSync(signatureData)) {
            signatureBytes = fs.readFileSync(signatureData);
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
 * Main manipulation function - redesigned
 */
async function manipulatePDFWithSignatures(pin, signatureData) {
    try {
        console.log(`\nStarting PDF manipulation for PIN: ${pin}`);
        
        // Load PDF
        const finalTobPath = path.join(__dirname, '../central-repository/final-tob');
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
        
        // Insert Liz's signature
        if (signatureData.lizSignature) {
            const lizSignaturePath = path.join(__dirname, '../central-repository/signatures/lizs-signature.png');
            if (fs.existsSync(lizSignaturePath)) {
                results.lizSignature = await insertSignatureSmart(pdfDoc, lizSignaturePath, 'LizsSignature');
            }
        }
        
        // Insert lawyer signatures
        if (signatureData.lawyerSignature) {
            results.lawyerSignature1 = await insertSignatureSmart(pdfDoc, signatureData.lawyerSignature, 'LawyerSignature1');
            results.lawyerSignature2 = await insertSignatureSmart(pdfDoc, signatureData.lawyerSignature, 'LawyerSignature2');
        }
        
        // Save result
        const outputFilename = `TOB_${pin}_Signed_Test.pdf`;
        const outputPath = path.join(__dirname, '../central-repository/signed-tob', outputFilename);
        
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
            results,
            fieldInfo,
            methodsAttempted: ['buttonField', 'textField']
        };
        
    } catch (error) {
        console.error(`PDF manipulation failed:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export {
    inspectPDFFields,
    insertSignatureSmart,
    manipulatePDFWithSignatures
};