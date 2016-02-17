# db-row-parser

Simple "row" parser that transform a row (basically an array or a "flatten" Javascript Object) into an object graph.

## Parse Array

For example if we have rows like:
```
const DbRowParser = require("db-row-parser").DbRowParser;

let rows = [
  [1, "Pascal", "123 on the street", "In a City", 12345, 10, "My First Blog"],
  [1, "Pascal", "123 on the street", "In a City", 12345, 20, "My Second Blog"]
];
```

And we want to make it into an object graph like:
```
{
  userId: 1,
  username: "Pascal",
  address: {
    street: "123 on the street",
    city: "In a City"
  },
  dob: "Wed Dec 31 1969 17:00:12 GMT-0700 (MST)",
  blogs: [
    {
      blogId: 10,
      text: "My First Blog"
    },
    {
      blogId: 20,
      text: "My Second Blog"
    }
  ]
}
```

We can configure our parsers like this:
```
let blogParser = new DbRowParser({
  key: 5,
  properties: {
    blogId: 5,
    text: 6
  }
});
let addressParser = new DbRowParser({
  key: 2,
  properties: {
    street: 2,
    city: 3
  }
});
let userParser = new DbRowParser({
  key: 0,
  properties: {
    userId: 0,
    username: 1,
    address: addressParser,     // for complex property we can reference another parser
    blogs: [blogParser],        // if there will multiple "children", reference another parser but put it an array to let the parent parser know there is going to be more than one
    dob: function(row) { return new Date(row[4]).toString(); }   // can use simple "transformation" function
  }
});
```

And than parse the row(s):
```
userParser.on("new-object", obj => {
  console.log(obj);
});
rows.forEach(row => {
  userParser.parseRow(row);
});
userParser.end();
```

## Parse Flatten Object

Support also rows of "flatten" Javascript Object. For example if we have rows like:
```
let rows = [
  {
    userId: 1, username: "Pascal", street: "123 on the street", city: "In a City", dob: 12345, blogId: 10, text: "My First Blog"  
  },
  {
    userId: 1, username: "Pascal", street: "123 on the street", city: "In a City", dob: 12345, blogId: 20, text: "My Second Blog"
  }
];
```
And we want to make it into an object graph like we did above using rows of "array",

We can configure our parsers like this:
```
let blogParser = new DbRowParser({
  key: "blogId",
  properties: ["blogId", "text"]
});
let addressParser = new DbRowParser({
  key: "street",
  properties: ["street", "city"]
});

let userParser = new DbRowParser({
  key: "userId",
  properties: [                 // this time we use an array to list the properties we want to extract for each row
    "userId", "username",       // for simple property, we just need to list their name
    {
      address: addressParser    // for "complex" property we use an object with only 1 property and reference another parser
    },
    {
      blogs: [blogParser]       // when there will be multiple children, reference another parser but inside an array
    },
    {
      dob: function(row) { return new Date(row.dob).toString(); }   // as before we can still use "transformation" function for simple property
    }
  ]
});
```
## Single value collection

If a child property is a collection of single values, we can configure a parser with just a ```key``` attribute. For example suppose we have the following rows;
```
let rows = [                        // I'm using rows of array but work as well with "flatten" Javascript Object
  ["Pascal", "Fly Fishing"],
  ["Pascal", "X-Country Skiing"],
  ["Patricia", "Puzzle"]
]
```

And we want to turn them into something like this;
```
[
  {
    name: "Pascal",
    hobbies: ["Fly Fishing", "X-Country Skiing"]
  },
  {
    name: "Patricia",
    hobbies: ["Puzzle"]
  }
]
```

We can configure our parsers like this;
```
let hobbyParser = new DbRowParser({
  key: 1
});
let personParser = new DbRowParser({
  key: 0,
  properties: {
    name: 0,
    hobbies: [hobbyParser]
  }
});
```

## API

### Class: DbRowParser

A row parser to convert a flatten object (array) into an Object graph.

#### Constructor: new DbRowParser(options)

* ```options```

   * ```key: integer|string``` Indicate the Array index or the property name of the object key. Basically the "field" the parser will look to detect if processing a new object. Default is 0.
   * ```properties: Object|Array``` Provide mapping configuration of the object to "inflate". Depending if parsing rows of "flatten" Javascript Object use an array ([]) to describe each property or an Object if each rows is an array of values. For each property of the object we want to rebuild;
      * for simple property; put the integer array index where to find the value in the array (when parsing array) or just the name of the property (when parsing "flatten" Javascript Object) or
      * a ```transformation function``` or
      * a ```complex property``` definition.
   * ```transformation function: function(row)``` a function accepting 1 argument, the row, and returning the value we want to get.
   * ```complex property``` Can;
      * reference another parser for single child object or
      * reference another parser but inside an array in order to signal the parser there is going to be multiple children using this parser.


#### DbRowParser.parseRow(array)
Return inflated object from the array.

#### DbRowParser.end()
Signal parser we're done parsing the collection of rows. This will emit the current object.

#### Event: new-object
Send the parsed object every time parser detect a change of key (```key``` attribute).
```
  parser.on("new-object", function(obj) {
      // congratulation you have a new object!
  });
```

For example if we are processing rows for Blob Post with following collection of arrays:
```
[1, "First Blog", "foo@exapmle.com", "Wow that's an awesome blog post."]
[1, "First Blog", "bar@exapmle.com", "Can't wait for your next awesome blog."]
[2, "Second Blog", "bob@exapmle.com", "Meeehhh..."]
```
Where array[0] == blog.id, array[1] == blog.text, array[2] == blog.comments.user and array[3] == blog.comments.comment, with an event register on BlogParser (column 0 and 1) an event ```new-object``` will be emitted when processing the 3 row with an object;
```
{
  id: 1,
  text: "First Blog",
  comments: [
    {
      user: "foo@example.com",
      comment: "Wow that's an awesome blog post."
    },
    {
      user: "bar@example.com",
      comment: "Can't wait for your next awesome blog."
    }    
  ]
}
```
And after parsing the 3rd row calling ```.end()``` will emit the object for the 3rd row namely:
```
{
  id: 2,
  text: "Second Blog",
  comments: [
    {
      user: "bob@example.com",
      comment: "Meeehhh..."
    }
  ]
}
```

### Class: DbRowParserStream

Streaming API for the parser.

```
const DbRowParser = require("db-row-parser").DbRowParser;
const DbRowParserStream = require("db-row-parser").DbRowParserStream;

let parser = new DbRowParser({
  ...
});

let streamParser = new DbRowParserStream({
  rowParser: parser
});

let csvStream = csv({
  // csv parser configuration for example fast-csv
});

let fileStream = fs.createReadStream("blogs.csv");

fileStream
  .pipe(csvStream)
  .pipe(streamParser)
  .pipe(toSomethingElse);
```

#### Constructor: new DbRowParserStream(options)

* ```options```
   * ```rowParser: DbRowParser``` Parser definition.
