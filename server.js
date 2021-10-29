const cheerio = require("cheerio");
const request = require("request");

const fs = require("fs");
const { parse } = require("path");

const url =
  "https://storage.googleapis.com/infosimples-public/commercia/case/product.html";
const respostaFinal = {};

request(url, (error, response, body) => {
  const parsedHtml = cheerio.load(body);

  respostaFinal.title = parsedHtml("h2#product_title").text();

  respostaFinal.brand = parsedHtml("div.brand").text();

  let nav = parsedHtml("nav.current-category")
    .text()
    .replace(/\s+/g, "")
    .trim();
  let array = nav.split(">");
  respostaFinal.categories = array;

  let desc = parsedHtml("div.product-details p")
    .text()
    .replace(/\n/g, "")
    .trim();
  respostaFinal.description = desc;

  respostaFinal.skus = [];
  parsedHtml("div.skus-area div div.card div.card-container").each((i, el) => {
    const product = {
      name: parsedHtml(el)
        .find(".sku-name")
        .text()
        .trim()
        .replace("$", "")
        .replace("\\n", "")
        .trim(),
      current_price: parseFloat(
        parsedHtml(el)
          .find(".sku-current-price")
          .text()
          .trim()
          .replace("$", "")
          .replace("\\n", "")
          .trim()
      ),
      old_price: parseFloat(
        parsedHtml(el)
          .find(".sku-old-price")
          .text()
          .trim()
          .replace("$", "")
          .replace("\\n", "")
          .trim()
      ),
    };
    product.available = !!product.current_price;
    respostaFinal.skus.push(product);
  });

  respostaFinal.properties = [];
  parsedHtml("table.pure-table tbody tr").each((i, el) => {
    const props = {
      label: parsedHtml(el).find("td b").text().trim(),
      value: parsedHtml(el).find("td").last().text().trim(),
    };
    respostaFinal.properties.push(props);
  });

  respostaFinal.reviews = [];
  parsedHtml("div#comments div.review-box").each((i, el) => {
    const revws = {
      name: parsedHtml(el).find("span.review-username").text().trim(),
      date: parsedHtml(el).find("span.review-date").text().trim(),
      score: parsedHtml(el)
        .find("span.review-stars")
        .text()
        .trim()
        .split("")
        .filter((star) => star == "★").length,
      text: parsedHtml(el).find("p").text().trim(),
    };
    respostaFinal.reviews.push(revws);
  });

  let score = parsedHtml("div#comments h4")
    .text()
    .replace("Average score:", "");
  respostaFinal.reviews_average_score = parseFloat(score);
  respostaFinal.url = url;

  const jsonRespostaFinal = JSON.stringify(respostaFinal, null, 2);

  fs.writeFile("produto.json", jsonRespostaFinal, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Arquivo salvo com sucesso!");
    }
  });
});
