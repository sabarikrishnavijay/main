
const mongoClient=require('mongodb').MongoClient
const state={
    db:null  

}

module.exports.connect=function(done){
   
  //  const url="mongodb+srv://sabri:1212345456@cluster0.mxw3dih.mongodb.net/?retryWrites=true&w=majority"
    const url=process.env.db
    const dbname='beyoung'
 
    mongoClient.connect(url,(err,data)=>{  
        if(err) return done(err)
        state.db=data.db(dbname) 
        done()
    })
 
   

}
 

module.exports.get=function(){ 
    return state.db
}