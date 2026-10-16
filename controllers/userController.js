const userModel = require('../models/User')
const otpModel = require('../models/otp')
const categoryModel =  require('../models/Category')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser');
const nodemailer = require('nodemailer');

// transpotter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS
  }
})


const loginPage = async (req, res) => {
  res.render('admin/login',{layout:false})
}

const allUser = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page-1)*limit;
  const users = await userModel.find().limit(limit).skip(skip);
  const totalUsers = await userModel.countDocuments();
  const totalPages = Math.ceil(totalUsers/ limit);

  res.render('admin/users',
    {
      users,
      page,
      totalPages,
      limit,
      role: req.role
    }
  )
}

const updateUserPage = async (req, res) => {
  const id = req.params.id;
  
  try {
    // 1. Fetch the user from the database first
    const user = await userModel.findById(id);
    
    // 2. Check if the user exists
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // 3. Render the page and pass the user data into it
    res.render('admin/users/update', { user });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
}

const addUserPage = async (req, res) => {
  res.render('admin/users/create')
}
const dashboard = async (req, res) => {
  const users =  await userModel.find();
  const categories = await categoryModel.find();
  res.render('admin/dashboard', {users, categories})
}

const addUser = async (req, res) => {
  try {
    const user = req.body;
    
    // Explicit safety checks for form properties
    if (!user.email) {
      return res.status(400).send('Email address is required.');
    }

    const existingUser = await userModel.findOne({ email: user.email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    // Normalize email layout to match database schemas
    user.email = user.email.toLowerCase().trim();
    req.session.pendingUser = user;

    // Cryptographically stable random integer string tracking
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.currentOtp = generatedOtp;

    const mailOptions = {
      from: `"Admin Security System" <${process.env.USER_EMAIL}>`, 
      to: user.email,
      subject: 'Security Verification: Confirm Your Registration', 
      text: `Hello,\n\nYour security verification OTP code is: ${generatedOtp}.\n\nThis verification sequence is strictly temporary and will automatically expire in 1 minute.`,
      html: `
        <p>Hello,</p>
        <p>Your security verification OTP code is: <strong style="font-size: 18px; color: #e53e3e;">${generatedOtp}</strong>.</p>
        <p>This verification sequence is strictly temporary and will automatically expire in <strong>1 minute</strong>.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.redirect('/admin/users/emailotp');

  } catch (error) {
    console.error("Error within addUser controller:", error);
    res.status(500).send('Internal system error handling request.');
  }
};

const showOtpPage = async (req, res) => {
  if (!req.session || !req.session.pendingUser || !req.session.currentOtp) {
    return res.redirect('/admin/add-user'); 
  }
  
  // Passes the active user email address to the frontend template view layer
  res.render('admin/users/emailotp', { 
    layout: false, 
    email: req.session.pendingUser.email 
  });
};

const verifyOtpAndSave = async (req, res) => {
  try {
    const { otp } = req.body;
    const cachedUserData = req.session.pendingUser;
    const cachedOtp = req.session.currentOtp;

    if (!cachedUserData || !cachedOtp) {
      return res.status(400).send('Session expired. Please fill out the add user form again.');
    }

    if (otp !== cachedOtp) {
      return res.status(400).send('Incorrect OTP validation code.');
    }

    // Provision new user mapping safely into database collection hooks
    const newUser = new userModel(cachedUserData);
    await newUser.save();

    // Clear session memory mapping footprints immediately to prevent token reuse
    req.session.pendingUser = null;
    req.session.currentOtp = null;

    res.redirect('/admin/users');
  } catch (err) {
    console.error("Database storage transaction failure:", err);
    res.status(500).send('Database storage transaction failure.');
  }
};


const updateUser = async (req, res) => {
  const id = req.params.id;
  const {fullname, username , password, role} = req.body;
  try{
    const user = await userModel.findById(id);
    if(!user){
      return res.status(404).send('User not found');
    }
    user.fullname = fullname;
    user.username = username;
        if (password && password.trim() !== "") {
      user.password = password; 
    }

    user.role = role;
    await user.save();
    res.redirect('/admin/users');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
}

const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try{
    const user = await userModel.findOne({ username });
    if(!user){
      return res.status(404).send('User not found');
    }
    const isPassword = await bcrypt.compare(password, user.password);
    if(!isPassword){
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({
      id: user._id,
      name: user.fullname,
      role: user.role
     },
      process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { maxAge: 3600000 });
      res.redirect('/admin/dashboard');


  }
  catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
  
}

const settings = async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).send('User not found');
  }
  res.render('admin/settings', { user });
}

const profilePic = async (req, res) => {
  try {
        if (!req.file) {
            return res.status(400).send('Please select a valid image file to upload.');
        }
        const databaseImagePath = `/uploads/${req.file.filename}`;
        await userModel.findByIdAndUpdate(
            req.user.id, 
            { profilePic: databaseImagePath },
            { new: true }
        );
        res.redirect('/admin/settings');

    } catch (error) {
        console.error('File transaction database error:', error);
        res.status(500).send('Internal server exception handling document upload.');
    }
}

const saveSettings = async (req, res) => {

}

// GET: Load the custom delete page confirmation screen
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userModel.findById(id);
    
    if (!user) {
      return res.status(404).send('Operator profile not found');
    }
    
    // Renders views/admin/users/delete.ejs and passes the database user info
    res.render('admin/users/delete', { user });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};

// POST: Execute the actual deletion task from the server
const deleteUserConfirmed = async (req, res) => {
  try {
    const id = req.params.id;
    await userModel.findByIdAndDelete(id);
    
    // Forces the client directory grid list to refresh itself automatically
    res.redirect('/admin/users');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};

const logoutPage = async (req, res) => {
    try {
        return res.render("admin/logout", {
            title: "NewsPK | Terminate Session"
        });
    } catch (error) {
        console.error("Logout page rendering fault:", error);
        return res.status(500).send("Internal Server Error");
    }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.redirect('/admin'); // Return the operator back cleanly to root login path screen
  } catch (error) {
    console.error("Logout execution processing error:", error);
    return res.status(500).send("Internal Server Error processing session cleanup");
  }
}

// 404 page
const page404 = async (req, res) => {
  res.render('admin/404',{layout:false})
}

const forgotOtp = async (req , res) => {
  res.render('admin/forgototp', {layout:false})
}


// transporter logic define on top
const forgotPssword =async (req, res) => {
  const { email } = req.body;
   const existingUser = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!existingUser) {
      return res.status(400).send('User Does Not Exist');
    }
  try{
  
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expireAt = new Date(Date.now() + 60 * 1000); 
    await otpModel.deleteMany({ email });
    const otpData = new otpModel({
      email,
      otp,
      expireAt
    })
    await otpData.save();

const mailOptions = {
  // Format the sender correctly with an explicit Display Name wrapped in quotes
  from: `"Admin Security System" <${process.env.USER_EMAIL}>`, 
  to: email,
  subject: 'Security Verification: Reset Your Account Password', // Professional subject line
  text: `Hello,\n\nYour security verification OTP code is: ${otp}.\n\nThis verification sequence is strictly temporary and will automatically expire in 30 seconds.\n\nIf you did not initiate this system request, please disregard this transmission securely.\n\nBest Regards,\nAdministrative System Team`,
  html: `<p>Hello,</p><p>Your security verification OTP code is: <strong>${otp}</strong>.</p><p>This verification sequence is strictly temporary and will automatically expire in 30 seconds.</p>`
};

    await transporter.sendMail(mailOptions);
    res.render('admin/enterotp', { email, layout: false });

  }catch(error){
      console.error("CRASH ERROR:", error); 
    return res.status(500).send('Internal Server Error');
  }
}

const verify = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // 💡 Handle HTML Form inputs: If 'otp' arrives as an array from EJS, stitch it together into a single string
    if (Array.isArray(otp)) {
      otp = otp.join('');
    }

    // 1. Query the database for the active matching document
    const otpData = await otpModel.findOne({
      email: email,
      otp: otp
    });

    // 2. Gatekeeper: Trigger alert if no combination matches
    if (!otpData) {
      return res.status(400).json({
        message: 'Invalid OTP'
      });
    }

    // 3. Strict Expiration Check (Fixed typo from 'expiresAt' to your actual schema field 'expireAt')
    if (Date.now() > otpData.expireAt.getTime()) {
      // Clean up the expired record immediately (Fixed typo from 'otpModel._id' to 'otpData._id')
      await otpModel.deleteOne({ _id: otpData._id });
      
      return res.status(400).json({
        message: 'OTP has expired'
      });
    }

    // 4. Clean out used validation record to prevent replay token reuse attacks
    await otpModel.deleteOne({ _id: otpData._id });

    // 5. Send back a clean success state payload response
    return res.status(200).json({
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('OTP Verification System Error:', error);
    return res.status(500).json({
      message: 'OTP verification failed'
    });
  }
};



module.exports = {
  loginPage,
  adminLogin,
  logoutPage,
  logout,
  allUser,
  addUserPage,
  addUser,
  showOtpPage,
  verifyOtpAndSave,
  updateUserPage,
  updateUser,
  deleteUser,
  deleteUserConfirmed,
  dashboard,
  settings,
  profilePic,
  saveSettings,
  page404,
  forgotOtp,
  forgotPssword,
  verify
}