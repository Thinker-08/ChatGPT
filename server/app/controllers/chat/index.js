const express = require('express');
const router = express.Router();
const chatController = require('./chatController');

router.get('/openAiChat', chatController.openAiChat);

module.exports = router;