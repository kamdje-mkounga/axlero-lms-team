const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./interfaces/middleware/errorHandler');

// Correction du chemin d'accès vers les routes dans interfaces/routes/
const authRoutes = require('./interfaces/routes/authRoutes');
const courseRoutes = require('./interfaces/routes/courseRoutes');
const enrollmentRoutes = require('./interfaces/routes/enrollmentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Activation des routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;