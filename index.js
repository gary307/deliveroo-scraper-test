const got = require('got');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const ObjectsToCsv = require('objects-to-csv');

const express = require('express')
const app = express()
const port = 3000;

const http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');

const date =  new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'long' }).format(new Date()).split(',');

async function  getData (postcode, type, dietary) {

 const choosenDietry = dietary ? `&dietary=${dietary}` : '';
  const vgmUrl = `https://deliveroo.co.uk/restaurants/london/earl's-court?postcode=${postcode}${choosenDietry}&collection=${type}`;

  const response = await got(vgmUrl);
  const dom = new JSDOM(response.body);
  
  // Create an Array out of the HTML Elements for filtering using spread syntax.

  const elementList = [...dom.window.document.querySelector('.HomeFeedGrid-06181a3851a8467d').querySelectorAll('.HomeFeedGrid-a624d8e3e0959f81')];

  const deliverooLocation = elementList.reduce((total, element, i) => {
    
        const copyElementPTag = element.querySelector('a') ? element.querySelector('.HomeFeedUICard-1cc6964985e41c86').getAttribute("aria-label") : 'null';
        const copyElementTitle = copyElementPTag ? copyElementPTag.split('.')[0] : '';
        const copyElementBonus = element.querySelectorAll('h5')[0];

        if(i < 70) {
            const newTotal = [...total,{
                index: i + 1,
                name: copyElementTitle.replace('Restaurant', ''),
                services: copyElementPTag && copyElementPTag.split('Serves')[1] ? copyElementPTag.split('Serves')[1].split('.')[0] : '',
                rating: copyElementPTag.includes('Rated') ? copyElementPTag.split('Rated')[1].split('from')[0] : 'no rating',
                bonus: copyElementBonus ? copyElementBonus.innerHTML: ''
            }]
            total = newTotal;
       } 

    return total;

    }, []);

    const csv = new ObjectsToCsv(deliverooLocation);
 
    var dir = `./reports/${date[0].split('/').join('-')} ${String(date[1].split(':').join('.'))}`;

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
    await csv.toDisk(`${dir}/p=${postcode}${type ? '_c=' + type : ''}${dietary ? '_d=' + dietary : ''}.csv`);
};

const querys = require('./query.json');

  app.get('/generate', async (req, res) => {

    querys.forEach(q => {
        getData(q.postcode, q.category, q.dietary);
    })

    res.send('it worked')
  })

  app.get('/', (req, res) => {
       res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
  })
  

  app.listen('9000', () => console.log(`Hello world app listening on port 9000!`))