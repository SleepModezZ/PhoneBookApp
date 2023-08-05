import { useState, useEffect } from 'react'
import personService from './services/persons'

// Ilmoitukset virheistä ja onnistumisista:
const Notification = ({ message, error }) => {
  if (message === null) {
    return null
  }

  if (error) {
    return (
      <div className="error">
        {message}
      </div>
    )
  }
  return (
    <div className="confirmation">
      {message}
    </div>
  )
}

// Näkymän suodatus:
const Filter = ({ filter, handleFilter }) => {
  return (
    <div>
    filter shown with <input value={filter} onChange={handleFilter}/>
    </div>
  )
}

// Näyttää yhden henkilön tiedot:
const DisplayPerson = ({ person, deletePerson }) => <p>{person.name} {person.number}<button onClick={deletePerson}>delete</button></p>

// Näyttää "listan" henkilöistä
const DisplayPersons = ({ persons, filter, deletePersonOf }) => {
  const  filtered = persons.filter(p => p.name.toUpperCase().includes(filter.toUpperCase()))
  return (
    <div>
      {filtered.map(person => 
        <DisplayPerson key={person.name} person={person}  deletePerson={() => deletePersonOf(person.id)} />
      )}
    </div>
  )
}

// Lomake henkilön lisäämistä varten:
const PersonForm = ({addPerson, newName, newNumber, handleName, handleNumber}) => {
  return (
    <form onSubmit={addPerson}>
      <div>
        name: <input value={newName} onChange={handleName} />
      </div>
      <div>number: <input value={newNumber} onChange={handleNumber} /></div>
      <div>
        <button type="submit">add</button>
      </div>
    </form>
  )
}


const App = () => {
  const [persons, setPersons] = useState([]) 
  const [filter, setFilter] = useState('')
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(false)

  // Lataa tiedot henkilöiden tiedoista sovelluksen käynnistyessä:
  useEffect(() => {
    personService
      .getAll()
      .then(initialPersons => {
        setPersons(initialPersons)
      })
  }, [])

  // Lisätään henkilö puhelinluetteloon:
  const addPerson = (event) => {
    event.preventDefault()
    const personObject = {
      name: newName,
      number: newNumber
    }

    const found = persons.findIndex( n => n.name === newName)

    // Jos henkilö ei ennestään löydy puhelinluettelosta, hänet lisätään:
    if (found === -1) {
      personService
      .create(personObject)
      .then(returnedPerson => {
        setPersons(persons.concat(returnedPerson))
        setNewName('')
        setNewNumber('')
        setError(false)
        setMessage(`Added ${newName} to phonebook`)
        setTimeout(() => {setMessage(null)}, 5000)
      }).catch(error => {
        setError(true)
        setMessage(error.response.data.error)
        setTimeout(() => {setMessage(null)}, 5000)
    })

    }
    // Jos henkilö jo löytyy luettelosta:
    else {
      const ok = window.confirm(`${newName} is already added to phonebook, replace the old number with a new one?`)
      const id = persons[found].id
      if (ok) {
        personService.update(persons[found].id, personObject)
        .then(updatedPerson => {
          setPersons(persons.map(person => person.id !== id ? person : updatedPerson))
          setNewName('')
          setNewNumber('')
          setError(false)
          setMessage(`Updated number of ${newName}`)
          setTimeout(() => {setMessage(null)}, 5000)
      })
      .catch(error => {
        setError(true)
        setMessage(error.response.data.error)
        setTimeout(() => {setMessage(null)}, 5000)

        // Poistaa henkilön listasta, mikäli virhe viittaa siihen, että
        // henkilö on jo poistettu puhelinluettelosta:
        if (error.response.status === 404) {
          setPersons(persons.filter(person => person.id !== id))
        }
      })
    }
    }
  }

  // Henkilön poistaminen luettelosta:
  const deletePersonOf = (id) => {
    const toBeDeleted = persons.filter(p => p.id === id)[0].name
    
    const ok = window.confirm(`delete ${toBeDeleted} ?`)
    
    if (ok) {
      personService.remove(id)
      .then(response => {
        setPersons(persons.filter(person => person.id !== id))
        setError(false)
        setMessage(`Deleted ${toBeDeleted} from phonebook`)
        setTimeout(() => {setMessage(null)}, 5000)
      })
    }
  }

  
  const handleName = (event) => {
    setNewName(event.target.value)
  }
  
  const handleNumber = (event) => {
    setNewNumber(event.target.value)
  }
  
  const handleFilter = (event) => {
    setFilter(event.target.value)
  }

  return (
    <div>
      <h2>Phonebook</h2>
      <Notification message={message} error={error} />
      <Filter filter={filter} handleFilter={handleFilter} />
       <h3>Add a new</h3>
       <PersonForm addPerson={addPerson} newName={newName} newNumber={newNumber}
        handleName={handleName} handleNumber={handleNumber}
      />
      <h3>Numbers</h3>
        <DisplayPersons
        persons={persons}
        filter={filter}
        deletePersonOf={deletePersonOf}/>
    </div>
  )
}

export default App
