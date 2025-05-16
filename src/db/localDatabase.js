const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'localDatabase.json');

function saveSession(sessionData) {
    let sessions = [];
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath);
        sessions = JSON.parse(data);
    }
    sessions.push(sessionData);
    fs.writeFileSync(dbPath, JSON.stringify(sessions, null, 2));
}

function retrieveSession(userId) {
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath);
        const sessions = JSON.parse(data);
        return sessions.find(session => session.userId === userId) || null;
    }
    return null;
}

module.exports = {
    saveSession,
    retrieveSession
};