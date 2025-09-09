// ========================================
// LOCATION: /html-parsing
// PURPOSE: DOM traversal and content extraction
// ========================================
// Infrastructure: Pure JavaScript DOM walker
// Routes: HTML file → structured data objects
// Design: Preserve all styling and layout data
// Error handling: Validate HTML structure
// Dependencies: ZERO

import fs from 'fs';

class QolaeHtmlParser {
    constructor() {
        this.documentStructure = {
            pages: [],
            styles: {},
            metadata: {},
            toc: [],
            images: [],
            forms: [],
            signatures: []
        };
    }

    // ========================================
    // MAIN PARSING ENTRY POINT
    // ========================================
    parseHtmlFile(filePath) {
        try {
            console.log(`[HTML-PARSING] Starting parse of: ${filePath}`);
            
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            
            // Step 1: Extract and parse CSS
            this.extractStyles(htmlContent);
            
            // Step 2: Parse document structure
            this.parseDocumentStructure(htmlContent);
            
            // Step 3: Extract special elements
            this.extractSpecialElements(htmlContent);
            
            // Step 4: Build page-by-page structure
            this.buildPageStructure(htmlContent);
            
            console.log(`[HTML-PARSING] Parse completed successfully`);
            return this.documentStructure;
            
        } catch (error) {
            console.error(`[HTML-PARSING] Error: ${error.message}`);
            throw new Error(`HTML parsing failed: ${error.message}`);
        }
    }

    // ========================================
    // CSS EXTRACTION AND PROCESSING
    // ========================================
    extractStyles(htmlContent) {
        console.log(`[HTML-PARSING] Extracting CSS styles...`);
        
        // Extract inline styles from <style> tags
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let match;
        
        while ((match = styleRegex.exec(htmlContent)) !== null) {
            const cssContent = match[1];
            this.parseCssRules(cssContent);
        }
        
        console.log(`[HTML-PARSING] Extracted ${Object.keys(this.documentStructure.styles).length} CSS rules`);
    }

    parseCssRules(cssContent) {
        // Remove comments
        cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Split into individual rules
        const rules = cssContent.split('}').filter(rule => rule.trim());
        
        rules.forEach(rule => {
            const [selector, declarations] = rule.split('{');
            if (selector && declarations) {
                const cleanSelector = selector.trim();
                const properties = this.parseDeclarations(declarations);
                this.documentStructure.styles[cleanSelector] = properties;
            }
        });
    }

    parseDeclarations(declarations) {
        const properties = {};
        const declarationList = declarations.split(';').filter(decl => decl.trim());
        
        declarationList.forEach(declaration => {
            const [property, value] = declaration.split(':');
            if (property && value) {
                properties[property.trim()] = value.trim();
            }
        });
        
        return properties;
    }

    // ========================================
    // DOCUMENT STRUCTURE PARSING
    // ========================================
    parseDocumentStructure(htmlContent) {
        console.log(`[HTML-PARSING] Parsing document structure...`);
        
        // Extract basic document metadata
        this.documentStructure.metadata = {
            title: this.extractTitle(htmlContent),
            charset: this.extractCharset(htmlContent),
            viewport: this.extractViewport(htmlContent)
        };
        
        // Extract table of contents structure
        this.extractTableOfContents(htmlContent);
    }

    extractTitle(htmlContent) {
        const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
        return titleMatch ? titleMatch[1] : 'Untitled Document';
    }

