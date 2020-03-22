const mysql = require('mysql2'),
	  app = require('express')(),
	  fs = require('fs'),
	  basicAuth = require('express-basic-auth'),
	  nodemailer = require('nodemailer'),
	  request = require('request'),
	  http = require('http').createServer(app),
	  io = require('socket.io')(http),
	  config = JSON.parse(fs.readFileSync('conf/pw.json')),
	  atob = require("atob"),
	  port = config.server.port;

var intervals = [];

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
  console.log('Web client connected');
  loadSendAll();
  socket.on('disconnect', function(){
    console.log('Web client disconnected');
  });
  socket.on('add', function(data){
    var obj = {
    	friendly_name: "",
		url: "",
		check_interval: 0,
		inexact_timing: 0,
		add_user: atob(socket.handshake.headers.authorization.split(' ')[1]).split(':')[0],
		add_ip: socket.handshake.headers['x-forwarded-for']?socket.handshake.headers['x-forwarded-for']:socket.handshake.address,
		last_content: "",
		alert_email: 0,
		alert_webhooks: 0,
		alert_syshooks: 0
    }
    for (var i = 0; i < data.length; i++){
    	if(data[i].name.indexOf('alert_')!=-1||data[i].name.indexOf('inexact')!=-1){
    		obj[data[i].name] = data[i].value=="on"?1:0;
    	} else obj[data[i].name] = data[i].value;
    }
    request('http://www.google.com', function (error, response, last_content) {
    	connection.execute('INSERT INTO `watchers`(`friendly_name`,`url`,`check_interval`,`inexact_timing`,`add_user`,`add_ip`,`last_content`,`alert_email`,`alert_webhooks`,`alert_syshooks`) VALUES (?,?,?,?,?,?,?,?,?,?)', [obj.friendly_name,obj.url,obj.check_interval,obj.inexact_timing,obj.add_user,obj.add_ip,last_content,obj.alert_email,obj.alert_webhooks,obj.alert_syshooks], (err, rows) => {
		  if(!err){
		  	loadSendAll();
		  	io.emit('ok');
		  }else{
		  	io.emit('error');
		  	console.log(err);
		  }
		});
	});
  });
  socket.on('update', function(data){
    var obj = {
    	friendly_name: "",
		url: "",
		check_interval: 0,
		inexact_timing: 0,
		add_user: atob(socket.handshake.headers.authorization.split(' ')[1]).split(':')[0],
		add_ip: socket.handshake.headers['x-forwarded-for']?socket.handshake.headers['x-forwarded-for']:socket.handshake.address,
		last_content: "",
		alert_email: 0,
		alert_webhooks: 0,
		alert_syshooks: 0,
		itemid: null
    }
    for (var i = 0; i < data.length; i++){
    	if(data[i].name.indexOf('alert_')!=-1||data[i].name.indexOf('inexact')!=-1){
    		obj[data[i].name] = data[i].value=="on"?1:0;
    	} else obj[data[i].name] = data[i].value;
    }
    connection.execute('UPDATE `watchers` SET `friendly_name`=?,`url`=?,`check_interval`=?,`inexact_timing`=?,`alert_email`=?,`alert_webhooks`=?,`alert_syshooks`=? WHERE id=?', [obj.friendly_name,obj.url,obj.check_interval,obj.inexact_timing,obj.alert_email,obj.alert_webhooks,obj.alert_syshooks,obj.itemid], (err, rows) => {
	  if(!err){
	  	loadSendAll();
	  	io.emit('ok');
	  }else{
	  	io.emit('error');
	  	console.log(err);
	  }
	});
  });
  socket.on('delete', function(id){
	connection.execute('DELETE FROM `watchers` WHERE id = ?', [id], (err, rows) => {
	  if(!err){
	  	loadSendAll();
	  	io.emit('ok');
	  }else{
	  	io.emit('error');
	  	console.log(err);
	  }
	});
  });
});

http.listen(port, () => console.log(`Pagewatcher app listening on port ${port}!`))
