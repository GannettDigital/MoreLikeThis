/**
 * Created by amotro on 10/20/15.
 */
var restify = require('restify');
var http = require('http');
var morelikethis = require('./lib/morelikethis.js');

var ip_address = '127.0.0.1';
var port = '8983';

var server = restify.createServer({
    name : "MoreLikeThis"
})

http.globalAgent.maxSockets = 1000;

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

morelikethis.moreLikeThis(server);

server.listen(port, ip_address, function(){
    console.log('%s listening at %s ', server.name, server.url);
});

