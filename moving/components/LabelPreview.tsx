import React from 'react';
import { Box } from '../App';
import { PrintableLabel } from './PrintableLabel';

interface LabelPreviewProps {
  box: Box;
  colors: Array<{ name: string; value: string; bg: string }>;
}

export function LabelPreview({ box, colors }: LabelPreviewProps) {
  const colorName = colors.find(c => c.value === box.color)?.name || 'Blue';

  return (
    <div className="w-full max-w-md mx-auto bg-gray-50 p-4 rounded-lg">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Preview header */}
        <div className="bg-gray-100 px-4 py-2 text-center">
          <span className="text-sm font-medium text-gray-600">Label Preview</span>
          <span className="text-xs text-gray-500 ml-2">(4" × 5.25")</span>
        </div>
        
        {/* Label container */}
        <div className="p-4">
          <PrintableLabel box={box} isPreview={true} />
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700 text-center mb-2">
            <strong>How to use:</strong> Print labels 4 per page, cut along edges, 
            then fold along the dotted line to wrap around your box edge.
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>• Top half: QR code side for scanning</span>
              <span>• Bottom half: Box number side for writing</span>
            </div>
            <div className="text-center">
              <span>• Printed labels show room name only - box names stay in digital system</span>
            </div>
            <div className="text-center">
              <span>• Write box numbers by hand, then update digital records to match</span>
            </div>
            <div className="text-center">
              <span>• Each page prints 4 labels (2×2 grid) for efficient use of paper</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}