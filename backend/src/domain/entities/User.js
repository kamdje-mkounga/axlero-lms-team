class User {
  constructor({
    id = null,
    name,
    email,
    passwordHash = null,
    role = 'student',
    isActive = true,
    createdAt = null,
    updatedAt = null,
  }) {
    if (!name || !name.trim()) {
      throw new Error('User name is required');
    }

    if (!email || !email.trim()) {
      throw new Error('User email is required');
    }

    if (!passwordHash) {
      throw new Error('Password hash is required');
    }

    const normalizedRole = role.toLowerCase();

    if (!['student', 'instructor', 'admin'].includes(normalizedRole)) {
      throw new Error('Invalid user role');
    }

    this.id = id;
    this.name = name.trim();
    this.email = email.trim().toLowerCase();
    this.passwordHash = passwordHash;
    this.role = normalizedRole;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isInstructor() {
    return this.role === 'instructor';
  }

  isStudent() {
    return this.role === 'student';
  }

  isAdmin() {
    return this.role === 'admin';
  }
}

module.exports = User;