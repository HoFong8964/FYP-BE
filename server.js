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
		if (err) throw err;
		var dbo = db.db("ehr");
		dbo.collection("appointment").insertOne(appointment_info, function(err, result) {
			if (err) throw err;
			success_response(res, 'Make Appointment Success');
			db.close();
		});
	});
 })

 app.delete('/cancelAppointment', function(req, res) {
	MongoClient.connect(dbUrl, function(err, db) {
		if (err) throw err;
		var dbo = db.db("ehr");
		var query = { "_id": ObjectId(req.query.id) };
		dbo.collection("appointment").deleteOne(query, function(err, result) {
		  	if (err) throw err;
		  	var response = {
				status  : 200,
				res : result
			}
			res.end(JSON.stringify(response));
			db.close();
		});
	  });
 })
 

 app.get('/getFeatureAppointmentList', function(req, res) {
    MongoClient.connect(dbUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("ehr");
		var today = new Date().toISOString().split('T')[0];

		if(req.query.patientId){
			dbo.collection('appointment').aggregate([
				{
					$match: {
						"patientId": req.query.patientId,
						"appointmentDate": { $gte: today},
					}
				},
				{
					$lookup:
						{
							from: 'physiotherapists',
							localField: 'phyId',
							foreignField: 'id',
							as: 'physiotherapistsDetails'
						}
				},
				{ $sort : { appointmentDate : -1 } }
			]).toArray(function(err, result) {
				if (err) throw err;
				var response = {
					status  : 200,
					res : result
				}
				res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
				res.end(JSON.stringify(response));
				db.close();
			});
		}
		else if (req.query.phyId){
			dbo.collection('appointment').aggregate([
				{
					$match: {
						"phyId": req.query.phyId,
						"appointmentDate": { $gte: today},
					}
				},
				{
					$lookup:
						{
							from: 'users',
							localField: 'patientId',
							foreignField: 'id',
							as: 'patientDetails'
						}
				},
				{ $sort : { appointmentDate : -1 } }
			]).toArray(function(err, result) {
				if (err) throw err;
				var response = {
					status  : 200,
					res : result
				}
				res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
				res.end(JSON.stringify(response));
				db.close();
			});
		}
    });
 })


 app.get('/getMyPatients', function(req, res) {
    MongoClient.connect(dbUrl, function(err,db){
		if (err) throw err;
        var dbo = db.db("ehr");
        if (req.query.phyId){
			dbo.collection('users').aggregate([
				{
					$lookup:
						{
							from: 'appointment',
							localField: 'id',
							foreignField: 'patientId',
							as: 'appointmentDetails'
						}
				},
				{
					$match: {
						"appointmentDetails.phyId": req.query.phyId,
					}
				},
				{
					$project:
						{
							id: 1,
							displayName: 1,
							sex: 1,
							dob: 1,
							idNum: 1,
							phoneNum: 1,
							phyId: 1,
							total: {
								$size: "$appointmentDetails"
						}
					}
				},
			]).toArray(function(err, result) {
				if (err) throw err;
				var response = {
					status  : 200,
					res : result
				}
				res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
				res.end(JSON.stringify(response));
				db.close();
			});
		}
    });
 })

 app.get('/getPastAppointmentList', function(req, res) {
    MongoClient.connect(dbUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("ehr");
		var today = new Date().toISOString().split('T')[0];
        if(req.query.patientId){
			dbo.collection('appointment').aggregate([
				{
					$match: {
						"patientId": req.query.patientId,
						"appointmentDate": { $lte: today},
					}
				},
				{
					$lookup:
						{
							from: 'physiotherapists',
							localField: 'phyId',
							foreignField: 'id',
							as: 'physiotherapistsDetails'
						}
				},
				{ $sort : { appointmentDate : -1 } }
			]).toArray(function(err, result) {
				if (err) throw err;
				var response = {
					status  : 200,
					res : result
				}
				res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
				res.end(JSON.stringify(response));
				db.close();
			});
		}
		else if (req.query.phyId){
			dbo.collection('appointment').aggregate([
				{
					$match: {
						"phyId": req.query.phyId,
						"appointmentDate": { $lte: today},
					}
				},
				{
					$lookup:
						{
							from: 'users',
							localField: 'patientId',
							foreignField: 'id',
							as: 'patientDetails'
						}
				},
				{ $sort : { appointmentDate : -1 } }
			]).toArray(function(err, result) {
				if (err) throw err;
				var response = {
					status  : 200,
					res : result
				}
				res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
				res.end(JSON.stringify(response));
				db.close();
			});
		}
    });
 })

 app.get('/isPatientAuth', function(req, res) {
    MongoClient.connect(dbUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("ehr");

		if(req.query.patientId){
			dbo.collection('appointment').aggregate([
				{
					$match: {
						"patientId": req.query.patientId,
						"phyId": req.query.phyId,
					}
				},
			]).toArray(function(err, result) {
				if (err) throw err;
				var response = {
					status  : 200,
					res : result.length > 0 ? true : false
				}
				res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
				res.end(JSON.stringify(response));
				db.close();
			});
		}
    });
 })

 var server = app.listen(3001, function () {
    var port = server.address().port
   
    console.log("Running in http://loclhost:%s", port)
   
})

app.get('/getPatient', function(req, res) {
    MongoClient.connect(dbUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("ehr");
        dbo.collection('users').aggregate([
			{
				$match: {
					"id": req.query.patientId,
					//"appointmentDate": { $gte: today},
				}
			},
			{
				$lookup:
					{
						from: 'medicalHistory',
						localField: 'id',
						foreignField: 'patientId',
						as: 'medicalHistoryList',
						pipeline: [
						  {
							$sort: {  'date': -1 }
						  },
						],
					}
				
			},
			{
				$lookup:
					{
						from: 'workoutHistory',
						localField: 'id',
						foreignField: 'patientId',
						as: 'workoutHistoryList',
						pipeline: [
						  {
							$sort: {  'startTime': -1 }
						  },
						],
					}
			},
		]).toArray(function(err, result) {
			if (err) throw err;
			var response = {
				status  : 200,
				res : result
			}
			res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
			res.end(JSON.stringify(response));
			db.close();
		});
    });
 })


function success_response(res, msg, data=[]){
	var response = {
		status  : 200,
		message : msg,
		data: data
	}
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