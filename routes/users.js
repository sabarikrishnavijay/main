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
    res.render('users/product-view', { a , user,cartCOunt})
   
  })


})

// ..........................................cart........................................

router.get('/cart',loginCheck,async(req,res)=>{
 
  user=req.session.user
  cartCOunt= await userHelpers.getCartCount(req.session.user._id)
  let products=userHelpers.getCartProduts(req.session.user._id).then(async(items)=>{
  let total=await userHelpers.getTotalAmont(req.session.user._id)
  req.session.count=cartCOunt

  res.render('users/cart',{items,user,total,cartCOunt})
    
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
// ...................place order...............................
router.get('/check-out',loginCheck,async(req,res)=>{
  user=req.session.user
  cartCOunt=req.session.count
  let total= await userHelpers.getTotalAmont(req.session.user._id)
console.log(total);
  res.render('users/check-out',{total,user,cartCOunt})
 // res.render('users/saved-address',{total,user})

})

router.get('/saved-address',async(req,res)=>{
  let total= await userHelpers.getTotalAmont(req.session.user._id)
  userHelpers.getAddress(req.session.user._id).then((address)=>{
    res.render('users/saved-address',{address,total})
  })

})
router.post('/saved-address',async(req,res)=>{
  console.log(req.body);

  console.log(req.body);
  let address=await userHelpers.getAddressDetails(req.body.addressid)
  let product=await userHelpers.getCartProductList2(address.userId)
  let totalPrice= await userHelpers.getTotalAmont(address.userId)
  req.session.total=totalPrice
  userHelpers.savedAddressOrder(address,req.body,address.userId,totalPrice,product).then((response)=>{
    let orderId=response.insertedId
    req.session.orderId=orderId
    

    if(req.body.paymentmethod==='COD'){
      res.json({codStatus:true})
    }else if (req.body.paymentmethod==='ONLINE'){
      userHelpers.generateRazorPay(orderId,totalPrice).then((response)=>{
          res.json(response)


      })

    }else{

      userHelpers.generatePaypal(orderId,totalPrice).then((data)=>{
        
        console.log('success');
        response.data=data
        response.paypal=true

        res.json(response)
        

      })
    }
    
  })
}) 

router.post('/place-order',loginCheck,async(req,res)=>{
  console.log(req.body);
  let product=await userHelpers.getCartProductList(req.session.user)
  let totalPrice= await userHelpers.getTotalAmont(req.session.user._id)
  console.log(product);
  console.log(totalPrice);
  userHelpers.placeOrder(req.body,product,totalPrice).then((response)=>{
    res.redirect('/order-list')

  })
 
})

//...................................................order List....................................................
router.get('/order-list',loginCheck,(req,res)=>{
  user=req.session.user
  console.log(req.session.user);
  userHelpers.orderList(req.session.user._id).then((order)=>{
    console.log(order);

    res.render('users/order-list',{order,user})
  })
})

//........................................................user Profile..................................................................
router.get('/user-profile',loginCheck,async(req,res)=>{
  user=req.session.user
  let address=await userHelpers.getAddress(user._id)
  console.log(address);

  res.render('users/user-profile',{user,address})
})

//........................................................edit user address...............................................
router.get('/edit-user-address/:id',async(req,res)=>{
  let address=await userHelpers.getAddressDetails(req.params)
  console.log(address);
  res.render('users/edit-user-address',{address})
})

router.post('/edit-user-address/:id',(req,res)=>{

  userHelpers.updateAddress(req.params,req.body).then(()=>{
    res.redirect('/user-profile')
  })
})
// ............................................change password................................................
router.get('/change-password',(req,res)=>{
 
  res.render('users/change-password',{status:req.session.pc})
  req.session.pc=""
  
})

router.post('/change-password',async(req,res)=>{

  if(req.session.user.Email==req.body.Email){
   await userHelpers.changePassword(req.body).then((response)=>{
      if(response.status){
        req.session.pc="Password changed"
        res.redirect('/change-password')
      }else{
        req.session.pc="Wrong password or Email"
        res.redirect('/change-password')
      }
    })
  }else{
    req.session.pc="Enter your Email"
    res.redirect('/change-password')
  }
 
 

})


router.post('/verify-payment',(req,res)=>{

  console.log(JSON.stringify(req.body))
  console.log(req.body['order[receipt]'])
  userHelpers.verifyPayment(req.body).then(()=>{
    console.log('next step');
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment success');
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    // res.json({status:false, errMsg:''})
  })
}
)

// ..........................................paypal success/cancel....................................

router.get('/success',(req,res)=>{
  console.log(res.params);
  userHelpers.changePaymentStatus(req.session.orderId).then(()=>{
    res.redirect('/')

  })
})
module.exports = router;
