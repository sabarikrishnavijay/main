var express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var config = require('../config/otp');
const { log } = require('handlebars');
const async = require('hbs/lib/async');
var client = require('twilio')(config.accountSID, config.authToken)





// ............................................middle ware.......................................
const userCheck = (req, res, next) => {
  adminHelpers.userStatus(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      next()
    } else if(response.block) {
      req.session.loginErr = "User is blocked "
      res.redirect('/login')

    }else {
      req.session.loginErr = "invalid user name and password"
      res.redirect('/login')
    }
  })


}

const loginCheck=(req,res,next)=>{
  if(req.session.login){
    next()
  }else{
    res.redirect('/login')
  }
}


// .............................................route.............................................
/* GET users listing. */
router.get('/', loginCheck,async function (req, res, next) {
  let user = req.session.user
  let cartCOunt= null
  if(req.session.user){

    cartCOunt= await userHelpers.getCartCount(req.session.user._id)
  }
  req.session.count=cartCOunt
  res.render('users/home', { user,cartCOunt })
});

// ..........................................Login route.......................................
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {

    res.render('users/login', { loginErr: req.session.loginErr })
    req.session.loginErr = false

  }
})

// ...........................login route without otp..................................

router.post('/login', userCheck, (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    let user = response.user
    if (response.status) {
      console.log('mmmmmmmmmmmm');
      console.log(user);
      req.session.login = true
       req.session.user = response.user
     
        res.redirect('/',)
      // })
      
    } else {
      req.session.loginErr = 'Invalid username or password'
      res.redirect('/login')
    }
  })
})

//............................................................................................................
// router.post('/login', userCheck, (req, res) => {
//   userHelpers.doLogin(req.body).then((response) => {
//     let user = response.user
//     if (response.status) {
//       console.log('mmmmmmmmmmmm');
//       console.log(user.Number);
//       // req.session.login = true
//       // req.session.user = response.user
//       var Number = response.Number
//       client.verify
//       .services(config.serviceSID)
//       .verifications
//       .create({
//         to:`+91${user.Number}`,
//         channel:'sms'
//       })
//       .then((data)=>{
      
//        req.session.login = true
//        req.session.user = user
//         console.log(data+'iam line 40 data');
//         res.render('users/otp', { user })
//       })
      
//     } else {
//       req.session.loginErr = 'Invalid username or password'
//       res.redirect('/login')
//     }
//   })
// })

// .........................................signup route..................................

router.get('/signup', (req, res) => {
 let err=req.session.signupError
  res.render('users/signup',{err})
  err=null
})


router.post('/signup', (req, res) => {

  userHelpers.doEmailCheak(req.body).then((response) => {
    if (response.status) {
      req.session.signupError = "This Email is already used "
      res.redirect('/signup')
    } else {

      userHelpers.doSignup(req.body).then((response) => {
    
        res.redirect('/login')
      })



    }
  })



})


// ........................................logout..................................

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.loggedIn = false
  res.redirect('/')
})
// .............................otp............................................
router.get('/otp', (req, res) => {
  res.render('users/otp')
})

router.post('/otp-varify', (req, res) => {
  var Number = req.query.Number
  console.log(Number);
  var otp = req.body.Number
  var out = otp.join('')
  console.log(otp);
  console.log(out);
  client.verify
    .services(config.serviceSID)
    .verificationChecks.create({
      to: `+91${Number}`,
      code: out
    })
    .then((data) => {
      console.log(data.status + "otp status/*/*/*/");
      if(data.status=='approved'){
        res.redirect("/");
      }else{
        console.log(data.status+'no booyy');
        otpErr = 'Invalid OTP'
        res.render('users/otp',{otpErr,Number})
      }
   
});

})

// .................................products............................
router.get('/products', (req, res) => {
  user=req.session.user
  cartCOunt=req.session.count

  adminHelpers.getProducts().then((product) => {
    console.log(product);
    res.render('users/catagory-based-products', { product ,user, cartCOunt })
  })

})


router.post('/products',(req,res)=>{
  console.log(req.body);
  userHelpers.getFilterProducts(req.body).then((product)=>{
    res.render('users/catagory-based-products',{product})
  })

})
// ...............................product card............................

router.get('/view-products/:id', (req, res) => {
 
  console.log(req.params.id);
  userHelpers.getProduct(req.params.id).then((products) => {
    console.log(products);
    let a = products
    res.render('users/product-view', { a })
   
  })


})

// ..........................................cart........................................

router.get('/cart',loginCheck,(req,res)=>{
  user=req.session.user
  let products=userHelpers.getCartProduts(req.session.user._id).then(async(items)=>{
  let total=await userHelpers.getTotalAmont(req.session.user._id)
   

  res.render('users/cart',{items,user,total})
    
  })
  
})


router.get('/add-to-cart/:id',(req,res)=>{
  if(req.session.user){
    
    console.log("api call");
    console.log(req.params.id,req.session.user);
    userHelpers.addToCart(req.params.id,req.session.user).then(()=>{
     res.json({status:true})
    })
  }else{
    res.redirect('/login')
  }
  
})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  console.log(req.params);
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
   response.total=await userHelpers.getTotalAmont(req.session.user._id)
    console.log(response);
    res.json(response)

  })
})

router.get('/check-out',loginCheck,async(req,res)=>{
  user=req.session.user
  let total= await userHelpers.getTotalAmont(req.session.user._id)

  res.render('users/check-out',{total,user})

})

router.post('/place-order',loginCheck,async(req,res)=>{
  console.log(req.body);
  let product=await userHelpers.getCartProductList(req.session.user)
  let totalPrice= await userHelpers.getTotalAmont(req.session.user._id)
  console.log(product);
  console.log(totalPrice);
  userHelpers.placeOrder(req.body,product,totalPrice).then((response)=>{

  })
 
})


router.get('/order-list',(req,res)=>{
  res.render('users/order-list')
})

module.exports = router;
