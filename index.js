var fs = require("fs");
var host = "127.0.0.1";
var port = 3000;
var express = require("express");

// node start command will include param specifying path to darwin json
const darwinPath = './well_lineage_graphs/2-2/CELL-001421_E8_resolution_1_d5283794-24c3-11ed-a4a1-42010a80001d.json';
let darwinJSON;
let index;
try {
  darwinJSON = fs.readFileSync(darwinPath, 'utf8');
  index = fs.readFileSync('./index.html', 'utf8');
} catch (error) {
  darwinJSON = 'error';
}

var app = express();
app.use(express.static(__dirname)); //use static files in ROOT/public folder

app.get("/test", function(request, response){ //root dir
    // this path then gets baked into the index html served
    response.send("Hello!!");
});

app.get("/cluster_viz", function(request, response) {
  if(index !== undefined) {
    response.send(index.replace(/{{darwinJSON}}/g, darwinJSON));
  } else {
    response.send('Had Error loading Darwin JSON or HTML file');
  }
});

app.listen(port, host);
