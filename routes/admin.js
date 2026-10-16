const express = require('express');
const router = express.Router();
const isLoggedin = require("../middleware/isloggedin");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../middleware/multer");

const articleController = require('../controllers/articleController');
const categoryController = require('../controllers/categoryController');
const commentController = require('../controllers/commentController');
const UserController = require('../controllers/userController');


//Login Routes
router.get('/', UserController.loginPage); //
router.post('/index',UserController.adminLogin); 
router.get('/logoutpage', UserController.logoutPage);
router.post('/logout', UserController.logout);
router.get('/dashboard',isLoggedin, UserController.dashboard); //
router.get('/settings', isLoggedin, isAdmin, UserController.settings);
router.post('/save-settings', isLoggedin, isAdmin, UserController.saveSettings);

// OTP Routes
router.get('/forgototp', UserController.forgotOtp); 
router.post('/forgot-password', UserController.forgotPssword); 
router.post('/verify-otp', UserController.verify); 


//User Routes
router.get('/users', isLoggedin, isAdmin ,UserController.allUser); //
router.get('/add-user', isLoggedin, isAdmin, UserController.addUserPage); //
router.post('/add-user', isLoggedin, isAdmin, UserController.addUser);//
router.get('/users/emailotp', UserController.showOtpPage );//
router.post('/users/verify-otp', UserController.verifyOtpAndSave);
router.get('/update-user/:id', isLoggedin, isAdmin, UserController.updateUserPage);//
router.post('/update-user/:id', isLoggedin, isAdmin, UserController.updateUser);//
router.get('/delete-user/:id', isLoggedin, isAdmin, UserController.deleteUser);//
router.post('/delete-user-confirmed/:id', isLoggedin, isAdmin, UserController.deleteUserConfirmed);//

//Category CRUD Routes
router.get('/category', isLoggedin, isAdmin, categoryController.allCategory); //
router.get('/add-category', isLoggedin, isAdmin, categoryController.addCategoryPage); //
router.post('/add-category', isLoggedin, isAdmin, categoryController.addCategory);//
router.get('/update-category/:id', isLoggedin, isAdmin, categoryController.updateCategoryPage);//
router.post('/update-category/:id', isLoggedin, isAdmin, categoryController.updateCategory);//
router.get('/delete-category/:id', isLoggedin, isAdmin, categoryController.deleteCategory);//
router.post('/delete-category-confirmed/:id', isLoggedin, isAdmin, categoryController.deleteCategoryConfirmed);//


//Article CRUD Routes
router.get('/article', isLoggedin, articleController.allArticle); //
router.get('/add-article', isLoggedin, articleController.addArticlePage); //
router.post('/add-article', isLoggedin, upload.single('image'), articleController.addArticle);
router.get('/update-article', isLoggedin, articleController.updateArticlePage);
router.post('/update-article/:id', isLoggedin, articleController.updateArticle);
router.delete('/delete-article/:id', isLoggedin, articleController.deleteArticle);

//Comment Routes
router.get('/comments', isLoggedin, commentController.allComments);

//Settings Routes
router.get('/settings', isLoggedin, UserController.settings);
router.post('/settings/profile-pic', isLoggedin, upload.single('profilePic'), UserController.profilePic);


// 404 page
router.get('/404', UserController.page404); //



module.exports = router;