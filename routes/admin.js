var express = require('express');
const { get } = require('express/lib/response');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var adminHelper = require('../helpers/admin-helpers')
const store = require('../config/multer');
const async = require('hbs/lib/async');
const { Db } = require('mongodb');
const res = require('express/lib/response');
require('dotenv').config()
//...................................middle ware..........................









// ..............................route...........................
/* GET home page. */


router.get('/', function async(req, res, next) {
  adminHelpers.totalRevanu().then((response) => {

    console.log(response);


    res.render('admin/admin-home', { admin: true, response })
    // res.render('index', { admin:ture });

  })

});


// ..............................admin login.....................................

router.get('/login', (req, res) => {
  if (req.session.admin) {
    res.render("admin/admin-login", { loginErr: req.session.adminErr })
  }

})

router.post('/login-admin', (req, res) => {
  if (req.body.Email == process.env.ADMIN && req.body.Password ==process.env.ADMIN_PASSOWRD) {
    req.session.admin = true
    res.redirect('/admin')
  }
  req.session.adminErr = 'Invalid user and password'
  res.redirect('/admin/login')
})

router.get('/logout', (req, res) => {
  req.session.admin = true
  res.redirect('/admin/login')
})




// ....................................user data ...............................

router.get('/all-user', (req, res) => {
  adminHelper.getAllUsers().then((users) => {
    res.render('admin/all-users', { users, admin: true, activeuser: true })
  })

})
// ....................................delele user data...........................
router.post('/delete-user', (req, res) => {
  let userId = req.body.id.trim()
  console.log(userId);
  adminHelper.deleteUser(userId).then((response) => {
    
    res.json(response)
  })
})

// ................................user update/edit................................
router.get('/edit-user/:id', (req, res) => {
  adminHelper.getAllUsersData(req.params.id).then((user) => {
    res.render('admin/edit-users', { user, admin: true })
  })

})

router.post('/edit-user/:id', (req, res) => {
  console.log('edit users');
  console.log(JSON.stringify(req.body));
  adminHelper.editUserData(req.params.id, req.body).then(() => {
    res.redirect('/admin/all-user')
  })
})




// ..............................add catagory.......................

router.get('/add-catagory', (req, res) => {
  res.render('admin/add-catagory', { admin: true, activecategory: true })
})


router.post('/add-catagory', (req, res) => {

  adminHelpers.Category(req.body).then((response) => {
    res.redirect('/admin/view-catagory')
  })
})

// ...............................viwe catagory..........................
router.get('/view-catagory', (req, res) => {
  adminHelpers.getCatagory().then((catagory) => {
    console.log(catagory);
    res.render('admin/view-catagory', { catagory, admin: true, activecategory: true })
  })
})

// ............................delete catagory..........................
router.get('/delect-catagoroy/:id', (req, res) => {
  adminHelpers.deleteCatagory(req.params.id).then((response) => {
    res.redirect('/admin/view-catagory')
  })

})

// ............................add product.................................
router.get('/add-product', (req, res) => {

  adminHelpers.getCatagoryView().then((item) => {
    console.log(item);
    res.render('admin/add-products', { item, admin: true, activeaddproduct: true })
  })

})
router.post('/add-product', store.array('Image', 12), (req, res) => {

  let arr = []

  req.files.forEach(function (files, index, ar) {
    console.log(req.files[index].filename);

    arr.push(req.files[index].filename)

  })

  adminHelpers.addProducts(req.body, arr).then(() => {
    res.redirect('/admin/view-product')

  })

})
// ........................................view products...................................

router.get('/view-product', (req, res) => {
  adminHelpers.getProducts().then((products) => {
    // res.render('admin/view-product',{products,admin:true})
    res.render('admin/product-card', { products, admin: true, activeviewproduct: true })
  })
})

// ........................................delete product..............................
router.get('/delete-product/:id', (req, res) => {
  adminHelpers.deleteProduct(req.params.id).then(() => {
    res.redirect('/admin/view-product')
  })
})

// ..........................................edit product.....................................

router.get('/edit-product/:id', (req, res) => {
  console.log(req.params.id);
  adminHelpers.getProdduct(req.params.id).then((product) => {
    console.log(product);
    adminHelpers.getCatagoryView().then((item) => {

      res.render('admin/edit-products', { product, item, admin: true })
    })


  })
})
router.post('/edit-product/:id', (req, res) => {
  console.log(req.body);


  adminHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-product')

  })




})

router.get('/edit-image/:id', (req, res) => {

  adminHelpers.getProdduct(req.params.id).then((product) => {
    res.render('admin/edit-images', { product, admin: true })



  })
})

