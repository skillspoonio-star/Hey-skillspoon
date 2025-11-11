const express = require('express');
const { swaggerUi, specs } = require('../../swagger');

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));