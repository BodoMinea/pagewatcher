const mysql = require('mysql2'),
	  app = require('express')(),
	  fs = require('fs'),
	  basicAuth = require('express-basic-auth'),
	  nodemailer = require('nodemailer'),
	  request = require('request'),
	  http = require('http').createServer(app),
	  io = require('socket.io')(http),
	  config = JSON.parse(fs.readFileSync('conf/pw.json')),
	  port = config.server.port;

app.use(basicAuth({
    users: config.users,
    challenge: true,
    realm: "Pagewatcher"
}))

var transporter = nodemailer.createTransport(config.mail.transport);
var mailoptions = config.mail.options;

const connection = mysql.createConnection(config.mysqldb);

/* transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                   process.exit();
                } else {
                   process.exit();
                }
        }); */

app.get('*', function(req, res) {
    res.sendFile('app/index.html', { root: __dirname });
})

function loadSendAll(){
	connection.query(
	  'SELECT * FROM `watchers`',
	  function(err, results, fields) {
	  	io.emit('data',results);
	  }
	);
}

io.on('connection', function(socket){
  console.log('Connected');
  loadSendAll();
  socket.on('disconnect', function(){
    console.log('Disconnected');
  });
});

http.listen(port, () => console.log(`Pagewatcher app listening on port ${port}!`))
