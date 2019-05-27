/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData', 'Should contain property stockData');
          assert.property(res.body.stockData, 'likes', 'Should contain likes')
          assert.equal(res.body.stockData.stock, 'GOOG')
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: 'goog', like: true})
         .end(function(err, res){
           assert.equal(res.status, 200)
           assert.equal(res.body.stockData.stock, 'GOOG')
           assert.equal(res.body.stockData.likes, 1)
          done();
        })
      });
  
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: 'goog', like: true})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.equal(res.text, 'This user has already liked this stock')
          done();
        })
      });
    
      test('2 stocks', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: ['goog', 'msft']})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isArray(res.body.stockData, 'Response should be an array');
           assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.equal(res.body.stockData[1].stock, 'MSFT');
          assert.property(res.body.stockData[0], 'rel_likes', 'Each stock should have rel_likes property')
          assert.property(res.body.stockData[1], 'rel_likes', 'Each stock should have rel_likes property')
          done();
        })
      
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: ['bby', 'amzn'], like: true})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isArray(res.body.stockData, 'Response should be an array');
           assert.equal(res.body.stockData[0].stock, 'BBY');
           assert.equal(res.body.stockData[1].stock, 'AMZN');
           assert.property(res.body.stockData[0], 'rel_likes', 'Each stock should have rel_likes property')
           assert.property(res.body.stockData[1], 'rel_likes', 'Each stock should have rel_likes property')
           done();
        })
      });
      
    });

});

