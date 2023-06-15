const Router = require('express').Router;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { getDb } = require('../db');

const router = Router();

const createToken = () => {
  return jwt.sign({}, 'secret', { expiresIn: '1h' });
};

router.post('/login', (req, res, next) => {
  const email = req.body.email;
  const pw = req.body.password;
  // Check if user login is valid
  getDb()
    .db()
    .collection('users')
    .findOne({email: email})
    .then(userData => {
      if (!userData) {
        throw new Error('Not Found User');
      }

      return bcrypt.compare(pw, userData.password);
    })
    .then(result => {
      // If yes, create token and return it to client
      const token = createToken();
      if (!result) {
        throw new Error('Invalid User/Pass');
      }

      return res.status(200).json({ token: token, user: { email: email } });
    })
    .catch(err => {
      return res.status(401)
        .json({
          message: 'Authentication failed, invalid username or password.'
        });
    });
});

router.post('/signup', (req, res, next) => {
  const email = req.body.email;
  const pw = req.body.password;
  // Hash password before storing it in database => Encryption at Rest
  bcrypt
    .hash(pw, 12)
    .then(hashedPW => {

      // Store hashedPW in database
      getDb()
        .db()
        .collection('users')
        .insertOne({
          email: email,
          password: hashedPW
        })
        .then(result => {
          const token = createToken();
          return res.status(201)
            .json({ token: token, user: { email: email } });
        }).catch(err => {
          res.status(500).json({ message: 'Creating the user failed.' });
        });

    }).catch(err => {
      console.log(err);
      res.status(500).json({ message: 'Creating the user failed.' });
    });
  // Add user to database
});

module.exports = router;
