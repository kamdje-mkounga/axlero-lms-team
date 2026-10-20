const UserModel = require('../models/UserModel');
const User = require('../../../../domain/entities/User');
const IUserRepository = require('../../../../application/repositories/IUserRepository');

class UserRepository extends IUserRepository {
  toEntity(document) {
    if (!document) return null;

    const user = document.toObject
      ? document.toObject()
      : document;

    return new User({
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async create(userData) {
    const user = await UserModel.create({
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role || 'student',
      isActive: userData.isActive ?? true,
    });

    return this.toEntity(user);
  }

  async findById(id) {
    const user = await UserModel.findById(id);
    return this.toEntity(user);
  }

  async findByEmail(email) {
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash');

    return this.toEntity(user);
  }

  async update(id, updates) {
    const allowedFields = ['name', 'email', 'role', 'isActive'];
    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      safeUpdates,
      {
        new: true,
        runValidators: true,
      }
    );

    return this.toEntity(user);
  }

  async delete(id) {
    const user = await UserModel.findByIdAndDelete(id);
    return Boolean(user);
  }
}

module.exports = UserRepository;