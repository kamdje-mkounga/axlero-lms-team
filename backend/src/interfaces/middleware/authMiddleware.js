const jwt = require('jsonwebtoken');
const env = require('../../config/env');

const authMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token is required',
        });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token is required',
        });
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);

        req.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token',
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication is required',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
        }

        return next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRoles,
};
