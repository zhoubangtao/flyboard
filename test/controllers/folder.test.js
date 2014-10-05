'use strict';var app = require('../../src/app');var request = require('supertest');var promisedRequest = require('supertest-as-promised');var Record = require('../../src/logicals/record');var DataSource = require('../../src/logicals/dataSource');var Project = require('../../src/logicals/project');var Folder = require('../../src/logicals/folder');var Promise = require('bluebird');var knex = require('../../src/lib/knex');describe('folder controller', function(){    var projectId = null;    var dataSourceId = null;    var parentFolderId = null;    var childrenFolderIds = [];    var recordId = null;    before(function (done) {        Project.save({name: 'ape'}).then(function (id) {            projectId = id;        }).then(function () {            return Folder.save({                name: 'f1',                project_id: projectId            });        }).then(function (id) {            parentFolderId = id;            return Promise.all([                Folder.save({                    name: 'f2',                    project_id: projectId,                    parent_id: parentFolderId                }),                Folder.save({                    name: 'f3',                    project_id: projectId,                    parent_id: parentFolderId                })            ]);        }).then(function (ids) {            childrenFolderIds = ids;            return DataSource.save({                name: 'loginUser',                key: 'loginUser',                project_id: projectId,                folder_id: childrenFolderIds[0]            });        }).then(function (id) {            dataSourceId = id;            return Record.save({                data_source_id: dataSourceId,                value: 98,                year: 2014,                month: 6,                day: 28            });        }).then(function (id) {            recordId = id;            done();        }).catch(done);    });    after(function (done) {        return Promise.all([            knex('records').del(),            knex('data_sources').del(),            knex('projects').del(),            knex('folders').del()        ]).then(function () {            done();        }).catch(done);    });    describe('GET /api/folders/:id', function (){       it('should return a folder', function(done){           request(app)               .get('/api/folders/' + parentFolderId)               .expect('content-type', /json/)               .expect(200, done);       });   });    describe('GET /api/folders', function (){        it('should return folder list', function(done){            request(app)                .get('/api/folders')                .expect('content-type', /json/)                .expect(200, done);        });    });    describe('GET /api/folders/:parent_id/folders', function (){        it('should return folder list', function(done){            request(app)                .get('/api/folders/' + parentFolderId +  '/folders')                .expect('content-type', /json/)                .expect(200, done);        });    });    describe('POST /api/folders', function(){        it('should create a folder', function (done){           request(app)               .post('/api/folders')               .send({                   name: '登录',                   project_id: projectId               })               .expect(200)               .expect('content-type', /json/)               .end(done);        });        it('should create a folder', function (done){            request(app)               .post('/api/folders')               .send({                   name: '注册',                   project_id: projectId,                   parent_id:parentFolderId               })               .expect(200)               .expect('content-type', /json/)               .end(done);            });    });    describe('PUT /api/folders/:id', function () {        it('should update a folder', function(done){            request(app)                .put('/api/folders/' + parentFolderId)                .send({                    name: 'login'                })                .expect(200)                .expect('content-type', /json/)                .end(done);        });    });    describe('DELETE /api/folders/:id', function (){        it('should delete a folder', function(done){            request(app)                .delete('/api/folders/' + childrenFolderIds[0])                .expect(200)                .end(function (err){                    if(err){                        return done(err);                    }                    request(app)                        .get('/api/data_sources/' + dataSourceId)                        .expect(200)                        .end(done);                });        });        it('should delete a folder recursively', function(done){            request(app)                .delete('/api/folders/' + parentFolderId + '?recursive=true')                .expect(200)                .end(function (err){                    if(err){                        return done(err);                    }                    promisedRequest(app)                        .get('/api/folders/' + parentFolderId)                        .expect('content-type', /json/)                        .expect(404)                        .then(function () {                            return promisedRequest(app)                                .get('/api/folders/' + childrenFolderIds[0])                                .expect('content-type', /json/)                                .expect(404);                        }).then(function () {                            return promisedRequest(app)                                .get('/api/data_sources/' + dataSourceId)                                .expect('content-type', /json/)                                .expect(404);                        }).then(function () {                            return promisedRequest(app)                                .get('/api/records/' + recordId)                                .expect('content-type', /json/)                                .expect(404);                        }).then(function () {                            done();                        });                });        });    });});