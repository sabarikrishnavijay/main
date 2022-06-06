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
    } else if (response.block) {
      req.session.loginErr = "User is blocked "
      res.redirect('/login')

    } else {
      req.session.loginErr = "invalid user name and password"
      res.redirect('/login')
    }
  })


}

const loginCheck = (req, res, next) => {
  if (req.session.login) {
    next()
  } else {
    res.redirect('/login')
  }
}


// .............................................route.............................................
/* GET users listing. */
router.get('/', loginCheck, async function (req, res, next) {
  let user = req.session.user
  let cartCOunt = null
  if (req.session.user) {

    cartCOunt = await userHelpers.getCartCount(req.session.user._id)
  }
  req.session.count = cartCOunt
  userHelpers.getbanner().then((banner) => {
    console.log(banner);
    res.render('users/home', { user, cartCOunt, banner })
  })

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
  let err = req.session.signupError
  res.render('users/signup', { err })
  err = null
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
      if (data.status == 'approved') {
        res.redirect("/");
      } else {
        console.log(data.status + 'no booyy');
        otpErr = 'Invalid OTP'
        res.render('users/otp', { otpErr, Number })
      }

    });

})

// .................................products............................
router.get('/products', loginCheck, (req, res) => {
  user = req.session.user
  cartCOunt = req.session.count
  if (req.session.product) {
    product = req.session.product
    res.render('users/catagory-based-products', { product, user, cartCOunt })
    req.session.product = false
  } else {


    adminHelpers.getProducts().then((product) => {
      console.log(product);
      res.render('users/catagory-based-products', { product, user, cartCOunt })
    })
  }

})


router.post('/products', (req, res) => {
  console.log(req.body);
  userHelpers.getFilterProducts(req.body).then((product) => {
    req.session.product = product
    res.redirect('/products')
    // res.render('users/catagory-based-products', { product ,user, cartCOunt })  
  })
})
// ...............................product card............................

router.get('/view-products/:id', (req, res) => {

  console.log(req.params.id);
  userHelpers.getProduct(req.params.id).then((products) => {
    console.log(products);
    let a = products
    res.render('users/product-view', { a, user, cartCOunt })

  })


})

// ..........................................cart........................................

router.get('/cart', loginCheck, async (req, res) => {

  user = req.session.user
  cartCOunt = await userHelpers.getCartCount(req.session.user._id)
  let products = userHelpers.getCartProduts(req.session.user._id).then(async (items) => {
    let total = await userHelpers.getTotalAmont(req.session.user._id) || 0

    total = total.totalAmout || 0


    req.session.count = cartCOunt
    let coupon = await userHelpers.getcoupon(req.session.user._id) || 0
    let wallet = await userHelpers.getWalletcart(req.session.user._id) || await userHelpers.getWallet(req.session.user._id) || 0


    res.render('users/cart', { items, user, total, cartCOunt, coupon, wallet })

  })

})


router.get('/add-to-cart/:id', async (req, res) => {
  if (req.session.user) {
    let wallet = await userHelpers.getWallet(req.session.user._id) || 0
    let product = await userHelpers.getProduct(req.params.id)
    console.log(product);
    console.log("api call");
    console.log(req.params.id, req.session.user);
    userHelpers.addToCart(req.params.id, req.session.user, product, wallet).then(() => {
      res.json({ status: true })
    })
  } else {
    res.redirect('/login')
  }

})

router.post('/change-product-quantity', async (req, res, next) => {
  console.log(req.body);
  console.log(req.params);
  await userHelpers.changeProductQuantity(req.body).then(async (response) => {
    let total = await userHelpers.getTotalAmont(req.session.user._id)

    response.total = total.totalAmout
    console.log(response);
    res.json(response)

  })
})
// ...................place order...............................
router.get('/check-out', loginCheck, async (req, res) => {


  user = req.session.user
  cartCOunt = req.session.count
  let total = await userHelpers.getTotalAmont(req.session.user._id)
  total = total.totalAmout
  res.render('users/check-out', { total, user, cartCOunt })
  // res.render('users/saved-address',{total,user})


})

router.get('/saved-address', async (req, res) => {
  let cart = await userHelpers.checkCart(req.session.user._id)
  if (cart.status) {
    let total = await userHelpers.getTotalAmont(req.session.user._id)
    total = total.totalAmout
    userHelpers.getAddress(req.session.user._id).then((address) => {
      res.render('users/saved-address', { address, total })

    })
  } else {
    res.redirect('/')
  }

})
router.post('/saved-address', loginCheck, async (req, res) => {
  console.log(req.body);
  try {


    let address = await userHelpers.getAddressDetails(req.body.addressid)
    let product = await userHelpers.getCartProductList2(address.userId)
    console.log('111111111111111111111111111111111111111111111');
    console.log(product);


    let usedCoupons = await userHelpers.getUsedCoupons(req.session.user._id)


    let totalPriceObject = await userHelpers.getTotalAmont(address.userId)
    totalPrice = totalPriceObject.totalAmout
    req.session.total = totalPrice
    userHelpers.savedAddressOrder(address, req.body, address.userId, totalPrice, product, usedCoupons, totalPriceObject).then((response) => {
      let orderId = response.insertedId
      req.session.orderId = orderId


      if (req.body.paymentmethod === 'COD') {
        res.json({ codStatus: true }) 
      } else if (req.body.paymentmethod === 'ONLINE') {
        userHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
          res.json(response)


        })

      } else {

        userHelpers.generatePaypal(orderId, totalPrice).then((data) => {

          console.log('success');
          response.data = data
          response.paypal = true

          res.json(response)


        })
      }

    })


  } catch (error) {
    console.log(error);
    res.json({ orderErr: true })

  }
})

