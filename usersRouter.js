const express = require('express');
const pool = require('./db');
const { check, body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware
const validateId = [
    check('id').notEmpty().withMessage('ID is required').isInt().withMessage('ID must be an integer')
];

const validateBodyPost = [
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

const validateBodyPut = [
    body('first_name').isString().optional().customSanitizer((value, { req }) => value || undefined),
    body('last_name').isString().optional().customSanitizer((value, { req }) => value || undefined),
    body('age').isInt({ min: 0 }).optional().customSanitizer((value, { req }) => value || undefined),
    body('active').isBoolean().optional().customSanitizer((value, { req }) => value === false ? value : value || undefined),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        ['first_name', 'last_name', 'age', 'active'].forEach((field) => {
            if (req.body[field] === undefined) {
                delete req.body[field];
            }
        })

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

router.post('/', validateBodyPost, (req, res) => {

    pool.query('INSERT INTO users (first_name, last_name, age, active) values ($1, $2, $3, $4) RETURNING *;', [req.body.first_name, req.body.last_name, req.body.age, req.body.active])
        .then((data) => {

            res.status(201).json(data.rows);
        })
        .catch((err) => res.status(500).json({ error: err.message }));
})

router.put('/:id', validateId, userExists, validateBodyPut, (req, res) => {
    const id = req.params.id;
    let query = 'UPDATE users SET';
    let values = [id];


    ['first_name', 'last_name', 'age', 'active'].forEach((field) => {
        if (field in req.body) {
            query += ` ${field} = $${values.length + 1},`
            values.push(req.body[field]);
        }
    })

    query = `${query.slice(0, -1)} WHERE id=$1 RETURNING *;`

    if(values.length <= 1){
        return res.status(400).json({ error: "At least item should be changed" })
    }

    pool.query(query, values)
        .then((data) => { res.status(200).json(data.rows) })
        .catch((err) => res.status(500).json({ error: err.message }));

})

router.delete('/:id', validateId, userExists, (req, res) => {
    const id = req.params.id;

    pool.query('DELETE FROM users WHERE id=$1 RETURNING *;', [id])
        .then((data) => { res.status(201).json(data.rows) })
        .catch((err) => res.status(500).json({ error: err.message }));
})

module.exports = router;