router.post('/edit-images/:id', store.array('Image', 12), (req, res) => {
  console.log(req.files);
  let arr = []
  req.files.forEach((files, index, array) => {

    arr.push(req.files[index].filename)
  })
  console.log(arr);
  adminHelpers.updateProductWithFiles(req.params.id, arr).then(() => {
    res.redirect('/admin/view-product')

  })
})

// .............................order list....................

router.get('/order-list', (req, res) => {
  adminHelpers.getOrderList().then((orders) => {
    console.log(orders);
    res.render('admin/admin-order-list', { orders, admin: true, activeorder: true })
    console.log(orders);
  })

})

router.get('/order-remove/:id', (req, res) => {
  adminHelpers.deleteOrder(req.params).then(() => {
    res.redirect('/admin/order-list')
  })
})

router.post('/order-update', (req, res) => {
  console.log(req.body);
  adminHelpers.updateStatusOrder(req.body).then((response) => {
    res.json(response)
  })

})
// ......................................................banner...................................................................


router.get('/banner-management', (req, res) => {
  adminHelpers.getBanner().then((banner) => {

    let imgErr=req.session.imgErr
    res.render('admin/banner-management', { banner, activebanner: true,admin:true ,imgErr})
    req.session.imgErr=false
  })

})
router.post('/banner', store.single('image'), (req, res) => {
  console.log(req.file);
  if(req.file==null){
    req.session.imgErr="No image is found"
    res.redirect('/admin/banner-management')
  }else{

    adminHelper.addBanner(req.file).then(() => {
      console.log('complete');
      res.redirect('/admin/banner-management')
    })
  }


})
router.post('/bannerdelete', (req, res) => {
  console.log(req.body);
 
  adminHelpers.delectBanner(req.body.id).then((response) => {
    res.json(response)
  })


})


//getting sales data

router.get('/chart', async (req, res) => {

  let dailysale = await adminHelpers.getDailyData()
  let monthlysale = await adminHelpers.getMonthlyData()
  let yearlysale = await adminHelpers.getYearlyData()
  // daily amount
  let dailyAmt = [];
  dailysale.map((daily) => {
    dailyAmt.push(daily.totalAmount);


  });
  console.log(dailyAmt);
  //to get daily dates 
  let date = [];
  dailysale.map((daily) => {
    date.push(daily._id);
  });
  console.log(date);
  // map to get only the amount
  let monthlyAmount = [];
  monthlysale.map((daily) => {
    monthlyAmount.push(daily.totalAmount);
  });
  // map to get only the date
  let month = [];
  monthlysale.map((daily) => {
    month.push(daily._id);
  });


  // map to get only the amount
  let yearlyAmount = [];
  yearlysale.map((daily) => {
    yearlyAmount.push(daily.totalAmount);
  });

  // map to get only the year
  let year = [];
  yearlysale.map((daily) => {
    year.push(daily._id);
  });

  res.json({ dailyAmt, date, monthlyAmount, month, yearlyAmount, year })


})
// ......................Coupon management.....................................

router.get('/coupon', (req, res) => {
  adminHelpers.getCoupon().then((coupon) => {
    console.log(coupon);
    res.render('admin/coupon', { admin: true, coupon ,activecoupon:true})
  })

})

router.post('/addCoupon', (req, res) => {

  console.log(req.body);
  adminHelpers.addCouponToDataBase(req.body).then(() => {
    res.redirect('/admin/coupon')
  })
})

router.post('/applycoupon', async(req, res)=> {
  adminHelpers.checkUsedCoupon(req.body).then((response) => {
    if (response.status) {

      adminHelpers.applyCoupon(req.body).then((response)=>{
        console.log(response);
        res.json(response)
      })
      
    }else{
      res.json(response)
     
    }



  })



})
router.post('/delete-coupon',(req,res)=>{
  console.log('11111111111111111111111111111111111111111111111111111111');
  console.log(req.body.data);
  adminHelpers.deleteCoupon(req.body.data).then((response)=>{
    res.json(response)
  })
})

router.post('/removeCoupon', (req, res) => {
  console.log((req.body));
  adminHelpers.removeCoupon(req.body.userid).then((response) => {
    res.json(response)
  })
})

router.get('/updateoffers/:data',(req,res)=>{
  console.log(req.params);
  adminHelper.updateOffers(req.params).then(()=>{
    res.redirect('/admin/view-catagory')
  })
})

// ...............................sales report.......................
router.get('/sales-report',(req,res)=>{

  res.render('admin/sales-report',{admin:true})
})
module.exports = router;
