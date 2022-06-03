
var db = require('../config/connection')
var collection = require('../config/collection');
const { ObjectId } = require('mongodb');
const { promise, reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const { response, disabled } = require('../app');
const res = require('express/lib/response');
const { payment } = require('paypal-rest-sdk');
var objectId = require('mongodb').ObjectId


module.exports = {
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = db.get().collection(collection.USER_COLLECTION).find().toArray();
            resolve(users)
        })
    },
    deleteUser: (userId) => {
        return new Promise(async (resolve, reject) => {
          await  db.get().collection(collection.USER_COLLECTION).deleteOne({ _id:objectId(userId) }).then((response) => {
              console.log(response);
                resolve({status:true})
            })
        })

    },
    editUserData: (userId, userData) => {
        console.log(userData);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    status: userData.status

                }
            }).then((response) => {
                resolve()
            })
        })

    },
    getAllUsersData: (userId) => {
        return new Promise(async (resolve, reject) => {
            let users = db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((response) => {
                resolve(response)
            })

        })
    },
    userStatus: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                if (user.status == "active") {
                    console.log('active user');
                    response.status = true
                    resolve(response)
                } else {
                    console.log('@@@@@@@@@@@@@blocked user');
                    response.block = true
                    resolve(response)
                }
            }
            else {
                console.log('blocked user');

                resolve({ status: false })
            }
        })


    },
    Category: (data) => {
        return new Promise(async (resolve, reject) => {
            data.offers = parseInt(data.offers)
            db.get().collection(collection.CATAGORY_COLLECTION).insertOne(data).then((response) => {
                resolve(response)
                console.log(response);
            })

        })

    },
    getCatagory: () => {
        return new Promise(async (resolve, reject) => {
            let catagory = db.get().collection(collection.CATAGORY_COLLECTION).find().toArray()
            resolve(catagory)
        })
    },
    deleteCatagory: (dataId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATAGORY_COLLECTION).remove({ _id: objectId(dataId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getCatagoryView: () => {
        return new Promise(async (resolve, reject) => {
            let item = db.get().collection(collection.CATAGORY_COLLECTION).find().toArray()
            resolve(item)

        })


    },
    addProducts: (body, files) => {
        body.images = files
        body.Price = parseInt(body.Price)
        return new Promise(async(resolve, reject) => {
           await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(body)
            await db.get().collection(collection.PRODUCT2_COLLECTION).insertOne(body).then((response) => {
               
                resolve(response);
            })
        })


    },
    getProducts: () => {
        return new Promise((resolve, reject) => {
            let product = db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },

    deleteProduct: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).remove({ _id: objectId(id) })
            resolve()
            console.log('removed success');

        })
    },
    getProdduct: (id) => {
        return new Promise((resolve, reject) => {
            let product = db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) })
            resolve(product)
        })
    },
    updateProductWithFiles: (id, files) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT2_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    images: files

                }
            }).then(() => {
                resolve()
            })
        })

    }, updateProduct: (id, body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT2_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    Name: body.Name,
                    Catagory: body.Catagory,
                    price: body.Price,
                    Description: body.Description


                }
            }).then(() => {
                resolve()
            })
        })

    },
    getOrderList: () => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLETION).aggregate([
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
            ]).toArray()
            resolve(order)
        })
    },
    deleteOrder: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLETION).remove({ _id: ObjectId(id) }).then(() => {
                console.log('removed');
                resolve()
            })
        })
    },
    updateStatusOrder: (data) => {
        console.log(data);
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLETION).updateOne({ _id: ObjectId(data.orderId) }, {
                $set: { status: data.value }
            }).then((response) => {
                console.log(response);
                resolve(response)
            })

        })
    },
    totalRevanu: () => {
        let response = {}
        return new Promise(async (resolve, resject) => {
            total = await db.get().collection(collection.ORDER_COLLETION).aggregate([

                {
                    $match: {


                        "status": { $nin:[ "cancelled","Pending" ]}



                    },
                },

                {
                    $group: {
                        _id: null,
                        revenu: { $sum: "$total" }
                    }
                }

            ]).toArray()
            console.log(total[0].revenu);
            response.totalRevenu = total[0].revenu


            totalOrder = await db.get().collection(collection.ORDER_COLLETION).aggregate([
                { $count: "total-orders" }
            ]).toArray()
            console.log(totalOrder[0]['total-orders']);
            response.totalorder = totalOrder[0]['total-orders']


            totalSale = await db.get().collection(collection.ORDER_COLLETION).aggregate([
                {
                    $unwind: "$products"
                },
                {
                    $project: { products: 1 }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$products.quantity" }


                    }
                }
                ,

            ]).toArray()
            console.log(totalSale[0].total);
            response.totalsale = totalSale[0].total


            let status = await db.get().collection(collection.ORDER_COLLETION).aggregate([{
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }]).toArray()
            console.log(status);
            let arr2 = status
            let result2 = arr2.reduce(function (r, e) {
                r[e._id] = e.count;
                return r;
            }, {});
            console.log(result2);
            response.status = result2
            let payment = await db.get().collection(collection.ORDER_COLLETION).aggregate([{
                $group: {
                    _id: "$paymentMethod"
                    ,
                    count: { $sum: 1 }

                }
            }]).toArray()
            console.log(payment);
            let arr = payment
            let result = arr.reduce(function (r, e) {
                r[e._id] = e.count;
                return r;
            }, {});
            console.log(result);

            response.payment = result



            resolve(response)
        })


    },
    addBanner: (data) => {
        return new Promise((resolve, reject) => {
            let image = {}
            image.name = data.filename
            console.log(image);
            db.get().collection(collection.BANNER_COLLETION).insertOne(image).then(() => {

                resolve()
            })
        })
    },

    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLETION).find().sort({ name: -1 }).toArray()
            resolve(banner)
        })
    },
    delectBanner: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLETION).remove({ _id: ObjectId(data) }).then(() => {
                resolve({status:true})
            })
        })
    },

    getDailyData: () => {
        return new Promise(async (resolve, reject) => {
            let dailySales = await db
                .get()
                .collection(collection.ORDER_COLLETION)
                .aggregate([
                    {
                        $match: {


                            "status": { $nin:[ "cancelled","Pending" ]}




                        },
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            totalAmount: { $sum: "$total" },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },
                ])
                .toArray();

            console.log(dailySales);
            resolve(dailySales);
        });

    },
    getMonthlyData: () => {
        return new Promise(async (resolve, reject) => {
            let monthlySales = await db
                .get()
                .collection(collection.ORDER_COLLETION)
                .aggregate([
                    {
                        $match: {

                            "status": { $nin:[ "cancelled","Pending" ]}




                        },
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                            totalAmount: { $sum: "$total" },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },

                ])
                .toArray();
            console.log('................................................................................');
            console.log(monthlySales);
            resolve(monthlySales);
        });

    },
    getYearlyData: () => {
        return new Promise(async (resolve, reject) => {
            let yearlySales = await db
                .get()
                .collection(collection.ORDER_COLLETION)
                .aggregate([
                    {
                        $match: {


                            "status": { $nin:[ "cancelled","Pending" ]}




                        },
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y", date: "$date" } },
                            totalAmount: { $sum: "$total" },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },

                ])
                .toArray();
            console.log("year");
            console.log(yearlySales);
            resolve(yearlySales);
        });
    },
    addCouponToDataBase: (data) => {
        data.percentage = parseInt(data.percentage)
        return new Promise((resolve, resject) => {
            db.get().collection(collection.COUPON_COLLETION).insertOne(data).then(() => {
                resolve()
            })
        })

    },
    getCoupon: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPON_COLLETION).find().toArray().then((response) => {
                resolve(response)
            })
        })
    },
    applyCoupon: (data) => {
        return new Promise(async (resolve, reject) => {




            let coupon = await db.get().collection(collection.COUPON_COLLETION).findOne({ coupon: data.enteredcoupon })

            if (coupon) {
                let date = new Date()
                date = date.toISOString().split('T')[0]
                console.log(date);
                if (date < coupon.endoffer) {
                    let response = {}

                    let offer = parseInt(coupon.percentage) / 100 // change into point value lessthan 1 .

                    let offerprice = 1 - offer //1 is the default value in cart at coupon.
                    console.log(offerprice);
                    await db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(data.userid) }, {

                        $set: {
                            coupon: offerprice,
                            couponName: coupon.coupon,
                            couponnum: 1
                        }

                    }).then(async () => {



                        response.status = true
                        resolve(response)
                    })

                } else {
                    console.log('no coupon');
                    resolve({ status: false })
                }







            }
            else {
                console.log('no coupon');
                resolve({ status: false })
            }


        })
    },
    removeCoupon: (id) => {
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(id) }, {
                $set: {
                    coupon: 1,
                    couponName: "",
                    couponnum: 0

                }
            }).then((response) => {
                console.log(response);
                resolve({ status: true })
            })

        })
    },
    checkUsedCoupon: (data) => {
        return new Promise(async (resolve, reject) => {
            let used = await db.get().collection(collection.USED_CODE_COLLETION).aggregate([
                {
                    $unwind: "$coupon"
                },


                {
                    $match: { userID: ObjectId(data.userid) },


                },
                {
                    $match: { coupon: data.enteredcoupon }
                }
            ]).toArray().then((response) => {

                console.log(response);
                if (response.length == 0)
                    resolve({ status: true })
                else {
                    resolve({ usedStatus: true })
                }
            })

        })
    },
    updateOffers: (data) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT2_COLLECTION).aggregate([
                {
                    $match: { Catagory: data.data }
                }, {
                    $lookup: {
                        from: collection.CATAGORY_COLLECTION,
                        localField: "Catagory",
                        foreignField: "Name",
                        as: "offers"
                    }
                },
                {
                    $unwind: "$offers"
                }
            ]).toArray()
            console.log(product);

            product.map(async (value, index) => {
                let id = value._id

                let offer = 1 - (value.offers.offers / 100)
                let actualPrice = value.Price
                let offerPrice = parseInt(offer * value.Price)
                await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: ObjectId(id) }, {
                    $set: {
                        Price: offerPrice,
                        actualPrice: actualPrice,

                    }
                });

            })
            resolve()

        })
    },
    deleteCoupon: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLETION).deleteOne({ _id: ObjectId(id) }).then(() => {
                resolve({status:true})
            })
        })
    }


}
