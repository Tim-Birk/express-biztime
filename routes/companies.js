const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{companies: [company, ...]}` */
router.get('/', async function (req, res, next) {
  try {
    const result = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /[code] - return data about one company: `{company: company}` */
router.get('/:code', async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT c.code, c.name, c.description, i.industry
         FROM companies AS c
         LEFT JOIN industries_companies ic ON c.code = ic.company_code
         LEFT JOIN industries i ON ic.industry_code = i.code
         WHERE c.code = $1`,
      [req.params.code]
    );

    if (result.rows.length === 0) {
      let notFoundError = new Error(
        `There is no company with code '${req.params.code}`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }
    const { code, name, description, industry } = result.rows[0];
    const industries = industry ? result.rows.map((i) => i.industry) : [];
    return res.json({ company: { code, name, description, industries } });
  } catch (err) {
    return next(err);
  }
});

/** POST / - create company from data; return `{company: company}` */
router.post('/', async function (req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[code] - update fields in company; return `{company: company}` */
router.patch('/:code', async function (req, res, next) {
  try {
    if ('code' in req.body) {
      throw new ExpressError('Not allowed', 400);
    }
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies 
             SET name=$1, description=$2
             WHERE code = $3
             RETURNING code, name, description`,
      [name, description, code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${code}`, 404);
    }

    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[code] - delete company, return `{message: "company deleted"}` */
router.delete('/:code', async function (req, res, next) {
  try {
    const result = await db.query(
      'DELETE FROM companies WHERE code = $1 RETURNING code',
      [req.params.code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(
        `There is no company with code of '${req.params.code}`,
        404
      );
    }
    return res.json({ status: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
