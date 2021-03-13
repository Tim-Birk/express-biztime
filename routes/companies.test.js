// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');

let testcompany;

beforeEach(async function () {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('test', 'Testcompany', 'This is a test company')
      RETURNING code, name, description`);
  testcompany = result.rows[0];
});

/** GET /companies - returns `{companies: [company, ...]}` */

describe('GET /companies', function () {
  test('Gets a list of 1 company', async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [testcompany],
    });
  });
});
// end

/** GET /companies/[id] - return data about one company: `{company: company}` */

describe('GET /companies/:code', function () {
  test('Gets a single company', async function () {
    const response = await request(app).get(`/companies/${testcompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ company: testcompany });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// end

/** POST /companies - create company from data; return `{company: company}` */

describe('POST /companies', function () {
  test('Creates a new company', async function () {
    const response = await request(app).post(`/companies`).send({
      code: 'acm',
      name: 'Acme',
      description: 'blah blah blah',
    });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {
        code: 'acm',
        name: 'Acme',
        description: 'blah blah blah',
      },
    });
  });
});
// end

/** PATCH /companies/[id] - update company; return `{company: company}` */

describe('PATCH /companies/:code', function () {
  test('Updates a single company', async function () {
    const response = await request(app)
      .patch(`/companies/${testcompany.code}`)
      .send({
        name: 'Testcompany2',
        description: 'blah blah blah',
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: 'test',
        name: 'Testcompany2',
        description: 'blah blah blah',
      },
    });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).patch(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// end

/** DELETE /companies/[code] - delete company,
 *  return `{satus: "deleted"}` */

describe('DELETE /companies/:code', function () {
  test('Deletes a single a company', async function () {
    const response = await request(app).delete(
      `/companies/${testcompany.code}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: 'deleted' });
  });
});
// end

afterEach(async function () {
  // delete any data created by test
  await db.query('DELETE FROM companies');
});

afterAll(async function () {
  // close db connection
  await db.end();
});
