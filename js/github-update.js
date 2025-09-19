// GitHub Last Commit Date Updater
// This script automatically updates the "Last Updated" date based on the most recent GitHub commit

// Configuration - Update these with your GitHub details
const GITHUB_USERNAME = 'hyninggan'; // Your GitHub username
const REPO_NAME = 'THESIS-'; // Your repository name

// Check if we're on localhost for testing
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

async function updateLastCommitDate() {
    try {
        // For local testing, use current date
        if (isLocalhost) {
            console.log('Running on localhost - using current date for testing');
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const elements = document.querySelectorAll('#lastUpdated');
            elements.forEach(element => {
                element.textContent = formattedDate + ' (Local Test)';
            });
            return;
        }

        // Production: Fetch from GitHub API
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/commits?per_page=1`);
        const commits = await response.json();
        
        if (commits && commits.length > 0) {
            const lastCommitDate = new Date(commits[0].commit.author.date);
            const formattedDate = lastCommitDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Update all elements with id 'lastUpdated'
            const elements = document.querySelectorAll('#lastUpdated');
            elements.forEach(element => {
                element.textContent = formattedDate;
            });
        } else {
            const elements = document.querySelectorAll('#lastUpdated');
            elements.forEach(element => {
                element.textContent = 'Unable to fetch';
            });
        }
    } catch (error) {
        console.error('Error fetching last commit date:', error);
        const elements = document.querySelectorAll('#lastUpdated');
        elements.forEach(element => {
            element.textContent = 'Unable to fetch';
        });
    }
}

// Update the date when the page loads
document.addEventListener('DOMContentLoaded', updateLastCommitDate);
