const categoryModel = require('../models/Category')
const slugify = require('slugify'); 

const allCategory = async (req, res) => {
  try {
    // 1. Determine current page and item limit per page
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Change this to show more or fewer categories per page
    const skip = (page - 1) * limit;

    // 2. Run concurrent database queries for speed optimization
    const [categories, totalCategories] = await Promise.all([
      categoryModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      categoryModel.countDocuments()
    ]);

    // 3. Calculate total pages needed
    const totalPages = Math.ceil(totalCategories / limit);

    // 4. Render and pass all pagination metrics to the view layer
    res.render('admin/categories', { 
      categories, 
      page, 
      totalPages,
      limit
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error occurred during pagination processing.");
  }
}


const addCategoryPage = async (req, res) => {
  res.render('admin/categories/create')
}

const updateCategoryPage = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).send('Category not found');
    }
    res.render('admin/categories/update', { category });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
}

const addCategory = async (req, res) => {
  const { cat, description } = req.body;

  // Generate the slug from the category name ('cat')
  // 'lower: true' makes it lowercase, 'strict: true' removes special characters like symbols
  const generatedSlug = slugify(cat, { lower: true, strict: true });

  // Pass the slug into your model constructor
  const category = new categoryModel({ 
    name: cat, 
    description,
    slug: generatedSlug // <-- Added this line to satisfy your Mongoose requirement!
  });

  await category.save();
  res.redirect('/admin/category');
};

const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { cat , description } = req.body;

  try {
    // findByIdAndUpdate automatically modifies and saves the record in one step
    const generatedSlug = slugify(cat, { lower: true, strict: true });
    await categoryModel.findByIdAndUpdate(id, { 
    name: cat, 
    description,
    slug: generatedSlug
  });
    
    // Smoothly redirect back to the category directory page
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};


const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).send("Category not found");
    }
    res.render('admin/categories/delete', { category });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error occurred while fetching category for deletion.");
  }
};

const deleteCategoryConfirmed = async (req, res, next) => {
  const { id } = req.params;
  try {
    await categoryModel.findByIdAndDelete(id);
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error occurred while deleting category.");
  }
};

module.exports = {
  allCategory,
  addCategoryPage,
  addCategory,
  updateCategoryPage,
  updateCategory,
  deleteCategory,
  deleteCategoryConfirmed 
}