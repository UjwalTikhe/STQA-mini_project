const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

async function capture() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--window-size=1280,800');
  options.addArguments('--disable-gpu');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const outDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const artifactDir = 'C:\\Users\\ujwal\\.gemini\\antigravity\\brain\\85ae3786-32b8-4d0d-a53c-7a4dc156c61d\\screenshots';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  async function takeScreenshot(name) {
    const data = await driver.takeScreenshot();
    const filePath = path.join(outDir, name);
    fs.writeFileSync(filePath, data, 'base64');
    const artifactPath = path.join(artifactDir, name);
    fs.writeFileSync(artifactPath, data, 'base64');
    console.log(`Saved screenshot: ${name}`);
  }

  try {
    // 1. Login Page
    await driver.get('http://127.0.0.1:5501/login.html');
    await driver.sleep(500);
    await takeScreenshot('01_login_page.png');

    // 2. Login Form with Inputs
    await driver.findElement(By.id('username')).sendKeys('Yogesh');
    await driver.findElement(By.id('password')).sendKeys('8329097855');
    await takeScreenshot('02_login_filled.png');

    // 3. Homepage (Products Catalog)
    await driver.get('http://127.0.0.1:5501/amazon.html');
    await driver.sleep(1000); // allow dynamic product grid to render
    await takeScreenshot('03_homepage_catalog.png');

    // Add item to cart
    const addBtns = await driver.findElements(By.css('.js-add-to-cart'));
    if (addBtns.length > 0) {
      await addBtns[0].click();
      await driver.sleep(500);
    }
    await takeScreenshot('04_homepage_cart_updated.png');

    // 4. Checkout Page
    await driver.get('http://127.0.0.1:5501/checkout.html');
    await driver.sleep(1000);
    await takeScreenshot('05_checkout_page.png');

    // 5. User Address Details Page
    await driver.get('http://127.0.0.1:5501/user_details.html');
    await driver.sleep(500);
    await driver.findElement(By.id('address')).sendKeys('123 Innovation Way, Tech Park');
    await driver.findElement(By.id('country')).sendKeys('United States');
    await driver.findElement(By.id('city')).sendKeys('San Jose');
    await driver.findElement(By.id('zipcode')).sendKeys('95134');
    await takeScreenshot('06_user_details_address.png');

    // 6. Payment Page
    await driver.get('http://127.0.0.1:5501/payments.html');
    await driver.sleep(500);
    await driver.findElement(By.id('card-number')).sendKeys('4532789012345678');
    await driver.findElement(By.id('expiration-date')).sendKeys('12/28');
    await driver.findElement(By.id('cvv')).sendKeys('482');
    await takeScreenshot('07_payments_page.png');

    // 7. Orders Page
    await driver.get('http://127.0.0.1:5501/orders.html');
    await driver.sleep(1000);
    await takeScreenshot('08_orders_page.png');

    // 8. Tracking Page
    await driver.get('http://127.0.0.1:5501/tracking.html');
    await driver.sleep(1000);
    await takeScreenshot('09_tracking_page.png');

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error taking screenshots:', err);
  } finally {
    await driver.quit();
  }
}

capture();
