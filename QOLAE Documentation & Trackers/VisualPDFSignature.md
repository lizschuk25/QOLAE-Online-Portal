import React, { useState, useRef, useEffect } from 'react';

const VisualPDFSignatureDemo = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [capturedSignature, setCapturedSignature] = useState(null);
  const [fieldType, setFieldType] = useState('text');
  const [transformationProgress, setTransformationProgress] = useState(0);
  const [showTransformation, setShowTransformation] = useState(false);
  const canvasRef = useRef(null);

  // Mock PDF page with your actual field names
  const mockPDFFields = [
    { name: 'CurrentDate', type: 'text', value: '30th August 2025', x: 100, y: 50, width: 150, height: 25, isSignature: false },
    { name: 'SignatureDate1', type: 'text', value: '30/08/2025', x: 300, y: 50, width: 100, height: 25, isSignature: false },
    { name: 'LizsSignature', type: fieldType, value: '', x: 100, y: 150, width: 200, height: 60, isSignature: true },
    { name: 'LawyerSignature1', type: fieldType, value: '', x: 350, y: 150, width: 200, height: 60, isSignature: true },
    { name: 'LawyerSignature2', type: fieldType, value: '', x: 100, y: 250, width: 200, height: 60, isSignature: true },
    { name: 'CompanyName', type: 'text', value: 'QOLAE Limited', x: 350, y: 250, width: 150, height: 25, isSignature: false }
  ];

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
      setHasSignature(true);
      const canvas = canvasRef.current;
      setCapturedSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setCapturedSignature(null);
  };

  // Simulate transformation process
  const simulateTransformation = async () => {
    setShowTransformation(true);
    setTransformationProgress(0);
    
    const steps = [
      { progress: 20, message: 'Validating liz-signature.png exists...' },
      { progress: 40, message: 'Detecting field types...' },
      { progress: 60, message: 'Converting signature fields to buttons...' },
      { progress: 80, message: 'Embedding signature images...' },
      { progress: 100, message: 'Transformation complete!' }
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTransformationProgress(step.progress);
    }
    
    setTimeout(() => setCurrentStep(4), 1000);
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

  const PDFField = ({ field, showTransformed = false }) => {
    const isSignatureField = field.isSignature;
    const isTransformed = showTransformed && isSignatureField && fieldType !== 'button';
    
    let fieldColor = '#e5e7eb';
    let borderStyle = '1px solid #d1d5db';
    let content = field.value;
    
    if (isSignatureField) {
      if (showTransformed) {
        // After transformation - all signature fields are now buttons with images
        fieldColor = '#dcfce7';
        borderStyle = '2px solid #059669';
        if (field.name === 'LizsSignature') {
          content = '🏢 Liz Signature';
        } else if (field.name === 'LawyerSignature1') {
          content = '✏️ Lawyer Sig';
        } else {
          content = '📝 Optional';
        }
      } else {
        // Before transformation
        if (fieldType === 'button') {
          fieldColor = '#ddd6fe';
          borderStyle = '2px solid #7c3aed';
          content = 'Button Field';
        } else {
          fieldColor = '#fef3c7';
          borderStyle = '2px solid #f59e0b';
          content = 'Text Field';
        }
      }
    }
    
    return (
      <div
        style={{
          position: 'absolute',
          left: `${field.x}px`,
          top: `${field.y}px`,
          width: `${field.width}px`,
          height: `${field.height}px`,
          background: fieldColor,
          border: borderStyle,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: isSignatureField ? 'bold' : 'normal',
          color: '#374151',
          transition: 'all 0.3s ease'
        }}
      >
        {content}
        {isSignatureField && (
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '0',
            fontSize: '10px',
            fontWeight: 'bold',
            color: showTransformed ? '#059669' : (fieldType === 'button' ? '#7c3aed' : '#f59e0b')
          }}>
            {field.name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #693382, #8b5a9f)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Visual PDF Signature Field Transformation</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>See exactly what happens to your LizsSignature, LawyerSignature1, LawyerSignature2 fields</p>
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
            {step === 1 && 'Choose Field Type'}
            {step === 2 && 'Draw Signature'}
            {step === 3 && 'See Transformation'}
            {step === 4 && 'Final Result'}
          </div>
        ))}
      </div>

      {/* Step 1: Field Type Selection */}
      {currentStep === 1 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 1: Current Field Type in Your PDF</h3>
          
          <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
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
                <div style={{ fontWeight: '600', color: '#374151' }}>Text Fields (Your Current Setup)</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  LizsSignature, LawyerSignature1, LawyerSignature2 are currently text fields
                </div>
              </div>
            </label>

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
                <div style={{ fontWeight: '600', color: '#374151' }}>Button Fields (If Pre-Converted)</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  If you've already converted signature fields to buttons in Adobe Acrobat
                </div>
              </div>
            </label>
          </div>

          {/* Visual PDF Preview */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Your PDF Layout Preview:</h4>
            <div style={{ 
              position: 'relative', 
              width: '600px', 
              height: '350px', 
              background: 'white', 
              border: '2px solid #d1d5db', 
              borderRadius: '8px',
              margin: '0 auto'
            }}>
              {mockPDFFields.map(field => (
                <PDFField key={field.name} field={field} />
              ))}
              
              {/* Legend */}
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#fef3c7', border: '1px solid #f59e0b', marginRight: '5px' }}></div>
                  <span>Signature Fields ({fieldType === 'text' ? 'Text' : 'Button'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', background: '#e5e7eb', border: '1px solid #d1d5db', marginRight: '5px' }}></div>
                  <span>Other Fields (Unchanged)</span>
                </div>
              </div>
            </div>
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
            Continue to Draw Signature →
          </button>
        </div>
      )}

      {/* Step 2: Draw Signature */}
      {currentStep === 2 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 2: Draw Your Lawyer Signature</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Signature Canvas */}
            <div>
              <p style={{ color: '#6b7280', marginBottom: '15px' }}>
                Draw your signature (this will go in LawyerSignature1):
              </p>
              <div style={{ border: '2px dashed #693382', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={120}
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
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={clearSignature}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Company Signature Preview */}
            <div>
              <p style={{ color: '#6b7280', marginBottom: '15px' }}>
                Your company signature (automatically added):
              </p>
              <div style={{ border: '2px solid #059669', borderRadius: '8px', padding: '15px', textAlign: 'center', background: '#f0fdf4' }}>
                <div style={{
                  width: '300px',
                  height: '120px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontStyle: 'italic',
                  color: '#059669',
                  fontWeight: 'bold'
                }}>
                  🏢 Liz's Company Signature<br />
                  <span style={{ fontSize: '12px' }}>from liz-signature.png</span>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#059669' }}>
                  ✅ Guaranteed placement in LizsSignature field
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setCurrentStep(3)}
            disabled={!hasSignature}
            style={{
              marginTop: '25px',
              background: hasSignature ? '#693382' : '#d1d5db',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: hasSignature ? 'pointer' : 'not-allowed'
            }}
          >
            See Transformation Process →
          </button>
        </div>
      )}

      {/* Step 3: Transformation Process */}
      {currentStep === 3 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 3: Watch the Transformation</h3>
          
          {!showTransformation ? (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '25px' }}>
                Click below to see exactly what happens to your signature fields:
              </p>
              <button 
                onClick={simulateTransformation}
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
          ) : (
            <div>
              {/* Progress Bar */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${transformationProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #693382, #10b981)',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
                <p style={{ textAlign: 'center', marginTop: '10px', color: '#6b7280' }}>
                  {transformationProgress < 100 ? 'Processing...' : 'Complete!'}
                </p>
              </div>

              {/* Before and After */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div>
                  <h4 style={{ color: '#dc2626', marginBottom: '15px' }}>BEFORE: Original Fields</h4>
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '300px', 
                    background: 'white', 
                    border: '2px solid #fecaca', 
                    borderRadius: '8px'
                  }}>
                    {mockPDFFields.map(field => (
                      <PDFField key={`before-${field.name}`} field={field} />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#059669', marginBottom: '15px' }}>AFTER: Transformed Fields</h4>
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '300px', 
                    background: 'white', 
                    border: '2px solid #bbf7d0', 
                    borderRadius: '8px'
                  }}>
                    {mockPDFFields.map(field => (
                      <PDFField key={`after-${field.name}`} field={field} showTransformed={true} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Transformation Details */}
              {transformationProgress === 100 && (
                <div style={{ marginTop: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ color: '#059669', marginBottom: '10px' }}>✅ Transformation Complete!</h4>
                  <ul style={{ color: '#14532d', fontSize: '14px', lineHeight: '1.6' }}>
                    <li><strong>LizsSignature:</strong> {fieldType === 'text' ? 'Converted to button' : 'Already button'} + Company signature embedded</li>
                    <li><strong>LawyerSignature1:</strong> {fieldType === 'text' ? 'Converted to button' : 'Already button'} + Lawyer signature embedded</li>
                    <li><strong>LawyerSignature2:</strong> {fieldType === 'text' ? 'Converted to button' : 'Already button'} + Optional field</li>
                    <li><strong>Other fields:</strong> Completely unchanged (dates, text fields)</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Final Result */}
      {currentStep === 4 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step 4: Your Final Signed PDF</h3>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>✅</div>
            <h4 style={{ color: '#059669', marginBottom: '15px' }}>Perfect! Both Signatures Applied</h4>
          </div>

          {/* Final PDF Preview */}
          <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#059669' }}>Your Signed PDF Contains:</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Company Signature */}
              <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>
                  🏢 LizsSignature Field
                </div>
                <div style={{ 
                  background: '#dcfce7', 
                  border: '2px solid #059669', 
                  borderRadius: '4px', 
                  padding: '15px', 
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Your Company Signature<br />
                  <span style={{ fontSize: '12px' }}>from liz-signature.png</span>
                </div>
                <div style={{ fontSize: '12px', color: '#14532d', marginTop: '8px' }}>
                  ✅ Automatically embedded from central repository
                </div>
              </div>

              {/* Lawyer Signature */}
              <div style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>
                  ✏️ LawyerSignature1 Field
                </div>
                <div style={{ 
                  background: '#dcfce7', 
                  border: '2px solid #059669', 
                  borderRadius: '4px', 
                  padding: '15px', 
                  textAlign: 'center'
                }}>
                  {capturedSignature && (
                    <img src={capturedSignature} alt="Lawyer signature" style={{ maxWidth: '100%', height: 'auto' }} />
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#14532d', marginTop: '8px' }}>
                  ✅ Lawyer's canvas signature embedded
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
              <p style={{ color: '#059669', fontWeight: 'bold', margin: 0 }}>
                🎉 Both signatures are now permanently embedded in the PDF!
              </p>
              <p style={{ color: '#14532d', fontSize: '14px', margin: '5px 0 0 0' }}>
                The lawyer can download this fully signed document
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              setCurrentStep(1);
              setHasSignature(false);
              setCapturedSignature(null);
              setShowTransformation(false);
              setTransformationProgress(0);
              clearSignature();
            }}
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
            Try Different Field Type
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualPDFSignatureDemo;


VisualPDF Signature1.png
VisualPDF Signature2.png