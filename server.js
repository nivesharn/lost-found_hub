const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ===================== DATABASE CONNECTION =====================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'lost_found',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ===================== JWT & GOOGLE CLIENT =====================
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

// ===================== SIGNUP =====================
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, 'user']
        );

        const token = generateToken(result.insertId);

        res.json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                user_id: result.insertId,
                username,
                email,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===================== LOGIN (ADMIN + USER) =====================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Admin login
        if (email === "admin@gmail.com" && password === "Admin@12") {
            const token = generateToken("admin");
            return res.json({
                success: true,
                role: "admin",
                token,
                message: "Admin login successful",
                user: {
                    user_id: "admin",
                    username: "Administrator",
                    email: "admin@gmail.com",
                    role: "admin"
                }
            });
        }

        // User login
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user.user_id);

        res.json({
            success: true,
            role: user.role,
            token,
            message: "User login successful",
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===================== GOOGLE AUTH =====================
app.post('/api/google-auth', async (req, res) => {
    try {
        const { id_token } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if Google user already exists
        const [existingGoogleUser] = await pool.query(
            'SELECT * FROM google_users WHERE google_id = ?',
            [googleId]
        );

        if (existingGoogleUser.length > 0) {
            const token = generateToken(existingGoogleUser[0].google_user_id);
            return res.json({
                success: true,
                message: 'Google login successful',
                token,
                user: {
                    user_id: existingGoogleUser[0].google_user_id,
                    email: existingGoogleUser[0].email,
                    name: existingGoogleUser[0].name,
                    picture: existingGoogleUser[0].picture,
                    role: 'user'
                }
            });
        }

        // Check if email already exists in regular users
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered with regular account'
            });
        }

        // Create new Google user
        const [result] = await pool.query(
            'INSERT INTO google_users (google_id, email, name, picture) VALUES (?, ?, ?, ?)',
            [googleId, email, name, picture]
        );

        const token = generateToken(result.insertId);

        res.json({
            success: true,
            message: 'Google account created successfully',
            token,
            user: {
                user_id: result.insertId,
                email,
                name,
                picture,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===================== AUTH MIDDLEWARE =====================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// ===================== PROFILE ROUTE =====================
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.id === "admin") {
            return res.json({
                success: true,
                user: {
                    user_id: "admin",
                    username: "Administrator",
                    email: "admin@gmail.com",
                    role: "admin"
                }
            });
        }

        const [users] = await pool.query(
            'SELECT user_id, username, email, role FROM users WHERE user_id = ?',
            [req.user.id]
        );

        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, user: users[0] });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
