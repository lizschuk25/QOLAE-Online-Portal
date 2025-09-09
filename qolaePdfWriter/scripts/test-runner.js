import { parseHtmlDocument } from '../src/workflow-steps/html-parsing/index.js';

const inputFile = './test-documents/input/TOB_document.html';
const outputFile = './test-documents/debug-output/document_structure.json';

console.log('Testing HTML Parser...');
try {
    const structure = parseHtmlDocument(inputFile, outputFile);
    console.log('✓ Parse completed successfully');
} catch (error) {
    console.error('✗ Parse failed:', error.message);
}