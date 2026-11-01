const {By,Key,Builder} = require("selenium-webdriver");
require("chromedriver");
 
async function testUjwalLogin(){
 
       var username = "ujwaltikhe30@gmail.com";
       var password = "ootu@420";
 
       let driver = await new Builder().forBrowser("chrome").build();
 
       try {
           await driver.get("http://127.0.0.1:5501/login.html");

           var title = await driver.getTitle();
           console.log('On page:', title);
           console.log('Testing with credentials:');
           console.log('Username:', username);
           console.log('Password:', password);
               
           await driver.findElement(By.id("username")).sendKeys(username);
           await driver.findElement(By.id("password")).sendKeys(password, Key.RETURN);
           
           // Capturing alert message
           var alertMessage = await driver.switchTo().alert().getText();
           console.log('Alert received:', alertMessage);

           if (alertMessage.includes('Welcome to Amazon') && alertMessage.includes(username)) {
               console.log('SUCCESS: Login verified for', username);
           } else {
               console.log('FAILED: Unexpected alert message');
           }

           await driver.switchTo().alert().accept();
       } finally {
           await driver.quit();
       }
}
 
testUjwalLogin();
