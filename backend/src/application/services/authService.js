
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');
const UserRepository = require('../../infrastructure/database/mongoose/repositories/UserRepository');

const userRepository = new UserRepository();

class AuthService {
  async register({ name, email, password }) {
    if (!name?.trim() || !email?.trim() || !password) {
      const error = new Error('Name, email, and password are required');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      isActive: true,
    });

    return this.createAuthResponse(user);
  }

  async login({ email, password }) {
    if (!email?.trim() || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findByEmail(
      email.trim().toLowerCase()
    );

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.isActive === false) {
      const error = new Error('This account is inactive');
      error.statusCode = 403;
      throw error;
    }

    return this.createAuthResponse(user);
  }

  createAuthResponse(user) {
    const token = jwt.sign(
      {
        sub: String(user.id),
        role: user.role,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      }
    );

    return {
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

module.exports = AuthService;
