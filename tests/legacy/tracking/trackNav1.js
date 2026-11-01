const { By, Key, Builder } = require("selenium-webdriver");
require("chromedriver");

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
  await driver.get("http://127.0.0.1:5501/orders.html");

  var title = await driver.getTitle();
  console.log('On page:', title);
  
  console.log('Click: basketball image');
  await driver.findElement(By.id("prod-img-3")).click();

  var title = await driver.getTitle();
  console.log('On page:', title);  

  // Close the browser after execution
  // await driver.quit();
}

example();

