const authMiddleware = (req, res, next) => {
    // Middleware temporaire (laisse passer pour le test)
    next();
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // Middleware temporaire de vérification des rôles
        next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRoles,
};