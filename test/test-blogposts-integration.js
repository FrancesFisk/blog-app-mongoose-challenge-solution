'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      // REVIEW THIS
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];
  for (let i = 1; i <= 10; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    });
  }
  return BlogPost.insertMany(seedData);
}

describe('blog posts API resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  beforeEach(function() {
    return seedBlogPostData();
  });
  afterEach(function() {
    return tearDownDb();
  });
  after (function() {
    return closeServer();
  });

  // GET
  describe('GET endpoint', function() {
    it('it should return all existing posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(_res => {
          res = _res;
          res.should.have.status(200);
          res.body.should.have.lengthOf.at.least(1);

          return BlogPost.count();
        })
        .then(count => {
          res.body.should.have.lengthOf(count);
        });
    });

    it('should return posts with correct fields', function() {
      let resPost;
      return chai.request(app)
      .get('/posts')
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.have.lengthOf.at.least(1);

        res.body.forEach(function(post) {
          post.should.be.a('object');
          post.should.include.keys('id', 'title', 'content', 'author', 'created');
        });
        // check one of the posts that its values match with those in db and assume it's true for the rest
        resPost = res.body[0];
        return BlogPost.findById(resPost.id);
      })
        .then(post => {
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.equal(post.authorName);
        });
    });
  });

  // POST
  describe('POST endpoint', function() {
    it('should add a new blog post', function() {
      // make a POST request with data
      const newPost = {
        title: faker.lorem.sentence(),
        author: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
        },
          content: faker.lorem.text()
      };

      return chai.request(app)
      // send newPost to /post 
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'content', 'author', 'created');
          res.body.title.should.equal(newPost.title);
          // Mongo should have created id on insertion
          return BlogPost.findById(res.body.id);
        })
      // compare newPost to BlogPost.findById(res.body.id)
        .then(function(post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });

  // PUT
  describe('PUT endpoint', function() {
    it('should update fields you send over', function() {
      // create updated data
      const updateData = {
        title: 'Sushi is delicious',
        content: 'Ahi, sake, hamachi',
        author: {
          firstName: 'Fish',
          lastName: 'Lover'
        }
      };
      return BlogPost
      // Get an existing post
        .findOne()
        // assign updateData's id to that existing post's id
        .then(post => {
          updateData.id = post._id;
          return chai.request(app)
          // make a PUT request with updateData
            .put(`/posts/${post._id}`)
            .send(updateData);
        })
        // return the data of BlogPost with updateData's id
        .then(res => {
          // console.log('console log res ', res);
          res.should.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        // compare updateData to BlogPost.findById(updateData.id)
        .then(post => {
          console.log('console logging ', post);
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
          post.author.firstName.should.equal(updateData.author.firstName);
          post.author.lastName.should.equal(updateData.author.lastName);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should delete a post by id', function() {
      let post;
      return BlogPost
        // get a post
        .findOne()
        .then(_post => {
          post = _post;
          // DELETE request for that post's id
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(res => {
          res.should.have.status(204);
          // look for deleted post
          return BlogPost.findById(post.id);
        })
        .then(_post => {
          should.not.exist(_post);
        });
    });
  });

});