# db-row-parser

Simple "row" parser that transform a row (basically an array) into an object graph.

For example if we have a row like:
```
let row = [1, "foo", "123 on the street", "In a City"];
```

And we want to make it into an object graph like:
```
{
  userId: 1,
  username: "foo",
  address: {
    street: "123 on the street",
    city: "In a City"
  }
}
```

We can configure our parser like this:

```
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
    address: {
      parser: addressParser,
      many: false
    }
  }
});
```

And than parse the row(s):
```
let user = userParser.parseRow(row);
```

## API

### Class: DbRowParser

A row parser to convert a flatten object (array) into an Object graph.

#### Constructor: new DbRowParser(options)

* ```options```

   * ```key: integer``` Indicate the Array index of the object key. Basically the "field" the parser will look to detect if processing a new object. Default is 0.
   * ```properties: Object``` Provide mapping configuration of the array to resulting object. For each property of the object we are trying to rebuild, put the integer array index where to find the the value in the array or a complex property definition.
   * ```complex property``` An object with
      * ```parser: DbRowParser``` property to express parsing of child object (e.g. main object is User and child object is Address).
      * ```many: bool``` Indicate if there will be many of this object. For example the primary parser could for Blog Post with a property of ```comments``` which would be express using another ```DbRowParser``` and with property ```many: true```. Default is false.

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
