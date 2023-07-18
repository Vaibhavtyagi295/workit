var express = require('express');
var router = express.Router();
const User = require('./users');
const {Category}  = require("./Categories");
const Brand = require("./Brands")
const Unit = require("./Units")
const Salt = require("./Salt")
const Product = require("./product")
const cors = require('cors');
var passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
passport.use(new LocalStrategy(User.authenticate()));
const OTP = require('./Otp');
const twilio = require('twilio');
const multer = require('multer');
const moment = require('moment');
const bodyParser = require("body-parser"); 
const { Router } = require('express');
const { route, routes } = require('../app');
router.use(cors());
router.use(bodyParser.json());


const accountSid = 'ACda2c89694773421096b79c9e56f31085';
const authToken = 'a14d4d8787dbdb898d5738423fb92748';
const twilioPhoneNumber = '+17159729714';

// Create a Twilio client
const client = twilio(accountSid, authToken);
// Route for OTP generation and sending

router.post("/api/otp/generate", async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Check if user with the given mobile number already exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      // User with the mobile number already exists, proceed with login
      return res.json({ success: true, message: "User already registered, proceed with login" });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save OTP to the database with an expiry time of 2 minutes
    const otpRecord = await OTP.create({ phoneNumber, otp, createdAt: new Date() });

    // Schedule deletion of OTP record after 2 minutes
    setTimeout(async () => {
      await OTP.findByIdAndDelete(otpRecord._id);
    }, 2 * 60 * 1000);

    // Send OTP to the user's phone number using Twilio
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    res.json({ success: true, message: "OTP generated and sent successfully" });
  } catch (error) {
    console.error("Error generating and sending OTP:", error);
    res.json({ success: false, message: "Failed to generate and send OTP" });
  }
});

router.post("/api/user/check", async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Check if user with the given mobile number already exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      // User exists
      res.json({ exists: true });
    } else {
      // User does not exist
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({ success: false, message: "Error checking user existence" });
  }
});

router.post('/api/otp/verify', async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ phoneNumber, otp });

    if (otpRecord) {
      // OTP matched, proceed with user registration
      const newUser = new User({ username: phoneNumber, phoneNumber }); // Include the username field

      // Register the user
      await User.register(newUser, 'password'); // Replace 'password' with the actual password

      res.json({ success: true, message: 'OTP verified and user registered successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP and registering user:', error);
    res.status(500).json({ success: false, message: 'Error verifying OTP and registering user', error: error.message });
  }
});

passport.use('noPassword', new LocalStrategy(
  {
    usernameField: 'phoneNumber', // Assuming phoneNumber is the field used for authentication
    passwordField: 'phoneNumber', // Use the same field for both username and password
  },
  async (username, password, done) => {
    try {
      // Find the user by phoneNumber
      const user = await User.findOne({ phoneNumber: username });

      if (user) {
        // Authentication successful
        return done(null, user);
      } else {
        // User not found
        return done(null, false, { message: 'Invalid credentials' });
      }
    } catch (error) {
      // Error occurred during authentication
      return done(error);
    }
  }
));

// Register the authentication strategy
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Use the authentication strategy in your route
router.post('/api/user/login', (req, res, next) => {
  passport.authenticate('noPassword', (err, user, info) => {
    if (err) {
      // Error occurred during authentication
      console.error('Authentication error:', err);
      return next(err);
    }

    if (!user) {
      // Authentication failed
      console.log('Authentication failed. Reason:', info.message);
      return res.status(401).json({ success: false, message: 'Login failed' });
    }

    // Authentication successful
    req.login(user, (err) => {
      if (err) {
        console.error('Error logging in the user:', err);
        return res.status(500).json({ success: false, message: 'Error logging in the user' });
      }

      res.json({ success: true, message: 'Login successful' });
    });
  })(req, res, next);
});


const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post('/categories', (req, res) => {
  const { name } = req.body;

  const category = new Category({ name});

  category.save()
    .then((savedCategory) => {
      console.log('Category inserted successfully');
      res.status(201).json(savedCategory);
    })
    .catch((error) => {
      console.error('Failed to insert category:', error);
      res.status(500).json({ error: 'Failed to insert category' });
    });
});

router.post('/brands', (req, res) => {
  const { name } = req.body;

  const brand = new Brand({ name });

  brand.save()
    .then((savedBrand) => {
      console.log('Brand inserted successfully');
      res.status(201).json(savedBrand);
    })
    .catch((error) => {
      console.error('Failed to insert brand:', error);
      res.status(500).json({ error: 'Failed to insert brand' });
    });
});

router.post('/units', (req, res) => {
  const { name } = req.body;

  const unit = new Unit({ name });

  unit.save()
    .then((savedUnit) => {
      console.log('Unit inserted successfully');
      res.status(201).json(savedUnit);
    })
    .catch((error) => {
      console.error('Failed to insert unit:', error);
      res.status(500).json({ error: 'Failed to insert unit' });
    });
});

router.post('/salt', (req, res) => {
  const { name } = req.body;

  const unit = new Salt({ name });

  unit.save()
    .then((savedUnit) => {
      console.log('Unit inserted successfully');
      res.status(201).json(savedUnit);
    })
    .catch((error) => {
      console.error('Failed to insert unit:', error);
      res.status(500).json({ error: 'Failed to insert unit' });
    });
});

router.post('/products', async (req, res) => {
  const { name, brandId, unitId, categoryId } = req.body;

  try {
    const brand = await Brand.findById(brandId);
    const category = await Category.findById(categoryId);

    if (!brand || !category) {
      res.status(400).json({ error: 'Invalid data provided for creating the product' });
      return;
    }

    let unit;

    if (unitId) {
      unit = await Unit.findById(unitId);

      if (!unit) {
        res.status(400).json({ error: 'Invalid data provided for creating the product: Unit not found' });
        return;
      }
    }

    const product = new Product({
      name,
      brand: brand._id,
      unit: unit ? unit._id : undefined,
      category: category._id
    });

    await product.save();
    console.log('Product inserted successfully');
    res.status(201).json(product);
  } catch (error) {
    console.error('Failed to insert product:', error);
    res.status(500).json({ error: 'Failed to insert product' });
  }
});


router.get('/api/categories', (req, res) => {
  Category.find()
    .then((categories) => {
      res.json(categories);
    })
    .catch((error) => {
      console.error('Failed to fetch categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    });
});

// GET /api/brands
router.get('/api/brands', (req, res) => {
  Brand.find()
    .then((brands) => {
      res.json(brands);
    })
    .catch((error) => {
      console.error('Failed to fetch brands:', error);
      res.status(500).json({ error: 'Failed to fetch brands' });
    });
});
router.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/api/userData', async (req, res) => {
  try {
    if (!req.user) {
      // User is not logged in
      return res.status(401).json({ success: false, message: 'User is not logged in' });
    }

    // If the user is logged in, fetch the user data using the user ID
    const user = await User.findById(req.user._id);

    if (!user) {
      // User not found in the database
      return res.status(404).json({ success: false, message: 'User data not found' });
    }

    // User data found, send it in the response
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data', error: error.message });
  }
});


router.get('/api/productData', async (req, res) => {
  try {
    // Fetch the total number of products from the database
    const totalProducts = await Product.countDocuments();

    res.json({ success: true, totalProducts });
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ success: false, message: 'Error fetching product data', error: error.message });
  }
});

module.exports = router;
