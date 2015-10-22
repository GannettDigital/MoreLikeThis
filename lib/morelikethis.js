/**
 * Created by amotro on 10/20/15.
 */
var http = require('http');

module.exports = {

    moreLikeThis: function (server) {
        server.get('/assets/:assetId', function (req, res, next) {
            var assetId = req.params.assetId;
            var asset = getAsset(assetId, function (error, result) {
                res.send(result);
                next();
            });
        });
        server.on('uncaughtException', function (req, res, route, error) {
            console.log(error);
        });
    }
}

function getAsset(assetId, callback) {
    console.log('retrieving asset from presentation api');
    http.get({
        host: 'presentation-api.production.gannettdigital.com',
        path: '/v4/assets/' + assetId + '?consumer=morelikethis&transform=full',
        method: 'GET'
    }, function (response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            getSolrResults(parsed.shortHeadline, function (error, headline, result) {
                processSolrResults(headline, result, function (error, docs) {
                        callback(null, docs);
                    }
                )
            });
        });
    });
}

function processSolrResults(headline, docs, callback) {
    console.log('processing solr results');
    var returnedValues = [];
    for(var i=0; i<docs.length; i++){
        var addedAsset = {};
        addedAsset['id'] = docs[i].assetid;
        addedAsset['type'] = docs[i].assettypename;
        addedAsset['title'] = docs[i].promobrief;
        returnedValues.push(addedAsset);
    }
    var returnedObject = {'Requested Asset Title': headline, 'Related Assets': returnedValues};
    callback(null, returnedObject);

}


function getSolrResults(headline, callback) {
    console.log('making call to solr');
    http.get({
        host: '152-1249-scalr.production.gannettdigital.com',
        port: 8983,
        path: '/solr/assets/query?q=' + encodeURI(headline) + '&mlt=true&mlt.fl=text&rows=100&fq=siteid:1',
        method: 'GET'
    }, function (response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            console.log('finished call to solr');
            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            callback(null, headline, parsed.response.docs);
        });
    });

}