const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{invoices: [invoice, ...]}` */
router.get('/', async function (req, res, next) {
  try {
    const result = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: result.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] - return data about one invoice: `{invoice: invoice}` */
router.get('/:id', async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT * 
         FROM invoices 
         WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      let notFoundError = new Error(
        `There is no invoice with id '${req.params.id}`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** POST / - create invoice from data; return `{invoice: invoice}` */
router.post('/', async function (req, res, next) {
  try {
    const { comp_code, amt, paid, paid_date } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt, paid, paid_date) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt, paid, paid_date]
    );

    return res.status(201).json({ invoice: result.rows[0] }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] - update fields in invoice; return `{invoice: invoice}` */
router.patch('/:id', async function (req, res, next) {
  try {
    if ('id' in req.body) {
      throw new ExpressError('Not allowed', 400);
    }
    const { id } = req.params;
    const { comp_code, amt, paid, paid_date } = req.body;
    const result = await db.query(
      `UPDATE invoices 
             SET comp_code=$1, amt=$2, paid=$3, paid_date=$4
             WHERE id = $5
             RETURNING id, comp_code, amt, paid, paid_date`,
      [comp_code, amt, paid, paid_date, id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of '${id}`, 404);
    }

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id] - delete invoice, return `{status: "deleted"}` */
router.delete('/:id', async function (req, res, next) {
  try {
    const result = await db.query(
      'DELETE FROM invoices WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(
        `There is no invoice with id of '${req.params.id}`,
        404
      );
    }
    return res.json({ status: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
