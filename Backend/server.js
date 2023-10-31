require('dotenv').config()//
const express = require('express');
const bodyParder = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const REFRESH_TOKEN_COOKIE_NAME = 'my_cookie';

const postgres = knex({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  host: "dpg-ckvqfpmb0mos73bueijg-a",
  port: "5432",
  user: "smart_brain_a0tg_user",
});

const app = express();
app.use(cookieParser());
app.use(bodyParder.json());
app.use(cors({
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  
}));
app.use(authenticateToken)

app.get('/', (req , res)=>{
  res.send("success")
});


app.post('/refresh', (req, res) => {
  const refreshCookie = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshCookie) {
    res.status(401).send('refresh token is missing');
  }

  //creating a new access token for the user
    postgres.select('*').from('users')
      .where('token', '=', refreshCookie)
      .then( user => {
        if (!user) {
          throw new Error('user not found');
        }
        const { token: _, ...userWithoutRefreshToken } = user[0];
        console.log(userWithoutRefreshToken, "user w/o token")
        const accessToken = generateAccessToken(userWithoutRefreshToken);
        const refreshToken = uuid();

        postgres.select('*').from('users')
          .where('email', '=', user[0].email)
          .update({
            token: refreshToken
          })
          .catch(err => res.status(400).json(err))
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { httpOnly: false, overwrite:true, maxAge: 24 * 60 * 60 * 1000, sameSite: "none", path: '/', secure: true, domain: 'localhost' });
        res.send({ accessToken });
      })
      .catch(err => {
        console.log(err);
        res.status(401).json('refresh token not found')
      })
});

app.post('/signin', (req, res) => {
  const { email, psw } = req.body 
  const user = { email: email }

  postgres.select('email', 'hash').from('login')
    .where('email', '=', email) 
    .then(data => {
      const isValid = bcrypt.compareSync(psw, data[0].hash)

      if (isValid) {
        const refreshToken = uuid();

        // store token in db & cookie
        postgres.select('*').from('users')
          .where('email', '=', email)
          .update({
            token: refreshToken
          })
          .catch(err => res.status(400).json(err))

        //return user data
        return postgres.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            const { token: _, ...userWithoutRefreshToken } = user[0];
            const accessToken = generateAccessToken(userWithoutRefreshToken);
            res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { httpOnly: false, maxAge: 24 * 60 * 60 * 1000, sameSite: "none", path: '/', secure: true, domain: 'localhost' });
            res.json({ accessToken });
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
});

app.post('/register', (req, res) => {
  const { email, name, psw } = req.body;
  const hash = bcrypt.hashSync(psw);
  postgres.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0].email,
            name: name,
            joined: new Date()
          })
          .then(user => {
            const accessToken = generateAccessToken(user[0])
            const refreshToken = jwt.sign(user[0], process.env.REFRESH_TOKEN_SECRET)

            // store token in db & cookie
            postgres.select('*').from('users')
              .where('email', '=', email)
              .update({
                token: refreshToken
              })
              .catch(err => res.status(400).json(err));
            res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { httpOnly: false, maxAge: 24 * 60 * 60 * 1000, sameSite: "none", path: '/', secure: true, domain: 'localhost' });
            res.json({ accessToken });
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
  })
    .catch(err => {
      console.log({ err });
      res.status(400).json('registration failed ')
    });

})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  postgres.select('*').from('users').where({ id })
    .then(user => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json('Not Found')
      }
    })
    .catch(err => res.status(400).json('Error getting user'))
})

app.put('/image', (req, res) => {
  const { id } = req.body;
  postgres('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => res.json(entries[0].entries))
    .catch(err => res.status(400).json('unable to get entries'))
})


app.put('/signout', (req, res) => {
  const cookie = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  if (!cookie) return res.sendStatus(204) // no content

  const { id } = req.body
  postgres('users').where('id', '=', id)
    .update({ token: null })
    .returning('*')
    .then(data => {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME),
      res.json(data),
      console.log(data, " successfully logged out")
    })
    .catch(err => { res.json(err) })
})

//authenticate access token
function authenticateToken(req, res, next) {
  console.log(req.path)
  if (['/signin', '/register', '/refresh', '/signout','/'].includes(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user;
    next()
  })
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' })
}

app.listen(process.env.PORT || 3000, () => {
  console.log(`running on port ${process.env.PORT}`)
})



