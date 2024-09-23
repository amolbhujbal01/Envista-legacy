const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');

dotenv.config();

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache for 1 hour

const getPems = async () => {
  let pems = cache.get('pems');
  if (pems) return pems;

  const url = `https://cognito-idp.${process.env.AWS_COGNITO_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const response = await axios.get(url);
  pems = {};
  response.data.keys.forEach(key => {
    pems[key.kid] = jwkToPem(key);
  });
  cache.set('pems', pems);
  return pems;
};

const verifyToken = async (token) => {
  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      throw new Error('Not a valid JWT token');
    }

    const pems = await getPems();
    const pem = pems[decodedToken.header.kid];
    if (!pem) {
      throw new Error('Invalid token');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

const cognitoMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await verifyToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = cognitoMiddleware;