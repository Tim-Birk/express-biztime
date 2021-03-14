const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{industries: [industry_code, ...]}` */
router.get('/', async function (req, res, next) {
  try {
    const result = await db.query(`
        SELECT *
        FROM industries 
        ORDER BY code`);

    const industries = [];
    for (let i = 0; i < result.rows.length; i++) {
      const industry = { ...result.rows[i] };
      const compResult = await db.query(
        `SELECT ic.company_code
         FROM industries_companies ic 
         WHERE ic.industry_code = $1`,
        [industry.code]
      );
      const companies = [];
      for (let x = 0; x < compResult.rows.length; x++) {
        const comp_code = compResult.rows[x].company_code;
        companies.push(comp_code);
      }
      industry.companies = companies;
      industries.push(industry);
    }
    return res.json({ industries });
  } catch (err) {
    return next(err);
  }
});

/** POST / - create industry_code from data; return `{industry_code: industry_code}` */
router.post('/', async function (req, res, next) {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry) 
           VALUES ($1, $2) 
           RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

/** POST / - create association industry and company; return `{association: {industry_code, company_code}}` */
router.post('/associate', async function (req, res, next) {
  try {
    const { industry_code, company_code } = req.body;
    const result = await db.query(
      `INSERT INTO industries_companies (industry_code, company_code) 
             VALUES ($1, $2) 
             RETURNING industry_code, company_code`,
      [industry_code, company_code]
    );

    return res.status(201).json({ association: result.rows[0] }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
