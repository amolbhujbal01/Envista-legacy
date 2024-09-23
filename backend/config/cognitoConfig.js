const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
let cognitoAttributeList = [];

const poolData = { 
    UserPoolId : process.env.AWS_COGNITO_USER_POOL_ID,
    ClientId : process.env.AWS_COGNITO_CLIENT_ID
};

const attributes = (key, value) => { 
  return {
    Name : key,
    Value : value
  }
};

function setCognitoAttributeList(email, name, agent) {
  let attributeList = [];
  attributeList.push(attributes('email', email));
  attributeList.push(attributes('name', name));
  attributeList.forEach(element => {
    cognitoAttributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(element));
  });
}

function getCognitoAttributeList() {
  return cognitoAttributeList;
}

function getCognitoUser(email) {
  const userData = {
    Username: email,
    Pool: getUserPool()
  };
  return new AmazonCognitoIdentity.CognitoUser(userData);
}

function getUserPool(){
  return new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

function getAuthDetails(email, password) {
  var authenticationData = {
    Username: email,
    Password: password,
   };
  return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
}

function initAWS (region = process.env.AWS_COGNITO_REGION, identityPoolId = process.env.AWS_COGNITO_IDENTITY_POOL_ID) {
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
  });
}

function decodeJWTToken(token) {
  try {
    // Decode the JWT token
    const decodedToken = jwt.decode(token.idToken);
    if (!decodedToken) {
      throw new Error('Failed to decode token');
    }
    // Extract relevant fields from the decoded token
    const { email, exp, auth_time, token_use, sub } = decodedToken;
    return { token, email, exp, uid: sub, auth_time, token_use };
  } catch (error) {
    console.error("Error decoding JWT token", error);
    throw error;
  }
}

module.exports = {
  initAWS,
  getCognitoAttributeList,
  getUserPool,
  getCognitoUser,
  setCognitoAttributeList,
  getAuthDetails,
  decodeJWTToken,
}
