
var db=require('../config/connection')
var collection=require('../config/collection');
const { ObjectId } = require('mongodb');
const { promise, reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const { response, disabled } = require('../app');
var objectId=require('mongodb').ObjectId


module.exports={
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=db.get().collection(collection.USER_COLLECTION).find().toArray();
            resolve(users)
        })
    },
    deleteUser:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).remove({_id:objectId(userId)}).then((response)=>{
                resolve(response)
            })
        })

    },
    editUserData:(userId,userData)=>{
        console.log(userData);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                $set:{
                    status:userData.status
                    
                }
            }).then((response)=>{
                resolve()
            })
        })

    },
    getAllUsersData:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let users=db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((response)=>{
                resolve(response)
            })
          
        })
    },
    userStatus:(userData)=>{
        let response={}
        return new Promise (async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                if(user.status=="active"){
                    console.log('active user');
                    response.status=true
                    resolve(response)
                }else{
                    console.log('@@@@@@@@@@@@@blocked user');
                    response.block=true
                    resolve(response)
                }
            }
            else{
                console.log('blocked user');

                resolve({status:false})
            }
        })


    },
    Category:(data)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CATAGORY_COLLECTION).insertOne(data).then((response)=>{
                resolve(response)
                console.log(response);
            })

        })

    },
    getCatagory:()=>{
      return new Promise(async(resolve,reject)=>{
         let catagory= db.get().collection(collection.CATAGORY_COLLECTION).find().toArray()
         resolve(catagory)
      })
    },
    deleteCatagory:(dataId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CATAGORY_COLLECTION).remove({_id:objectId(dataId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getCatagoryView:()=>{
       return new Promise(async(resolve,reject)=>{
        let item=db.get().collection(collection.CATAGORY_COLLECTION).find().toArray()
        resolve(item)
        
       })


    },
    addProducts:(body,files)=>{
        body.images=files
        body.Price=parseInt(body.Price)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(body).then((response)=>{
               resolve(response);
            })
        })

        
    },
    getProducts:()=>{
        return new Promise((resolve,reject)=>{
            let product=db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },
    
    deleteProduct:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(id)})
            resolve()
            console.log('removed success');
         
        })
    },
    getProdduct:(id)=>{
        return new Promise((resolve,reject)=>{
            let product =db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)})
            resolve(product)
        })
    },
    updateProductWithFiles:(id,files)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},{
                $set:{
                    images:files

                }
            }).then(()=>{
                resolve()
            })
        })

    },updateProduct:(id,body)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},{
                $set:{
                    Name:body.Name,
                    Catagory:body.Catagory,
                    price:body.Price,
                    Description:body.Description
                    

                }
            }).then(()=>{
                resolve()
            })
        })

    }

}
