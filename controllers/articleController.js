const allArticle = async (req,res,next) => {
  res.render('admin/articles')
}

const addArticlePage = async (req,res) => {
  res.render('admin/articles/create')
}

const updateArticlePage = async (req,res,next) => {
  res.render('admin/articles/update')
}

const addArticle = async (req,res) => {
  
  
}

const updateArticle = async (req,res,next) => {
  
}

const deleteArticle = async (req,res,next) => { 
  
}

module.exports = {
  allArticle,
  addArticlePage,
  addArticle,
  updateArticlePage,
  updateArticle,
  deleteArticle
}

