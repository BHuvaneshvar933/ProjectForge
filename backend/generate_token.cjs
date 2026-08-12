require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: "64fa3b3e2a1c90001f3e7a5c" }, 
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
console.log(token);
