# About the Project #
The objective of this project is to create an enhanced video conferencing environment for remote participatory design. The video conferencing environment should be able to interface with different devices in the user's vicinity (e.g. printers, projectors).

# Installation Instructions #
- Installed node js latest version from [nodejs.org](https://nodejs.org/en/download/)
- Install postgres SQL from [postgresql.org](https://www.postgresql.org/download/). If using Homebrew, simply run `brew install postresql` to install and then `brew services start postgresql` to get it up and running. Make sure you can connect to the postgres server by using the `psql` command in terminal. If not, make sure the path to the postgres binaries is in your system PATH environment variable.
- For creating video calls, we use a Zoom account along with the Zoom WebSDK. Create an account with [Zoom](https://zoom.us/). In the Zoom marketplace follow [these instructions](https://marketplace.zoom.us/docs/guides/getting-started/app-types/create-jwt-app) to create a JWT type app. Copy the API secret and key.
- Clone this repository on your local machine. Inside the ParticipateInRemoteDesign folder create a file named '.env'. I've created an example file named '.env.example' as a template for this. Application will not run correctly if the file name isn't changed. Fill in the API_KEY and API_SECRET values from your Zoom account.
- Create a separate user and database for the app on psql. In the database, type `\i models/initialize_db.sql` to run the ParticipateInRemoteDesign/models/initialize_db.sql file. It will create a table called meeting_logs and insert some example records in the table. Copy the psql user name, db name, password, and port. Default values for these variables can be found [here](https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/). Fill these values into your '.env' file. HOST is just localhost since you're hosting the database on your local machine.

# Instructions to run the app #
- Open a terminal/cmd/powershell window. Change directory to the ParticipateInRemoteDesign folder.
- First use the `npm install` command to install the required modules.
- To start the app use the `nodemon server` command. Nodemon will immediately restart the app when you make any changes to the code.
- Open a browser window and go to localhost:3000 to view the app (default address).

# Tutorials used #
- [Build your first local server and web app with Node.js](https://hackernoon.com/build-your-first-local-server-and-web-app-with-node-js-5a5d9e00aff0) by @carstens.christoph on [hackernoon](https://hackernoon.com/). This will go through installing Node JS on your computer and create a simple webapp. At the end of this you'll know how to get an app running on your computer that shows an index page, very basic.
- [Integrate Zoom Web SDK](https://marketplace.zoom.us/docs/sdk/native-sdks/web/getting-started/integrate#local) into NodeJS apps
- Basic working NodeJS app with an index page. Got the gitignore file from https://github.com/github/gitignore/blob/master/Node.gitignore
- Webpack's [Getting Started](https://webpack.js.org/guides/getting-started/) Docs. Zoom's sample code used webpack as the bundler. Going through the getting started docs will give you an idea of what a bundler does and why that's useful. Its almost another tutorial for how to build an app using NodeJS and webpack.
- Connecting to a database with NodeJS: I'm using postgres (referring this [tutorial](https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/)) instead of a NoSQL db like mongodb. I'm familiar with both. Chose postgres randomly.
- Creating rooms for users using [socket.io](https://socket.io/docs/rooms-and-namespaces/): I'm using this to allow a user trigger events on another user's browser.
