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

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

var transporter = nodemailer.createTransport(config.mail.transport);
var mailoptions = config.mail.options;

const connection = mysql.createConnection(config.mysqldb);

function sendEmail(obj){
	mailoptions.subject="Page change alert for "+obj.friendly_name;
	mailoptions.text="PageWatcher change alert triggered at "+new Date()+" for "+obj.friendly_name+" at URL "+obj.url+" by the PageWatcher instance at "+config.server.host;

	transporter.sendMail(mailoptions, function(error, info){
	});
}

function sendWebhooks(obj){
	for (var i = 0; i < config.webhooks.length; i++) {
		if(config.webhooks[i].method=="GET"){
			request(config.webhooks[i].url+"&"+config.webhooks[i].paramName+"=PageWatcher change alert for "+obj.friendly_name+(config.webhooks[i].url?" check "+obj.url:"!"),function (error, response, last_content){ });
			console.log(config.webhooks[i].url+"&"+config.webhooks[i].paramName+"=PageWatcher change alert for "+obj.friendly_name+(config.webhooks[i].includeUrl?" check "+obj.url:"!"));
		}
	}
}

function sendSyshooks(){

}

function checkForChanges(id){
	console.log('Now checking '+id);
	connection.query(
	  'SELECT * FROM `watchers` WHERE id='+id,
	  function(err, results, fields) {
	  	(function(v,id){
	  		request(v.url, function (error, response, last_content) {
				if(v.last_content!=last_content){
					console.log('Changed!');
					if(v.alert_email){ sendEmail(v); }
					if(v.alert_webhooks){ sendWebhooks(v); }
					if(v.alert_syshooks){ sendSyshooks(v); }
				}else{
					console.log('Not changed!');
				}
			connection.execute('UPDATE `watchers` SET `checked_times`=?,`last_content`=? WHERE id=?', [v.checked_times+1,last_content,id], (err, rows) => { });

			if(v.inexact_timing){
					interval = randomIntFromInterval((v.check_interval-(v.check_interval*(15/100)))*1000,(v.check_interval+(v.check_interval*(15/100)))*1000);
					intervals[v.id] = setTimeout(checkForChanges.bind(null,v.id),interval);
					console.log('Next scheduled check for '+v.id+' in '+interval);
				}else{
					console.log('Next scheduled check for '+v.id+' in '+v.check_interval*1000);
					intervals[v.id] = setTimeout(checkForChanges.bind(null,v.id),v.check_interval*1000);
				}
		});
	  	})(results[0],id)
	  	
	  }
	);
}

function addTimers(par){
	if(!par){
		console.log('Adding timers for stored watchers.');
		connection.query(
		  'SELECT * FROM `watchers`',
		  function(err, results, fields) {
		  	for (var i = 0; i < results.length; i++) {
		  		checkForChanges(results[i].id);
		  	}
		  }
		);
	}else{
		console.log('Adding timer for last added');
		connection.query(
		  'SELECT * FROM `watchers` ORDER BY id DESC',
		  function(err, results, fields) {
		  		if(results[0].inexact_timing){
		  			interval = randomIntFromInterval((results[0].check_interval-(results[0].check_interval*(15/100)))*1000,(results[0].check_interval+(results[0].check_interval*(15/100)))*1000);
		  			intervals[results[0].id] = setTimeout(checkForChanges.bind(null,results[0].id),interval);
		  			console.log('First scheduled check for '+results[0].id+' in '+interval);
		  		}else{
		  			console.log('First scheduled check for '+results[0].id+' in '+results[0].check_interval*1000);
		  			intervals[results[0].id] = setTimeout(checkForChanges.bind(null,results[0].id),results[0].check_interval*1000);
		  		}
		  	}
		);
	}
}

function clearTimers(){
	for (var i = 0; i < intervals.length; i++) {
		if(intervals[i]) clearTimeout(intervals[i]);
		console.log('All timers cleared');
	}
}

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
    request(obj.url, function (error, response, last_content) {
    	connection.execute('INSERT INTO `watchers`(`friendly_name`,`url`,`check_interval`,`inexact_timing`,`add_user`,`add_ip`,`last_content`,`alert_email`,`alert_webhooks`,`alert_syshooks`) VALUES (?,?,?,?,?,?,?,?,?,?)', [obj.friendly_name,obj.url,obj.check_interval,obj.inexact_timing,obj.add_user,obj.add_ip,last_content,obj.alert_email,obj.alert_webhooks,obj.alert_syshooks], (err, rows) => {
		  if(!err){
		  	loadSendAll();
		  	io.emit('ok');
		  	addTimers(1);
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
	  clearTimeout(intervals[parseInt(id)]);
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
addTimers();
