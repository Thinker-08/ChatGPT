const express = require('express');
const router = express.Router();
const authHandler = require('../../middlewares/authHandler');

const userController = require('./userController');

router.post('/verify-token', userController.verifyUser);

router.post('/signup', userController.signup);

router.post('/update-user', authHandler, userController.updateUser);

router.post('/logout', authHandler, userController.logout);

router.post('/login', userController.login);

router.post('/toggleDarkMode', authHandler, userController.toggleDarkMode);
module.exports = router;