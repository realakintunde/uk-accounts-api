const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
  try {
    console.log('[AUTH] Registration request received:', { email: req.body.email });
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password) {
      console.log('[AUTH] Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    console.log('[AUTH] Checking if user exists:', email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('[AUTH] User already exists:', email);
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    console.log('[AUTH] Creating new user:', email);
    const newUser = await User.create({
      email,
      password,
      first_name,
      last_name,
    });
    console.log('[AUTH] User created successfully:', { id: newUser.id, email: newUser.email });

    // Generate JWT token for immediate login after registration
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    console.log('[AUTH] Registration successful:', email);
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
        },
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error.message, error.stack);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log('[AUTH] Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[AUTH] Missing email or password for login');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    console.log('[AUTH] Finding user:', email);
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('[AUTH] User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    console.log('[AUTH] Verifying password for user:', email);
    const isPasswordValid = await User.verifyPassword(user, password);
    if (!isPasswordValid) {
      console.log('[AUTH] Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    console.log('[AUTH] Password verified, generating token for:', email);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    console.log('[AUTH] Login successful:', email);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
        token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { first_name, last_name } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;

    // For now, update in memory (in production, would call User.update)
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
