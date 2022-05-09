var express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var config = require('../config/otp');
const { log } = require('handlebars');
var client = require('twilio')(config.accountSID, config.authToken)





// ............................................middle ware.......................................
const userCheck = (req, res, next) => {
  adminHelpers.userStatus(req.body).then((response) => {
    if (response.status) {
      next()
    } else {
      req.session.loginErr = "User is blocked"
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
router.get('/', loginCheck,function (req, res, next) {
  let user = req.session.user
  res.render('users/home', { user })
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

// router.post('/login', userCheck, (req, res) => {
//   userHelpers.doLogin(req.body).then((response) => {
//     let user = response.user
//     if (response.status) {
//       console.log('mmmmmmmmmmmm');
//       console.log(user.Number);
//       req.session.login = true
//        req.session.user = response.user
     
//         res.render('users/otp', { user })
//       // })
      
//     } else {
//       req.session.loginErr = 'Invalid username or password'
//       res.redirect('/login')
//     }
//   })
// })

//............................................................................................................
router.post('/login', userCheck, (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    let user = response.user
    if (response.status) {
      console.log('mmmmmmmmmmmm');
      console.log(user.Number);
      // req.session.login = true
      // req.session.user = response.user
      var Number = response.Number
      client.verify
      .services(config.serviceSID)
      .verifications
      .create({
        to:`+91${user.Number}`,
        channel:'sms'
      })
      .then((data)=>{
      
       req.session.login = true
       req.session.user = user
        console.log(data+'iam line 40 data');
        res.render('users/otp', { user })
      })
      
    } else {
      req.session.loginErr = 'Invalid username or password'
      res.redirect('/login')
    }
  })
})

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
        req.session.loggedIn = true
        req.session.user = req.body
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
  adminHelpers.getProducts().then((product) => {
    console.log(product);
    res.render('users/catagory-based-products', { product })
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


module.exports = router;
