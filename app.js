require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const bcrypt = require("bcryptjs");
const passport = require('passport');
const expressLayouts=require('express-ejs-layouts')
const session = require('express-session')
const {ensureAuthenticated} =  require('../backend/config/auth');
const flash = require('connect-flash');
//Passport config
require('./config/passport')(passport);
const Product = require("./models/product");
const User = require("./models/User");



const app = express();


const storage = multer.diskStorage({
  destination: ((req, file, cb)=>{
    cb(null, 'public/uploads')
  }),
  filename: (req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
 }
})
const fileFilter = (req, file, cb)=>{
  if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'){
    cb(null, true);
  }else {
    cb(null, false);
  }
}
 const upload = multer({storage: storage, fileFilter:fileFilter});

 //EJS for testing out User login and signup 
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());
//Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}))
//Passport middleware
app.use(passport.initialize());
app.use(passport.session());
//Connect flash
app.use(flash());
//Global Var
app.use((req, res, next) =>{
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
})

//Welcome for user login page
app.get('/', (req, res)=>res.render('welcome'));


//Dashboard after user login authorized
app.get('/dashboard', ensureAuthenticated, (req, res)=>
res.render('dashboard',{
    name: req.user.name
}));


//Endpoint for getting all products from DB
app.get("/api/all_products", (req, res) => {
  Product.find({}).then((product) => {
    res.json(product);
  });
});


//Endpoint for getting a single product
app.get('/api/product/:id', (req, res) => {
  Product.findById(req.params.id)
  .then(product => {
      if (product) {
          res.json(product)
        } else {
          res.status(404).end()
        }
      })
      .catch(error => {
          console.log(error)
          res.status(400).send({ error: 'ID does not exists' })
        })
  })


//Endpoint for uploading product to DB
app.post("/upload", upload.single("file"), (req, res, next) => {
  try{
    const body = req.body;
    const product = new Product({
    name: body.name,
    description: body.description,
    price: body.price,
    version:body.version,
    quantity:body.quantity,
    img: req.file.path
  })
  product.save()
    return res.status(201).json({
      message: "File uploaded successfully"
    });

  }catch(error){
    console.error(error);
  }
});


//Endpoint for deleting a product from DB
app.delete("/api/admin_dashboard/deleteproduct/:id", (req, res) => {
  console.log(req.params)
  Product.findByIdAndRemove(req.params.id, req.body, function (
    err,
    product
  ) {
    if (err) return res.send("Product not found"); //next(err)
    res.json(product);
  });
});


//Endpoint for updating a product
app.put("/api/admin_dashboard/updateproduct/:id", (req, res) => {
  console.log(req.params);
   Product.findByIdAndUpdate( 
     req.params.id, req.body, {new: true}, function (err, product) {
      if (err) return res.status(500).next(err)
      res.json(product);
    });
});


//Endpoint for rendering login Page
app.get("/login", (req, res) => res.render("login"));


//Endpoint for rendering signup page 
app.get("/register", (req, res) => res.render("register"));


//Endpoint for new user sign up - Sigup Handler
app.post("/register", (req, res) => {
  const {
    name, email, password, password2
  }=req.body;

  let errors = [];
  
//Check required fields
  if(!name || !email || !password || !password2){
      errors.push({msg: "Please fill in all fields"});
      res.json(errors)
  }
  if(errors.length > 0){
      res.render('register', {
          errors,
          name,
          email, 
          password,
          password2
      });
  } 
  else{
    User.findOne({email: email})
    .then(user =>{
        if(user){
            errors.push({msg: 'Email is already registered'})
            res.json('User exists')
        }
        else{
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
            });
        
           //Password hashed
           bcrypt.genSalt(10, (error, salt)=>
            bcrypt.hash(newUser.password, salt, (err,hash)=>{
             if(err) throw err;

            newUser.password = hash;
            newUser.save()
                .then(user=>{
                    req.flash('success_msg', 'You are now registered')
                   // res.json(user)
                    res.redirect('/login')
                })
           }))
        }
    });
  }
});


//Endpoint for user login -Login Handler
app.post('/login',(req, res, next)=>{
    passport.authenticate('local',{
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});


//Endpoint for user logout -Logout Handler
app.get('/logout', (req, res)=>{
    req.logout();
    req.flash('success_msg','You are logged out');
    res.redirect('/login')
})


const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
