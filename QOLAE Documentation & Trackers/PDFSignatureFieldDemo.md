import React, { useState, useRef, useEffect } from 'react';

const PDFSignatureDemo = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldType, setFieldType] = useState('text'); // 'text' or 'button'
  const [signatureData, setSignatureData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [transformationResult, setTransformationResult] = useState(null);
  const canvasRef = useRef(null);

  // Canvas drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Mock transformation process
  const simulateTransformation = async () => {
    setTransformationResult({ processing: true });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = fieldType === 'button' || fieldType === 'converted';
    
    setTransformationResult({
      processing: false,
      success,
      fieldType,
      message: success 
        ? `Successfully embedded signature using ${fieldType} field approach`
        : 'Text field overlay failed - Adobe PDF restrictions',
      details: success 
        ? 'Image properly embedded as button field appearance stream'
        : 'Adobe PDFs do not support image embedding in text fields'
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #693382, #8b5a9f)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>PDF Signature Field Demo</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Interactive demonstration of signature embedding in PDF form fields</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', gap: '12px' }}>
        {[1, 2, 3, 4].map(step => (
          <div key={step} style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            background: step <= currentStep ? '#693382' : '#e5e7eb',
            color: step <= currentStep ? 'white' : '#6b7280'
          }}>
            {step === 1 && 'Field Type'}
            {step === 2 && 'Draw Signature'}
            {step === 3 && 'Transform PDF'}
            {step === 4 && 'Result'}
          </div>
        ))}
      </div>

      {/* Step 1: Field Type Selection */}
      {currentStep === 1 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 1: Choose PDF Field Type</h3>
          <p style={{ color: '#6b7280', marginBottom: '25px' }}>
            Select the type of form field you have in your PDF for signatures:
          </p>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {/* Text Field Option */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '15px', 
              border: fieldType === 'text' ? '2px solid #693382' : '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              background: fieldType === 'text' ? '#f8f5ff' : 'white'
            }}>
              <input 
                type="radio" 
                value="text" 
                checked={fieldType === 'text'}
                onChange={(e) => setFieldType(e.target.value)}
                style={{ marginRight: '12px', transform: 'scale(1.2)' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#374151' }}>Text Field (Current)</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Your current LizsSignature, LawyerSignature1, LawyerSignature2 fields
                </div>
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                  ⚠️ Adobe restriction: Cannot embed images in text fields
                </div>
              </div>
            </label>

            {/* Button Field Option */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '15px', 
              border: fieldType === 'button' ? '2px solid #693382' : '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              background: fieldType === 'button' ? '#f8f5ff' : 'white'
            }}>
              <input 
                type="radio" 
                value="button" 
                checked={fieldType === 'button'}
                onChange={(e) => setFieldType(e.target.value)}
                style={{ marginRight: '12px', transform: 'scale(1.2)' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#374151' }}>Button Field (Recommended)</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Convert your specific signature fields to button fields in Adobe Acrobat
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px', fontWeight: '500' }}>
                  🎯 Target fields: LizsSignature, LawyerSignature1, LawyerSignature2
                </div>
                <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '500' }}>
                  ✅ Supports image appearance streams natively
                </div>
              </div>
            </label>

            {/* Auto-Convert Option */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '15px', 
              border: fieldType === 'converted' ? '2px solid #693382' : '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              background: fieldType === 'converted' ? '#f8f5ff' : 'white'
            }}>
              <input 
                type="radio" 
                value="converted" 
                checked={fieldType === 'converted'}
                onChange={(e) => setFieldType(e.target.value)}
                style={{ marginRight: '12px', transform: 'scale(1.2)' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#374151' }}>Auto-Convert (Code Solution)</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Let the code convert only signature fields to button fields automatically
                </div>
                <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', fontWeight: '500' }}>
                  🔧 Only converts: LizsSignature, LawyerSignature1, LawyerSignature2
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px', fontWeight: '500' }}>
                  🔄 Leaves date fields and other text fields unchanged
                </div>
              </div>
            </label>
          </div>

          <button 
            onClick={() => setCurrentStep(2)}
            style={{
              marginTop: '25px',
              background: '#693382',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Continue to Signature →
          </button>
        </div>
      )}

      {/* Step 2: Draw Signature */}
      {currentStep === 2 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 2: Draw Your Signature</h3>
          <p style={{ color: '#6b7280', marginBottom: '25px' }}>
            Draw your signature in the canvas below (this simulates the lawyer's signature capture):
          </p>
          
          <div style={{ border: '2px dashed #693382', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'crosshair',
                background: 'white'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div style={{ marginTop: '15px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={clearSignature}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear Signature
              </button>
              <button 
                onClick={() => setCurrentStep(3)}
                disabled={!signatureData}
                style={{
                  background: signatureData ? '#693382' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: signatureData ? 'pointer' : 'not-allowed'
                }}
              >
                Continue to Transform →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Transform PDF */}
      {currentStep === 3 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 3: PDF Transformation</h3>
          <p style={{ color: '#6b7280', marginBottom: '25px' }}>
            Now we'll simulate embedding your signature into the PDF using the <strong>{fieldType}</strong> field approach:
          </p>

          {/* Signature Preview */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Captured Signature:</h4>
            {signatureData && (
              <img 
                src={signatureData} 
                alt="Captured signature" 
                style={{ maxWidth: '200px', height: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
            )}
          </div>

          {/* Field Type Info */}
          <div style={{ background: fieldType === 'text' ? '#fef3f2' : '#f0fdf4', border: `1px solid ${fieldType === 'text' ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: fieldType === 'text' ? '#dc2626' : '#059669' }}>
              {fieldType === 'text' && '❌ Text Field Limitation'}
              {fieldType === 'button' && '✅ Button Field Advantage'}
              {fieldType === 'converted' && '🔄 Auto-Conversion Process'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: fieldType === 'text' ? '#7f1d1d' : '#14532d' }}>
              {fieldType === 'text' && 'Adobe PDFs do not support embedding images directly into text form fields. This approach will likely fail or display incorrectly.'}
              {fieldType === 'button' && 'Button fields support appearance streams which can display images properly. This is the Adobe-compliant approach.'}
              {fieldType === 'converted' && 'The code will remove the text field and create a new button field at the same coordinates, then embed the image as an appearance stream.'}
            </p>
          </div>

          <button 
            onClick={() => {
              simulateTransformation();
              setCurrentStep(4);
            }}
            style={{
              background: '#693382',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Start Transformation →
          </button>
        </div>
      )}

      {/* Step 4: Result */}
      {currentStep === 4 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 4: Transformation Result</h3>
          
          {transformationResult?.processing && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #693382',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p style={{ color: '#6b7280' }}>Processing PDF transformation...</p>
            </div>
          )}

          {transformationResult && !transformationResult.processing && (
            <div>
              <div style={{
                background: transformationResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${transformationResult.success ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '15px', textAlign: 'center' }}>
                  {transformationResult.success ? '✅' : '❌'}
                </div>
                <h4 style={{ margin: '0 0 10px 0', color: transformationResult.success ? '#059669' : '#dc2626' }}>
                  {transformationResult.message}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: transformationResult.success ? '#14532d' : '#7f1d1d' }}>
                  {transformationResult.details}
                </p>
              </div>

              {/* Technical Details */}
              <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Technical Implementation:</h4>
                
                {fieldType === 'button' && (
                  <div>
                    <p><strong>✅ Button Field Approach:</strong></p>
                    <ul style={{ fontSize: '14px', color: '#4b5563' }}>
                      <li>Create PDF XObject appearance stream</li>
                      <li>Embed PNG/JPEG image into appearance stream</li>
                      <li>Set appearance stream as button's normal appearance</li>
                      <li>Adobe Acrobat displays image correctly</li>
                    </ul>
                  </div>
                )}

                {fieldType === 'converted' && (
                  <div>
                    <p><strong>🔄 Auto-Conversion Approach:</strong></p>
                    <ul style={{ fontSize: '14px', color: '#4b5563' }}>
                      <li>Target only signature fields: LizsSignature, LawyerSignature1, LawyerSignature2</li>
                      <li>Detect each field's position and dimensions</li>
                      <li>Remove only the signature text fields from PDF form</li>
                      <li>Create new button fields at same coordinates with same names</li>
                      <li>Apply image appearance streams to new button fields</li>
                      <li>Leave all other text fields (dates, etc.) unchanged</li>
                    </ul>
                  </div>
                )}

                {fieldType === 'text' && (
                  <div>
                    <p><strong>❌ Text Field Issues:</strong></p>
                    <ul style={{ fontSize: '14px', color: '#4b5563' }}>
                      <li>Text fields only support string values</li>
                      <li>Base64 image data displays as text</li>
                      <li>Overlay approach often blocked by Adobe</li>
                      <li>Not PDF specification compliant</li>
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => {
                    setCurrentStep(1);
                    setSignatureData(null);
                    setTransformationResult(null);
                    clearSignature();
                  }}
                  style={{
                    background: '#693382',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Try Different Approach
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PDFSignatureDemo;



PDFSignature FieldDemo Step1.png
DrawSignature Blank Canvas.png
DrawSignature Step2.png
TransformPDF Step3.png
Transformation Result Step4.png

