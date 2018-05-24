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
  // describe('POST endpoint', function() {
  //   it('should add a new blog post', function() {
  //     // make a POST request with data
  //     const newPost = {
  //       title: faker.lorem.sentence(),
  //       author: {
  //         firstName: faker.name.firstName(),
  //         lastName: faker.name.lastName(),
  //       },
  //       content: faker.lorem.text()
  //     };
  //   })
  // })
});


// My attempt
// function seedBlogPostData() {
//   console.info('seeding blogpost data');
//   const seedData = [];

//   for (let i = 1; i <= 10; i++) {
//     seedData.push(generateBlogPostData());
//   }
//   return BlogPost.insertMany(seedData);
// }

// // Generate BlogPost Data function
// function generateBlogPostData() {
//   return {
//     author: {
//       firstName: faker.name.firstName(),
//       lastName: faker.name.lastName()
//     },
//     title: faker.lorem.words(),
//     content: faker.lorem.paragraph()
//   }
// }

// // tear town
// function tearDownDb() {
//   console.warn('Deleting database');
//   return mongoose.connection.dropDatabase();
// }

// // API resource
// describe('Blog posts API resource', function() {
    
//   before(function() {
//     return runServer(TEST_DATABASE_URL);
//   });
  
//   beforeEach(function() {
//     return seedBlogPostData();
//   });

//   afterEach(function() {
//     return tearDownDb();
//   });

//   after(function() {
//     return closeServer();
//   });

//   describe('GET endpoint', function() {
//     it('should return all existing blog posts', function() {
//       let res;
//       return chai.request(app)
//         .get('/posts')
//         .then(function(_res) {
//           res = _res;
//           expect(res).to.have.status(200);
//           expect(res.body.blogposts).to.have.lengthOf.at.least(1);
//           return BlogPosts.count();
//         })
//         .then(function(count) {
//           expect(res.body.blogposts).to.have.lengthOf(count);
//         });
//     });
//   });
// });
