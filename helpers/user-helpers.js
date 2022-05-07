var db=require('../config/connection')
var Collection=require('../config/collection')
const bcrypt=require('bcrypt');
const collection = require('../config/collection');
const async = require('hbs/lib/async');
const { status } = require('express/lib/response');
const { response } = require('../app');
const { promise, reject } = require('bcrypt/promises');



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
    }
}
