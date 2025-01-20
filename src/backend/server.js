const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const app = express();
const port = 3000;
// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', apiRoutes);

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
