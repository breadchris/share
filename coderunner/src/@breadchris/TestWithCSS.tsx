import React from 'react';
import './TestWithCSS.css';

export default function TestWithCSS() {
  return (
    <div className="test-container">
      <h1 className="test-title">Test Component with CSS</h1>
      <p className="test-description">
        This component imports CSS to test the fullrender endpoint.
      </p>
      <div className="test-grid">
        <div className="test-card">Card 1</div>
        <div className="test-card">Card 2</div>
        <div className="test-card">Card 3</div>
      </div>
    </div>
  );
}