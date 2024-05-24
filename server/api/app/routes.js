const routes = (app) => {
    app.use('/user', require('./controllers/user'));
    app.use('/chat', require('./controllers/chat'));
}

module.exports = routes;