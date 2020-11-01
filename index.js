// Load libraries
const express = require('express')
const handlebars = require('express-handlebars')
const fetch = require('node-fetch')
const withQuery = require('with-query').default

// Configure port
const PORT = process.argv[2] ? parseInt(process.argv[2]) : 3000 

// Configure API key
const API_KEY = process.env.API_KEY || ""

// Base URL
const BASE_URL = 'https://api.giphy.com/v1/gifs/search'

// Create an instance of the express application
const app = express()

// Load static files
app.use(
    express.static(__dirname + '/static')
)

// View engine setup to handle file with hbs extension
app.engine('hbs',
    handlebars({ defaultLayout: 'default.hbs' })
)
app.set('view engine', 'hbs')

// Only start the application if the API_KEY is set
if (API_KEY) {
// Start express
    app.listen(
        PORT, // Port number
        () => { // Callback function, to execute after express has started
            console.info(`Application has started on port ${PORT} at ${new Date()}`)
    })
} 
else {
    console.error('API_KEY is not set')
}

// The main page
app.get('/', (req, res) => {
    res.status(200)
    res.type('text/html')
    res.render('index')
})

// The search page
app.get('/search', async (req, res) => {
    const searchTerm = req.query['search-term']
    console.info('search-term: ', searchTerm)   

    // endpoint url 
    const queryUrl = withQuery(BASE_URL, {
        api_key: API_KEY,
        q: searchTerm,
        limit: 10,
        rating: 'g',
    })
    
    // try catch block to execute the async await function
    try {
        const response = await fetch(queryUrl)
        const result = (await response.json())['data']
        const filteredResult = result.map(elem => [elem['images']['fixed_height']['url'], elem['title']])
        res.status(200)
        res.type('text/html')
        res.render('giphy', {
            searchTerm: searchTerm,
            filteredResult: filteredResult, 
            hasContent: !!filteredResult.length, // filteredResult.length > 0(alternative way)
        })
    }
    // catch block to handle errors
    catch (err) {
        console.error(err)
    }
})

// Handle errors that has unexpectedly occur
app.get('*', function(req, res, next) {
    let err = new Error(`${req.ip} tried to reach ${req.originalUrl}`); // Tells us which IP tried to reach a particular URL
    err.statusCode = 404;
    err.shouldRedirect = true; // New property on err so that our middleware will redirect
    next(err);
  });
  

app.use(function(err, req, res, next) {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500; // Sets a generic server error status code if none is part of the err

    if (err.shouldRedirect) {
        res.redirect('/') // Redirect user back to main page
    } else {
        res.status(err.statusCode).send(err.message); // If shouldRedirect is not defined in our error, sends our original err data
    }
});