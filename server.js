const http = require('http');
const fs = require("fs");
const qs = require("querystring");
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const app = express();
const axios = require('axios');
const { stringify } = require('querystring');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require('mongodb').ObjectId;
const dbUrl = "mongodb+srv://admin:Qq123ww@fyp.nubdk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

var jsonParser = bodyParser.json();

app.use(cors());
app.post('/login', jsonParser, function (req, res) {
    const crypto = require('crypto')
	const md5sum = crypto.createHash('md5');
	let password = md5sum.update(req.body.password).digest('hex');

	var login_info = {
		'account': req.body.login,
		'password': password
	};

	//console.log("login_info: ", login_info);
    MongoClient.connect(dbUrl, function(err,db){
        console.log("err: ", err);
        if (err) throw err;
        var dbo = db.db("ehr");
        dbo.collection("users").findOne(login_info).then(result => {
            if(result){
                success_response(res, 'Login Success', result);
            } else {
                error_response(res, 'The login or password is not correct');
            }
            db.close();
          })
    });
 })

 app.post('/phyLogin', jsonParser, function (req, res) {
    const crypto = require('crypto')
	const md5sum = crypto.createHash('md5');
	let password = md5sum.update(req.body.password).digest('hex');

	var login_info = {
		'account': req.body.login,
		'password': password
	};
    MongoClient.connect(dbUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("ehr");
        dbo.collection("physiotherapists").findOne(login_info).then(result => {
            if(result){
                success_response(res, 'Login Success', result);
            } else {
                error_response(res, 'The login or password is not correct');
            }
            db.close();
          })
    });
 })

 app.get('/physiotherapists', function(req, res) {
	var query = {};
	var limit = 1000;
    MongoClient.connect(dbUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("ehr");
        dbo.collection("physiotherapists").find(query).sort({"displayName": 1}).limit(limit).toArray(function(err, result) {
			var response = {
				status  : 200,
				res : result
			}
			console.log(response);
			res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
			res.end(JSON.stringify(response));
		});
    });
 })

 app.post('/makeAppointment', jsonParser, function (req, res) {
	var appointment_info = {
		'patientId': req.body.patientId,
		'phyId': req.body.phyId,
		'appointmentDate': req.body.appointmentDate,
		'appointmentTime': req.body.appointmentTime,
		'remarks': req.body.remarks,
	};
    MongoClient.connect(dbUrl, function(err,db){
		console.log("err: ", );
		if (err) throw err;
		var dbo = db.db("ehr");
		dbo.collection("appointment").insertOne(appointment_info, function(err, result) {
			if (err) throw err;
			success_response(res, 'Make Appointment Success');
			db.close();
		});
	});
 })

 var server = app.listen(3001, function () {
    var port = server.address().port
   
    console.log("Running in http://loclhost:%s", port)
   
})


function success_response(res, msg, data=[]){
	var response = {
		status  : 200,
		message : msg,
		data: data
	}
	console.log(response);
	res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
	res.end(JSON.stringify(response));
}

function error_response(res, msg){
	var response = {
		status  : 500,
		message : msg
	}
	console.log(response);
	res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
	res.end(JSON.stringify(response));
}