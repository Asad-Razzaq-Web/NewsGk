const jwt = require('jsonwebtoken');

const isloggedin = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/admin/'); 
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error from isLoggedin middleware');
    }
};

module.exports = isloggedin;
