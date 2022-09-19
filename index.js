require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
const shortId = require('shortid');
const validUrl = require('valid-url');

const mySecret = process.env['MONGO_URI'];
mongoose.connect(
  mySecret, 
  { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  }
);
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error'));
connection.once('open', ()=> console.log('mongodb connected...'));

let shortUrlSchema = new mongoose.Schema({
  long_url: String,
  short_url: String
});

let ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;


const stringIsAValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
  };


app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static(`${process.cwd()}/public`));


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.get('/api/shorturl/:short_url', async function(req, res){
  const short_url = req.params.short_url;
  try {
    if(short_url){
      const longUrl = await ShortUrl.findOne({
        short_url: short_url
      });
      if(longUrl){
        const long_url = longUrl.long_url;
        res.redirect(`${long_url}`);
      } else {
        res.status(404).json('no url found');
      }
      
    }
  } catch (error) {
    return res.status(500).json('server error');
  };
})

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  if(!validUrl.isWebUri(req.body.url)){
    return res.json({error: 'invalid url' })
  }
  const urlCode = shortId.generate();
  let shortUrl = new ShortUrl({
    long_url: req.body.url,
    short_url: urlCode
  })
  shortUrl.save()
  res.json({ original_url: shortUrl.long_url, 
            short_url: shortUrl.short_url
           });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
