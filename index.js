const express = require('express');
const app = express();
const cors = require('cors');
const usersRouter = require('./usersRouter');
const ordersRouter = require('./usersRouter');
const port = process.env.PORT || 3000;

//Middleware
app.use(express.json());
app.use(cors());



app.use('/users', usersRouter);
app.use('/orders', ordersRouter);


app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}/api/countries`);
});
