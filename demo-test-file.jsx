// Demo React Component voor Claude Code + Obsidian Test
// Dit bestand demonstreert de automatische documentatie sync

import React, { useState } from 'react';

/**
 * DemoComponent - Test component voor automatische documentatie
 * @returns {JSX.Element} Demo component
 */
const DemoComponent = () => {
  const [message, setMessage] = useState('Hello CodeStation!');
  const [testStatus, setTestStatus] = useState('pending');

  const handleClick = () => {
    setMessage('Obsidian sync getest! 🎉');
  };

  return (
    <div className="demo-container">
      <h2>CodeStation Demo</h2>
      <p>{message}</p>
      <button onClick={handleClick}>Test Obsidian Integration</button>
    </div>
  );
};

export default DemoComponent;
