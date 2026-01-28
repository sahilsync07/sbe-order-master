const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');
            // Check if useState is used
            if (content.includes('useState')) {
                // Check if it's imported from 'react'
                // Matches: import ... { ... useState ... } ... from 'react'
                // or import React, { useState } from 'react'
                const hasImport = /import\s+.*useState.*\s+from\s+['"]react['"]/.test(content);

                // Also exclude comments if possible, but for now simple check is fine
                if (!hasImport) {
                    // Check if it's a comment line or React.useState
                    const lines = content.split('\n');
                    let confirmedMissing = false;
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.includes('useState') && !line.startsWith('//') && !line.includes('React.useState') && !line.includes('import')) {
                            console.log(`Potential missing import in: ${filePath} at line ${i + 1}: ${line}`);
                        }
                    }
                }
            }
        }
    });
}

walk('src');
