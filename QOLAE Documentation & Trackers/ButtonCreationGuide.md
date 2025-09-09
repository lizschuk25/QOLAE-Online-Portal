import React, { useState } from 'react';

const AdobeButtonFieldGuide = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedField, setSelectedField] = useState('LizsSignature');

  const buttonFields = {
    'LizsSignature': {
      name: 'LizsSignature',
      purpose: 'Your company signature placement',
      size: 'Width: 200px, Height: 60px',
      appearance: 'No border, transparent background',
      icon: '🏢',
      color: '#059669'
    },
    'LawyerSignature1': {
      name: 'LawyerSignature1', 
      purpose: 'Primary lawyer signature',
      size: 'Width: 200px, Height: 60px',
      appearance: 'No border, transparent background',
      icon: '✏️',
      color: '#2563eb'
    },
    'LawyerSignature2': {
      name: 'LawyerSignature2',
      purpose: 'Optional second lawyer signature',
      size: 'Width: 200px, Height: 60px', 
      appearance: 'No border, transparent background',
      icon: '📝',
      color: '#7c3aed'
    }
  };

  const steps = [
    {
      step: 1,
      title: 'Open Your Template in Adobe Acrobat',
      content: 'Open your existing TemplateTOB.pdf in Adobe Acrobat Pro',
      action: 'File → Open → TemplateTOB.pdf'
    },
    {
      step: 2,
      title: 'Enter Form Edit Mode',
      content: 'Access the form editing tools',
      action: 'Tools → Prepare Form (or right-click existing field → Edit)'
    },
    {
      step: 3,
      title: 'Delete Old Text Fields',
      content: 'Remove your current signature text fields',
      action: 'Select LizsSignature, LawyerSignature1, LawyerSignature2 → Delete'
    },
    {
      step: 4,
      title: 'Create Button Fields',
      content: 'Add new button fields in the exact same positions',
      action: 'Select Button tool → Draw rectangles where old fields were'
    },
    {
      step: 5,
      title: 'Configure Button Properties',
      content: 'Set proper names and appearance for each button',
      action: 'Double-click each button → Set name and properties'
    },
    {
      step: 6,
      title: 'Save Template',
      content: 'Save your updated template with button fields',
      action: 'File → Save As → TemplateTOB_WithButtons.pdf'
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #693382, #8b5a9f)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Adobe Acrobat Button Field Creation Guide</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Create button fields in your PDF template for signature embedding</p>
      </div>

      {/* Step by Step Process */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
        <h3 style={{ color: '#693382', marginBottom: '20px' }}>Step-by-Step Process</h3>
        
        <div style={{ display: 'flex', marginBottom: '30px' }}>
          {steps.map((item) => (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              style={{
                flex: 1,
                padding: '10px 15px',
                border: currentStep === item.step ? '2px solid #693382' : '1px solid #e5e7eb',
                borderRadius: '8px',
                background: currentStep === item.step ? '#f8f5ff' : 'white',
                cursor: 'pointer',
                margin: '0 5px',
                fontSize: '12px',
                fontWeight: currentStep === item.step ? 'bold' : 'normal',
                color: currentStep === item.step ? '#693382' : '#6b7280'
              }}
            >
              Step {item.step}
            </button>
          ))}
        </div>

        <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
          <h4 style={{ color: '#693382', marginBottom: '15px' }}>
            Step {currentStep}: {steps[currentStep - 1].title}
          </h4>
          <p style={{ color: '#4b5563', marginBottom: '15px', fontSize: '16px' }}>
            {steps[currentStep - 1].content}
          </p>
          <div style={{ 
            background: '#693382', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '6px', 
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            📋 Action: {steps[currentStep - 1].action}
          </div>
        </div>
      </div>

      {/* Button Field Specifications */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
        <h3 style={{ color: '#693382', marginBottom: '20px' }}>Button Field Specifications</h3>
        
        {/* Field Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {Object.keys(buttonFields).map(fieldName => (
            <button
              key={fieldName}
              onClick={() => setSelectedField(fieldName)}
              style={{
                padding: '8px 16px',
                border: selectedField === fieldName ? `2px solid ${buttonFields[fieldName].color}` : '1px solid #e5e7eb',
                borderRadius: '20px',
                background: selectedField === fieldName ? `${buttonFields[fieldName].color}15` : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: selectedField === fieldName ? 'bold' : 'normal',
                color: selectedField === fieldName ? buttonFields[fieldName].color : '#6b7280'
              }}
            >
              {buttonFields[fieldName].icon} {fieldName}
            </button>
          ))}
        </div>

        {/* Field Details */}
        <div style={{ 
          border: `2px solid ${buttonFields[selectedField].color}`, 
          borderRadius: '12px', 
          padding: '20px',
          background: `${buttonFields[selectedField].color}08`
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: buttonFields[selectedField].color, marginBottom: '15px' }}>
                {buttonFields[selectedField].icon} {buttonFields[selectedField].name}
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Purpose:</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{buttonFields[selectedField].purpose}</div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Recommended Size:</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{buttonFields[selectedField].size}</div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>Appearance:</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{buttonFields[selectedField].appearance}</div>
              </div>
            </div>
            
            <div>
              <h5 style={{ color: '#374151', marginBottom: '10px' }}>Adobe Acrobat Properties:</h5>
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px' }}>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6' }}>
                  <div><strong>Name:</strong> {buttonFields[selectedField].name}</div>
                  <div><strong>Type:</strong> Button</div>
                  <div><strong>Border:</strong> None (0px)</div>
                  <div><strong>Fill Color:</strong> Transparent</div>
                  <div><strong>Caption:</strong> (Leave empty)</div>
                  <div><strong>Icon:</strong> None initially</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Adobe Interface Mock */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
        <h3 style={{ color: '#693382', marginBottom: '20px' }}>Adobe Acrobat Interface Preview</h3>
        
        <div style={{ 
          border: '2px solid #d1d5db', 
          borderRadius: '8px', 
          background: '#f8f9fa',
          padding: '20px',
          position: 'relative'
        }}>
          {/* Mock Adobe Toolbar */}
          <div style={{ 
            background: '#374151', 
            color: 'white', 
            padding: '8px 15px', 
            borderRadius: '6px 6px 0 0',
            marginBottom: '15px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Adobe Acrobat - Prepare Form Tools
          </div>

          {/* Mock PDF Page */}
          <div style={{ 
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            width: '100%',
            height: '400px',
            position: 'relative',
            margin: '0 auto'
          }}>
            {/* Mock existing text fields (to be deleted) */}
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '50px',
              width: '120px',
              height: '20px',
              border: '1px dashed #dc2626',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#dc2626',
              fontWeight: 'bold'
            }}>
              OLD TEXT FIELD
            </div>

            {/* Mock button fields (to be created) */}
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '120px',
              width: '180px',
              height: '50px',
              border: '2px solid #059669',
              background: '#f0fdf4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#059669',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}>
              🏢 LizsSignature
              <span style={{ fontSize: '9px', opacity: 0.8 }}>BUTTON FIELD</span>
            </div>

            <div style={{
              position: 'absolute',
              left: '250px',
              top: '120px',
              width: '180px',
              height: '50px',
              border: '2px solid #2563eb',
              background: '#eff6ff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#2563eb',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}>
              ✏️ LawyerSignature1
              <span style={{ fontSize: '9px', opacity: 0.8 }}>BUTTON FIELD</span>
            </div>

            <div style={{
              position: 'absolute',
              left: '450px',
              top: '120px',
              width: '180px',
              height: '50px',
              border: '2px solid #7c3aed',
              background: '#f5f3ff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#7c3aed',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}>
              📝 LawyerSignature2
              <span style={{ fontSize: '9px', opacity: 0.8 }}>BUTTON FIELD</span>
            </div>

            {/* Mock other fields (unchanged) */}
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '250px',
              width: '140px',
              height: '20px',
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#6b7280'
            }}>
              CurrentDate (Text)
            </div>

            <div style={{
              position: 'absolute',
              left: '210px',
              top: '250px',
              width: '100px',
              height: '20px',
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#6b7280'
            }}>
              SignatureDate1
            </div>
          </div>

          {/* Instructions overlay */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            maxWidth: '200px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '5px' }}>🎯 To Do:</div>
            <div style={{ color: '#92400e', fontSize: '11px' }}>
              1. Delete red dashed text fields<br/>
              2. Create button fields in same positions<br/>
              3. Name them exactly as shown
            </div>
          </div>
        </div>
      </div>

      {/* Button Properties Dialog Mock */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
        <h3 style={{ color: '#693382', marginBottom: '20px' }}>Button Properties Dialog</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Mock Properties Panel */}
          <div style={{ border: '2px solid #374151', borderRadius: '8px', padding: '15px', background: '#f8f9fa' }}>
            <div style={{ background: '#374151', color: 'white', padding: '8px', margin: '-15px -15px 15px -15px', fontSize: '14px', fontWeight: 'bold' }}>
              Button Properties - {selectedField}
            </div>
            
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Name:</strong> 
                <input 
                  type="text" 
                  value={selectedField}
                  readOnly
                  style={{ 
                    marginLeft: '10px', 
                    padding: '4px 8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px',
                    background: '#f9fafb'
                  }} 
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Type:</strong> 
                <select style={{ marginLeft: '10px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  <option>Button</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Border:</strong> 
                <select style={{ marginLeft: '10px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  <option>No Border</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Fill:</strong> 
                <select style={{ marginLeft: '10px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  <option>No Fill</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Caption:</strong> 
                <input 
                  type="text" 
                  placeholder="(Leave empty)"
                  style={{ 
                    marginLeft: '10px', 
                    padding: '4px 8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 style={{ color: '#059669', marginBottom: '15px' }}>✅ Key Settings:</h4>
            <ul style={{ fontSize: '14px', color: '#14532d', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li><strong>Name must be EXACT:</strong> {selectedField}</li>
              <li><strong>Type:</strong> Button (not Text Field)</li>
              <li><strong>Border:</strong> None or invisible</li>
              <li><strong>Fill:</strong> Transparent/None</li>
              <li><strong>Caption:</strong> Leave empty (image will fill it)</li>
              <li><strong>Size:</strong> Large enough for signature (~200x60px)</li>
            </ul>
            
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px', marginTop: '20px' }}>
              <h5 style={{ color: '#059669', marginBottom: '10px' }}>💡 Pro Tip:</h5>
              <p style={{ color: '#14532d', fontSize: '14px', margin: 0 }}>
                The button will be invisible until your code adds the signature image. 
                This is perfect - it creates a "placeholder" that your transformation 
                code can fill with the actual signature images.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Impact on Existing Data */}
      <div style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>🛡️ Impact on Your Existing LawyersTrackingDatabase:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h5 style={{ color: '#059669', marginBottom: '10px' }}>✅ SAFE - No Changes Needed:</h5>
            <ul style={{ fontSize: '14px', color: '#14532d', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>All existing lawyer records</li>
              <li>Completed workflow statuses</li>
              <li>PINs and assignments</li>
              <li>Payment records</li>
              <li>Historical data</li>
            </ul>
          </div>
          
          <div>
            <h5 style={{ color: '#2563eb', marginBottom: '10px' }}>🔄 ONLY CHANGES:</h5>
            <ul style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>PDF template file structure</li>
              <li>How signatures get embedded</li>
              <li>Field types in the template</li>
              <li>Nothing in your database!</li>
            </ul>
          </div>
        </div>
        
        <div style={{ background: 'white', border: '1px solid #0ea5e9', borderRadius: '8px', padding: '15px', marginTop: '15px' }}>
          <p style={{ color: '#0c4a6e', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>
            🎯 Bottom Line: Your LawyersTrackingDatabase stays exactly as it is. 
            You're only updating the PDF template that gets used for new signings!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdobeButtonFieldGuide;


createButton Step1.png
createButton Step2.png
createButton Step3.png
createButton Step4.png
createButton Step5.png
createButton Step6.png
createButton workflow1.png
createButton workflow2.png




