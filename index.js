const textract = require("textract");
const got = require("got");
const isPlural = require("is-plural");

const arg = process.argv[2];
const url = "https://api.thomsonreuters.com/permid/calais";
const isUrl = require("is-url");

const analyzeString = body => {
  const headers = {
    "x-ag-access-token": process.env.OPEN_CALAIS_TOKEN,
    OutputFormat: "application/json"
  };
  return got(url, {
    headers,
    body
  });
};

const parseResponse = response => {
  const obj = JSON.parse(response.body);
  const result = {};
  Object.keys(obj).forEach(key => {
    const { _type, name } = obj[key];
    if (name && key !== "doc" && !/:| - /.test(name) && _type !== "Position") {
      const question =
        _type === "Person"
          ? `Who is ${name}?`
          : isPlural(name) ? `What are ${name}?` : `What is ${name}?`;
      result[question.toLowerCase()] = question;
    }
  });
  Object.keys(result).forEach(key => {
    console.log(result[key]);
  });
};

const getString = new Promise(resolve => {
  if (process.stdin.isTTY) {
    const cb = (err, res) => (err ? resolve(arg) : resolve(res));
    isUrl(arg) ? textract.fromUrl(arg, cb) : textract.fromFileWithPath(arg, cb);
  } else {
    const stdin = process.openStdin();
    let data = "";

    stdin.on("data", chunk => {
      data += chunk;
    });

    stdin.on("end", () => {
      resolve(data);
    });
  }
});

getString
  .then(analyzeString)
  .then(parseResponse)
  .catch(error => {
    console.log(error);
  });
