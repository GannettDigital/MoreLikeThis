/**
 * Created by amotro on 10/20/15.
 */
var restify = require('restify');
var morelikethis = require('./lib/morelikethis.js');

var ip_address = '127.0.0.1';
var port = '8080';

var server = restify.createServer({
    name : "MoreLikeThis"
})

server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

morelikethis.moreLikeThis(server);

server.listen(port, ip_address, function(){
    console.log('%s listening at %s ', server.name, server.url);
});

