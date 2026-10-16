const isAdmin = (req, res, next) => {
    const role = req.user && req.user.role;

    if (role && role.trim().toLowerCase() === 'admin') {
        return next();
    }

    console.log(`Access Denied. User role found: ${role}`);
    return res.status(403).redirect("/admin/404");
};

module.exports = isAdmin;
