# QOLAE PDF Manipulation Simulation

This simulation environment tests the new PDF manipulation approach for the QOLAE TOB workflow.

## Overview

Instead of generating new PDFs from EJS templates, this approach:
1. **Loads existing customized TOB** from `final-tob/` folder
2. **Manipulates the PDF** to insert signatures into Image Placeholders
3. **Saves the completed PDF** to `signed-tob/` folder

## Folder Structure

```
QOLAE-Simulation/
├── central-repository/
│   ├── final-tob/           # Input: Existing customized TOB
│   ├── signed-tob/          # Output: Final PDF with signatures
│   └── signatures/          # Signature files (PNG/SVG)
├── routes/
│   └── documentRoutes.js    # Simulated API routes
├── views/
│   └── tobModal.ejs         # Simulated frontend
├── utils/
│   └── pdfManipulation.js   # New PDF manipulation function
├── fastify_server.js        # Simulated server
├── test-pdf-manipulation.js # Test runner
└── package.json            # Dependencies
```

## How to Run

1. **Install dependencies:**
   ```bash
   cd QOLAE-Simulation
   npm install
   ```

2. **Run the simulation:**
   ```bash
   npm test
   ```

3. **Check results:**
   - Look in `central-repository/signed-tob/` for the output PDF
   - Check console output for success/error messages

## What This Tests

- ✅ **PDF loading** from existing files
- ✅ **Signature insertion** into Image Placeholders
- ✅ **PDF manipulation** without EJS generation
- ✅ **File output** to signed-tob folder
- ✅ **Complete workflow** simulation

## Benefits

- 🚀 **No cache issues** - No EJS template rendering
- 🎯 **Uses existing PDF** - Your beautiful working PDF
- 🔒 **Safe testing** - No risk to live codebase
- 📊 **Realistic simulation** - Same structure as live server

## Next Steps

If simulation succeeds:
1. **Modify live `documentRoutes.js`** to use PDF manipulation
2. **Update `fastify_server.js`** with new logic
3. **Adjust `tobModal.ejs`** for new API calls
4. **Remove `generateLawyersCustomizedTOB.js`** (becomes redundant)

## Dependencies

- `pdf-lib` - PDF manipulation library
- `fastify` - Web framework
- `fs` - File system operations
- `path` - Path utilities
