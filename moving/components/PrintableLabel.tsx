import React from 'react';
import { Box } from '../App';

interface PrintableLabelProps {
  box: Box;
  isPreview?: boolean;
  className?: string;
}

export function PrintableLabel({ box, isPreview = false, className = '' }: PrintableLabelProps) {
  const generateQRCodeURL = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(text)}`;
  };

  const labelStyles = {
    width: isPreview ? '100%' : '4in',
    height: isPreview ? '100%' : '5.25in',
    aspectRatio: isPreview ? '4/5.25' : undefined,
  };

  return (
    <div 
      className={`relative bg-white border border-gray-400 flex flex-col ${className}`}
      style={labelStyles}
    >
      {/* Top half - readable from one side */}
      <div 
        className="relative flex flex-col justify-between text-center"
        style={{ 
          height: '50%', 
          background: box.color,
          border: `3px solid ${box.color}`,
          borderBottom: `1.5px solid ${box.color}`,
          padding: isPreview ? '12px' : '16px',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div 
            className="font-bold text-white leading-tight uppercase tracking-wide"
            style={{ 
              fontSize: isPreview ? '18px' : '24px',
              marginBottom: isPreview ? '6px' : '8px'
            }}
          >
            {box.room}
          </div>
        </div>
        
        <div 
          className="bg-white flex items-center justify-center mx-auto rounded"
          style={{ 
            width: isPreview ? '48px' : '70px',
            height: isPreview ? '48px' : '70px',
            padding: '4px',
            margin: isPreview ? '6px auto' : '8px auto'
          }}
        >
          {!isPreview ? (
            <img 
              src={generateQRCodeURL(box.qrCode)} 
              alt="QR Code" 
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div style="
                      width: 100%; 
                      height: 100%; 
                      border: 2px dashed rgba(255, 255, 255, 0.7); 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      font-size: 10px; 
                      color: rgba(255, 255, 255, 0.9); 
                      font-weight: 600;
                      background: rgba(255, 255, 255, 0.1);
                    ">QR<br/>CODE</div>
                  `;
                }
              }}
            />
          ) : (
            <div 
              className="w-full h-full border-2 border-dashed flex items-center justify-center text-xs text-white/90 leading-tight font-semibold"
              style={{ 
                borderColor: 'rgba(255, 255, 255, 0.7)',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              QR<br/>CODE
            </div>
          )}
        </div>
        
        <div 
          className="text-white/70 font-mono font-semibold"
          style={{ fontSize: isPreview ? '8px' : '10px' }}
        >
          ID: {box.id.slice(-6)}
        </div>
      </div>
      
      {/* Fold line */}
      <div 
        className="absolute left-0 right-0 z-10"
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)',
          height: '2px',
          backgroundImage: 'repeating-linear-gradient(90deg, #4b5563 0, #4b5563 6px, transparent 6px, transparent 12px)'
        }}
      />
      
      {/* Bottom half - rotated 180°, box number only */}
      <div 
        className="relative flex flex-col justify-center text-left transform rotate-180"
        style={{ 
          height: '50%', 
          background: box.color,
          border: `3px solid ${box.color}`,
          borderTop: `1.5px solid ${box.color}`,
          padding: isPreview ? '12px' : '16px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ marginBottom: isPreview ? '8px' : '12px' }}>
          <div 
            className="font-bold text-white leading-tight uppercase tracking-wide"
            style={{ 
              fontSize: isPreview ? '18px' : '24px',
              marginBottom: isPreview ? '6px' : '8px'
            }}
          >
            {box.room}
          </div>
        </div>
        
        <div 
          className="bg-white/20 border-2 border-dashed border-white/50 rounded"
          style={{ 
            padding: isPreview ? '8px 12px' : '12px 16px',
            marginRight: isPreview ? '24px' : '32px'
          }}
        >
          <div 
            className="text-white/80 font-semibold uppercase tracking-wide"
            style={{ 
              fontSize: isPreview ? '10px' : '12px',
              marginBottom: isPreview ? '4px' : '6px'
            }}
          >
            Box #
          </div>
          <div 
            className="border-b-2 border-white/50"
            style={{ height: isPreview ? '16px' : '24px' }}
          />
        </div>
        
        <div 
          className="text-white/70 font-mono font-semibold"
          style={{ 
            fontSize: isPreview ? '8px' : '10px',
            marginTop: isPreview ? '8px' : '12px'
          }}
        >
          ID: {box.id.slice(-6)}
        </div>
      </div>
    </div>
  );
}