/**
 * Created by amotro on 10/20/15.
 */
var request = require('request');
var async = require('async');

module.exports = {

    moreLikeThis: function (server) {
        server.get('/assets/:assetId', function (req, res, next) {
            var assetId = req.params.assetId;
            getAsset(assetId, function (error, result) {
                if (!error) {
                    res.send(result);
                }
                next();
            });
        });
        server.on('uncaughtException', function (req, res, route, error) {
            console.log(error);
        });
    }
}

function getAsset(assetId, callback) {
    request('http://presentation-api.production.gannettdigital.com/v4/assets/' + assetId + '?consumer=morelikethis&transform=full&includeFields=title', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var parsed = JSON.parse(body);
            getSolrResults(parsed.title, function (error, title, result) {
                processSolrResults(title, result, function (error, moreLikeThisResults) {
                    callback(null, moreLikeThisResults);
                })
            });
        }
    });
}

function getAimeAsset(assetId, callback){
    request('http://aimeasset.gmti.gbahn.net/aime/AssetsService.svc/asset/' + assetId, function(error, response, body){
        if(!error && response.statusCode == 200){
            var parsed = JSON.parse(body);
            var newAsset = {};
            newAsset['id'] = parsed['id'];
            if ('headline' in parsed){
                newAsset['title'] = parsed['headline']
            }
            else if('attributes' in parsed){
                if('caption' in parsed['attributes']){
                    newAsset['title'] = parsed['attributes']['caption'];
                }
            }
            callback(newAsset);

        }
    });

}

function getPresentationAssets(assetString, presentationCallback) {
    var returnedValues = [];
    var url = 'http://presentation-api.production.gannettdigital.com/v4/assets/' + assetString + '?consumer=morelikethis&transform=full&includeFields=title,id';
    request(url, function (error, response, body) {
        if (error) {
            console.log(error);
        }
        if (!error && response.statusCode == 200) {
            var parsed = JSON.parse(body);
            var result = parsed['assets'].reduce(function (a, b) {
                return a.concat(b);
            }, []);
            async.each(result, function (assetIterator, aimeCallback) {
                if ('error' in assetIterator) {
                    var regex = /^document asset_([0-9\.]+) not found in couchbase$/;
                    var assetId = (assetIterator['error'].match(regex))[1];
                    getAimeAsset(assetId, function (a) {
                        returnedValues.push(a);
                        aimeCallback();
                    });
                }
                else {
                    returnedValues.push(assetIterator);
                    aimeCallback();
                }
            }, function (err) {
                presentationCallback(returnedValues);
            });
        }

    });
}


function processSolrResults(title, moreLikeThisResults, done) {
    var returnedValues = [];
    async.each(moreLikeThisResults, function (moreLikeThisItem, callback) {
        if (typeof(moreLikeThisItem) == 'object') {
            var docs = moreLikeThisItem.docs;
            var assetString = (docs.reduce(function (a, b) {
                return a.concat(b['assetid']);
            }, [])).join(',');
            getPresentationAssets(assetString, function (a) {
                returnedValues = returnedValues.concat(a);
                callback();
            });
        }
        else {
            callback();
        }
    }, function (err) {
        Array.prototype.unique = function() {
            var a = [], l = this.length;
            for(var i=0; i<l; i++) {
                for(var j=i+1; j<l; j++)
                    if (this[i]['id'] === this[j]['id']) j = ++i;
                a.push(this[i]);
            }
            return a;
        };

        var returnedObject = {'Requested Asset Title': title, 'Related Assets': returnedValues.unique()};
        done(null, returnedObject);
    });
}


function getSolrResults(title, callback) {
    request('http://152-1249-scalr.production.gannettdigital.com:8983/solr/assets/query?q=' + encodeURI(title) + '&mlt=true&mlt.fl=fulltext%20title&mlt.mintf=1&fl=assetid&mlt.qf=&defType=edismax&rows=5&fq=siteid:1', function (error, response, body) {
        var parsed = JSON.parse(body);
        callback(null, title, parsed.moreLikeThis);
    });
}