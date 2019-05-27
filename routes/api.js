/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');


const CONNECTION_STRING = process.env.DB;

module.exports = function (app, unirest) {

  MongoClient.connect(CONNECTION_STRING, function(err, db) {
    if (err) {
      return console.log(err)
    }
    
  
    console.log("Succesful Database Connection")
    
       var accessApi = function(stock) {
          return new Promise(function(resolve, reject){
           unirest.get('https://investors-exchange-iex-trading.p.rapidapi.com/stock/'+stock+'/quote')
            .header("X-RapidAPI-Host", "investors-exchange-iex-trading.p.rapidapi.com")
            .header("X-RapidAPI-Key", process.env.API_KEY)
            .end(function (result) {
             return resolve(result.body == 'Unknown symbol' ? 'Please enter a valid stock' : result.body)
            }) 
         })
       }
       
       var dbLikes = function(stock) {
         return new Promise(function(resolve, reject){
           db.collection('stocks').findAndModify(
           {stock: stock},
           {},
           {$setOnInsert: {
             stock: stock, likes: 0, likedBy: []
           }},
           {upsert: true, new: true},
           function(err, doc){
             resolve(doc.value.likes)
           }
         )
         })
       }
       
       


    app.route('/api/stock-prices')
      .get(function (req, res){
        var like = req.query.like;
        var ip = req.ip;
        var stock = req.query.stock;
        var stock1Likes;
        var stock2Likes;
        var resultsArray = [];
      
      
      var twoStocksLiked = function(stock){
        return new Promise(function(resolve, reject){
            db.collection('stocks').findOne({stock: stock.symbol}, function(err, doc){
            
            //stock 1 not in db
            if (doc == null) {
              db.collection('stocks').findAndModify(
                {stock: stock.symbol},
                {},
                {$setOnInsert: {stock: stock.symbol},
                $push: {likedBy: ip},
                 $inc: {likes: 1}
                },
                {upsert: true, new: true},
                function(err, doc){
                  return resolve({stockData: {"stock": stock.symbol, price: (Math.round(stock.latestPrice * 100)/100).toString(), likes: doc.value.likes}})
                }
              )
              return;
            } 
            // console.log(doc)
               //This ip has already liked this stock
          if (doc.likedBy.includes(ip)) {
            return resolve('This user has already liked this stock');
            
          }
                 //Stock in db but has not yet been liked by ip
            db.collection('stocks').findAndModify(
              {stock: stock.symbol},
              {},
              {$push: {likedBy: ip}, $inc: {likes: 1}},
              {new: true}, function(err, doc){
              
              return resolve({stockData: {"stock": stock.symbol, price: (Math.round(stock.latestPrice * 100)/100).toString(), likes: doc.value.likes}})
              }
            )
            
          
          })
        })}
        
  
      
      //query is for two stocks, not liked
      if (typeof stock === 'object' && stock.length === 2 && !req.query.like) {
        
        var stock1 = accessApi(stock[0])
        var stock2 = accessApi(stock[1])
        
       Promise.all([stock1, stock2]).then(function(values){
         resultsArray = values;
         // console.log(resultsArray)
          if (resultsArray.includes('Please enter a valid stock')) {
            return res.send(stock[resultsArray.indexOf('Please enter a valid stock')] + ' is not a valid stock')
        }
         
         //Grab likes from mongodb
         var likes1 = dbLikes(resultsArray[0].symbol)
         var likes2 = dbLikes(resultsArray[1].symbol)
         
         Promise.all([likes1, likes2]).then(function(values){
           stock1Likes = values[0];
           stock2Likes = values[1];
           return res.send({stockData: [{stock: resultsArray[0].symbol, price:(Math.round(resultsArray[0].latestPrice * 100)/100), rel_likes: stock1Likes - stock2Likes},{stock: resultsArray[1].symbol, price:(Math.round(resultsArray[1].latestPrice * 100)/100), rel_likes: stock2Likes - stock1Likes}]})
         })   
       })
        return;
      }
      
      //query is for two stocks and like button selected
      if (typeof stock === 'object' && stock.length === 2 && req.query.like){
        var stock1 = accessApi(stock[0])
        var stock2 = accessApi(stock[1])
        
        Promise.all([stock1, stock2]).then(function(values){
          resultsArray = values;
          // console.log(resultsArray)
           if (resultsArray.includes('Please enter a valid stock')) {
            return res.send(stock[resultsArray.indexOf('Please enter a valid stock')] + ' is not a valid stock')
           }
     
          var stock1Liked = twoStocksLiked(resultsArray[0])
          var stock2Liked = twoStocksLiked(resultsArray[1])
          
          Promise.all([stock1Liked, stock2Liked]).then(function(values){
            if (values.includes('This user has already liked this stock')) {
              return res.send('This user has already liked ' + stock[values.indexOf('This user has already liked this stock')])
            }
            let like1 = dbLikes(values[0].stockData.stock)
            let like2 = dbLikes(values[1].stockData.stock)
             Promise.all([like1, like2]).then(function(likes){
               stock1Likes = likes[0];
               stock2Likes = likes[1]
           return res.send({stockData: [{stock: resultsArray[0].symbol, price:(Math.round(resultsArray[0].latestPrice * 100)/100), rel_likes: stock1Likes - stock2Likes},{stock: resultsArray[1].symbol, price:(Math.round(resultsArray[1].latestPrice * 100)/100), rel_likes: stock2Likes - stock1Likes}]})
             })
            
          })
        })
      }
      
      
  
    
      
      //Only one stock and liked
      if (req.query.like && typeof stock !== 'object') {
        accessApi(stock).then(function(successObj){
          if (successObj == 'Please enter a valid stock'){
            return res.send(stock + ' is not a valid stock')
          }
       
          db.collection('stocks').findOne({stock: successObj.symbol}, function(err,doc){
            
            //If stock is not yet in db
            if (doc == null) {
             db.collection('stocks').findAndModify(
           {stock: successObj.symbol},
           {},
           {$setOnInsert: {
            stock: successObj.symbol},
           $push: {likedBy: ip},
           $inc: {likes: 1}}, 
           {upsert: true, new: true}, function(err, doc){
             if (err){
               return console.log(err)
             }
            return res.json({stockData: {"stock": successObj.symbol, price: (Math.round(successObj.latestPrice * 100)/100).toString(), likes: doc.value.likes}})
           })
             return;
            }
            
          //This ip has already liked this stock
          if (doc.likedBy.includes(ip)) {
            return res.send('This user has already liked this stock')
          }
            
            //Stock in db but has not yet been liked by ip
            db.collection('stocks').findAndModify(
              {stock: successObj.symbol},
              {},
              {$push: {likedBy: ip}, $inc: {likes: 1}},
              {new: true}, function(err, doc){
                if (err){
                  return console.log(err)
                }
                return res.json({stockData: {"stock": successObj.symbol, price: (Math.round(successObj.latestPrice * 100)/100).toString(), likes: doc.value.likes}})
              }
            )
          })
        })
      }

      //Only one stock and not liked
      if (!req.query.like){
          accessApi(stock).then(function(successObj) {
            // console.log(successObj)
         db.collection('stocks').findAndModify(
           {stock: successObj.symbol},
           {},
           {$setOnInsert: {
            stock: successObj.symbol, likes: 0, likedBy: []}}, 
           {upsert: true, new: true}, function(err, doc){
           if (err) {
             return console.log(err)
           }
           if (isNaN(successObj.iexRealtimePrice)) {
             return res.send(stock + ' is not a valid stock')
           }  
           res.json({stockData: {"stock": successObj.symbol, price: (Math.round(successObj.latestPrice * 100)/100).toString(), likes: doc.value.likes}})
         })
       })
      }
    
        })
    
  });
  
};


    

