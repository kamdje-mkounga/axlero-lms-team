const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./interfaces/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routes from the team will be added here, for example:
// app.use('/api/auth', authRoutes);
// app.use('/api/courses', courseRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;