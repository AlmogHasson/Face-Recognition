require('dotenv').config()//
const express = require('express');
const bodyParder = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')
const jwt = require('jsonwebtoken');
const cookieParser =require('cookie-parser')

const postgres = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'xywbti32tyt',
    database: 'smart-brain'
  }
});

const app = express();
app.use(bodyParder.json());
app.use(cors());
app.use(cookieParser());
app.get('/', authenticateToken, (req, res) => {
  res.send('success')
})


app.post('/signin', (req, res) => {
  const { email, psw } = req.body //
  const user = { email: email }

  postgres.select('email', 'hash').from('login')
    .where('email', '=', email) //
    .then(data => {
      const isValid = bcrypt.compareSync(psw, data[0].hash)
      if (isValid) {
        //create tokens after user validation
        const accessToken = generateAccessToken(user)
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
        console.log({ accessToken: accessToken, refreshToken: refreshToken })

        // store token in db & cookie
        postgres.select('*').from('users')
          .where('email', '=', email)
          .update({
            token: refreshToken
          })
          .catch(err => res.status(400).json(err))

        res.cookie('jwt', refreshToken, {httpOnly:true, maxAge: 24*60*60*1000});

        //return user data
        return postgres.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

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
            res.json(user[0])
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
  })
    .catch(err => res.status(400).json('registration failed'))

})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  let found = false;
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

app.post('/token', (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(401) //unauthorized
  console.log(cookies.jwt)
  const refreshToken = req.cookies.jwt
  let found = false

  postgres.select('token').from('users')
    .returning('token')
    .then(tokens => {
      tokens.map((token, i) => {
        if (token.token == refreshToken) {
          found = true
          jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '20s'}, (err, email) => {
            if (err) return res.sendStatus(403) //forbidden
            const accessToken = generateAccessToken({ email: email })
            res.json({ accessToken: accessToken })
          })
        }
      })
      if (!found){
        res.sendStatus(403) // forbidden
      }
    })
})


app.put('/signout', (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(204) // no content
  console.log(cookies.jwt,"cookie")

  const { id } = req.body
  postgres('users').where('id', '=', id)
    .update({ token: null })
    .returning('*')
    .then(data => {
      res.clearCookie('jwt', {httpOnly:true}),
      res.json(data),
      console.log(data, " successfully logged out")
    })
    .catch(err => { res.json(err) })
})

//authenticate access token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log(authHeader,"authHeader")
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })

}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20s' })
}

app.listen(3000, () => {
  console.log('running')
})
