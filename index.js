require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')
const Person = require('./models/person')

app.use(express.static('build'))
app.use(express.json())
app.use(cors())


// Tehtävän 3.7 ratkaisu:
// app.use(morgan('tiny'))


// En onnistunut yhdistämään tokeneita esimääritellyn muotoilun kanssa, joten ratkaisin
// tehtävän 3.8 korvaamalla tinyn sen määrittävillä valmiilla tokeneilla ja
// listäämällä niiden perään itse määrittelemäni tokenin tulostamaan pyynnön sisällön:
morgan.token('req-body', function (req) {
  const result = JSON.stringify(req.body)
  // Tyhjät aaltosulkeet muiden kuin POST-pyyntöjen kohdalla näyttää huonolta, joten
  // lähetän niiden sijaan tyhjän merkkijonon (null tai undefined kävisivät yhtälailla).
  // Valitettavasti morgan kuitenkin näyttää kaikkien thyjien tietojen kohdalla väliviivan.
  if (result === '{}') {
    return ''
  }
  return result
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'))


//***************************************************************************************


app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})


// Infoa listan koosta ja lisäksi päiväys.
app.get('/info', (req, res) => {
  Person.find().then(persons => {
    const text = `<p>Phonebook has info for ${persons.length} people</p><p>${Date()}</p>`
    res.send(text)
  })
})


// Henkilön lisäys luetteloon:
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  // Tarkistaa, ettei luettolossa ole samannimisiä henkilöitä ennen tallentamista:
  Person.find({ name: body.name }).limit(1).size()
    .then(haku => {
      if (haku.length > 0) {
        return response.status(400).json({
          error: 'name must be unique'
        })
      } else {

        const person = new Person({
          name: body.name,
          number: body.number
        })

        person.save().then(savedPerson => {
          response.json(savedPerson)
        }).catch(error => next(error))
      }
    })
})


// Kaikkien henkilöiden tietojen palauttaminen:
app.get('/api/persons', (req, response) => {
  Person.find().then(persons => {
    response.json(persons)
  })
})


// Henkilön tietojen palauttaminenn id:n perusteella:
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => {
      next(error)
    })
})

// Henkilön tietojen ppoistaminen:
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then( () => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body


  Person.findById(request.params.id)
    .then(result => {
      if (!result) {
        return response.status(404).send({ error: 'Person already deleted from phonebook' })
      } else {
        Person.findByIdAndUpdate(request.params.id, { name, number },{ new: true, runValidators: true, context: 'query' })
          .then( () => {
          // Pitää muistaa palauttaa päivitetty olio:
            return response.status(200).send({ id: request.params.id, name: request.body.name, number: request.body.number })
          })
          .catch(error => next(error))
      }
    })
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// olemattomien osoitteiden käsittely
app.use(unknownEndpoint)


const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

// virheellisten pyyntöjen käsittely
app.use(errorHandler)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
