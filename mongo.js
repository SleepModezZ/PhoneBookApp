const mongoose = require('mongoose')

if (process.argv.length<3) {
  console.log('give password as argument')
  process.exit(1)
}



const password = process.argv[2]

const url =
  `mongodb+srv://SleepModezZ:${password}@cluster0.2myel.mongodb.net/personApp?retryWrites=true&w=majority`

mongoose.connect(url)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

if (process.argv.length===5) {

  const name = process.argv[3]
  const number = process.argv[4]

  const person = new Person({
    'name': name,
    'number': number
  })

  person.save().then( () => {
    console.log('person saved!')
    mongoose.connection.close()
  })
  return
}

Person.find({}).then(result => {
  result.forEach(person => {
    console.log(person)
  })
  mongoose.connection.close()
})
