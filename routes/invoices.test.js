// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test';

// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');

let testinvoice;

beforeEach(async function () {
  let companyResult = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('test123', 'Testcompany', 'This is a test company')
      RETURNING code, name, description`);
  testcompany = companyResult.rows[0];

  let result = await db.query(`
    INSERT INTO
      invoices (comp_code, amt, paid, paid_date)
      VALUES ('test123', 250.00, true, null)
      RETURNING id, comp_code, amt, paid, paid_date`);
  testinvoice = result.rows[0];
});

/** GET /invoices - returns `{invoices: [invoice, ...]}` */

describe('GET /invoices', function () {
  test('Gets a list of 1 invoice', async function () {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoices: [
        {
          id: testinvoice.id,
          comp_code: testinvoice.comp_code,
          amt: testinvoice.amt,
          paid: testinvoice.paid,
          paid_date: testinvoice.paid_date,
          add_date: expect.any(String),
        },
      ],
    });
  });
});
// end

/** GET /invoices/[id] - return data about one invoice: `{invoice: invoice}` */

describe('GET /invoices/:id', function () {
  test('Gets a single invoice', async function () {
    const response = await request(app).get(`/invoices/${testinvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: testinvoice.id,
        comp_code: testinvoice.comp_code,
        amt: testinvoice.amt,
        paid: testinvoice.paid,
        paid_date: testinvoice.paid_date,
        add_date: expect.any(String),
      },
    });
  });

  test("Responds with 404 if can't find invoice", async function () {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// end;

/** POST /invoices - create invoice from data; return `{invoice: invoice}` */

describe('POST /invoices', function () {
  test('Creates a new invoice', async function () {
    const response = await request(app).post(`/invoices`).send({
      comp_code: 'test123',
      amt: 100,
      paid: false,
      paid_date: null,
    });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: 'test123',
        amt: 100,
        paid: false,
        paid_date: null,
        add_date: expect.any(String),
      },
    });
  });
});
// end

/** PATCH /invoices/[id] - update invoice; return `{invoice: invoice}` */

describe('PATCH /invoices/:id', function () {
  test('Updates a single invoice', async function () {
    const response = await request(app)
      .patch(`/invoices/${testinvoice.id}`)
      .send({
        comp_code: 'test123',
        amt: 95,
        paid: false,
        paid_date: null,
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: testinvoice.id,
        comp_code: 'test123',
        amt: 95,
        paid: false,
        paid_date: null,
      },
    });
  });

  test("Responds with 404 if can't find invoice", async function () {
    const response = await request(app).patch(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// end

/** DELETE /invoices/[id] - delete invoice,
 *  return `{status: "deleted"}` */

describe('DELETE /invoices/:id', function () {
  test('Deletes a single a invoice', async function () {
    const response = await request(app).delete(`/invoices/${testinvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: 'deleted' });
  });
});
// end

afterEach(async function () {
  // delete any data created by test
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM invoices');
});

afterAll(async function () {
  // close db connection
  await db.end();
});
