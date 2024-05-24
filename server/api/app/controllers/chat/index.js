const express = require('express');
const router = express.Router();
const authHandler = require('../../middlewares/authHandler');
const chatController = require('./chatController');

router.post('/newChat', authHandler, chatController.newChat);

router.get('/openAiChat', chatController.openAiChat);

router.post('/init', authHandler, chatController.init);

router.post('/fetchChatHistory', authHandler, chatController.fetchChatHistory);

router.post('/deleteChat', authHandler, chatController.deleteChat);

router.post('/fetchChats',authHandler, chatController.fetchChats);

router.post('/deleteAllChats', authHandler, chatController.deleteAllChats);
module.exports = router;