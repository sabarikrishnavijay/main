const multer =require('multer')
// set storage

var storage=multer.diskStorage({
    destination:(req,res,cb)=>{
        cb(null,'./public/product-images')
    },
    filename:(req,file,cb)=>{
        var ext=file.originalname.substr(file.originalname.lastIndexOf('.'))
        cb(null,file.fieldname+'-'+Date.now()+'new'+ext)
    }
})
store= multer({storage:storage})
module.exports=store