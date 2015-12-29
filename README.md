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

### DbRowParser

A row parser to convert a flatten object (array) into an Object graph.

#### Constructor: new DbRowParser(options);

* Options

   * ```key``` An integer indicating the Array index of the object key. Basically the thing the parser will look to detect if processing a new object.
   * ```properties``` An object providing mapping configuration of the array to resulting object. So for each property of the object we are trying to rebuild, put the integer array index where to find the the value in the array.
