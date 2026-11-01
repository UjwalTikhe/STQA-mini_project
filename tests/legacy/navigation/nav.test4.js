const { By, Key, Builder } = require("selenium-webdriver");
require("chromedriver");

// go to orders page and click on basketball image -> goes to basketball page

async function example() {
  var username = "Yogesh";
  var password = "8329097855";

  let driver = await new Builder().forBrowser("chrome").build();

  await driver.get("http://127.0.0.1:5501/login.html");

  var title = await driver.getTitle();
  console.log('On page:', title);

  console.log('Username:', username);
  console.log('Password:', password);

  await driver.findElement(By.id("username")).sendKeys(username);
  await driver.findElement(By.id("password")).sendKeys(password, Key.RETURN);

  var alertMessage = await driver.switchTo().alert().getText();
  console.log(alertMessage);
  driver.switchTo().alert().accept();

  var title = await driver.getTitle();
  console.log('On page:', title);

  // After login, navigate to the orders.html page
  await driver.findElement(By.className("returns-orders-text")).click();

  var title = await driver.getTitle();
  console.log('On page:', title);

  await driver.findElement(By.id("prod-img-3")).click();

}
example()