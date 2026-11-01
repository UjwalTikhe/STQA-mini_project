const {By,Key,Builder} = require("selenium-webdriver");
require("chromedriver");

// login and goto order tracking page
async function example(){
 
       var username = "Yogesh";
       var password = "8329097855";
 
       //To wait for browser to build and launch properly
       let driver = await new Builder().forBrowser("chrome").build();
 
        await driver.get("http://127.0.0.1:5501/login.html");

        // page title
        var title = await driver.getTitle();
        console.log('On Page:',title);
  
        // display credentials
        console.log('Username:',username);
        console.log('Password:',password);

        await driver.findElement(By.id("username")).sendKeys(username);
        await driver.findElement(By.id("password")).sendKeys(password,Key.RETURN);
		
        // Capturing alert message.    
        var alertMessage = await driver.switchTo().alert().getText();		

        // Displaying alert message		
        console.log(alertMessage);
        // accept the alert message
        driver.switchTo().alert().accept();
 
        // page title
        var title = await driver.getTitle();
        console.log('On Page:',title);

        await driver.findElement(By.className("cart-link")).click();

        // page title
        var title = await driver.getTitle();
        console.log('On Page:',title);

        // check if cart is already empty
        try {                
                // delete product
                await driver.findElement(By.className("js-delete-link")).click();
                
                // Capturing alert message.    
                var alertMessage = await driver.switchTo().alert().getText();		

                // Displaying alert message		
                console.log(alertMessage);
                // accept the alert message
                driver.switchTo().alert().accept();

        } catch (NoSuchElementError) {
                console.log('Cart is Empty');
                console.log('No product to remove from cart'); 
        }
        
        // Close the browser after execution
        // await driver.quit();
 
}

example()