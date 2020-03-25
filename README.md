# The PageWatcher
## Reason
Make it easy to watch / subscribe to web pages for changes. Intended for simple „static” or „static-like” websites (will not execute JS code, render the page, watch for changes in externally included files which don't change their address, will not monitor AJAX responses etc.). Useful for seeing when the results at a contest are published, a limited-time offer is activated, a price is updated, a time-restricted form is enabled etc.
## Requirements
- NodeJS & NPM
- MySQL / MariaDB Server
## Installation and configuration
1. `git clone https://github.com/BodoMinea/pagewatcher.git`
2. `cd pagewatcher`
4. `npm install`
5. Create a database on your MySQL server and import pagewatcher.sql - You can use PHPMyAdmin import for this task or equivalent command-line utilities.
4. In `conf/pw.json`, set your database credentials (mysqldb).
6. In the same config file, populate the users array with username-password pairs, which you'll use to access the app.
7. Set a port and host in the server block of the config file. Default port 5823 is random enough to work fine. Host parameter is needed only for linking to this instance on email and/or SMS and is not used to bind to network interfaces.
8. Configure your email transport and to/from addresses. Transport parameters are to be set as instructed in the Nodemailer docs - https://nodemailer.com/smtp/ or https://nodemailer.com/usage/using-gmail/
9. Configure webhooks if you want. paramName is put with & at the end of the URL and populated with the alert message. Set includeUrl to true to include a link in the webhook message. Webhooks are great to notify a Slack group of a page change, blink your Sonoff-connected lights or send an SMS text message to your phone - which is actually how I use it. It works like a charm with the https://github.com/hetmann/node-sms-server project, calling it by GET request - and that uses the Gammu utility and a huawei e220 modem hooked up to a Raspberry Pi.
10. Run... Profit¿ `node index.js` and point your browser to `http://localhost:5823` or whatever your port is set to.
## Recommendations
To run this on the long term, I suggest you daemonize it with Forever - https://www.npmjs.com/package/forever. Nodemon or putting it in a screen probably work as well but may be less fault tolerant.
## To Do
- complete syshooks implementation (run commands)
- complete webhooks implementation and make it more robust - support POST, determine if it's the last parameter in the URL for GET requests (decide if appending should use ? or &)
- keep a history of page changes
- store webhook responses
- user levels, groups, with separation and permissions
- limit alert frequency per channel (especially SMS)
- make strings / message contents easily customizable/parametrizable/translatable

*You're welcome to contribute by Pull Request*
