import express, { json } from 'express';
import { config } from 'dotenv';
const app = express();
const port = 1010;
import router from './elastic-search.routes.js';

config();

app.use(json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api', router);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});