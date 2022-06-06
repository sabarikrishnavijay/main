
var db = require('../config/connection')
require('dotenv').config();
var Collection = require('../config/collection')
const bcrypt = require('bcrypt');
const collection = require('../config/collection');
const async = require('hbs/lib/async');
const { status, get } = require('express/lib/response');
const { response } = require('../app');
const { promise, reject } = require('bcrypt/promises');
const { ObjectId } = require('mongodb');
const { PRODUCT_COLLECTION } = require('../config/collection');
const Razorpay = require('razorpay');
const { resolve } = require('path');
require('dotenv').config()
let referralCodeGenerator = require('referral-code-generator')
var instance = new Razorpay({
    key_id: process.env.KEY_ID, key_secret: process.env.KEY_SCERT,
  //  key_id: process.ENV.KEY_ID, key_secret: process.env.key_secret,
});


const paypal = require('paypal-rest-sdk');
const { rejects } = require('assert');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.client_id,
    'client_secret': process.env.client_secret
});


module.exports = {
    doSignup: (usersData) => {
        console.log('dosignup-funtion');
        return new Promise(async (resolve, reject) => {
            console.log('bcrypt');
            usersData.Password = await bcrypt.hash(usersData.Password, 10)
            usersData.status = "active"

            db.get().collection(collection.USER_COLLECTION).insertOne(usersData).then((data) => {
                resolve(data)
            })
        })
    },
    doLogin: (userData) => {
        console.log('Login : doLogin');
        let response = {}
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('failed');
                resolve({ status: false })

            }
        })
    },

    doEmailCheak: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let email = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: data.Email })
            if (email) {
                console.log('same email');
                response.status = true
                resolve(response)
            } else {
                console.log('no same email');
                resolve({ status: false })
            }
        })
    },
    getProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(id) })
            resolve(product)
        })
    },
    addToCart: (id, user, product, wallet) => {
        let proObj = {
            item: ObjectId(id),
            quantity: 1,
            productName: product.Name,
            productPrice: product.Price,
            productImage: product.images,


        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(user._id) })
            if (userCart) {
                let proExit = userCart.product.findIndex(product => product.item == id)
                console.log(proExit);
                if (proExit != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ _id: ObjectId(user._id), 'product.item': ObjectId(id) }, {

                            $inc: { 'product.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })

                } else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(user._id) },

                        {

                            $push: { product: proObj }


                        }).then((response) => {
                            resolve()
                        })

                }


            } else {
                let cartObj = {
                    user: ObjectId(user._id),
                    coupon: 1,
                    product: [proObj],
                    couponnum: 0,
                    wallet: wallet
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()

                })
            }
        })

    },
    getCartProduts: (id) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(id) }
                },

                {
                    $unwind: '$product'
                }, {
                    $project: {
                        item: '$product.item'
                        , quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })


    },
    getCartCount: (id) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(id) })
            if (cart) {
                count = cart.product.length
            }
            resolve(count)
        })

    },
    changeProductQuantity: (data) => {
        count = parseInt(data.count)
        qty = parseInt(data.qty)
        return new Promise((resolve, reject) => {

            if (count == -1 && qty == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(data.cart) },
                    {
                        $pull: { product: { item: ObjectId(data.product) } }
                    }).then((response) => {
                        response.removedItem = true
                        resolve(response)

                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(data.cart), 'product.item': ObjectId(data.product) }, {
                        $inc: { 'product.$.quantity': count }
                    }).then(() => {

                        resolve({ status: true })
                    })

            }


        })

    },
    getTotalAmont: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },

                {
                    $unwind: '$product'
                }, {
                    $project: {
                        coupon: '$coupon',
                        item: '$product.item'
                        , quantity: '$product.quantity',
                        wallet: '$wallet'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        wallet: 1, coupon: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price', '$coupon'] } }
                    }
                },
                { $project: { total: { $round: ["$total", 1] } } }

            ]).toArray()
            console.log(cartItems);
            let total = cartItems[0]?.total || 0
            let cartWallet = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) }).then((response) => {
                if (response) {


                    walletBalance = response.wallet - total
                    totalAmout = total - response.wallet
                    if (totalAmout < 0) {
                        totalAmout = 0
                        resolve({ totalAmout, walletBalance })
                    } else {
                        resolve({ totalAmout, walletBalance })

                    }

                }
                resolve()

            })



        })

    },
    // total before wallet
    getTotalAmontTBefore: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },

                {
                    $unwind: '$product'
                }, {
                    $project: {
                        coupon: '$coupon',
                        item: '$product.item'
                        , quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        coupon: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price', '$coupon'] } }
                    }
                },
                { $project: { total: { $round: ["$total", 1] } } }

            ]).toArray()
            console.log(cartItems);
            resolve(cartItems[0]?.total)

        })

    },
    getCartProductList: (user) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(user._id) }).then((response) => {

                resolve(response.product)
            })


        })

    },
    getCartProductList2: (user) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(user) }).then((response) => {

                resolve(response.product)
            }).catch(() => {
                resolve({ product: false })
            })


        })

    },
    placeOrder: ((order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order.paymentmethod === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                deliveryDetails: {
                    userId: ObjectId(order.userid),
                    FirstName: order.firstname,
                    LastName: order.lastname,
                    mobile: order.phone,
                    address: order.address,

                },
                userId: ObjectId(order.userid),
                paymentMethod: order.paymentmethod,
                products: products,
                total: total,
                status: status,
                date: new Date()
            }

            db.get().collection(collection.ADDRESS_COLLETION).insertOne(orderObj.deliveryDetails).then(()=>{
                resolve()
            })
           
        })
    })
    ,
    getFilterProducts: (data) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Catagory: data.category }).toArray()
            console.log(products);
            resolve(products)
        })
    },
    orderList: (id) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLETION).aggregate([
                {
                    $match:{userId: ObjectId(id)}

                },
                {
                    $project:{
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        deliveryDetails:1,
                        userId:1,
                        paymentMethod:1,
                        products:1,
                        total:1,
                        status:1
                    }
                }
            ]).sort({ _id: -1 }).toArray()
            resolve(order)
        })
    },

    getAddress: (id) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLETION).find({ userId: ObjectId(id) }).toArray()
            console.log(address);
            resolve(address)
        })
    },
    getAddressDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLETION).findOne({ _id: ObjectId(id) })
            console.log(address);
            resolve(address)
        })

    }, savedAddressOrder: (address, data, id, total, product, usedCoupons, totalPriceObject) => {
        return new Promise(async (resolve, reject) => {
            let status = data.paymentmethod === 'COD' ? 'placed' : 'Pending'
            let orderObj = {
                deliveryDetails: address,
                userId: ObjectId(id),
                paymentMethod: data.paymentmethod,
                products: product,
                total: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLETION).insertOne(orderObj).then(async (response) => {

                if (usedCoupons.coupon != 1) {


                    await db.get().collection(collection.USED_CODE_COLLETION).findOne({ userID: ObjectId(usedCoupons.user) }).then(async (response) => {
                        if (response) {
                            console.log(" used data");
                            await db.get().collection(collection.USED_CODE_COLLETION).updateOne({ userID: ObjectId(usedCoupons.user) }, {
                                $push: { coupon: usedCoupons.couponName }
                            })
                        } else {
                            console.log("no data");
                            let dataused = {
                                userID: ObjectId(usedCoupons.user),
                                coupon: [usedCoupons.couponName]
                            }
                            await db.get().collection(collection.USED_CODE_COLLETION).insertOne(dataused)


                        }

                    })
                }

                await db.get().collection(collection.CART_COLLECTION).remove({ user: ObjectId(id) })

                if (totalPriceObject.walletBalance < 0) {
                    await db.get().collection(collection.WALLET_COLLETION).updateOne({ userid: ObjectId(id) }, {
                        $set: { wallet: 0 }
                    })

                } else {
                    await db.get().collection(collection.WALLET_COLLETION).updateOne({ userid: ObjectId(id) }, {
                        $set: { wallet: totalPriceObject.walletBalance }
                    })

                }



                console.log(response);
                resolve(response)

            })

        })
    },
    updateAddress: (id, data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ADDRESS_COLLETION).updateOne({ _id: ObjectId(id) }, {
                $set: {
                    userId: ObjectId(data.userId),
                    FirstName: data.FirstName,
                    LastName: data.LastName,
                    mobile: data.mobile,
                    address: data.address

                }
            })
            console.log('updated');
            resolve()

        })
    },
    changePassword: (userData) => {
        console.log('change password');

        return new Promise(async (resolve, reject) => {
            console.log('change password000000000000000000000000000000');
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.oldpassword, user.Password).then(async (status) => {
                    if (status) {
                        let Password = await bcrypt.hash(userData.newpassword, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({ Email: userData.Email }, {
                            $set: {
                                Password: Password
                            }
                        }).then(() => {
                            resolve({ status: true })
                        })
                        console.log('password');
                    } else {
                        console.log('failed 1');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('failed');
                resolve({ status: false })

            }
        })
    },
    generateRazorPay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalPrice * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log('new ORder:' + JSON.stringify(order));
                resolve(order)
            });

        })

    },
    verifyPayment: (details) => {
        console.log("verify");
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'JQuHfdVzeY9rSvy726jAVcH6')

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })

    },
    changePaymentStatus: (orderId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLETION).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {
                resolve()
            })
        })
    }, generatePaypal: (id, totalPrice) => {
        console.log('paypal');
        return new Promise((resolve, reject) => {
            let create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": totalPrice,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": totalPrice
                    },
                    "description": "Hat for the best team ever"
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                console.log(payment);
                if (error) {
                    throw error;
                } else {
                    // for(let i = 0;i < payment.links.length;i++){
                    //   if(payment.links[i].rel === 'approval_url'){
                    //     res.redirect(payment.links[i].href);
                    //   }
                    // }
                    resolve(payment)
                }
            });



        })



    },
    getbanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLETION).find().toArray()
            resolve(banner)

        })
    },
    getcoupon: (id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(id) }).then((response) => {
                console.log(response)
                resolve(response?.couponnum)
            })
        })
    },
    generateReferralCode: (id) => {
        console.log('aaaaaaaaaaaaaaaaaaaaafffffffffffffffffffffff');
        let data = {}
        data.userid = id
        data.referral_code = referralCodeGenerator.alpha('lowercase', 12)
        console.log(data.referral_code);
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.REFERRAL_COLLETION).findOne({ userid: id })
            if (!user) {

                await db.get().collection(collection.REFERRAL_COLLETION).insertOne(data).then((response) => {
                    resolve(response)
                })
            } else
                reject()
        })
    },
    getreferral: (id) => {
        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.REFERRAL_COLLETION).findOne({ userid: id }).then((response) => {
                console.log(response);

                if (response) {


                    resolve(response)
                } else
                    resolve()
            })
        })
    },
    applyRefferalCode: (data) => {
        return new Promise(async (resolve, reject) => {
            let code = await db.get().collection(collection.REFERRAL_COLLETION).findOne({ referral_code: data.referralCode })
            console.log(code);
            if (code) {
                if (code.userid != data.userid) {
                    let cartCoupon = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(data.userid) })
                    let offer = cartCoupon.coupon - 0.1
                    await db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(data.userid) }, {
                        $set: {
                            coupon: offer
                        }
                    }).then(() => {
                        resolve({ status: true })

                    })

                } else {
                    console.log('failed');
                    resolve({ status: false })

                }
            }
            else {

                console.log('invalid code');
                resolve({ statusInvalid: true })
            }
        })
    },
    getUsedCoupons: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(id) }).then((response) => {

                resolve(response)
            })
        })
    },
    removeOrder: (data, id) => {
        return new Promise(async (resolve, reject) => {
            let order= await db.get().collection(collection.ORDER_COLLETION).findOne({ _id: ObjectId(data.id) })
            console.log(order.status);
            if(order.status=='Pending'){
                await db.get().collection(collection.ORDER_COLLETION).updateOne({ _id: ObjectId(data.id) }, {
                    $set: {
                        status: "cancelled"
                    }
                }).then(()=>{
                    resolve({ status: true })
                })
            }else{

            
            await db.get().collection(collection.ORDER_COLLETION).updateOne({ _id: ObjectId(data.id) }, {
                $set: {
                    status: "cancelled"
                }
            }).then(async () => {
                let user = await db.get().collection(collection.WALLET_COLLETION).findOne({ userid: ObjectId(id) })
                if (user) {
                    let newtotal = parseInt(user.wallet) + parseInt(data.total)
                    await db.get().collection(collection.WALLET_COLLETION).updateOne({ userid: ObjectId(id) }, {
                        $set: {
                            wallet: newtotal
                        }
                    })

                } else {
                    let wallet = {}
                    wallet.userid = ObjectId(id)
                    wallet.wallet = parseInt(data.total)
                    await db.get().collection(collection.WALLET_COLLETION).insertOne(wallet)

                }
                resolve({ status: true })
            }).catch(() => {
                reject({ status: false })
            })
        }
        })
    },
    getWallet: (id) => {
        return new Promise(async (resolve, reject) => {
            let wallet = await db.get().collection(collection.WALLET_COLLETION).findOne({ userid: ObjectId(id) }).then((response) => {
                console.log(response);
                resolve(response?.wallet)
            })
        })
    },
    getWalletcart: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(id) }).then((response) => {
                resolve(response?.wallet)
            })
        })
    },
    addWishList: (data, user) => {
        return new Promise(async (resolve, reject) => {
            try {


                let User = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(user) })
                console.log(User);
                if (User) {
                    console.log('user');
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(user) }, {
                        $push: { product: ObjectId(data.id) }
                    }).then(() => {
                        resolve({ status: true })
                    }).catch(() => {
                        resolve({ status: false })
                    })
                } else {
                    console.log('no user');
                    let wishList = {}
                    wishList.user = ObjectId(user)
                    wishList.product = [ObjectId(data.id)]
                    db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishList).then(() => [
                        resolve({ status: true })
                    ]).catch(() => {
                        resolve({ status: false })
                    })
                }

            } catch (error) {
                resolve({ statusCatch: true })

            }
        })
    },


    getWishList:()=>{
        return new Promise(async(resolve,reject)=>{
            let data= await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $unwind:"$product"
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:"product",
                        foreignField:"_id",
                        as:"products"
                    }
                },
                {
                    $unwind:"$products"
                },
                {
                    $project:{products:1}
                }


            ]).toArray()
     
            resolve(data)
        })
    },
    removeWishList:(data,user)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(user) }, {
                $pull: { product: ObjectId(data.id) }
            }).then(()=>{
                resolve({status:true})
            })
        })
    },
    checkCart:(id)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(id)}).then((response)=>{
                console.log(response);
                if(response){

                    console.log('true');
                    resolve({status:true})
                }else{
                    console.log('false');
                    resolve({status:false})
                }
            })
        })
    }

}