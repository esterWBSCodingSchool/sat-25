const express = require('express');
const pool = require('./db');
const { check, body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware
const validateId = [
    check('id').notEmpty().withMessage('ID is required').isInt().withMessage('ID must be an integer')
];

const validateBody = [
    body('first_name').isString().notEmpty(),
    body('last_name').isString().notEmpty(),
    body('age').isInt({ min: 0 }).optional(),
    body('active').isBoolean().optional(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        next();
      }
]

const userExists = (req, res, next) => {
    const id = req.params.id;

    pool.query('SELECT * FROM users WHERE id = $1', [id])
        .then((data) => {
            if (!data.rows.length) {
                return res.status(404).json({ message: 'User not found' })
            }
            req.user = data.rows;
            next();
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message })
        })
}

router.get('/', (req, res) => {

    pool.query('SELECT * FROM users;')
        .then((data) => { res.json(data.rows) })
        .catch((err) => res.status(500).json({ error: err.message }))

});

router.get('/:id', validateId, userExists, (req, res) => {

    res.json(req.user);

});

router.post('/', validateBody, (req, res) => {

    pool.query('INSERT INTO users (first_name, last_name, age, active) values ($1, $2, $3, $4) RETURNING *;', [req.body.first_name, req.body.last_name, req.body.age, req.body.active])
    .then((data) => {

        res.status(201).json(data.rows);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
})

module.exports = router;