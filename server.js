var fs = require('fs'),
    express = require('express'),
    request = require('request'),
    app = express();

// Load config defaults from JSON file.
// Environment variables override defaults.
function loadConfig() {
    var config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf-8'));
    for (var i in config) {
        config[i] = process.env[i.toUpperCase()] || config[i];
    }
    console.log('Configuration');
    console.log(config);
    return config;
}

var config = loadConfig();

function authenticate(code, callback) {
    var data = {
        client_id: config.oauth_client_id,
        client_secret: config.oauth_client_secret,
        code: code
    };

    const uri = 'https://' + config.oauth_host + config.oauth_path;

    return request({
        uri: uri,
        method: config.oauth_method,
        headers: {'content-length': data.length},
        json: true,
        body: data
    }, callback);
}


// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/authenticate/:code', function (req, res) {
    console.log('authenticating code:' + req.params.code);

    authenticate(req.params.code, function (error, response, data) {
        var result;

        if (error !== null || !data.access_token) {
            console.error(error || 'bad code');
            result = error;
        } else {
            console.log('Access token received:');
            console.log(data);
            result = data;
        }

        res.json(result);
    });
});

var port = process.env.PORT || config.port || 9999;

app.listen(port, null, function (err) {
    console.log('Gatekeeper, at your service: http://localhost:' + port);
});
