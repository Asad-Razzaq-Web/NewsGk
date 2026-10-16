const commentModel = require('../models/Comment');

const allComments = async (req,res,next) => { 
 res.render('admin/comments')
}


module.exports = {
  allComments
}