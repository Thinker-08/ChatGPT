const express = require('express');
const router = express.Router();
const userController = require('./userController');

router.post('/verify-token', userController.verifyUser);

router.post('/signup', userController.signup);

router.post('/update-user', userController.updateUser);

router.post('/logout', userController.logout);

router.post('/login', userController.login);

module.exports = router;