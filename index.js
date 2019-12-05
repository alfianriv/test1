const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/src/index.html'));
});

async function getPost(req, query, params) {
    let posts = await axios.get(`${process.env.HOST}/${params}/feed`, {
        params: query
    }).then(response => {
        return response.data
    }).catch(err => {
        return {
            error: true
        }
    });

    if (posts.error) {
        return res.json({ error: `access_token is expired` });
    }

    if (posts.paging) {
        let fixPaging = {};
        let paging = Object.keys(posts.paging);

        paging.forEach(page => {
            fixPaging[page] = [];
            let pageSplitted = posts.paging[page].split('?');
            posts.paging[page] = pageSplitted[1].split('&').map(obj => {
                let split = obj.split('=');
                if (!split.includes('access_token')) {
                    fixPaging[page].push(`${split[0]}=${split[1]}`);
                }
            });
            let paramsPage = pageSplitted[0].split('/')
            fixPaging[page] = `${req.protocol}://${req.get('host')}/posts/${paramsPage[3]}/${paramsPage[4]}?${fixPaging[page].join('&')}`;
        });

        posts.paging = fixPaging;
    }

    return posts;
}

app.get('/posts/:version/:id', async (req, res) => {
    let query = { ...req.query, access_token: process.env.ACCESS_TOKEN };
    let params = Object.values(req.params).join('/');
    let result = await getPost(req, query, params);
    res.json(result);
})

app.get('/posts', async (req, res) => {
    let query = { access_token: process.env.ACCESS_TOKEN };
    let params = 'me';
    let result = await getPost(req, query, params);
    res.json(result);
})

app.listen(3000);