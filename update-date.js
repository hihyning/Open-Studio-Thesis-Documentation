#!/usr/bin/env node

// Simple script to update the last updated date in HTML files
const fs = require('fs');
const path = require('path');

function updateDateInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Get current date in the same format
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Replace the date
        content = content.replace(
            /<span id="lastUpdated">.*?<\/span>/g,
            `<span id="lastUpdated">${formattedDate}</span>`
        );
        
        fs.writeFileSync(filePath, content);
        console.log(`Updated date in ${filePath}: ${formattedDate}`);
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
    }
}

// Update both HTML files
updateDateInFile('index.html');
updateDateInFile('images.html');
