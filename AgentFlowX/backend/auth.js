const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "please_change_this_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/* ============================
   REGISTER
============================ */
async function register(req, res) {
  try {
    
    console.log("REGISTER BODY:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "name_email_password_required",
      });
    }

    const emailLower = email.trim().toLowerCase();

    const existing = await query(
      "SELECT id FROM users WHERE email_normalized = $1",
      [emailLower]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        ok: false,
        error: "user_exists",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, email_normalized, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email,
                 preferred_reminder_delay,
                 preferred_email_tone,
                 preferred_invoice_format`,
      [name, email, emailLower, password_hash]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ ok: true, user, token });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}


/* ============================
   LOGIN
============================ */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email_password_required" });
    }

    const emailLower = email.trim().toLowerCase();

    const result = await query(
      "SELECT * FROM users WHERE email_normalized=$1",
      [emailLower]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ ok: false, error: "invalid_credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) {
      return res.status(401).json({ ok: false, error: "invalid_credentials" });
    }

    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      preferred_reminder_delay: user.preferred_reminder_delay,
      preferred_email_tone: user.preferred_email_tone,
      preferred_invoice_format: user.preferred_invoice_format,
    };

    res.json({ ok: true, user: safeUser, token });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

/* ============================
   AUTH MIDDLEWARE
============================ */
function verifyToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "no_token" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "invalid_token" });
  }
}

module.exports = { register, login, verifyToken };
