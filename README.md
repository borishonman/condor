Condor - A simple task management engine
Copyright 2017 Justin Byers

# REQUIREMENTS:
     1. node.js (works with legacy node and new node)

# INSTALLATION:
     1. Verify which version of node you have (legacy or new). If the command nodejs exists, you have the new version. If the command node exists, you have the legacy version.
     2. Edit the config.json in app/config/config.json (see configuration section)
     3. Change to the condor root directory and run the install script based on which version of node you have:
          * (legacy) - npm run-script installlegacy
          * (new) - npm run-script install
     4. Follow the installation prompts
     5. Done!

# RUNNING:
     * (legacy) - npm run-script startlegacy
     * (new) - npm start

# CONFIGURATION: The following sections and options are valid
     * server - server configuration
          * host: the URL that Condor will be accessed from
          * https: listen for HTTPS connections (true/false)
          * http: listen for HTTP connections (true/false)
          * https_port: port on which to listen for HTTPS connections
          * http_port: port on which to listen for HTTP connections
          * http_forward: 301 Redirect all HTTP requests to HTTPS
          * ssl_key: absolute path to the HTTPS SSL key
          * ssl_cert: absolute path to the HTTPS SSL cert
     * database - MySQL database configuration
          * connector: does nothing lol
          * host: host of the MySQL database server
          * database: the database name to use
          * user: username to log into MySQL
          * password: password to log into MySQL
          * prefix: prefix all table names with this
     * mattermost
          * host: host of the mattermost server to connect to
          * user: username for the condor bot user
          * pass: password for the condor bot user
     * misc
          * adminseeall: admins will see all projects in the sidebar
     * notifications - what notifications will be enabled
          * disableall - no notifications will be sent if true
          * userassignedtask - send a notification when a user is assigned a task
          * useraddedtoproject - send a notification when a user is added to a project
          * taskduedatechanged - send a notification to the assigned user when a task's due date is changed
          * taskdescchanged - send a notification to the assigned user when a task's description is changed
