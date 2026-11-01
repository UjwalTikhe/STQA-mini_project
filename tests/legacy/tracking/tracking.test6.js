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

  var prodNameOrderPage = await driver.findElement(By.className("prod-3")).getText();
  console.log('Product:',prodNameOrderPage);

  let btnClicked = await driver.findElement(By.id("product-3")).getText();
  console.log('Button clicked:', btnClicked);
  await driver.findElement(By.id("product-3")).click();

  var title = await driver.getTitle();
  console.log('On page:', title);  

  // Automatically fill the address, city, country, and zipcode fields
  await driver.findElement(By.id("address")).sendKeys("123 Main St");
  await driver.findElement(By.id("city")).sendKeys("Example City");
  await driver.findElement(By.id("country")).sendKeys("United States");
  await driver.findElement(By.id("zipcode")).sendKeys("12345"); 

  await driver.get("http://127.0.0.1:5501/payments.html");
  var title = await driver.getTitle();
  console.log('On page:', title); 

  await driver.findElement(By.id("card-number")).sendKeys("1111222233334444");
  await driver.findElement(By.id("expiration-date")).sendKeys("03/28");
  await driver.findElement(By.id("cvv")).sendKeys("205");
  await driver.findElement(By.id("proceed-button")).sendKeys(Key.RETURN);

  var alertMessage = await driver.switchTo().alert().getText();
  console.log(alertMessage);
  driver.switchTo().alert().accept();

  // Close the browser after execution
  // await driver.quit();
}

example();

