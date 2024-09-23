const Cognito = require('../services/authService');

async function SignUp(req, res) {
    const result = await Cognito.signUp(req.body.email, req.body.password, req.body.name);
    res.status(result.statusCode).json(result.response);
}

async function Verify(req, res) {
    const result = await Cognito.verify(req.body.email, req.body.codeEmailVerify, req.body.password);
    res.status(result.statusCode).json(result.response);
}

async function SignIn(req, res) {
    const result = await Cognito.signIn(req.body.email, req.body.password);
    res.status(result.statusCode).json(result.response);
}

module.exports = {
    SignIn, Verify, SignUp
}
