const { SimpleUser } = require('../mongo.js');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt-nodejs");
const SALT_WORK_FACTOR = 10;
const JWT_SECRET = "somesecretfordeluge";

const userController = {

  login: (req, res) => {    
    SimpleUser.find({ name: req.body.username }, (err, resMongo) => {
        if (err) res.send(err);
        if ( resMongo.length < 1 ) return res.status(500).send({ error: 'username or password incorrect' });
        else {
          const userData = resMongo[0];
          bcrypt.compare(req.body.password, userData.password, function(err, valid) {
            if (!valid) {
              return res.status(404).json({
                error: true,
                message: "message"
              });
            } else {
              const token = generateToken(userData);
              res.cookie('usertoken',token, { maxAge: 900000, httpOnly: true });
              res.status(200).send("Successful Login");
            }
          });
        } 
      });
  },

  signup: (req, res) => {
    SimpleUser.find({ name: req.body.username }, (err, resMongo) => {
        if (resMongo.length) {
          res.send({ error: 'user exists' });
        } else {
          const body = req.body;
          const hash = bcrypt.hashSync(
            body.password.trim(),
            bcrypt.genSaltSync(SALT_WORK_FACTOR)
          );
          SimpleUser.create(
            { name: body.username, password: hash },
            (err, resMongo) => {
              const token = generateToken(resMongo);
              res.cookie('usertoken',token, { maxAge: 900000, httpOnly: true });
              res.status(200).send("Successful User Creation");
            }
          );
        }
      });
  },

  getusers: (req, res) => {
    SimpleUser.find({}, (err, resMongo) => {
        res.json(resMongo);
    });
  },

  logout: (req, res) => {
    res.clearCookie('usertoken', { maxAge: 900000, httpOnly: true });
    res.send("User Logged Out");
  },

  checkUserAuth: (req, res, next) => {
    const token = req.cookies.usertoken;
    if (!token) return res.status(403).send("No user token provided.");
    jwt.verify(token, JWT_SECRET, function(err, user) {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Please register Log in using a valid email to submit posts"
        });
      } else {
        req.user = user; 
        next();
      }
    });
  },

}

module.exports = userController;

function generateToken(user) {
    const u = {
      _id: user._id,
      name: user.name,
      password: user.password,
    };
    return (token = jwt.sign(u, JWT_SECRET, {
      expiresIn: 60 * 60 * 24 // expires in 24 hours
    }));
  }
