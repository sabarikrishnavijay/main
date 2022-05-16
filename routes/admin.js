var express = require('express');
const { get } = require('express/lib/response');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var adminHelper=require('../helpers/admin-helpers')
const store=require('../config/multer')

//...................................middle ware..........................








// ..............................route...........................
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('admin/admin-home',{ admin: true })
  // res.render('index', { admin:ture });
});


// ..............................admin login.....................................

router.get('/login',(req,res)=>{
  if(req.session.admin){
    res.render("admin/admin-login",{loginErr:req.session.adminErr})
  }
  
})

router.post('/login-admin',(req,res)=>{
  if(req.body.Email=="admin@gmail.com"&& req.body.Password=="123"){
    req.session.admin=true
    res.redirect('/admin')
  }
  req.session.adminErr='Invalid user and password'
  res.redirect('/admin/login')
})

router.get('/logout',(req,res)=>{
  req.session.admin=true
  res.redirect('/admin/login')
})




// ....................................user data ...............................

router.get('/all-user',(req,res)=>{
  adminHelper.getAllUsers().then((users)=>{
    res.render('admin/all-users',{users,admin:true})
  })

})
// ....................................delele user data...........................
router.get('/delete-user/:id',(req,res)=>{
  let userId=req.params.id
  adminHelper.deleteUser(userId).then((response)=>{
    res.redirect('/admin/all-user')
  })
})

// ................................user update/edit................................
router.get('/edit-user/:id',(req,res)=>{
  adminHelper.getAllUsersData(req.params.id).then((user)=>{
    res.render('admin/edit-users',{user,admin:true})
  })

})

router.post('/edit-user/:id',(req,res)=>{
  console.log('edit users');
  console.log(JSON.stringify(req.body));
  adminHelper.editUserData(req.params.id,req.body).then(()=>{
    res.redirect('/admin/all-user')
  })
})




// ..............................add catagory.......................

router.get('/add-catagory',(req,res)=>{
  res.render('admin/add-catagory',{admin:true})
})


router.post('/add-catagory',(req,res)=>{

  adminHelpers.Category(req.body).then((response)=>{
    res.redirect('/admin/view-catagory')
  })
})

// ...............................viwe catagory..........................
router.get('/view-catagory',(req,res)=>{
  adminHelpers.getCatagory().then((catagory)=>{
    console.log(catagory);
    res.render('admin/view-catagory',{catagory,admin:true})
  })
})

// ............................delete catagory..........................
router.get('/delect-catagoroy/:id',(req,res)=>{
  adminHelpers.deleteCatagory(req.params.id).then((response)=>{
    res.redirect('/admin/view-catagory')
  })
  
})

// ............................add product.................................
router.get('/add-product',(req,res)=>{
  
  adminHelpers.getCatagoryView().then((item)=>{
    console.log(item);
    res.render('admin/add-products',{item,admin:true})
  })
 
})
router.post('/add-product',store.array('Image',12),(req,res)=>{

    let arr=[]

    req.files.forEach(function(files,index,ar){
      console.log(req.files[index].filename);
  
      arr.push(req.files[index].filename)

    })

   adminHelpers.addProducts(req.body,arr).then(()=>{
     res.redirect('/admin/view-product')
     
   })
 
})
// ........................................view products...................................

router.get('/view-product',(req,res)=>{
  adminHelpers.getProducts().then((products)=>{
  // res.render('admin/view-product',{products,admin:true})
   res.render('admin/product-card',{products,admin:true})
  })
})

// ........................................delete product..............................
router.get('/delete-product/:id',(req,res)=>{
  adminHelpers.deleteProduct(req.params.id).then(()=>{
    res.redirect('/admin/view-product')
  })
})

// ..........................................edit product.....................................

router.get('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  adminHelpers.getProdduct(req.params.id).then((product)=>{
    console.log(product);
    adminHelpers.getCatagoryView().then((item)=>{

      res.render('admin/edit-products',{product,item,admin:true})
    })
   
   
  })
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.body);


  adminHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-product')

  })




})

router.get('/edit-image/:id',(req,res)=>{
  
  adminHelpers.getProdduct(req.params.id).then((product)=>{
    res.render('admin/edit-images',{product,admin:true})
    

   
  })
})

router.post('/edit-images/:id',store.array('Image',12),(req,res)=>{
  console.log(req.files);
  let arr=[]
  req.files.forEach((files,index,array)=>{
  
    arr.push(req.files[index].filename)
  })
  console.log(arr);
    adminHelpers.updateProductWithFiles(req.params.id,arr).then(()=>{
      res.redirect('/admin/view-product')
  
    })
})
router
module.exports = router;
