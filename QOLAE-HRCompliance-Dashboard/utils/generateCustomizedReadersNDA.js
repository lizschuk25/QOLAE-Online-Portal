// ==============================================
// QOLAE CUSTOMIZED NDA GENERATOR
// ==============================================
// Purpose: Auto-populate TemplateReadersNDA.pdf with reader data
// Author: Liz
// Date: October 7, 2025
// Pattern: Following generateCustomizedTOB.js pattern
// ==============================================

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const readersDb = new Pool({
  connectionString: process.env.HRCOMPLIANCE_DATABASE_URL
});

// ==============================================
// HELPER: Get Reader Data by PIN from Database
// ==============================================
async function getReaderData(readerPin) {
  try {
    const result = await readersDb.query(
      'SELECT reader_pin, reader_name, email, reader_type, specialization FROM readers WHERE reader_pin = $1',
      [readerPin]
    );

    if (result.rows.length === 0) {
      throw new Error(`Reader with PIN ${readerPin} not found in database`);
    }

    console.log(`✅ Found reader data for: ${result.rows[0].reader_name}`);
    return result.rows[0];

  } catch (error) {
    console.error(`❌ Database error finding reader:`, error);
    throw error;
  }
}

// ==============================================
// HELPER: Format Date (UK Format)
// ==============================================
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ==============================================
// HELPER: Get Directory Paths
// ==============================================
function getDirectoryPaths() {
  // Use API Dashboard central repository (following Admin pattern)
  const apiCentralRepo = '/var/www/api.qolae.com/central-repository';

  return {
    templatePath: path.join(apiCentralRepo, 'original', 'TemplateReadersNDA.pdf'),
    tempDir: path.join(apiCentralRepo, 'temp'),
    finalNdaDir: path.join(apiCentralRepo, 'final-nda'),
    signedNdaDir: path.join(apiCentralRepo, 'signed-nda'),
    signaturesDir: path.join(apiCentralRepo, 'signatures')
  };
}

// ==============================================
// HELPER: Populate Form Fields with Reader Data
// ==============================================
async function populateFormFields(form, reader, readerPin) {
  console.log(`📝 Populating form fields for ${reader.reader_name}...`);

  // Format current date
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);

  console.log(`Formatted current date: ${formattedDate}`);

  // Reader Name fields (7 instances)
  const readerNameFields = [
    'ReadersName1',
    'ReadersName2',
    'ReadersName3',
    'ReadersName4',
    'ReadersName5',
    'ReadersName6',
    'ReadersName7'
  ];

  readerNameFields.forEach(fieldName => {
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(reader.reader_name || '');
        console.log(`  ✅ Set ${fieldName} to: ${reader.reader_name}`);
      }
    } catch (e) {
      console.warn(`  ⚠️ Field ${fieldName} not found or error: ${e.message}`);
    }
  });

  // Current Date fields (4 instances)
  const currentDateFields = [
    'CurrentDate1',
    'CurrentDate2',
    'CurrentDate3',
    'CurrentDate4'
  ];

  currentDateFields.forEach(fieldName => {
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(formattedDate);
        console.log(`  ✅ Set ${fieldName} to: ${formattedDate}`);
      }
    } catch (e) {
      console.warn(`  ⚠️ Field ${fieldName} not found or error: ${e.message}`);
    }
  });

  // PIN field (1 instance)
  try {
    const pinField = form.getTextField('PIN');
    if (pinField) {
      pinField.setText(readerPin || '');
      console.log(`  ✅ Set PIN to: ${readerPin}`);
    }
  } catch (e) {
    console.warn(`  ⚠️ PIN field not found or error: ${e.message}`);
  }

  console.log('✅ Form population complete');
}

// ==============================================
// MAIN FUNCTION: Generate Customized NDA
// ==============================================
async function generateCustomizedNDA(readerPin) {
  console.log(`\n📄 === GENERATING CUSTOMIZED NDA FOR PIN: ${readerPin} ===`);

  try {
    // 1. Get reader data from database
    const reader = await getReaderData(readerPin);
    console.log(`👤 Processing NDA for: ${reader.reader_name}`);

    // 2. Get directory paths
    const { templatePath, finalNdaDir } = getDirectoryPaths();

    // 3. Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template NDA not found at: ${templatePath}`);
    }

    // 4. Load template PDF
    console.log(`📄 Loading template from: ${templatePath}`);
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // 5. Get the form from the PDF
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`📋 Found ${fields.length} form fields in template`);

    // 6. Log available fields for debugging
    if (fields.length > 0) {
      console.log('📝 Available form fields:');
      fields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.getName()} (${field.constructor.name})`);
      });
    }

    // 7. Fill in the form fields with reader data
    await populateFormFields(form, reader, readerPin);

    // 8. Don't flatten - preserve button placeholders for signatures
    console.log('Skipping form flattening to preserve signature button placeholders (ReadersSignature, LizsSignature)...');

    // 9. Save the customized NDA to final-nda folder
    const outputFilename = `NDA_${readerPin}.pdf`;
    const outputPath = path.join(finalNdaDir, outputFilename);

    // Ensure output directory exists
    if (!fs.existsSync(finalNdaDir)) {
      fs.mkdirSync(finalNdaDir, { recursive: true });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`✅ Customized NDA saved to: ${outputPath}`);

    return {
      success: true,
      message: `Customized NDA generated for ${reader.reader_name}`,
      outputPath: outputPath,
      readerName: reader.reader_name,
      readerPin: readerPin,
    };

  } catch (error) {
    console.error(`❌ Error generating customized NDA:`, error.message);
    return {
      success: false,
      error: error.message,
      readerPin: readerPin,
    };
  }
}


// ==============================================
// EXPORTS
// ==============================================
export {
  generateCustomizedNDA
};