router.post('/place-order', loginCheck, async (req, res) => {
  console.log(req.body);
  let product = await userHelpers.getCartProductList(req.session.user)
  let totalPrice = await userHelpers.getTotalAmont(req.session.user._id)
  totalPrice = totalPrice.totalAmout
  console.log(product);
  console.log(totalPrice);
  userHelpers.placeOrder(req.body, product, totalPrice).then((response) => {
    res.redirect('/saved-address')

  })

})

//...................................................order List....................................................
router.get('/order-list', loginCheck, (req, res) => {
  user = req.session.user
  console.log(req.session.user);

  userHelpers.orderList(req.session.user._id).then((order) => {
    console.log(order);

    res.render('users/order-list', { order, user })
  })
})
// ........................................................cancel order...............................................................
router.post("/order-remove", (req, res) => {
  user = req.session.user._id
  userHelpers.removeOrder(req.body, user).then((response) => {
    res.json(response)
  }).catch((response) => {
    res.json(response)

  })
})

//........................................................user Profile..................................................................
router.get('/user-profile', loginCheck, async (req, res) => {
  user = req.session.user
  let address = await userHelpers.getAddress(user._id)
  let refferalCode = await userHelpers.getreferral(req.session.user._id)
  let wallet = await userHelpers.getWallet(req.session.user._id) || 0


  res.render('users/user-profile', { user, address, refferalCode, wallet })
})

//........................................................edit user address...............................................
router.get('/edit-user-address/:id', async (req, res) => {
  let address = await userHelpers.getAddressDetails(req.params)
  console.log(address);
  res.render('users/edit-user-address', { address })
})

router.post('/edit-user-address/:id', (req, res) => {

  userHelpers.updateAddress(req.params, req.body).then(() => {
    res.redirect('/user-profile')
  })
})
// ............................................change password................................................
router.get('/change-password', (req, res) => {

  res.render('users/change-password', { status: req.session.pc, user: req.session.user })
  req.session.pc = ""

})

router.post('/change-password', async (req, res) => {
  console.log(req.body);

  if (req.session.user.Email == req.body.Email) {
    await userHelpers.changePassword(req.body).then((response) => {
      if (response.status) {
        req.session.pc = "Password changed"
        res.redirect('/change-password')
      } else {
        req.session.pc = "Wrong password or Email"
        res.redirect('/change-password')
      }
    })
  } else {
    req.session.pc = "Enter your Email"
    res.redirect('/change-password')
  }



})


router.post('/verify-payment', (req, res) => {

  console.log(JSON.stringify(req.body))
  console.log(req.body['order[receipt]'])
  userHelpers.verifyPayment(req.body).then(() => {
    console.log('next step');
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({ status: true })
    })

  }).catch((err) => {
    console.log(err);
    // res.json({status:false, errMsg:''})
  })
}
)

// ..........................................paypal success/cancel....................................

router.get('/success', (req, res) => {
  console.log(res.params);
  userHelpers.changePaymentStatus(req.session.orderId).then(() => {
    res.redirect('/order-success')

  })
})

router.get('/order-success', (req, res) => {
  res.render('users/order-success', { err404: true })
})
//.....................................................referral code............................................


router.get('/referral-code', (req, res) => {


  userHelpers.generateReferralCode(req.session.user._id).then(() => {
    res.redirect('/user-profile')

  }).catch(() => {
    res.redirect('/user-profile')


  })
})
router.post('/referral-code', (req, res) => {
  console.log(req.body);
  userHelpers.applyRefferalCode(req.body).then((response) => {
    res.json(response)
  })
})

// .............................wishlist....................................
router.get('/wish-list', (req, res) => {
  user = req.session.user._id
  console.log('wish list');
  userHelpers.getWishList().then((product) => {
    console.log(product);
    res.render('users/wishlist', { product, user })
  })
})

router.post('/add-wishlist', (req, res) => {

  console.log(req.body);
  userHelpers.addWishList(req.body, req.session.user._id).then((response) => {
    console.log(response);
    res.json(response)
  })
})
router.post('/remove-wishlist', (req, res) => {
  userHelpers.removeWishList(req.body, req.session.user._id).then((response) => {
    res.json(response)
  })
})
module.exports = router;
