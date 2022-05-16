var db=require('../config/connection')
var Collection=require('../config/collection')
const bcrypt=require('bcrypt');
const collection = require('../config/collection');
const async = require('hbs/lib/async');
const { status } = require('express/lib/response');
const { response } = require('../app');
const { promise, reject } = require('bcrypt/promises');
const { ObjectId } = require('mongodb');
const { PRODUCT_COLLECTION } = require('../config/collection');



module.exports={
    doSignup:(usersData)=>{
        console.log('dosignup-funtion');
        return new Promise(async(resolve,reject)=>{
            console.log('bcrypt');
            usersData.Password= await bcrypt.hash(usersData.Password,10)
            usersData.status="active"
            
            db.get().collection(collection.USER_COLLECTION).insertOne(usersData).then((data)=>{
                resolve(data)
            })
        })
    },
    doLogin:(userData)=>{
        console.log('Login : doLogin');
        let response={}
        return new Promise(async(resolve,reject)=>{
            
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log('login success');
                        response.user=user
                        response.status= true
                        resolve(response)
                    }else{
                        console.log('failed');
                        resolve({status:false})
                    }
                })
            }else{
                console.log('failed');
                resolve({status:false})

            }
        })
    },
    
    doEmailCheak:(data)=>{
        let response={}
        return new Promise(async(resolve,reject)=>{
            let email= await db.get().collection(collection.USER_COLLECTION).findOne({Email:data.Email})
            if(email){
                console.log('same email');
                response.status=true
                resolve(response)
            }else{
                console.log('no same email');
                resolve({status:false})
            }
        })
    },
    getProduct:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let product= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(id)})
            resolve(product)
        })
    },
    addToCart:(id,user)=>{
        let proObj={
            item:ObjectId(id),
            quantity:1

        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(user._id)})
            if(userCart){
                let proExit=userCart.product.findIndex(product=>product.item==id)
                console.log(proExit);
                 if(proExit!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:ObjectId(user._id) ,'product.item':ObjectId(id)},{
                        $inc:{'product.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })

                 }else{

                     db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(user._id)},
                     
                     {
                      
                             $push:{product:proObj}
     
                         
                     }).then((response)=>{
                         resolve()
                     })

                 }
                

            }else{
                let cartObj={
                    user:ObjectId(user._id),
                    product:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()

                })
            }
        })

    },
       getCartProduts:(id)=>{
        return new Promise( async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(id)}
                },

                {
                    $unwind:'$product'
                },{
                    $project:{
                        item:'$product.item'
                        ,quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
               
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })

         
    },
    getCartCount:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let count =0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(id)})
            if(cart){
                count=cart.product.length
            }
            resolve(count)
        })

    },
    changeProductQuantity:(data)=>{
        count=parseInt(data.count)
        qty=parseInt(data.qty)
        return new Promise((resolve,reject)=>{

            if(count==-1&&qty==1){

                db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(data.cart)},
                {
                    $pull:{product:{item:ObjectId(data.product)} }
                }).then((response)=>{
                    response.removedItem=true
                    resolve(response)

                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(data.cart), 'product.item':ObjectId(data.product)},{
                    $inc:{'product.$.quantity':count}
                }).then(()=>{
                    
                    resolve({status:true})
                })

            }

           
        })

    },
    getTotalAmont:(userId)=>{
        return new Promise( async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },

                {
                    $unwind:'$product'
                },{
                    $project:{
                        item:'$product.item'
                        ,quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
               
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems[0]?.total)
           
        })

    },
    getCartProductList:(user)=>{
     return new Promise((resolve,reject)=>{
       db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(user._id)}).then((response)=>{
     
        resolve(response.product)
       })
       
        
     })

    },
    placeOrder:((order,products,total)=>{
        return new Promise((resolve,reject)=>{
            let status=order.paymentmethod==='COD'?'Placed':'Pending'
            let orderObj={
                deliveryDetails:{
                    FirstName:order.firstname,
                    LastName:order.lastname,
                    mobile:order.phone,
                    address:order.address,
                   
                },
                userId:ObjectId(order.userid),
                paymentMethod:order.paymentmethod,
                products:products,
                total:total,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLETION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).remove({user:ObjectId(order.userid)})
                resolve()
            })
        })
    })
    ,
    getFilterProducts:(data)=>{
     return new Promise(async(resolve,reject)=>{
        let products= await db.get().collection(collection.PRODUCT_COLLECTION).find({Catagory:data.category}).toArray()
        console.log(products);
        resolve(products)
     })
    }
}