    extractCharset(htmlContent) {
        const charsetMatch = htmlContent.match(/charset=["\']([^"\']+)["\']|charset=([^\s>]+)/i);
        return charsetMatch ? (charsetMatch[1] || charsetMatch[2]) : 'UTF-8';
    }

    extractViewport(htmlContent) {
        const viewportMatch = htmlContent.match(/name=["\']viewport["\'][^>]*content=["\']([^"\']+)["\']|name=["\']viewport["\'][^>]*content=([^\s>]+)/i);
        return viewportMatch ? (viewportMatch[1] || viewportMatch[2]) : null;
    }

    // ========================================
    // TABLE OF CONTENTS EXTRACTION
    // ========================================
    extractTableOfContents(htmlContent) {
        console.log(`[HTML-PARSING] Extracting table of contents...`);
        
        // Find TOC container
        const tocRegex = /<div[^>]*class=["\'][^"\']*toc[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/gi;
        let tocMatch;
        
        while ((tocMatch = tocRegex.exec(htmlContent)) !== null) {
            const tocContent = tocMatch[1];
            this.parseTocItems(tocContent);
        }
    }

    parseTocItems(tocContent) {
        // Extract individual TOC items
        const tocItemRegex = /<div[^>]*class=["\'][^"\']*toc-item[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/gi;
        let itemMatch;
        
        while ((itemMatch = tocItemRegex.exec(tocContent)) !== null) {
            const itemContent = itemMatch[1];
            const tocItem = this.parseSingleTocItem(itemContent);
            if (tocItem) {
                this.documentStructure.toc.push(tocItem);
            }
        }
    }

    parseSingleTocItem(itemContent) {
        // Extract title and page number
        const titleMatch = itemContent.match(/<a[^>]*href=["\']([^"\']+)["\'][^>]*[^>]*class=["\'][^"\']*toc-title[^"\']*["\'][^>]*>(.*?)<span/i);
        const pageMatch = itemContent.match(/<span[^>]*class=["\'][^"\']*toc-page[^"\']*["\'][^>]*>(\d+)<\/span>/i);
        
        if (titleMatch && pageMatch) {
            return {
                href: titleMatch[1],
                title: titleMatch[2].trim(),
                page: parseInt(pageMatch[1]),
                type: 'toc-item'
            };
        }
        return null;
    }

    // ========================================
    // SPECIAL ELEMENTS EXTRACTION
    // ========================================
    extractSpecialElements(htmlContent) {
        console.log(`[HTML-PARSING] Extracting special elements...`);
        
        // Extract images
        this.extractImages(htmlContent);
        
        // Extract form fields
        this.extractFormFields(htmlContent);
        
        // Extract signature blocks
        this.extractSignatureBlocks(htmlContent);
    }

    extractImages(htmlContent) {
        const imgRegex = /<img[^>]*src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\'][^>]*class=["\']([^"\']*)["\'][^>]*>/gi;
        let imgMatch;
        
        while ((imgMatch = imgRegex.exec(htmlContent)) !== null) {
            this.documentStructure.images.push({
                src: imgMatch[1],
                alt: imgMatch[2],
                class: imgMatch[3],
                type: 'image'
            });
        }
    }

    extractFormFields(htmlContent) {
        const fieldRegex = /<span[^>]*class=["\'][^"\']*form-field[^"\']*["\'][^>]*[^>]*id=["\']([^"\']*)["\'][^>]*>(.*?)<\/span>/gi;
        let fieldMatch;
        
        while ((fieldMatch = fieldRegex.exec(htmlContent)) !== null) {
            this.documentStructure.forms.push({
                id: fieldMatch[1],
                content: fieldMatch[2],
                type: 'form-field'
            });
        }
    }

    extractSignatureBlocks(htmlContent) {
        const sigRegex = /<div[^>]*class=["\'][^"\']*signature-block[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/gi;
        let sigMatch;
        
        while ((sigMatch = sigRegex.exec(htmlContent)) !== null) {
            this.documentStructure.signatures.push({
                content: sigMatch[1],
                type: 'signature-block'
            });
        }
    }

    // ========================================
    // PAGE STRUCTURE BUILDING
    // ========================================
    buildPageStructure(htmlContent) {
        console.log(`[HTML-PARSING] Building page structure...`);
        
        // Extract individual pages (sections with class="sheet")
        const pageRegex = /<section[^>]*class=["\'][^"\']*sheet[^"\']*["\'][^>]*[^>]*id=["\']([^"\']*)["\'][^>]*>([\s\S]*?)<\/section>/gi;
        let pageMatch;
        
        while ((pageMatch = pageRegex.exec(htmlContent)) !== null) {
            const pageId = pageMatch[1];
            const pageContent = pageMatch[2];
            
            const page = this.parsePageContent(pageId, pageContent);
            this.documentStructure.pages.push(page);
        }
        
        console.log(`[HTML-PARSING] Built ${this.documentStructure.pages.length} pages`);
    }

    parsePageContent(pageId, content) {
        return {
            id: pageId,
            header: this.extractPageHeader(content),
            main: this.extractMainContent(content),
            footer: this.extractPageFooter(content),
            elements: this.extractPageElements(content)
        };
    }

    extractPageHeader(content) {
        const headerMatch = content.match(/<div[^>]*class=["\'][^"\']*page-header[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i);
        return headerMatch ? headerMatch[1] : null;
    }

    extractMainContent(content) {
        const mainMatch = content.match(/<main[^>]*class=["\'][^"\']*content[^"\']*["\'][^>]*>([\s\S]*?)<\/main>/i);
        return mainMatch ? mainMatch[1] : null;
    }

    extractPageFooter(content) {
        const footerMatch = content.match(/<div[^>]*class=["\'][^"\']*page-footer[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i);
        return footerMatch ? footerMatch[1] : null;
    }

    extractPageElements(content) {
        const elements = [];
        
        // Extract headings
        const headingRegex = /<(h[1-6])[^>]*[^>]*class=["\']([^"\']*)["\'][^>]*>(.*?)<\/\1>/gi;
        let headingMatch;
        
        while ((headingMatch = headingRegex.exec(content)) !== null) {
            elements.push({
                type: 'heading',
                tag: headingMatch[1],
                class: headingMatch[2],
                content: headingMatch[3]
            });
        }
        
        // Extract paragraphs
        const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
        let pMatch;
        
        while ((pMatch = pRegex.exec(content)) !== null) {
            elements.push({
                type: 'paragraph',
                content: pMatch[1]
            });
        }
        
        return elements;
    }

    // ========================================
    // OUTPUT AND DEBUGGING
    // ========================================
    getStructureSummary() {
        return {
            totalPages: this.documentStructure.pages.length,
            totalStyles: Object.keys(this.documentStructure.styles).length,
            totalTocItems: this.documentStructure.toc.length,
            totalImages: this.documentStructure.images.length,
            totalFormFields: this.documentStructure.forms.length,
            totalSignatures: this.documentStructure.signatures.length
        };
    }

    exportStructure(outputPath) {
        try {
            fs.writeFileSync(outputPath, JSON.stringify(this.documentStructure, null, 2));
            console.log(`[HTML-PARSING] Structure exported to: ${outputPath}`);
        } catch (error) {
            console.error(`[HTML-PARSING] Export failed: ${error.message}`);
        }
    }
}

// ========================================
// USAGE EXAMPLE
// ========================================
export function parseHtmlDocument(inputPath, outputPath = null) {
    console.log(`[HTML-PARSING] Initializing parser...`);
    
    const parser = new QolaeHtmlParser();
    const structure = parser.parseHtmlFile(inputPath);
    
    // Log summary
    const summary = parser.getStructureSummary();
    console.log(`[HTML-PARSING] Summary:`, summary);
    
    // Export if path provided
    if (outputPath) {
        parser.exportStructure(outputPath);
    }
    
    return structure;
}

// Example usage:
// const structure = parseHtmlDocument('./TOB_document.html', './document_structure.json');