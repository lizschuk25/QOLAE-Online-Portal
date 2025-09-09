import React, { useState } from 'react';

const SignatureWorkflowExplanation = () => {
  const [activeStep, setActiveStep] = useState(3);

  const steps = [
    {
      id: 1,
      title: "Lawyer Completes TOB Modal",
      description: "Lawyer draws signature in canvas",
      userVisible: true,
      behindScenes: "Canvas signature captured as base64 PNG data"
    },
    {
      id: 2,
      title: "Transformation API Called",
      description: "System processes the signature data",
      userVisible: false,
      behindScenes: "Code automatically adds company signature from repository"
    },
    {
      id: 3,
      title: "Company Signature Applied",
      description: "Your signature automatically added",
      userVisible: false,
      behindScenes: "LizsSignature: 'central-repository/signatures/liz-signature.png'"
    },
    {
      id: 4,
      title: "Final PDF Generated",
      description: "Both signatures embedded in PDF",
      userVisible: false,
      behindScenes: "Transformed PDF saved with both signatures"
    },
    {
      id: 5,
      title: "Lawyer Sees Success",
      description: "Success message + download option",
      userVisible: true,
      behindScenes: "Dashboard updates, lawyer can download signed document"
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #693382, #8b5a9f)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Company Signature Auto-Application Flow</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>How Liz's signature gets automatically applied to TOB documents</p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {steps.map((step, index) => (
          <div 
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            style={{
              border: activeStep === step.id ? '2px solid #693382' : '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: step.userVisible ? '#f8f9ff' : '#f0fdf4'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step.userVisible ? '#693382' : '#059669',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '15px'
              }}>
                {step.id}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#374151' }}>{step.title}</h3>
                <div style={{ 
                  fontSize: '12px', 
                  color: step.userVisible ? '#693382' : '#059669',
                  fontWeight: 'bold',
                  marginTop: '2px'
                }}>
                  {step.userVisible ? '👁️ Lawyer Visible' : '🔧 Behind the Scenes'}
                </div>
              </div>
            </div>
            
            <div style={{ marginLeft: '55px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#4b5563', fontWeight: '500' }}>
                {step.description}
              </p>
              <div style={{ 
                background: step.userVisible ? '#e0e7ff' : '#dcfce7', 
                padding: '10px', 
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#374151'
              }}>
                {step.behindScenes}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '30px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#693382', marginBottom: '15px' }}>Code Implementation (Step 2-3)</h3>
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          fontSize: '14px',
          overflow: 'auto'
        }}>
{`// In your tobModal.ejs - Step 3 completion
function processFinalSignatures() {
    const signatureData = {
        LawyerSignature1: capturedSignatureData, // From canvas
        LawyerSignature2: null,
        LizsSignature: 'central-repository/signatures/liz-signature.png', // ← YOUR SIGNATURE!
        pin: lawyerPin,
        timestamp: new Date().toISOString()
    };
    
    // Send to transformation API
    transformTOBWithSignatures(signatureData);
}

// In your transformTOB.js - Automatic company signature embedding
async function embedSignatures(pdfDoc, signatureData, pin) {
    // 1. Embed Company Signature (AUTOMATIC - LAWYER NEVER SEES THIS)
    if (signatureData.LizsSignature) {
        await embedSignatureIntoButtonField(
            form, 
            'LizsSignature', 
            signatureData.LizsSignature,  // ← Points to your PNG file
            'Company Signature',
            pdfDoc
        );
    }
    
    // 2. Embed Lawyer Signature (from their canvas drawing)
    if (signatureData.LawyerSignature1) {
        await embedSignatureIntoButtonField(
            form, 
            'LawyerSignature1', 
            signatureData.LawyerSignature1,  // ← Their canvas drawing
            'Lawyer Signature 1',
            pdfDoc
        );
    }
}`}
        </pre>
      </div>

      {/* Key Points */}
      <div style={{ marginTop: '20px', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ color: '#92400e', marginBottom: '15px' }}>🔑 Key Points:</h4>
        <ul style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>Your signature is hardcoded into the process</strong> - it gets applied automatically every time</li>
          <li><strong>Lawyer never sees your signature being added</strong> - it happens during PDF transformation</li>
          <li><strong>Both signatures appear in the final document</strong> - yours from the repository, theirs from the canvas</li>
          <li><strong>The "View Signed Copy Details" shows both signatures</strong> - that's when they first see your signature</li>
        </ul>
      </div>

      {/* File Location */}
      <div style={{ marginTop: '20px', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>📁 Your Signature File Location:</h4>
        <div style={{ 
          background: '#e0f2fe', 
          padding: '10px', 
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#0c4a6e',
          wordBreak: 'break-all'
        }}>
          /var/www/api.qolae.com/central-repository/signatures/liz-signature.png
        </div>
        <p style={{ color: '#0c4a6e', fontSize: '14px', marginTop: '10px' }}>
          Make sure this PNG file exists and contains your signature image.
        </p>
      </div>
    </div>
  );
};

export default SignatureWorkflowExplanation;




CompanySignature AutoFlow1-3.png
CompanySignature AutoFlow 4-5.png
CompanySignature AutoFlow Code Implementation.png
CompanySignature AutoFlow Keypoints.png