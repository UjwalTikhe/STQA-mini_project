const {By,Key,Builder} = require("selenium-webdriver");
require("chromedriver");

// prevent access to homepage when not logged in
async function example(){

       //To wait for browser to build and launch properly
       let driver = await new Builder().forBrowser("chrome").build();
 
        await driver.get("http://127.0.0.1:5501/login.html");

        // page title
        var title = await driver.getTitle();
        console.log('On Page:',title);
            
        await driver.findElement(By.id("orders-link")).click();

        try {             
            // Capturing alert message.    
            var alertMessage = await driver.switchTo().alert().getText();		

            // Displaying alert message		
            console.log(alertMessage);
            // accept the alert message
            driver.switchTo().alert().accept();

    }
    catch (NoSuchAlertError) {
            // page title
            var title = await driver.getTitle();
            console.log('On Page:',title);
    }
 
        // Close the browser after execution
        // await driver.quit();
 
}
 
example()